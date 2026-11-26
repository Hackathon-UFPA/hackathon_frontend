// lib/api-mentoria.ts — Calendário e entregas parciais da mentoria (RF39, RF65, RN17, RN29).
//
// Contrato: docs/mentoria-entregas.md do backend (seção "Entregas da mentoria" do Swagger).
// Usa o núcleo `request` de lib/api.ts (token só via getToken()).

import { request } from "./api";

/* ───────────────────────────── Tipos do contrato ───────────────────────────── */

export type TipoMarco = "PARCIAL" | "FINAL";

/** MarcoMentoriaResponse. Datas em UTC. */
export interface Marco {
  id: string;
  hackathon_id: string;
  titulo: string;
  descricao: string;
  /** Prazo inclusivo. */
  data_limite: string;
  ordem: number;
  tipo: TipoMarco;
  criado_em: string;
  atualizado_em: string;
}

export interface MarcoCriar {
  titulo: string;
  descricao: string;
  data_limite: string;
  ordem?: number;
  tipo?: TipoMarco;
}

export type MarcoEditar = Partial<MarcoCriar>;

/** EntregaMentoriaResponse. Um registro imutável por equipe e marco parcial. */
export interface Entrega {
  id: string;
  marco_id: string;
  equipe_id: string;
  hackathon_id: string;
  enviado_por: string;
  enviado_em: string;
  /** Prazo em vigor no momento do envio (prorrogações posteriores não mudam este valor). */
  data_limite_no_envio: string;
  descricao: string;
  referencias: string[];
}

export interface EntregaCriar {
  marco_id: string;
  descricao: string;
  /** Links HTTPS, até 2.048 caracteres cada. */
  referencias: string[];
}

type Paginacao = { limite?: number; deslocamento?: number };

/** Percorre as páginas (limite máximo da API é 100). */
async function todas<T>(buscar: (q: Paginacao) => Promise<T[]>): Promise<T[]> {
  const lista: T[] = [];
  for (let deslocamento = 0; deslocamento < 2000; deslocamento += 100) {
    const pagina = await buscar({ limite: 100, deslocamento });
    lista.push(...pagina);
    if (pagina.length < 100) break;
  }
  return lista;
}

/* ───────────────────────────── Endpoints ───────────────────────────── */

/** Comitê Científico e Organizador da organização dona da edição, e DEV. */
export const marcosAdmin = {
  listar: (hackathonId: string) =>
    todas((q) => request<Marco[]>(`/admin/hackathons/${hackathonId}/mentoria/marcos`, { query: q })),
  obter: (hackathonId: string, marcoId: string) =>
    request<Marco>(`/admin/hackathons/${hackathonId}/mentoria/marcos/${marcoId}`),
  criar: (hackathonId: string, dados: MarcoCriar) =>
    request<Marco>(`/admin/hackathons/${hackathonId}/mentoria/marcos`, { method: "POST", body: dados }),
  /** Só os campos enviados mudam. Marco com entregas: o prazo só pode ser prorrogado. */
  editar: (hackathonId: string, marcoId: string, dados: MarcoEditar) =>
    request<Marco>(`/admin/hackathons/${hackathonId}/mentoria/marcos/${marcoId}`, {
      method: "PATCH",
      body: dados,
    }),
  /** Marco com entregas não pode ser excluído (409). */
  excluir: (hackathonId: string, marcoId: string) =>
    request<void>(`/admin/hackathons/${hackathonId}/mentoria/marcos/${marcoId}`, { method: "DELETE" }),
};

/**
 * Calendário da edição. Integrantes de equipe homologada com proposta aprovada, mentores com
 * atribuição vigente na edição e gestores. Os demais recebem 403.
 */
export const marcos = {
  listar: (hackathonId: string) =>
    todas((q) => request<Marco[]>(`/hackathons/${hackathonId}/mentoria/marcos`, { query: q })),
};

/** Integrantes da equipe, mentor vigente e gestores consultam; só o líder técnico envia. */
export const entregas = {
  listar: (equipeId: string) =>
    todas((q) => request<Entrega[]>(`/equipes/${equipeId}/mentoria/entregas`, { query: q })),
  obter: (equipeId: string, entregaId: string) =>
    request<Entrega>(`/equipes/${equipeId}/mentoria/entregas/${entregaId}`),
  registrar: (equipeId: string, dados: EntregaCriar) =>
    request<Entrega>(`/equipes/${equipeId}/mentoria/entregas`, { method: "POST", body: dados }),
};

