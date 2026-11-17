// lib/api-treinamento.ts — treinamento das equipes (RF35) e marco de conclusão.
// Contrato: tags "Treinamento" e "Treinamento (admin)" do OpenAPI.
//
// Quem pode o quê (backend):
//   - Sessões e materiais (gestão): só Organizador e DEV.
//   - Marco de conclusão: GET para Comitê Científico, Organizador e DEV;
//     POST /concluir só Organizador e DEV (exige resultado homologado e edição aberta, senão 409).
//   - Consulta (GET /hackathons/{id}/treinamento): conta ativa de equipe APROVADA na edição,
//     Organizador, Comitê Científico e DEV. Demais perfis (inclusive Mentor) recebem 403.

import { request } from "./api";

export interface MaterialTreinamento {
  id: string;
  titulo: string;
  url: string;
  ordem: number;
}

export interface SessaoTreinamento {
  id: string;
  hackathon_id: string;
  titulo: string;
  descricao: string | null;
  /** UTC (ISO 8601). */
  inicio: string;
  fim: string | null;
  local: string | null;
  link_url: string | null;
  publicado: boolean;
  materiais: MaterialTreinamento[];
  atualizado_em?: string | null;
}

export interface SessaoTreinamentoCreate {
  titulo: string;
  descricao?: string | null;
  inicio: string;
  fim?: string | null;
  /** Local ou link: um dos dois é obrigatório. */
  local?: string | null;
  link_url?: string | null;
  publicado?: boolean;
}

/** PATCH: só o que for enviado muda; `descricao`, `fim`, `local` e `link_url` aceitam null. */
export type SessaoTreinamentoUpdate = Partial<SessaoTreinamentoCreate>;

export interface MaterialTreinamentoCreate {
  titulo: string;
  /** Link https (a API não recebe arquivos). */
  url: string;
}

/** Marco de conclusão do treinamento (libera a atribuição de mentores). */
export interface MarcoTreinamento {
  id: string;
  treinamento_concluido_em: string | null;
  treinamento_concluido_por: string | null;
}

const base = (hackathonId: string) => `/admin/hackathons/${hackathonId}/treinamento`;

export const treinamentoAdmin = {
  marco: (hackathonId: string) => request<MarcoTreinamento>(base(hackathonId)),
  concluir: (hackathonId: string) =>
    request<MarcoTreinamento>(`${base(hackathonId)}/concluir`, { method: "POST" }),

  listarSessoes: (
    hackathonId: string,
    q: { publicado?: boolean; limite?: number; deslocamento?: number } = {}
  ) => request<SessaoTreinamento[]>(`${base(hackathonId)}/sessoes`, { query: q }),
  criarSessao: (hackathonId: string, dados: SessaoTreinamentoCreate) =>
    request<SessaoTreinamento>(`${base(hackathonId)}/sessoes`, { method: "POST", body: dados }),
  editarSessao: (hackathonId: string, sessaoId: string, dados: SessaoTreinamentoUpdate) =>
    request<SessaoTreinamento>(`${base(hackathonId)}/sessoes/${sessaoId}`, {
      method: "PATCH",
      body: dados,
    }),
  excluirSessao: (hackathonId: string, sessaoId: string) =>
    request<void>(`${base(hackathonId)}/sessoes/${sessaoId}`, { method: "DELETE" }),

  adicionarMaterial: (hackathonId: string, sessaoId: string, dados: MaterialTreinamentoCreate) =>
    request<MaterialTreinamento>(`${base(hackathonId)}/sessoes/${sessaoId}/materiais`, {
      method: "POST",
      body: dados,
    }),
  removerMaterial: (hackathonId: string, sessaoId: string, materialId: string) =>
    request<void>(`${base(hackathonId)}/sessoes/${sessaoId}/materiais/${materialId}`, {
      method: "DELETE",
    }),
};

export const treinamento = {
  /** Sessões publicadas, com materiais, em ordem cronológica. */
  agenda: (hackathonId: string) =>
    request<SessaoTreinamento[]>(`/hackathons/${hackathonId}/treinamento`),
};

/* ───────────── utilidades de data (a API trabalha em UTC) ───────────── */

/** ISO (UTC) -> valor de <input type="datetime-local"> no fuso do navegador. */
export function isoParaInputLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> (fuso do navegador) -> ISO UTC. */
export function inputLocalParaIso(valor: string): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const fmtHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "qua., 18 de nov. de 2026 · 14:00 – 16:00" */
export function periodoSessao(inicio: string, fim: string | null): string {
  const i = new Date(inicio);
  const f = fim ? new Date(fim) : null;
  const mesmoDia = f && f.toDateString() === i.toDateString();
  let txt = `${fmtData.format(i)} · ${fmtHora.format(i)}`;
  if (f) txt += mesmoDia ? ` – ${fmtHora.format(f)}` : ` até ${fmtData.format(f)} · ${fmtHora.format(f)}`;
  return txt;
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${fmtData.format(d)} às ${fmtHora.format(d)}`;
}
