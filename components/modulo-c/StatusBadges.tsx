// components/modulo-c/StatusBadges.tsx
"use client";

import React from "react";
import type {
  FuncaoMembro,
  SituacaoConta,
  SituacaoEquipe,
  StatusComprovante,
  StatusConvite,
} from "@/lib/moduloC-api";

export function formatarDataBrasilia(iso?: string | null): string {
  if (!iso) return "Data não informada";
  try {
    const data = new Date(iso);
    return (
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(data) + " (Brasília)"
    );
  } catch {
    return iso;
  }
}

export function BadgeSituacaoConta({ situacao }: { situacao: SituacaoConta }) {
  const styles: Record<SituacaoConta, string> = {
    ATIVA: "bg-[#E6F4EA] text-[#1B4332] border-[#95D5B2]",
    PENDENTE: "bg-[#FDF3E7] text-[#8C5E3C] border-[#E6CCB2]",
  };
  const labels: Record<SituacaoConta, string> = {
    ATIVA: "Conta Ativa",
    PENDENTE: "Conta Pendente de Validação",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[situacao]}`}
    >
      {labels[situacao]}
    </span>
  );
}

export function BadgeComprovante({ status }: { status: StatusComprovante }) {
  const styles: Record<StatusComprovante, string> = {
    APROVADO: "bg-[#E6F4EA] text-[#1B4332] border-[#95D5B2]",
    PENDENTE: "bg-[#FDF3E7] text-[#8C5E3C] border-[#E6CCB2]",
    RECUSADO: "bg-[#FDECEA] text-[#9B2226] border-[#F5C2C7]",
  };
  const labels: Record<StatusComprovante, string> = {
    APROVADO: "Comprovante Aprovado",
    PENDENTE: "Em Análise",
    RECUSADO: "Comprovante Recusado",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function BadgeConvite({ status }: { status: StatusConvite }) {
  const styles: Record<StatusConvite, string> = {
    ACEITO: "bg-[#E6F4EA] text-[#1B4332] border-[#95D5B2]",
    PENDENTE: "bg-[#FDF3E7] text-[#8C5E3C] border-[#E6CCB2]",
    RECUSADO: "bg-[#FDECEA] text-[#9B2226] border-[#F5C2C7]",
    CANCELADO: "bg-[#F1EFEA] text-[#5C574F] border-[#D8CFC0]",
  };
  const labels: Record<StatusConvite, string> = {
    ACEITO: "Convite Aceito",
    PENDENTE: "Aguardando Resposta",
    RECUSADO: "Convite Recusado",
    CANCELADO: "Convite Cancelado",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function BadgeSituacaoEquipe({ situacao }: { situacao: SituacaoEquipe }) {
  const styles: Record<SituacaoEquipe, string> = {
    EM_FORMACAO: "bg-[#F5EFE6] text-[#6B4F3B] border-[#D8CFC0]",
    AGUARDANDO_HOMOLOGACAO: "bg-[#FDF3E7] text-[#9C6644] border-[#E6CCB2]",
    HOMOLOGADA: "bg-[#E6F4EA] text-[#1B4332] border-[#74C69D]",
    NAO_HOMOLOGADA: "bg-[#FDECEA] text-[#9B2226] border-[#F5C2C7]",
  };
  const labels: Record<SituacaoEquipe, string> = {
    EM_FORMACAO: "Em Formação",
    AGUARDANDO_HOMOLOGACAO: "Aguardando Homologação",
    HOMOLOGADA: "Inscrição Homologada",
    NAO_HOMOLOGADA: "Não Homologada",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${styles[situacao]}`}
    >
      {labels[situacao]}
    </span>
  );
}

export function labelFuncao(funcao: FuncaoMembro): string {
  const mapa: Record<FuncaoMembro, string> = {
    LIDER: "Líder da Equipe",
    DESENVOLVEDOR: "Desenvolvedor(a)",
    DESIGNER: "Designer",
    NEGOCIOS: "Negócios",
    OUTRO: "Outro",
  };
  return mapa[funcao] ?? funcao;
}

export function ReciboProtocolo({
  tipo,
  numero,
  emitidoEm,
}: {
  tipo: "INSCRICAO_EQUIPE" | "PROPOSTA";
  numero: string;
  emitidoEm?: string | null;
}) {
  const titulo =
    tipo === "INSCRICAO_EQUIPE"
      ? "Protocolo de Inscrição da Equipe"
      : "Protocolo de Submissão de Proposta";

  return (
    <div className="bg-[#FAF8F5] border border-[#D8CFC0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B4F3B]">
          {titulo}
        </p>
        <p className="text-lg font-mono font-bold text-[#1B4332] tracking-wider mt-0.5">
          {numero}
        </p>
      </div>
      {emitidoEm && (
        <div className="text-xs text-[#5C574F] sm:text-right">
          <span className="block font-medium text-[#3D3A35]">Registrado em</span>
          <span>{formatarDataBrasilia(emitidoEm)}</span>
        </div>
      )}
    </div>
  );
}