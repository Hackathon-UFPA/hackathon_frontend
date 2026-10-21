"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-x-hidden">
      
      {/* BACKGROUND GLOBAL DA FLORESTA */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/80 to-[#0A1110]"></div>
      </div>

      {/* CABEÇALHO DE NAVEGAÇÃO FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A1110]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              IA
            </div>
            <span className="text-white font-bold tracking-widest text-sm uppercase">
              HACKATHON AMAZÔNIA
            </span>
          </Link>

          {/* Menu Central */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#sobre" className="text-gray-300 hover:text-white transition-colors">
              Sobre o Evento
            </a>
            <a href="#desafios" className="text-gray-300 hover:text-white transition-colors">
              Desafios ODS
            </a>
            {/* Link apontando para a página /cronograma */}
            <Link href="/cronograma" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Cronograma
            </Link>
          </nav>

          {/* Ações da Direita */}
          <div className="flex items-center gap-4">
            <Link href="/equipe" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Acessar Painel
            </Link>
            <Link href="/inscricao" className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              Inscreva-se
            </Link>
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="relative z-10 flex-1 pt-28">
        
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm text-emerald-400 text-xs font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Inteligência Artificial na Amazônia
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-8">
            HACKATHON <span className="text-emerald-400">IA 2027</span>
          </h1>

          <p className="text-base md:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">
            Três dias de imersão para construir soluções tecnológicas que enfrentam os desafios reais da região amazônica.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link 
              href="/inscricao" 
              className="bg-emerald-500 text-black px-8 py-4 rounded-xl font-extrabold text-base hover:bg-emerald-400 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              Inicializar Imersão
            </Link>
            <Link 
              href="/cronograma" 
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-white/10 transition-all backdrop-blur-md"
            >
              Ver Cronograma &rarr;
            </Link>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 mt-20 w-full border-t border-white/10 pt-12">
            <div>
              <span className="text-3xl md:text-4xl font-extrabold text-white block mb-1">72h</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">de maratona presencial</span>
            </div>
            <div>
              <span className="text-3xl md:text-4xl font-extrabold text-emerald-400 block mb-1">R$ 150k</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">em prêmios e aceleração</span>
            </div>
            <div>
              <span className="text-3xl md:text-4xl font-extrabold text-white block mb-1">Belém</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">edição 2027</span>
            </div>
          </div>
        </section>

        {/* SEÇÃO SOBRE O EVENTO */}
        <section id="sobre" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                A Grande Maratona
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-6">
                Tecnologia de ponta a serviço da maior biodiversidade do planeta.
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                O Hackathon IA Amazônia 2027 reúne desenvolvedores, cientistas de dados, designers e especialistas em meio ambiente para responder a questões críticas da região socioambiental.
              </p>
              <p className="text-gray-400 leading-relaxed">
                As equipes terão acesso a dados de satélite, modelos pré-treinados de linguagem e suporte contínuo de mentores especializados durante todas as etapas.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <h3 className="text-lg font-bold text-white mb-4">Por que participar?</h3>
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Mentoria Direta:</strong> Apoio de profissionais da AWS, Google Cloud e pesquisadores da UFPA/INPA.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Conexão com Investidores:</strong> Apresente seu MVP diretamente para fundos de impacto.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Certificação Oficial:</strong> Válido como horas complementares de extensão acadêmica.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEÇÃO DESAFIOS ODS */}
        <section id="desafios" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Eixos Temáticos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">Desafios Regionais (ODS)</h2>
            <p className="text-gray-400 text-sm mt-2">Escolha uma das trilhas e aplique Inteligência Artificial para gerar soluções reais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:border-emerald-500/50 transition-all group">
              <div className="text-3xl mb-4">🌱</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Bioeconomia e Conservação</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Algoritmos preditivos para rastreamento de desmatamento ilegal e mapeamento da biodiversidade da flora local.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:border-emerald-500/50 transition-all group">
              <div className="text-3xl mb-4">💧</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Monitoramento Hidrográfico</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Previsão de cheias e secas extremas na bacia amazônica utilizando dados telemétricos e sensores IoT de baixo custo.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:border-emerald-500/50 transition-all group">
              <div className="text-3xl mb-4">🏥</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Saúde Ribeirinha Isolada</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Triagem médica assistida por IA offline para diagnóstico precoce em comunidades remotas e sem conectividade contínua.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* RODAPÉ REGULAMENTO, LGPD E FAQ */}
      <footer className="relative z-10 w-full border-t border-emerald-900/30 bg-[#0A1110]/90 backdrop-blur-xl pt-16 pb-8 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Regulamento */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">📜</span>
              Regras do Jogo
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">▹</span>
                <p><strong className="text-gray-200">Formação:</strong> Equipes de 4 membros, exigindo pelo menos um Especialista em IA/Dados e um Líder Técnico.</p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">▹</span>
                <p><strong className="text-gray-200">Foco Regional:</strong> O projeto deve solucionar um problema da Amazônia (Bioeconomia, Monitoramento Hidrográfico ou Saúde Ribeirinha).</p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">▹</span>
                <p><strong className="text-gray-200">Critérios:</strong> Avaliação focada em inovação tecnológica, viabilidade offline, UX/UI e impacto social.</p>
              </li>
            </ul>
          </div>

          {/* Privacidade e LGPD */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">🔒</span>
              Privacidade (LGPD)
            </h3>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="bg-white/5 border border-white/5 p-4 rounded-lg">
                <strong className="text-gray-200 block mb-1">Coleta de Dados</strong>
                <p>Os dados coletados serão armazenados com segurança e utilizados exclusivamente para comunicação, credenciamento e emissão de certificados do Hackathon IA 2027.</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-lg">
                <strong className="text-gray-200 block mb-1">Propriedade Intelectual</strong>
                <p>O código-fonte e os direitos do MVP gerado durante as 72h de maratona pertencerão inteiramente às equipes desenvolvedoras.</p>
              </div>
            </div>
          </div>

          {/* Dúvidas Frequentes (FAQ) */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">❓</span>
              Dúvidas Frequentes
            </h3>
            <div className="space-y-3">
              <details className="group bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-medium text-gray-200 text-sm">
                  Preciso ser um gênio da IA?
                  <span className="transition group-open:rotate-180 text-emerald-500">▼</span>
                </summary>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Não! A construção de um bom projeto exige times multidisciplinares: Devs (Front/Back), Designers (UX/UI) e Negócios para apoiar os especialistas em Dados.
                </p>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-medium text-gray-200 text-sm">
                  O evento é 100% presencial?
                  <span className="transition group-open:rotate-180 text-emerald-500">▼</span>
                </summary>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Sim. A edição de 2027 será uma imersão presencial de 72h em Manaus, com infraestrutura de acampamento e internet de alta velocidade.
                </p>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-medium text-gray-200 text-sm">
                  Como funciona a premiação?
                  <span className="transition group-open:rotate-180 text-emerald-500">▼</span>
                </summary>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  O prêmio de R$ 150k será dividido: R$ 80k (1º lugar), R$ 50k (2º lugar) e R$ 20k (3º lugar), além de mentorias exclusivas com investidores.
                </p>
              </details>
            </div>
          </div>

        </div>

        {/* Direitos Autorais */}
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2027 Sistema Curupira - Hackathon IA Amazônia. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-emerald-400 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Política de Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}