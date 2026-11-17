"use client";

import { useEffect, useState } from "react";
import { Briefcase, GraduationCap, Mail } from "lucide-react";
import { formatarDataBrasilia } from "@/lib/api";
import { equipeParticipante, type MentorDaEquipe } from "@/lib/api-participante";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/** RF38: contato e situação do mentor da equipe (GET /equipes/{id}/mentor). */
export function MentorEquipe({ equipeId }: { equipeId: string }) {
  const [mentor, setMentor] = useState<MentorDaEquipe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
    equipeParticipante
      .mentor(equipeId)
      .then(setMentor)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [equipeId]);

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <GraduationCap className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-gray-900">Mentor da equipe</h2>
          <p className="text-xs text-gray-600">Quem acompanha a equipe durante o hackathon.</p>
        </div>
      </div>

      {carregando ? (
        <p className="text-xs text-emerald-700">Carregando...</p>
      ) : erro !== null ? (
        <ApiErrorAlert erro={erro} />
      ) : !mentor ? (
        <p className="rounded-xl border border-gray-200 bg-[#F6F9F8] p-4 text-xs text-gray-600">
          Sua equipe ainda não tem mentor. A organização faz a atribuição e você recebe uma notificação
          quando isso acontecer.
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-[#F6F9F8] p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{mentor.mentor.nome || mentor.mentor.email}</p>
            {!mentor.mentor.ativo && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                Mentor desativado
              </span>
            )}
          </div>
          <a
            href={`mailto:${mentor.mentor.email}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <Mail className="h-3.5 w-3.5" /> {mentor.mentor.email}
          </a>
          {(mentor.mentor.empresa_parceira || mentor.mentor.area_atuacao) && (
            <p className="flex items-center gap-1.5 text-xs text-gray-700">
              <Briefcase className="h-3.5 w-3.5 text-gray-500" />
              {[mentor.mentor.empresa_parceira, mentor.mentor.area_atuacao].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="text-[11px] text-gray-500">Desde {formatarDataBrasilia(mentor.atribuido_em)}</p>
          {!mentor.mentor.ativo && (
            <p className="text-[11px] text-amber-800">
              Este mentor foi desativado pela organização. Aguarde a indicação de um substituto.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
