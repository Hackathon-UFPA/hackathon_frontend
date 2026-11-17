"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FilePen,
  FileText,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import {
  formatarDataBrasilia,
  hackathons as hackathonsApi,
  type HackathonResponse,
  type TipoTermo,
} from "@/lib/api";
import { termosRascunho, type TermoAdmin } from "@/lib/api-admin";
import { useSession } from "@/lib/useSession";

const inp =
  "w-full rounded-xl border border-gray-300 bg-[#F6F9F8] px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none disabled:opacity-60";
const lbl = "mb-1 block text-[11px] font-semibold uppercase text-gray-600";

const TIPOS: { valor: TipoTermo; rotulo: string }[] = [
  { valor: "REGULAMENTO", rotulo: "Regulamento" },
  { valor: "TERMO_CONSENTIMENTO", rotulo: "Termo de consentimento (LGPD)" },
];
const rotuloTipo = (t: TipoTermo) => TIPOS.find((x) => x.valor === t)?.rotulo ?? t;

type Form = { tipo: TipoTermo; versao: string; titulo: string; conteudo: string; url: string };
const FORM_VAZIO: Form = { tipo: "REGULAMENTO", versao: "1.0", titulo: "", conteudo: "", url: "" };

/** Próxima versão sugerida: maior número já usado no tipo + 1 ("1.0", "2.0"...). */
function proximaVersao(lista: TermoAdmin[], tipo: TipoTermo) {
  const usadas = lista.filter((t) => t.tipo === tipo).map((t) => parseFloat(t.versao)).filter((n) => !Number.isNaN(n));
  return usadas.length ? `${Math.floor(Math.max(...usadas)) + 1}.0` : "1.0";
}

function Selo({ t }: { t: TermoAdmin }) {
  if (t.rascunho)
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">Rascunho</span>;
  if (t.vigente)
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Vigente</span>;
  return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">Substituída</span>;
}

