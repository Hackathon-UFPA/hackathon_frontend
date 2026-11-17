"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Accessibility,
  Contrast,
  Link2,
  PauseCircle,
  RotateCcw,
  Space,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Painel de acessibilidade. Cada opção vira uma classe no <html> (estilos em app/globals.css)
 * e fica salva neste navegador. O script em app/layout.tsx reaplica as classes antes da página
 * aparecer, para não piscar.
 */

export const CHAVE_ACESSIBILIDADE = "hk_acessibilidade";

type Preferencias = {
  contraste: boolean;
  semAnimacao: boolean;
  destacarLinks: boolean;
  espacamento: boolean;
  texto: 0 | 1 | 2; // normal, grande, muito grande
};

const PADRAO: Preferencias = {
  contraste: false,
  semAnimacao: false,
  destacarLinks: false,
  espacamento: false,
  texto: 0,
};

// Classe aplicada no <html> para cada opção ligada
const CLASSES = {
  contraste: "high-contrast",
  semAnimacao: "sem-animacao",
  destacarLinks: "destacar-links",
  espacamento: "espacamento-texto",
} as const;
const CLASSES_TEXTO = ["", "texto-grande", "texto-muito-grande"] as const;

const OPCOES: { chave: keyof typeof CLASSES; rotulo: string; descricao: string; icone: LucideIcon }[] = [
  { chave: "contraste", rotulo: "Alto contraste", descricao: "Texto preto e bordas mais fortes", icone: Contrast },
  { chave: "semAnimacao", rotulo: "Pausar animações", descricao: "Para o fundo animado e as transições", icone: PauseCircle },
  { chave: "destacarLinks", rotulo: "Destacar links", descricao: "Sublinha todos os links", icone: Link2 },
  { chave: "espacamento", rotulo: "Espaçar o texto", descricao: "Mais espaço entre letras e linhas", icone: Space },
];

const TAMANHOS = [
  { rotulo: "A", nome: "Normal" },
  { rotulo: "A+", nome: "Grande" },
  { rotulo: "A++", nome: "Muito grande" },
] as const;

function ler(): Preferencias {
  try {
    const salvo = window.localStorage.getItem(CHAVE_ACESSIBILIDADE);
    return salvo ? { ...PADRAO, ...JSON.parse(salvo) } : PADRAO;
  } catch {
    return PADRAO;
  }
}

function aplicar(p: Preferencias) {
  const html = document.documentElement;
  for (const [chave, classe] of Object.entries(CLASSES)) {
    html.classList.toggle(classe, Boolean(p[chave as keyof typeof CLASSES]));
  }
  CLASSES_TEXTO.forEach((classe, i) => classe && html.classList.toggle(classe, p.texto === i));
}

function Chave({ ligada }: { ligada: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        ligada ? "bg-emerald-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          ligada ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </span>
  );
}

export default function AccessibilityBar() {
  // O painel começa fechado, então ler o navegador já no estado inicial não muda o HTML do
  // servidor (nada que depende das preferências aparece com o painel fechado).
  const [prefs, setPrefs] = useState<Preferencias>(() =>
    typeof window === "undefined" ? PADRAO : ler()
  );
  const [aberto, setAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    aplicar(prefs);
    try {
      window.localStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify(prefs));
    } catch {
      /* armazenamento indisponível: vale só nesta visita */
    }
  }, [prefs]);

  const fechar = useCallback(() => {
    setAberto(false);
    botaoRef.current?.focus();
  }, []);

  // Fecha com Esc e com clique fora
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!painelRef.current?.contains(alvo) && !botaoRef.current?.contains(alvo)) setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    painelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [aberto, fechar]);

  const alterado = JSON.stringify(prefs) !== JSON.stringify(PADRAO);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {aberto && (
        <div
          ref={painelRef}
          role="dialog"
          aria-label="Opções de acessibilidade"
          className="entrar absolute bottom-16 right-0 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_50px_-12px_rgba(6,78,59,0.3)]"
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-50/60 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Accessibility className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              Acessibilidade
            </h2>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar opções de acessibilidade"
              className="rounded-md p-1 text-gray-500 hover:bg-white hover:text-gray-900 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            {/* Tamanho do texto */}
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Type className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Tamanho do texto
              </p>
              <div role="radiogroup" aria-label="Tamanho do texto" className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
                {TAMANHOS.map((t, i) => (
                  <button
                    key={t.nome}
                    type="button"
                    role="radio"
                    aria-checked={prefs.texto === i}
                    aria-label={t.nome}
                    onClick={() => setPrefs({ ...prefs, texto: i as Preferencias["texto"] })}
                    className={`rounded-md py-1.5 font-bold transition-colors cursor-pointer ${
                      ["text-xs", "text-sm", "text-base"][i]
                    } ${prefs.texto === i ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {t.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {/* Liga/desliga */}
            <ul className="space-y-1">
              {OPCOES.map(({ chave, rotulo, descricao, icone: Icone }) => (
                <li key={chave}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[chave]}
                    onClick={() => setPrefs({ ...prefs, [chave]: !prefs[chave] })}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50 cursor-pointer"
                  >
                    <Icone className={`h-4 w-4 shrink-0 ${prefs[chave] ? "text-emerald-700" : "text-gray-400"}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{rotulo}</span>
                      <span className="block text-xs text-gray-500">{descricao}</span>
                    </span>
                    <Chave ligada={prefs[chave]} />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setPrefs(PADRAO)}
              disabled={!alterado}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-default disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restaurar padrão
            </button>
          </div>
        </div>
      )}

      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label="Opções de acessibilidade"
        title="Acessibilidade"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_8px_24px_-6px_rgba(5,150,105,0.6)] ring-4 ring-white transition-transform hover:scale-105 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-emerald-300 cursor-pointer"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}
