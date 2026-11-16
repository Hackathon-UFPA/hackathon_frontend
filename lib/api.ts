// lib/api.ts — ÚNICO cliente HTTP do front.
// Contrato: OpenAPI "Hackathon API" 0.1.0 (api-hackathon-ufpa.duckdns.org).
//
// Organização:
//   1. Tipos do contrato (espelham os schemas do backend)
//   2. Sessão (token em localStorage "hk_token") e núcleo HTTP
//   3. Endpoints por recurso (auth, comprovantes, equipes, convites, termos,
//      propostas, hackathons, admin)
//   4. Adaptadores de tela (moduloCApi, moduloDApi): convertem o contrato para o
//      formato que os componentes já usam. Migrar os componentes para o contrato
//      direto é dívida técnica, não bug.
//   5. Upload do comprovante (Cloudinary, preset unsigned)
//
// Variáveis (.env.local):
//   BACKEND_URL (usada pelo proxy do next.config.ts, no servidor)
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
//   NEXT_PUBLIC_API_URL (opcional; padrão "/api-backend")

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api-backend").replace(/\/$/, "");

/* ───────────────────────────── 1. Tipos do contrato ───────────────────────────── */

export type PapelUsuario =
  | "PARTICIPANTE"
  | "MENTOR"
  | "COMITE_TECNICO"
  | "COMITE_CIENTIFICO"
  | "ORGANIZADOR"
  | "DEV";
export type SituacaoConta = "PENDENTE" | "ATIVA";
export type SituacaoEquipe =
  | "EM_FORMACAO"
  | "AGUARDANDO_HOMOLOGACAO"
  | "HOMOLOGADA"
  | "NAO_HOMOLOGADA";
export type FuncaoMembro = "LIDER" | "DESENVOLVEDOR" | "DESIGNER" | "NEGOCIOS" | "OUTRO";
export type StatusConvite = "PENDENTE" | "ACEITO" | "RECUSADO" | "CANCELADO";
export type StatusComprovante = "PENDENTE" | "APROVADO" | "RECUSADO";
export type StatusProposta = "RASCUNHO" | "ENVIADA";
export type TipoTermo = "REGULAMENTO" | "TERMO_CONSENTIMENTO";
export type StatusHackathon =
  | "RASCUNHO"
  | "INSCRICOES"
  | "INSCRICOES_ENCERRADAS"
  | "ATIVO"
  | "EM_AVALIACAO"
  | "FINALIZADO"
  | "CANCELADO";
export type FaseRubrica = "PROPOSTA" | "PROJETO_FINAL";

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
  criado_em?: string | null;
  atualizado_em?: string | null;
}
export type UsuarioMe = Usuario;

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string; // 8–128 caracteres, com letra e número
  instituicao: string;
  curso: string;
  periodo: number;
  comprovante_url: string; // https, termina em .pdf/.png/.jpg/.jpeg
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  usuario: Usuario;
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

