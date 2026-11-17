"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { formatarDataBrasilia, hackathons as hackathonsApi, type HackathonResponse } from "@/lib/api";
import {
  avaliadorApi,
  ehNaoEncontrado,
  formatarDecimal,
  type AvaliacaoResp,
  type PropostaParaAvaliacao,
} from "@/lib/api-avaliacao";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Propostas designadas ao avaliador logado (Comitê Científico; DEV só vê o que foi designado a ele).
 * A equipe autora não é exibida (a API não a envia).
 */

type Item = { proposta: PropostaParaAvaliacao; avaliacao: AvaliacaoResp | null };

function Situacao({ avaliacao }: { avaliacao: AvaliacaoResp | null }) {
  const [txt, cls] = !avaliacao
    ? ["Não iniciada", "bg-gray-50 border-gray-300 text-gray-600"]
    : avaliacao.status === "ENVIADA"
      ? [`Enviada · nota ${formatarDecimal(avaliacao.nota_final)}`, "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"]
      : ["Rascunho", "bg-amber-500/10 border-amber-500/30 text-amber-700"];
  return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border whitespace-nowrap ${cls}`}>{txt}</span>;
}

/** Propostas designadas + a situação da minha avaliação em cada uma (404 = não iniciada). */
async function buscarItens(): Promise<[HackathonResponse[], Item[]]> {
  const [propostas, lst] = await Promise.all([
    avaliadorApi.propostas(),
    hackathonsApi.listar().catch(() => [] as HackathonResponse[]),
  ]);
  const itens = await Promise.all(
    propostas.map(async (proposta) => ({
      proposta,
      avaliacao: await avaliadorApi.avaliacao(proposta.id).catch((e) => {
        if (ehNaoEncontrado(e)) return null;
        throw e;
      }),
    }))
  );
  return [lst, itens];
}

export default function AvaliadorPage() {
  const { pronto } = useSession(["COMITE_CIENTIFICO"]);

  const [itens, setItens] = useState<Item[]>([]);
  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<unknown>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!pronto) return;
    buscarItens()
      .then(([lst, novos]) => {
        setEdicoes(lst);
        setItens(novos);
        setErro(null);
      })
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [pronto, tentativa]);

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  const contagem = useMemo(
    () => ({
      enviadas: itens.filter((i) => i.avaliacao?.status === "ENVIADA").length,
      rascunhos: itens.filter((i) => i.avaliacao?.status === "RASCUNHO").length,
      pendentes: itens.filter((i) => !i.avaliacao).length,
    }),
    [itens]
  );

  const nomeEdicao = (id: string) => edicoes.find((h) => h.id === id)?.nome || "Edição";

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Minhas Avaliações</h1>
          <p className="text-xs text-gray-600">
            Propostas designadas a você pelo Organizador. Dê as notas por critério da rubrica, escreva o parecer e
            envie. Depois de enviada, a avaliação não pode ser alterada.
          </p>
        </div>

        {erro !== null && <ApiErrorAlert erro={erro} onRetry={recarregar} />}

        {!carregando && itens.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Não iniciadas", contagem.pendentes, "text-gray-700"],
              ["Rascunhos", contagem.rascunhos, "text-amber-700"],
              ["Enviadas", contagem.enviadas, "text-emerald-700"],
            ].map(([rotulo, n, cor]) => (
              <div key={rotulo} className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${cor}`}>{n}</p>
                <p className="text-[10px] uppercase text-gray-500 font-semibold">{rotulo}</p>
              </div>
            ))}
          </div>
        )}

        {carregando ? (
          <p className="text-emerald-700 text-xs font-mono">Carregando propostas...</p>
        ) : itens.length === 0 && erro === null ? (
          <p className="text-xs text-gray-600 bg-[#F6F9F8] border border-gray-200 rounded-lg p-3">
            Nenhuma proposta foi designada a você ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {itens.map(({ proposta: p, avaliacao }) => (
              <li key={p.id}>
                <Link
                  href={`/avaliador/${p.id}`}
                  className="flex items-center gap-4 bg-[#F6F9F8] border border-emerald-100 hover:border-emerald-500/50 rounded-xl p-4 transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.titulo || "Proposta sem título"}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {nomeEdicao(p.hackathon_id)}
                      {p.enviado_em ? ` · enviada em ${formatarDataBrasilia(p.enviado_em)}` : ""}
                    </p>
                  </div>
                  <Situacao avaliacao={avaliacao} />
                  <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
