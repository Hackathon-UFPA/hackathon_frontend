/**
 * Grafismos marajoaras, na mesma linguagem do logo: grega (linha em degrau), fileira de
 * triângulos, losangos e espiral escalonada. São decorativos (aria-hidden) e usam as variáveis
 * --mj-traco / --mj-destaque de app/globals.css, então acompanham o tema claro e o escuro.
 */

type Variante = "grega" | "triangulos" | "losangos" | "completa";

/** Faixa horizontal que ocupa a largura do elemento pai */
export function FaixaMarajoara({ variante = "completa", className = "" }: { variante?: Variante; className?: string }) {
  if (variante === "completa") {
    return (
      <div aria-hidden="true" className={`flex flex-col gap-1.5 ${className}`}>
        <div className="mj-triangulos" />
        <div className="mj-grega" />
        <div className="mj-triangulos rotate-180" />
      </div>
    );
  }
  return <div aria-hidden="true" className={`mj-${variante} ${className}`} />;
}

/** Losango duplo do logo (a "faísca" no canto do ícone) */
export function LosangoMarajoara({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M10 1l9 9-9 9-9-9z" style={{ fill: "var(--mj-destaque)" }} />
      <path d="M10 6.5l3.5 3.5-3.5 3.5-3.5-3.5z" style={{ fill: "var(--fundo-pagina)" }} />
    </svg>
  );
}

/** Divisor de seções: grega dos dois lados e o losango no meio */
export function DivisorMarajoara({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`mx-auto flex max-w-3xl items-center gap-4 px-4 ${className}`}>
      <div className="mj-grega flex-1 opacity-60" />
      <LosangoMarajoara className="h-5 w-5 shrink-0" />
      <div className="mj-grega flex-1 opacity-60" />
    </div>
  );
}

const ROTACAO = {
  "sup-esq": "",
  "sup-dir": "-scale-x-100",
  "inf-esq": "-scale-y-100",
  "inf-dir": "rotate-180",
} as const;

const POSICAO = {
  "sup-esq": "left-2 top-2",
  "sup-dir": "right-2 top-2",
  "inf-esq": "bottom-2 left-2",
  "inf-dir": "bottom-2 right-2",
} as const;

/**
 * Canto com espiral em degrau, como os colchetes do logo. Vai dentro de um elemento com
 * `relative`; não recebe cliques.
 */
export function CantoMarajoara({
  canto = "sup-esq",
  className = "h-8 w-8",
}: {
  canto?: keyof typeof ROTACAO;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      fill="none"
      strokeLinecap="square"
      className={`pointer-events-none absolute ${POSICAO[canto]} ${ROTACAO[canto]} ${className}`}
    >
      <path d="M3 37V3h34" strokeWidth="3" style={{ stroke: "var(--mj-traco)" }} />
      <path d="M11 29V11h18v10H19v-3" strokeWidth="3" style={{ stroke: "var(--mj-destaque)" }} />
    </svg>
  );
}
