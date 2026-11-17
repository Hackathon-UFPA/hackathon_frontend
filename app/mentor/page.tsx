"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, CalendarDays, Handshake, RefreshCw, Users } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { btnSecundario, dataHora } from "@/components/mentores/ui";
import { hackathons as hackathonsApi, type HackathonResponse } from "@/lib/api";
import { mentoria, type EquipeAcompanhada } from "@/lib/api-mentores";
import { useSession } from "@/lib/useSession";
import { COR_STATUS, ROTULO_STATUS, periodo } from "@/components/plataforma/hackathon-util";

/** Painel do mentor: equipes que ele acompanha, agrupadas por hackathon. */
export default function MentorPage() {
  const { user, pronto } = useSession(["MENTOR"]);
  const [equipes, setEquipes] = useState<EquipeAcompanhada[] | null>(null);
  const [incluirEncerradas, setIncluirEncerradas] = useState(false);
  const [hackathons, setHackathons] = useState<Record<string, HackathonResponse | null>>({});
  const [erro, setErro] = useState<unknown>(null);

  const carregar = useCallback(
    () =>
      mentoria
        .minhasEquipes({ apenas_vigentes: !incluirEncerradas, limite: 100 })
        .then(async (lista) => {
          setEquipes(lista);
          const ids = [...new Set(lista.map((e) => e.atribuicao.hackathon_id))];
          const pares = await Promise.all(
            ids.map(async (id) => [id, await hackathonsApi.obter(id).catch(() => null)] as const)
          );
          setHackathons(Object.fromEntries(pares));
        })
        .catch((e: unknown) => {
          setErro(e);
          setEquipes([]);
        }),
    [incluirEncerradas]
  );

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, EquipeAcompanhada[]>();
    for (const e of equipes ?? []) {
      const id = e.atribuicao.hackathon_id;
      mapa.set(id, [...(mapa.get(id) ?? []), e]);
    }
    return [...mapa.entries()];
  }, [equipes]);

  if (!pronto || !user) return null;

  const vigentes = (equipes ?? []).filter((e) => !e.atribuicao.encerrada_em).length;
  const primeiroNome = (user.nome ?? "").split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
            <Handshake className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Painel do mentor</p>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              {primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
              <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
              {[user.empresa_parceira, user.area_atuacao].filter(Boolean).join(" · ") || "Mentor"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-extrabold text-gray-900">{equipes ? vigentes : "—"}</p>
            <p className="text-xs text-gray-500">{vigentes === 1 ? "equipe acompanhada" : "equipes acompanhadas"}</p>
          </div>
          <button type="button" onClick={() => carregar()} className={btnSecundario}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">Suas equipes</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={incluirEncerradas}
            onChange={(e) => setIncluirEncerradas(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Mostrar mentorias encerradas
        </label>
      </div>

      {erro !== null && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onRetry={() => { setErro(null); carregar(); }} onClose={() => setErro(null)} />
        </div>
      )}

      {equipes === null ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : equipes.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <Users className="mx-auto h-12 w-12 text-emerald-300" aria-hidden="true" />
          <p className="mt-3 text-lg font-bold text-gray-900">Nenhuma equipe por enquanto</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
            Quando a organização atribuir uma equipe a você, ela aparece aqui e você recebe um aviso em{" "}
            <Link href="/notificacoes" className="font-semibold text-emerald-700 hover:underline">notificações</Link> e por e-mail.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {grupos.map(([hackathonId, itens]) => {
            const h = hackathons[hackathonId];
            const quando = h ? periodo(h.data_inicio, h.data_fim) : null;
            return (
              <section key={hackathonId} aria-label={h?.nome ?? "Hackathon"}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {h ? (
                    <Link href={`/hackathons/${hackathonId}`} className="text-base font-bold text-gray-900 hover:text-emerald-700">
                      {h.nome || "Hackathon"}
                    </Link>
                  ) : (
                    <span className="text-base font-bold text-gray-900">Hackathon</span>
                  )}
                  {h?.status && (
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${COR_STATUS[h.status]}`}>
                      {ROTULO_STATUS[h.status]}
                    </span>
                  )}
                  {quando && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {quando}
                    </span>
                  )}
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {itens.map(({ atribuicao: a, equipe_nome }) => (
                    <li
                      key={a.id}
                      className={`rounded-2xl border bg-white p-5 ${a.encerrada_em ? "border-gray-200 opacity-75" : "border-emerald-100"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-bold text-gray-900">{equipe_nome || "Equipe sem nome"}</p>
                        {a.encerrada_em ? (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">Encerrada</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Em andamento</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Mentoria desde {dataHora(a.atribuido_em)}</p>
                      {a.encerrada_em && <p className="text-xs text-gray-500">Encerrada em {dataHora(a.encerrada_em)}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
