// lib/rotulos.ts — textos de exibição para os valores que a API devolve em MAIÚSCULAS.
import type {
  FuncaoMembro,
  SituacaoEquipe,
  StatusComprovante,
  StatusConvite,
} from "./api";

export const SITUACAO_EQUIPE: Record<SituacaoEquipe, string> = {
  EM_FORMACAO: "Em formação",
  AGUARDANDO_HOMOLOGACAO: "Aguardando homologação",
  HOMOLOGADA: "Homologada",
  NAO_HOMOLOGADA: "Não homologada",
};

export const FUNCAO_MEMBRO: Record<FuncaoMembro, string> = {
  LIDER: "Líder técnico",
  DESENVOLVEDOR: "Desenvolvimento",
  DESIGNER: "Design",
  NEGOCIOS: "Negócios",
  OUTRO: "Outra função",
};

export const STATUS_COMPROVANTE: Record<StatusComprovante, string> = {
  PENDENTE: "Em análise",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};

export const STATUS_CONVITE: Record<StatusConvite, string> = {
  PENDENTE: "Convite pendente",
  ACEITO: "Convite aceito",
  RECUSADO: "Convite recusado",
  CANCELADO: "Convite cancelado",
};

/** Objetivos de Desenvolvimento Sustentável da ONU, na numeração oficial. */
export const ODS: { numero: number; nome: string }[] = [
  { numero: 1, nome: "Erradicação da pobreza" },
  { numero: 2, nome: "Fome zero e agricultura sustentável" },
  { numero: 3, nome: "Saúde e bem-estar" },
  { numero: 4, nome: "Educação de qualidade" },
  { numero: 5, nome: "Igualdade de gênero" },
  { numero: 6, nome: "Água potável e saneamento" },
  { numero: 7, nome: "Energia limpa e acessível" },
  { numero: 8, nome: "Trabalho decente e crescimento econômico" },
  { numero: 9, nome: "Indústria, inovação e infraestrutura" },
  { numero: 10, nome: "Redução das desigualdades" },
  { numero: 11, nome: "Cidades e comunidades sustentáveis" },
  { numero: 12, nome: "Consumo e produção responsáveis" },
  { numero: 13, nome: "Ação contra a mudança global do clima" },
  { numero: 14, nome: "Vida na água" },
  { numero: 15, nome: "Vida terrestre" },
  { numero: 16, nome: "Paz, justiça e instituições eficazes" },
  { numero: 17, nome: "Parcerias e meios de implementação" },
];

/** A API grava em UTC e pode omitir o fuso: sem ele, o navegador leria como hora local. */
export function formatarDataHora(iso?: string | null): string {
  if (!iso) return "—";
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const data = new Date(temFuso ? iso : `${iso}Z`);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
