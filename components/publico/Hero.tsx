import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Brilhos de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-emerald-500/20 blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-500/10 blur-[120px]"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        {/* Coluna esquerda */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Inteligência Artificial na Amazônia
          </div>

          <h1 className="mt-8 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Conectando
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              tecnologia
            </span>{" "}
            e Amazônia
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg lg:mx-0">
            O Hackathon IA Amazônia 2027 reúne estudantes, pesquisadores,
            desenvolvedores e especialistas para criar soluções de inteligência
            artificial diante dos desafios socioambientais da região.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <Link
              href="/inscricao"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-extrabold text-black shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all hover:bg-emerald-400 sm:w-auto"
            >
              Iniciar inscrição
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/cronograma"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:border-emerald-400/40 hover:bg-white/10 sm:w-auto"
            >
              Ver cronograma
            </Link>
          </div>

          {/* Indicadores */}
          <div className="mt-14 grid grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
            <div className="text-center lg:text-left">
              <span className="block text-2xl font-extrabold text-white md:text-3xl">
                72h
              </span>

              <span className="mt-1 block text-xs uppercase tracking-wider text-gray-400">
                de imersão
              </span>
            </div>

            <div className="text-center lg:text-left">
              <span className="block text-2xl font-extrabold text-emerald-400 md:text-3xl">
                3 trilhas
              </span>

              <span className="mt-1 block text-xs uppercase tracking-wider text-gray-400">
                desafios ODS
              </span>
            </div>

            <div className="text-center lg:text-left">
              <span className="block text-2xl font-extrabold text-white md:text-3xl">
                Belém
              </span>

              <span className="mt-1 block text-xs uppercase tracking-wider text-gray-400">
                edição 2027
              </span>
            </div>
          </div>
        </div>

        {/* Coluna direita: colagem fotográfica */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          {/* Glow atrás das imagens */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[110px]"
          />

          <div className="relative grid grid-cols-2 gap-4">
            {/* Foto principal: Amazônia */}
            <div className="col-span-2 relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <img
                src="https://magnific.com/br/fotos-vetores-gratis/amazonia-brasileira"
                alt="Paisagem amazônica com rio e floresta"
                className="h-64 w-full object-cover md:h-80"
                loading="eager"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1110]/90 via-[#0A1110]/20 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-[#0A1110]/80 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Amazônia, tecnologia e futuro
                </span>
              </div>
            </div>

            {/* Foto secundária: IA e tecnologia */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80"
                alt="Pessoa trabalhando com tecnologia e inteligência artificial"
                className="h-40 w-full object-cover md:h-48"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1110]/80 to-transparent" />
            </div>

            {/* Foto secundária: pessoas e colaboração */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                alt="Equipe colaborando em um ambiente de trabalho"
                className="h-40 w-full object-cover md:h-48"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1110]/80 to-transparent" />
            </div>
          </div>

          {/* Card flutuante */}
          <div className="absolute -bottom-6 -left-4 z-20 hidden rounded-2xl border border-emerald-500/25 bg-[#0A1110]/90 px-5 py-4 shadow-2xl backdrop-blur-xl md:block md:-rotate-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
              Hackathon IA Amazônia
            </p>

            <p className="mt-1 text-sm font-bold text-white">
              Soluções para a Amazônia
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}