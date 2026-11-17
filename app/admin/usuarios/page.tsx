"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MailCheck,
  MailWarning,
  Power,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { formatarDataBrasilia, type PapelUsuario } from "@/lib/api";
import {
  PAPEIS_DE_GESTAO,
  ROTULO_PAPEL,
  usuariosAdmin,
  type UsuarioAdmin,
  type UsuarioAdminUpdate,
} from "@/lib/api-admin";
import { useSession } from "@/lib/useSession";

const inp =
  "w-full rounded-xl border border-gray-300 bg-[#F6F9F8] px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none disabled:opacity-60";
const lbl = "mb-1 block text-[11px] font-semibold uppercase text-gray-600";

type Aba = "ativos" | "desativados" | "todos";
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "ativos", rotulo: "Ativos" },
  { id: "desativados", rotulo: "Desativados" },
  { id: "todos", rotulo: "Todos" },
];

const COR_PAPEL: Partial<Record<PapelUsuario, string>> = {
  ORGANIZADOR: "bg-emerald-100 text-emerald-800",
  COMITE_CIENTIFICO: "bg-sky-100 text-sky-800",
  COMITE_TECNICO: "bg-violet-100 text-violet-800",
  MENTOR: "bg-amber-100 text-amber-800",
};

const POR_PAGINA = 100;
const MAX_PAGINAS = 10;

