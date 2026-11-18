"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Alterna entre o tema claro e o escuro. O tema vira a classe "dark" no <html> (estilos em
 * app/globals.css) e fica salvo neste navegador. Sem escolha salva, segue o sistema. O script
 * em app/layout.tsx aplica a classe antes da página aparecer, para não piscar.
 */

export const CHAVE_TEMA = "hk_tema";

// Lê a classe "dark" do <html> e reage quando ela muda (inclusive em outra instância do botão)
function observarTema(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observador.disconnect();
}
const temaEscuroAtual = () => document.documentElement.classList.contains("dark");
// No servidor não dá para saber o tema: null evita ícone divergente na hidratação
const temaNoServidor = () => null;

export default function AlternarTema({ className = "" }: { className?: string }) {
  const escuro = useSyncExternalStore(observarTema, temaEscuroAtual, temaNoServidor);

  const alternar = () => {
    const novo = !temaEscuroAtual();
    document.documentElement.classList.toggle("dark", novo);
    try {
      localStorage.setItem(CHAVE_TEMA, novo ? "escuro" : "claro");
    } catch {}
  };

  const rotulo = escuro ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      title={rotulo}
      aria-label={rotulo}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-emerald-400 hover:text-gray-900 ${className}`}
    >
      {escuro ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
