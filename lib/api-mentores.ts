// lib/api-mentores.ts — Mentores (RF37, RN24, RN33) e mentoria das equipes (RF38).
//
// Contrato: docs/mentores.md e docs/atribuicao-mentores.md do backend.
// Usa o núcleo `request` de lib/api.ts (token só via getToken()).

import { ApiError, request, type SituacaoConta, type Termo } from "./api";

/* ───────────────────────────── Tipos do contrato ───────────────────────────── */

export type StatusEmail = "PENDENTE" | "ENVIANDO" | "ENVIADO" | "FALHA";

/** MentorResponse. `ativo=false` + marcos nulos = aguardando o próprio mentor concluir a ativação. */
export interface Mentor {
  id: string;
  nome?: string | null;
  email: string;
  papel: "MENTOR";
  empresa_parceira?: string | null;
  area_atuacao?: string | null;
  max_equipes?: number | null;
  organizacao_id?: string | null;
  ativo: boolean;
  situacao_conta: SituacaoConta;
  email_confirmado_em?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
  mentor_perfil_concluido_em: string | null;
  mentor_ativado_em: string | null;
}

export interface MentorCriar {
  nome: string;
  email: string;
  empresa_parceira: string;
  area_atuacao: string;
  max_equipes: number;
  /** Edição do primeiro convite: precisa ter regulamento e termo de consentimento publicados. */
  hackathon_id: string;
}

/** Só os campos enviados mudam. Trocar o e-mail exige `hackathon_id` (novo convite). */
export interface MentorEditar {
  nome?: string;
  email?: string;
  empresa_parceira?: string;
  area_atuacao?: string;
  max_equipes?: number;
  hackathon_id?: string;
}

/** Histórico de convites, sem token. */
export interface ConviteMentorAdmin {
  id: string;
  hackathon_id: string | null;
  criado_em: string;
  expira_em: string;
  encerrado_em: string | null;
  email_enfileirado: boolean;
  status_email: StatusEmail | null;
  cancelado_em: string | null;
  /** Convite aberto sem e-mail enfileirado, com falha de entrega ou expirado. */
  pendencia_administrativa: boolean;
}

/** POST /mentores/convite/consultar (público). Não consome o token. */
export interface ConsultaConviteMentor {
  mentor: Mentor;
  termos: Termo[];
  senha_necessaria: boolean;
  hackathon_id: string;
}

export interface AtivacaoMentor {
  token: string;
  hackathon_id: string;
  nome: string;
  empresa_parceira: string;
  area_atuacao: string;
  /** Obrigatória quando `senha_necessaria`; se enviada em outro caso, troca a senha atual. */
  senha?: string | null;
  /** Ids das versões vigentes do regulamento e do termo de consentimento. */
  termos_ids: string[];
}

/** Vínculo mentor ↔ equipe. `encerrada_em` nulo = vigente. */
export interface Atribuicao {
  id: string;
  equipe_id: string;
  hackathon_id: string;
  mentor_id: string;
  atribuido_por: string;
  atribuido_em: string;
  atribuicao_anterior_id: string | null;
  motivo: string | null;
  encerrada_em: string | null;
  encerrada_por: string | null;
  motivo_encerramento: string | null;
}

export interface EquipeAcompanhada {
  atribuicao: Atribuicao;
  equipe_nome: string | null;
}

export interface Treinamento {
  id: string;
  treinamento_concluido_em: string | null;
  treinamento_concluido_por: string | null;
}

/** Recorte de GET /admin/hackathons/{id}/resultado usado para achar as equipes aprovadas. */
export interface EquipeAprovada {
  equipe_id: string;
  equipe_nome: string | null;
  titulo: string | null;
  tema_titulo: string | null;
}

type Paginacao = { limite?: number; deslocamento?: number };
type FiltroEquipes = Paginacao & { hackathon_id?: string; apenas_vigentes?: boolean };

/* ───────────────────────────── Endpoints ───────────────────────────── */

/** Comitê Científico, Organizador e DEV. */
export const mentoresAdmin = {
  listar: (q: Paginacao & { ativo?: boolean } = {}) =>
    request<Mentor[]>("/admin/mentores", { query: q }),

  /** Percorre as páginas (limite máximo da API é 100). */
  async listarTodos(): Promise<Mentor[]> {
    const todos: Mentor[] = [];
    for (let deslocamento = 0; deslocamento < 5000; deslocamento += 100) {
      const pagina = await mentoresAdmin.listar({ limite: 100, deslocamento });
      todos.push(...pagina);
      if (pagina.length < 100) break;
    }
    return todos;
  },

  obter: (id: string) => request<Mentor>(`/admin/mentores/${id}`),

  cadastrar: (dados: MentorCriar) =>
    request<Mentor>("/admin/mentores", { method: "POST", body: dados }),

  editar: (id: string, dados: MentorEditar) =>
    request<Mentor>(`/admin/mentores/${id}`, { method: "PATCH", body: dados }),

  /** Novo convite para a edição (substitui os anteriores daquela edição). */
  convidar: (id: string, hackathon_id: string) =>
    request<Mentor>(`/admin/mentores/${id}/convite`, { method: "POST", body: { hackathon_id } }),

  convites: (id: string, q: Paginacao = {}) =>
    request<ConviteMentorAdmin[]>(`/admin/mentores/${id}/convites`, { query: q }),

  /** Reativação: só para quem já concluiu a ativação e aceitou os termos vigentes da edição. */
  ativar: (id: string, hackathon_id: string) =>
    request<Mentor>(`/admin/mentores/${id}/ativar`, { method: "POST", body: { hackathon_id } }),

  desativar: (id: string) => request<Mentor>(`/admin/mentores/${id}/desativar`, { method: "POST" }),

  equipes: (id: string, q: FiltroEquipes = {}) =>
    request<EquipeAcompanhada[]>(`/admin/mentores/${id}/equipes`, { query: q }),
};

