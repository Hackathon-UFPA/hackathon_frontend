"use client";

import { useState, useEffect } from "react";

export default function AccessibilityBar() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Aplica/Remove classe de Alto Contraste na tag HTML
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    // Aplica/Remove classe de Fonte Grande na tag HTML
    if (largeText) {
      document.documentElement.classList.add("large-text");
    } else {
      document.documentElement.classList.remove("large-text");
    }
  }, [largeText]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" aria-label="Painel de Acessibilidade">
      {/* Botão Flutuante de Acessibilidade */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Abrir opções de acessibilidade"
        className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105 transition-transform border-2 border-emerald-300"
      >
        ♿
      </button>

      {/* Popover com Opções */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-[#131D1C] border border-emerald-500/30 p-4 rounded-xl shadow-2xl w-64 backdrop-blur-xl text-white space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="font-bold text-sm text-emerald-400">Acessibilidade</h3>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-xs text-gray-400 hover:text-white"
              aria-label="Fechar painel de acessibilidade"
            >
              ✕
            </button>
          </div>

          {/* Toggle Alto Contraste */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            aria-pressed={highContrast}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex justify-between items-center border transition-all ${
              highContrast 
                ? "bg-yellow-400 text-black border-yellow-300 font-bold" 
                : "bg-black/40 text-gray-300 border-white/10 hover:border-emerald-500"
            }`}
          >
            <span>Alto Contraste</span>
            <span>{highContrast ? "ON" : "OFF"}</span>
          </button>

          {/* Toggle Fonte Ampliada */}
          <button
            onClick={() => setLargeText(!largeText)}
            aria-pressed={largeText}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex justify-between items-center border transition-all ${
              largeText 
                ? "bg-emerald-500 text-black border-emerald-300 font-bold" 
                : "bg-black/40 text-gray-300 border-white/10 hover:border-emerald-500"
            }`}
          >
            <span>Tamanho do Texto (+20%)</span>
            <span>{largeText ? "ON" : "OFF"}</span>
          </button>
        </div>
      )}
    </div>
  );
}