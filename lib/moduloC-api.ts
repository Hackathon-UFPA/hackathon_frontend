// lib/moduloC-api.ts

export type PapelUsuario =
  | "PARTICIPANTE"
  | "MENTOR"
  | "COMITE_TECNICO"
  | "COMITE_CIENTIFICO"
  | "ORGANIZADOR"
  | "DEV";

export type SituacaoConta = "PENDENTE" | "ATIVA";
export type StatusComprovante = "PENDENTE" | "APROVADO" | "RECUSADO";
export type StatusConvite = "PENDENTE" | "ACEITO" | "RECUSADO" | "CANCELADO";
export type SituacaoEquipe =
  | "EM_FORMACAO"
  | "AGUARDANDO_HOMOLOGACAO"
  | "HOMOLOGADA"
  | "NAO_HOMOLOGADA";
export type FuncaoMembro =
  | "LIDER"
  | "DESENVOLVEDOR"
  | "DESIGNER"
  | "NEGOCIOS"
  | "OUTRO";
export type TipoTermo = "REGULAMENTO" | "TERMO_CONSENTIMENTO";

export interface UsuarioMe {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  situacao_conta: SituacaoConta;
  instituicao?: string;
  curso?: string;
  periodo?: number;
}

export interface HackathonResumo {
  id: string;
  nome: string;
  status: string;
  inscricoes_inicio?: string | null;
  inscricoes_fim?: string | null;
  min_integrantes?: number;
  max_integrantes?: number;
}

export interface ComprovanteItem {
  id: string;
  url: string;
  status: StatusComprovante;
  motivo_recusa?: string | null;
  enviado_em: string;
  avaliado_em?: string | null;
}

export interface TermoVigente {
  id: string;
  hackathon_id: string;
  tipo: TipoTermo;
  titulo: string;
  versao: string;
  conteudo?: string | null;
  url?: string | null;
  vigente?: boolean;
  publicado_em?: string | null;
}

export interface ConviteRecebido {
  id: string;
  equipe_id: string;
  equipe_nome: string;
  hackathon_id: string;
  hackathon_nome?: string;
  funcao: FuncaoMembro;
  status: StatusConvite;
  convidado_por_nome?: string;
  criado_em: string;
}

export interface MinhaEquipeResumo {
  id: string;
  nome: string;
  hackathon_id: string;
  hackathon_nome?: string;
  situacao: SituacaoEquipe;
  minha_funcao: FuncaoMembro;
  total_integrantes?: number;
}

export interface IntegrantePainel {
  usuario_id?: string | null;
  convite_id?: string | null;
  nome: string;
  email: string;
  funcao: FuncaoMembro;
  integrante: boolean;
  status_convite: StatusConvite;
  situacao_conta?: SituacaoConta;
  status_comprovante?: StatusComprovante;
  termos_aceitos: boolean;
}

export interface ProtocoloInfo {
  numero: string;
  emitido_em: string;
  tipo?: "INSCRICAO_EQUIPE" | "PROPOSTA";
}

export interface PainelEquipeNormalizado {
  equipe_id: string;
  nome: string;
  hackathon_id: string;
  hackathon_nome?: string;
  situacao: SituacaoEquipe;
  min_integrantes: number;
  max_integrantes: number;
  protocolo_inscricao?: ProtocoloInfo | null;
  integrantes: IntegrantePainel[];
  pendencias: string[];
  pode_concluir: boolean;
}

