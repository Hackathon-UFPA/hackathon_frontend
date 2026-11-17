"use client";

import { useState } from "react";
import type { ApoiadorPublico, ApoiadoresPorCategoria } from "@/lib/api-conteudo";

function Logo({ a }: { a: ApoiadorPublico }) {
  const [falhou, setFalhou] = useState(false);
  if (a.logo_url && !falhou) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo externo (link informado pela organização)
      <img src={a.logo_url} alt={a.nome} onError={() => setFalhou(true)} className="max-h-14 w-auto max-w-full object-contain" />
    );
  }
  return <span className="text-center text-sm font-bold text-gray-800">{a.nome}</span>;
}

/** Apoiadores publicados, por categoria; o logo leva ao site do apoiador. */
export default function ApoiadoresPublicos({ grupos }: { grupos: ApoiadoresPorCategoria[] }) {
  return (
    <div className="space-y-6">
      {grupos.map((g) => (
        <div key={g.categoria}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{g.categoria}</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {g.apoiadores.map((a, i) => {
              const caixa =
                "flex h-24 items-center justify-center rounded-2xl border border-gray-200 bg-white/90 p-4 transition-colors";
              return (
                <li key={`${a.nome}-${i}`}>
                  {a.site_url ? (
                    <a
                      href={a.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={a.nome}
                      aria-label={`${a.nome} (abre o site em nova aba)`}
                      className={`${caixa} hover:border-emerald-400 hover:shadow-sm`}
                    >
                      <Logo a={a} />
                    </a>
                  ) : (
                    <div className={caixa} title={a.nome}>
                      <Logo a={a} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
