import type { HackathonResponse, StatusHackathon } from "@/lib/api";

export const ROTULO_STATUS: Record<StatusHackathon, string> = {
  RASCUNHO: "Rascunho",
  INSCRICOES: "Inscrições abertas",
  INSCRICOES_ENCERRADAS: "Inscrições encerradas",
  ATIVO: "Em andamento",
  EM_AVALIACAO: "Em avaliação",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const COR_STATUS: Record<StatusHackathon, string> = {
  RASCUNHO: "bg-gray-500/15 text-gray-700 border-gray-500/30",
  INSCRICOES: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  INSCRICOES_ENCERRADAS: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  ATIVO: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  EM_AVALIACAO: "bg-violet-500/15 text-violet-700 border-violet-500/30",
  FINALIZADO: "bg-gray-100 text-gray-700 border-gray-200",
  CANCELADO: "bg-red-500/15 text-red-700 border-red-500/30",
};

const FUSO = "America/Belem";
const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: FUSO });
const fmtDiaMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: FUSO });
const fmtAno = new Intl.DateTimeFormat("pt-BR", { year: "numeric", timeZone: FUSO });
const fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: FUSO });
const fmtDia = new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: FUSO });

/** As datas da API são UTC sem fuso ("2026-11-17T12:00:00"). */
export function paraData(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatarData(iso?: string | null): string | null {
  const d = paraData(iso);
  return d ? fmt.format(d) : null;
}

/**
 * Período compacto, sem repetir o que é igual nas duas pontas:
 * "10 – 12 de nov. de 2026", "31 de out. – 19 de nov. de 2026", "28 de dez. de 2026 – 3 de jan. de 2027".
 */
export function periodo(inicio?: string | null, fim?: string | null): string | null {
  const a = paraData(inicio);
  const b = paraData(fim);
  if (!a || !b) return formatarData(inicio) ?? formatarData(fim);
  const mesmoAno = fmtAno.format(a) === fmtAno.format(b);
  const mesmoMes = mesmoAno && fmtMes.format(a) === fmtMes.format(b);
  if (fmt.format(a) === fmt.format(b)) return fmt.format(a);
  if (mesmoMes) return `${fmtDia.format(a)} – ${fmt.format(b)}`;
  if (mesmoAno) return `${fmtDiaMes.format(a)} – ${fmt.format(b)}`;
  return `${fmt.format(a)} – ${fmt.format(b)}`;
}

/** "em 3 dias", "em 5 horas"... para contagens regressivas. */
export function tempoAte(iso?: string | null, agora = new Date()): string | null {
  const d = paraData(iso);
  if (!d) return null;
  const ms = d.getTime() - agora.getTime();
  if (ms <= 0) return null;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const horas = ms / 3_600_000;
  if (horas < 1) return rtf.format(Math.ceil(ms / 60_000), "minute");
  if (horas < 48) return rtf.format(Math.ceil(horas), "hour");
  return rtf.format(Math.ceil(horas / 24), "day");
}

/** Inscrições abertas de fato: status e janela de datas (RN06). */
export function inscricoesAbertas(h: HackathonResponse, agora = new Date()): boolean {
  if (h.status !== "INSCRICOES") return false;
  const ini = paraData(h.inscricoes_inicio);
  const fim = paraData(h.inscricoes_fim);
  return (!ini || ini <= agora) && (!fim || agora < fim);
}
