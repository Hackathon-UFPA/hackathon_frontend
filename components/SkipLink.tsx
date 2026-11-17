"use client";

/** Primeiro item do teclado em toda página: pula a navegação e leva ao <main> (WCAG 2.4.1). */
export default function SkipLink() {
  return (
    <a
      href="#conteudo"
      onClick={(e) => {
        const main = document.querySelector("main");
        if (!main) return;
        e.preventDefault();
        main.tabIndex = -1;
        main.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-emerald-400 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-black"
    >
      Pular para o conteúdo
    </a>
  );
}
