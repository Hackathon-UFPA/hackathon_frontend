"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import type { GrupoNavegacao } from "@/lib/navegacao";
import AppSidebar from "./AppSidebar";
  
import type { PapelUsuario } from "@/lib/api";
import NotificacoesSino from "@/components/notificacoes/NotificacoesSino";
import AlternarTema from "@/components/layout/AlternarTema";

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

  const [menuAberto, setMenuAberto] = useState(false);




  useEffect(() => {
    document.body.style.overflow = menuAberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

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

        <AppSidebar
          
          navegacao={navegacao}
          papel={papel}
          nomeOrganizacao={nomeOrganizacao}
          tipoOrganizacao={tipoOrganizacao}
          nomeUsuario={nomeUsuario}
          emailUsuario={emailUsuario}
          pendentes={pendentes}
          onSair={onSair}
          variante="mobile"
          aberto={menuAberto}
          onFechar={() => setMenuAberto(false)}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-emerald-900/40 bg-[#0A1110]/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuAberto(true)}
                  aria-label="Abrir menu"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-gray-500">
                    <Link
                      href="/"
                      className="hover:text-emerald-400"
                    >
                      Início
                    </Link>

                    <span>/</span>

                    <span className="truncate text-gray-300">
                      {titulo}
                    </span>
                  </p>

                  <h1 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
                    {titulo}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <NotificacoesSino />
                <AlternarTema />

                {acoes && <>{acoes}</>}
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}