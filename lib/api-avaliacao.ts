// lib/api-avaliacao.ts — rubrica (montagem/publicação) e avaliação científica.
// Contrato: app/views/rubrica.py e app/views/avaliacao.py do backend
// (docs/temas-e-rubrica.md e docs/avaliacao.md).
//
// O núcleo HTTP de lib/api.ts (`request`/`toApiError`) não é exportado; por isso há aqui um
// wrapper fino que reutiliza o que É exportado: API_URL, ApiError, getToken e clearSession
// (mesma chave de token "hk_token"). Quando `request` for exportado, basta trocar `http` por ele.

import {
  API_URL,
  ApiError,
  clearSession,
  getToken,
  type RecomendacaoAvaliacao,
  type TemaItem,
} from "./api";

/* ───────────────────────────── Núcleo HTTP (wrapper fino) ───────────────────────────── */

type Opts = { method?: string; body?: unknown };

async function http<T>(path: string, { method = "GET", body }: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão.");
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // corpo vazio ou não-JSON
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // Mesmo comportamento do núcleo de lib/api.ts (fora de componente, sem router).
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    throw paraApiError(res.status, data);
  }
  return data as T;
}

function paraApiError(status: number, data: unknown): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;

  // 422 do FastAPI: lista de { loc, msg }. Validadores de modelo vêm com loc ["body"],
  // então a mensagem é mostrada sem o prefixo "Value error, ".
  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    const msgs: string[] = [];
    for (const item of detail as { loc?: (string | number)[]; msg?: string }[]) {
      const msg = String(item.msg ?? "").replace(/^Value error,\s*/i, "");
      const loc = item.loc ?? [];
      const campo = String(loc[loc.length - 1] ?? "");
      if (campo && !fields[campo]) fields[campo] = msg;
      if (msg && !msgs.includes(msg)) msgs.push(msg);
    }
    return new ApiError(status, msgs.length ? `Dados inválidos: ${msgs.join("; ")}.` : "Dados inválidos.", fields);
  }

  return new ApiError(
    status,
    typeof detail === "string" ? detail : "Erro inesperado. Tente novamente."
  );
}

export const ehNaoEncontrado = (e: unknown) => e instanceof ApiError && e.status === 404;

/* ───────────────────────────── Tipos: rubrica ───────────────────────────── */

/** Decimais (peso, nota) trafegam como string para preservar a precisão. */
export interface CriterioRubricaIn {
  nome: string;
  descricao: string;
  peso: string;
  escala_min: number;
  escala_max: number;
}

export interface CriterioRubricaResp extends CriterioRubricaIn {
  id: string;
  ordem: number;
}

/** RubricaResponse do backend (não há campo `fase`). */
export interface RubricaResp {
  id: string;
  hackathon_id: string;
  publicada: boolean;
  publicada_em?: string | null;
  soma_pesos: string;
  criterios: CriterioRubricaResp[];
}

export interface RubricaRascunhoResp extends RubricaResp {
  atualizado_em?: string | null;
  /** O que ainda impede a publicação; vazio quando pronta ou já publicada. */
  pendencias: string[];
}

/** Critérios mínimos da RN10 (provisórios no backend: app/const/rubrica.py). */
export const CRITERIOS_MINIMOS_RN10 = [
  "Inovação",
  "Impacto",
  "Viabilidade técnica",
  "Aderência ao tema",
] as const;

/* ───────────────────────────── Tipos: distribuição ───────────────────────────── */

export interface ConfiguracaoAvaliacaoResp {
  hackathon_id: string;
  avaliadores_por_proposta: number | null;
}

export interface DistribuicaoResp {
  hackathon_id: string;
  avaliadores_por_proposta: number;
  propostas_distribuidas: number;
  designacoes_criadas: number;
  propostas_ja_completas: number;
}

export interface AvaliadorDesignado {
  id: string;
  nome?: string | null;
  email: string;
  atribuido_em?: string | null;
}

export interface PropostaDesignadaAdmin {
  submissao_id: string;
  equipe_id: string;
  titulo?: string | null;
  avaliadores: AvaliadorDesignado[];
}

/* ───────────────────────────── Tipos: avaliador ───────────────────────────── */

/** Proposta como o avaliador a vê (sem equipe). */
export interface PropostaParaAvaliacao {
  id: string;
  hackathon_id: string;
  tema_id?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  ods?: number[] | null;
  bases_dados?: string | null;
  documento_url?: string | null;
  enviado_em?: string | null;
}

export type StatusAvaliacao = "RASCUNHO" | "ENVIADA";

