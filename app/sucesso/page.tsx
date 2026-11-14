"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SucessoConteudo() {
  const searchParams = useSearchParams();
  const protocolo = searchParams.get("protocolo") || "HK2026-000001";

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-8 md:p-10 shadow-2xl text-center">
      {/* Badge de Confirmação */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Operação Concluída: Inscrição de Equipe
      </div>

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8">
        Inscrição Concluída —{" "}
        <span className="text-emerald-400">Aguardando Homologação</span>
      </h1>

      {/* Card do Protocolo Oficial */}
      <div className="rounded-xl bg-[#0A1110]/80 border border-emerald-500/30 p-6 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Protocolo Oficial (INSCRICAO_EQUIPE)
        </p>
        <p className="text-3xl md:text-4xl font-mono font-extrabold text-emerald-400 tracking-wider select-all">
          {protocolo}
        </p>
      </div>

      {/* Caixa de Situação Atual */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-5 text-left mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-sm font-semibold text-amber-200">
            Situação atual retornada:
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-400/30 text-amber-300">
            Aguardando Homologação
          </span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Concluir a inscrição registra sua equipe na fila de homologação, mas
          ainda não equivale à homologação final. A equipe será homologada assim
          que todos os comprovantes de vínculo forem validados.
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/equipe"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50"
        >
          Acompanhar no Painel da Equipe →
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold text-sm transition-all"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 relative flex flex-col">
      {/* Fundo escuro padronizado com as demais telas */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=2069&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/85 to-[#0A1110]" />
      </div>

      {/* Conteúdo Centralizado */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <Suspense
          fallback={
            <div className="text-emerald-400 text-sm">
              Carregando protocolo...
            </div>
          }
        >
          <SucessoConteudo />
        </Suspense>
      </main>
    </div>
  );
}