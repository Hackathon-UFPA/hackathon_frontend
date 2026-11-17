import type { ReactNode } from "react";

// Peças visuais compartilhadas pelo formulário de inscrição e pelo Painel do Esquadrão.
export const inp =
  "w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none disabled:opacity-70";
export const btn =
  "inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm cursor-pointer transition-colors";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs rounded-lg text-white font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const cartao = "bg-[#131D1C]/90 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-md";
export const inputArquivo =
  "block w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:cursor-pointer";

/** Rótulo em volta do campo, para o leitor de tela anunciar o nome ao focar. */
export function Campo({
  label,
  erro,
  dica,
  children,
}: {
  label: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-gray-400 mb-1.5 font-semibold">
        {label}
      </span>
      {children}
      {dica && <span className="block text-xs text-gray-500 mt-1.5">{dica}</span>}
      {erro && <span className="block text-xs text-red-400 mt-1.5">{erro}</span>}
    </label>
  );
}

/** Etiqueta de seção no padrão [ 01 // CONTA ]. */
export function Selo({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block font-mono text-xs uppercase tracking-widest text-emerald-400">
      {children}
    </span>
  );
}
