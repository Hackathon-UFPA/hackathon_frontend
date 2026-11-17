"use client";

import { Clock, ExternalLink, FileText, MapPin, Trash2, Video } from "lucide-react";
import { periodoSessao, type SessaoTreinamento } from "@/lib/api-treinamento";

const fmtDia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
const fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "short" });

export type MomentoSessao = "agora" | "proxima" | "realizada";

/** Uma sessão termina no `fim`; sem `fim`, consideramos 2 horas a partir do início. */
export function momentoDaSessao(s: SessaoTreinamento, agora = Date.now()): MomentoSessao {
  const inicio = new Date(s.inicio).getTime();
  const fim = s.fim ? new Date(s.fim).getTime() : inicio + 2 * 60 * 60 * 1000;
  if (agora < inicio) return "proxima";
  if (agora <= fim) return "agora";
  return "realizada";
}

/** Bloco de data (dia + mês) usado à esquerda dos cartões. */
export function BlocoData({ iso, apagado }: { iso: string; apagado?: boolean }) {
  const d = new Date(iso);
  return (
    <div
      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${
        apagado ? "bg-gray-100 text-gray-500" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
      }`}
      aria-hidden="true"
    >
      <span className="text-2xl font-extrabold leading-none">{fmtDia.format(d)}</span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide">
        {fmtMes.format(d).replace(".", "")}
      </span>
    </div>
  );
}

/**
 * Cartão de leitura de uma sessão do treinamento: data, local ou link e materiais.
 * `acoes` (opcional) entra no canto superior direito; `rodape` abaixo dos materiais.
 */
export default function CartaoSessao({
  sessao,
  acoes,
  rodape,
  selo,
  onRemoverMaterial,
}: {
  sessao: SessaoTreinamento;
  /** Na gestão: mostra a lixeira em cada material. */
  onRemoverMaterial?: (materialId: string, titulo: string) => void;
  acoes?: React.ReactNode;
  rodape?: React.ReactNode;
  selo?: React.ReactNode;
}) {
  const momento = momentoDaSessao(sessao);
  const realizada = momento === "realizada";

  return (
    <article
      className={`rounded-2xl border bg-white p-5 sm:p-6 ${
        momento === "agora" ? "border-emerald-400 ring-2 ring-emerald-100" : "border-emerald-100"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <BlocoData iso={sessao.inicio} apagado={realizada} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{sessao.titulo}</h3>
                {momento === "agora" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Acontecendo agora
                  </span>
                )}
                {realizada && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                    Realizada
                  </span>
                )}
                {selo}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {periodoSessao(sessao.inicio, sessao.fim)}
              </p>
            </div>
            {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {sessao.local && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F6F9F8] px-3 py-1.5 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-emerald-600" aria-hidden="true" /> {sessao.local}
              </span>
            )}
            {sessao.link_url && (
              <a
                href={sessao.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                {realizada ? "Link da sala virtual" : "Entrar na sala virtual"}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>

          {sessao.descricao && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">{sessao.descricao}</p>
          )}

          {sessao.materiais.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Materiais ({sessao.materiais.length})
              </p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {sessao.materiais.map((m) => (
                  <li key={m.id} className="flex items-stretch gap-1">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:border-emerald-400 hover:text-emerald-700"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{m.titulo}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                    </a>
                    {onRemoverMaterial && (
                      <button
                        type="button"
                        onClick={() => onRemoverMaterial(m.id, m.titulo)}
                        title={`Remover "${m.titulo}"`}
                        aria-label={`Remover material ${m.titulo}`}
                        className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rodape}
        </div>
      </div>
    </article>
  );
}
