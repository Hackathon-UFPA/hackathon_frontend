"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  admin,
  ApiError,
  hackathons as hackathonsApi,
  termos as termosApi,
  type HackathonDados,
  type HackathonResponse,
  type StatusHackathon,
  type Termo,
} from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { ROTULO_STATUS } from "@/components/plataforma/hackathon-util";
import { Check, EyeOff, Globe, Rocket, X } from "lucide-react";

/**
 * Gestão das edições da organização (somente Organizador ou DEV, regra da API).
 * Usa GET/POST/PATCH /admin/hackathons. Os termos são publicados em /admin/termos.
 */

const STATUS: { valor: StatusHackathon; rotulo: string }[] = [
  { valor: "RASCUNHO", rotulo: "Rascunho" },
  { valor: "INSCRICOES", rotulo: "Inscrições abertas" },
  { valor: "INSCRICOES_ENCERRADAS", rotulo: "Inscrições encerradas" },
  { valor: "ATIVO", rotulo: "Ativo" },
  { valor: "EM_AVALIACAO", rotulo: "Em avaliação" },
  { valor: "FINALIZADO", rotulo: "Finalizado" },
  { valor: "CANCELADO", rotulo: "Cancelado" },
];

const CAMPOS_DATA = [
  { campo: "inscricoes_inicio", rotulo: "Início das inscrições" },
  { campo: "inscricoes_fim", rotulo: "Fim das inscrições" },
  { campo: "homologacao_fim", rotulo: "Fim da homologação" },
  { campo: "propostas_inicio", rotulo: "Início das propostas" },
  { campo: "propostas_fim", rotulo: "Fim das propostas" },
  { campo: "data_inicio", rotulo: "Início do evento" },
  { campo: "data_fim", rotulo: "Fim do evento" },
] as const;

type CampoData = (typeof CAMPOS_DATA)[number]["campo"];

type Form = {
  nome: string;
  tema: string;
  descricao: string;
  local: string;
  status: StatusHackathon;
  min_integrantes: string;
  max_integrantes: string;
  avaliadores_por_proposta: string;
} & Record<CampoData, string>;

const FORM_VAZIO: Form = {
  nome: "",
  tema: "",
  descricao: "",
  local: "",
  status: "RASCUNHO",
  min_integrantes: "3",
  max_integrantes: "5",
  avaliadores_por_proposta: "",
  inscricoes_inicio: "",
  inscricoes_fim: "",
  homologacao_fim: "",
  propostas_inicio: "",
  propostas_fim: "",
  data_inicio: "",
  data_fim: "",
};

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";

