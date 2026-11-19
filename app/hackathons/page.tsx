"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import HackathonCard from "@/components/plataforma/HackathonCard";
import FundoAnimado from "@/components/plataforma/FundoAnimado";
import { ROTULO_STATUS } from "@/components/plataforma/hackathon-util";
import { hackathons as api, type HackathonResponse, type StatusHackathon } from "@/lib/api";

type Filtro = "TODOS" | StatusHackathon;
const FILTROS: Filtro[] = ["TODOS", "INSCRICOES", "ATIVO", "EM_AVALIACAO", "FINALIZADO"];

function ListaHackathons() {
  const organizacaoId = useSearchParams().get("organizacao_id") ?? undefined;
  const [lista, setLista] = useState<HackathonResponse[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");

  useEffect(() => {
    api
      .listar(organizacaoId)
      .then(setLista)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [organizacaoId]);

  const nomeDaOrganizacao = organizacaoId ? lista?.[0]?.organizacao_nome : null;

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (lista ?? []).filter(
      (h) =>
        (filtro === "TODOS" || h.status === filtro) &&
        (!termo ||
          [h.nome, h.tema, h.organizacao_nome, h.local].some((v) =>
            v?.toLowerCase().includes(termo)
          ))
    );
  }, [lista, busca, filtro]);

  return (
    <main className="relative min-h-screen px-4 py-10 text-gray-700 sm:px-6">
      <FundoAnimado intensidade="suave" trechos={false} />
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {nomeDaOrganizacao ? `Hackathons de ${nomeDaOrganizacao}` : "Hackathons"}
        </h1>
        {organizacaoId && (
          <Link href="/hackathons" className="mt-1 inline-block text-sm font-semibold text-emerald-700 hover:underline">
            Ver de todas as organizações
          </Link>
        )}
        <p className="mt-2 text-sm text-gray-600">
          Eventos de empresas e instituições de ensino. Escolha um, forme sua equipe e participe.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, tema, organização ou local"
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filtro === f
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:text-white"
                }`}
              >
                {f === "TODOS" ? "Todos" : ROTULO_STATUS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
          {lista === null && !erro ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-50" />
              ))}
            </div>
          ) : visiveis.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              {lista?.length ? "Nenhum hackathon com esses filtros." : "Ainda não há hackathons publicados."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiveis.map((h) => (
                <HackathonCard key={h.id} hackathon={h} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function HackathonsPage() {
  return (
    <Suspense fallback={null}>
      <ListaHackathons />
    </Suspense>
  );
}