export interface NotaCriterio {
  criterio_id: string;
  nota: string;
}

export interface AvaliacaoPayload {
  notas: NotaCriterio[];
  parecer: string | null;
  recomendacao: RecomendacaoAvaliacao | null;
}

export interface AvaliacaoResp extends AvaliacaoPayload {
  id: string;
  submissao_id: string;
  avaliador_id: string;
  rubrica_id: string | null;
  status: StatusAvaliacao;
  nota_final: string | null;
  atualizado_em: string;
  avaliado_em: string | null;
}

/* ───────────────────────────── Endpoints ───────────────────────────── */

/** Montagem e publicação da rubrica (Organizador ou DEV). */
export const rubricaApi = {
  /** 404 quando a edição ainda não tem rubrica. */
  rascunho: (hackathonId: string) =>
    http<RubricaRascunhoResp>(`/hackathons/${hackathonId}/rubrica/rascunho`),
  /** Substitui a lista inteira de critérios (a ordem da lista é a de exibição). */
  salvar: (hackathonId: string, criterios: CriterioRubricaIn[]) =>
    http<RubricaRascunhoResp>(`/hackathons/${hackathonId}/rubrica`, {
      method: "PUT",
      body: { criterios },
    }),
  publicar: (hackathonId: string) =>
    http<RubricaResp>(`/hackathons/${hackathonId}/rubrica/publicar`, { method: "POST" }),
  /** Rota pública: rubrica publicada (404 antes da publicação). */
  publicada: (hackathonId: string) => http<RubricaResp>(`/hackathons/${hackathonId}/rubrica`),
};

/** Distribuição de propostas entre avaliadores (Organizador ou DEV). */
export const distribuicaoApi = {
  configurar: (hackathonId: string, avaliadores_por_proposta: number) =>
    http<ConfiguracaoAvaliacaoResp>(`/admin/hackathons/${hackathonId}/avaliacao/configuracao`, {
      method: "PATCH",
      body: { avaliadores_por_proposta },
    }),
  distribuir: (hackathonId: string) =>
    http<DistribuicaoResp>(`/admin/hackathons/${hackathonId}/avaliacoes/distribuir`, {
      method: "POST",
    }),
  redistribuir: (submissaoId: string, avaliador_ids: string[]) =>
    http<PropostaDesignadaAdmin>(`/admin/propostas/${submissaoId}/avaliadores`, {
      method: "PUT",
      body: { avaliador_ids },
    }),
  designacoes: (hackathonId: string) =>
    http<PropostaDesignadaAdmin[]>(`/admin/hackathons/${hackathonId}/avaliacoes/designacoes`),
};

/** Avaliação científica pelo avaliador designado (Comitê Científico ou DEV). */
export const avaliadorApi = {
  propostas: () => http<PropostaParaAvaliacao[]>("/avaliador/propostas"),
  proposta: (submissaoId: string) =>
    http<PropostaParaAvaliacao>(`/avaliador/propostas/${submissaoId}`),
  /** 404 antes do primeiro salvamento. */
  avaliacao: (submissaoId: string) =>
    http<AvaliacaoResp>(`/avaliador/propostas/${submissaoId}/avaliacao`),
  /** Substitui integralmente o rascunho (campos omitidos são limpos). */
  salvarRascunho: (submissaoId: string, dados: AvaliacaoPayload) =>
    http<AvaliacaoResp>(`/avaliador/propostas/${submissaoId}/avaliacao/rascunho`, {
      method: "PUT",
      body: dados,
    }),
  /** Sem `dados`, envia o rascunho salvo; com `dados`, envia esse conteúdo. Definitivo. */
  enviar: (submissaoId: string, dados?: AvaliacaoPayload) =>
    http<AvaliacaoResp>(`/avaliador/propostas/${submissaoId}/avaliacao/enviar`, {
      method: "POST",
      body: dados,
    }),
};

/** GET /temas/{id} (conta ativa): o avaliador só recebe o `tema_id` da proposta. */
export const obterTema = (temaId: string) => http<TemaItem>(`/temas/${temaId}`);

/* ───────────────────────────── Utilitários ───────────────────────────── */

/** Soma decimal em centésimos (evita erro de ponto flutuante na soma dos pesos). */
export function somaPesos(pesos: string[]): number {
  const centesimos = pesos.reduce((acc, p) => {
    const n = Number(String(p).replace(",", "."));
    return Number.isFinite(n) ? acc + Math.round(n * 100) : acc;
  }, 0);
  return centesimos / 100;
}

/** "30.00" -> "30", "7.50" -> "7,5" (exibição). */
export function formatarDecimal(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
