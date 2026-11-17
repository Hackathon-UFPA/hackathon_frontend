"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * A área do participante agora é /equipe (EQP-06), que tem seletor de equipe e edição
 * (EQP-03). Esta rota continua existindo para links antigos e redireciona.
 */
export default function InscricaoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/equipe");
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F6F9F8] flex items-center justify-center">
      <p className="text-emerald-700 text-sm font-mono animate-pulse">Abrindo o painel da equipe...</p>
    </main>
  );
}