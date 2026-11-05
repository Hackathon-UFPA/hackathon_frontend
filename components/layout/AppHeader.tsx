"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, getUser, type Usuario } from "@/lib/api";

const navLinks = [
    { href: "/", label: "Início" },
    { href: "/cronograma", label: "Cronograma" },
    { href: "/#desafios", label: "Desafios" },
];

export default function AppHeader() {
    const pathname = usePathname();
    const router = useRouter();

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        setUsuario(getUser());
        setCarregando(false);
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

    const ehOrganizador =
        usuario?.papel === "ORGANIZADOR" ||
        usuario?.papel === "COMITE_CIENTIFICO" ||
        usuario?.papel === "COMITE_TECNICO" ||
        usuario?.papel === "DEV";

    const sair = () => {
        auth.logout();
        setUsuario(null);
        router.push("/");
        router.refresh();
    };

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
                                className={`transition-colors ${isActive
                                        ? "text-emerald-400"
                                        : "text-gray-300 hover:text-white"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Ações conforme autenticação e papel */}
                <div className="flex items-center gap-3">
                    {carregando ? (
                        <div className="w-32 h-9 rounded-lg bg-white/5 animate-pulse" />
                    ) : usuario ? (
                        <>
                            {/* Ação principal da sessão */}
                            <Link
                                href={ehOrganizador ? "/admin" : "/inscricao"}
                                className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200"
                            >
                                {ehOrganizador ? "Painel" : "Minha Inscrição"}
                            </Link>

                            {/* Ação de sair */}
                            <button
                                type="button"
                                onClick={sair}
                                className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
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
            </div>
        </header>
    );
}