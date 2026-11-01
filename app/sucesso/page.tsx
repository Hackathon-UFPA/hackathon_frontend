"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { equipes } from "@/lib/api";

function ConteudoSucesso() {
  const searchParams = useSearchParams();
  const [protocolo, setProtocolo] = useState<string>("HK2027-CARREGANDO");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // O protocolo é emitido pelo backend ao concluir a inscrição
    const protoUrl = searchParams.get("protocolo");
    if (protoUrl) {
      setProtocolo(protoUrl);
    } else {
      // Sem protocolo na URL: busca o da equipe do usuário logado
      (async () => {
        try {
          const [eq] = await equipes.minhas();
          if (!eq) return;
          const painel = await equipes.painel(eq.id);
          if (painel.protocolo?.numero) setProtocolo(painel.protocolo.numero);
        } catch {
          // sem sessão ou sem protocolo: mantém o estado neutro
        }
      })();
    }
  }, [searchParams]);

  // Renderiza um estado neutro no servidor até a hidratação ser concluída no navegador
  if (!mounted) {
    return (
      <div className="bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-xl w-full max-w-md text-center">
        <p className="text-gray-400 text-sm font-mono animate-pulse">Carregando protocolo...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-2xl w-full max-w-md text-center backdrop-blur-xl relative z-10">
      {/* Ícone de Sucesso */}
      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Inscrição Enviada!</h1>
      <p className="text-xs text-gray-400 mb-6 leading-relaxed">
        Recebemos os dados da sua equipe com sucesso. Sua submissão foi registrada sob o protocolo abaixo.
      </p>

      {/* Caixa do Protocolo */}
      <div className="bg-[#0A1110] p-4 rounded-xl border border-emerald-900/40 mb-6">
        <p className="text-[10px] uppercase font-semibold text-emerald-500 tracking-wider mb-1">
          Protocolo de Registro
        </p>
        <p className="text-xl font-extrabold text-white font-mono tracking-widest">{protocolo}</p>
      </div>

      <div className="space-y-3">
        <Link
          href="/inscricao"
          className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all text-xs shadow-md"
        >
          Acessar Painel da Equipe &rarr;
        </Link>
        <Link
          href="/"
          className="block w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-semibold rounded-lg transition-all text-xs"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col items-center justify-center p-6 relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/80 to-[#0A1110]"></div>
      </div>

      <Suspense fallback={<p className="text-emerald-400 font-mono text-xs">Carregando...</p>}>
        <ConteudoSucesso />
      </Suspense>
    </main>
  );
}