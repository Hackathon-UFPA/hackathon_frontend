"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import FundoAnimado from "@/components/plataforma/FundoAnimado";
import { LogoMarca } from "@/components/marca/Logo";

export const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm";
export const lbl = "block text-xs uppercase text-gray-600 mb-1 font-semibold";
export const btn =
  "w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer mt-2";

export const DICA_SENHA = "8 a 128 caracteres, com ao menos uma letra e um número.";

export function Campo({
  label,
  erro,
  dica,
  children,
}: {
  label: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
      {dica && !erro && <p className="text-[11px] text-gray-500 mt-1">{dica}</p>}
      {erro && <p className="text-red-600 text-xs mt-1">{erro}</p>}
    </div>
  );
}

/** Mesmo visual da tela de login, para as páginas públicas de conta (senha, e-mail). */
export default function CartaoAuth({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen text-gray-700 font-sans flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30">
      <FundoAnimado intensidade="suave" />
      <div className="entrar w-full max-w-md bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-emerald-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        <LogoMarca className="mx-auto mb-4 h-10 w-10 drop-shadow-[0_0_18px_rgba(16,185,129,0.5)]" />
        <Link
          href="/login"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold mb-6 inline-block"
        >
          &larr; Voltar ao login
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        {subtitulo && <p className="text-sm text-gray-600 mt-1 mb-6 leading-relaxed">{subtitulo}</p>}
        {children}
      </div>
    </main>
  );
}

const assinarHash = (aviso: () => void) => {
  window.addEventListener("hashchange", aviso);
  return () => window.removeEventListener("hashchange", aviso);
};

/**
 * Token dos links enviados por e-mail (`/redefinir-senha#token=...`). Ele vem depois do `#`
 * para não ir ao servidor nem aos logs; no servidor (SSR) ainda não existe.
 */
export function useTokenDoLink(): string | null | undefined {
  return useSyncExternalStore(
    assinarHash,
    () => new URLSearchParams(window.location.hash.slice(1)).get("token"),
    () => undefined
  );
}
