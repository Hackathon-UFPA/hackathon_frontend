"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Handshake,
  History,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import {
  Avatar,
  btnPerigo,
  btnPrimario,
  btnSecundario,
  campo,
  dataHora,
  rotulo,
  useHackathonsDaOrganizacao,
} from "@/components/mentores/ui";
import { ApiError } from "@/lib/api";
import {
  mentoresAdmin,
  mentoria,
  type Atribuicao,
  type EquipeAprovada,
  type Mentor,
  type Treinamento,
} from "@/lib/api-mentores";
import { useSession } from "@/lib/useSession";

type MentorComCarga = Mentor & { vigentes: number };
type LinhaEquipe = EquipeAprovada & { atual: Atribuicao | null };
type Acao = { equipeId: string; tipo: "atribuir" | "trocar" | "encerrar" | "historico" } | null;

const nomeMentor = (m?: Pick<Mentor, "nome" | "email"> | null) => m?.nome || m?.email || "Mentor";

function FormAcao({
  linha,
  tipo,
  mentores,
  onFeito,
  onCancelar,
}: {
  linha: LinhaEquipe;
  tipo: "atribuir" | "trocar" | "encerrar";
  mentores: MentorComCarga[];
  onFeito: (texto: string) => void;
  onCancelar: () => void;
}) {
  const [mentorId, setMentorId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const equipe = linha.equipe_nome || "a equipe";
  const motivoObrigatorio = tipo !== "atribuir";

  const opcoes = mentores
    .filter((m) => m.ativo && m.id !== linha.atual?.mentor_id)
    .sort((a, b) => (b.max_equipes ?? 0) - b.vigentes - ((a.max_equipes ?? 0) - a.vigentes));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const escolhido = mentores.find((m) => m.id === mentorId);
      if (tipo === "atribuir") {
        await mentoria.atribuir(linha.equipe_id, mentorId, motivo);
        onFeito(`${nomeMentor(escolhido)} agora acompanha ${equipe}. A equipe e o mentor foram avisados.`);
      } else if (tipo === "trocar" && linha.atual) {
        await mentoria.substituir(linha.equipe_id, { mentor_id: mentorId, atribuicao_atual_id: linha.atual.id, motivo: motivo.trim() });
        onFeito(`Mentor de ${equipe} trocado para ${nomeMentor(escolhido)}.`);
      } else if (tipo === "encerrar" && linha.atual) {
        await mentoria.encerrar(linha.equipe_id, linha.atual.id, motivo.trim());
        onFeito(`Mentoria de ${equipe} encerrada.`);
      }
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      className={`mt-3 space-y-3 rounded-2xl border p-4 ${tipo === "encerrar" ? "border-red-200 bg-red-50/50" : "border-emerald-100 bg-emerald-50/40"}`}
    >
      {erro !== null && (
        <ApiErrorAlert
          erro={erro instanceof ApiError && erro.status === 409 ? new ApiError(409, `${erro.message} Atualize a página se outra pessoa mexeu nesta equipe.`) : erro}
          onClose={() => setErro(null)}
        />
      )}
      {tipo !== "encerrar" && (
        <div>
          <label htmlFor={`m-${linha.equipe_id}`} className={rotulo}>
            {tipo === "trocar" ? "Novo mentor" : "Mentor"}
          </label>
          {opcoes.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum mentor ativo disponível.{" "}
              <Link href="/admin/mentores" className="font-semibold text-emerald-700 hover:underline">Cadastrar mentores</Link>
            </p>
          ) : (
            <select id={`m-${linha.equipe_id}`} required className={campo} value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
              <option value="" disabled>Escolha um mentor</option>
              {opcoes.map((m) => {
                const vagas = (m.max_equipes ?? 0) - m.vigentes;
                return (
                  <option key={m.id} value={m.id} disabled={vagas <= 0}>
                    {nomeMentor(m)} — {[m.empresa_parceira, m.area_atuacao].filter(Boolean).join(", ")} ·{" "}
                    {vagas > 0 ? `${vagas} ${vagas === 1 ? "vaga" : "vagas"}` : "sem vagas"}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      )}
      <div>
        <label htmlFor={`mot-${linha.equipe_id}`} className={rotulo}>
          {tipo === "atribuir" ? "Observação (opcional, só a gestão vê)" : tipo === "trocar" ? "Motivo da troca" : "Motivo do encerramento"}
        </label>
        <textarea
          id={`mot-${linha.equipe_id}`}
          rows={2}
          maxLength={1000}
          required={motivoObrigatorio}
          className={campo}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando || (tipo !== "encerrar" && !mentorId) || (motivoObrigatorio && !motivo.trim())}
          className={
            tipo === "encerrar"
              ? "inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              : btnPrimario
          }
        >
          {enviando ? "Salvando..." : tipo === "atribuir" ? "Atribuir" : tipo === "trocar" ? "Trocar mentor" : "Encerrar mentoria"}
        </button>
        <button type="button" onClick={onCancelar} className={btnSecundario}>Cancelar</button>
      </div>
    </form>
  );
}

function Historico({ equipeId, mentores }: { equipeId: string; mentores: MentorComCarga[] }) {
  const [itens, setItens] = useState<Atribuicao[] | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  useEffect(() => {
    mentoria.historico(equipeId, { limite: 50 }).then(setItens).catch(setErro);
  }, [equipeId]);
  const nome = (id: string) => nomeMentor(mentores.find((m) => m.id === id));

  if (erro) return <div className="mt-3"><ApiErrorAlert erro={erro} /></div>;
  if (!itens) return <div className="mt-3 h-12 animate-pulse rounded-2xl bg-gray-50" />;
  if (!itens.length) return <p className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-600">Esta equipe ainda não teve mentor.</p>;
  return (
    <ol className="mt-3 space-y-2 rounded-2xl bg-gray-50 p-3">
      {itens.map((a) => (
        <li key={a.id} className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{nome(a.mentor_id)}</span> · desde {dataHora(a.atribuido_em)}
          {a.motivo && <span className="text-gray-500"> · “{a.motivo}”</span>}
          {a.encerrada_em ? (
            <span className="block text-xs text-gray-500">
              Encerrada em {dataHora(a.encerrada_em)}
              {a.motivo_encerramento && ` · “${a.motivo_encerramento}”`}
            </span>
          ) : (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">atual</span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function AdminMentoriaPage() {
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  // Confirmar o treinamento é do Organizador/DEV; atribuir mentores é também do Comitê (RF38)
  const ehOrganizador = user?.papel === "ORGANIZADOR" || user?.papel === "DEV";
  const podeAtribuir = ehOrganizador || user?.papel === "COMITE_CIENTIFICO";
  const hackathons = useHackathonsDaOrganizacao(user);
  const [hackathonId, setHackathonId] = useState("");
  const [treinamento, setTreinamento] = useState<Treinamento | null>(null);
  const [linhas, setLinhas] = useState<LinhaEquipe[] | null>(null);
  const [homologado, setHomologado] = useState(true);
  const [mentores, setMentores] = useState<MentorComCarga[]>([]);
  const [acao, setAcao] = useState<Acao>(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [confirmandoTreino, setConfirmandoTreino] = useState(false);

  // Hackathon inicial: ?hackathon_id= ou o primeiro em andamento
  const escolhido = hackathonId || (() => {
    if (!hackathons?.length) return "";
    const pedido = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("hackathon_id") : null;
    if (pedido && hackathons.some((h) => h.id === pedido)) return pedido;
    return (hackathons.find((h) => h.status === "ATIVO" || h.status === "EM_AVALIACAO") ?? hackathons[0]).id;
  })();

  const carregarMentores = useCallback(
    () =>
      mentoresAdmin
        .listarTodos()
        .then((l) =>
          Promise.all(
            l.filter((m) => m.ativo).map(async (m) => ({
              ...m,
              vigentes: (await mentoresAdmin.equipes(m.id, { apenas_vigentes: true, limite: 100 }).catch(() => [])).length,
            }))
          ).then((ativos) => {
            const ids = new Set(ativos.map((m) => m.id));
            // inativos ficam na lista só para mostrar o nome de quem já acompanhou
            setMentores([...ativos, ...l.filter((m) => !ids.has(m.id)).map((m) => ({ ...m, vigentes: 0 }))]);
          })
        )
        .catch(() => setMentores([])),
    []
  );

  const carregarEquipes = useCallback(
    (id: string) => {
      if (!id) return;
      mentoria.treinamento(id).then(setTreinamento).catch(() => setTreinamento(null));
      if (!podeAtribuir) return;
      mentoria
        .equipesAprovadas(id)
        .then(async (r) => {
          setHomologado(r.homologado);
          const comMentor = await Promise.all(
            r.equipes.map(async (e) => ({ ...e, atual: await mentoria.atual(e.equipe_id) }))
          );
          comMentor.sort((a, b) => (a.equipe_nome ?? "").localeCompare(b.equipe_nome ?? "", "pt-BR"));
          setLinhas(comMentor);
        })
        .catch((e: unknown) => {
          setErro(e);
          setLinhas([]);
        });
    },
    [podeAtribuir]
  );

  useEffect(() => {
    if (pronto) carregarMentores();
  }, [pronto, carregarMentores]);

  useEffect(() => {
    carregarEquipes(escolhido);
  }, [escolhido, carregarEquipes]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (linhas ?? []).filter(
      (l) => !termo || [l.equipe_nome, l.titulo, l.tema_titulo].some((v) => v?.toLowerCase().includes(termo))
    );
  }, [linhas, busca]);

  if (!pronto) return null;

  const trocarHackathon = (id: string) => {
    setHackathonId(id);
    setLinhas(null);
    setTreinamento(null);
    setAcao(null);
    setMensagem(null);
  };

  const feito = (texto: string) => {
    setAcao(null);
    setMensagem(texto);
    setLinhas(null);
    carregarEquipes(escolhido);
    carregarMentores();
  };

  const concluirTreinamento = async () => {
    setErro(null);
    try {
      setTreinamento(await mentoria.concluirTreinamento(escolhido));
      setConfirmandoTreino(false);
      setMensagem("Treinamento confirmado. Agora você pode atribuir mentores.");
    } catch (e) {
      setErro(e);
    }
  };

  const semMentor = (linhas ?? []).filter((l) => !l.atual).length;
  const ativos = mentores.filter((m) => m.ativo);
  const vagasLivres = ativos.reduce((s, m) => s + Math.max((m.max_equipes ?? 0) - m.vigentes, 0), 0);
  const treinamentoOk = !!treinamento?.treinamento_concluido_em;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
            <Users className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Mentoria das equipes</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-600">
              Escolha quem acompanha cada equipe com proposta aprovada. A equipe e o mentor recebem um aviso a cada
              mudança.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
          <div>
            <label htmlFor="hack" className={rotulo}>Hackathon</label>
            <select id="hack" className={`${campo} sm:w-72`} value={escolhido} onChange={(e) => trocarHackathon(e.target.value)}>
              {hackathons === null && <option value="">Carregando...</option>}
              {hackathons?.length === 0 && <option value="">Nenhum hackathon</option>}
              {(hackathons ?? []).map((h) => (
                <option key={h.id} value={h.id}>{h.nome || "Sem nome"}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => { setLinhas(null); carregarEquipes(escolhido); carregarMentores(); }} className={btnSecundario}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
          <Link href={`/admin/mentoria/marcos${escolhido ? `?hackathon_id=${escolhido}` : ""}`} className={`${btnSecundario} whitespace-nowrap`}>
            <CalendarClock className="h-4 w-4" aria-hidden="true" /> Calendário de entregas
          </Link>
        </div>
      </header>

      {/* Resumo */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">Equipes sem mentor</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{linhas ? semMentor : "—"}</p>
          <p className="text-xs text-gray-500">de {linhas ? linhas.length : "—"} aprovadas</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">Mentores ativos</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{ativos.length}</p>
          <p className="text-xs text-gray-500">
            {vagasLivres} {vagasLivres === 1 ? "vaga livre" : "vagas livres"} ·{" "}
            <Link href="/admin/mentores" className="font-semibold text-emerald-700 hover:underline">gerenciar</Link>
          </p>
        </div>
        <div className={`rounded-2xl border p-4 ${treinamentoOk ? "border-emerald-100 bg-white" : "border-amber-200 bg-amber-50"}`}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <GraduationCap className="h-4 w-4" aria-hidden="true" /> Treinamento dos mentores
          </p>
          {treinamento === null ? (
            <p className="mt-1 text-sm text-gray-500">—</p>
          ) : treinamentoOk ? (
            <p className="mt-1 text-sm font-semibold text-emerald-800">Concluído em {dataHora(treinamento.treinamento_concluido_em)}</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-amber-900">Pendente: mentores só podem ser atribuídos depois dele.</p>
              {ehOrganizador &&
                (confirmandoTreino ? (
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={concluirTreinamento} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer">
                      Confirmar: o treinamento já aconteceu
                    </button>
                    <button type="button" onClick={() => setConfirmandoTreino(false)} className="text-xs font-semibold text-gray-600 cursor-pointer">Cancelar</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmandoTreino(true)} className="mt-2 text-xs font-bold text-amber-900 underline cursor-pointer">
                    Marcar como concluído
                  </button>
                ))}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {mensagem && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {mensagem}
          </p>
        )}
        {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      </div>

      {/* Equipes */}
      <section className="mt-4 rounded-3xl border border-gray-200 bg-white p-4 sm:p-6" aria-label="Equipes aprovadas">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-gray-900">Equipes aprovadas</h2>
          {!!linhas?.length && (
            <label className="relative">
              <span className="sr-only">Buscar equipe</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar equipe ou proposta"
                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none sm:w-72"
              />
            </label>
          )}
        </div>

        {!podeAtribuir ? (
          <p className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-700">
            A atribuição de mentores é do Comitê Científico e da organização.
          </p>
        ) : !escolhido && hackathons !== null ? (
          <p className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-600">Cadastre um hackathon para começar.</p>
        ) : linhas === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-50" />)}
          </div>
        ) : linhas.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-8 text-center">
            <Handshake className="mx-auto h-10 w-10 text-emerald-300" aria-hidden="true" />
            <p className="mt-3 font-bold text-gray-900">{homologado ? "Nenhuma proposta aprovada" : "Resultado ainda não homologado"}</p>
            <p className="mt-1 text-sm text-gray-600">
              {homologado
                ? "Só equipes com proposta aprovada recebem mentor."
                : "Os mentores são distribuídos depois que o resultado das propostas é homologado."}{" "}
              {!homologado && (
                <Link href={`/admin/resultado?hackathon_id=${escolhido}`} className="font-semibold text-emerald-700 hover:underline">Ver resultado</Link>
              )}
            </p>
          </div>
        ) : visiveis.length === 0 ? (
          <p className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-600">Nenhuma equipe encontrada com essa busca.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visiveis.map((l) => {
              const mentorAtual = l.atual ? mentores.find((m) => m.id === l.atual!.mentor_id) : null;
              const aberta = acao?.equipeId === l.equipe_id ? acao.tipo : null;
              const alternar = (tipo: NonNullable<Acao>["tipo"]) =>
                setAcao(aberta === tipo ? null : { equipeId: l.equipe_id, tipo });
              return (
                <li key={l.equipe_id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 lg:w-1/3">
                      <p className="font-semibold text-gray-900">{l.equipe_nome || "Equipe sem nome"}</p>
                      <p className="truncate text-xs text-gray-500">{[l.titulo, l.tema_titulo].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {l.atual ? (
                        <>
                          <Avatar nome={nomeMentor(mentorAtual)} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {nomeMentor(mentorAtual)}
                              {mentorAtual && !mentorAtual.ativo && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                  <AlertTriangle className="h-3 w-3" aria-hidden="true" /> desativado
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {[mentorAtual?.empresa_parceira, mentorAtual?.area_atuacao].filter(Boolean).join(" · ")} · desde {dataHora(l.atual.atribuido_em)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Sem mentor</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {l.atual ? (
                        <>
                          <button type="button" onClick={() => alternar("trocar")} aria-expanded={aberta === "trocar"} className={btnSecundario}>Trocar</button>
                          <button type="button" onClick={() => alternar("encerrar")} aria-expanded={aberta === "encerrar"} className={btnPerigo}>Encerrar</button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alternar("atribuir")}
                          aria-expanded={aberta === "atribuir"}
                          disabled={!treinamentoOk}
                          title={treinamentoOk ? undefined : "Confirme o treinamento dos mentores primeiro"}
                          className={btnPrimario}
                        >
                          <UserPlus className="h-4 w-4" aria-hidden="true" /> Atribuir mentor
                        </button>
                      )}
                      <button type="button" onClick={() => alternar("historico")} aria-expanded={aberta === "historico"} aria-label="Histórico" title="Histórico" className={btnSecundario}>
                        <History className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <Link
                        href={`/admin/mentoria/equipes/${l.equipe_id}?hackathon_id=${escolhido}`}
                        aria-label={`Entregas de ${l.equipe_nome || "Equipe sem nome"}`}
                        title="Entregas da equipe"
                        className={btnSecundario}
                      >
                        <ClipboardList className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                  {aberta === "historico" && <Historico equipeId={l.equipe_id} mentores={mentores} />}
                  {aberta && aberta !== "historico" && (
                    <FormAcao linha={l} tipo={aberta} mentores={mentores} onFeito={feito} onCancelar={() => setAcao(null)} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
