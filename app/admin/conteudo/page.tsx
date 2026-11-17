"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarClock, ExternalLink, FileText, HeartHandshake, MessageCircleQuestion } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import AbaApoiadores from "@/components/conteudo/AbaApoiadores";
import AbaCronograma from "@/components/conteudo/AbaCronograma";
import AbaFaq from "@/components/conteudo/AbaFaq";
import { ROTULO_STATUS } from "@/components/plataforma/hackathon-util";
import { hackathons as hackathonsApi, type HackathonResponse } from "@/lib/api";
import { useSession } from "@/lib/useSession";

type Aba = "apoiadores" | "cronograma" | "faq";

const ABAS: { id: Aba; rotulo: string; icone: typeof FileText }[] = [
  { id: "apoiadores", rotulo: "Apoiadores", icone: HeartHandshake },
  { id: "cronograma", rotulo: "Cronograma", icone: CalendarClock },
  { id: "faq", rotulo: "Perguntas frequentes", icone: MessageCircleQuestion },
];

function ConteudoInstitucional() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const abaUrl = params.get("aba");
  const aba: Aba = ABAS.some((a) => a.id === abaUrl) ? (abaUrl as Aba) : "apoiadores";

  const [edicoes, setEdicoes] = useState<HackathonResponse[] | null>(null);
  const [hackathonId, setHackathonId] = useState(params.get("hackathon_id") ?? "");
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .daMinhaOrganizacao()
      .then((l) => {
        setEdicoes(l);
        setHackathonId((atual) => (atual && l.some((h) => h.id === atual) ? atual : l[0]?.id ?? ""));
      })
      .catch((e: unknown) => {
        setErro(e);
        setEdicoes([]);
      });
  }, [pronto]);

  const irPara = (novo: { aba?: Aba; hackathon_id?: string }) => {
    const q = new URLSearchParams(params.toString());
    if (novo.aba) q.set("aba", novo.aba);
    if (novo.hackathon_id !== undefined) q.set("hackathon_id", novo.hackathon_id);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  if (!pronto) return null;

  const selecionado = edicoes?.find((h) => h.id === hackathonId);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Página pública do hackathon</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Apoiadores, cronograma e perguntas frequentes que aparecem para quem visita a página do hackathon.
            Só o que estiver marcado como publicado fica visível para o público.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end lg:w-auto">
          <div className="min-w-0 sm:w-72">
            <label htmlFor="edicao" className="mb-1 block text-[11px] font-semibold uppercase text-gray-600">Hackathon</label>
            <select
              id="edicao"
              value={hackathonId}
              onChange={(e) => {
                setHackathonId(e.target.value);
                irPara({ hackathon_id: e.target.value });
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
            >
              {edicoes === null && <option value="">Carregando...</option>}
              {edicoes?.length === 0 && <option value="">Nenhum hackathon cadastrado</option>}
              {edicoes?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nome || "Sem nome"}
                  {h.status ? ` · ${ROTULO_STATUS[h.status]}` : ""}
                </option>
              ))}
            </select>
          </div>
          {hackathonId && (
            <Link
              href={`/hackathons/${hackathonId}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700"
            >
              Ver página <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {!!erro && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        </div>
      )}

      {selecionado?.status === "RASCUNHO" && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Este hackathon está em rascunho: a página pública só mostra o conteúdo depois que ele for divulgado.
        </p>
      )}

      {edicoes?.length === 0 && !erro ? (
        <div className="mt-6 rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center">
          <p className="text-lg font-bold text-gray-900">Nenhum hackathon ainda</p>
          <p className="mt-1 text-sm text-gray-600">Crie um hackathon para montar a página pública dele.</p>
          <Link href="/admin/hackathon?novo=1" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
            Criar hackathon
          </Link>
        </div>
      ) : (
        hackathonId && (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div role="tablist" aria-label="Conteúdo" className="inline-flex max-w-full overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
                {ABAS.map(({ id, rotulo, icone: Icone }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={aba === id}
                    onClick={() => irPara({ aba: id })}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                      aba === id ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icone className="h-4 w-4" aria-hidden="true" /> {rotulo}
                  </button>
                ))}
              </div>
              <Link
                href={`/admin/termos?hackathon_id=${hackathonId}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
              >
                <FileText className="h-4 w-4" aria-hidden="true" /> O regulamento é gerido em Regulamento e termos
              </Link>
            </div>

            <div className="mt-4" role="tabpanel">
              {aba === "apoiadores" && <AbaApoiadores key={hackathonId} hackathonId={hackathonId} />}
              {aba === "cronograma" && <AbaCronograma key={hackathonId} hackathonId={hackathonId} />}
              {aba === "faq" && <AbaFaq key={hackathonId} hackathonId={hackathonId} />}
            </div>
          </>
        )
      )}
    </main>
  );
}

export default function AdminConteudoPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoInstitucional />
    </Suspense>
  );
}
