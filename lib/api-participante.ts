// lib/api-participante.ts — rotas do lado do participante que não estão em lib/api.ts:
// central de notificações, autodeclaração do vínculo, cadastro pelo link do convite,
// sessão (RF09), composição e mentor da equipe, reenvio e versões da proposta.
// Tipos espelham o OpenAPI do backend; o núcleo HTTP é o `request` de lib/api.ts.

import {
  request,
  type FuncaoMembro,
  type PapelUsuario,
  type StatusComprovante,
  type StatusConvite,
  type StatusProposta,
  type Usuario,
} from "./api";

const id = (v: string) => encodeURIComponent(v);

/* ───────────────────────────── Central de notificações ───────────────────────────── */

export type TipoNotificacao =
  | "CONVITE"
  | "ACEITE"
  | "INSCRICAO"
  | "PROPOSTA"
  | "RESULTADO"
  | "MENTOR"
  | "CHAT"
  | "PRAZO";

export const ROTULO_TIPO_NOTIFICACAO: Record<TipoNotificacao, string> = {
  CONVITE: "Convite",
  ACEITE: "Resposta a convite",
  INSCRICAO: "Inscrição",
  PROPOSTA: "Proposta",
  RESULTADO: "Resultado",
  MENTOR: "Mentoria",
  CHAT: "Mensagem",
  PRAZO: "Prazo",
};

export interface ReferenciaNotificacao {
  /** Tipo do objeto de origem (ex.: CONVITE, HOMOLOGACAO). */
  tipo: string;
  id: string;
}

export interface ParecerNotificacao {
  parecer?: string | null;
  recomendacao?: "APROVACAO" | "REPROVACAO" | null;
}

interface NotificacaoBase {
  /** Nos itens RESULTADO é o id do RF33; use `notificacao_id` nas rotas de leitura. */
  id: string;
  notificacao_id: string;
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown> | null;
  referencia?: ReferenciaNotificacao | null;
  criado_em: string;
  /** Nulo enquanto não lida. */
  lida_em?: string | null;
}

export interface NotificacaoGenerica extends NotificacaoBase {
  tipo: Exclude<TipoNotificacao, "RESULTADO">;
}

export interface NotificacaoResultadoCentral extends NotificacaoBase {
  tipo: "RESULTADO";
  hackathon_id: string;
  equipe_id: string;
  submissao_id: string;
  aprovada: boolean;
  canal: "PLATAFORMA" | "EMAIL";
  status_envio: "PENDENTE" | "ENVIADO" | "FALHA";
  enviado_em?: string | null;
  erro?: string | null;
  pareceres: ParecerNotificacao[];
}

/** GET /me/notificacoes: união discriminada por `tipo`. */
export type Notificacao = NotificacaoGenerica | NotificacaoResultadoCentral;

export interface FiltroNotificacoes {
  lida?: boolean;
  tipo?: TipoNotificacao;
  /** 1 a 100 (padrão 100). */
  limite?: number;
  deslocamento?: number;
}

/** Avisado pelo sino e pela página quando a contagem muda nesta aba. */
export const EVENTO_NOTIFICACOES_ALTERADAS = "hk:notificacoes-alteradas";

export function avisarNotificacoesAlteradas() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_NOTIFICACOES_ALTERADAS));
}

/** Exige conta ativa: conta pendente recebe 403. */
export const notificacoes = {
  listar: (f: FiltroNotificacoes = {}) =>
    request<Notificacao[]>("/me/notificacoes", { query: { ...f } }),
  contarNaoLidas: () => request<{ nao_lidas: number }>("/me/notificacoes/nao-lidas/contagem"),
  /** Idempotente: marcar de novo devolve o `lida_em` original. Use `notificacao_id`. */
  marcarLida: (notificacaoId: string) =>
    request<Notificacao>(`/me/notificacoes/${id(notificacaoId)}/lida`, { method: "POST" }),
  marcarTodasLidas: () => request<{ marcadas: number }>("/me/notificacoes/lidas", { method: "POST" }),
};

/**
 * Link da tela que trata o assunto da notificação, quando houver. As telas de equipe e
 * proposta são do participante: para os outros perfis não há link.
 */
