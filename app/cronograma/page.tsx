"use client";

import Link from "next/link";

export default function CronogramaPage() {
  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col">
      
      {/* BACKGROUND GLOBAL DA FLORESTA */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/40 via-[#0A1110]/80 to-[#0A1110]"></div>
      </div>

      {/* HEADER FIXO DE NAVEGAÇÃO */}
      <header className="relative z-10 w-full border-b border-white/5 bg-[#0A1110]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">IA</div>
          <span className="text-white font-bold tracking-widest text-sm uppercase hidden sm:block">Hackathon Amazônia</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Início
          </Link>
          <Link href="/inscricao" className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            Inscreva-se
          </Link>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DA TELA DE CRONOGRAMA */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        
        {/* Cabeçalho da Página */}
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Etapas do Processo
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 mb-3 tracking-tight">
            Cronograma do Hackathon
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Acompanhe em detalhes cada etapa da maratona, do início das inscrições até o encerramento com a aceleração das ideias vencedoras.
          </p>
        </div>

        {/* Banner de Status Atual */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-12 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <p className="text-sm font-bold text-white">Inscrições abertas — Etapa 1 ativa!</p>
              <p className="text-xs text-emerald-400">Garanta a vaga do seu esquadrão antes do encerramento dos prazos.</p>
            </div>
          </div>
          <Link href="/inscricao" className="bg-emerald-500 text-black px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            Fazer Inscrição &rarr;
          </Link>
        </div>

        {/* Linha do Tempo (Timeline Vertical) */}
        <div className="relative pl-6 md:pl-10 space-y-8 border-l-2 border-emerald-500/20">
          
          {/* ETAPA 1: ATIVA */}
          <div className="relative">
            <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-[0_0_15px_rgba(16,185,129,0.8)] border-2 border-emerald-300">
              ✓
            </div>
            
            <div className="bg-[#131D1C] border border-emerald-500/50 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                <h2 className="text-xl font-bold text-white">1. Inscrições de Esquadrões</h2>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-2.5 py-1 rounded-full">Etapa Atual</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">Em Andamento</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                Período oficial em que os interessados preenchem o formulário de participação do hackathon e convidam os integrantes para o esquadrão.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs border-t border-white/10 pt-4 items-center">
                <div>
                  <span className="text-gray-500 block mb-1">Início</span>
                  <span className="text-white font-mono font-bold">15/03/2027</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Término</span>
                  <span className="text-white font-mono font-bold">10/04/2027</span>
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <Link href="/inscricao" className="bg-white/10 hover:bg-emerald-500 hover:text-black text-white px-4 py-2 rounded-lg font-bold text-xs transition-all border border-white/10">
                    Garantir Vaga
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 2 */}
          <div className="relative">
            <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-[#0A1110] text-gray-500 font-bold flex items-center justify-center text-sm border-2 border-white/10">
              2
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-200">2. Seleção e Capacitação</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">Em Breve</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Análise técnica inicial dos formulários de submissão e oferta de workshops preparatórios sobre modelos de Inteligência Artificial para a região.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 block mb-0.5">Início</span>
                  <span className="text-gray-300 font-mono">11/04/2027</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Término</span>
                  <span className="text-gray-300 font-mono">18/04/2027</span>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 3 */}
          <div className="relative">
            <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-[#0A1110] text-gray-500 font-bold flex items-center justify-center text-sm border-2 border-white/10">
              3
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-200">3. Mentoria e Desenvolvimento (Imersão 72h)</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">Em Breve</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Maratona intensiva de codificação e prototipagem presencial com acompanhamento direto de mentores do setor de dados e meio ambiente.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 block mb-0.5">Início</span>
                  <span className="text-gray-300 font-mono">23/04/2027</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Término</span>
                  <span className="text-gray-300 font-mono">25/04/2027</span>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 4 */}
          <div className="relative">
            <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-[#0A1110] text-gray-500 font-bold flex items-center justify-center text-sm border-2 border-white/10">
              4
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-200">4. Avaliação e Premiação</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">Em Breve</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Apresentação dos pitches finais para a banca examinadora com anúncio dos premiados (R$ 150k no total).
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 block mb-0.5">Data da Banca</span>
                  <span className="text-gray-300 font-mono">26/04/2027</span>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 5 */}
          <div className="relative">
            <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-[#0A1110] text-gray-500 font-bold flex items-center justify-center text-sm border-2 border-white/10">
              5
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-200">5. Continuidade Pós-Hackathon</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">Em Breve</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Programa de aceleração, incubação das soluções e conexão direta das equipes vencedoras com fundos de investimento socioambientais.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-3">
                <div>
                  <span className="text-gray-500 block mb-0.5">Previsão</span>
                  <span className="text-gray-300 font-mono">Maio / 2027</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* RODAPÉ SIMPLIFICADO */}
      <footer className="relative z-10 w-full border-t border-white/10 py-6 text-center text-xs text-gray-500">
        © 2027 Hackathon IA Amazônia — Todos os direitos reservados.
      </footer>
    </div>
  );
}