/** Contrato: GET /convites/meus. Campos abaixo de `criado_em` são preenchidos pelo adaptador. */
export interface ConviteRecebido {
  id: string;
  equipe_id: string;
  equipe_nome: string | null;
  hackathon_id: string;
  nome: string;
  status: StatusConvite;
  enviado_em?: string | null;
  criado_em?: string | null;
  hackathon_nome?: string;
  funcao?: FuncaoMembro;
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
export type TermoVigente = Termo;

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

/** Formato usado pelas telas de comprovante do participante. */
export interface ComprovanteItem {
  id: string;
  url: string;
  status: StatusComprovante;
  motivo_recusa?: string | null;
  enviado_em: string;
  avaliado_em?: string | null;
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

/** Contrato: integrante no painel da equipe. */
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

/** Contrato: GET /equipes/{id}/painel */
export interface PainelEquipe {
  equipe_id: string;
  hackathon_id: string;
  nome?: string | null;
  situacao: SituacaoEquipe;
  inscricao_concluida_em?: string | null;
  homologada_em?: string | null;
  protocolo?: Protocolo | null;
  protocolo_proposta?: Protocolo | null;
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

export interface HackathonResponse {
  id: string;
  nome?: string | null;
  tema?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status?: StatusHackathon | null;
  min_integrantes?: number;
  max_integrantes?: number;
  inscricoes_inicio?: string | null;
  inscricoes_fim?: string | null;
  homologacao_fim?: string | null;
  propostas_inicio?: string | null;
  propostas_fim?: string | null;
  avaliadores_por_proposta?: number | null;
}
export type HackathonResumo = HackathonResponse;
/** Corpo de criação e edição do hackathon (todos os campos opcionais). */
export type HackathonDados = Partial<Omit<HackathonResponse, "id">>;

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

/** Contrato da proposta (rascunho e envio). */
export interface SubmissaoResponse {
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

export interface SubmissaoEnviadaResponse extends SubmissaoResponse {
  protocolo: Protocolo;
  versao?: number | null;
}

export interface VersaoPropostaResponse {
  numero: number;
  tema_id?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  ods?: number[] | null;
  bases_dados?: string | null;
  documento_url?: string | null;
  enviada_por?: string | null;
  enviada_em: string;
  protocolo: Protocolo;
}

export type SubmissaoPayload = PropostaInput;

export interface SubmissaoReenvioPayload {
  tema_id: string;
  titulo: string;
  descricao: string;
  ods: number[];
  bases_dados: string;
  documento_url?: string | null;
}

export interface TemaItem {
  id: string;
  hackathon_id: string;
  titulo: string;
  descricao: string;
  contexto?: string | null;
  ods: number[];
  ativo: boolean;
}

export interface CriterioRubrica {
  id: string;
  nome: string;
  descricao: string;
  peso: string;
  escala_min: number;
  escala_max: number;
  ordem: number;
}

export interface RubricaPublicadaResponse {
  id: string;
  hackathon_id: string;
  fase: FaseRubrica;
  publicada: boolean;
  publicada_em?: string | null;
  soma_pesos: string;
  criterios: CriterioRubrica[];
}

/* ───────────────────────────── 2. Sessão e núcleo HTTP ───────────────────────────── */

export class ApiError extends Error {
  status: number;
  /** Erros de validação (422) por campo: { senha: "mensagem" } */
  fields: Record<string, string>;
  /** Segundos restantes do bloqueio (429), se o CORS expuser o cabeçalho */
  retryAfter?: number;

  constructor(
    status: number,
    message: string,
    fields: Record<string, string> = {},
    retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

const TOKEN_KEY = "hk_token";
const USER_KEY = "hk_user";
const EXP_KEY = "hk_exp";

const isBrowser = () => typeof window !== "undefined";

function safeGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* armazenamento indisponível */
  }
}
function safeRemove(key: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* armazenamento indisponível */
  }
}

/** Única fonte do token. Outros módulos não devem ler o localStorage diretamente. */
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
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
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

type Query = Record<string, string | number | boolean | undefined | null>;
type Opts = {
  method?: string;
  body?: unknown;
  /** false = rota pública: não envia token (evita 401 com token antigo). */
  auth?: boolean;
  query?: Query;
};

async function request<T>(
  path: string,
  { method = "GET", body, auth = true, query }: Opts = {}
): Promise<T> {
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
  try {
    data = await res.json();
  } catch {
    // corpo vazio ou não-JSON
  }

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
    const [primeiro] = Object.entries(fields);
    const resumo = primeiro ? ` (${primeiro[0]}: ${primeiro[1]})` : "";
    return new ApiError(res.status, `Há campos inválidos no formulário${resumo}.`, fields);
  }

  const message =
    typeof detail === "string"
      ? detail
      : res.status === 429
        ? "Conta bloqueada, tente novamente mais tarde."
        : "Erro inesperado. Tente novamente.";

  return new ApiError(res.status, message, {}, retryAfter);
}

const naoEncontrado = (e: unknown) => e instanceof ApiError && e.status === 404;

/* ───────────────────────────── 3. Endpoints por recurso ───────────────────────────── */

export const auth = {
  cadastrar: (dados: CadastroRequest) =>
    request<Usuario>("/auth/cadastro", { method: "POST", body: dados, auth: false }),

  async login(email: string, senha: string): Promise<TokenResponse> {
    const t = await request<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, senha },
      auth: false,
    });
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
    request<ComprovanteAdmin>(`/admin/comprovantes/${id}/recusar`, {
      method: "POST",
      body: { motivo_recusa },
    }),
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
    request<MembroEquipe>(`/equipes/${equipeId}/membros/${usuarioId}`, {
      method: "PATCH",
      body: { funcao },
    }),
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
  vigentes: (hackathonId: string) =>
    request<Termo[]>(`/hackathons/${hackathonId}/termos/vigentes`),
  aceitar: (hackathonId: string, termos_ids: string[]) =>
    request<AceiteTermo[]>(`/hackathons/${hackathonId}/termos/aceites`, {
      method: "POST",
      body: { termos_ids },
    }),
};

