"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";

export const inp =
  "w-full rounded-lg border border-gray-300 bg-[#F6F9F8] p-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none";
export const lbl = "mb-1 block text-[11px] font-semibold uppercase text-gray-600";
export const btnPrimario =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer";
export const btnSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50 cursor-pointer";
export const btnIcone =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer";
export const cartao = "rounded-2xl border border-emerald-100 bg-white";

export const msgErro = (e: unknown) =>
  e instanceof ApiError || e instanceof Error ? e.message : "Erro inesperado.";

/** Erro do campo vindo do 422 (ApiError.fields), se houver. */
export const erroCampo = (e: unknown, campo: string) =>
  e instanceof ApiError ? e.fields[campo]?.replace(/^Value error,\s*/i, "") : undefined;

export function SeloPublicado({ publicado }: { publicado: boolean }) {
  return publicado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
      <Eye className="h-3 w-3" aria-hidden="true" /> Publicado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 ring-1 ring-gray-200">
      <EyeOff className="h-3 w-3" aria-hidden="true" /> Oculto
    </span>
  );
}

/** Caixa "Publicar na página pública" dos formulários. */
export function CampoPublicado({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#F6F9F8] p-3">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-emerald-600"
      />
      <span className="text-sm">
        <span className="block font-semibold text-gray-900">Mostrar na página pública</span>
        <span className="block text-xs text-gray-500">Desmarcado, fica salvo só para a organização.</span>
      </span>
    </label>
  );
}

/** Botão de excluir com confirmação no próprio lugar (sem diálogo do navegador). */
export function BotaoExcluir({ rotulo, onConfirmar }: { rotulo: string; onConfirmar: () => Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className={`${btnIcone} hover:text-red-700`} aria-label={`Excluir ${rotulo}`} title="Excluir">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          try {
            await onConfirmar();
          } finally {
            setOcupado(false);
            setConfirmando(false);
          }
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
      >
        {ocupado && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />} Excluir
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer">
        Cancelar
      </button>
    </span>
  );
}

export function EstadoVazio({
  icone: Icone,
  titulo,
  texto,
}: {
  icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icone className="h-6 w-6" />
      </span>
      <p className="mt-4 font-bold text-gray-900">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{texto}</p>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
      ))}
    </div>
  );
}
