import { Mail, Handshake, Newspaper } from "lucide-react";

const canais = [
  {
    icone: Mail,
    titulo: "Dúvidas e inscrições",
    descricao:
      "Dúvidas sobre inscrição, equipes, comprovantes e participação no hackathon.",
    texto: "contato@hackathoniaamazonia.org",
    href: "mailto:contato@hackathoniaamazonia.org",
  },
  {
    icone: Handshake,
    titulo: "Patrocínio e parcerias",
    descricao:
      "Empresas, institutos, universidades e organizações interessadas em apoiar a edição.",
    texto: "parcerias@hackathoniaamazonia.org",
    href: "mailto:parcerias@hackathoniaamazonia.org",
  },
  {
    icone: Newspaper,
    titulo: "Imprensa e comunicação",
    descricao:
      "Solicitações de entrevista, materiais institucionais e informações para veículos de comunicação.",
    texto: "imprensa@hackathoniaamazonia.org",
    href: "mailto:imprensa@hackathoniaamazonia.org",
  },
];

export default function ContactSection() {
  return (
    <section
      id="contato"
      className="relative border-t border-white/5 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
            Fale com a organização
          </span>

          <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
            Entre em contato
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-gray-400 md:text-base">
            Estamos disponíveis para esclarecer dúvidas, receber propostas de
            parceria e apoiar a divulgação do Hackathon IA Amazônia 2027.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {canais.map((canal) => {
            const Icone = canal.icone;

            return (
              <a
                key={canal.titulo}
                href={canal.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/[0.06]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Icone className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="text-lg font-bold text-white">
                  {canal.titulo}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  {canal.descricao}
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-emerald-400 transition-colors group-hover:text-emerald-300">
                  {canal.texto}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}