/** Rotas públicas do link de convite (`/mentores/ativacao#token=...&hackathon_id=...`). */
export const ativacaoMentor = {
  consultar: (token: string, hackathon_id: string) =>
    request<ConsultaConviteMentor>("/mentores/convite/consultar", {
      method: "POST",
      body: { token, hackathon_id },
      auth: false,
    }),
  concluir: (dados: AtivacaoMentor) =>
    request<Mentor>("/mentores/ativacao", { method: "POST", body: dados, auth: false }),
};

export const mentoria = {
  /** Vínculo vigente da equipe; null quando a equipe está sem mentor. */
  async atual(equipeId: string): Promise<Atribuicao | null> {
    try {
      return await request<Atribuicao>(`/admin/equipes/${equipeId}/mentoria`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  atribuir: (equipeId: string, mentor_id: string, motivo?: string | null) =>
    request<Atribuicao>(`/admin/equipes/${equipeId}/mentoria`, {
      method: "POST",
      body: { mentor_id, motivo: motivo?.trim() || null },
    }),
  substituir: (equipeId: string, dados: { mentor_id: string; atribuicao_atual_id: string; motivo: string }) =>
    request<Atribuicao>(`/admin/equipes/${equipeId}/mentoria`, { method: "PUT", body: dados }),
  encerrar: (equipeId: string, atribuicao_atual_id: string, motivo: string) =>
    request<Atribuicao>(`/admin/equipes/${equipeId}/mentoria/encerrar`, {
      method: "POST",
      body: { atribuicao_atual_id, motivo },
    }),
  historico: (equipeId: string, q: Paginacao = {}) =>
    request<Atribuicao[]>(`/admin/equipes/${equipeId}/mentoria/historico`, { query: q }),

  /** Mentor logado: equipes que ele acompanha. */
  minhasEquipes: (q: FiltroEquipes = {}) =>
    request<EquipeAcompanhada[]>("/me/mentoria/equipes", { query: q }),

  /** Marco exigido antes de atribuir mentores na edição. */
  treinamento: (hackathonId: string) =>
    request<Treinamento>(`/admin/hackathons/${hackathonId}/treinamento`),
  /** Só Organizador/DEV. */
  concluirTreinamento: (hackathonId: string) =>
    request<Treinamento>(`/admin/hackathons/${hackathonId}/treinamento/concluir`, { method: "POST" }),

  /**
   * Equipes que podem receber mentor: proposta aprovada no resultado homologado.
   * A rota de resultado é só do Organizador/DEV; `homologado=false` enquanto não houver resultado.
   */
  async equipesAprovadas(hackathonId: string): Promise<{ homologado: boolean; equipes: EquipeAprovada[] }> {
    const r = await request<{
      homologado: boolean;
      propostas: (EquipeAprovada & { aprovada?: boolean | null })[];
    }>(`/admin/hackathons/${hackathonId}/resultado`);
    return {
      homologado: r.homologado,
      equipes: r.homologado
        ? r.propostas
            .filter((p) => p.aprovada === true)
            .map(({ equipe_id, equipe_nome, titulo, tema_titulo }) => ({ equipe_id, equipe_nome, titulo, tema_titulo }))
        : [],
    };
  },
};

/* ───────────────────────────── Apoio às telas ───────────────────────────── */

export type SituacaoMentor = "ATIVO" | "AGUARDANDO" | "DESATIVADO";

export function situacaoMentor(m: Pick<Mentor, "ativo" | "mentor_ativado_em" | "mentor_perfil_concluido_em">): SituacaoMentor {
  if (m.ativo) return "ATIVO";
  return m.mentor_ativado_em || m.mentor_perfil_concluido_em ? "DESATIVADO" : "AGUARDANDO";
}

export const ROTULO_SITUACAO_MENTOR: Record<SituacaoMentor, string> = {
  ATIVO: "Ativo",
  AGUARDANDO: "Aguardando ativação",
  DESATIVADO: "Desativado",
};

export const ROTULO_STATUS_EMAIL: Record<StatusEmail, string> = {
  PENDENTE: "Na fila",
  ENVIANDO: "Enviando",
  ENVIADO: "Enviado",
  FALHA: "Falha no envio",
};
