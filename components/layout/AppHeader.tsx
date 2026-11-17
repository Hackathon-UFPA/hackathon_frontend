"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, getUser, type Usuario } from "@/lib/api";
import Logo from "@/components/marca/Logo";
import NotificacoesSino from "@/components/notificacoes/NotificacoesSino";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/hackathons", label: "Hackathons" },
  { href: "/#organizacoes", label: "Para organizações" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

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

  // Mesmo critério das páginas: /admin aceita Organizador, Comitê Científico e DEV;
  // /equipe aceita Participante. Outros perfis ainda não têm painel no front.
  const ehOrganizador =
    usuario?.papel === "ORGANIZADOR" ||
    usuario?.papel === "COMITE_CIENTIFICO" ||
    usuario?.papel === "DEV";
  const ehMentor = usuario?.papel === "MENTOR";
  const temPainel = ehOrganizador || ehMentor || usuario?.papel === "PARTICIPANTE";
  const painel = ehOrganizador
    ? { href: "/admin", rotulo: "Painel" }
    : ehMentor
      ? { href: "/mentor", rotulo: "Minhas equipes" }
      : { href: "/equipe", rotulo: "Minha Equipe" };

  const sair = async () => {
    await auth.logout();
    setUsuario(null);
    setMenuAberto(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F6F9F8]/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Logo />
        </Link>

        {/* Navegação principal — desktop */}
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
                    ? "text-emerald-700"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Ações e botão do menu mobile */}
        <div className="flex items-center gap-3">
          {/* Ações — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {carregando ? (
              <div className="w-32 h-9 rounded-lg bg-gray-50 animate-pulse" />
            ) : usuario ? (
              <>
<NotificacoesSino />
{temPainel && (
                <Link
                  href={painel.href}
                  className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200"
                >
                  {painel.rotulo}
                </Link>
                )}

                <Link
                  href="/perfil"
                  title="Meu perfil"
                  aria-label="Meu perfil"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-bold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                >
                  {(usuario.nome || usuario.email).trim().charAt(0).toUpperCase()}
                </Link>

                <button
                  type="button"
                  onClick={sair}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-700"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Entrar
                </Link>

                <Link
                  href="/login?aba=cadastro"
                  className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          {/* Botão do menu mobile */}
          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {menuAberto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div
          id="menu-mobile"
          className="md:hidden border-t border-gray-200 bg-[#F6F9F8]/95 backdrop-blur-xl"
        >
          <nav
            aria-label="Navegação mobile"
            className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1"
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
                  onClick={() => setMenuAberto(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
              {carregando ? null : usuario ? (
                <>
                  <Link
                    href="/notificacoes"
                    className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Notificações
                  </Link>
                  <Link
                    href="/perfil"
                    className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Meu perfil
                  </Link>
{temPainel && (
                  <Link
                    href={painel.href}
                    onClick={() => setMenuAberto(false)}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-500/20 transition-colors"
                  >
                    {painel.rotulo}
                  </Link>
                  )}

                  <button
                    type="button"
                    onClick={sair}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-700 transition-colors"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuAberto(false)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    Entrar
                  </Link>

                  <Link
                    href="/login?aba=cadastro"
                    onClick={() => setMenuAberto(false)}
                    className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
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

