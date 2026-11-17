// lib/api-conteudo.ts — conteúdo institucional da edição (BE-S5-12).
// Apoiadores, cronograma e FAQ (gestão do Organizador/DEV) e a página pública
// (/publico/..., sem login). Regulamento é gerido em /admin/termos.

import { request, type StatusHackathon } from "./api";

/* ───────────────────────────── Tipos do contrato ───────────────────────────── */

export interface Apoiador {
  id: string;
  hackathon_id: string;
  nome: string;
  categoria: string;
  logo_url: string | null;
  site_url: string | null;
  ordem: number;
  publicado: boolean;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface ApoiadorCriar {
  nome: string;
  categoria: string;
  logo_url?: string | null;
  site_url?: string | null;
  publicado?: boolean;
}

/** PATCH: `null` só em logo_url e site_url; nos demais, omita o campo. */
export interface ApoiadorEditar {
  nome?: string;
  categoria?: string;
  logo_url?: string | null;
  site_url?: string | null;
  ordem?: number;
  publicado?: boolean;
}

export type OrigemFase = "EDITAL" | "PERSONALIZADA";
export type SituacaoFase = "NAO_INICIADA" | "EM_ANDAMENTO" | "ENCERRADA";

export interface FaseCronograma {
  /** null nas datas do próprio edital (origem EDITAL), que não são editáveis aqui. */
  id: string | null;
  origem: OrigemFase | string;
  nome: string;
  descricao: string | null;
  inicio: string;
  fim: string;
  publicado: boolean;
  situacao: SituacaoFase | string;
  /** Fase em andamento agora, para destacar. */
  atual: boolean;
}

export interface FaseCriar {
  nome: string;
  descricao?: string | null;
  inicio: string;
  fim: string;
  publicado?: boolean;
}

export interface FaseEditar {
  nome?: string;
  descricao?: string | null;
  inicio?: string;
  fim?: string;
  publicado?: boolean;
}

export interface FaqItem {
  id: string;
  hackathon_id: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  publicado: boolean;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface FaqCriar {
  pergunta: string;
  resposta: string;
  publicado?: boolean;
}

export type FaqEditar = Partial<FaqCriar>;

export interface ApoiadorPublico {
  nome: string;
  logo_url: string | null;
  site_url: string | null;
}

export interface ApoiadoresPorCategoria {
  categoria: string;
  apoiadores: ApoiadorPublico[];
}

export interface FaqPublico {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface RegulamentoPublico {
  id: string;
  versao: string;
  titulo: string;
  conteudo: string | null;
  url: string | null;
  publicado_em: string | null;
}

export interface HackathonPublico {
  id: string;
  nome: string | null;
  tema: string | null;
  descricao: string | null;
  status: StatusHackathon | null;
  data_inicio: string | null;
  data_fim: string | null;
  inscricoes_inicio: string | null;
  inscricoes_fim: string | null;
  homologacao_fim: string | null;
  propostas_inicio: string | null;
  propostas_fim: string | null;
  /** RN06: mostrar o botão de inscrição só quando verdadeiro. */
  inscricoes_abertas: boolean;
}

export interface PaginaPublica extends HackathonPublico {
  regulamento: RegulamentoPublico | null;
  faq: FaqPublico[];
  cronograma: FaseCronograma[];
  apoiadores: ApoiadoresPorCategoria[];
}

/* ───────────────────────────── Administração ───────────────────────────── */

const base = (hackathonId: string) => `/admin/hackathons/${hackathonId}`;

/** A API aceita no máximo 100 por página. */
const LIMITE = 100;

export const apoiadoresAdmin = {
  listar: (hackathonId: string, filtros?: { publicado?: boolean; categoria?: string }) =>
    request<Apoiador[]>(`${base(hackathonId)}/apoiadores`, {
      query: { limite: LIMITE, ...filtros },
    }),
  criar: (hackathonId: string, dados: ApoiadorCriar) =>
    request<Apoiador>(`${base(hackathonId)}/apoiadores`, { method: "POST", body: dados }),
  editar: (hackathonId: string, apoiadorId: string, dados: ApoiadorEditar) =>
    request<Apoiador>(`${base(hackathonId)}/apoiadores/${apoiadorId}`, { method: "PATCH", body: dados }),
  excluir: (hackathonId: string, apoiadorId: string) =>
    request<void>(`${base(hackathonId)}/apoiadores/${apoiadorId}`, { method: "DELETE" }),
};

export const cronogramaAdmin = {
  /** Datas do edital (sem id) e fases cadastradas, publicadas ou não, em ordem cronológica. */
  listar: (hackathonId: string) => request<FaseCronograma[]>(`${base(hackathonId)}/cronograma`),
  criar: (hackathonId: string, dados: FaseCriar) =>
    request<FaseCronograma>(`${base(hackathonId)}/cronograma`, { method: "POST", body: dados }),
  editar: (hackathonId: string, faseId: string, dados: FaseEditar) =>
    request<FaseCronograma>(`${base(hackathonId)}/cronograma/${faseId}`, { method: "PATCH", body: dados }),
  excluir: (hackathonId: string, faseId: string) =>
    request<void>(`${base(hackathonId)}/cronograma/${faseId}`, { method: "DELETE" }),
};

export const faqAdmin = {
  listar: (hackathonId: string, filtros?: { publicado?: boolean }) =>
    request<FaqItem[]>(`${base(hackathonId)}/faq`, { query: { limite: LIMITE, ...filtros } }),
  criar: (hackathonId: string, dados: FaqCriar) =>
    request<FaqItem>(`${base(hackathonId)}/faq`, { method: "POST", body: dados }),
  editar: (hackathonId: string, itemId: string, dados: FaqEditar) =>
    request<FaqItem>(`${base(hackathonId)}/faq/${itemId}`, { method: "PATCH", body: dados }),
  excluir: (hackathonId: string, itemId: string) =>
    request<void>(`${base(hackathonId)}/faq/${itemId}`, { method: "DELETE" }),
  /** Exige TODOS os ids da edição; 409 se a lista mudou no meio do caminho (recarregue). */
  reordenar: (hackathonId: string, ids: string[]) =>
    request<FaqItem[]>(`${base(hackathonId)}/faq/ordem`, { method: "PUT", body: { ids } }),
};

/* ───────────────────────────── Página pública (sem login) ───────────────────────────── */

const pub = (id: string) => `/publico/hackathons/${id}`;

export const publico = {
  /** Edições divulgadas (todas menos RASCUNHO), das mais recentes às mais antigas. */
  listar: (paginacao?: { limite?: number; deslocamento?: number }) =>
    request<HackathonPublico[]>("/publico/hackathons", { auth: false, query: paginacao }),
  /** Página completa. 404 para edição em rascunho ou inexistente. */
  pagina: (id: string) => request<PaginaPublica>(pub(id), { auth: false }),
  regulamento: (id: string) => request<RegulamentoPublico>(`${pub(id)}/regulamento`, { auth: false }),
  faq: (id: string) => request<FaqPublico[]>(`${pub(id)}/faq`, { auth: false }),
  cronograma: (id: string) => request<FaseCronograma[]>(`${pub(id)}/cronograma`, { auth: false }),
  apoiadores: (id: string) => request<ApoiadoresPorCategoria[]>(`${pub(id)}/apoiadores`, { auth: false }),
};

/* ───────────────────────────── Utilitários de tela ───────────────────────────── */

export const ROTULO_SITUACAO_FASE: Record<SituacaoFase, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADA: "Encerrada",
};

/** ISO (UTC) -> valor de <input type="datetime-local"> no fuso do navegador. */
export function isoParaInputLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> (fuso do navegador) -> ISO com fuso. */
export function inputLocalParaIso(valor: string): string {
  return new Date(valor).toISOString();
}
