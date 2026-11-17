"use client";

import { useEffect, useRef, useState } from "react";

/** Número que conta de 0 até `valor` quando entra na tela. Sem animação para quem pediu menos
 * movimento (preferência do sistema ou opção do painel de acessibilidade). */
export default function ContadorAnimado({ valor, duracao = 1400 }: { valor: number; duracao?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const semMovimento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("sem-animacao");
    let quadro = 0;
    const obs = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      obs.disconnect();
      if (semMovimento) {
        quadro = requestAnimationFrame(() => setAtual(valor));
        return;
      }
      const inicio = performance.now();
      const passo = (agora: number) => {
        const t = Math.min(1, (agora - inicio) / duracao);
        setAtual(Math.round(valor * (1 - Math.pow(1 - t, 3))));
        if (t < 1) quadro = requestAnimationFrame(passo);
      };
      quadro = requestAnimationFrame(passo);
    });
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [valor, duracao]);

  return (
    <span ref={ref} className="tabular-nums">
      {atual.toLocaleString("pt-BR")}
    </span>
  );
}
