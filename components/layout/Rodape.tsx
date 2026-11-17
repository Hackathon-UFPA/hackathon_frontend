import Link from "next/link";
import Logo from "@/components/marca/Logo";
import { MARCA } from "@/lib/marca";

// Só links para páginas que existem. Termos de uso, privacidade e contato entram aqui quando
// essas páginas forem escritas.
const COLUNAS = [
  {
    titulo: "Plataforma",
    links: [
      { rotulo: "Hackathons", href: "/hackathons" },
      { rotulo: "Para organizações", href: "/#organizacoes" },
      { rotulo: "Para participantes", href: "/#participantes" },
    ],
  },
  {
    titulo: "Comece agora",
    links: [
      { rotulo: "Criar conta", href: "/login?aba=cadastro" },
      { rotulo: "Cadastrar organização", href: "/login?aba=organizacao" },
      { rotulo: "Entrar", href: "/login" },
    ],
  },
];

export default function Rodape() {
  return (
    <footer className="relative z-10 mt-16 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" aria-label={`${MARCA.nome}: início`} className="inline-block hover:opacity-80">
            <Logo />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{MARCA.descricao}</p>
        </div>

        {COLUNAS.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">{coluna.titulo}</h2>
            <ul className="mt-4 space-y-2.5">
              {coluna.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 transition-colors hover:text-emerald-700">
                    {link.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {MARCA.nome}. Todos os direitos reservados.</p>
          <p>Regulamento e termos de cada hackathon são publicados pela organização responsável.</p>
        </div>
      </div>
    </footer>
  );
}
