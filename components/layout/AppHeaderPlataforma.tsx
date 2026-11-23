"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";

const ROTAS_COM_SIDEBAR = [
  "/equipe",
  "/proposta",
  "/avaliador",
  "/admin",
];

export default function AppHeaderPlataforma() {
  const pathname = usePathname();

  const deveEsconder = ROTAS_COM_SIDEBAR.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );

  if (deveEsconder) {
    return null;
  }

  return <AppHeader />;
}
