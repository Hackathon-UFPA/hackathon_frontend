// lib/api-resultado.ts — Resultado da avaliação (RF31/RF32) e notificações (RF33).
//
// O núcleo `request` de lib/api.ts não é exportado. Este arquivo usa um wrapper fino
// com as mesmas peças exportadas por lá (API_URL, getToken, clearSession, ApiError),
// então o token continua vindo só de getToken() (chave "hk_token").
// Se `request` passar a ser exportado, troque `chamar` por ele.

import { API_URL, ApiError, clearSession, getToken, type ParecerEquipe } from "./api";

/* ───────────────────────────── Tipos do contrato ───────────────────────────── */

export type CodigoPendenciaResultado =
  | "QUANTIDADE_NAO_CONFIGURADA"
  | "SEM_PROPOSTAS"
  | "AVALIADORES_INSUFICIENTES"
  | "AVALIACAO_PENDENTE";

export interface PendenciaResultado {
  codigo: CodigoPendenciaResultado;
  mensagem: string;
  submissao_id?: string | null;
}

export interface ResultadoProposta {
  submissao_id: string;
  equipe_id: string;
  equipe_nome?: string | null;
  tema_titulo?: string | null;
  titulo?: string | null;
  avaliadores_designados: number;
  avaliacoes_enviadas: number;
  /** Decimal serializado como string pelo FastAPI (ex.: "7.68"); null sem avaliação. */
  nota_media?: string | number | null;
  classificacao?: number | null;
  recomendacoes_aprovacao: number;
  recomendacoes_reprovacao: number;
  /** null enquanto não homologado. */
  aprovada?: boolean | null;
}

/** GET /admin/hackathons/{id}/resultado e resposta do POST .../homologar. */
export interface ResultadoAvaliacao {
  hackathon_id: string;
  avaliadores_por_proposta?: number | null;
  homologado: boolean;
  homologado_em?: string | null;
  homologado_por?: string | null;
  homologado_por_nome?: string | null;
  pode_homologar: boolean;
  pendencias: PendenciaResultado[];
  total_propostas: number;
  total_aprovadas?: number | null;
  propostas: ResultadoProposta[];
}

export interface PropostaAprovada {
  submissao_id: string;
  equipe?: string | null;
  tema?: string | null;
  titulo?: string | null;
}

/** GET /hackathons/{id}/propostas-aprovadas (público, sem login). */
export interface PropostasAprovadas {
  hackathon_id: string;
  hackathon_nome?: string | null;
  divulgado: boolean;
  divulgado_em?: string | null;
  propostas: PropostaAprovada[];
}

export type CanalNotificacao = "PLATAFORMA" | "EMAIL";
export type StatusEnvioNotificacao = "PENDENTE" | "ENVIADO" | "FALHA";

/** GET /me/notificacoes. Não há rota para marcar como lida. */
export interface NotificacaoResultado {
  id: string;
  hackathon_id: string;
  equipe_id: string;
  submissao_id: string;
  aprovada: boolean;
  mensagem: string;
  canal: CanalNotificacao;
  status_envio: StatusEnvioNotificacao;
  enviado_em?: string | null;
  erro?: string | null;
  criado_em: string;
  pareceres: ParecerEquipe[];
}

/* ───────────────────────────── Wrapper HTTP ───────────────────────────── */

async function chamar<T>(
  path: string,
  { method = "GET", body, auth = true }: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

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

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // corpo vazio ou não-JSON
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    const detail = (data as { detail?: unknown } | null)?.detail;
    let mensagem = "Erro inesperado. Tente novamente.";
    if (typeof detail === "string") mensagem = detail;
    else if (Array.isArray(detail) && detail.length > 0) {
      const primeiro = detail[0] as { msg?: string };
      mensagem = `Dados inválidos${primeiro?.msg ? ` (${primeiro.msg})` : ""}.`;
    }
    throw new ApiError(res.status, mensagem);
  }
  return data as T;
}

const id = (v: string) => encodeURIComponent(v);

/* ───────────────────────────── Endpoints ───────────────────────────── */

/** Resultado consolidado e homologação (Organizador e DEV). */
export const resultadoAdmin = {
  consultar: (hackathonId: string) =>
    chamar<ResultadoAvaliacao>(`/admin/hackathons/${id(hackathonId)}/resultado`),

  /** Ids (submissao_id) aprovados; as demais ficam reprovadas. Irreversível. */
  homologar: (hackathonId: string, propostasAprovadas: string[]) =>
    chamar<ResultadoAvaliacao>(`/admin/hackathons/${id(hackathonId)}/resultado/homologar`, {
      method: "POST",
      body: { propostas_aprovadas: propostasAprovadas },
    }),
};

/** Lista pública das aprovadas. Antes da homologação: divulgado = false e lista vazia. */
export const propostasAprovadas = {
  listar: (hackathonId: string) =>
    chamar<PropostasAprovadas>(`/hackathons/${id(hackathonId)}/propostas-aprovadas`, {
      auth: false,
    }),
};

/** Notificações do usuário logado, da mais recente para a mais antiga. */
export const notificacoes = {
  minhas: () => chamar<NotificacaoResultado[]>("/me/notificacoes"),
};

/** Formata a nota média (Decimal vem como string) com vírgula. */
export function formatarNota(nota?: string | number | null): string {
  if (nota === null || nota === undefined || nota === "") return "—";
  const n = typeof nota === "number" ? nota : Number(nota);
  if (Number.isNaN(n)) return String(nota);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
