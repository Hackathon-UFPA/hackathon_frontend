"use client";

import { useState } from "react";
import { Info, Minus, Plus } from "lucide-react";

type PerguntaFrequente = {
  pergunta: string;
  resposta: string;
};

const perguntasFrequentes: PerguntaFrequente[] = [
  {
    pergunta: "Preciso saber programar para participar?",
    resposta:
      "Não. O hackathon valoriza times multidisciplinares. Além de desenvolvedores, equipes podem contar com designers, especialistas em dados, estudantes de áreas socioambientais e pessoas de negócios.",
  },
  {
    pergunta: "Quem pode participar do hackathon?",
    resposta:
      "Estudantes, pesquisadores, profissionais e entusiastas de tecnologia, inovação, meio ambiente, saúde e áreas correlatas podem se inscrever. Os requisitos específicos de vínculo e participação são definidos pelo regulamento da edição.",
  },
  {
    pergunta: "Como funciona a formação das equipes?",
    resposta:
      "Você pode criar uma equipe ou aceitar um convite de outro participante. Após a aprovação dos comprovantes e o aceite dos termos, a equipe poderá concluir a inscrição e acompanhar sua homologação.",
  },
  {
    pergunta: "Quais são as trilhas do evento?",
    resposta:
      "As trilhas iniciais são Bioeconomia e Conservação, Monitoramento Hidrográfico e Saúde Ribeirinha Isolada. As soluções devem estar alinhadas aos desafios e critérios de avaliação definidos para a edição.",
  },
  {
    pergunta: "A participação é presencial ou online?",
    resposta:
      "O formato, o local e o cronograma da edição serão divulgados pelas informações oficiais do hackathon. Acompanhe esta página e o cronograma para conhecer as etapas e os prazos.",
  },
  {
    pergunta: "Existe certificado de participação?",
    resposta:
      "As condições de certificação, horas complementares e reconhecimento acadêmico serão informadas no regulamento e nos canais oficiais da edição.",
  },
];

export default function FaqSection() {
  const [perguntaAberta, setPerguntaAberta] = useState<number | null>(0);

  const alternarPergunta = (indice: number) => {
    setPerguntaAberta(perguntaAberta === indice ? null : indice);
  };

  return (
    <section
      id="faq"
      className="relative border-t border-white/5 py-20 md:py-28"
    >
      {/* Textura sutil de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.6) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Coluna esquerda */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-emerald-500/60"
              />

              <span className="text-xs font-light uppercase tracking-widest text-emerald-400">
                Perguntas frequentes
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold leading-tight text-white md:text-4xl">
              Antes de começar,
              <br />
              vamos conversar.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-gray-400 md:text-base">
              Reunimos as dúvidas mais comuns sobre inscrição, equipes, trilhas
              e participação no Hackathon IA Amazônia 2027. Se não encontrar a
              resposta que procura, acompanhe os canais oficiais do evento.
            </p>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />

              <p className="text-sm leading-relaxed text-emerald-100/80">
                As informações da edição serão atualizadas conforme as
                definições da organização.
              </p>
            </div>
          </div>

          {/* Coluna direita: acordeão */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-white/10 border-y border-white/10">
              {perguntasFrequentes.map((item, indice) => {
                const aberto = perguntaAberta === indice;

                return (
                  <div key={item.pergunta}>
                    <button
                      type="button"
                      onClick={() => alternarPergunta(indice)}
                      aria-expanded={aberto}
                      aria-controls={`faq-resposta-${indice}`}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-emerald-300"
                    >
                      <span className="text-base font-semibold text-white md:text-lg">
                        {item.pergunta}
                      </span>

                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-400 transition-colors hover:border-emerald-500/40"
                      >
                        {aberto ? (
                          <Minus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </span>
                    </button>

                    <div
                      id={`faq-resposta-${indice}`}
                      className={`grid transition-all duration-300 ease-out ${
                        aberto
                          ? "grid-rows-[1fr] pb-6 opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-3xl pr-10 text-sm leading-relaxed text-gray-400 md:text-base">
                          {item.resposta}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}