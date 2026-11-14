import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section
      id="inscricao"
      className="relative border-t border-white/5 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] px-6 py-16 text-center backdrop-blur-xl md:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl"
          />

          <span className="relative inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Inscrições abertas
          </span>

          <h2 className="relative mt-6 text-3xl font-bold leading-tight text-white md:text-5xl">
            Faça parte da próxima
            <br />
            geração de soluções
            <br />
            para a Amazônia.
          </h2>

          <p className="relative mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
            Forme sua equipe, escolha uma trilha e contribua com soluções de
            inteligência artificial para os desafios socioambientais da região.
          </p>

          <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/inscricao"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-extrabold text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all hover:bg-emerald-400 sm:w-auto"
            >
              Iniciar inscrição
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>

            <Link
              href="/cronograma"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 sm:w-auto"
            >
              Ver cronograma
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}