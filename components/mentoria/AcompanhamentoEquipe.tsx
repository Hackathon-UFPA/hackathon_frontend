"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Lock, RefreshCw } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { btnSecundario } from "@/components/mentores/ui";
import { ApiError } from "@/lib/api";
import {
  entregas as entregasApi,
  marcos as marcosApi,
  ordenarCalendario,
  tempoAtePrazo,
  type Entrega,
  type Marco,
} from "@/lib/api-mentoria";
import { BarraProgresso, CalendarioMarcos, EstadoVazio, useAgora, progressoEntregas } from "./CalendarioMarcos";

/**
 * Visão de quem acompanha a equipe (mentor vigente ou gestão): marcos da edição e o que a
 * equipe já enviou. Somente leitura: o envio é do líder técnico.
 */
export function AcompanhamentoEquipe({
  equipeId,
  hackathonId,
  textoSemAcesso,
}: {
  equipeId: string;
  hackathonId: string;
  textoSemAcesso: string;
}) {
  const [marcos, setMarcos] = useState<Marco[] | null>(null);
  const [lista, setLista] = useState<Entrega[]>([]);
  const [semAcesso, setSemAcesso] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const agora = useAgora();

  const carregar = useCallback(
    () =>
      Promise.all([marcosApi.listar(hackathonId), entregasApi.listar(equipeId)])
        .then(([ms, es]) => {
          setMarcos(ordenarCalendario(ms));
          setLista(es);
          setSemAcesso(false);
          setErro(null);
        })
        .catch((e: unknown) => {
          if (e instanceof ApiError && e.status === 403) setSemAcesso(true);
          else setErro(e);
          setMarcos([]);
        }),
    [equipeId, hackathonId]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const porMarco = useMemo(() => new Map(lista.map((e) => [e.marco_id, e])), [lista]);
  const progresso = marcos ? progressoEntregas(marcos, porMarco, agora) : null;
  const ultima = lista[0];

  return (
    <div className="space-y-6">
      {progresso && progresso.total > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-semibold text-gray-500">Entregas parciais</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {progresso.feitas}
              <span className="text-sm font-semibold text-gray-500"> de {progresso.total}</span>
            </p>
            <div className="mt-2">
              <BarraProgresso feitas={progresso.feitas} total={progresso.total} />
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-semibold text-gray-500">Próximo prazo</p>
            {progresso.proximo ? (
              <>
                <p className="mt-1 truncate text-base font-bold text-gray-900">{progresso.proximo.titulo}</p>
                <p className="text-xs text-gray-600">{tempoAtePrazo(progresso.proximo.data_limite, agora)}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-600">Nenhum prazo parcial em aberto.</p>
            )}
          </div>
          <div className={`rounded-2xl border bg-white p-4 ${progresso.perdidas ? "border-red-200" : "border-emerald-100"}`}>
            <p className="text-xs font-semibold text-gray-500">Marcos sem entrega</p>
            <p className={`mt-1 text-2xl font-extrabold ${progresso.perdidas ? "text-red-700" : "text-gray-900"}`}>
              {progresso.perdidas}
            </p>
            <p className="text-xs text-gray-600">
              {ultima ? `Último envio ${tempoAtePrazo(ultima.enviado_em, agora).replace("encerrou há", "há")}` : "Nenhum envio ainda"}
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="titulo-entregas" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-entregas" className="text-lg font-extrabold text-gray-900">
              Marcos e entregas da equipe
            </h2>
            <p className="mt-1 max-w-prose text-sm text-gray-600">
              Cada marco mostra o que a equipe enviou e quando. O envio é feito pelo líder técnico e não muda depois.
            </p>
          </div>
          <button type="button" onClick={() => { setMarcos(null); carregar(); }} className={btnSecundario}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
        </div>

        {erro !== null && (
          <div className="mb-5">
            <ApiErrorAlert erro={erro} onRetry={carregar} onClose={() => setErro(null)} />
          </div>
        )}

        {semAcesso ? (
          <EstadoVazio icone={Lock} titulo="Sem acesso às entregas desta equipe">
            {textoSemAcesso}
          </EstadoVazio>
        ) : marcos === null ? (
          <div className="space-y-6" aria-busy="true" aria-label="Carregando entregas">
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
            <EstadoVazio icone={CalendarClock} titulo="A edição ainda não tem marcos">
              Quando o Comitê Científico publicar o calendário de entregas, os marcos aparecem aqui com o que a equipe
              enviou em cada um.
            </EstadoVazio>
          )
        ) : (
          <CalendarioMarcos
            agora={agora}
            marcos={marcos}
            entregas={porMarco}
            acao={(_, situacao) =>
              situacao === "ABERTO" || situacao === "PRAZO_PROXIMO" ? (
                <p className="mt-3 text-xs text-gray-500">Aguardando o envio da equipe.</p>
              ) : null
            }
          />
        )}
      </section>
    </div>
  );
}
