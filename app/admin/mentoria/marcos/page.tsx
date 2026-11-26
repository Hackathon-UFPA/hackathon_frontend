"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, CalendarPlus, Flag, Pencil, RefreshCw, Trash2 } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { btnPerigo, btnPrimario, btnSecundario, campo, rotulo, useHackathonsDaOrganizacao } from "@/components/mentores/ui";
import { CalendarioMarcos, EstadoVazio, useAgora } from "@/components/mentoria/CalendarioMarcos";
import { ApiError, type HackathonResponse } from "@/lib/api";
import { mentoria, type Treinamento } from "@/lib/api-mentores";
import {
  formatarPrazo,
  isoParaLocal,
  localParaIso,
  marcosAdmin,
  ordenarCalendario,
  type Marco,
  type MarcoEditar,
  type TipoMarco,
} from "@/lib/api-mentoria";
import { useSession } from "@/lib/useSession";

type Rascunho = { titulo: string; descricao: string; prazo: string; ordem: string; tipo: TipoMarco };
const VAZIO: Rascunho = { titulo: "", descricao: "", prazo: "", ordem: "0", tipo: "PARCIAL" };

const paraRascunho = (m: Marco): Rascunho => ({
  titulo: m.titulo,
  descricao: m.descricao,
  prazo: isoParaLocal(m.data_limite),
  ordem: String(m.ordem),
  tipo: m.tipo,
});

