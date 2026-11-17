/**
 * Ilustrações de traço da plataforma (desenhos próprios): contorno escuro, preenchimento branco
 * e detalhes em verde. Todas usam o mesmo viewBox (120 x 100) para alinharem nos cards.
 * São decorativas (aria-hidden): o texto ao lado é que descreve a funcionalidade.
 */

const TRACO = "#0B3B2E";
const VERDE = "#10B981";
const VERDE_CLARO = "#A7F3D0";
const FUNDO = "#FFFFFF";

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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Monitor com a página do hackathon e o botão de inscrição */
export function IlustracaoSite({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="14" y="12" width="92" height="60" rx="5" fill={FUNDO} />
      <rect x="22" y="20" width="76" height="26" rx="3" fill={VERDE} stroke="none" />
      <path d="M32 29h40M32 36h28" stroke={FUNDO} />
      <circle cx="86" cy="30" r="3" fill={FUNDO} stroke="none" />
      <rect x="40" y="53" width="40" height="10" rx="2" fill={TRACO} stroke="none" />
      <path d="M47 58h26" stroke={FUNDO} strokeWidth={2} />
      <path d="M50 72v10M70 72v10M40 86h40" />
    </Svg>
  );
}

/** Três pessoas, a do meio em destaque */
export function IlustracaoEquipe({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="32" cy="36" r="9" fill={FUNDO} />
      <path d="M16 74c0-11 7-18 16-18s16 7 16 18" fill={FUNDO} />
      <circle cx="88" cy="36" r="9" fill={FUNDO} />
      <path d="M72 74c0-11 7-18 16-18s16 7 16 18" fill={FUNDO} />
      <circle cx="60" cy="30" r="11" fill={VERDE_CLARO} />
      <path d="M40 80c0-14 9-22 20-22s20 8 20 22z" fill={VERDE} />
      <path d="M52 16l3 4M68 16l-3 4M60 12v5" stroke={VERDE} />
    </Svg>
  );
}

/** Documento com selo de aprovação */
export function IlustracaoComprovante({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="30" y="16" width="52" height="68" rx="3" fill={VERDE_CLARO} stroke="none" transform="translate(6 -6)" />
      <rect x="30" y="16" width="52" height="68" rx="3" fill={FUNDO} />
      <circle cx="44" cy="30" r="5" fill={TRACO} stroke="none" />
      <path d="M54 28h20M54 34h14M38 46h36M38 54h36M38 62h20" />
      <circle cx="80" cy="70" r="14" fill={VERDE} />
      <path d="M73 70l5 5 9-10" stroke={FUNDO} strokeWidth={3} />
    </Svg>
  );
}

/** Prancheta com critérios e notas */
export function IlustracaoAvaliacao({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="28" y="16" width="58" height="72" rx="5" fill={FUNDO} />
      <rect x="44" y="10" width="26" height="12" rx="3" fill={TRACO} stroke="none" />
      <path d="M38 38l4 4 7-8M38 54l4 4 7-8M38 70l4 4 7-8" stroke={VERDE} strokeWidth={3} />
      <rect x="55" y="35" width="22" height="6" rx="3" fill={VERDE_CLARO} stroke="none" />
      <rect x="55" y="35" width="16" height="6" rx="3" fill={VERDE} stroke="none" />
      <rect x="55" y="51" width="22" height="6" rx="3" fill={VERDE_CLARO} stroke="none" />
      <rect x="55" y="51" width="20" height="6" rx="3" fill={VERDE} stroke="none" />
      <rect x="55" y="67" width="22" height="6" rx="3" fill={VERDE_CLARO} stroke="none" />
      <rect x="55" y="67" width="11" height="6" rx="3" fill={VERDE} stroke="none" />
      <path d="M96 22l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill={VERDE} />
    </Svg>
  );
}

/** Troféu com confetes */
export function IlustracaoTrofeu({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M42 18h36v18a18 18 0 0 1-36 0z" fill={VERDE} />
      <path d="M42 24H32a8 8 0 0 0 10 14M78 24h10a8 8 0 0 1-10 14" />
      <path d="M60 54v12M48 80h24l-3-14H51z" fill={FUNDO} />
      <rect x="44" y="80" width="32" height="6" rx="2" fill={TRACO} stroke="none" />
      <path d="M60 26l2 4 4.4.6-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.6z" fill={FUNDO} stroke="none" />
      <path d="M22 16l4 4M98 14l-3 5M18 50h6M96 52h7M28 70l-4 3M92 70l4 3" stroke={VERDE} />
    </Svg>
  );
}

/** Calendário com etapas marcadas */
export function IlustracaoCronograma({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="20" y="18" width="80" height="66" rx="6" fill={FUNDO} />
      <path d="M20 34h80" />
      <rect x="20" y="18" width="80" height="16" rx="6" fill={VERDE} stroke="none" />
      <path d="M38 12v12M82 12v12" />
      <circle cx="40" cy="50" r="6" fill={VERDE} stroke="none" />
      <path d="M37 50l2 2 4-4" stroke={FUNDO} strokeWidth={2} />
      <circle cx="60" cy="50" r="6" fill={VERDE} stroke="none" />
      <path d="M57 50l2 2 4-4" stroke={FUNDO} strokeWidth={2} />
      <circle cx="80" cy="50" r="6" fill={VERDE_CLARO} stroke="none" />
      <circle cx="40" cy="70" r="6" fill={FUNDO} />
      <circle cx="60" cy="70" r="6" fill={FUNDO} />
      <circle cx="80" cy="70" r="6" fill={FUNDO} />
    </Svg>
  );
}

/** Notebook recebendo propostas */
export function IlustracaoProposta({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="44" y="8" width="34" height="42" rx="2" fill={TRACO} stroke="none" />
      <rect x="50" y="14" width="34" height="42" rx="2" fill={VERDE} stroke="none" />
      <rect x="56" y="20" width="34" height="42" rx="2" fill={FUNDO} />
      <path d="M62 30h22M62 37h22M62 44h14" />
      <path d="M24 62h72v18H24z" fill={FUNDO} />
      <path d="M14 80h92l-6 8H20z" fill={VERDE_CLARO} />
      <circle cx="60" cy="84" r="1.5" fill={TRACO} stroke="none" />
    </Svg>
  );
}

/** Envelope com sino de notificação */
export function IlustracaoAviso({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="16" y="34" width="66" height="46" rx="4" fill={FUNDO} />
      <path d="M16 38l33 22 33-22" />
      <circle cx="86" cy="30" r="16" fill={VERDE} />
      <path d="M80 34v-5a6 6 0 0 1 12 0v5l2 3H78zM84 40a2 2 0 0 0 4 0" stroke={FUNDO} />
      <path d="M26 88h14M48 88h24" stroke={VERDE} />
    </Svg>
  );
}

/** Caixa vazia com brilho: "tudo em dia" */
export function IlustracaoTudoEmDia({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M24 46l36-16 36 16-36 16z" fill={VERDE_CLARO} />
      <path d="M24 46v28l36 16V62zM96 46v28L60 90V62z" fill={FUNDO} />
      <path d="M48 70l6 6 12-12" stroke={VERDE} strokeWidth={3.5} />
      <path d="M60 10v8M42 16l4 6M78 16l-4 6" stroke={VERDE} />
    </Svg>
  );
}
