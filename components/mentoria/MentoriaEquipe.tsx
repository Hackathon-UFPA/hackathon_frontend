"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Lock, Send, Users } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { MentorEquipe } from "@/components/modulo-c/MentorEquipe";
import { btnPrimario, btnSecundario, campo, rotulo } from "@/components/mentores/ui";
import { ApiError, type PainelEquipeNormalizado } from "@/lib/api";
import {
  entregas as entregasApi,
  formatarPrazo,
  lerReferencias,
  marcos as marcosApi,
  ordenarCalendario,
  tempoAtePrazo,
  type Entrega,
  type Marco,
  type SituacaoMarco,
} from "@/lib/api-mentoria";
import { BarraProgresso, CalendarioMarcos, EstadoVazio, useAgora, progressoEntregas } from "./CalendarioMarcos";

const LIMITE_DESCRICAO = 20000;

/** Formulário do líder para registrar a entrega de um marco parcial. O registro não pode ser editado depois. */
function FormEntrega({
  equipeId,
  marco,
  onEnviada,
  onCancelar,
}: {
  equipeId: string;
  marco: Marco;
  onEnviada: (e: Entrega) => void;
  onCancelar: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [links, setLinks] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const { links: referencias, erro: erroLinks } = lerReferencias(links);
  const idBase = `entrega-${marco.id}`;

  const revisar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || erroLinks) return;
    setConfirmando(true);
  };

  const enviar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      onEnviada(await entregasApi.registrar(equipeId, { marco_id: marco.id, descricao: descricao.trim(), referencias }));
    } catch (err) {
      setErro(err);
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={revisar} className="mt-4 space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
      {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      <div>
        <label htmlFor={`${idBase}-desc`} className={rotulo}>
          O que a equipe entrega neste marco
        </label>
        <textarea
          id={`${idBase}-desc`}
          required
          rows={5}
          maxLength={LIMITE_DESCRICAO}
          disabled={confirmando}
          className={campo}
          placeholder="Conte o que foi feito, o que já funciona e o que ainda falta."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${idBase}-links`} className={rotulo}>
          Links do material (opcional, um por linha)
        </label>
        <textarea
          id={`${idBase}-links`}
          rows={2}
          disabled={confirmando}
          aria-invalid={!!erroLinks}
          aria-describedby={`${idBase}-links-ajuda`}
          className={`${campo} ${erroLinks ? "border-red-400" : ""}`}
          placeholder="https://github.com/sua-equipe/projeto"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
        />
        <p id={`${idBase}-links-ajuda`} className={`mt-1 text-xs ${erroLinks ? "text-red-700" : "text-gray-500"}`}>
          {erroLinks ?? "Repositório, vídeo, protótipo ou documento. Só links que começam com https://."}
        </p>
      </div>

      {confirmando ? (
        <div role="alertdialog" aria-labelledby={`${idBase}-conf`} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p id={`${idBase}-conf`} className="text-sm font-semibold text-amber-900">
            Depois de enviada, a entrega não pode ser editada nem reenviada.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            O mentor e a organização passam a ver este registro. Confira o texto e os {referencias.length}{" "}
            {referencias.length === 1 ? "link" : "links"} antes de confirmar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={enviar} disabled={enviando} className={btnPrimario} autoFocus>
              <Send className="h-4 w-4" aria-hidden="true" /> {enviando ? "Enviando..." : "Confirmar envio"}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className={btnSecundario}>
              Voltar e editar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!descricao.trim() || !!erroLinks} className={btnPrimario}>
            <Send className="h-4 w-4" aria-hidden="true" /> Enviar entrega
          </button>
          <button type="button" onClick={onCancelar} className={btnSecundario}>
            Cancelar
          </button>
          <span className="text-xs text-gray-500">Prazo: {formatarPrazo(marco.data_limite)}</span>
        </div>
      )}
    </form>
  );
}

/** Aba "Mentoria & entregas" do painel da equipe: mentor, calendário de marcos e entregas parciais (RF38, RF39). */
export function MentoriaEquipe({ painel }: { painel: PainelEquipeNormalizado }) {
  const [marcos, setMarcos] = useState<Marco[] | null>(null);
  const [lista, setLista] = useState<Entrega[]>([]);
  const [semAcesso, setSemAcesso] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const agora = useAgora();

  const homologada = painel.situacao === "HOMOLOGADA";

  const carregar = useCallback(
    () =>
      Promise.all([marcosApi.listar(painel.hackathon_id), entregasApi.listar(painel.equipe_id)])
        .then(([ms, es]) => {
          setMarcos(ordenarCalendario(ms));
          setLista(es);
          setSemAcesso(false);
          setErro(null);
        })
        .catch((e: unknown) => {
          // 403: a equipe ainda não pode ver o calendário (proposta não aprovada no resultado).
          if (e instanceof ApiError && e.status === 403) setSemAcesso(true);
          else setErro(e);
          setMarcos([]);
        }),
    [painel.hackathon_id, painel.equipe_id]
  );

  useEffect(() => {
    if (homologada) carregar();
  }, [homologada, carregar]);

  const porMarco = useMemo(() => new Map(lista.map((e) => [e.marco_id, e])), [lista]);
  const nomes = useMemo(
    () => new Map(painel.integrantes.filter((i) => i.usuario_id).map((i) => [i.usuario_id as string, i.nome])),
    [painel.integrantes]
  );
  const progresso = marcos ? progressoEntregas(marcos, porMarco, agora) : null;

  const acao = (marco: Marco, situacao: SituacaoMarco) => {
    if (situacao !== "ABERTO" && situacao !== "PRAZO_PROXIMO") return null;
    if (!painel.voce_e_lider) {
      return (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Quem registra a entrega é o líder técnico da equipe.
        </p>
      );
    }
    if (abertoId === marco.id) {
      return (
        <FormEntrega
          equipeId={painel.equipe_id}
          marco={marco}
          onCancelar={() => setAbertoId(null)}
          onEnviada={(nova) => {
            setLista((atual) => [nova, ...atual]);
            setAbertoId(null);
            setAviso(`Entrega de "${marco.titulo}" registrada. O mentor da equipe já pode ver.`);
          }}
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setAbertoId(marco.id);
          setAviso(null);
        }}
        // Só o próximo prazo ganha o botão principal; os demais ficam discretos.
        className={`${marco.id === progresso?.proximo?.id ? btnPrimario : btnSecundario} mt-4`}
      >
        <Send className="h-4 w-4" aria-hidden="true" /> Registrar entrega
      </button>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section
        aria-labelledby="titulo-calendario"
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-6">
          <h2 id="titulo-calendario" className="text-lg font-extrabold text-gray-900">
            Calendário de entregas
          </h2>
          <p className="mt-1 max-w-prose text-sm text-gray-600">
            Os prazos valem para todas as equipes da edição. Cada marco aceita um envio, até o horário do prazo.
          </p>
          {/* Resumo compacto no celular; no desktop o resumo completo fica na coluna lateral. */}
          {progresso && progresso.total > 0 && (
            <div className="mt-4 flex items-center gap-3 lg:hidden">
              <BarraProgresso feitas={progresso.feitas} total={progresso.total} />
              <span className="shrink-0 text-xs font-semibold text-gray-700">
                {progresso.feitas} de {progresso.total} entregues
              </span>
            </div>
          )}
        </div>

        {aviso && (
          <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            {aviso}
          </p>
        )}
        {erro !== null && (
          <div className="mb-5">
            <ApiErrorAlert erro={erro} onRetry={carregar} onClose={() => setErro(null)} />
          </div>
        )}

        {!homologada ? (
          <EstadoVazio icone={Lock} titulo="O calendário abre depois da homologação">
            A equipe vê os marcos de entrega quando estiver homologada e com a proposta aprovada no resultado. Acompanhe as
            pendências na Visão Geral.
          </EstadoVazio>
        ) : semAcesso ? (
          <EstadoVazio icone={Lock} titulo="Calendário disponível só para equipes aprovadas">
            Sua equipe está homologada, mas o calendário de entregas aparece quando a proposta é aprovada no resultado da
            edição. Confira a aba Resultado Científico.
          </EstadoVazio>
        ) : marcos === null ? (
          <div className="space-y-6" aria-busy="true" aria-label="Carregando calendário">
            {[0, 1, 2].map((i) => (
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
          erro === null && (
            <EstadoVazio icone={CalendarClock} titulo="Nenhum marco publicado ainda">
              O Comitê Científico define as datas das entregas parciais. Elas aparecem aqui assim que forem cadastradas.
            </EstadoVazio>
          )
        ) : (
          <CalendarioMarcos agora={agora} marcos={marcos} entregas={porMarco} acao={acao} autor={(id) => nomes.get(id)} />
        )}
      </section>

      <aside className="space-y-4">
        {progresso && progresso.total > 0 && (
          <section aria-labelledby="titulo-progresso" className="hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm lg:block">
            <h2 id="titulo-progresso" className="text-sm font-bold text-gray-900">
              Entregas parciais
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">
              {progresso.feitas}
              <span className="text-base font-semibold text-gray-500"> de {progresso.total}</span>
            </p>
            <div className="mt-3">
              <BarraProgresso feitas={progresso.feitas} total={progresso.total} />
            </div>
            {progresso.proximo ? (
              <p className="mt-3 text-xs text-gray-600">
                Próximo prazo: <strong className="font-semibold text-gray-900">{progresso.proximo.titulo}</strong>,{" "}
                {tempoAtePrazo(progresso.proximo.data_limite, agora)}.
              </p>
            ) : (
              <p className="mt-3 text-xs text-gray-600">Nenhum prazo parcial em aberto.</p>
            )}
            {progresso.perdidas > 0 && (
              <p className="mt-1 text-xs text-red-700">
                {progresso.perdidas} {progresso.perdidas === 1 ? "marco encerrou" : "marcos encerraram"} sem entrega.
              </p>
            )}
          </section>
        )}

        <MentorEquipe key={painel.equipe_id} equipeId={painel.equipe_id} />

        <section className="rounded-2xl border border-gray-200 bg-white p-5 text-xs text-gray-600 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="h-4 w-4 text-emerald-700" aria-hidden="true" /> Como funciona
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>{painel.voce_e_lider ? "Você é o líder técnico: só você registra as entregas." : "O líder técnico registra as entregas; todos os integrantes acompanham."}</li>
            <li>O mentor da equipe vê cada entrega assim que ela é enviada.</li>
            <li>Um envio por marco. Ele não pode ser alterado depois.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
