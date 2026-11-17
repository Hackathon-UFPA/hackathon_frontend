"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Hourglass,
  Paperclip,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import CartaoSessao from "@/components/treinamento/CartaoSessao";
import FormSessao from "@/components/treinamento/FormSessao";
import FormMaterial from "@/components/treinamento/FormMaterial";
import { hackathons as hackathonsApi, type HackathonResponse } from "@/lib/api";
import {
  dataHora,
  treinamentoAdmin,
  type MarcoTreinamento,
  type SessaoTreinamento,
  type SessaoTreinamentoCreate,
} from "@/lib/api-treinamento";
import { useSession } from "@/lib/useSession";

type Filtro = "todas" | "publicadas" | "rascunhos";

const btnSec =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer disabled:opacity-50";

function TreinamentoAdminConteudo() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const params = useSearchParams();
  const router = useRouter();

  const [edicoes, setEdicoes] = useState<HackathonResponse[] | null>(null);
  const [hackathonId, setHackathonId] = useState(params.get("hackathon_id") ?? "");
  const [sessoes, setSessoes] = useState<SessaoTreinamento[] | null>(null);
  const [marco, setMarco] = useState<MarcoTreinamento | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [editando, setEditando] = useState<SessaoTreinamento | null>(null);
  const [anexandoEm, setAnexandoEm] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [concluindo, setConcluindo] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .daMinhaOrganizacao()
      .then((l) => {
        setEdicoes(l);
        setHackathonId((atual) => atual || l[0]?.id || "");
      })
      .catch((e: unknown) => {
        setEdicoes([]);
        setErro(e);
      });
  }, [pronto]);

  // Só altera estado em callbacks de promessa (é chamada por um efeito); `recarregar` limpa antes.
  const carregar = useCallback(
    (id: string) =>
      Promise.all([treinamentoAdmin.listarSessoes(id, { limite: 100 }), treinamentoAdmin.marco(id)])
        .then(([lista, m]) => {
          setSessoes(lista);
          setMarco(m);
        })
        .catch((e: unknown) => {
          setSessoes([]);
          setErro(e);
        }),
    []
  );

  useEffect(() => {
    if (pronto && hackathonId) carregar(hackathonId);
  }, [pronto, hackathonId, carregar]);

  const recarregar = (id: string) => {
    setErro(null);
    setSessoes(null);
    setMarco(null);
    carregar(id);
  };

  const trocarEdicao = (id: string) => {
    setErro(null);
    setSessoes(null);
    setMarco(null);
    setHackathonId(id);
    setEditando(null);
    setAnexandoEm(null);
    setOk(null);
    router.replace(`/admin/treinamento?hackathon_id=${id}`, { scroll: false });
  };

  const substituir = (s: SessaoTreinamento) =>
    setSessoes((l) =>
      (l ?? [])
        .map((x) => (x.id === s.id ? s : x))
        .sort((a, b) => a.inicio.localeCompare(b.inicio))
    );

  const salvarSessao = async (dados: SessaoTreinamentoCreate) => {
    setOk(null);
    if (editando) {
      const s = await treinamentoAdmin.editarSessao(hackathonId, editando.id, dados);
      substituir(s);
      setEditando(null);
      setOk(`Sessão "${s.titulo}" atualizada.`);
    } else {
      const s = await treinamentoAdmin.criarSessao(hackathonId, dados);
      setSessoes((l) => [...(l ?? []), s].sort((a, b) => a.inicio.localeCompare(b.inicio)));
      setOk(s.publicado ? `Sessão "${s.titulo}" cadastrada e publicada.` : `Sessão "${s.titulo}" cadastrada como rascunho.`);
    }
  };

  const alternarPublicacao = async (s: SessaoTreinamento) => {
    setOcupado(s.id);
    setErro(null);
    setOk(null);
    try {
      const nova = await treinamentoAdmin.editarSessao(hackathonId, s.id, { publicado: !s.publicado });
      substituir(nova);
      setOk(nova.publicado ? `"${nova.titulo}" agora aparece para as equipes aprovadas.` : `"${nova.titulo}" voltou a ser rascunho.`);
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(null);
    }
  };

  const excluirSessao = async (s: SessaoTreinamento) => {
    const extra = s.materiais.length ? ` Os ${s.materiais.length} materiais anexados também serão removidos.` : "";
    if (!window.confirm(`Excluir a sessão "${s.titulo}"?${extra}`)) return;
    setOcupado(s.id);
    setErro(null);
    setOk(null);
    try {
      await treinamentoAdmin.excluirSessao(hackathonId, s.id);
      setSessoes((l) => (l ?? []).filter((x) => x.id !== s.id));
      if (editando?.id === s.id) setEditando(null);
      setOk(`Sessão "${s.titulo}" excluída.`);
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(null);
    }
  };

  const adicionarMaterial = async (s: SessaoTreinamento, dados: { titulo: string; url: string }) => {
    const m = await treinamentoAdmin.adicionarMaterial(hackathonId, s.id, dados);
    setSessoes((l) => (l ?? []).map((x) => (x.id === s.id ? { ...x, materiais: [...x.materiais, m] } : x)));
    setOk(`Material "${m.titulo}" anexado a "${s.titulo}".`);
  };

  const removerMaterial = async (s: SessaoTreinamento, materialId: string, titulo: string) => {
    if (!window.confirm(`Remover o material "${titulo}"?`)) return;
    setErro(null);
    setOk(null);
    try {
      await treinamentoAdmin.removerMaterial(hackathonId, s.id, materialId);
      setSessoes((l) =>
        (l ?? []).map((x) => (x.id === s.id ? { ...x, materiais: x.materiais.filter((m) => m.id !== materialId) } : x))
      );
      setOk(`Material "${titulo}" removido.`);
    } catch (e) {
      setErro(e);
    }
  };

  const concluir = async () => {
    if (!window.confirm("Confirmar que o treinamento desta edição terminou? A partir daí os mentores podem ser atribuídos às equipes aprovadas. Não é possível desfazer.")) return;
    setConcluindo(true);
    setErro(null);
    setOk(null);
    try {
      setMarco(await treinamentoAdmin.concluir(hackathonId));
      setOk("Treinamento marcado como concluído. A atribuição de mentores está liberada.");
    } catch (e) {
      setErro(e);
    } finally {
      setConcluindo(false);
    }
  };

  const contagem = useMemo(() => {
    const l = sessoes ?? [];
    const pub = l.filter((s) => s.publicado).length;
    return { todas: l.length, publicadas: pub, rascunhos: l.length - pub, materiais: l.reduce((n, s) => n + s.materiais.length, 0) };
  }, [sessoes]);

  const visiveis = (sessoes ?? []).filter((s) =>
    filtro === "todas" ? true : filtro === "publicadas" ? s.publicado : !s.publicado
  );

  if (!pronto) return null;

  const edicaoAtual = edicoes?.find((h) => h.id === hackathonId);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white sm:flex">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Treinamento das equipes</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Monte a agenda do treinamento, anexe os materiais (links) e publique. Só as equipes
              aprovadas no resultado homologado veem as sessões publicadas.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase text-gray-600">Hackathon</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none sm:w-72"
              value={hackathonId}
              onChange={(e) => trocarEdicao(e.target.value)}
              disabled={!edicoes?.length}
            >
              {edicoes === null && <option value="">Carregando...</option>}
              {edicoes?.length === 0 && <option value="">Nenhum hackathon cadastrado</option>}
              {edicoes?.map((h) => (
                <option key={h.id} value={h.id}>{h.nome || "Sem nome"}</option>
              ))}
            </select>
          </label>
          {hackathonId && (
            <button
              type="button"
              onClick={() => recarregar(hackathonId)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 space-y-3" aria-live="polite">
        {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} onRetry={hackathonId ? () => recarregar(hackathonId) : undefined} />}
        {ok && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {ok}
          </p>
        )}
      </div>

      {edicoes?.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
          <p className="mt-3 text-lg font-bold text-gray-900">Nenhum hackathon por aqui ainda</p>
          <p className="mt-1 text-sm text-gray-600">Crie um hackathon no painel para montar o treinamento das equipes.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
            Ir para o painel
          </Link>
        </div>
      ) : hackathonId ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
          {/* Agenda */}
          <section aria-label="Sessões do treinamento" className="min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { rotulo: "Sessões", valor: contagem.todas },
                { rotulo: "Publicadas", valor: contagem.publicadas },
                { rotulo: "Rascunhos", valor: contagem.rascunhos },
                { rotulo: "Materiais", valor: contagem.materiais },
              ].map((c) => (
                <div key={c.rotulo} className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <p className="text-2xl font-extrabold text-gray-900">{sessoes === null ? "–" : c.valor}</p>
                  <p className="text-xs font-semibold text-gray-500">{c.rotulo}</p>
                </div>
              ))}
            </div>

            <div role="tablist" aria-label="Filtrar sessões" className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
              {(["todas", "publicadas", "rascunhos"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filtro === f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                    filtro === f ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {f} <span className="ml-1 text-[11px] opacity-80">{contagem[f]}</span>
                </button>
              ))}
            </div>

            {sessoes === null ? (
              <div className="space-y-3">
                <div className="h-36 animate-pulse rounded-2xl bg-white" />
                <div className="h-36 animate-pulse rounded-2xl bg-white" />
              </div>
            ) : visiveis.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center">
                <CalendarPlus className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
                <p className="mt-3 font-bold text-gray-900">
                  {contagem.todas === 0 ? "Nenhuma sessão cadastrada" : `Nenhuma sessão em "${filtro}"`}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {contagem.todas === 0
                    ? `Use o formulário ao lado para cadastrar a primeira sessão de ${edicaoAtual?.nome ?? "este hackathon"}.`
                    : "Troque o filtro para ver as demais."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visiveis.map((s) => (
                  <CartaoSessao
                    key={s.id}
                    sessao={s}
                    onRemoverMaterial={(id, titulo) => removerMaterial(s, id, titulo)}
                    selo={
                      s.publicado ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Publicada</span>
                      ) : (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Rascunho</span>
                      )
                    }
                    acoes={
                      <>
                        <button type="button" className={btnSec} disabled={ocupado === s.id} onClick={() => alternarPublicacao(s)}>
                          {s.publicado ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                          {s.publicado ? "Despublicar" : "Publicar"}
                        </button>
                        <button
                          type="button"
                          className={btnSec}
                          onClick={() => {
                            setEditando(s);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                        </button>
                        <button
                          type="button"
                          className={`${btnSec} hover:border-red-400 hover:text-red-600`}
                          disabled={ocupado === s.id}
                          onClick={() => excluirSessao(s)}
                          aria-label={`Excluir sessão ${s.titulo}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </>
                    }
                    rodape={
                      anexandoEm === s.id ? (
                        <FormMaterial onAdicionar={(d) => adicionarMaterial(s, d)} onCancelar={() => setAnexandoEm(null)} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAnexandoEm(s.id)}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          <Paperclip className="h-4 w-4" aria-hidden="true" /> Anexar material
                        </button>
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Lateral: formulário e marco */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className={`rounded-2xl border bg-white p-5 ${editando ? "border-emerald-400 ring-2 ring-emerald-100" : "border-emerald-100"}`}>
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                {editando ? <Pencil className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <CalendarPlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                {editando ? "Editar sessão" : "Nova sessão"}
              </h2>
              {editando && <p className="mt-0.5 truncate text-xs text-gray-500">{editando.titulo}</p>}
              <div className="mt-4">
                <FormSessao
                  key={editando?.id ?? `nova-${hackathonId}`}
                  sessao={editando}
                  onSalvar={salvarSessao}
                  onCancelar={editando ? () => setEditando(null) : undefined}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-white p-5">
              <h2 className="text-base font-bold text-gray-900">Conclusão do treinamento</h2>
              {marco?.treinamento_concluido_em ? (
                <div className="mt-3 flex items-start gap-3 rounded-xl bg-emerald-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-900">Concluído</p>
                    <p className="text-emerald-800">{dataHora(marco.treinamento_concluido_em)}</p>
                    <p className="mt-1 text-xs text-emerald-800">A atribuição de mentores às equipes está liberada.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-start gap-3 rounded-xl bg-amber-50 p-3">
                    <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                    <p className="text-sm text-amber-900">
                      Ainda não concluído. Os mentores só podem ser atribuídos às equipes depois desta confirmação.
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Confirme quando o treinamento realmente terminar. Exige o resultado da edição
                    homologado e a edição em andamento; a confirmação não pode ser desfeita.
                  </p>
                  <button
                    type="button"
                    onClick={concluir}
                    disabled={concluindo || marco === null}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {concluindo ? "Confirmando..." : "Confirmar conclusão"}
                  </button>
                </>
              )}
            </section>

            <Link
              href={`/treinamento?hackathon_id=${hackathonId}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-700"
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver como as equipes veem
            </Link>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

export default function TreinamentoAdminPage() {
  return (
    <Suspense fallback={null}>
      <TreinamentoAdminConteudo />
    </Suspense>
  );
}