export function linkDaNotificacao(n: Notificacao, papel?: PapelUsuario | null): string | null {
  if (papel && papel !== "PARTICIPANTE" && papel !== "DEV") return null;
  const dados = n.dados ?? {};
  const equipeId =
    n.tipo === "RESULTADO"
      ? n.equipe_id
      : typeof dados.equipe_id === "string"
        ? dados.equipe_id
        : null;
  switch (n.tipo) {
    case "CONVITE":
      return "/equipe";
    case "RESULTADO":
    case "PROPOSTA":
      return equipeId ? `/proposta?equipe_id=${id(equipeId)}` : "/proposta";
    case "ACEITE":
    case "INSCRICAO":
    case "MENTOR":
      return equipeId ? `/equipe?equipe_id=${id(equipeId)}` : "/equipe";
    default:
      return null;
  }
}

/* ───────────────────────────── Autodeclaração do vínculo ───────────────────────────── */

export type TipoIntegrante = "ESTUDANTE" | "PROFISSIONAL";
export type CategoriaEquipe = "ESTUDANTES" | "PROFISSIONAIS" | "MISTA";

export const ROTULO_TIPO_INTEGRANTE: Record<TipoIntegrante, string> = {
  ESTUDANTE: "Estudante",
  PROFISSIONAL: "Profissional",
};

export const ROTULO_CATEGORIA: Record<CategoriaEquipe, string> = {
  ESTUDANTES: "Só estudantes",
  PROFISSIONAIS: "Só profissionais",
  MISTA: "Mista",
};

export interface Autodeclaracao {
  id: string;
  hackathon_id: string;
  tipo: TipoIntegrante;
  instituicao?: string | null;
  curso?: string | null;
  periodo?: number | null;
  organizacao?: string | null;
  cargo?: string | null;
  declarada_em?: string | null;
}

export interface ComprovacaoResumo {
  id: string;
  tipo_vinculo: TipoIntegrante;
  status: StatusComprovante;
  motivo_recusa?: string | null;
  enviado_em?: string | null;
  validado_em?: string | null;
}

export interface SituacaoAutodeclaracao {
  hackathon_id: string;
  atual?: Autodeclaracao | null;
  historico: Autodeclaracao[];
  tipo_indicado_pelo_lider?: TipoIntegrante | null;
  comprovante?: ComprovacaoResumo | null;
  /** Só com comprovante APROVADO: declarar não comprova nada. */
  vinculo_comprovado: boolean;
  autodeclaracao_exigida: boolean;
  comprovante_exigido: boolean;
}

export type AutodeclaracaoEnvio =
  | { tipo: "ESTUDANTE"; instituicao: string; curso: string; periodo: number }
  | { tipo: "PROFISSIONAL"; organizacao: string; cargo: string };

/**
 * Participante (e DEV), com conta pendente inclusive. Sempre por edição (BE-S6-14): a consulta
 * vale também para edições encerradas (histórico); a declaração exige inscrições abertas.
 */
export const autodeclaracao = {
  obter: (hackathonId: string) =>
    request<SituacaoAutodeclaracao>("/me/autodeclaracao", { query: { hackathon_id: hackathonId } }),
  declarar: (hackathonId: string, dados: AutodeclaracaoEnvio) =>
    request<Autodeclaracao>("/me/autodeclaracao", {
      method: "PUT",
      body: dados,
      query: { hackathon_id: hackathonId },
    }),
};

/* ───────────────────────────── Cadastro pelo link do convite ───────────────────────────── */

export interface ConviteCadastro {
  /** Fixo: a conta é criada com o e-mail que recebeu o convite. */
  email: string;
  nome: string;
  equipe_nome?: string | null;
  lider_nome?: string | null;
  tipo_integrante: TipoIntegrante;
  expira_em?: string | null;
}

export interface CadastroPorConvite {
  token: string;
  senha: string;
  nome?: string | null;
  instituicao?: string | null;
  curso?: string | null;
  periodo?: number | null;
  comprovante_url?: string | null;
}

/** Públicas. O link do e-mail é `/cadastro#convite=<token>`. */
export const cadastroConvite = {
  /** Não gasta o token. 400 para link inválido, vencido ou usado. */
  consultar: (token: string) =>
    request<ConviteCadastro>("/auth/cadastro/convite/consulta", {
      method: "POST",
      body: { token },
      auth: false,
    }),
  /** 201 com o usuário (conta PENDENTE, e-mail já confirmado); 409 se o e-mail já tem conta. */
  cadastrar: (dados: CadastroPorConvite) =>
    request<Usuario>("/auth/cadastro/convite", { method: "POST", body: dados, auth: false }),
};

