"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut, X } from "lucide-react";
import {
  filtrarNavegacao,
  type GrupoNavegacao,
  type ItemNavegacao,
} from "@/lib/navegacao";
import type { PapelUsuario } from "@/lib/api";

type AppSidebarProps = {
  navegacao: GrupoNavegacao[];
  papel: PapelUsuario;
  nomeOrganizacao: string;
  tipoOrganizacao: string | null;
  nomeUsuario: string;
  emailUsuario: string;
  pendentes: number | null;
  onSair: () => void;
  variante?: "desktop" | "mobile";
  aberto?: boolean;
  onFechar?: () => void;
};

function iniciais(nome: string) {
  return (
    nome
      .split(/\s+/)
      .filter((parte) => parte.length > 2)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || nome.slice(0, 2).toUpperCase()
  );
}

function Item({
  item,
  ativo,
  pendentes,
  onClique,
}: {
  item: ItemNavegacao;
  ativo: boolean;
  pendentes: number | null;
  onClique?: () => void;
}) {
  const Icone = item.icone;

  if (item.desabilitado) {
    return (
      <span
        title={item.descricao}
        className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-gray-600"
      >
        <Icone
          className="h-4 w-4 shrink-0 text-gray-600"
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1 truncate font-medium">
          {item.titulo}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClique}
      aria-current={ativo ? "page" : undefined}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
        ativo
          ? "border-emerald-500/30 bg-emerald-500/10 text-white"
          : "border-transparent text-gray-400 hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-100"
      }`}
    >
      <span
        className={`absolute inset-y-2 left-0 w-0.5 rounded-full transition-all duration-200 ${
          ativo
            ? "bg-emerald-400"
            : "bg-transparent group-hover:bg-emerald-400/40"
        }`}
        aria-hidden="true"
      />

      <Icone
        className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
          ativo
            ? "text-emerald-400"
            : "text-gray-500 group-hover:text-emerald-400"
        }`}
        aria-hidden="true"
      />

      <span className="min-w-0 flex-1 truncate font-medium">
        {item.titulo}
      </span>

      {item.contador === "comprovantes" && pendentes ? (
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
          {pendentes}
        </span>
      ) : null}
    </Link>
  );
}

export default function AppSidebar({
  navegacao,
  papel,
  nomeOrganizacao,
  tipoOrganizacao,
  nomeUsuario,
  emailUsuario,
  pendentes,
  onSair,
  variante = "desktop",
  aberto = false,
  onFechar,
}: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const grupos = filtrarNavegacao(navegacao, papel);

  const estaAtivo = (item: ItemNavegacao) => {
    const base = item.href.split("?")[0];
    const aba = item.aba;

    if (pathname !== base) return false;
    if (!aba) return true;

    return searchParams.get("aba") === aba;
  };

  const conteudo = (
    <div className="flex h-full flex-col bg-[#0A1110]">
      <div className="border-b border-emerald-900/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
              {iniciais(nomeOrganizacao)}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">
                {nomeOrganizacao}
              </span>

              <span className="block truncate text-xs text-gray-500">
                {tipoOrganizacao ?? "Plataforma"}
              </span>
            </span>
          </Link>

          {variante === "mobile" && (
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              {grupo.titulo}
            </p>

            <div className="space-y-1">
              {grupo.itens.map((item) => (
                <Item
                  key={item.titulo}
                  item={item}
                  ativo={estaAtivo(item)}
                  pendentes={pendentes}
                  onClique={
                    variante === "mobile" ? onFechar : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-emerald-900/40 p-4">
        <Link
          href="/perfil"
          title="Meu perfil"
          aria-label="Meu perfil"
          className="mb-3 flex items-center gap-3 rounded-xl bg-[#131D1C] p-3 transition-colors hover:bg-[#182423]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-300">
            {iniciais(nomeUsuario || emailUsuario)}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-white">
              {nomeUsuario || emailUsuario}
            </span>

            <span className="block truncate text-[10px] text-gray-500">
              {papel === "ORGANIZADOR"
                ? "Organizador"
                : papel === "COMITE_CIENTIFICO"
                  ? "Comitê Científico"
                  : papel}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => {
            onSair();
            onFechar?.();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </button>
      </div>
    </div>
  );

  if (variante === "mobile") {
    return (
      <>
        {aberto && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onFechar}
            aria-hidden="true"
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform border-r border-emerald-900/40 transition-transform duration-300 lg:hidden ${
            aberto ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {conteudo}
        </div>
      </>
    );
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-emerald-900/40 lg:flex">
      {conteudo}
    </aside>
  );
}