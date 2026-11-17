"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Handshake,
  Mail,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import {
  Avatar,
  btnPerigo,
  btnPrimario,
  btnSecundario,
  campo,
  dataHora,
  nomeHackathon,
  rotulo,
  SituacaoBadge,
  useHackathonsDaOrganizacao,
} from "@/components/mentores/ui";
import { ApiError, type HackathonResponse } from "@/lib/api";
import {
  mentoresAdmin,
  ROTULO_STATUS_EMAIL,
  situacaoMentor,
  type ConviteMentorAdmin,
  type EquipeAcompanhada,
  type Mentor,
  type MentorEditar,
  type SituacaoMentor,
} from "@/lib/api-mentores";
import { useSession } from "@/lib/useSession";

type Filtro = "TODOS" | SituacaoMentor;
const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "TODOS", rotulo: "Todos" },
  { id: "ATIVO", rotulo: "Ativos" },
  { id: "AGUARDANDO", rotulo: "Aguardando ativação" },
  { id: "DESATIVADO", rotulo: "Desativados" },
];

const FORM_VAZIO = { nome: "", email: "", empresa_parceira: "", area_atuacao: "", max_equipes: "2", hackathon_id: "" };

const nomeDe = (m: Mentor) => m.nome || m.email;

function SeletorHackathon({
  id,
  valor,
  onChange,
  lista,
}: {
  id: string;
  valor: string;
  onChange: (v: string) => void;
  lista: HackathonResponse[] | null;
}) {
  return (
    <select id={id} required className={campo} value={valor} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        {lista === null ? "Carregando..." : lista.length ? "Escolha o hackathon" : "Nenhum hackathon cadastrado"}
      </option>
      {(lista ?? []).map((h) => (
        <option key={h.id} value={h.id}>
          {h.nome || "Sem nome"}
          {h.status === "RASCUNHO" ? " (rascunho)" : ""}
        </option>
      ))}
    </select>
  );
}

/* ───────────────────────────── Cadastro ───────────────────────────── */

function NovoMentor({
  hackathons,
  onCriado,
  onCancelar,
}: {
  hackathons: HackathonResponse[] | null;
  onCriado: (m: Mentor) => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const fields = erro instanceof ApiError ? erro.fields : {};

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const m = await mentoresAdmin.cadastrar({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        empresa_parceira: form.empresa_parceira.trim(),
        area_atuacao: form.area_atuacao.trim(),
        max_equipes: Number(form.max_equipes),
        hackathon_id: form.hackathon_id,
      });
      onCriado(m);
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  const set = (k: keyof typeof FORM_VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6" aria-labelledby="titulo-novo">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="titulo-novo" className="text-xl font-bold text-gray-900">Novo mentor</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            A pessoa recebe um e-mail com o link de ativação: ela mesma confere os dados, cria a senha e aceita
            o regulamento e o termo de consentimento do hackathon escolhido. Até lá a conta fica aguardando e
            não entra na plataforma.
          </p>
        </div>
        <button type="button" onClick={onCancelar} aria-label="Fechar" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer">
          <X className="h-5 w-5" />
        </button>
      </div>

      {erro !== null && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        </div>
      )}

      <form onSubmit={enviar} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="n-nome" className={rotulo}>Nome completo</label>
          <input id="n-nome" required maxLength={255} className={campo} value={form.nome} onChange={set("nome")} />
          {fields.nome && <p className="mt-1 text-xs text-red-600">{fields.nome}</p>}
        </div>
        <div>
          <label htmlFor="n-email" className={rotulo}>E-mail</label>
          <input id="n-email" type="email" required className={campo} value={form.email} onChange={set("email")} />
          {fields.email && <p className="mt-1 text-xs text-red-600">{fields.email}</p>}
        </div>
        <div>
          <label htmlFor="n-empresa" className={rotulo}>Empresa de origem</label>
          <input id="n-empresa" required maxLength={255} className={campo} value={form.empresa_parceira} onChange={set("empresa_parceira")} />
        </div>
        <div>
          <label htmlFor="n-area" className={rotulo}>Área de atuação</label>
          <input id="n-area" required maxLength={255} placeholder="Ex.: Ciência de dados" className={campo} value={form.area_atuacao} onChange={set("area_atuacao")} />
        </div>
        <div>
          <label htmlFor="n-max" className={rotulo}>Quantas equipes pode acompanhar</label>
          <input id="n-max" type="number" required min={1} max={32767} step={1} className={campo} value={form.max_equipes} onChange={set("max_equipes")} />
          <p className="mt-1 text-[11px] text-gray-500">Somando todos os hackathons.</p>
        </div>
        <div>
          <label htmlFor="n-hack" className={rotulo}>Hackathon do convite</label>
          <SeletorHackathon id="n-hack" valor={form.hackathon_id} onChange={(v) => setForm({ ...form, hackathon_id: v })} lista={hackathons} />
          <p className="mt-1 text-[11px] text-gray-500">Precisa ter regulamento e termo de consentimento publicados.</p>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={enviando || !form.hackathon_id} className={btnPrimario}>
            <Send className="h-4 w-4" aria-hidden="true" /> {enviando ? "Cadastrando..." : "Cadastrar e enviar convite"}
          </button>
          <button type="button" onClick={onCancelar} className={btnSecundario}>Cancelar</button>
        </div>
      </form>
    </section>
  );
}

