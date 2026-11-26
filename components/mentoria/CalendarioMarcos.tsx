"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CheckCircle2, Clock, ExternalLink, Flag, Hourglass, Link2, XCircle } from "lucide-react";
import {
  dataUtc,
  diaDoPrazo,
  formatarPrazo,
  mesDoPrazo,
  situacaoMarco,
  tempoAtePrazo,
  type Entrega,
  type Marco,
  type SituacaoMarco,
} from "@/lib/api-mentoria";

/** Horário atual, renovado a cada minuto: um marco aberto vira "sem entrega" no prazo sem recarregar a página. */
export function useAgora(intervaloMs = 60_000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

/* Cada situação tem uma cor do sistema (remapeada no tema escuro pelo globals.css). */
const VISUAL: Record<
  SituacaoMarco,
  { rotulo: string; badge: string; no: string; icone: typeof Clock }
> = {
  ENTREGUE: {
    rotulo: "Entregue",
    badge: "bg-emerald-100 text-emerald-800",
    no: "border-emerald-600 bg-emerald-600 text-white",
    icone: CheckCircle2,
  },
  ABERTO: {
    rotulo: "Aberto",
    badge: "bg-gray-100 text-gray-700",
    no: "border-emerald-500 bg-white text-emerald-700",
    icone: Clock,
  },
  PRAZO_PROXIMO: {
    rotulo: "Prazo próximo",
    badge: "bg-amber-100 text-amber-800",
    no: "border-amber-500 bg-amber-50 text-amber-700",
    icone: Hourglass,
  },
  ENCERRADO: {
    rotulo: "Sem entrega",
    badge: "bg-red-100 text-red-800",
    no: "border-red-300 bg-white text-red-600",
    icone: XCircle,
  },
  FINAL: {
    rotulo: "Entrega final",
    badge: "bg-violet-100 text-violet-800",
    no: "border-violet-400 bg-violet-50 text-violet-700",
    icone: Flag,
  },
};

const NO_NEUTRO = { ...VISUAL.ABERTO, no: "border-gray-300 bg-gray-50 text-gray-500", icone: CalendarCheck };

export function SituacaoMarcoBadge({ situacao }: { situacao: SituacaoMarco }) {
  const v = VISUAL[situacao];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${v.badge}`}>
      {v.rotulo}
    </span>
  );
}

function rotuloLink(url: string) {
  try {
    const u = new URL(url);
    const caminho = u.pathname.replace(/\/$/, "");
    return `${u.hostname.replace(/^www\./, "")}${caminho.length > 28 ? `${caminho.slice(0, 28)}…` : caminho}`;
  } catch {
    return url;
  }
}

/** Registro enviado pela equipe: texto, links e o momento do envio. */
export function EntregaRegistrada({
  entrega,
  marco,
  autor,
}: {
  entrega: Entrega;
  marco: Marco;
  autor?: string | null;
}) {
  const prorrogado =
    dataUtc(entrega.data_limite_no_envio).getTime() !== dataUtc(marco.data_limite).getTime();
  return (
    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
      <p className="text-xs text-gray-600">
        Enviada {autor ? <>por <strong className="font-semibold text-gray-900">{autor}</strong> </> : null}
        em {formatarPrazo(entrega.enviado_em)}
        {prorrogado && <> · prazo no envio: {formatarPrazo(entrega.data_limite_no_envio)}</>}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800">{entrega.descricao}</p>
      {entrega.referencias.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Links da entrega">
          {entrega.referencias.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{rotuloLink(url)}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Linha do tempo dos marcos da edição, com a entrega da equipe em cada um.
 * `acao` desenha o que cabe a quem está vendo (formulário do líder, botões da gestão).
 */
export function CalendarioMarcos({
  marcos,
  entregas,
  acao,
  autor,
  textoFinal = "Reservado para a submissão final do projeto, que abre em uma próxima etapa.",
  ocultarSituacao = false,
  agora,
}: {
  marcos: Marco[];
  /** Entregas da equipe por marco_id. Ausente = visão da gestão, sem equipe. */
  entregas?: Map<string, Entrega>;
  acao?: (marco: Marco, situacao: SituacaoMarco) => ReactNode;
  autor?: (usuarioId: string) => string | null | undefined;
  textoFinal?: string;
  ocultarSituacao?: boolean;
  /** Instante de referência (use useAgora()). */
  agora: number;
}) {

  return (
    <ol className="relative">
      {marcos.map((marco, i) => {
        const entrega = entregas?.get(marco.id);
        const situacao = situacaoMarco(marco, entrega, agora);
        const ultimo = i === marcos.length - 1;
        const passou = dataUtc(marco.data_limite).getTime() < agora;
        // Sem equipe (visão da gestão), "sem entrega" não se aplica: prazo vencido fica neutro.
        const v = !entregas && situacao === "ENCERRADO" ? NO_NEUTRO : VISUAL[situacao];
        const Icone = v.icone;

        return (
          <li key={marco.id} className="relative grid grid-cols-[3.25rem_1.75rem_1fr] gap-x-3 sm:grid-cols-[4rem_2rem_1fr] sm:gap-x-4">
            {/* Data do prazo, como uma folha de calendário */}
            <div
              className={`flex h-14 flex-col items-center justify-center rounded-xl border text-center sm:h-16 ${
                passou ? "border-gray-200 bg-gray-50 text-gray-500" : "border-emerald-100 bg-white text-gray-900"
              }`}
              aria-hidden="true"
            >
              <span className="text-xl font-extrabold leading-none sm:text-2xl">{diaDoPrazo(marco.data_limite)}</span>
              <span className="mt-1 text-[11px] font-semibold">{mesDoPrazo(marco.data_limite)}</span>
            </div>

            {/* Trilha */}
            <div className="relative flex justify-center">
              {!ultimo && (
                <span
                  aria-hidden="true"
                  className={`absolute top-9 bottom-0 w-0.5 sm:top-10 ${
                    situacao === "ENTREGUE" ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              )}
              <span
                aria-hidden="true"
                className={`relative z-10 mt-3 flex h-7 w-7 items-center justify-center rounded-full border-2 sm:h-8 sm:w-8 ${v.no}`}
              >
                <Icone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
            </div>

            {/* Conteúdo do marco */}
            <article className={`min-w-0 ${ultimo ? "pb-1" : "pb-8"}`} aria-labelledby={`marco-${marco.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 pt-2.5">
                <h3 id={`marco-${marco.id}`} className="text-base font-bold text-gray-900">
                  <span className="sr-only">Marco {i + 1}: </span>
                  {marco.titulo}
                </h3>
                {!ocultarSituacao && <SituacaoMarcoBadge situacao={situacao} />}
              </div>
              <p className="mt-0.5 text-xs text-gray-600">
                <time dateTime={dataUtc(marco.data_limite).toISOString()}>Prazo: {formatarPrazo(marco.data_limite)}</time>
                {!entrega && marco.tipo === "PARCIAL" && (
                  <span className={situacao === "PRAZO_PROXIMO" ? "font-semibold text-amber-800" : ""}>
                    {" "}
                    ({tempoAtePrazo(marco.data_limite, agora)})
                  </span>
                )}
              </p>
              <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {marco.descricao}
              </p>

              {marco.tipo === "FINAL" && !entrega && <p className="mt-2 text-xs text-violet-800">{textoFinal}</p>}

              {entrega && <EntregaRegistrada entrega={entrega} marco={marco} autor={autor?.(entrega.enviado_por)} />}

              {acao?.(marco, situacao)}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

/** Contagem usada nos resumos: só marcos parciais recebem entrega por este fluxo. */
export function progressoEntregas(marcos: Marco[], entregas: Map<string, Entrega>, agora: number) {
  const parciais = marcos.filter((m) => m.tipo === "PARCIAL");
  const feitas = parciais.filter((m) => entregas.has(m.id)).length;
  const perdidas = parciais.filter((m) => !entregas.has(m.id) && dataUtc(m.data_limite).getTime() < agora).length;
  const proximo = parciais.find((m) => !entregas.has(m.id) && dataUtc(m.data_limite).getTime() >= agora) ?? null;
  return { total: parciais.length, feitas, perdidas, proximo };
}

export function BarraProgresso({ feitas, total }: { feitas: number; total: number }) {
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={feitas}
      aria-label={`${feitas} de ${total} entregas parciais`}
      className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
    >
      <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Estado vazio ou bloqueado, com o próximo passo em texto. */
export function EstadoVazio({
  icone: Icone,
  titulo,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-[#F6F9F8] p-8 text-center">
      <Icone className="mx-auto h-10 w-10 text-emerald-300" aria-hidden="true" />
      <p className="mt-3 text-base font-bold text-gray-900">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{children}</p>
    </div>
  );
}
