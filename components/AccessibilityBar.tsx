"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Accessibility, Contrast, Type, X, type LucideIcon } from "lucide-react";
import {
  alternarPreferencia,
  assinarPreferencias,
  preferenciaAtiva,
  sincronizarPreferencias,
  type PreferenciaAcessibilidade,
} from "@/lib/acessibilidade";

const NOMES: Record<PreferenciaAcessibilidade, string> = {
  contraste: "Alto contraste",
  fonte: "Fonte ampliada em 20%",
};

// e.code identifica a tecla física: no macOS, Option muda a letra que chega em e.key.
const ATALHOS: Record<string, PreferenciaAcessibilidade> = {
  KeyC: "contraste",
  KeyF: "fonte",
};

function usePreferencia(p: PreferenciaAcessibilidade) {
  return useSyncExternalStore(
    assinarPreferencias,
    () => preferenciaAtiva(p),
    () => false
  );
}

function Opcao({
  preferencia,
  rotulo,
  atalho,
  Icone,
  onAlternar,
}: {
  preferencia: PreferenciaAcessibilidade;
  rotulo: string;
  atalho: string;
  Icone: LucideIcon;
  onAlternar: (p: PreferenciaAcessibilidade) => void;
}) {
  const ativa = usePreferencia(preferencia);

  return (
    <button
      type="button"
      onClick={() => onAlternar(preferencia)}
      aria-pressed={ativa}
      aria-keyshortcuts={atalho.replaceAll(" ", "")}
      className={`w-full rounded-xl border p-3 text-left transition-colors cursor-pointer ${
        ativa
          ? "border-emerald-400 bg-emerald-400/10 text-white"
          : "border-white/10 bg-black/30 text-gray-300 hover:border-emerald-500/50"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icone className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span className="flex-1">{rotulo}</span>
        <span className="font-mono text-xs uppercase">{ativa ? "Ligado" : "Desligado"}</span>
      </span>
      <kbd className="mt-2 block font-mono text-xs text-gray-400">{atalho}</kbd>
    </button>
  );
}

export default function AccessibilityBar() {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const botaoRef = useRef<HTMLButtonElement>(null);

  const alternar = (p: PreferenciaAcessibilidade) => {
    const ativa = alternarPreferencia(p);
    setAviso(`${NOMES[p]} ${ativa ? "ativado" : "desativado"}.`);
  };

  useLayoutEffect(() => {
    sincronizarPreferencias();
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      // Ctrl+Alt é o AltGr no Windows: precisa continuar digitando símbolos normalmente.
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const preferencia = ATALHOS[e.code];
      if (!preferencia) return;
      e.preventDefault();
      setAviso(
        `${NOMES[preferencia]} ${alternarPreferencia(preferencia) ? "ativado" : "desativado"}.`
      );
    };
    const aoMudarOutraAba = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("hk_a11y_")) sincronizarPreferencias();
    };

    window.addEventListener("keydown", aoTeclar);
    window.addEventListener("storage", aoMudarOutraAba);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("storage", aoMudarOutraAba);
    };
  }, []);

  const fechar = () => {
    setAberto(false);
    botaoRef.current?.focus();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <p className="sr-only" role="status" aria-live="polite">
        {aviso}
      </p>

      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="painel-acessibilidade"
        aria-label={aberto ? "Fechar opções de acessibilidade" : "Abrir opções de acessibilidade"}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-transform hover:scale-105 cursor-pointer"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>

      {aberto && (
        <div
          id="painel-acessibilidade"
          role="group"
          aria-labelledby="titulo-acessibilidade"
          onKeyDown={(e) => {
            if (e.key === "Escape") fechar();
          }}
          className="absolute bottom-16 right-0 w-72 max-w-[calc(100vw-3rem)] space-y-3 rounded-2xl border border-white/10 bg-[#131D1C]/95 p-5 text-white shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="titulo-acessibilidade"
              className="text-base font-extrabold tracking-tight"
            >
              Acessibilidade
            </h2>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar painel de acessibilidade"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <Opcao
            preferencia="contraste"
            rotulo="Alto contraste"
            atalho="Alt + Shift + C"
            Icone={Contrast}
            onAlternar={alternar}
          />
          <Opcao
            preferencia="fonte"
            rotulo="Fonte +20%"
            atalho="Alt + Shift + F"
            Icone={Type}
            onAlternar={alternar}
          />
        </div>
      )}
    </div>
  );
}