function iniciais(nome: string) {
  return nome
    .split(/[\s@.]+/)
    .map((p) => p.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type Form = { nome: string; papel: PapelUsuario; instituicao: string; curso: string; periodo: string };
const paraForm = (u: UsuarioAdmin): Form => ({
  nome: u.nome ?? "",
  papel: u.papel,
  instituicao: u.instituicao ?? "",
  curso: u.curso ?? "",
  periodo: u.periodo ? String(u.periodo) : "",
});

export default function AdminUsuariosPage() {
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const [lista, setLista] = useState<UsuarioAdmin[] | null>(null);
  const [perfis, setPerfis] = useState<PapelUsuario[]>([]);
  const [aba, setAba] = useState<Aba>("ativos");
  const [filtroPapel, setFiltroPapel] = useState<PapelUsuario | "">("");
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  // A API pagina de 100 em 100; a equipe interna de uma organização cabe com folga.
  const carregar = useCallback(() => {
    const buscarDesde = (p: number, acumulado: UsuarioAdmin[]): Promise<UsuarioAdmin[]> =>
      usuariosAdmin.listar({ limite: POR_PAGINA, deslocamento: p * POR_PAGINA }).then((pagina) => {
        const todos = [...acumulado, ...pagina];
        return pagina.length < POR_PAGINA || p + 1 >= MAX_PAGINAS ? todos : buscarDesde(p + 1, todos);
      });
    return buscarDesde(0, [])
      .then(setLista)
      .catch((e: unknown) => {
        setErro(e);
        setLista((l) => l ?? []);
      });
  }, []);

  useEffect(() => {
    if (!pronto) return;
    carregar();
    usuariosAdmin
      .perfisCadastraveis()
      .then((r) => setPerfis(r.perfis))
      .catch(() => setPerfis([]));
  }, [pronto, carregar]);

  // Só a equipe interna da própria organização. DEV vê todas.
  const daEquipe = useMemo(() => {
    if (!lista) return [];
    if (user?.papel === "DEV") return lista;
    return lista.filter((u) => u.organizacao_id && u.organizacao_id === user?.organizacao_id);
  }, [lista, user]);

  const contagem = useMemo(
    () => ({
      ativos: daEquipe.filter((u) => u.ativo).length,
      desativados: daEquipe.filter((u) => !u.ativo).length,
      todos: daEquipe.length,
    }),
    [daEquipe]
  );

  const papeisNaLista = useMemo(() => [...new Set(daEquipe.map((u) => u.papel))], [daEquipe]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return daEquipe
      .filter((u) => (aba === "todos" ? true : aba === "ativos" ? u.ativo : !u.ativo))
      .filter((u) => !filtroPapel || u.papel === filtroPapel)
      .filter((u) => !termo || [u.nome, u.email].some((v) => v?.toLowerCase().includes(termo)))
      .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email, "pt-BR"));
  }, [daEquipe, aba, filtroPapel, busca]);

  const selecionado = visiveis.find((u) => u.id === selecionadoId) ?? visiveis[0] ?? null;

  // Formulário acompanha a pessoa selecionada
  const [formDe, setFormDe] = useState<string | null>(null);
  if (selecionado && formDe !== `${selecionado.id}:${selecionado.atualizado_em}`) {
    setFormDe(`${selecionado.id}:${selecionado.atualizado_em}`);
    setForm(paraForm(selecionado));
    setConfirmando(false);
  }

  if (!pronto) return null;

  const ehEuMesmo = selecionado?.id === user?.id;
  const ehMentor = selecionado?.papel === "MENTOR";
  // Troca de perfil: só entre perfis de gestão e dentro do alcance de quem edita.
  const opcoesPapel = PAPEIS_DE_GESTAO.filter((p) => perfis.includes(p));
  const podeTrocarPapel =
    !!selecionado && !ehEuMesmo && opcoesPapel.includes(selecionado.papel) && opcoesPapel.length > 1;

  const executar = async (acao: () => Promise<UsuarioAdmin>, ok: (u: UsuarioAdmin) => string) => {
    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      const u = await acao();
      setLista((l) => (l ?? []).map((x) => (x.id === u.id ? u : x)));
      setSelecionadoId(u.id);
      setMensagem(ok(u));
      setConfirmando(false);
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado || !form) return;
    // PATCH: só o que mudou; a API recusa null, então campo vazio não é enviado.
    const dados: UsuarioAdminUpdate = {};
    const nome = form.nome.trim();
    const instituicao = form.instituicao.trim();
    const curso = form.curso.trim();
    const periodo = form.periodo ? Number(form.periodo) : null;
    if (nome && nome !== (selecionado.nome ?? "")) dados.nome = nome;
    if (instituicao && instituicao !== (selecionado.instituicao ?? "")) dados.instituicao = instituicao;
    if (curso && curso !== (selecionado.curso ?? "")) dados.curso = curso;
    if (periodo && periodo !== selecionado.periodo) dados.periodo = periodo;
    if (podeTrocarPapel && form.papel !== selecionado.papel) dados.papel = form.papel;
    if (Object.keys(dados).length === 0) {
      setMensagem("Nada a salvar: nenhum campo foi alterado.");
      return;
    }
    executar(
      () => usuariosAdmin.editar(selecionado.id, dados),
      (u) =>
        dados.papel
          ? `${u.nome || u.email} agora é ${ROTULO_PAPEL[u.papel]}. A mudança vale no próximo pedido da pessoa.`
          : `Dados de ${u.nome || u.email} salvos.`
    );
  };

  const alternarAtivo = () => {
    if (!selecionado) return;
    const nome = selecionado.nome || selecionado.email;
    if (selecionado.ativo) {
      executar(
        () => usuariosAdmin.desativar(selecionado.id),
        () => `Conta de ${nome} desativada. As sessões dela foram encerradas.`
      );
    } else {
      executar(
        () => usuariosAdmin.reativar(selecionado.id),
        () => `Conta de ${nome} reativada. A pessoa entra com a senha que já tinha.`
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 sm:flex">
            <Users className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Equipe e acessos</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Edite os dados de quem trabalha com você, troque o perfil entre Organizador, Comitê
              Científico e Comitê Técnico, e desative ou reative contas. Desativar bloqueia o acesso
              na hora e preserva o histórico.
            </p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Link
            href="/admin/organizacao"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Adicionar pessoa
          </Link>
          <button
            type="button"
            onClick={() => {
              setLista(null);
              carregar();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Situação da conta" className="inline-flex self-start rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                aba === a.id ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {a.rotulo}
              {lista && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${aba === a.id ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {contagem[a.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Buscar pessoa</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none sm:w-72"
            />
          </label>
          <select
            aria-label="Filtrar por perfil"
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value as PapelUsuario | "")}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todos os perfis</option>
            {papeisNaLista.map((p) => (
              <option key={p} value={p}>{ROTULO_PAPEL[p]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {mensagem && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {mensagem}
          </p>
        )}
        {!!erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      </div>

      {lista === null ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_26rem]">
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </div>
      ) : visiveis.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
          <p className="mt-3 text-lg font-bold text-gray-900">Ninguém por aqui</p>
          <p className="mt-1 text-sm text-gray-600">
            {daEquipe.length > 0 ? "Tente outra busca, outro perfil ou outra aba." : "Cadastre a equipe em Organização e equipe."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_26rem]">
          {/* Lista */}
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white" aria-label="Pessoas da equipe">
            <div className="hidden grid-cols-[1fr_11rem_7rem] gap-4 border-b border-gray-100 px-5 py-3 text-[11px] font-semibold uppercase text-gray-500 md:grid">
              <span>Pessoa</span>
              <span>Perfil</span>
              <span>Conta</span>
            </div>
            <ul className="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto">
              {visiveis.map((u) => {
                const ativo = selecionado?.id === u.id;
                const nome = u.nome || u.email;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelecionadoId(u.id);
                        setMensagem(null);
                      }}
                      aria-current={ativo}
                      className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 text-left transition-colors md:grid-cols-[1fr_11rem_7rem] md:gap-4 cursor-pointer ${
                        ativo ? "bg-emerald-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${u.ativo ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gray-300"}`}>
                          {iniciais(nome)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-gray-900">
                            {nome}
                            {u.id === user?.id && <span className="ml-1.5 text-xs font-normal text-gray-500">(você)</span>}
                          </span>
                          <span className="block truncate text-xs text-gray-500">{u.email}</span>
                        </span>
                      </span>
                      <span className="hidden md:block">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${COR_PAPEL[u.papel] ?? "bg-gray-100 text-gray-700"}`}>
                          {ROTULO_PAPEL[u.papel]}
                        </span>
                      </span>
                      <span className={`text-xs font-semibold ${u.ativo ? "text-emerald-700" : "text-gray-500"}`}>
                        {u.ativo ? "Ativa" : "Desativada"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Detalhe */}
          {selecionado && form && (
            <section className="space-y-5 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-4" aria-label={`Conta de ${selecionado.nome || selecionado.email}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{selecionado.nome || "Sem nome"}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${COR_PAPEL[selecionado.papel] ?? "bg-gray-100 text-gray-700"}`}>
                    {ROTULO_PAPEL[selecionado.papel]}
                  </span>
                </div>
                <p className="mt-1 break-all text-sm text-gray-600">{selecionado.email}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                  <dt className="text-gray-500">Conta</dt>
                  <dd className={selecionado.ativo ? "font-semibold text-emerald-700" : "font-semibold text-gray-600"}>
                    {selecionado.ativo ? "Ativa" : "Desativada"}
                  </dd>
                  <dt className="text-gray-500">E-mail</dt>
                  <dd className="flex items-center gap-1 text-gray-800">
                    {selecionado.email_confirmado_em ? (
                      <><MailCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Confirmado</>
                    ) : (
                      <><MailWarning className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> Não confirmado</>
                    )}
                  </dd>
                  {selecionado.criado_em && (
                    <>
                      <dt className="text-gray-500">Criada em</dt>
                      <dd className="text-gray-800">{formatarDataBrasilia(selecionado.criado_em)}</dd>
                    </>
                  )}
                  {selecionado.atualizado_em && (
                    <>
                      <dt className="text-gray-500">Atualizada em</dt>
                      <dd className="text-gray-800">{formatarDataBrasilia(selecionado.atualizado_em)}</dd>
                    </>
                  )}
                </dl>
              </div>

              {ehMentor ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Mentores seguem um fluxo próprio (convite e termos da edição). Edite, desative ou
                  reative em{" "}
                  <Link href="/admin/organizacao" className="font-semibold underline">Organização e equipe</Link>.
                </p>
              ) : (
                <>
                  <form onSubmit={salvar} className="space-y-3 border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-bold text-gray-900">Dados</h3>
                    <div>
                      <label className={lbl} htmlFor="u-nome">Nome</label>
                      <input id="u-nome" maxLength={255} className={inp} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                    </div>
                    <div>
                      <label className={lbl} htmlFor="u-papel">Perfil</label>
                      {podeTrocarPapel ? (
                        <select id="u-papel" className={inp} value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as PapelUsuario })}>
                          {opcoesPapel.map((p) => (
                            <option key={p} value={p}>{ROTULO_PAPEL[p]}</option>
                          ))}
                        </select>
                      ) : (
                        <input id="u-papel" disabled className={inp} value={ROTULO_PAPEL[selecionado.papel]} />
                      )}
                      <p className="mt-1 text-[11px] text-gray-500">
                        {ehEuMesmo
                          ? "Você não pode alterar o próprio perfil."
                          : podeTrocarPapel
                            ? "Só entre Organizador, Comitê Científico e Comitê Técnico."
                            : "Seu perfil não permite trocar o perfil desta pessoa."}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_5rem]">
                      <div>
                        <label className={lbl} htmlFor="u-inst">Instituição</label>
                        <input id="u-inst" maxLength={255} className={inp} value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} />
                      </div>
                      <div>
                        <label className={lbl} htmlFor="u-curso">Curso</label>
                        <input id="u-curso" maxLength={255} className={inp} value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })} />
                      </div>
                      <div>
                        <label className={lbl} htmlFor="u-periodo">Período</label>
                        <input id="u-periodo" type="number" min={1} className={inp} value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      O e-mail só a própria pessoa troca, com confirmação. Campos deixados em branco
                      não são alterados.
                    </p>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" /> {enviando ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </form>

                  <div className="space-y-3 border-t border-gray-100 pt-5">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                      <ShieldCheck className="h-4 w-4 text-gray-500" aria-hidden="true" /> Acesso
                    </h3>
                    {ehEuMesmo ? (
                      <p className="text-xs text-gray-600">Você não pode desativar a própria conta.</p>
                    ) : !confirmando ? (
                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() => (selecionado.ativo ? setConfirmando(true) : alternarAtivo())}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50 cursor-pointer ${
                          selecionado.ativo
                            ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                            : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        <Power className="h-4 w-4" aria-hidden="true" />
                        {selecionado.ativo ? "Desativar conta" : enviando ? "Reativando..." : "Reativar conta"}
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/60 p-4">
                        <p className="text-sm text-red-900">
                          {selecionado.nome || selecionado.email} perde o acesso agora e todas as
                          sessões abertas são encerradas. O histórico continua salvo e a conta pode
                          ser reativada depois.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={enviando}
                            onClick={alternarAtivo}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                          >
                            {enviando ? "Desativando..." : "Confirmar desativação"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmando(false)}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
