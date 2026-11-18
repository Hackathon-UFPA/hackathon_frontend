/**
 * Ilustrações da plataforma (desenhos próprios) no estilo marajoara do logo: formas
 * geométricas de cantos retos, traço verde-escuro, preenchimento creme e detalhes em terracota,
 * com os motivos da cerâmica (grega em degrau, fileira de triângulos, losangos).
 * Todas usam o mesmo viewBox (120 x 100) para alinharem nos cards.
 * São decorativas (aria-hidden): o texto ao lado é que descreve a funcionalidade.
 */

const TRACO = "#1F4D3A";
const TERRACOTA = "#D2693C";
const TERRACOTA_CLARO = "#F0C7AE";
const CREME = "#F6EEDF";

type Props = { className?: string };

function Svg({ className = "h-24 w-28", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={TRACO}
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {children}
    </svg>
  );
}

/** Fileira de triângulos (como a base do logo), apoiada na linha y */
function Triangulos({ x, y, n, lado = 6, cor = TERRACOTA }: { x: number; y: number; n: number; lado?: number; cor?: string }) {
  const d = Array.from({ length: n }, (_, i) => {
    const x0 = x + i * lado;
    return `M${x0} ${y}l${lado / 2} -${lado * 0.8}l${lado / 2} ${lado * 0.8}z`;
  }).join("");
  return <path d={d} fill={cor} stroke="none" />;
}

/** Grega: linha em degrau, de x até x + largura */
function Grega({ x, y, largura, passo = 8, altura = 4, cor = TRACO, espessura = 2 }: {
  x: number; y: number; largura: number; passo?: number; altura?: number; cor?: string; espessura?: number;
}) {
  let d = `M${x} ${y}`;
  for (let px = x, alto = false; px < x + largura; px += passo, alto = !alto) {
    const fim = Math.min(px + passo, x + largura);
    d += `H${fim}`;
    if (fim < x + largura) d += `V${alto ? y : y - altura}`;
  }
  return <path d={d} stroke={cor} strokeWidth={espessura} />;
}

/** Losango com miolo, como a "faísca" do logo */
function Losango({ cx, cy, r, cor = TERRACOTA, miolo = CREME }: { cx: number; cy: number; r: number; cor?: string; miolo?: string }) {
  const m = r * 0.4;
  return (
    <>
      <path d={`M${cx} ${cy - r}l${r} ${r}-${r} ${r}-${r}-${r}z`} fill={cor} stroke="none" />
      <path d={`M${cx} ${cy - m}l${m} ${m}-${m} ${m}-${m}-${m}z`} fill={miolo} stroke="none" />
    </>
  );
}

/** Monitor com a página do hackathon e o botão de inscrição */
export function IlustracaoSite({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="14" y="10" width="92" height="62" rx="2" fill={CREME} />
      <rect x="22" y="18" width="76" height="26" fill={TRACO} stroke="none" />
      <Grega x={30} y={34} largura={44} cor={CREME} />
      <Losango cx={86} cy={30} r={6} miolo={TRACO} />
      <rect x="40" y="52" width="40" height="11" fill={TERRACOTA} stroke="none" />
      <path d="M48 57.5h24" stroke={CREME} strokeWidth={2} />
      <path d="M52 72v10M68 72v10M38 84h44" />
      <Triangulos x={39} y={93} n={7} />
    </Svg>
  );
}

/** Três pessoas, a do meio em destaque */
export function IlustracaoEquipe({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="25" y="28" width="14" height="14" fill={CREME} />
      <path d="M16 76V62l8-6h16l8 6v14z" fill={CREME} />
      <rect x="81" y="28" width="14" height="14" fill={CREME} />
      <path d="M72 76V62l8-6h16l8 6v14z" fill={CREME} />
      <rect x="51" y="20" width="18" height="18" fill={TERRACOTA_CLARO} />
      <path d="M38 84V66l10-8h24l10 8v18z" fill={TERRACOTA} />
      <Triangulos x={45} y={78} n={5} lado={6} cor={CREME} />
      <Losango cx={60} cy={9} r={5} />
    </Svg>
  );
}

/** Documento com selo de aprovação */
export function IlustracaoComprovante({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="36" y="10" width="52" height="68" fill={TERRACOTA_CLARO} stroke="none" />
      <rect x="30" y="16" width="52" height="68" fill={CREME} />
      <rect x="38" y="24" width="10" height="10" fill={TRACO} stroke="none" />
      <path d="M54 26h20M54 32h14M38 46h36M38 54h36M38 62h20" />
      <Grega x={38} y={74} largura={30} passo={6} altura={3} cor={TERRACOTA} />
      <Losango cx={82} cy={72} r={15} miolo={TERRACOTA} />
      <path d="M76 72l4 4 8-8" stroke={CREME} strokeWidth={3} />
    </Svg>
  );
}

