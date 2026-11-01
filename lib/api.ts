// lib/api.ts — cliente da API do Hackathon (espelha o OpenAPI do backend)
// Variáveis de ambiente (.env.local):
//   NEXT_PUBLIC_API_URL=/api-backend   (opcional; este já é o padrão)
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...   (preset "unsigned")

// Por padrão usa o proxy do Next (rewrites em next.config.ts): "/api-backend/*" -> FastAPI.
// Mesma origem = sem CORS, e o cabeçalho Retry-After fica legível no 429.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api-backend").replace(/\/$/, "");

/* ───────────────────────────── Tipos ───────────────────────────── */

export type PapelUsuario =
  | "PARTICIPANTE" | "MENTOR" | "COMITE_TECNICO"
  | "COMITE_CIENTIFICO" | "ORGANIZADOR" | "DEV";
export type SituacaoConta = "PENDENTE" | "ATIVA";
export type SituacaoEquipe =
  | "EM_FORMACAO" | "AGUARDANDO_HOMOLOGACAO" | "HOMOLOGADA" | "NAO_HOMOLOGADA";
export type FuncaoMembro = "LIDER" | "DESENVOLVEDOR" | "DESIGNER" | "NEGOCIOS" | "OUTRO";
export type StatusConvite = "PENDENTE" | "ACEITO" | "RECUSADO" | "CANCELADO";
export type StatusComprovante = "PENDENTE" | "APROVADO" | "RECUSADO";
export type StatusProposta = "RASCUNHO" | "ENVIADA";
export type TipoTermo = "REGULAMENTO" | "TERMO_CONSENTIMENTO";

export interface Usuario {
  id: string;
  nome: string | null;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  situacao_conta: SituacaoConta;
  instituicao?: string | null;
  curso?: string | null;
  periodo?: number | null;
  empresa_parceira?: string | null;
  area_atuacao?: string | null;
  max_equipes?: number | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string; // 8–128 caracteres, ao menos 1 letra e 1 número
  instituicao: string;
  curso: string;
  periodo: number;
  comprovante_url: string; // https, termina em .pdf/.png/.jpg/.jpeg
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // segundos
  usuario: Usuario;
}

export interface UsuarioAdminCreate {
  email: string;
  papel: PapelUsuario;
  senha: string;
  nome?: string | null;
  instituicao?: string | null;
  curso?: string | null;
  periodo?: number | null;
  empresa_parceira?: string | null;
  area_atuacao?: string | null;
  max_equipes?: number | null;
}

export interface Equipe {
  id: string;
  hackathon_id: string;
  nome: string | null;
  situacao: SituacaoEquipe;
  inscricao_concluida_em?: string | null;
  homologada_em?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface MembroEquipe {
  equipe_id: string;
  usuario_id: string;
  hackathon_id: string;
  funcao: FuncaoMembro | null;
  entrou_em?: string | null;
}

export interface Convite {
  id: string;
  equipe_id: string;
  convidado_por: string;
  nome: string;
  email: string;
  usuario_id?: string | null;
  status: StatusConvite;
  enviado_em?: string | null;
  respondido_em?: string | null;
}

export interface ConviteRecebido {
  id: string;
  equipe_id: string;
  equipe_nome: string | null;
  hackathon_id: string;
  nome: string;
  status: StatusConvite;
  enviado_em?: string | null;
}

export interface Termo {
  id: string;
  hackathon_id: string;
  tipo: TipoTermo;
  versao: string;
  titulo: string;
  conteudo?: string | null;
  url?: string | null;
  vigente: boolean;
  publicado_em?: string | null;
}

export interface AceiteTermo {
  id: string;
  termo_id: string;
  usuario_id: string;
  aceito_em: string;
}

export interface Comprovante {
  id: string;
  usuario_id: string;
  hackathon_id: string;
  arquivo_url: string;
  status: StatusComprovante;
  motivo_recusa?: string | null;
  enviado_em?: string | null;
  validado_por?: string | null;
  validado_em?: string | null;
}

export interface ComprovanteAdmin extends Comprovante {
  usuario: {
    id: string;
    nome: string | null;
    email: string;
    instituicao?: string | null;
    curso?: string | null;
    periodo?: number | null;
  };
}

export interface Protocolo {
  numero: string;
  emitido_em?: string | null;
}

export interface Pendencia {
  codigo: string;
  mensagem: string;
  usuario_id?: string | null;
  bloqueia_conclusao: boolean;
}

export interface IntegrantePainel {
  usuario_id?: string | null;
  nome?: string | null;
  email: string;
  funcao?: FuncaoMembro | null;
  integrante: boolean;
  convite?: StatusConvite | null;
  termos_aceitos: boolean;
  comprovante?: StatusComprovante | null;
}

export interface PainelEquipe {
  equipe_id: string;
  hackathon_id: string;
  nome?: string | null;
  situacao: SituacaoEquipe;
  inscricao_concluida_em?: string | null;
  homologada_em?: string | null;
  protocolo?: Protocolo | null;
  minimo_integrantes: number;
  maximo_integrantes: number;
  total_integrantes: number;
  inscricoes_abertas: boolean;
  voce_e_lider: boolean;
  pode_concluir: boolean;
  integrantes: IntegrantePainel[];
  pendencias: Pendencia[];
}

export interface ConclusaoInscricao {
  mensagem: string;
  equipe_id: string;
  situacao: SituacaoEquipe;
  inscricao_concluida_em: string;
  homologada_em?: string | null;
  protocolo: Protocolo;
}

export interface Reavaliacao {
  avaliadas: number;
  homologadas: number;
  revertidas: number;
}

export interface Proposta {
  id: string;
  equipe_id: string;
  hackathon_id: string;
  status: StatusProposta;
  tema_id?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  ods?: number[] | null;
  bases_dados?: string | null;
  documento_url?: string | null;
  enviado_em?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export type PropostaInput = Partial<
  Pick<Proposta, "tema_id" | "titulo" | "descricao" | "ods" | "bases_dados" | "documento_url">
>;

/* ───────────────────────────── Erros ───────────────────────────── */

export class ApiError extends Error {
  status: number;
  /** Erros de validação (422) por campo: { senha: "mensagem" } */
  fields: Record<string, string>;
  /** Segundos restantes do bloqueio (429), se o CORS expuser o cabeçalho */
  retryAfter?: number;

