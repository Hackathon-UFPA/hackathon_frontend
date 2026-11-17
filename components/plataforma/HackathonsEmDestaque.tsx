"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { hackathons, type HackathonResponse } from "@/lib/api";
import HackathonCard from "./HackathonCard";
import { PAINEL_SECAO } from "./painel";

// Inscrições abertas primeiro, depois os em andamento; no máximo 6 na home.
const ORDEM: Record<string, number> = { INSCRICOES: 0, ATIVO: 1, INSCRICOES_ENCERRADAS: 2, EM_AVALIACAO: 3, FINALIZADO: 4, CANCELADO: 5 };

export default function HackathonsEmDestaque() {
  const [lista, setLista] = useState<HackathonResponse[] | null>(null);

  useEffect(() => {
    hackathons
      .listar()
      .then((l) =>
        setLista(
          l
            .filter((h) => h.status !== "CANCELADO")
            .sort((a, b) => (ORDEM[a.status ?? ""] ?? 9) - (ORDEM[b.status ?? ""] ?? 9))
            .slice(0, 6)
        )
      )
      .catch(() => setLista([]));
  }, []);

  return (
    <section id="hackathons" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6">
      <div className={PAINEL_SECAO}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Hackathons na plataforma</h2>
          <p className="mt-2 text-sm text-gray-600">Inscrições abertas e eventos em andamento.</p>
        </div>
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:border-emerald-600 hover:bg-emerald-50"
        >
          Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {lista === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-50" />)}
        </div>
      ) : lista.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-[#F6F9F8] p-6 text-sm text-gray-600">
          Ainda não há hackathons publicados. Que tal{" "}
          <Link href="/login?aba=organizacao" className="text-emerald-700 hover:underline">organizar o primeiro</Link>?
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((h) => <HackathonCard key={h.id} hackathon={h} />)}
        </div>
      )}
      </div>
    </section>
  );
}