export interface ConclusaoInscricaoResponse {
  mensagem: string;
  equipe_id: string;
  situacao: SituacaoEquipe;
  inscricao_concluida_em: string;
  protocolo: {
    numero: string;
    emitido_em: string;
  };
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const API_BASE = "/api-backend";

function obterTokenArmazenado(): string | null {
  if (typeof window === "undefined") return null;
  const chaves = ["token", "access_token", "hackathon_token", "auth_token"];
  for (const chave of chaves) {
    const val = localStorage.getItem(chave) || sessionStorage.getItem(chave);
    if (val) {
      const limpo = val.trim().replace(/^Bearer\s+/i, "");
      if (limpo.split(".").length === 3) return limpo;
    }
  }
  return null;
}

function getAuthHeaders(): Record<string, string> {
  const token = obterTokenArmazenado();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function extrairErro(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((d: { loc?: string[]; msg?: string }) => {
          const campo = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "campo";
          return `${campo}: ${d.msg}`;
        })
        .join(" | ");
    }
    if (data.message) return data.message;
  } catch {
    // Ignora falha de parse
  }
  if (res.status === 401) return "Sessão expirada ou não autenticada. Faça login novamente.";
  if (res.status === 403) return "Operação não permitida para o seu perfil ou situação da conta.";
  if (res.status === 409) return "Conflito de estado: verifique se os dados foram atualizados ou o prazo encerrou.";
  return `Erro inesperado do servidor (HTTP ${res.status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const msg = await extrairErro(res);
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizarLista<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.items)) return raw.items;
  return [];
}

export const moduloCApi = {
  // Sessão e Edições
  obterMe: () => request<UsuarioMe>("/auth/me"),

  listarHackathons: async (): Promise<HackathonResumo[]> => {
    const raw = await request<unknown>("/hackathons");
    return normalizarLista<HackathonResumo>(raw);
  },

  // EQP-01: Comprovantes
  listarMeusComprovantes: async (): Promise<ComprovanteItem[]> => {
    const raw = await request<unknown>("/me/comprovantes");
    return normalizarLista<ComprovanteItem>(raw);
  },

  enviarNovoComprovante: (comprovante_url: string) =>
    request<ComprovanteItem>("/me/comprovantes", {
      method: "POST",
      body: JSON.stringify({ comprovante_url }),
    }),

  // Termos Vigentes (alinhado a app/views/termos.py)
  listarTermosVigentes: async (hackathonId: string): Promise<TermoVigente[]> => {
    const raw = await request<unknown>(
      `/hackathons/${encodeURIComponent(hackathonId)}/termos/vigentes`
    );
    return normalizarLista<TermoVigente>(raw);
  },

  aceitarTermos: (hackathonId: string, termos_ids: string[]) =>
    request<unknown[]>(
      `/hackathons/${encodeURIComponent(hackathonId)}/termos/aceites`,
      {
        method: "POST",
        body: JSON.stringify({ termos_ids }),
      }
    ),

  // EQP-02: Convites Recebidos
  listarMeusConvites: async (): Promise<ConviteRecebido[]> => {
    const raw = await request<unknown>("/me/convites");
    return normalizarLista<ConviteRecebido>(raw);
  },

  aceitarConvite: (conviteId: string, termos_ids: string[]) =>
    request<{ mensagem?: string }>(`/convites/${conviteId}/aceitar`, {
      method: "POST",
      body: JSON.stringify({ termos_ids }),
    }),

  recusarConvite: (conviteId: string) =>
    request<{ mensagem?: string }>(`/convites/${conviteId}/recusar`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // EQP-03: Minhas Equipes
  listarMinhasEquipes: async (): Promise<MinhaEquipeResumo[]> => {
    const raw = await request<unknown>("/equipes/minhas");
    return normalizarLista<MinhaEquipeResumo>(raw);
  },

  // EQP-04 & EQP-06: Equipe e Painel
  criarEquipe: (payload: { hackathon_id: string; nome: string }) =>
    request<{ id: string; nome: string; hackathon_id: string; situacao: SituacaoEquipe }>("/equipes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  editarNomeEquipe: (equipeId: string, nome: string) =>
    request<{ id: string; nome: string }>(`/equipes/${equipeId}`, {
      method: "PATCH",
      body: JSON.stringify({ nome }),
    }),

  obterPainelEquipe: async (equipeId: string): Promise<PainelEquipeNormalizado> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await request(`/equipes/${equipeId}/painel`);
    const eq = raw.equipe ?? raw;
    return {
      equipe_id: eq.id ?? raw.equipe_id ?? equipeId,
      nome: eq.nome ?? raw.equipe_nome ?? "Equipe",
      hackathon_id: eq.hackathon_id ?? raw.hackathon_id ?? "",
      hackathon_nome: eq.hackathon_nome ?? raw.hackathon_nome,
      situacao: eq.situacao ?? raw.situacao ?? "EM_FORMACAO",
      min_integrantes: eq.min_integrantes ?? raw.min_integrantes ?? 3,
      max_integrantes: eq.max_integrantes ?? raw.max_integrantes ?? 5,
      protocolo_inscricao: eq.protocolo_inscricao ?? raw.protocolo_inscricao ?? null,
      integrantes: Array.isArray(raw.integrantes) ? raw.integrantes : [],
      pendencias: Array.isArray(raw.pendencias) ? raw.pendencias : [],
      pode_concluir: Boolean(raw.pode_concluir),
    };
  },

  convidarIntegrante: (
    equipeId: string,
    payload: { email: string; funcao: Exclude<FuncaoMembro, "LIDER"> }
  ) =>
    request(`/equipes/${equipeId}/convites`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelarConviteEquipe: (equipeId: string, conviteId: string) =>
    request<void>(`/equipes/${equipeId}/convites/${conviteId}`, {
      method: "DELETE",
    }),

  alterarFuncaoIntegrante: (
    equipeId: string,
    usuarioId: string,
    funcao: Exclude<FuncaoMembro, "LIDER">
  ) =>
    request(`/equipes/${equipeId}/integrantes/${usuarioId}/funcao`, {
      method: "PATCH",
      body: JSON.stringify({ funcao }),
    }),

  removerIntegrante: (equipeId: string, usuarioId: string) =>
    request<void>(`/equipes/${equipeId}/integrantes/${usuarioId}`, {
      method: "DELETE",
    }),

  concluirInscricao: (equipeId: string) =>
    request<ConclusaoInscricaoResponse>(`/equipes/${equipeId}/inscricao/concluir`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};