export const hackathons = {
  listar: () => request<HackathonResponse[]>("/hackathons"),
  obter: (id: string) => request<HackathonResponse>(`/hackathons/${id}`),
};

export type RecomendacaoAvaliacao = "APROVACAO" | "REPROVACAO";

/** Parecer de um avaliador, sem identificar quem escreveu (RF33). */
export interface ParecerEquipe {
  parecer?: string | null;
  recomendacao?: RecomendacaoAvaliacao | null;
}

/** GET /equipes/{id}/resultado. Não traz nota média nem classificação. */
export interface ResultadoEquipe {
  equipe_id: string;
  hackathon_id: string;
  /** Falso enquanto o resultado da edição não for homologado. */
  divulgado: boolean;
  divulgado_em?: string | null;
  submissao_id?: string | null;
  titulo?: string | null;
  /** Decisão da homologação; null antes dela. */
  aprovada?: boolean | null;
  /** Equipe não aprovada: rotas de escrita respondem 409. */
  somente_leitura: boolean;
  pareceres: ParecerEquipe[];
}

/** Resultado científico privado da equipe (PRO-04). Só integrantes da equipe (e DEV). */
export const resultados = {
  daEquipe: (equipeId: string) => request<ResultadoEquipe>(`/equipes/${equipeId}/resultado`),
};

/** Corpo de criação e edição de tema (catálogo de temas da proposta). */
export interface TemaDados {
  titulo: string;
  descricao: string;
  contexto?: string | null;
  ods: number[];
  ativo?: boolean;
}

/**
 * Catálogo de temas que o participante escolhe na proposta (RF15).
 * Não confundir com `hackathon.tema`, que é só o texto do tema geral da edição.
 */
export const temas = {
  /** Sem `incluirInativos` a rota é pública e devolve só os ativos. */
  listar: (hackathonId: string, incluirInativos = false) =>
    request<TemaItem[]>(`/hackathons/${hackathonId}/temas`, {
      query: incluirInativos ? { incluir_inativos: true } : undefined,
      auth: incluirInativos,
    }),
  // Comitê Científico, Organizador ou DEV
  criar: (hackathonId: string, dados: TemaDados) =>
    request<TemaItem>(`/hackathons/${hackathonId}/temas`, { method: "POST", body: dados }),
  editar: (temaId: string, dados: Partial<TemaDados>) =>
    request<TemaItem>(`/temas/${temaId}`, { method: "PATCH", body: dados }),
  /** 409 se o tema já tem propostas (inclusive rascunhos): nesse caso, desative. */
  excluir: (temaId: string) => request<void>(`/temas/${temaId}`, { method: "DELETE" }),
};

/** Rascunho da proposta (chamadas diretas; o editor usa o moduloDApi). */
export const propostas = {
  criarRascunho: (equipeId: string, dados: PropostaInput = {}) =>
    request<Proposta>(`/equipes/${equipeId}/proposta/rascunho`, { method: "POST", body: dados }),
  obterRascunho: (equipeId: string) => request<Proposta>(`/equipes/${equipeId}/proposta/rascunho`),
  salvarRascunho: (equipeId: string, dados: PropostaInput) =>
    request<Proposta>(`/equipes/${equipeId}/proposta/rascunho`, { method: "PATCH", body: dados }),
};

export const admin = {
  perfisCadastraveis: () => request<{ perfis: PapelUsuario[] }>("/admin/usuarios/perfis"),
  cadastrarUsuario: (dados: {
    email: string;
    papel: PapelUsuario;
    senha: string;
    nome?: string | null;
    instituicao?: string | null;
    curso?: string | null;
    periodo?: number | null;
  }) => request<Usuario>("/admin/usuarios", { method: "POST", body: dados }),
  reavaliarEquipes: (hackathonId: string) =>
    request<Reavaliacao>(`/admin/hackathons/${hackathonId}/equipes/reavaliar`, { method: "POST" }),

  criarHackathon: (dados: HackathonDados) =>
    request<HackathonResponse>("/admin/hackathons", { method: "POST", body: dados }),
  editarHackathon: (id: string, dados: HackathonDados) =>
    request<HackathonResponse>(`/admin/hackathons/${id}`, { method: "PATCH", body: dados }),
  excluirHackathon: (id: string) =>
    request<void>(`/admin/hackathons/${id}`, { method: "DELETE" }),
};