/* ───────────────────────────── Sessão (RF09) ───────────────────────────── */

export interface SituacaoSessao {
  expira_em: string;
  segundos_restantes: number;
}

export const sessao = {
  obter: () => request<SituacaoSessao>("/auth/sessao"),
};

/* ───────────────────────────── Composição e mentor da equipe ───────────────────────────── */

export type CodigoPendencia =
  | "INSCRICOES_ENCERRADAS"
  | "EQUIPE_ABAIXO_DO_MINIMO"
  | "EQUIPE_ACIMA_DO_MAXIMO"
  | "CATEGORIA_NAO_PERMITIDA"
  | "CATEGORIA_INCOERENTE"
  | "CONVITE_PENDENTE"
  | "CONVITE_RECUSADO"
  | "TERMOS_NAO_PUBLICADOS"
  | "CONVITE_NAO_ACEITO"
  | "TERMOS_NAO_ACEITOS"
  | "CONTA_DESATIVADA"
  | "AUTODECLARACAO_PENDENTE"
  | "TIPO_DIVERGENTE"
  | "COMPROVANTE_NAO_ENVIADO"
  | "COMPROVANTE_PENDENTE"
  | "COMPROVANTE_RECUSADO";

export interface PendenciaComposicao {
  codigo: CodigoPendencia;
  mensagem: string;
  usuario_id?: string | null;
  /** Impede concluir a inscrição; as demais só impedem a homologação. */
  bloqueia_conclusao: boolean;
}

export interface IntegranteComposicao {
  indicado_pelo_lider: {
    nome?: string | null;
    email: string;
    tipo_integrante: TipoIntegrante;
    funcao?: FuncaoMembro | null;
  };
  confirmado_pelo_integrante: {
    integrante: boolean;
    usuario_id?: string | null;
    /** Vazio para o líder, que não foi convidado. */
    convite?: StatusConvite | null;
    conta_ativa?: boolean | null;
    termos_aceitos: boolean;
    comprovante?: StatusComprovante | null;
    tipo_declarado?: TipoIntegrante | null;
    vinculo_comprovado?: boolean;
  };
  pendencias: PendenciaComposicao[];
}

export interface Composicao {
  equipe_id: string;
  categoria: CategoriaEquipe;
  minimo_integrantes: number;
  maximo_integrantes: number;
  total_integrantes: number;
  total_indicados: number;
  integrantes: IntegranteComposicao[];
  pendencias_da_equipe: PendenciaComposicao[];
}

export interface IntegranteIndicado {
  nome: string;
  email: string;
  /** Obrigatório na categoria MISTA. */
  tipo_integrante?: TipoIntegrante | null;
}

export interface ComposicaoUpdate {
  categoria: CategoriaEquipe;
  tipo_lider?: TipoIntegrante | null;
  /** Lista completa, sem o líder: quem sai é retirado e quem entra é convidado. */
  integrantes: IntegranteIndicado[];
}

export interface MentorDaEquipe {
  atribuicao_id: string;
  equipe_id: string;
  hackathon_id: string;
  atribuido_em: string;
  mentor: {
    id: string;
    nome?: string | null;
    email: string;
    empresa_parceira?: string | null;
    area_atuacao?: string | null;
    ativo: boolean;
  };
}

export const equipeParticipante = {
  composicao: (equipeId: string) => request<Composicao>(`/equipes/${id(equipeId)}/composicao`),
  /** Só o líder, com a equipe EM_FORMACAO e inscrições abertas. */
  alterarComposicao: (equipeId: string, dados: ComposicaoUpdate) =>
    request<Composicao>(`/equipes/${id(equipeId)}/composicao`, { method: "PUT", body: dados }),
  /** 404 quando a equipe ainda não tem mentor (devolve null). */
  mentor: async (equipeId: string): Promise<MentorDaEquipe | null> => {
    try {
      return await request<MentorDaEquipe>(`/equipes/${id(equipeId)}/mentor`);
    } catch (e) {
      if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 404) {
        return null;
      }
      throw e;
    }
  },
};
