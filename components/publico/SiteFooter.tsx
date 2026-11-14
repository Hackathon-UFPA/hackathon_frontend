import Link from "next/link";

const navegacao = [
  {
    rotulo: "Início",
    href: "/",
  },
  {
    rotulo: "Cronograma",
    href: "/cronograma",
  },
  {
    rotulo: "Desafios",
    href: "/#desafios",
  },
  {
    rotulo: "FAQ",
    href: "/#faq",
  },
  {
    rotulo: "Contato",
    href: "/#contato",
  },
];

const linksInstitucionais = [
  {
    rotulo: "Regulamento",
    href: "#",
  },
  {
    rotulo: "Termos de uso",
    href: "#",
  },
  {
    rotulo: "Política de privacidade",
    href: "#",
  },
];

const redesSociais = [
  {
    rotulo: "Instagram",
    href: "#",
  },
  {
    rotulo: "LinkedIn",
    href: "#",
  },
  {
    rotulo: "YouTube",
    href: "#",
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#0A1110]/90 px-6 py-12 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Identidade */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-xs font-extrabold text-black shadow-[0_0_15px_rgba(16,185,129,0.45)]">
                IA
              </span>

              <span className="text-sm font-bold uppercase tracking-widest text-white">
                Hackathon Amazônia
              </span>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Soluções de inteligência artificial para os desafios
              socioambientais da Amazônia.
            </p>
          </div>

          {/* Navegação */}
          <nav aria-label="Navegação do rodapé">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Navegação
            </h3>

            <ul className="space-y-3">
              {navegacao.map((item) => (
                <li key={item.rotulo}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 transition-colors hover:text-emerald-400"
                  >
                    {item.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Informações institucionais */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Institucional
            </h3>

            <ul className="space-y-3">
              {linksInstitucionais.map((item) => (
                <li key={item.rotulo}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 transition-colors hover:text-emerald-400"
                  >
                    {item.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes sociais */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Redes sociais
            </h3>

            <ul className="space-y-3">
              {redesSociais.map((rede) => (
                <li key={rede.rotulo}>
                  <a
                    href={rede.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 transition-colors hover:text-emerald-400"
                  >
                    {rede.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Linha final */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-gray-500 md:flex-row">
          <p>
            © {new Date().getFullYear()} Hackathon IA Amazônia. Todos os
            direitos reservados.
          </p>

          <p className="text-center md:text-right">
            Desenvolvido para conectar tecnologia, pessoas e território.
          </p>
        </div>
      </div>
    </footer>
  );
}