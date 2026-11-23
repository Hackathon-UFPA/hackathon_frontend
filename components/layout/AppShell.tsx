"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { filtrarNavegacao, type GrupoNavegacao } from "@/lib/navegacao";
import type { PapelUsuario } from "@/lib/api";

type AppShellProps = {
  children: ReactNode;
  navegacao: GrupoNavegacao[];
  papel: PapelUsuario;
  nomeOrganizacao: string;
  tipoOrganizacao: string | null;
  nomeUsuario: string;
  emailUsuario: string;
  pendentes: number | null;
  onSair: () => void;
  titulo: string;
  acoes?: ReactNode;
};

export default function AppShell({
  children,
  navegacao,
  papel,
  nomeOrganizacao,
  tipoOrganizacao,
  nomeUsuario,
  emailUsuario,
  pendentes,
  onSair,
  titulo,
  acoes,
}: AppShellProps) {
  const pathname = usePathname();
  const grupos = filtrarNavegacao(navegacao, papel);

  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300">
      <div className="flex min-h-screen">
        <AppSidebar
          navegacao={navegacao}
          papel={papel}
          nomeOrganizacao={nomeOrganizacao}
          tipoOrganizacao={tipoOrganizacao}
          nomeUsuario={nomeUsuario}
          emailUsuario={emailUsuario}
          pendentes={pendentes}
          onSair={onSair}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-emerald-900/40 bg-[#0A1110]/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <Link href="/" className="hover:text-emerald-400">
                    Início
                  </Link>
                  <span>/</span>
                  <span className="truncate text-gray-300">{titulo}</span>
                </p>

                <h1 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
                  {titulo}
                </h1>
              </div>

              {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {grupos.flatMap((grupo) =>
                grupo.itens.map((item) => {
                  const ativo =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      pathname.startsWith(`${item.href}/`));

                  const Icone = item.icone;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        ativo
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-emerald-900/40 bg-[#131D1C] text-gray-400"
                      }`}
                    >
                      <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.titulo}
                    </Link>
                  );
                })
              )}
            </nav>
          </header>

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
