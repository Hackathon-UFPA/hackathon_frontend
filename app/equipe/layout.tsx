"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import AppShell from "@/components/layout/AppShell";
import { NAVEGACAO } from "@/lib/navegacao";
import { auth } from "@/lib/api";
import { useSession } from "@/lib/useSession";

export default function EquipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, pronto } = useSession([
    "PARTICIPANTE",
    "DEV",
  ]);

  useEffect(() => {
    if (pronto && !user) {
      router.replace("/login");
    }
  }, [pronto, user, router]);

  if (!pronto || !user) {
    return null;
  }

  const sair = async () => {
    await auth.logout();
    router.push("/");
    router.refresh();
  };

  return (
    <AppShell
      titulo="Área do Participante"
      navegacao={NAVEGACAO}
      papel={user.papel}
      nomeOrganizacao="IA Hackathon Amazônia"
      tipoOrganizacao={null}
      nomeUsuario={user.nome ?? ""}
      emailUsuario={user.email}
      pendentes={null}
      onSair={sair}
    >
      {children}
    </AppShell>
  );
}