/** Prancheta com critérios e notas */
export function IlustracaoAvaliacao({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="28" y="16" width="58" height="74" rx="2" fill={CREME} />
      <rect x="44" y="10" width="26" height="12" fill={TRACO} stroke="none" />
      <path d="M37 38l4 4 7-8M37 54l4 4 7-8M37 70l4 4 7-8" stroke={TERRACOTA} strokeWidth={3} />
      <rect x="55" y="35" width="22" height="6" fill={TERRACOTA_CLARO} stroke="none" />
      <rect x="55" y="35" width="16" height="6" fill={TRACO} stroke="none" />
      <rect x="55" y="51" width="22" height="6" fill={TERRACOTA_CLARO} stroke="none" />
      <rect x="55" y="51" width="20" height="6" fill={TRACO} stroke="none" />
      <rect x="55" y="67" width="22" height="6" fill={TERRACOTA_CLARO} stroke="none" />
      <rect x="55" y="67" width="11" height="6" fill={TRACO} stroke="none" />
      <Triangulos x={36} y={86} n={7} lado={6} />
      <Losango cx={99} cy={24} r={9} />
    </Svg>
  );
}

/** Troféu com losangos ao redor */
export function IlustracaoTrofeu({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M42 16h36v20c0 10-8 18-18 18s-18-8-18-18z" fill={TERRACOTA} />
      <Grega x={44} y={30} largura={32} passo={8} altura={5} cor={CREME} />
      <path d="M42 22H32v8l10 8M78 22h10v8l-10 8" />
      <path d="M60 54v12M50 66h20l3 14H47z" fill={CREME} />
      <rect x="42" y="80" width="36" height="7" fill={TRACO} stroke="none" />
      <Triangulos x={45} y={95} n={5} lado={6} />
      <Losango cx={22} cy={22} r={6} />
      <Losango cx={98} cy={20} r={5} />
      <Losango cx={20} cy={60} r={4} cor={TRACO} />
      <Losango cx={100} cy={58} r={4} cor={TRACO} />
    </Svg>
  );
}

/** Calendário com etapas marcadas */
export function IlustracaoCronograma({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="20" y="18" width="80" height="68" rx="2" fill={CREME} />
      <rect x="20" y="18" width="80" height="16" fill={TRACO} stroke="none" />
      <Triangulos x={42} y={31} n={6} lado={6} cor={CREME} />
      <path d="M36 12v12M84 12v12" />
      <Losango cx={40} cy={52} r={7} miolo={TERRACOTA} />
      <path d="M37 52l2 2 4-4" stroke={CREME} strokeWidth={2} />
      <Losango cx={60} cy={52} r={7} miolo={TERRACOTA} />
      <path d="M57 52l2 2 4-4" stroke={CREME} strokeWidth={2} />
      <Losango cx={80} cy={52} r={7} cor={TERRACOTA_CLARO} />
      <rect x="35" y="66" width="10" height="10" fill={CREME} />
      <rect x="55" y="66" width="10" height="10" fill={CREME} />
      <rect x="75" y="66" width="10" height="10" fill={CREME} />
    </Svg>
  );
}

/** Notebook recebendo propostas */
export function IlustracaoProposta({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="44" y="8" width="34" height="42" fill={TRACO} stroke="none" />
      <rect x="50" y="14" width="34" height="42" fill={TERRACOTA} stroke="none" />
      <rect x="56" y="20" width="34" height="42" fill={CREME} />
      <path d="M62 30h22M62 37h22M62 44h14" />
      <path d="M24 62h72v18H24z" fill={CREME} />
      <Grega x={30} y={74} largura={60} passo={6} altura={3} cor={TERRACOTA} />
      <path d="M14 80h92l-6 8H20z" fill={TRACO} />
      <Triangulos x={36} y={88} n={8} lado={6} cor={CREME} />
    </Svg>
  );
}

/** Envelope com aviso */
export function IlustracaoAviso({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="14" y="34" width="68" height="48" rx="2" fill={CREME} />
      <path d="M14 38l34 22 34-22" />
      <Grega x={22} y={76} largura={52} passo={6} altura={3} cor={TERRACOTA} />
      <Losango cx={88} cy={28} r={18} miolo={TERRACOTA} />
      <path d="M83 32v-6a5 5 0 0 1 10 0v6l2 3H81zM86 38h4" stroke={CREME} strokeLinecap="round" strokeLinejoin="round" />
      <Triangulos x={22} y={94} n={9} lado={6} />
    </Svg>
  );
}

/** Caixa vazia com losangos: "tudo em dia" */
export function IlustracaoTudoEmDia({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M24 46l36-16 36 16-36 16z" fill={TERRACOTA_CLARO} />
      <path d="M24 46v28l36 16V62zM96 46v28L60 90V62z" fill={CREME} />
      <Grega x={68} y={74} largura={20} passo={5} altura={3} cor={TERRACOTA} />
      <path d="M36 70l6 6 12-12" stroke={TERRACOTA} strokeWidth={3.5} />
      <Losango cx={60} cy={14} r={7} />
      <Losango cx={40} cy={22} r={4} cor={TRACO} />
      <Losango cx={80} cy={22} r={4} cor={TRACO} />
    </Svg>
  );
}
