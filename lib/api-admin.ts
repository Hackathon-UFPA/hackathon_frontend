// lib/api-admin.ts — administração da organização (BE-S5-07, BE-S5-05, BE-S5-12).
// Gestão de contas da equipe interna (RN24), fila de e-mails transacionais e ciclo do
// regulamento (rascunho → publicação). O núcleo HTTP continua em ./api.

import { request, type PapelUsuario, type TipoTermo, type Usuario } from "./api";

/* ───────────────────────────── Usuários (RN24) ───────────────────────────── */

export const ROTULO_PAPEL: Record<PapelUsuario, string> = {
  ORGANIZADOR: "Organizador",
  COMITE_CIENTIFICO: "Comitê Científico",
  COMITE_TECNICO: "Comitê Técnico",
  MENTOR: "Mentor",
  PARTICIPANTE: "Participante",
  DEV: "DEV",
};

/** Só entre estes perfis a troca é permitida (409 nos demais casos). */
export const PAPEIS_DE_GESTAO: PapelUsuario[] = ["ORGANIZADOR", "COMITE_CIENTIFICO", "COMITE_TECNICO"];

export interface UsuarioAdmin extends Usuario {
  max_equipes?: number | null;
}

export interface FiltroUsuarios {
  papel?: PapelUsuario;
  ativo?: boolean;
  busca?: string;
  /** 1 a 100 (padrão 50). */
  limite?: number;
  deslocamento?: number;
}

/** PATCH: omita o que não muda; `null` dá 422. O e-mail só o dono troca. */
export interface UsuarioAdminUpdate {
  nome?: string;
  papel?: PapelUsuario;
  instituicao?: string;
  curso?: string;
  periodo?: number;
}

export const usuariosAdmin = {
  perfisCadastraveis: () => request<{ perfis: PapelUsuario[] }>("/admin/usuarios/perfis"),
  listar: (filtro: FiltroUsuarios = {}) =>
    request<UsuarioAdmin[]>("/admin/usuarios", { query: { ...filtro } }),
  obter: (id: string) => request<UsuarioAdmin>(`/admin/usuarios/${id}`),
  editar: (id: string, dados: UsuarioAdminUpdate) =>
    request<UsuarioAdmin>(`/admin/usuarios/${id}`, { method: "PATCH", body: dados }),
  desativar: (id: string) =>
    request<UsuarioAdmin>(`/admin/usuarios/${id}/desativar`, { method: "POST" }),
  reativar: (id: string) =>
    request<UsuarioAdmin>(`/admin/usuarios/${id}/reativar`, { method: "POST" }),
};

/* ───────────────────────────── Fila de e-mails ───────────────────────────── */

export type StatusEmail = "PENDENTE" | "ENVIANDO" | "ENVIADO" | "FALHA";
export type TipoEmail =
  | "CONFIRMACAO_EMAIL"
  | "RECUPERACAO_SENHA"
  | "DEFINICAO_SENHA"
  | "CONVITE_EQUIPE"
  | "INSCRICAO_CONCLUIDA"
  | "EQUIPE_HOMOLOGADA"
  | "PROTOCOLO_PROPOSTA"
  | "RESULTADO_PROPOSTA"
  | "ATRIBUICAO_MENTOR";

export const ROTULO_STATUS_EMAIL: Record<StatusEmail, string> = {
  PENDENTE: "Na fila",
  ENVIANDO: "Enviando",
  ENVIADO: "Enviado",
  FALHA: "Falhou",
};

export const ROTULO_TIPO_EMAIL: Record<TipoEmail, string> = {
  CONFIRMACAO_EMAIL: "Confirmação de e-mail",
  RECUPERACAO_SENHA: "Recuperação de senha",
  DEFINICAO_SENHA: "Acesso de mentor",
  CONVITE_EQUIPE: "Convite para equipe",
  INSCRICAO_CONCLUIDA: "Inscrição concluída",
  EQUIPE_HOMOLOGADA: "Equipe homologada",
  PROTOCOLO_PROPOSTA: "Protocolo da proposta",
  RESULTADO_PROPOSTA: "Resultado da proposta",
  ATRIBUICAO_MENTOR: "Atribuição de mentor",
};

/** Nunca traz o corpo da mensagem. */
export interface EmailFila {
  id: string;
  tipo: TipoEmail;
  destinatario_email: string;
  destinatario_nome?: string | null;
  usuario_id?: string | null;
  assunto: string;
  status: StatusEmail;
  tentativas: number;
  max_tentativas: number;
  proxima_tentativa_em: string;
  ultimo_erro?: string | null;
  enviado_em?: string | null;
  /** Convite revogado: cancelado, sem reenvio. */
  cancelado_em?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface FiltroEmails {
  status?: StatusEmail;
  tipo?: TipoEmail;
  /** Endereço exato (sem diferenciar maiúsculas). */
  destinatario?: string;
  limite?: number;
  deslocamento?: number;
}

export const emailsAdmin = {
  listar: (filtro: FiltroEmails = {}) =>
    request<EmailFila[]>("/admin/emails", { query: { ...filtro } }),
  obter: (id: string) => request<EmailFila>(`/admin/emails/${id}`),
  /** Só e-mails em FALHA (409 nos demais): volta para a fila com as tentativas zeradas. */
  reenviar: (id: string) => request<EmailFila>(`/admin/emails/${id}/reenviar`, { method: "POST" }),
};

/* ───────────────────────────── Regulamento e termos ───────────────────────────── */

export interface TermoAdmin {
  id: string;
  hackathon_id: string;
  tipo: TipoTermo;
  versao: string;
  titulo: string;
  conteudo: string | null;
  url: string | null;
  vigente: boolean;
  rascunho: boolean;
  publicado_em?: string | null;
}

export interface TermoRascunhoCriar {
  tipo: TipoTermo;
  versao: string;
  titulo: string;
  conteudo?: string | null;
  url?: string | null;
}

/** Versão não muda depois de criada. `null` em conteudo/url limpa o campo (um dos dois é obrigatório). */
export interface TermoRascunhoEditar {
  titulo?: string;
  conteudo?: string | null;
  url?: string | null;
}

const base = (hackathonId: string) => `/admin/hackathons/${hackathonId}/termos`;

export const termosRascunho = {
  listar: (hackathonId: string, filtro: { tipo?: TipoTermo; rascunho?: boolean } = {}) =>
    request<TermoAdmin[]>(base(hackathonId), { query: { limite: 100, ...filtro } }),
  criar: (hackathonId: string, dados: TermoRascunhoCriar) =>
    request<TermoAdmin>(base(hackathonId), { method: "POST", body: dados }),
  /** Só rascunho; versão publicada dá 409. */
  editar: (hackathonId: string, termoId: string, dados: TermoRascunhoEditar) =>
    request<TermoAdmin>(`${base(hackathonId)}/${termoId}`, { method: "PATCH", body: dados }),
  /** Só rascunho; versão publicada dá 409 (ela tem aceites). */
  excluir: (hackathonId: string, termoId: string) =>
    request<void>(`${base(hackathonId)}/${termoId}`, { method: "DELETE" }),
  /** Torna vigente e aposenta a anterior do mesmo tipo. */
  publicar: (hackathonId: string, termoId: string) =>
    request<TermoAdmin>(`${base(hackathonId)}/${termoId}/publicar`, { method: "POST" }),
};