/** ISO (UTC) -> valor de <input type="datetime-local"> no fuso do navegador. */
function isoParaLocal(iso?: string | null): string {
  if (!iso) return "";
  // A API grava em UTC; se vier sem fuso, trata como UTC.
  const comFuso = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(comFuso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Valor de datetime-local (hora local) -> ISO em UTC, ou null se vazio. */
function localParaIso(valor: string): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function paraForm(h: HackathonResponse): Form {
  return {
    nome: h.nome ?? "",
    tema: h.tema ?? "",
    descricao: h.descricao ?? "",
    local: h.local ?? "",
    status: h.status ?? "INSCRICOES",
    min_integrantes: String(h.min_integrantes ?? 3),
    max_integrantes: String(h.max_integrantes ?? 5),
    avaliadores_por_proposta: h.avaliadores_por_proposta ? String(h.avaliadores_por_proposta) : "",
    inscricoes_inicio: isoParaLocal(h.inscricoes_inicio),
    inscricoes_fim: isoParaLocal(h.inscricoes_fim),
    homologacao_fim: isoParaLocal(h.homologacao_fim),
    propostas_inicio: isoParaLocal(h.propostas_inicio),
    propostas_fim: isoParaLocal(h.propostas_fim),
    data_inicio: isoParaLocal(h.data_inicio),
    data_fim: isoParaLocal(h.data_fim),
  };
}

function paraPayload(f: Form): HackathonDados {
  const dados: HackathonDados = {
    nome: f.nome.trim() || null,
    tema: f.tema.trim() || null,
    descricao: f.descricao.trim() || null,
    local: f.local.trim() || null,
    status: f.status,
    min_integrantes: Number(f.min_integrantes),
    max_integrantes: Number(f.max_integrantes),
    avaliadores_por_proposta: f.avaliadores_por_proposta ? Number(f.avaliadores_por_proposta) : null,
  };
  for (const { campo } of CAMPOS_DATA) dados[campo] = localParaIso(f[campo]);
  return dados;
}

const msgErro = (e: unknown) => {
  if (e instanceof ApiError && e.status === 403) {
    return "Somente o Organizador (ou DEV) pode criar e editar a edição.";
  }
  return e instanceof Error ? e.message : "Erro inesperado.";
};

export default function AdminHackathonPage() {
  return (
    <Suspense fallback={null}>
      <GerenciarHackathon />
    </Suspense>
  );
}

function GerenciarHackathon() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  // ?id=<hackathon> abre direto nele; ?novo=1 abre o formulário de nova edição
  const params = useSearchParams();
  const idDaUrl = params.get("id") ?? undefined;
  const novoDaUrl = params.get("novo") === "1";

  const [lista, setLista] = useState<HackathonResponse[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string>(""); // "" = nova edição
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [termosVigentes, setTermosVigentes] = useState<Termo[] | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (manterId?: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const edicoes = await hackathonsApi.daMinhaOrganizacao();
      setLista(edicoes);
      const alvo = manterId === "" ? undefined :
        edicoes.find((h) => h.id === manterId) ??
        edicoes.find((h) => h.status === "INSCRICOES") ??
        edicoes[0];
      if (alvo) {
        setSelecionadoId(alvo.id);
        setForm(paraForm(alvo));
      } else {
        setSelecionadoId("");
        setForm(FORM_VAZIO);
      }
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar(novoDaUrl ? "" : idDaUrl);
  }, [pronto, carregar, idDaUrl, novoDaUrl]);

  // Confere se a edição selecionada tem os termos vigentes (sem eles o cadastro responde 409).
  useEffect(() => {
    setTermosVigentes(null);
    if (!selecionadoId) return;
    let ativo = true;
    termosApi
      .vigentes(selecionadoId)
      .then((t) => ativo && setTermosVigentes(t))
      .catch(() => ativo && setTermosVigentes([]));
    return () => {
      ativo = false;
    };
  }, [selecionadoId]);

  const selecionar = (id: string) => {
    setMensagem(null);
    setErro(null);
    setSelecionadoId(id);
    const h = lista.find((x) => x.id === id);
    setForm(h ? paraForm(h) : FORM_VAZIO);
  };

  const set = (campo: keyof Form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  // Publicar = salvar o que está no formulário (para não perder edições) com status INSCRICOES
  const publicar = async () => {
    if (!selecionadoId) return;
    setSalvando(true);
    setMensagem(null);
    setErro(null);
    try {
      await admin.editarHackathon(selecionadoId, { ...paraPayload(form), status: "INSCRICOES" });
      setMensagem("Hackathon publicado! Ele já aparece no site e as inscrições estão abertas.");
      await carregar(selecionadoId);
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    setErro(null);
    try {
      const dados = paraPayload(form);
      const salvo = selecionadoId
        ? await admin.editarHackathon(selecionadoId, dados)
        : await admin.criarHackathon(dados);
      setMensagem(selecionadoId ? "Edição atualizada." : "Edição criada.");
      await carregar(salvo.id);
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  };

  if (!pronto) return null;

  const tiposVigentes = new Set((termosVigentes ?? []).map((t) => t.tipo));
  const termosOk = tiposVigentes.has("REGULAMENTO") && tiposVigentes.has("TERMO_CONSENTIMENTO");
  // Situação gravada (não a do formulário, que pode ter mudanças ainda não salvas)
  const gravado = lista.find((h) => h.id === selecionadoId);
  const ehRascunho = gravado?.status === "RASCUNHO";
  // Itens recomendados antes de publicar; nenhum é obrigatório para a API
  const checklist = [
    { ok: Boolean(form.nome.trim()), texto: "Nome do hackathon" },
    { ok: Boolean(form.descricao.trim()), texto: "Descrição para a página pública" },
    { ok: Boolean(form.inscricoes_inicio && form.inscricoes_fim), texto: "Período de inscrições" },
    { ok: Boolean(form.data_inicio), texto: "Data do evento" },
    { ok: termosOk, texto: "Regulamento e termo de consentimento publicados" },
  ];
  const pendentes = checklist.filter((c) => !c.ok).length;

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <Link href="/admin" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Gerenciar Edição do Hackathon</h1>
          <p className="text-xs text-gray-600">
            Datas no seu fuso horário; a API grava em UTC. Para encerrar uma edição com dados, use o status{" "}
            <span className="font-mono">CANCELADO</span>.
          </p>
        </div>

        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs">
            {mensagem}
          </div>
        )}
        {erro && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-xs">{erro}</div>
        )}

        {carregando ? (
          <p className="text-emerald-700 text-sm font-mono">Carregando edições...</p>
        ) : (
          <>
            <div>
              <label className={lbl} htmlFor="sel-edicao">
                Edição
              </label>
              <select id="sel-edicao" className={inp} value={selecionadoId} onChange={(e) => selecionar(e.target.value)}>
                {lista.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome || "Sem nome"} ({h.status ? ROTULO_STATUS[h.status] : "—"})
                  </option>
                ))}
                <option value="">+ Nova edição</option>
              </select>
            </div>

            {gravado && ehRascunho && (
              <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3" aria-labelledby="aviso-rascunho">
                <div className="flex gap-3">
                  <EyeOff className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
                  <div>
                    <h2 id="aviso-rascunho" className="text-sm font-bold text-amber-900">
                      Rascunho: este hackathon não aparece no site
                    </h2>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Só a equipe da sua organização consegue vê-lo. Quando estiver pronto, publique para
                      ele aparecer na vitrine e abrir as inscrições.
                    </p>
                  </div>
                </div>
                <ul className="grid gap-1.5 sm:grid-cols-2 pl-8">
                  {checklist.map((c) => (
                    <li key={c.texto} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-800" : "text-amber-800"}`}>
                      {c.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>
                        {c.texto}
                        <span className="sr-only">{c.ok ? " (pronto)" : " (pendente)"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 pl-8">
                  <button
                    type="button"
                    onClick={publicar}
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Rocket className="h-4 w-4" aria-hidden="true" />
                    {salvando ? "Publicando..." : "Publicar e abrir inscrições"}
                  </button>
                  <span className="text-[11px] text-amber-800">
                    {pendentes > 0
                      ? `${pendentes} ${pendentes === 1 ? "item recomendado está pendente" : "itens recomendados estão pendentes"}, mas já dá para publicar.`
                      : "Tudo pronto para publicar."}{" "}
                    Dá para voltar a rascunho depois, pelo campo Status.
                  </span>
                </div>
              </section>
            )}

            {gravado && !ehRascunho && (
              <p className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <Globe className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Publicado no site como <strong className="text-gray-900">{ROTULO_STATUS[gravado.status ?? "INSCRICOES"]}</strong>.
                <Link href={`/hackathons/${gravado.id}`} className="font-semibold text-emerald-700 hover:underline">
                  Ver página pública &rarr;
                </Link>
              </p>
            )}

            {selecionadoId && termosVigentes !== null && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  termosOk
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700"
                }`}
              >
                {termosOk
                  ? "Regulamento e termo de consentimento vigentes publicados."
                  : "Faltam termos vigentes (regulamento e/ou termo de consentimento). Sem eles os participantes não conseguem entrar em equipes."}{" "}
                <Link
                  href={`/admin/termos?hackathon_id=${encodeURIComponent(selecionadoId)}`}
                  className="font-bold underline"
                >
                  {termosOk ? "Gerenciar termos" : "Publicar termos"} &rarr;
                </Link>
                {" · "}
                <Link href={`/hackathons/${selecionadoId}`} className="font-bold underline">
                  Ver página pública &rarr;
                </Link>
              </div>
            )}

            <form onSubmit={salvar} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Nome</label>
                  <input className={inp} maxLength={255} value={form.nome} onChange={(e) => set("nome", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Tema geral da edição (só texto)</label>
                  <input className={inp} maxLength={255} value={form.tema} onChange={(e) => set("tema", e.target.value)} />
                  {selecionadoId && (
                    <Link
                      href={`/admin/temas?hackathon_id=${encodeURIComponent(selecionadoId)}`}
                      className="text-[11px] text-emerald-700 hover:underline mt-1 inline-block"
                    >
                      Temas que o participante escolhe na proposta &rarr;
                    </Link>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Descrição (aparece na página pública)</label>
                  <textarea
                    rows={4}
                    maxLength={5000}
                    className={inp}
                    value={form.descricao}
                    onChange={(e) => set("descricao", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Local</label>
                  <input
                    className={inp}
                    maxLength={255}
                    placeholder="Ex.: Belém, PA · On-line · Híbrido"
                    value={form.local}
                    onChange={(e) => set("local", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select
                    className={inp}
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as StatusHackathon)}
                  >
                    {STATUS.map((s) => (
                      <option key={s.valor} value={s.valor}>
                        {s.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Avaliadores por proposta</label>
                  <select
                    className={inp}
                    value={form.avaliadores_por_proposta}
                    onChange={(e) => set("avaliadores_por_proposta", e.target.value)}
                  >
                    <option value="">Não definido</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Mínimo de integrantes</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className={inp}
                    value={form.min_integrantes}
                    onChange={(e) => set("min_integrantes", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Máximo de integrantes</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className={inp}
                    value={form.max_integrantes}
                    onChange={(e) => set("max_integrantes", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CAMPOS_DATA.map(({ campo, rotulo }) => (
                  <div key={campo}>
                    <label className={lbl}>{rotulo}</label>
                    <input
                      type="datetime-local"
                      className={inp}
                      value={form[campo]}
                      onChange={(e) => set(campo, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer"
              >
                {salvando ? "Salvando..." : selecionadoId ? "Salvar alterações" : "Criar edição"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
