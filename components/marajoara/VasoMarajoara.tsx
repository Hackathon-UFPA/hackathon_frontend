import { useId } from "react";

/**
 * Vaso marajoara (desenho próprio): urna de gargalo estreito e bojo largo, com engobe creme e
 * pintura em faixas: borda e ombro em terracota, fileiras de triângulos, grega e, no bojo,
 * espirais em degrau espelhadas (como os colchetes do logo) com losangos entre elas.
 * Usa as cores fixas do logo, então fica igual nos dois temas.
 */

const CREME = "#F3E9D7";
const TRACO = "#1F4D3A";
const TERRACOTA = "#D2693C";

const CORPO =
  "M42 10H78V18L72 22Q72 34 84 40Q108 56 108 92Q108 126 82 146L80 152H40L38 146Q12 126 12 92Q12 56 36 40Q48 34 48 22L42 18Z";

function triangulos(x: number, y: number, n: number, lado: number, invertido = false) {
  const h = lado * 0.8 * (invertido ? -1 : 1);
  return Array.from({ length: n }, (_, i) => `M${x + i * lado} ${y}l${lado / 2} ${-h}l${lado / 2} ${h}z`).join("");
}

function grega(x: number, y: number, largura: number, passo: number, altura: number) {
  let d = `M${x} ${y}`;
  for (let px = x, alto = false; px < x + largura; px += passo, alto = !alto) {
    const fim = Math.min(px + passo, x + largura);
    d += `H${fim}`;
    if (fim < x + largura) d += `V${alto ? y : y - altura}`;
  }
  return d;
}

/** Espiral em degrau; `espelhar` vira para a esquerda */
function Espiral({ x, y, espelhar = false }: { x: number; y: number; espelhar?: boolean }) {
  return (
    <path
      d="M0 22V0H20V16H8V8H14"
      transform={`translate(${x} ${y})${espelhar ? " scale(-1 1)" : ""}`}
      fill="none"
      stroke={TRACO}
      strokeWidth={3.2}
      strokeLinecap="square"
    />
  );
}

function Losango({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <path d={`M${cx} ${cy - r}l${r} ${r}-${r} ${r}-${r}-${r}z`} fill={TERRACOTA} />
      <path d={`M${cx} ${cy - r * 0.4}l${r * 0.4} ${r * 0.4}-${r * 0.4} ${r * 0.4}-${r * 0.4}-${r * 0.4}z`} fill={CREME} />
    </>
  );
}

export default function VasoMarajoara({ className = "h-40 w-auto" }: { className?: string }) {
  const id = useId();
  const recorte = `${id}-corpo`;
  return (
    <svg viewBox="0 0 120 162" className={className} role="img" aria-label="Vaso de cerâmica marajoara">
      <defs>
        <clipPath id={recorte}>
          <path d={CORPO} />
        </clipPath>
      </defs>

      {/* Sombra no chão */}
      <ellipse cx="60" cy="155" rx="30" ry="4" fill={TRACO} opacity={0.18} />

      <path d={CORPO} fill={CREME} />

      <g clipPath={`url(#${recorte})`}>
        {/* Borda e gargalo */}
        <rect x="0" y="8" width="120" height="10" fill={TERRACOTA} />
        <path d={triangulos(46, 32, 4, 7)} fill={TRACO} />

        {/* Ombro: faixa terracota com grega creme */}
        <rect x="0" y="42" width="120" height="12" fill={TERRACOTA} />
        <path d={grega(14, 51, 92, 8, 5)} fill="none" stroke={CREME} strokeWidth={2} />
        <path d={triangulos(18, 62, 12, 7)} fill={TRACO} />

        {/* Bojo: espirais espelhadas e losangos */}
        <Espiral x={20} y={72} />
        <Espiral x={100} y={72} espelhar />
        <Espiral x={44} y={96} />
        <Espiral x={76} y={96} espelhar />
        <Losango cx={60} cy={80} r={9} />
        <Losango cx={26} cy={110} r={5} />
        <Losango cx={94} cy={110} r={5} />

        {/* Base: faixa e triângulos invertidos */}
        <rect x="0" y="124" width="120" height="8" fill={TERRACOTA} />
        <path d={triangulos(26, 134, 10, 7, true)} fill={TRACO} />
        <rect x="0" y="146" width="120" height="8" fill={TRACO} />
      </g>

      <path d={CORPO} fill="none" stroke={TRACO} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  );
}
