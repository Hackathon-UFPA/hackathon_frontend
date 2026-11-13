"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Droplets, HeartPulse, Leaf } from "lucide-react";

type TrilhaOds = {
    icone: React.ComponentType<{ className?: string }>;
    titulo: string;
    descricao: string;
    tag: string;
    rotacao: string;
    fundo: string;
    borda: string;
    corIcone: string;
};

const trilhas: TrilhaOds[] = [
    {
        icone: Leaf,
        titulo: "Bioeconomia e Conservação",
        descricao:
            "Desenvolva soluções de inteligência artificial para apoiar o monitoramento ambiental, a conservação da biodiversidade e o uso sustentável dos recursos da Amazônia.",
        tag: "Trilha 01",
        rotacao: "md:-rotate-2",
        fundo: "bg-emerald-500/[0.08]",
        borda: "border-emerald-500/25",
        corIcone: "text-emerald-400",
    },
    {
        icone: Droplets,
        titulo: "Monitoramento Hidrográfico",
        descricao:
            "Crie ferramentas para acompanhar rios, chuvas, cheias e secas, apoiando a prevenção de riscos e a gestão de recursos hídricos nas comunidades amazônicas.",
        tag: "Trilha 02",
        rotacao: "md:rotate-1",
        fundo: "bg-sky-500/[0.08]",
        borda: "border-sky-500/25",
        corIcone: "text-sky-400",
    },
    {
        icone: HeartPulse,
        titulo: "Saúde Ribeirinha Isolada",
        descricao:
            "Proporcione soluções que apoiem o acesso à informação, a triagem inicial e o acompanhamento de saúde em comunidades remotas com conectividade limitada.",
        tag: "Trilha 03",
        rotacao: "md:-rotate-1",
        fundo: "bg-rose-500/[0.08]",
        borda: "border-rose-500/25",
        corIcone: "text-rose-400",
    },
];

export default function OdsSection() {
    const carrosselRef = useRef<HTMLDivElement>(null);

    const rolar = (direcao: "anterior" | "proximo") => {
        const carrossel = carrosselRef.current;

        if (!carrossel) return;

        const card = carrossel.querySelector("article");

        if (!card) return;

        const larguraCard = card.clientWidth + 24;

        carrossel.scrollBy({
            left: direcao === "proximo" ? larguraCard : -larguraCard,
            behavior: "smooth",
        });
    };

    return (
        <section
            id="desafios"
            className="relative overflow-hidden border-t border-white/5 py-20 md:py-28"
        >
            <div className="mx-auto max-w-6xl px-6">
                {/* Cabeçalho centralizado */}
                <div className="mb-12 text-center">
                    <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                        Eixos temáticos
                    </span>

                    <h2 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">
                        Desafios regionais
                        <br />
                        e trilhas ODS
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
                        Escolha uma trilha e aplique inteligência artificial para criar
                        soluções voltadas aos desafios reais da Amazônia.
                    </p>
                </div>

                {/* Controles */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => rolar("anterior")}
                        aria-label="Ver trilha anterior"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                    >
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        onClick={() => rolar("proximo")}
                        aria-label="Ver próxima trilha"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                    >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Carrossel centralizado */}
            <div className="relative">
                <div
                    ref={carrosselRef}
                    className="ods-carousel flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto scroll-smooth px-6 pb-6 md:justify-center md:gap-10 md:px-6"
                    role="region"
                    aria-label="Carrossel de trilhas ODS"
                >
                    {trilhas.map((trilha) => {
                        const Icone = trilha.icone;

                        return (
                            <article
                                key={trilha.titulo}
                                className={`group flex w-[85%] shrink-0 snap-center flex-col justify-between rounded-2xl border p-6 backdrop-blur-md transition-transform duration-300 sm:w-[70%] md:w-[380px] md:p-8 ${trilha.rotacao} ${trilha.fundo} ${trilha.borda}`}
                            >
                                <div>
                                    <div
                                        className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${trilha.corIcone}`}
                                    >
                                        <Icone className="h-6 w-6" aria-hidden="true" />
                                    </div>

                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                        {trilha.tag}
                                    </span>

                                    <h3 className="mt-3 text-xl font-bold text-white md:text-2xl">
                                        {trilha.titulo}
                                    </h3>

                                    <p className="mt-4 text-sm leading-relaxed text-gray-300 md:text-base">
                                        {trilha.descricao}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                        ODS
                                    </span>

                                    <Link
                                        href="/inscricao"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                                    >
                                        Participar
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}

                    {/* Cartão de ação */}
                    <article className="group flex w-[85%] shrink-0 snap-center flex-col justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-6 backdrop-blur-md transition-transform duration-300 sm:w-[70%] md:w-[380px] md:p-8 md:rotate-2">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                                Participe
                            </span>

                            <h3 className="mt-4 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                                Pronto para
                                <br />
                                colaborar?
                            </h3>

                            <p className="mt-5 text-sm leading-relaxed text-gray-300 md:text-base">
                                Forme sua equipe, escolha uma trilha e contribua com uma
                                solução de inteligência artificial para a Amazônia.
                            </p>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <Link
                                href="/inscricao"
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:border-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                            >
                                Quero participar
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}