/* ───────────────────────────── Detalhe ───────────────────────────── */

type Painel = null | "editar" | "convite" | "ativar" | "desativar";

function DetalheMentor({
  mentor,
  hackathons,
  onAtualizado,
}: {
  mentor: Mentor;
  hackathons: HackathonResponse[] | null;
  onAtualizado: (m: Mentor, mensagem: string) => void;
}) {
  const situacao = situacaoMentor(mentor);
  const [painel, setPainel] = useState<Painel>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const [hackathonId, setHackathonId] = useState("");
  const [form, setForm] = useState({
    nome: mentor.nome ?? "",
    email: mentor.email,
    empresa_parceira: mentor.empresa_parceira ?? "",
    area_atuacao: mentor.area_atuacao ?? "",
    max_equipes: String(mentor.max_equipes ?? 1),
  });
  const [equipes, setEquipes] = useState<EquipeAcompanhada[] | null>(null);
  const [incluirEncerradas, setIncluirEncerradas] = useState(false);
  const [convites, setConvites] = useState<ConviteMentorAdmin[] | null>(null);

  const carregarExtras = useCallback(() => {
    mentoresAdmin
      .equipes(mentor.id, { apenas_vigentes: !incluirEncerradas, limite: 100 })
      .then(setEquipes)
      .catch(() => setEquipes([]));
    mentoresAdmin
      .convites(mentor.id, { limite: 20 })
      .then(setConvites)
      .catch(() => setConvites([]));
  }, [mentor.id, incluirEncerradas]);

  useEffect(() => {
    carregarExtras();
  }, [carregarExtras]);

  const abrir = (p: Painel) => {
    setPainel(painel === p ? null : p);
    setErro(null);
  };

  const executar = async (acao: () => Promise<Mentor>, mensagem: string) => {
    setEnviando(true);
    setErro(null);
    try {
      const m = await acao();
      setPainel(null);
      setHackathonId("");
      onAtualizado(m, mensagem);
      carregarExtras();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  };

  const emailMudou = form.email.trim().toLowerCase() !== mentor.email.toLowerCase();

  const salvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    const dados: MentorEditar = {};
    if (form.nome.trim() !== (mentor.nome ?? "")) dados.nome = form.nome.trim();
    if (form.empresa_parceira.trim() !== (mentor.empresa_parceira ?? "")) dados.empresa_parceira = form.empresa_parceira.trim();
    if (form.area_atuacao.trim() !== (mentor.area_atuacao ?? "")) dados.area_atuacao = form.area_atuacao.trim();
    if (Number(form.max_equipes) !== mentor.max_equipes) dados.max_equipes = Number(form.max_equipes);
    if (emailMudou) {
      dados.email = form.email.trim().toLowerCase();
      dados.hackathon_id = hackathonId;
    }
    if (Object.keys(dados).length === 0) {
      setPainel(null);
      return;
    }
    executar(
      () => mentoresAdmin.editar(mentor.id, dados),
      emailMudou ? "Dados salvos. Um novo convite foi enviado ao e-mail atualizado." : "Dados do mentor salvos."
    );
  };

  const vigentes = (equipes ?? []).filter((e) => !e.atribuicao.encerrada_em).length;
  const pendencias = (convites ?? []).filter((c) => c.pendencia_administrativa).length;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6" aria-label={`Mentor ${nomeDe(mentor)}`}>
      {/* Identificação */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar nome={nomeDe(mentor)} grande />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{nomeDe(mentor)}</h2>
              <SituacaoBadge situacao={situacao} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {mentor.email}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
              <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
              {[mentor.empresa_parceira, mentor.area_atuacao].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-sm sm:text-right">
          <dt className="text-gray-500">Equipes</dt>
          <dd className="font-semibold text-gray-900">
            {equipes === null || incluirEncerradas ? "—" : vigentes} de {mentor.max_equipes ?? "—"}
          </dd>
          <dt className="text-gray-500">Cadastrado em</dt>
          <dd className="text-gray-900">{dataHora(mentor.criado_em)}</dd>
          <dt className="text-gray-500">Ativação</dt>
          <dd className="text-gray-900">{mentor.mentor_ativado_em ? dataHora(mentor.mentor_ativado_em) : "Pendente"}</dd>
        </dl>
      </div>

      {situacao === "AGUARDANDO" && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {convites !== null && !convites.some((c) => !c.encerrado_em && !c.cancelado_em && new Date(c.expira_em) > new Date())
            ? "Não há convite válido em aberto (foi cancelado ou venceu). Para a pessoa ativar a conta, envie um novo convite."
            : "Ainda não concluiu a ativação pelo link do e-mail. O link vale por tempo limitado; se ele venceu ou não chegou, envie um novo convite."}
        </p>
      )}
      {situacao === "DESATIVADO" && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <PowerOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Conta desativada: não entra na plataforma nem recebe novas equipes. As equipes que já acompanhava
          continuam vinculadas até você trocar ou encerrar a mentoria.
        </p>
      )}

      {/* Ações */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => abrir("editar")} aria-expanded={painel === "editar"} className={btnSecundario}>
          <Pencil className="h-4 w-4" aria-hidden="true" /> Editar dados
        </button>
        <button type="button" onClick={() => abrir("convite")} aria-expanded={painel === "convite"} className={btnSecundario}>
          <Send className="h-4 w-4" aria-hidden="true" /> {situacao === "AGUARDANDO" ? "Reenviar convite" : "Convidar para outro hackathon"}
        </button>
        {situacao === "DESATIVADO" && (
          <button type="button" onClick={() => abrir("ativar")} aria-expanded={painel === "ativar"} className={btnSecundario}>
            <Power className="h-4 w-4" aria-hidden="true" /> Reativar
          </button>
        )}
        {mentor.ativo && (
          <button type="button" onClick={() => abrir("desativar")} aria-expanded={painel === "desativar"} className={btnPerigo}>
            <PowerOff className="h-4 w-4" aria-hidden="true" /> Desativar
          </button>
        )}
        {situacao === "AGUARDANDO" && (
          <button type="button" onClick={() => abrir("desativar")} aria-expanded={painel === "desativar"} className={btnPerigo}>
            <X className="h-4 w-4" aria-hidden="true" /> Cancelar convite
          </button>
        )}
      </div>

      {erro !== null && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        </div>
      )}

      {/* Painéis de ação */}
      {painel === "editar" && (
        <form onSubmit={salvarEdicao} className="mt-4 grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="e-nome" className={rotulo}>Nome</label>
            <input id="e-nome" required maxLength={255} className={campo} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label htmlFor="e-email" className={rotulo}>E-mail</label>
            <input id="e-email" type="email" required className={campo} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="e-empresa" className={rotulo}>Empresa de origem</label>
            <input id="e-empresa" required maxLength={255} className={campo} value={form.empresa_parceira} onChange={(e) => setForm({ ...form, empresa_parceira: e.target.value })} />
          </div>
          <div>
            <label htmlFor="e-area" className={rotulo}>Área de atuação</label>
            <input id="e-area" required maxLength={255} className={campo} value={form.area_atuacao} onChange={(e) => setForm({ ...form, area_atuacao: e.target.value })} />
          </div>
          <div>
            <label htmlFor="e-max" className={rotulo}>Quantas equipes pode acompanhar</label>
            <input id="e-max" type="number" required min={1} max={32767} className={campo} value={form.max_equipes} onChange={(e) => setForm({ ...form, max_equipes: e.target.value })} />
            <p className="mt-1 text-[11px] text-gray-500">Não pode ficar abaixo das equipes que já acompanha.</p>
          </div>
          {emailMudou && (
            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
                Trocar o e-mail encerra o acesso atual, apaga a senha e envia um novo convite para o endereço novo:
                a pessoa precisa ativar a conta de novo.
              </p>
              <label htmlFor="e-hack" className={`${rotulo} mt-3`}>Hackathon do novo convite</label>
              <SeletorHackathon id="e-hack" valor={hackathonId} onChange={setHackathonId} lista={hackathons} />
            </div>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={enviando || (emailMudou && !hackathonId)} className={btnPrimario}>
              {enviando ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setPainel(null)} className={btnSecundario}>Cancelar</button>
          </div>
        </form>
      )}

      {(painel === "convite" || painel === "ativar") && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (painel === "convite") {
              executar(() => mentoresAdmin.convidar(mentor.id, hackathonId), `Convite enviado para ${mentor.email}.`);
            } else {
              executar(() => mentoresAdmin.ativar(mentor.id, hackathonId), `${nomeDe(mentor)} foi reativado.`);
            }
          }}
          className="mt-4 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
        >
          <p className="text-sm text-gray-700">
            {painel === "convite"
              ? "Um novo link chega por e-mail para a pessoa aceitar os termos deste hackathon. Links anteriores do mesmo hackathon deixam de valer. Se a conta já está ativa, ela continua ativa."
              : "A reativação só funciona se o mentor já aceitou os termos vigentes deste hackathon. Se os termos mudaram, envie um convite: ele aceita e pode manter a senha."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="c-hack" className={rotulo}>Hackathon</label>
              <SeletorHackathon id="c-hack" valor={hackathonId} onChange={setHackathonId} lista={hackathons} />
            </div>
            <button type="submit" disabled={enviando || !hackathonId} className={btnPrimario}>
              {painel === "convite" ? <Send className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
              {enviando ? "Enviando..." : painel === "convite" ? "Enviar convite" : "Reativar"}
            </button>
          </div>
        </form>
      )}

      {painel === "desativar" && (
        <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm text-gray-800">
            {situacao === "AGUARDANDO"
              ? "O link de ativação enviado deixa de funcionar. Para convidar de novo depois, use \"Reenviar convite\"."
              : `${nomeDe(mentor)} perde o acesso e não pode receber novas equipes. Cadastro, senha e aceites são preservados; as equipes atuais continuam vinculadas até você trocar ou encerrar a mentoria.`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={() =>
                executar(
                  () => mentoresAdmin.desativar(mentor.id),
                  situacao === "AGUARDANDO" ? "Convite cancelado." : `${nomeDe(mentor)} foi desativado.`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {enviando ? "Salvando..." : situacao === "AGUARDANDO" ? "Cancelar convite" : "Confirmar desativação"}
            </button>
            <button type="button" onClick={() => setPainel(null)} className={btnSecundario}>Voltar</button>
          </div>
        </div>
      )}

      {/* Equipes acompanhadas */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="h-4 w-4 text-emerald-700" aria-hidden="true" /> Equipes acompanhadas
          </h3>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={incluirEncerradas} onChange={(e) => setIncluirEncerradas(e.target.checked)} className="accent-emerald-600" />
            Mostrar mentorias encerradas
          </label>
        </div>
        {equipes === null ? (
          <div className="h-16 animate-pulse rounded-2xl bg-gray-50" />
        ) : equipes.length === 0 ? (
          <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            Nenhuma equipe {incluirEncerradas ? "" : "no momento"}.{" "}
            <Link href="/admin/mentoria" className="font-semibold text-emerald-700 hover:underline">Atribuir equipes</Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {equipes.map(({ atribuicao: a, equipe_nome }) => (
              <li key={a.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{equipe_nome || "Equipe sem nome"}</p>
                  <p className="text-xs text-gray-500">{nomeHackathon(hackathons, a.hackathon_id)} · desde {dataHora(a.atribuido_em)}</p>
                </div>
                {a.encerrada_em ? (
                  <span className="text-xs text-gray-500">Encerrada em {dataHora(a.encerrada_em)}</span>
                ) : (
                  <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">Em andamento</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Convites */}
      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
          <Mail className="h-4 w-4 text-emerald-700" aria-hidden="true" /> Convites enviados
          {pendencias > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              {pendencias} {pendencias === 1 ? "precisa" : "precisam"} de atenção
            </span>
          )}
        </h3>
        {convites === null ? (
          <div className="h-16 animate-pulse rounded-2xl bg-gray-50" />
        ) : convites.length === 0 ? (
          <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Nenhum convite registrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Hackathon</th>
                  <th className="px-3 py-2 font-semibold">Enviado em</th>
                  <th className="px-3 py-2 font-semibold">E-mail</th>
                  <th className="px-3 py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {convites.map((c) => (
                  <tr key={c.id} className={c.pendencia_administrativa ? "bg-amber-50/60" : ""}>
                    <td className="px-3 py-2 text-gray-900">{nomeHackathon(hackathons, c.hackathon_id)}</td>
                    <td className="px-3 py-2 text-gray-700">{dataHora(c.criado_em)}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {c.cancelado_em
                        ? "Cancelado"
                        : c.status_email
                          ? ROTULO_STATUS_EMAIL[c.status_email]
                          : c.email_enfileirado
                            ? "Na fila"
                            : "Não enviado"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {c.pendencia_administrativa ? (
                        <span className="font-semibold text-amber-800">
                          {new Date(c.expira_em) < new Date() ? "Venceu sem uso: envie outro" : "Falhou: envie outro"}
                        </span>
                      ) : c.encerrado_em ? (
                        `Encerrado em ${dataHora(c.encerrado_em)}`
                      ) : (
                        `Vale até ${dataHora(c.expira_em)}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────── Página ───────────────────────────── */

export default function AdminMentoresPage() {
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const hackathons = useHackathonsDaOrganizacao(user);
  const [lista, setLista] = useState<Mentor[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  const carregar = useCallback(
    () =>
      mentoresAdmin
        .listarTodos()
        .then((l) => {
          l.sort((a, b) => nomeDe(a).localeCompare(nomeDe(b), "pt-BR"));
          setLista(l);
          const pedido = new URLSearchParams(window.location.search).get("mentor");
          setSelecionadoId((sel) => sel ?? (pedido && l.some((m) => m.id === pedido) ? pedido : l[0]?.id ?? null));
        })
        .catch((e: unknown) => {
          setErro(e);
          setLista([]);
        }),
    []
  );

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const contagem = useMemo(() => {
    const c: Record<Filtro, number> = { TODOS: 0, ATIVO: 0, AGUARDANDO: 0, DESATIVADO: 0 };
    for (const m of lista ?? []) {
      c.TODOS++;
      c[situacaoMentor(m)]++;
    }
    return c;
  }, [lista]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (lista ?? []).filter(
      (m) =>
        (filtro === "TODOS" || situacaoMentor(m) === filtro) &&
        (!termo || [m.nome, m.email, m.empresa_parceira, m.area_atuacao].some((v) => v?.toLowerCase().includes(termo)))
    );
  }, [lista, filtro, busca]);

  const selecionado = visiveis.find((m) => m.id === selecionadoId) ?? visiveis[0] ?? null;

  if (!pronto) return null;

  const atualizar = (m: Mentor, texto: string) => {
    setLista((l) => (l ?? []).map((x) => (x.id === m.id ? m : x)));
    setMensagem(texto);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
            <Handshake className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Mentores</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-600">
              Cadastre profissionais que vão acompanhar as equipes aprovadas. Cada mentor ativa a própria conta pelo
              link do e-mail e aceita os termos do hackathon.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button type="button" onClick={() => carregar()} className={btnSecundario}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
          <Link href="/admin/mentoria" className={btnSecundario}>
            <Users className="h-4 w-4" aria-hidden="true" /> Atribuir às equipes
          </Link>
          <button
            type="button"
            onClick={() => {
              setCriando(true);
              setMensagem(null);
            }}
            className={btnPrimario}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Novo mentor
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Situação" className="inline-flex flex-wrap rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                filtro === f.id ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {f.rotulo}
              {lista && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    filtro === f.id
                      ? "bg-white/25 text-white"
                      : f.id === "AGUARDANDO" && contagem.AGUARDANDO
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {contagem[f.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="relative">
          <span className="sr-only">Buscar mentor</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, empresa ou área"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none lg:w-80"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {mensagem && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {mensagem}
          </p>
        )}
        {erro !== null && <ApiErrorAlert erro={erro} onRetry={() => { setErro(null); carregar(); }} onClose={() => setErro(null)} />}
      </div>

      {lista === null ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[22rem_1fr]">
          {/* Lista */}
          <div className="rounded-3xl border border-gray-200 bg-white p-3">
            {visiveis.length === 0 ? (
              <div className="p-6 text-center">
                <Handshake className="mx-auto h-10 w-10 text-emerald-300" aria-hidden="true" />
                <p className="mt-3 font-bold text-gray-900">
                  {lista.length === 0 ? "Nenhum mentor ainda" : "Nada encontrado"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {lista.length === 0 ? "Cadastre o primeiro em \"Novo mentor\"." : "Tente outra busca ou outro filtro."}
                </p>
              </div>
            ) : (
              <ul className="max-h-[75vh] space-y-1 overflow-y-auto" aria-label="Mentores">
                {visiveis.map((m) => {
                  const ativo = !criando && selecionado?.id === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelecionadoId(m.id);
                          setCriando(false);
                        }}
                        aria-current={ativo}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors cursor-pointer ${
                          ativo ? "bg-emerald-50 ring-2 ring-emerald-500" : "hover:bg-gray-50"
                        }`}
                      >
                        <Avatar nome={nomeDe(m)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-gray-900">{nomeDe(m)}</span>
                          <span className="block truncate text-xs text-gray-500">
                            {[m.empresa_parceira, m.area_atuacao].filter(Boolean).join(" · ") || m.email}
                          </span>
                        </span>
                        <SituacaoBadge situacao={situacaoMentor(m)} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Detalhe / cadastro */}
          {criando ? (
            <NovoMentor
              hackathons={hackathons}
              onCancelar={() => setCriando(false)}
              onCriado={(m) => {
                setLista((l) => [m, ...(l ?? [])]);
                setSelecionadoId(m.id);
                setFiltro("TODOS");
                setCriando(false);
                setMensagem(`${nomeDe(m)} cadastrado. O convite de ativação foi enviado para ${m.email}.`);
              }}
            />
          ) : selecionado ? (
            <DetalheMentor key={selecionado.id} mentor={selecionado} hackathons={hackathons} onAtualizado={atualizar} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <Handshake className="h-12 w-12 text-emerald-300" aria-hidden="true" />
              <p className="mt-3 text-lg font-bold text-gray-900">Monte seu time de mentores</p>
              <p className="mt-1 max-w-md text-sm text-gray-600">
                Mentores orientam as equipes com proposta aprovada. Cadastre nome, empresa, área e quantas equipes cada
                um pode acompanhar.
              </p>
              <button type="button" onClick={() => setCriando(true)} className={`${btnPrimario} mt-5`}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Novo mentor
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
