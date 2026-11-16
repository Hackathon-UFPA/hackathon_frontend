"use client";

import { useCallback, useEffect, useState } from "react";
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

/**
 * Gestão da edição (somente Organizador ou DEV, regra da API).
 * Usa POST/PATCH /admin/hackathons. A API não tem rota para publicar termos:
 * aqui só conferimos se o regulamento e o termo de consentimento vigentes existem.
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
  status: StatusHackathon;
  min_integrantes: string;
  max_integrantes: string;
  avaliadores_por_proposta: string;
} & Record<CampoData, string>;

const FORM_VAZIO: Form = {
  nome: "",
  tema: "",
  status: "INSCRICOES",
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
  "w-full bg-[#0A1110] border border-gray-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-[11px] uppercase text-gray-400 mb-1 font-semibold";

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
  const { pronto } = useSession(["ORGANIZADOR"]);

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
      const edicoes = await hackathonsApi.listar();
      setLista(edicoes);
      const alvo =
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
    if (pronto) carregar();
  }, [pronto, carregar]);

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

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-2xl bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-lg h-fit space-y-6">
        <Link href="/admin" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Gerenciar Edição do Hackathon</h1>
          <p className="text-xs text-gray-400">
            Datas no seu fuso horário; a API grava em UTC. Para encerrar uma edição com dados, use o status{" "}
            <span className="font-mono">CANCELADO</span>.
          </p>
        </div>

        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
            {mensagem}
          </div>
        )}
        {erro && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">{erro}</div>
        )}

        {carregando ? (
          <p className="text-emerald-400 text-sm font-mono">Carregando edições...</p>
        ) : (
          <>
            <div>
              <label className={lbl} htmlFor="sel-edicao">
                Edição
              </label>
              <select id="sel-edicao" className={inp} value={selecionadoId} onChange={(e) => selecionar(e.target.value)}>
                {lista.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome || "Sem nome"} ({h.status ?? "—"})
                  </option>
                ))}
                <option value="">+ Nova edição</option>
              </select>
            </div>

            {selecionadoId && termosVigentes !== null && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  termosOk
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                {termosOk
                  ? "Regulamento e termo de consentimento vigentes cadastrados."
                  : "Faltam termos vigentes (regulamento e/ou termo de consentimento). Sem eles o cadastro de participantes responde 409. A API não publica termos: eles precisam ser cadastrados no banco."}
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
                      className="text-[11px] text-emerald-400 hover:underline mt-1 inline-block"
                    >
                      Temas que o participante escolhe na proposta &rarr;
                    </Link>
                  )}
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
