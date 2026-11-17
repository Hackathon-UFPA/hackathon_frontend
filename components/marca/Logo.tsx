import { useId } from "react";
import { MARCA } from "@/lib/marca";

/**
 * Marca da plataforma: um "H" formado por colchetes de código ligados por uma barra, com uma
 * faísca no canto (o "hack"). Não depende do nome final: o texto vem de lib/marca.ts.
 */
export function LogoMarca({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id}-g)`} />
      <g fill="none" stroke="#04211a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 8.5H8.5v15H11" />
        <path d="M21 8.5h2.5v15H21" />
        <path d="M12.5 16h7" />
      </g>
      <path d="M25.5 3.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" fill="#ecfdf5" className="logo-faisca" />
    </svg>
  );
}

export default function Logo({ compacto = false }: { compacto?: boolean }) {
  // Última palavra do nome em verde ("Hackathon *Hub*"); nome de uma palavra fica todo branco.
  const palavras = MARCA.nome.split(" ");
  const destaque = palavras.length > 1 ? palavras.pop() : null;
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMarca className="h-8 w-8 shrink-0 drop-shadow-[0_0_12px_rgba(16,185,129,0.45)]" />
      {!compacto && (
        <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-gray-900">
          {palavras.join(" ")}
          {destaque && <span className="text-emerald-700"> {destaque}</span>}
        </span>
      )}
    </span>
  );
}