/* ───────────────────────────── 4. Adaptadores de tela ───────────────────────────── */

export const CATALOGO_ODS: ReadonlyArray<{ numero: number; titulo: string }> = [
  { numero: 1, titulo: "Erradicação da Pobreza" },
  { numero: 2, titulo: "Fome Zero e Agricultura Sustentável" },
  { numero: 3, titulo: "Saúde e Bem-Estar" },
  { numero: 4, titulo: "Educação de Qualidade" },
  { numero: 5, titulo: "Igualdade de Gênero" },
  { numero: 6, titulo: "Água Potável e Saneamento" },
  { numero: 7, titulo: "Energia Limpa e Acessível" },
  { numero: 8, titulo: "Trabalho Decente e Crescimento Econômico" },
  { numero: 9, titulo: "Indústria, Inovação e Infraestrutura" },
  { numero: 10, titulo: "Redução das Desigualdades" },
  { numero: 11, titulo: "Cidades e Comunidades Sustentáveis" },
  { numero: 12, titulo: "Consumo e Produção Responsáveis" },
  { numero: 13, titulo: "Ação Contra a Mudança Global do Clima" },
  { numero: 14, titulo: "Vida na Água" },
  { numero: 15, titulo: "Vida Terrestre" },
  { numero: 16, titulo: "Paz, Justiça e Instituições Eficazes" },
  { numero: 17, titulo: "Parcerias e Meios de Implementação" },
];

