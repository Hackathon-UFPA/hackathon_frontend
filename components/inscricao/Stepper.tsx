"use client";

import { Check } from "lucide-react";

export type Etapa = "conta" | "validacao" | "equipe" | "proposta" | "envio";

export const ETAPAS: { id: Etapa; nome: string }[] = [
  { id: "conta", nome: "Conta" },
  { id: "validacao", nome: "Validação" },
  { id: "equipe", nome: "Equipe" },
  { id: "proposta", nome: "Proposta" },
  { id: "envio", nome: "Envio" },
];

export default function Stepper({
  atual,
  alcancaveis,
  concluidas,
  onSelecionar,
}: {
  atual: Etapa;
  alcancaveis: Etapa[];
  concluidas: Etapa[];
  onSelecionar: (etapa: Etapa) => void;
}) {
  return (
    <nav aria-label="Etapas da inscrição">
      <ol className="grid grid-cols-5 gap-2">
        {ETAPAS.map(({ id, nome }, i) => {
          const ativa = id === atual;
          const concluida = concluidas.includes(id);
          const liberada = alcancaveis.includes(id);
          const situacao = concluida ? "concluída" : liberada ? "disponível" : "bloqueada";
          return (
            <li key={id} aria-current={ativa ? "step" : undefined}>
              <button
                type="button"
                disabled={!liberada}
                onClick={() => onSelecionar(id)}
                className={`w-full rounded-xl border p-2 sm:p-3 text-left transition-colors disabled:cursor-not-allowed ${
                  ativa
                    ? "border-emerald-400 bg-emerald-400/10 text-white"
                    : liberada
                      ? "border-white/10 bg-white/5 text-gray-300 hover:border-emerald-500/50 cursor-pointer"
                      : "border-white/5 bg-transparent text-gray-500"
                }`}
              >
                <span className="sr-only">{`Etapa ${i + 1} de ${ETAPAS.length}: `}</span>
                <span className="flex h-4 items-center gap-1.5 font-mono text-xs">
                  {concluida ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  )}
                </span>
                {/* No celular o nome some da tela, mas continua para o leitor de tela */}
                <span className="sr-only sm:not-sr-only sm:mt-1 sm:block sm:text-sm sm:font-bold sm:tracking-tight">
                  {nome}
                </span>
                <span className="sr-only">{`, ${situacao}`}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
