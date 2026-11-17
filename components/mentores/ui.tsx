"use client";

import { useEffect, useState } from "react";
import { hackathons as hackathonsApi, type HackathonResponse, type Usuario } from "@/lib/api";
import { ROTULO_SITUACAO_MENTOR, type SituacaoMentor } from "@/lib/api-mentores";

export const btnPrimario =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer";
export const btnSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50 cursor-pointer";
export const btnPerigo =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer";
export const campo =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none";
export const rotulo = "mb-1 block text-xs font-semibold text-gray-700";

const COR_SITUACAO: Record<SituacaoMentor, string> = {
  ATIVO: "bg-emerald-100 text-emerald-800",
  AGUARDANDO: "bg-amber-100 text-amber-800",
  DESATIVADO: "bg-gray-200 text-gray-700",
};

export function SituacaoBadge({ situacao }: { situacao: SituacaoMentor }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${COR_SITUACAO[situacao]}`}>
      {ROTULO_SITUACAO_MENTOR[situacao]}
    </span>
  );
}

export function iniciais(nome: string) {
  return nome
    .split(/[\s@.]+/)
    .map((p) => p.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Avatar({ nome, grande }: { nome: string; grande?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-white ${
        grande ? "h-14 w-14 rounded-2xl text-lg" : "h-10 w-10 rounded-full text-sm"
      }`}
    >
      {iniciais(nome) || "M"}
    </span>
  );
}

/**
 * Hackathons que o gestor pode escolher: Organizador/DEV veem os da organização (com rascunhos);
 * o Comitê Científico usa a vitrine pública filtrada pela organização dele.
 */
export function useHackathonsDaOrganizacao(user: Usuario | null) {
  const [lista, setLista] = useState<HackathonResponse[] | null>(null);
  useEffect(() => {
    if (!user) return;
    const busca =
      user.papel === "ORGANIZADOR" || user.papel === "DEV"
        ? hackathonsApi.daMinhaOrganizacao()
        : user.organizacao_id
          ? hackathonsApi.listar(user.organizacao_id)
          : Promise.resolve([]);
    busca.then(setLista).catch(() => setLista([]));
  }, [user]);
  return lista;
}

export const nomeHackathon = (lista: HackathonResponse[] | null, id?: string | null) =>
  (id && lista?.find((h) => h.id === id)?.nome) || "Hackathon";

const fmtDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Belem",
});

/** "17 de nov. de 2026, 14:30" (a API manda UTC, às vezes sem fuso). */
export function dataHora(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? "—" : fmtDataHora.format(d);
}
