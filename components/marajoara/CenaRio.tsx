/**
 * Cena do rio (desenho próprio): uma pessoa ribeirinha remando a canoa, no estilo geométrico
 * marajoara do logo. A canoa balança devagar na água (classe .canoa-balanco em app/globals.css),
 * e a animação para com "Pausar animações" ou com "reduzir movimento" no sistema.
 * As cores do traço e do destaque vêm das variáveis --mj-*, então a cena acompanha o tema.
 */

const PELE = "#8C5A3C";
const CABELO = "#2B1D14";
const REMO = "#6B4F3B";

/** Linha em degrau (grega) usada para a água */
function grega(x: number, y: number, largura: number, passo: number, altura: number) {
  let d = `M${x} ${y}`;
  for (let px = x, alto = false; px < x + largura; px += passo, alto = !alto) {
    const fim = Math.min(px + passo, x + largura);
    d += `H${fim}`;
    if (fim < x + largura) d += `V${alto ? y : y - altura}`;
  }
  return d;
}

function triangulos(x: number, y: number, n: number, lado: number) {
  return Array.from({ length: n }, (_, i) => `M${x + i * lado} ${y}l${lado / 2} -${lado * 0.75}l${lado / 2} ${lado * 0.75}z`).join("");
}

/** Açaizeiro: tronco fino e folhas em leque */
function Acaizeiro({ x, base, altura }: { x: number; base: number; altura: number }) {
  const topo = base - altura;
  return (
    <g style={{ stroke: "var(--mj-traco)" }} strokeWidth={2.5} strokeLinecap="round" fill="none">
      <path d={`M${x} ${base}Q${x + 4} ${(base + topo) / 2} ${x + 2} ${topo}`} />
      <path d={`M${x + 2} ${topo}l-22 10M${x + 2} ${topo}l-16 -10M${x + 2} ${topo}l20 -9M${x + 2} ${topo}l24 8M${x + 2} ${topo}l2 -16`} />
    </g>
  );
}

export default function CenaRio({
  className = "w-full",
  soCanoa = false,
}: {
  className?: string;
  /** Sem o sol e a margem com açaizeiros: para quando a cena fica num canto, perto do conteúdo */
  soCanoa?: boolean;
}) {
  return (
    <svg viewBox={soCanoa ? "0 10 610 160" : "0 0 640 170"} className={className} role="img" aria-label="Pessoa ribeirinha remando uma canoa no rio">
      {!soCanoa && (
        <>
          {/* Sol em losango, como a faísca do logo */}
          <path d="M560 14l16 16-16 16-16-16z" style={{ fill: "var(--mj-destaque)" }} opacity={0.85} />
          <path d="M560 24l6 6-6 6-6-6z" style={{ fill: "var(--fundo-pagina)" }} />

          {/* Margem com açaizeiros */}
          <path d="M520 118q40-14 120-10v10z" style={{ fill: "var(--mj-traco)" }} opacity={0.18} />
          <Acaizeiro x={584} base={114} altura={58} />
          <Acaizeiro x={612} base={112} altura={44} />
        </>
      )}

      {/* Água: grega em camadas */}
      <g fill="none" style={{ stroke: "var(--mj-traco)" }} strokeWidth={2.5} strokeLinecap="square">
        <path d={grega(0, 132, soCanoa ? 610 : 640, 16, 5)} opacity={0.45} />
        <path d={grega(30, 148, 580, 22, 5)} opacity={0.28} />
        <path d={grega(80, 162, 480, 28, 4)} opacity={0.16} />
      </g>

      <g className="canoa-balanco">
        {/* Remo: cabo da mão até a pá dentro d'água, atrás do casco */}
        <path d="M262 52L132 138" stroke={REMO} strokeWidth={5} strokeLinecap="round" />
        <path d="M140 126l-22 16 -6 12 14 -4 20 -18z" fill={REMO} />
        <path d="M100 138h18M92 146h12" fill="none" style={{ stroke: "var(--mj-traco)" }} strokeWidth={2} opacity={0.5} />

        {/* Pessoa sentada, de lado, olhando para a frente */}
        <path d="M196 112v-14q2-14 14-16l22 2q10 4 10 18v10z" fill="#5A2E3A" />
        <path d="M194 98l4-40q4-10 16-12l14 2q10 4 10 14l-2 36z" style={{ fill: "var(--mj-traco)" }} />
        <path d="M228 58l26-4" stroke={PELE} strokeWidth={8} strokeLinecap="round" />
        <path d="M206 62l14 22 20-10" fill="none" stroke={PELE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="211" y="20" width="22" height="24" rx="8" fill={PELE} />
        <path d="M209 30q0-14 14-14t13 10l-6 2h-12l-3 6z" fill={CABELO} />
        <rect x="216" y="42" width="10" height="6" fill={PELE} />

        {/* Canoa com grega e triângulos no casco */}
        <path d="M40 96L92 108H548L600 92L540 140H112z" style={{ fill: "var(--mj-destaque)" }} />
        <path d="M92 108H548" fill="none" stroke="#7A3B1E" strokeWidth={3} />
        <path d={grega(128, 124, 384, 16, 6)} fill="none" style={{ stroke: "var(--mj-creme)" }} strokeWidth={2.5} />
        <path d={triangulos(150, 137, 28, 12)} style={{ fill: "var(--mj-creme)" }} opacity={0.9} />
        <path d="M300 108v-4M380 108v-4M460 108v-4" stroke="#7A3B1E" strokeWidth={4} />
      </g>
    </svg>
  );
}
