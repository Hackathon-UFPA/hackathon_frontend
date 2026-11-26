"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, Users } from "lucide-react";
import { dataHora } from "@/components/mentores/ui";
import { AcompanhamentoEquipe } from "@/components/mentoria/AcompanhamentoEquipe";
import { EstadoVazio } from "@/components/mentoria/CalendarioMarcos";
import { mentoresAdmin, mentoria, type Atribuicao, type EquipeAprovada, type Mentor } from "@/lib/api-mentores";
import { useSession } from "@/lib/useSession";

/** Gestão: entregas de uma equipe aprovada, com o mentor que a acompanha. */
function EntregasDaEquipe() {
  const { equipeId } = useParams<{ equipeId: string }>();
  const hackathonId = useSearchParams().get("hackathon_id") ?? "";
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const [equipe, setEquipe] = useState<EquipeAprovada | null>(null);
  const [atual, setAtual] = useState<Atribuicao | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    if (!pronto || !user || !hackathonId) return;
    mentoria
      .equipesAprovadas(hackathonId)
      .then((r) => setEquipe(r.equipes.find((e) => e.equipe_id === equipeId) ?? null))
      .catch(() => setEquipe(null));
    mentoria
      .atual(equipeId)
      .then((a) => {
        setAtual(a);
        if (a) mentoresAdmin.obter(a.mentor_id).then(setMentor).catch(() => setMentor(null));
      })
      .catch(() => setAtual(null));
  }, [pronto, user, equipeId, hackathonId]);

  if (!pronto || !user) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/admin/mentoria${hackathonId ? `?hackathon_id=${hackathonId}` : ""}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Mentoria das equipes
      </Link>

      {!hackathonId ? (
        <div className="mt-4">
          <EstadoVazio icone={CalendarClock} titulo="Abra a equipe pela lista de mentoria">
            Falta saber de qual hackathon é a equipe. Volte para Mentoria das equipes e use o botão de entregas na linha
            da equipe.
          </EstadoVazio>
        </div>
      ) : (
        <>
          <header className="mt-3 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8">
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{equipe?.equipe_nome || "Equipe"}</h1>
            {(equipe?.titulo || equipe?.tema_titulo) && (
              <p className="mt-1 text-sm text-gray-600">{[equipe.titulo, equipe.tema_titulo].filter(Boolean).join(" · ")}</p>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {atual
                ? `Mentor: ${mentor?.nome || mentor?.email || "carregando..."} · desde ${dataHora(atual.atribuido_em)}`
                : "Equipe sem mentor no momento."}
            </p>
          </header>
          <div className="mt-6">
            <AcompanhamentoEquipe
              equipeId={equipeId}
              hackathonId={hackathonId}
              textoSemAcesso="Só o Comitê Científico e a organização dona desta edição veem as entregas das equipes."
            />
          </div>
        </>
      )}
    </main>
  );
}

export default function EntregasDaEquipePage() {
  return (
    <Suspense fallback={null}>
      <EntregasDaEquipe />
    </Suspense>
  );
}
