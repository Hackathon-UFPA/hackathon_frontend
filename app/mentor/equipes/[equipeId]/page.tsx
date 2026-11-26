"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { dataHora } from "@/components/mentores/ui";
import { AcompanhamentoEquipe } from "@/components/mentoria/AcompanhamentoEquipe";
import { EstadoVazio } from "@/components/mentoria/CalendarioMarcos";
import { hackathons as hackathonsApi, type HackathonResponse } from "@/lib/api";
import { mentoria, type EquipeAcompanhada } from "@/lib/api-mentores";
import { useSession } from "@/lib/useSession";

/** Mentor: marcos e entregas de uma equipe que ele acompanha (RF39, RF40). */
export default function MentorEquipePage() {
  const { equipeId } = useParams<{ equipeId: string }>();
  const { user, pronto } = useSession(["MENTOR"]);
  const [item, setItem] = useState<EquipeAcompanhada | null | undefined>(undefined);
  const [hackathon, setHackathon] = useState<HackathonResponse | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
    if (!pronto || !user) return;
    mentoria
      .minhasEquipes({ apenas_vigentes: false, limite: 100 })
      .then((lista) => {
        const daEquipe = lista.filter((e) => e.atribuicao.equipe_id === equipeId);
        // Prefere a atribuição vigente; senão, a mais recente encerrada.
        const escolhido = daEquipe.find((e) => !e.atribuicao.encerrada_em) ?? daEquipe[0] ?? null;
        setItem(escolhido);
        if (escolhido) {
          hackathonsApi.obter(escolhido.atribuicao.hackathon_id).then(setHackathon).catch(() => setHackathon(null));
        }
      })
      .catch((e: unknown) => {
        setErro(e);
        setItem(null);
      });
  }, [pronto, user, equipeId]);

  if (!pronto || !user) return null;

  const a = item?.atribuicao;
  const encerrada = !!a?.encerrada_em;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/mentor" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Minhas equipes
      </Link>

      {erro !== null && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        </div>
      )}

      {item === undefined ? (
        <div className="mt-3 h-32 animate-pulse rounded-3xl bg-white" aria-busy="true" aria-label="Carregando equipe" />
      ) : item === null || !a ? (
        <div className="mt-4">
          <EstadoVazio icone={Users} titulo="Esta equipe não está na sua lista">
            Você só vê as entregas das equipes que a organização atribuiu a você.{" "}
            <Link href="/mentor" className="font-semibold text-emerald-700 hover:underline">
              Voltar para minhas equipes
            </Link>
          </EstadoVazio>
        </div>
      ) : (
        <>
          <header className="mt-3 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">{hackathon?.nome || "Hackathon"}</p>
                <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{item.equipe_nome || "Equipe sem nome"}</h1>
              </div>
              {encerrada ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600">Mentoria encerrada</span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">Em andamento</span>
              )}
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Você acompanha desde {dataHora(a.atribuido_em)}
              </span>
              {encerrada && <span>Encerrada em {dataHora(a.encerrada_em)}</span>}
            </p>
          </header>

          <div className="mt-6">
            {encerrada ? (
              <EstadoVazio icone={Users} titulo="Você não acompanha mais esta equipe">
                Quando a mentoria é encerrada ou passa para outro mentor, as entregas da equipe deixam de aparecer para você.
              </EstadoVazio>
            ) : (
              <AcompanhamentoEquipe
                equipeId={a.equipe_id}
                hackathonId={a.hackathon_id}
                textoSemAcesso="Sua conta não tem acesso às entregas desta equipe agora. Isso acontece quando a mentoria foi trocada ou encerrada há pouco. Volte para minhas equipes e abra a equipe de novo."
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
