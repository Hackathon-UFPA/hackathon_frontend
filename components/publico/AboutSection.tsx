import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Leaf,
  Users,
  Lightbulb,
  Rocket,
  Award,
} from "lucide-react";

const pilares = [
  {
    icone: BrainCircuit,
    titulo: "Inteligência artificial aplicada",
    descricao:
      "Times usam IA, dados e tecnologia para criar soluções diante de desafios reais da Amazônia.",
  },
  {
    icone: Leaf,
    titulo: "Impacto socioambiental",
    descricao:
      "As soluções buscam gerar impacto mensurável para comunidades, territórios e biomas da região.",
  },
  {
    icone: Users,
    titulo: "Colaboração multidisciplinar",
    descricao:
      "Desenvolvedores, designers, pesquisadores, estudantes e especialistas constroem soluções juntos.",
  },
];

const etapas = [
  {
    icone: Lightbulb,
    titulo: "Desafios e trilhas",
    descricao:
      "Desafios reais são organizados em trilhas ligadas a temas socioambientais e ODS.",
  },
  {
    icone: Users,
    titulo: "Inscrição e equipes",
    descricao:
      "Participantes se inscrevem, formam equipes e enviam a documentação necessária.",
  },
  {
    icone: Rocket,
    titulo: "Desenvolvimento",
    descricao:
      "As equipes recebem apoio, mentoria e desenvolvem soluções ao longo do hackathon.",
  },
  {
    icone: Award,
    titulo: "Avaliação e reconhecimento",
    descricao:
      "As soluções são avaliadas por critérios de impacto, viabilidade e continuidade.",
  },
];

export default function AboutSection() {
  return (
    <section
      id="sobre"
      className="relative border-t border-white/5 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Cabeçalho */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Sobre o hackathon
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight text-white md:text-4xl">
              Tecnologia, colaboração
              <br />
              e impacto para a Amazônia.
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-gray-400 md:text-base lg:pb-2">
            O Hackathon IA Amazônia reúne pessoas e organizações em torno de um
            mesmo objetivo: transformar desafios socioambientais em soluções
            tecnológicas com potencial real de impacto.
          </p>
        </div>

        {/* Pilares */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pilares.map((pilar) => {
            const Icone = pilar.icone;

            return (
              <div
                key={pilar.titulo}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/[0.06] md:p-8"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Icone className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="text-lg font-bold text-white md:text-xl">
                  {pilar.titulo}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  {pilar.descricao}
                </p>
              </div>
            );
          })}
        </div>

        {/* Linha do tempo */}
        <div className="mt-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                Como funciona
              </span>

              <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">
                Uma jornada do desafio à solução
              </h3>
            </div>

            <Link
              href="/cronograma"
              className="group inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-all hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300 md:self-auto"
            >
              Ver cronograma
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {etapas.map((etapa, indice) => {
              const Icone = etapa.icone;

              return (
                <div
                  key={etapa.titulo}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-colors duration-300 hover:border-emerald-500/30"
                >
                  <span className="absolute right-5 top-5 text-xs font-bold uppercase tracking-widest text-gray-600">
                    0{indice + 1}
                  </span>

                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-400">
                    <Icone className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <h4 className="text-base font-bold text-white md:text-lg">
                    {etapa.titulo}
                  </h4>

                  <p className="mt-3 text-sm leading-relaxed text-gray-400">
                    {etapa.descricao}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}