function TermosConteudo() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const params = useSearchParams();
  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [hackathonId, setHackathonId] = useState(params.get("hackathon_id") ?? "");
  const [lista, setLista] = useState<TermoAdmin[] | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: string; acao: "publicar" | "excluir" } | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .daMinhaOrganizacao()
      .then((l) => {
        setEdicoes(l);
        setHackathonId((atual) => atual || l[0]?.id || "");
      })
      .catch((e: unknown) => setErro(e));
  }, [pronto]);

  const carregar = useCallback(
    (id: string) =>
      termosRascunho
        .listar(id)
        .then((l) => {
          setLista(l);
          return l;
        })
        .catch((e: unknown) => {
          setErro(e);
          return null;
        }),
    []
  );

  useEffect(() => {
    if (!pronto || !hackathonId) return;
    carregar(hackathonId).then((l) => l && setForm({ ...FORM_VAZIO, versao: proximaVersao(l, "REGULAMENTO") }));
  }, [pronto, hackathonId, carregar]);

  const grupos = useMemo(
    () =>
      TIPOS.map((t) => ({
        ...t,
        itens: (lista ?? [])
          .filter((x) => x.tipo === t.valor)
          // Rascunhos primeiro, depois a vigente, depois o histórico
          .sort((a, b) => Number(b.rascunho) - Number(a.rascunho) || Number(b.vigente) - Number(a.vigente)),
      })),
    [lista]
  );

  if (!pronto) return null;

  const editando = lista?.find((t) => t.id === editandoId) ?? null;

  const novoFormulario = (tipo: TipoTermo = form.tipo) => {
    setEditandoId(null);
    setForm({ ...FORM_VAZIO, tipo, versao: proximaVersao(lista ?? [], tipo) });
  };

  const comecarEdicao = (t: TermoAdmin) => {
    setEditandoId(t.id);
    setConfirmar(null);
    setOk(null);
    setForm({ tipo: t.tipo, versao: t.versao, titulo: t.titulo, conteudo: t.conteudo ?? "", url: t.url ?? "" });
  };

  const executar = async (acao: () => Promise<string>) => {
    setErro(null);
    setOk(null);
    setSalvando(true);
    try {
      setOk(await acao());
      setConfirmar(null);
      const l = await carregar(hackathonId);
      return l;
    } catch (e) {
      setErro(e);
      return null;
    } finally {
      setSalvando(false);
    }
  };

  // Salva o formulário (cria ou edita o rascunho) e, se pedido, publica em seguida.
  const salvar = async (publicar: boolean) => {
    const conteudo = form.conteudo.trim() || null;
    const url = form.url.trim() || null;
    const l = await executar(async () => {
      const termo = editando
        ? await termosRascunho.editar(hackathonId, editando.id, { titulo: form.titulo.trim(), conteudo, url })
        : await termosRascunho.criar(hackathonId, {
            tipo: form.tipo,
            versao: form.versao.trim(),
            titulo: form.titulo.trim(),
            conteudo,
            url,
          });
      if (publicar) {
        await termosRascunho.publicar(hackathonId, termo.id);
        return `Versão ${termo.versao} publicada. Ela passa a ser a vigente e quem já aceitou a anterior precisa aceitar de novo.`;
      }
      return `Rascunho da versão ${termo.versao} salvo. Ele não aparece para os participantes até ser publicado.`;
    });
    if (l) {
      setEditandoId(null);
      setForm({ ...FORM_VAZIO, tipo: form.tipo, versao: proximaVersao(l, form.tipo) });
    }
  };

  const publicarRascunho = (t: TermoAdmin) =>
    executar(async () => {
      await termosRascunho.publicar(hackathonId, t.id);
      if (editandoId === t.id) novoFormulario(t.tipo);
      return `Versão ${t.versao} publicada. Ela passa a ser a vigente de ${rotuloTipo(t.tipo).toLowerCase()}.`;
    });

  const excluirRascunho = (t: TermoAdmin) =>
    executar(async () => {
      await termosRascunho.excluir(hackathonId, t.id);
      if (editandoId === t.id) novoFormulario(t.tipo);
      return `Rascunho da versão ${t.versao} excluído.`;
    });

  const semTexto = !form.conteudo.trim() && !form.url.trim();
  const invalido = semTexto || !form.titulo.trim() || !form.versao.trim();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 sm:flex">
            <FileText className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Regulamento e termos</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Prepare a versão como rascunho, revise e publique quando estiver pronta. O participante
              precisa aceitar o regulamento e o termo de consentimento vigentes para entrar numa
              equipe. Uma versão publicada não muda mais: para corrigir, publique outra.
            </p>
          </div>
        </div>
        <div className="w-full lg:w-72">
          <label className={lbl} htmlFor="edicao">Hackathon</label>
          <select id="edicao" className={inp} value={hackathonId} onChange={(e) => {
              setHackathonId(e.target.value);
              setLista(null);
              setEditandoId(null);
              setConfirmar(null);
              setOk(null);
            }}>
            {edicoes.length === 0 && <option value="">Nenhum hackathon cadastrado</option>}
            {edicoes.map((h) => (
              <option key={h.id} value={h.id}>{h.nome || "Sem nome"}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-4 space-y-3" aria-live="polite">
        {ok && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {ok}
          </p>
        )}
        {!!erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      </div>

      {hackathonId && (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_28rem]">
          {/* Versões */}
          <div className="space-y-4">
            {lista === null ? (
              <div className="h-72 animate-pulse rounded-3xl bg-white" />
            ) : (
              grupos.map((g) => (
                <section key={g.valor} className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-bold text-gray-900">{g.rotulo}</h2>
                    {!g.itens.some((t) => t.vigente) && (
                      <span className="text-xs font-semibold text-amber-700">Sem versão vigente</span>
                    )}
                  </div>
                  {g.itens.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-500">Nenhuma versão ainda. Use o formulário ao lado.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {g.itens.map((t) => {
                        const aberto = abertoId === t.id;
                        const confirmando = confirmar?.id === t.id ? confirmar.acao : null;
                        return (
                          <li key={t.id} className={`px-5 py-4 ${editandoId === t.id ? "bg-amber-50/60" : ""}`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-gray-900">{t.titulo}</span>
                                  <span className="text-xs text-gray-500">v{t.versao}</span>
                                  <Selo t={t} />
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {t.publicado_em ? `Publicada em ${formatarDataBrasilia(t.publicado_em)}` : "Ainda não publicada"}
                                  {t.url && (
                                    <>
                                      {" · "}
                                      <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 hover:underline">
                                        Documento <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                      </a>
                                    </>
                                  )}
                                  {t.conteudo && (
                                    <>
                                      {" · "}
                                      <button type="button" onClick={() => setAbertoId(aberto ? null : t.id)} className="font-semibold text-emerald-700 hover:underline cursor-pointer">
                                        {aberto ? "Ocultar texto" : "Ver texto"}
                                      </button>
                                    </>
                                  )}
                                </p>
                              </div>
                              {t.rascunho && !confirmando && (
                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => comecarEdicao(t)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={salvando}
                                    onClick={() => setConfirmar({ id: t.id, acao: "publicar" })}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                  >
                                    <Send className="h-3.5 w-3.5" aria-hidden="true" /> Publicar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={salvando}
                                    aria-label={`Excluir rascunho ${t.versao}`}
                                    onClick={() => setConfirmar({ id: t.id, acao: "excluir" })}
                                    className="inline-flex items-center rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {confirmando && (
                              <div className={`mt-3 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${confirmando === "excluir" ? "border-red-200 bg-red-50/60" : "border-emerald-200 bg-emerald-50/60"}`}>
                                <p className="text-sm text-gray-800">
                                  {confirmando === "excluir"
                                    ? "Excluir este rascunho? Não dá para desfazer."
                                    : "Publicar esta versão? Ela substitui a vigente e passa a exigir novo aceite. Depois de publicada, não pode mais ser editada."}
                                </p>
                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    disabled={salvando}
                                    onClick={() => (confirmando === "excluir" ? excluirRascunho(t) : publicarRascunho(t))}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer ${confirmando === "excluir" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                                  >
                                    {salvando ? "Aguarde..." : confirmando === "excluir" ? "Excluir" : "Publicar agora"}
                                  </button>
                                  <button type="button" onClick={() => setConfirmar(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}

                            {aberto && t.conteudo && (
                              <div className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
                                {t.conteudo}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              ))
            )}
          </div>

          {/* Formulário */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvar(false);
            }}
            className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                {editando ? <FilePen className="h-4 w-4 text-amber-600" aria-hidden="true" /> : <Plus className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                {editando ? `Editar rascunho v${editando.versao}` : "Nova versão"}
              </h2>
              {editando && (
                <button type="button" onClick={() => novoFormulario()} className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer">
                  Cancelar edição
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_6rem]">
              <div>
                <label className={lbl} htmlFor="tipo">Tipo</label>
                <select
                  id="tipo"
                  disabled={!!editando}
                  className={inp}
                  value={form.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoTermo;
                    setForm({ ...form, tipo, versao: proximaVersao(lista ?? [], tipo) });
                  }}
                >
                  {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="versao">Versão</label>
                <input id="versao" required disabled={!!editando} maxLength={50} className={inp} value={form.versao} onChange={(e) => setForm({ ...form, versao: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={lbl} htmlFor="titulo">Título</label>
              <input id="titulo" required maxLength={255} className={inp} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <label className={lbl} htmlFor="conteudo">Texto</label>
              <textarea id="conteudo" rows={10} maxLength={20000} className={inp} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
            </div>
            <div>
              <label className={lbl} htmlFor="url">Ou link do documento</label>
              <input id="url" type="url" placeholder="https://..." className={inp} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <p className="mt-1 text-[11px] text-gray-500">
                Informe o texto, o link (https) ou os dois.{editando && " Tipo e versão não mudam depois de criados."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={salvando || invalido}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-800 hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {salvando ? "Salvando..." : "Salvar rascunho"}
              </button>
              <button
                type="button"
                disabled={salvando || invalido}
                onClick={() => salvar(true)}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {salvando ? "Publicando..." : "Salvar e publicar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default function AdminTermosPage() {
  return (
    <Suspense fallback={null}>
      <TermosConteudo />
    </Suspense>
  );
}