/* ───────────────────────────── Apoio às telas ───────────────────────────── */

export type SituacaoMarco = "ENTREGUE" | "ABERTO" | "PRAZO_PROXIMO" | "ENCERRADO" | "FINAL";

/** Janela em que um marco aberto passa a ser destacado como "prazo próximo". */
const JANELA_PRAZO_PROXIMO_MS = 48 * 60 * 60 * 1000;

/** A API manda UTC, às vezes sem o sufixo de fuso. */
export function dataUtc(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

export function situacaoMarco(marco: Marco, entrega: Entrega | undefined, agora = Date.now()): SituacaoMarco {
  if (entrega) return "ENTREGUE";
  if (marco.tipo === "FINAL") return "FINAL";
  const prazo = dataUtc(marco.data_limite).getTime();
  if (agora > prazo) return "ENCERRADO";
  return prazo - agora <= JANELA_PRAZO_PROXIMO_MS ? "PRAZO_PROXIMO" : "ABERTO";
}

/** Os marcos já chegam na ordem do calendário (prazo, ordem, id); isto só garante a mesma ordem. */
export function ordenarCalendario(lista: Marco[]): Marco[] {
  return [...lista].sort(
    (a, b) =>
      dataUtc(a.data_limite).getTime() - dataUtc(b.data_limite).getTime() ||
      a.ordem - b.ordem ||
      a.id.localeCompare(b.id)
  );
}

/* Prazos no fuso de Belém (UTC−3, sem horário de verão). */

const OFFSET_BELEM = "-03:00";
const OFFSET_BELEM_MS = 3 * 60 * 60 * 1000;

/** Valor de <input type="datetime-local"> (horário de Belém) → ISO com fuso. */
export function localParaIso(valor: string): string {
  return `${valor.length === 16 ? `${valor}:00` : valor}${OFFSET_BELEM}`;
}

/** ISO (UTC) → valor de <input type="datetime-local"> no horário de Belém. */
export function isoParaLocal(iso: string): string {
  const d = dataUtc(iso);
  return new Date(d.getTime() - OFFSET_BELEM_MS).toISOString().slice(0, 16);
}

const fmtPrazo = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Belem",
});
const fmtDia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Belem" });
const fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Belem" });

/** "seg., 08 de dez., 20:59" */
export const formatarPrazo = (iso: string) => fmtPrazo.format(dataUtc(iso));
export const diaDoPrazo = (iso: string) => fmtDia.format(dataUtc(iso));
export const mesDoPrazo = (iso: string) => fmtMes.format(dataUtc(iso)).replace(".", "");

/** "faltam 3 dias", "faltam 5 horas", "encerrou há 2 dias". */
export function tempoAtePrazo(iso: string, agora = Date.now()): string {
  const diff = dataUtc(iso).getTime() - agora;
  const abs = Math.abs(diff);
  const horas = Math.round(abs / 3_600_000);
  const dias = Math.round(abs / 86_400_000);
  const texto =
    horas < 1 ? "menos de 1 hora" : horas < 48 ? `${horas} ${horas === 1 ? "hora" : "horas"}` : `${dias} dias`;
  return diff >= 0 ? `faltam ${texto}` : `encerrou há ${texto}`;
}

/** Valida e normaliza a lista de links digitada (um por linha). Devolve o erro em texto, se houver. */
export function lerReferencias(texto: string): { links: string[]; erro: string | null } {
  const links = [...new Set(texto.split(/\s+/).map((l) => l.trim()).filter(Boolean))];
  for (const link of links) {
    if (link.length > 2048) return { links, erro: "Cada link pode ter até 2.048 caracteres." };
    try {
      const url = new URL(link);
      if (url.protocol !== "https:") return { links, erro: `Use links que começam com https:// (${link}).` };
    } catch {
      return { links, erro: `Este link não é válido: ${link}` };
    }
  }
  return { links, erro: null };
}