  constructor(status: number, message: string, fields: Record<string, string> = {}, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

/* ───────────────────────────── Sessão ───────────────────────────── */

const TOKEN_KEY = "hk_token";
const USER_KEY = "hk_user";
const EXP_KEY = "hk_exp";

const isBrowser = () => typeof window !== "undefined";

function safeGet(key: string): string | null {
  if (!isBrowser()) return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(key, value); } catch { /* ignora */ }
}
function safeRemove(key: string) {
  if (!isBrowser()) return;
  try { window.localStorage.removeItem(key); } catch { /* ignora */ }
}

export function getToken(): string | null {
  const exp = Number(safeGet(EXP_KEY) ?? 0);
  if (exp && Date.now() > exp) {
    clearSession();
    return null;
  }
  return safeGet(TOKEN_KEY);
}

export function getUser(): Usuario | null {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Usuario; } catch { return null; }
}

export function saveSession(t: TokenResponse) {
  safeSet(TOKEN_KEY, t.access_token);
  safeSet(USER_KEY, JSON.stringify(t.usuario));
  safeSet(EXP_KEY, String(Date.now() + t.expires_in * 1000));
}

export function clearSession() {
  safeRemove(TOKEN_KEY);
  safeRemove(USER_KEY);
  safeRemove(EXP_KEY);
}

/* ───────────────────────────── Núcleo HTTP ───────────────────────────── */

type Opts = { method?: string; body?: unknown; auth?: boolean; query?: Record<string, string | number | undefined | null> };

async function request<T>(path: string, { method = "GET", body, auth = true, query }: Opts = {}): Promise<T> {
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const url = `${API_URL}${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão.");
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try { data = await res.json(); } catch { /* corpo vazio ou não JSON */ }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearSession();
      if (isBrowser() && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw toApiError(res, data);
  }
  return data as T;
}

function toApiError(res: Response, data: unknown): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;
  const retry = res.headers.get("Retry-After");
  const retryAfter = retry ? Number(retry) : undefined;

  // 422 do FastAPI: lista de { loc, msg }
  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const item of detail as { loc: (string | number)[]; msg: string }[]) {
      const campo = String(item.loc[item.loc.length - 1] ?? "");
      if (campo && !fields[campo]) fields[campo] = item.msg;
    }
    return new ApiError(res.status, "Há campos inválidos no formulário.", fields);
  }

  const message =
    typeof detail === "string"
      ? detail
      : res.status === 429
      ? "Conta bloqueada, tente novamente mais tarde."
      : "Erro inesperado. Tente novamente.";
  return new ApiError(res.status, message, {}, retryAfter);
}

/* ───────────────────────────── Endpoints ───────────────────────────── */

export const auth = {
  cadastrar: (dados: CadastroRequest) =>
    request<Usuario>("/auth/cadastro", { method: "POST", body: dados, auth: false }),

  async login(email: string, senha: string): Promise<TokenResponse> {
    const t = await request<TokenResponse>("/auth/login", { method: "POST", body: { email, senha }, auth: false });
    saveSession(t);
    return t;
  },

  me: () => request<Usuario>("/auth/me"),
  logout: () => clearSession(), // não há endpoint de logout: o token só expira
};

export const comprovantes = {
  meus: () => request<Comprovante[]>("/comprovantes/meus"),
  reenviar: (arquivo_url: string) =>
    request<Comprovante>("/comprovantes", { method: "POST", body: { arquivo_url } }),

  // Admin (Organizador / Comitê Científico / DEV)
  fila: (q: { status?: StatusComprovante; hackathon_id?: string; limite?: number; deslocamento?: number } = {}) =>
    request<ComprovanteAdmin[]>("/admin/comprovantes", { query: q }),
  aprovar: (id: string) =>
    request<ComprovanteAdmin>(`/admin/comprovantes/${id}/aprovar`, { method: "POST" }),
  recusar: (id: string, motivo_recusa: string) =>
    request<ComprovanteAdmin>(`/admin/comprovantes/${id}/recusar`, { method: "POST", body: { motivo_recusa } }),
};

export const equipes = {
  criar: (hackathon_id: string, nome?: string | null) =>
    request<Equipe>("/equipes", { method: "POST", body: { hackathon_id, nome: nome ?? null } }),
  minhas: () => request<Equipe[]>("/equipes/minhas"),
  obter: (id: string) => request<Equipe>(`/equipes/${id}`),
  renomear: (id: string, nome: string | null) =>
    request<Equipe>(`/equipes/${id}`, { method: "PATCH", body: { nome } }),

  membros: (id: string) => request<MembroEquipe[]>(`/equipes/${id}/membros`),
  alterarFuncao: (equipeId: string, usuarioId: string, funcao: FuncaoMembro | null) =>
    request<MembroEquipe>(`/equipes/${equipeId}/membros/${usuarioId}`, { method: "PATCH", body: { funcao } }),
  removerMembro: (equipeId: string, usuarioId: string) =>
    request<void>(`/equipes/${equipeId}/membros/${usuarioId}`, { method: "DELETE" }),

  painel: (id: string) => request<PainelEquipe>(`/equipes/${id}/painel`),
  concluirInscricao: (id: string) =>
    request<ConclusaoInscricao>(`/equipes/${id}/inscricao/concluir`, { method: "POST" }),
};

export const convites = {
  enviar: (equipeId: string, nome: string, email: string) =>
    request<Convite>(`/equipes/${equipeId}/convites`, { method: "POST", body: { nome, email } }),
  daEquipe: (equipeId: string) => request<Convite[]>(`/equipes/${equipeId}/convites`),
  meus: () => request<ConviteRecebido[]>("/convites/meus"),
  aceitar: (id: string, termos_ids: string[]) =>
    request<Convite>(`/convites/${id}/aceitar`, { method: "POST", body: { termos_ids } }),
  recusar: (id: string) => request<Convite>(`/convites/${id}/recusar`, { method: "POST" }),
  cancelar: (id: string) => request<Convite>(`/convites/${id}/cancelar`, { method: "POST" }),
};

export const termos = {
  vigentes: (hackathonId: string) => request<Termo[]>(`/hackathons/${hackathonId}/termos/vigentes`),
  aceitar: (hackathonId: string, termos_ids: string[]) =>
    request<AceiteTermo[]>(`/hackathons/${hackathonId}/termos/aceites`, { method: "POST", body: { termos_ids } }),
};

export const propostas = {
  criarRascunho: (equipeId: string, dados: PropostaInput = {}) =>
    request<Proposta>(`/equipes/${equipeId}/proposta/rascunho`, { method: "POST", body: dados }),
  obterRascunho: (equipeId: string) => request<Proposta>(`/equipes/${equipeId}/proposta/rascunho`),
  salvarRascunho: (equipeId: string, dados: PropostaInput) =>
    request<Proposta>(`/equipes/${equipeId}/proposta/rascunho`, { method: "PATCH", body: dados }),
};

export const admin = {
  perfisCadastraveis: () => request<{ perfis: PapelUsuario[] }>("/admin/usuarios/perfis"),
  cadastrarUsuario: (dados: UsuarioAdminCreate) =>
    request<Usuario>("/admin/usuarios", { method: "POST", body: dados }),
  reavaliarEquipes: (hackathonId: string) =>
    request<Reavaliacao>(`/admin/hackathons/${hackathonId}/equipes/reavaliar`, { method: "POST" }),
};

/* ───────────────────────── Upload do comprovante ─────────────────────────
   O backend só recebe o LINK. O arquivo vai direto do navegador ao Cloudinary
   (upload "unsigned": cloud name e preset não são segredos). */

const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_OK = ["application/pdf", "image/png", "image/jpeg"];

export async function enviarArquivoComprovante(file: File): Promise<string> {
  if (!TIPOS_OK.includes(file.type)) throw new Error("Envie um PDF, PNG ou JPG.");
  if (file.size > MAX_BYTES) throw new Error("O arquivo deve ter no máximo 10 MB.");

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) throw new Error("Upload não configurado (variáveis do Cloudinary ausentes).");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Falha ao enviar o arquivo. Tente novamente.");

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("O serviço de arquivos não devolveu o link.");
  return data.secure_url; // o backend exige terminar em .pdf/.png/.jpg/.jpeg
}
