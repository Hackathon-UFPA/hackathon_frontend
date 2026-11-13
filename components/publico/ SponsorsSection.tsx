import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Patrocinador = {
  nome: string;
  logo: string;
  url?: string;
};

type NivelPatrocinadores = {
  rotulo: string;
  itens: Patrocinador[];
  colunas: number;
  alturaLogo: string;
};

const patrocinadoresPorNivel: NivelPatrocinadores[] = [
  {
    rotulo: "Patrocínio principal",
    colunas: 1,
    alturaLogo: "h-28 md:h-32",
    itens: [
      {
        nome: "Patrocinador Principal",
        logo: "https://placehold.co/360x96/0A1110/34D399?text=Patrocinador+Principal",
        url: "#",
      },
    ],
  },
  {
    rotulo: "Parceiro de talentos",
    colunas: 1,
    alturaLogo: "h-24 md:h-28",
    itens: [
      {
        nome: "Parceiro de Talentos",
        logo: "https://placehold.co/320x80/0A1110/9CA3AF?text=Parceiro+de+Talentos",
        url: "#",
      },
    ],
  },
  {
    rotulo: "Apoio",
    colunas: 3,
    alturaLogo: "h-20 md:h-24",
    itens: [
      {
        nome: "Apoio 1",
        logo: "https://placehold.co/220x64/0A1110/9CA3AF?text=Apoio+1",
      },
      {
        nome: "Apoio 2",
        logo: "https://placehold.co/220x64/0A1110/9CA3AF?text=Apoio+2",
      },
      {
        nome: "Apoio 3",
        logo: "https://placehold.co/220x64/0A1110/9CA3AF?text=Apoio+3",
      },
    ],
  },
  {
    rotulo: "Com apoio de",
    colunas: 5,
    alturaLogo: "h-16 md:h-20",
    itens: [
      {
        nome: "Apoiador 1",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Apoiador+1",
      },
      {
        nome: "Apoiador 2",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Apoiador+2",
      },
      {
        nome: "Apoiador 3",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Apoiador+3",
      },
      {
        nome: "Apoiador 4",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Apoiador+4",
      },
      {
        nome: "Apoiador 5",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Apoiador+5",
      },
    ],
  },
  {
    rotulo: "Apoiadores da comunidade",
    colunas: 5,
    alturaLogo: "h-16 md:h-20",
    itens: [
      {
        nome: "Comunidade 1",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Comunidade+1",
      },
      {
        nome: "Comunidade 2",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Comunidade+2",
      },
      {
        nome: "Comunidade 3",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Comunidade+3",
      },
      {
        nome: "Comunidade 4",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Comunidade+4",
      },
      {
        nome: "Comunidade 5",
        logo: "https://placehold.co/160x48/0A1110/9CA3AF?text=Comunidade+5",
      },
    ],
  },
];

function LogoPatrocinador({
  patrocinador,
  altura,
}: {
  patrocinador: Patrocinador;
  altura: string;
}) {
  const conteudo = (
    <div
      className={`flex w-full items-center justify-center overflow-hidden rounded-lg bg-white/[0.02] p-4 transition-colors duration-300 hover:bg-white/[0.05] ${altura}`}
    >
      <img
        src={patrocinador.logo}
        alt={patrocinador.nome}
        loading="lazy"
        className="max-h-full w-auto max-w-full object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
      />
    </div>
  );

  if (!patrocinador.url || patrocinador.url === "#") {
    return <div className="h-full w-full">{conteudo}</div>;
  }

  return (
    <a
      href={patrocinador.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full w-full"
    >
      {conteudo}
    </a>
  );
}

export default function SponsorsSection() {
  return (
    <section
      id="patrocinadores"
      className="relative border-t border-white/5 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Cabeçalho da seção */}
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Obrigado
            </span>

            <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Nossos patrocinadores
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base">
              Organizações e parceiros que apoiam a construção de soluções de
              inteligência artificial para os desafios da Amazônia.
            </p>
          </div>

          <Link
            href="#"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200 md:w-auto"
          >
            Seja um patrocinador
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Grade hierárquica de patrocinadores */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {patrocinadoresPorNivel.map((nivel, indiceNivel) => (
            <div
              key={nivel.rotulo}
              className={`grid grid-cols-1 md:grid-cols-[220px_1fr] ${
                indiceNivel > 0 ? "border-t border-white/10" : ""
              }`}
            >
              {/* Rótulo da categoria */}
              <div className="border-b border-white/10 px-6 py-5 md:border-b-0 md:border-r">
                <span className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {nivel.rotulo}
                </span>
              </div>

              {/* Logotipos */}
              <div
                className="grid gap-px bg-white/10"
                style={{
                  gridTemplateColumns: `repeat(${nivel.colunas}, minmax(0, 1fr))`,
                }}
              >
                {nivel.itens.map((patrocinador) => (
                  <div
                    key={patrocinador.nome}
                    className="bg-[#0A1110] p-4 md:p-6"
                  >
                    <LogoPatrocinador
                      patrocinador={patrocinador}
                      altura={nivel.alturaLogo}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}