"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getUser, type Usuario } from "@/lib/api";
import Logo from "@/components/marca/Logo";
import NotificacoesSino from "@/components/notificacoes/NotificacoesSino";
import AlternarTema from "@/components/layout/AlternarTema";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/hackathons", label: "Hackathons" },
  { href: "/#organizacoes", label: "Para organizações" },
];

export default function AppHeader() {
  const pathname = usePathname();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setUsuario(getUser());
    setCarregando(false);
  }, [pathname]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  useEffect(() => {
    const atualizarSessao = () => {
      setUsuario(getUser());
    };

    window.addEventListener("storage", atualizarSessao);

    return () => {
      window.removeEventListener("storage", atualizarSessao);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-[#F6F9F8]/80 backdrop-blur-md">
      <div className="mx-auto flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-8 text-[15px] font-semibold md:flex"
        >
          {navLinks.map((link) => {
            const ativo =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={ativo ? "page" : undefined}
                className={`relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:transition-colors ${
                  ativo
                    ? "text-emerald-700 after:bg-emerald-600"
                    : "text-gray-900 after:bg-transparent hover:text-emerald-700"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <AlternarTema />

          <div className="hidden items-center gap-3 md:flex">
            {carregando ? (
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-50" />
            ) : usuario ? (
              <NotificacoesSino />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-900 transition-colors hover:text-emerald-700"
                >
                  Entrar
                </Link>

                <Link
                  href="/login?aba=cadastro"
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
          >
            {menuAberto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuAberto && (
        <div
          id="menu-mobile"
          className="border-t border-gray-200 bg-[#F6F9F8]/95 backdrop-blur-xl md:hidden"
        >
          <nav
            aria-label="Navegação mobile"
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
          >
            {navLinks.map((link) => {
              const ativo =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={ativo ? "page" : undefined}
                  onClick={() => setMenuAberto(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    ativo
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "text-gray-900 hover:bg-gray-50 hover:text-emerald-700"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 flex flex-col gap-2 border-t border-gray-200 pt-3">
              {carregando ? null : usuario ? (
                <Link
                  href="/notificacoes"
                  onClick={() => setMenuAberto(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Notificações
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuAberto(false)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    Entrar
                  </Link>

                  <Link
                    href="/login?aba=cadastro"
                    onClick={() => setMenuAberto(false)}
                    className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}