/** Formulário de marco: cria (sem `marco`) ou edita só os campos alterados. */
function FormMarco({
  hackathonId,
  marco,
  temFinal,
  onSalvo,
  onCancelar,
}: {
  hackathonId: string;
  marco?: Marco;
  temFinal: boolean;
  onSalvo: (m: Marco, texto: string) => void;
  onCancelar?: () => void;
}) {
  const [r, setR] = useState<Rascunho>(marco ? paraRascunho(marco) : VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const id = marco ? `editar-${marco.id}` : "novo-marco";
  const muda = (campoNome: keyof Rascunho) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setR((atual) => ({ ...atual, [campoNome]: e.target.value }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const dados = {
        titulo: r.titulo.trim(),
        descricao: r.descricao.trim(),
        data_limite: localParaIso(r.prazo),
        ordem: Number(r.ordem) || 0,
        tipo: r.tipo,
      };
      if (!marco) {
        const novo = await marcosAdmin.criar(hackathonId, dados);
        setR(VAZIO);
        onSalvo(novo, `Marco "${novo.titulo}" publicado. As equipes aprovadas e os mentores já veem o prazo.`);
        return;
      }
      const original = paraRascunho(marco);
      const mudou: MarcoEditar = {};
      if (r.titulo !== original.titulo) mudou.titulo = dados.titulo;
      if (r.descricao !== original.descricao) mudou.descricao = dados.descricao;
      if (r.prazo !== original.prazo) mudou.data_limite = dados.data_limite;
      if (r.ordem !== original.ordem) mudou.ordem = dados.ordem;
      if (r.tipo !== original.tipo) mudou.tipo = dados.tipo;
      const salvo = Object.keys(mudou).length ? await marcosAdmin.editar(hackathonId, marco.id, mudou) : marco;
      onSalvo(salvo, `Marco "${salvo.titulo}" atualizado.`);
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={salvar} className="space-y-4" aria-label={marco ? `Editar ${marco.titulo}` : "Novo marco"}>
      {erro !== null && (
        <ApiErrorAlert
          erro={
            erro instanceof ApiError && erro.status === 409
              ? new ApiError(409, `${erro.message} Ajuste o prazo ou a ordem e tente de novo.`)
              : erro
          }
          onClose={() => setErro(null)}
        />
      )}
      <div>
        <label htmlFor={`${id}-titulo`} className={rotulo}>Título</label>
        <input id={`${id}-titulo`} required maxLength={255} className={campo} value={r.titulo} onChange={muda("titulo")} placeholder="Protótipo navegável" />
      </div>
      <div>
        <label htmlFor={`${id}-desc`} className={rotulo}>O que a equipe deve entregar</label>
        <textarea
          id={`${id}-desc`}
          required
          rows={4}
          maxLength={20000}
          className={campo}
          value={r.descricao}
          onChange={muda("descricao")}
          placeholder="Descreva o fluxo principal e o que já funciona."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <div>
          <label htmlFor={`${id}-prazo`} className={rotulo}>Prazo (horário de Belém)</label>
          <input id={`${id}-prazo`} type="datetime-local" required className={campo} value={r.prazo} onChange={muda("prazo")} />
        </div>
        <div>
          <label htmlFor={`${id}-ordem`} className={rotulo}>Ordem</label>
          <input
            id={`${id}-ordem`}
            type="number"
            min={0}
            step={1}
            className={campo}
            value={r.ordem}
            onChange={muda("ordem")}
            aria-describedby={`${id}-ordem-ajuda`}
          />
        </div>
      </div>
      <p id={`${id}-ordem-ajuda`} className="-mt-2 text-xs text-gray-500">
        A ordem só desempata marcos com o mesmo prazo. O envio vale até o minuto do prazo, inclusive.
      </p>
      <fieldset>
        <legend className={rotulo}>Tipo</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {(["PARCIAL", "FINAL"] as const).map((tipo) => {
            const bloqueado = tipo === "FINAL" && temFinal && marco?.tipo !== "FINAL";
            return (
              <label
                key={tipo}
                className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-600 ${
                  bloqueado ? "cursor-not-allowed opacity-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-tipo`}
                  value={tipo}
                  checked={r.tipo === tipo}
                  disabled={bloqueado}
                  onChange={() => setR((atual) => ({ ...atual, tipo }))}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>
                  <span className="block font-semibold text-gray-900">{tipo === "PARCIAL" ? "Entrega parcial" : "Entrega final"}</span>
                  <span className="block text-xs text-gray-600">
                    {tipo === "PARCIAL"
                      ? "O líder registra um envio até o prazo."
                      : bloqueado
                        ? "A edição já tem um marco final."
                        : "Último marco, reservado à submissão final."}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className={btnPrimario}>
          {marco ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <CalendarPlus className="h-4 w-4" aria-hidden="true" />}
          {enviando ? "Salvando..." : marco ? "Salvar alterações" : "Publicar marco"}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} disabled={enviando} className={btnSecundario}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

/** Comitê Científico e Organizador: calendário comum de entregas da edição (RF65, RN17, RN29). */
export default function MarcosMentoriaPage() {
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const hackathons = useHackathonsDaOrganizacao(user);
  const [hackathonId, setHackathonId] = useState("");
  const [marcos, setMarcos] = useState<Marco[] | null>(null);
  const [treinamento, setTreinamento] = useState<Treinamento | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [erroExclusao, setErroExclusao] = useState<{ id: string; erro: unknown } | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const agora = useAgora();

  const escolhido =
    hackathonId ||
    (() => {
      if (!hackathons?.length) return "";
      const pedido = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("hackathon_id") : null;
      if (pedido && hackathons.some((h) => h.id === pedido)) return pedido;
      return (hackathons.find((h) => h.status === "ATIVO" || h.status === "EM_AVALIACAO") ?? hackathons[0]).id;
    })();
  const edicao: HackathonResponse | undefined = hackathons?.find((h) => h.id === escolhido);
  const encerrada = edicao?.status === "FINALIZADO" || edicao?.status === "CANCELADO";

  const carregar = useCallback((id: string) => {
    if (!id) return;
    mentoria.treinamento(id).then(setTreinamento).catch(() => setTreinamento(null));
    marcosAdmin
      .listar(id)
      .then((l) => setMarcos(ordenarCalendario(l)))
      .catch((e: unknown) => {
        setErro(e);
        setMarcos([]);
      });
  }, []);

  useEffect(() => {
    carregar(escolhido);
  }, [escolhido, carregar]);

  if (!pronto) return null;

  const trocarHackathon = (id: string) => {
    setHackathonId(id);
    setMarcos(null);
    setEditando(null);
    setExcluindo(null);
    setErroExclusao(null);
    setMensagem(null);
    setErro(null);
  };

  const salvo = (m: Marco, texto: string) => {
    setMarcos((atual) => ordenarCalendario([...(atual ?? []).filter((x) => x.id !== m.id), m]));
    setEditando(null);
    setMensagem(texto);
  };

  const excluir = async (m: Marco) => {
    setErroExclusao(null);
    try {
      await marcosAdmin.excluir(escolhido, m.id);
      setMarcos((atual) => (atual ?? []).filter((x) => x.id !== m.id));
      setExcluindo(null);
      setMensagem(`Marco "${m.titulo}" excluído.`);
    } catch (e) {
      setErroExclusao({ id: m.id, erro: e });
      setExcluindo(null);
    }
  };

  const temFinal = (marcos ?? []).some((m) => m.tipo === "FINAL");
  const treinamentoOk = !!treinamento?.treinamento_concluido_em;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin/mentoria" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Mentoria das equipes
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
            <CalendarClock className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Calendário de entregas</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-600">
              Os marcos valem para todas as equipes aprovadas da edição. O líder de cada equipe registra uma entrega por
              marco, e o mentor acompanha o que foi enviado.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
          <button type="button" onClick={() => { setMarcos(null); carregar(escolhido); }} className={btnSecundario}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
        </div>
      </header>

      {mensagem && (
        <p role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {mensagem}
        </p>
      )}
      {erro !== null && (
        <div className="mt-6">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="titulo-marcos" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="titulo-marcos" className="mb-6 text-lg font-extrabold text-gray-900">
            Marcos da edição{marcos && marcos.length > 0 ? ` (${marcos.length})` : ""}
          </h2>
          {!escolhido && hackathons !== null ? (
            <EstadoVazio icone={CalendarClock} titulo="Escolha um hackathon">
              Selecione a edição no topo da página para ver e cadastrar os marcos.
            </EstadoVazio>
          ) : marcos === null || !escolhido ? (
            <div className="space-y-6" aria-busy="true" aria-label="Carregando marcos">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : marcos.length === 0 ? (
            <EstadoVazio icone={CalendarClock} titulo="Nenhum marco cadastrado">
              {encerrada
                ? "Esta edição foi encerrada sem marcos de entrega."
                : "Publique o primeiro marco no formulário ao lado. As equipes aprovadas passam a ver o prazo na aba Mentoria & Entregas."}
            </EstadoVazio>
          ) : (
            <CalendarioMarcos
              agora={agora}
              marcos={marcos}
              ocultarSituacao
              textoFinal="Reservado para a submissão final do projeto."
              acao={(m) =>
                editando === m.id ? (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <FormMarco
                      hackathonId={escolhido}
                      marco={m}
                      temFinal={temFinal}
                      onSalvo={salvo}
                      onCancelar={() => setEditando(null)}
                    />
                  </div>
                ) : excluindo === m.id ? (
                  <div role="alertdialog" aria-labelledby={`exc-${m.id}`} className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-4">
                    <p id={`exc-${m.id}`} className="text-sm font-semibold text-red-800">
                      Excluir &quot;{m.titulo}&quot;? O marco some do calendário das equipes.
                    </p>
                    <p className="mt-1 text-xs text-gray-600">Marcos que já receberam entregas não podem ser excluídos.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => excluir(m)} className={btnPerigo} autoFocus>
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir marco
                      </button>
                      <button type="button" onClick={() => setExcluindo(null)} className={btnSecundario}>
                        Manter
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                  {erroExclusao?.id === m.id && (
                    <div className="mt-3">
                      <ApiErrorAlert erro={erroExclusao.erro} onClose={() => setErroExclusao(null)} />
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {m.tipo === "FINAL" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-800">
                        <Flag className="h-3 w-3" aria-hidden="true" /> Entrega final
                      </span>
                    )}
                    {m.ordem > 0 && <span className="text-xs text-gray-500">Ordem {m.ordem}</span>}
                    {!encerrada && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditando(m.id); setExcluindo(null); setMensagem(null); }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-600"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar<span className="sr-only"> {m.titulo}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setExcluindo(m.id); setEditando(null); setMensagem(null); }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Excluir<span className="sr-only"> {m.titulo}</span>
                        </button>
                      </>
                    )}
                  </div>
                  </>
                )
              }
            />
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          {escolhido && !encerrada && (
            <section aria-labelledby="titulo-novo" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 id="titulo-novo" className="mb-4 text-base font-bold text-gray-900">Novo marco</h2>
              <FormMarco key={escolhido} hackathonId={escolhido} temFinal={temFinal} onSalvo={salvo} />
            </section>
          )}

          {edicao && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 text-xs text-gray-600 shadow-sm">
              <p className="text-sm font-bold text-gray-900">Regras do calendário</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4">
                {encerrada && <li className="font-semibold text-amber-800">Edição encerrada: o calendário fica só para consulta.</li>}
                <li>
                  O prazo precisa ficar dentro da edição
                  {edicao.data_inicio && edicao.data_fim
                    ? ` (${formatarPrazo(edicao.data_inicio)} a ${formatarPrazo(edicao.data_fim)})`
                    : ""}
                  {edicao.propostas_fim ? ` e depois do fim das propostas (${formatarPrazo(edicao.propostas_fim)})` : ""}.
                </li>
                <li>
                  {treinamentoOk ? (
                    <>Treinamento dos mentores concluído em {formatarPrazo(treinamento!.treinamento_concluido_em!)}; os prazos precisam vir depois dessa data.</>
                  ) : (
                    <>
                      As equipes só enviam entregas depois que o treinamento dos mentores é concluído.{" "}
                      <Link href="/admin/treinamento" className="font-semibold text-emerald-700 hover:underline">Ver treinamento</Link>
                    </>
                  )}
                </li>
                <li>Um marco que já recebeu entregas só pode ter o prazo prorrogado, e não pode ser excluído.</li>
                <li>O marco final fica sempre por último.</li>
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
