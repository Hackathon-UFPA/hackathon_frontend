"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  {
    href: "/",
    label: "Início",
  },
  {
    href: "/cronograma",
    label: "Cronograma",
  },
  {
    href: "/#desafios",
    label: "Desafios",
  },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A1110]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            IA
          </div>

          <span className="text-white font-bold tracking-widest text-sm uppercase">
            Hackathon Amazônia
          </span>
        </Link>

        {/* Navegação principal */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-8 text-sm font-medium"
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`transition-colors ${
                  isActive
                    ? "text-emerald-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Entrar
          </Link>

          <Link
            href="/inscricao"
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            Inscreva-se
          </Link>
        </div>
      </div>
    </header>
  );
}