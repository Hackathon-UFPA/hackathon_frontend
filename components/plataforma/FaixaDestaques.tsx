"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { hackathons } from "@/lib/api";
import ContadorAnimado from "./ContadorAnimado";
import Revelar from "./Revelar";
import { FaixaMarajoara } from "@/components/marajoara/Grafismos";
import VasoMarajoara from "@/components/marajoara/VasoMarajoara";
import {
  IlustracaoAvaliacao,
  IlustracaoAviso,
  IlustracaoCronograma,
  IlustracaoSite,
} from "@/components/ilustracoes/Ilustracoes";

const DESTAQUES = [
  { Ilustracao: IlustracaoSite, titulo: "Página pronta para o seu hackathon", texto: "Cronograma, temas, regulamento e equipes num link para divulgar." },
  { Ilustracao: IlustracaoCronograma, titulo: "Inscrições do começo ao fim", texto: "Equipes, convites, termos e conferência dos comprovantes." },
  { Ilustracao: IlustracaoAvaliacao, titulo: "Avaliação por rubrica", texto: "Distribua as propostas entre o comitê e avalie por critérios e pesos." },
  { Ilustracao: IlustracaoAviso, titulo: "Equipes sempre avisadas", texto: "O resultado chega a cada integrante como notificação na plataforma." },
];

type Numeros = { hackathons: number; organizacoes: number; equipes: number };

/** Faixa colorida de ponta a ponta no meio da home, com números reais da plataforma. */
export default function FaixaDestaques() {
  const [numeros, setNumeros] = useState<Numeros | null>(null);

  useEffect(() => {
    hackathons
      .listar()
      .then(async (lista) => {
        const visiveis = lista.filter((h) => h.status !== "CANCELADO");
        const equipes = await Promise.all(
          visiveis.map((h) => hackathons.equipes(h.id).then((e) => e.total_homologadas).catch(() => 0))
        );
        setNumeros({
          hackathons: visiveis.length,
          organizacoes: new Set(visiveis.map((h) => h.organizacao_id).filter(Boolean)).size,
          equipes: equipes.reduce((a, b) => a + b, 0),
        });
      })
      .catch(() => setNumeros(null));
  }, []);

  return (
    <section aria-label="Destaques da plataforma" className="relative my-12 overflow-hidden bg-gradient-to-br from-emerald-100 via-[#D7F5E9] to-teal-100">
      <FaixaMarajoara variante="grega" className="absolute inset-x-0 top-3 opacity-25" />
      <FaixaMarajoara variante="grega" className="absolute inset-x-0 bottom-3 opacity-25" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[22rem_1fr] lg:items-center">
        <Revelar>
          <div className="flex items-end justify-between gap-4">
            <p className="text-6xl font-extrabold tracking-tight text-[#0B3B2E] sm:text-7xl">
              {numeros ? <ContadorAnimado valor={numeros.hackathons} /> : "—"}
            </p>
            <VasoMarajoara className="h-32 w-auto shrink-0 drop-shadow-[0_10px_18px_rgba(6,78,59,0.25)]" />
          </div>
          <p className="mt-2 text-2xl font-bold leading-snug text-[#0B3B2E]">
            {numeros?.hackathons === 1 ? "hackathon na plataforma" : "hackathons na plataforma"}
          </p>
          {numeros && (
            <dl className="mt-6 flex gap-8">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70">Organizações</dt>
                <dd className="text-3xl font-extrabold text-[#0B3B2E]"><ContadorAnimado valor={numeros.organizacoes} /></dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70">Equipes homologadas</dt>
                <dd className="text-3xl font-extrabold text-[#0B3B2E]"><ContadorAnimado valor={numeros.equipes} /></dd>
              </div>
            </dl>
          )}
          <Link
            href="/login?aba=organizacao"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B3B2E] px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-900"
          >
            Crie seu hackathon <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Revelar>

        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {DESTAQUES.map(({ Ilustracao, titulo, texto }, i) => (
            <li key={titulo}>
              <Revelar atraso={i * 100}>
                <Ilustracao className="h-16 w-20" />
                <h3 className="mt-3 text-lg font-bold text-[#0B3B2E]">{titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-emerald-950/80">{texto}</p>
              </Revelar>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