export function formatarDataBrasilia(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Integrante no formato que a tela de equipe usa. */
export interface IntegranteEquipe {
  usuario_id: string | null;
  convite_id: string | null;
  nome: string;
  email: string;
  funcao: FuncaoMembro | null;
  integrante: boolean;
  status_convite: StatusConvite;
  situacao_conta?: SituacaoConta;
  status_comprovante?: StatusComprovante;
  termos_aceitos: boolean;
  /** Pendências que a API atribui a esta pessoa (as mensagens já trazem o nome). */
  pendencias: string[];
}

export interface PainelEquipeNormalizado {
  equipe_id: string;
  nome: string;
  hackathon_id: string;
  hackathon_nome?: string;
  situacao: SituacaoEquipe;
  min_integrantes: number;
  max_integrantes: number;
  inscricoes_abertas: boolean;
  voce_e_lider: boolean;
  protocolo_inscricao?: Protocolo | null;
  protocolo_proposta?: Protocolo | null;
  integrantes: IntegranteEquipe[];
  pendencias: string[];
  pode_concluir: boolean;
}

export interface MinhaEquipeResumo {
  id: string;
  nome: string;
  hackathon_id: string;
  hackathon_nome?: string;
  situacao: SituacaoEquipe;
  minha_funcao: FuncaoMembro | null;
  total_integrantes?: number;
}

/**
 * Adaptador das telas do participante (/equipe e componentes modulo-c).
 * Observações:
 * - A API não grava a função escolhida no convite: ela fica nula até o líder
 *   defini-la em alterarFuncaoIntegrante.
 * - Líder não tem convite. Na tabela ele aparece como "Convite Aceito".
 */
export const moduloCApi = {
  obterMe: () => auth.me(),

  listarHackathons: () => hackathons.listar(),

  listarMeusComprovantes: async (): Promise<ComprovanteItem[]> =>
    (await comprovantes.meus()).map(
      (c): ComprovanteItem => ({
        id: c.id,
        url: c.arquivo_url,
        status: c.status,
        motivo_recusa: c.motivo_recusa,
        enviado_em: c.enviado_em ?? "",
        avaliado_em: c.validado_em,
      })
    ),

  enviarNovoComprovante: async (url: string): Promise<void> => {
    await comprovantes.reenviar(url);
  },

  listarMeusConvites: async (): Promise<ConviteRecebido[]> => {
    const [lista, edicoes] = await Promise.all([
      convites.meus(),
      // Conta pendente recebe 403 em /hackathons: o nome da edição é só complemento.
      hackathons.listar().catch(() => [] as HackathonResponse[]),
    ]);
    return lista.map(
      (c): ConviteRecebido => ({
        ...c,
        criado_em: c.enviado_em ?? null,
        hackathon_nome: edicoes.find((h) => h.id === c.hackathon_id)?.nome ?? undefined,
      })
    );
  },

  aceitarConvite: (conviteId: string, termos_ids: string[]) =>
    convites.aceitar(conviteId, termos_ids),

  recusarConvite: (conviteId: string) => convites.recusar(conviteId),

  listarTermosVigentes: (hackathonId: string) => termos.vigentes(hackathonId),

  aceitarTermos: (hackathonId: string, termos_ids: string[]) =>
    termos.aceitar(hackathonId, termos_ids),

  listarMinhasEquipes: async (): Promise<MinhaEquipeResumo[]> => {
    const [lista, eu, todas] = await Promise.all([
      equipes.minhas(),
      auth.me(),
      hackathons.listar(),
    ]);
    return Promise.all(
      lista.map(async (e): Promise<MinhaEquipeResumo> => {
        const membros = await equipes.membros(e.id);
        const minha = membros.find((m) => m.usuario_id === eu.id);
        return {
          id: e.id,
          nome: e.nome ?? "Equipe sem nome",
          hackathon_id: e.hackathon_id,
          hackathon_nome: todas.find((h) => h.id === e.hackathon_id)?.nome ?? undefined,
          situacao: e.situacao,
          minha_funcao: minha?.funcao ?? null,
          total_integrantes: membros.length,
        };
      })
    );
  },

  criarEquipe: (payload: { hackathon_id: string; nome: string }) =>
    equipes.criar(payload.hackathon_id, payload.nome),

  editarNomeEquipe: (equipeId: string, nome: string) => equipes.renomear(equipeId, nome),

  obterPainelEquipe: async (equipeId: string): Promise<PainelEquipeNormalizado> => {
    const raw = await equipes.painel(equipeId);
    const [convs, edicao] = await Promise.all([
      convites.daEquipe(equipeId).catch(() => [] as Convite[]),
      hackathons.obter(raw.hackathon_id).catch(() => null),
    ]);
    // Convite pendente por e-mail: necessário para cancelar. O painel não traz o id.
    const pendentePorEmail = new Map(
      convs.filter((c) => c.status === "PENDENTE").map((c) => [c.email.toLowerCase(), c])
    );

    return {
      equipe_id: raw.equipe_id,
      nome: raw.nome ?? "Equipe",
      hackathon_id: raw.hackathon_id,
      hackathon_nome: edicao?.nome ?? undefined,
      situacao: raw.situacao,
      min_integrantes: raw.minimo_integrantes,
      max_integrantes: raw.maximo_integrantes,
      inscricoes_abertas: raw.inscricoes_abertas,
      voce_e_lider: raw.voce_e_lider,
      protocolo_inscricao: raw.protocolo ?? null,
      protocolo_proposta: raw.protocolo_proposta ?? null,
      integrantes: raw.integrantes.map(
        (i): IntegranteEquipe => ({
          usuario_id: i.usuario_id ?? null,
          convite_id: pendentePorEmail.get(i.email.toLowerCase())?.id ?? null,
          nome: i.nome ?? i.email,
          email: i.email,
          funcao: i.funcao ?? null,
          integrante: i.integrante,
          status_convite: i.convite ?? "ACEITO",
          status_comprovante: i.comprovante ?? undefined,
          termos_aceitos: i.termos_aceitos,
          pendencias: i.usuario_id
            ? raw.pendencias.filter((p) => p.usuario_id === i.usuario_id).map((p) => p.mensagem)
            : [],
        })
      ),
      // Pendências que não bloqueiam a conclusão só impedem a homologação.
      pendencias: raw.pendencias.map((p) =>
        p.bloqueia_conclusao ? p.mensagem : `${p.mensagem} (impede só a homologação)`
      ),
      pode_concluir: raw.pode_concluir,
    };
  },

  /**
   * Convida pelo e-mail da conta. A API exige nome e a tela não coleta nome,
   * então usa a parte local do e-mail como fallback.
   * `funcao` não é gravada no convite (ver nota acima).
   */
  convidarIntegrante: (
    equipeId: string,
    dados: { nome?: string; email: string; funcao?: Exclude<FuncaoMembro, "LIDER"> }
  ) =>
    convites.enviar(
      equipeId,
      (dados.nome ?? dados.email.split("@")[0]).trim(),
      dados.email.trim()
    ),

  cancelarConviteEquipe: (_equipeId: string, conviteId: string) => convites.cancelar(conviteId),

  alterarFuncaoIntegrante: (
    equipeId: string,
    usuarioId: string,
    funcao: Exclude<FuncaoMembro, "LIDER">
  ) => equipes.alterarFuncao(equipeId, usuarioId, funcao),

  removerIntegrante: (equipeId: string, usuarioId: string) =>
    equipes.removerMembro(equipeId, usuarioId),

  concluirInscricao: async (equipeId: string) => {
    const r = await equipes.concluirInscricao(equipeId);
    return {
      ...r,
      protocolo: {
        numero: r.protocolo.numero,
        emitido_em: r.protocolo.emitido_em ?? r.inscricao_concluida_em,
      },
    };
  },
};

/** Adaptador do Módulo D (editor de proposta em /proposta). */
export const moduloDApi = {
  listarTemasEdicao: (hackathonId: string) =>
    request<TemaItem[]>(`/hackathons/${encodeURIComponent(hackathonId)}/temas`, { auth: false }),

  obterRubricaProposta: async (hackathonId: string): Promise<RubricaPublicadaResponse | null> => {
    try {
      return await request<RubricaPublicadaResponse>(
        `/hackathons/${encodeURIComponent(hackathonId)}/rubrica?fase=PROPOSTA`,
        { auth: false }
      );
    } catch (e) {
      if (naoEncontrado(e)) return null;
      throw e;
    }
  },

  obterRascunho: async (equipeId: string): Promise<SubmissaoResponse | null> => {
    try {
      return await request<SubmissaoResponse>(
        `/equipes/${encodeURIComponent(equipeId)}/proposta/rascunho`
      );
    } catch (e) {
      if (naoEncontrado(e)) return null;
      throw e;
    }
  },

  criarRascunho: (equipeId: string, payload: SubmissaoPayload) =>
    request<SubmissaoResponse>(`/equipes/${encodeURIComponent(equipeId)}/proposta/rascunho`, {
      method: "POST",
      body: payload,
    }),

  editarRascunho: (equipeId: string, payload: SubmissaoPayload) =>
    request<SubmissaoResponse>(`/equipes/${encodeURIComponent(equipeId)}/proposta/rascunho`, {
      method: "PATCH",
      body: payload,
    }),

  enviarProposta: (equipeId: string) =>
    request<SubmissaoEnviadaResponse>(`/equipes/${encodeURIComponent(equipeId)}/proposta/enviar`, {
      method: "POST",
    }),

  obterPropostaEnviada: async (equipeId: string): Promise<SubmissaoEnviadaResponse | null> => {
    try {
      return await request<SubmissaoEnviadaResponse>(
        `/equipes/${encodeURIComponent(equipeId)}/proposta`
      );
    } catch (e) {
      if (naoEncontrado(e)) return null;
      throw e;
    }
  },

  reenviarProposta: (equipeId: string, payload: SubmissaoReenvioPayload) =>
    request<SubmissaoEnviadaResponse>(`/equipes/${encodeURIComponent(equipeId)}/proposta/reenviar`, {
      method: "POST",
      body: payload,
    }),

  listarVersoes: async (equipeId: string): Promise<VersaoPropostaResponse[]> => {
    try {
      return await request<VersaoPropostaResponse[]>(
        `/equipes/${encodeURIComponent(equipeId)}/proposta/versoes`
      );
    } catch (e) {
      if (naoEncontrado(e)) return [];
      throw e;
    }
  },
};

/* ───────────────────────────── 5. Upload do comprovante ───────────────────────────── */

const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_OK = ["application/pdf", "image/png", "image/jpeg"];

/** O backend recebe só o LINK. O arquivo vai direto ao Cloudinary (preset unsigned). */
export async function enviarArquivoComprovante(file: File): Promise<string> {
  if (!TIPOS_OK.includes(file.type)) throw new Error("Envie um PDF, PNG ou JPG.");
  if (file.size > MAX_BYTES) throw new Error("O arquivo deve ter no máximo 10 MB.");

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error("Upload não configurado (variáveis do Cloudinary ausentes).");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Falha ao enviar o arquivo. Tente novamente.");

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("O serviço de arquivos não devolveu o link.");
  return data.secure_url; // o backend exige terminar em .pdf/.png/.jpg/.jpeg
}