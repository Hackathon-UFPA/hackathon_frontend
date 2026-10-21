"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SucessoPage() {
  const [protocolo, setProtocolo] = useState("");

  useEffect(() => {
    setProtocolo(Math.random().toString(36).substring(2, 10).toUpperCase());
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col items-center justify-center p-6">
      
      {/* BACKGROUND GLOBAL DA FLORESTA */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/90 to-[#0A1110]"></div>
      </div>

      <main className="relative z-10 w-full max-w-lg">
        {/* Cartão de Confirmação (Glassmorphism) */}
        <div className="bg-white/5 border border-emerald-900/50 backdrop-blur-xl rounded-2xl p-10 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-500">
          
          {/* Ícone de Sucesso */}
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative">
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Inscrição Enviada!</h1>
          
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Recebemos os dados da sua equipe com sucesso. Nossa inteligência artificial já está pré-analisando a sua submissão.
          </p>

          {/* Box de Protocolo */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-2">Protocolo da Missão</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono text-white font-bold tracking-[0.2em]">{protocolo || "GERANDO..."}</span>
            </div>
          </div>

          {/* Botões de Ação Atualizados */}
          <div className="flex flex-col gap-3">
            {/* O botão desativado agora é um Link funcional e chamativo! */}
            <Link href="/equipe" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Acessar Painel da Equipe
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            
            <Link href="/" className="w-full py-3.5 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors">
              Voltar ao Início
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}