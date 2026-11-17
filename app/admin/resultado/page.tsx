"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  formatarDataBrasilia,
  hackathons as hackathonsApi,
  type HackathonResponse,
} from "@/lib/api";
import {
  formatarNota,
  resultadoAdmin,
  type ResultadoAvaliacao,
  type ResultadoProposta,
} from "@/lib/api-resultado";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Resultado da avaliação (RF31): Organizador ou DEV.
 * Mostra média, classificação e recomendações de cada proposta ENVIADA e permite
 * homologar escolhendo quais ficam aprovadas. A homologação é irreversível.
 */

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";
const btnGhost =
  "px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-[11px] rounded-lg text-gray-900 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

/** Classificadas primeiro (1, 2, 3…), sem nota no fim. */
function ordenar(lista: ResultadoProposta[]): ResultadoProposta[] {
  return [...lista].sort((a, b) => {
    const ca = a.classificacao ?? Number.POSITIVE_INFINITY;
    const cb = b.classificacao ?? Number.POSITIVE_INFINITY;
    if (ca !== cb) return ca - cb;
    return (a.equipe_nome ?? "").localeCompare(b.equipe_nome ?? "", "pt-BR");
  });
}

function ConteudoResultado() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const searchParams = useSearchParams();

  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [hackathonId, setHackathonId] = useState("");
  const [resultado, setResultado] = useState<ResultadoAvaliacao | null>(null);
  const [aprovadas, setAprovadas] = useState<Set<string>>(new Set());

  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [homologando, setHomologando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  // Edição inicial: a da URL, senão a que está em avaliação, senão a primeira.
  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .daMinhaOrganizacao()
      .then((lst) => {
        setEdicoes(lst);
        const daUrl = searchParams.get("hackathon_id");
        const alvo =
          lst.find((h) => h.id === daUrl) ??
          lst.find((h) => h.status === "EM_AVALIACAO") ??
          lst[0];
        setHackathonId(alvo?.id ?? "");
        if (!alvo) setCarregando(false);
      })
      .catch((e) => {
        setErro(e);
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  // Estado só nos callbacks da promise: o efeito abaixo chama esta função.
  const carregar = useCallback(() => {
    if (!hackathonId) return;
    resultadoAdmin
      .consultar(hackathonId)
      .then((r) => {
        setResultado(r);
        setAprovadas(new Set());
      })
      .catch((e) => {
        setResultado(null);
        setErro(e);
      })
      .finally(() => setCarregando(false));
  }, [hackathonId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    carregar();
  };

  const trocarEdicao = (novo: string) => {
    if (novo === hackathonId) return;
    setCarregando(true);
    setHackathonId(novo);
    setConfirmando(false);
    setMensagem(null);
    setErro(null);
  };

  const propostas = useMemo(() => ordenar(resultado?.propostas ?? []), [resultado]);
  const homologado = resultado?.homologado ?? false;

  const alternar = (submissaoId: string) => {
    setConfirmando(false);
    setAprovadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(submissaoId)) novo.delete(submissaoId);
      else novo.add(submissaoId);
      return novo;
    });
  };

  const homologar = async () => {
    if (!resultado) return;
    setHomologando(true);
    setErro(null);
    setMensagem(null);
    try {
      const r = await resultadoAdmin.homologar(hackathonId, [...aprovadas]);
      setResultado(r);
      setAprovadas(new Set());
      setConfirmando(false);
      setMensagem(
        `Resultado homologado: ${r.total_aprovadas ?? 0} de ${r.total_propostas} proposta(s) aprovada(s). As equipes foram notificadas na plataforma.`
      );
    } catch (e) {
      setErro(e);
      setConfirmando(false);
    } finally {
      setHomologando(false);
    }
  };

  if (!pronto) return null;

  const edicaoAtual = edicoes.find((h) => h.id === hackathonId);

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-5xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <Link href="/admin" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Resultado da Avaliação</h1>
          <p className="text-xs text-gray-600">
            Média das notas finais enviadas pelos avaliadores designados, classificação e recomendações.
            Você escolhe quais propostas ficam aprovadas; a homologação é{" "}
            <strong className="text-amber-700">definitiva</strong> e notifica as equipes.
          </p>
        </div>

        {mensagem && (
          <div
            role="status"
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs"
          >
            {mensagem}
          </div>
        )}
        {erro !== null && (
          <ApiErrorAlert erro={erro} onRetry={hackathonId ? recarregar : undefined} onClose={() => setErro(null)} />
        )}

        <div>
          <label className={lbl} htmlFor="sel-edicao-resultado">
            Edição
          </label>
          <select
            id="sel-edicao-resultado"
            className={inp}
            value={hackathonId}
            onChange={(e) => trocarEdicao(e.target.value)}
          >
            {edicoes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome || "Sem nome"} ({h.status ?? "—"})
              </option>
            ))}
          </select>
        </div>

        {carregando ? (
          <p className="text-emerald-700 text-xs font-mono">Carregando resultado...</p>
        ) : !resultado ? (
          !erro && (
            <p className="text-xs text-gray-600">Nenhuma edição cadastrada.</p>
          )
        ) : (
          <>
            {/* Resumo */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Resumo rotulo="Propostas enviadas" valor={String(resultado.total_propostas)} />
              <Resumo
                rotulo="Avaliadores por proposta"
                valor={resultado.avaliadores_por_proposta != null ? String(resultado.avaliadores_por_proposta) : "—"}
              />
              <Resumo
                rotulo="Situação"
                valor={homologado ? "Homologado" : resultado.pode_homologar ? "Pronto" : "Pendente"}
                destaque={homologado ? "emerald" : resultado.pode_homologar ? "emerald" : "amber"}
              />
              <Resumo
                rotulo="Aprovadas"
                valor={homologado ? String(resultado.total_aprovadas ?? 0) : `${aprovadas.size} marcada(s)`}
              />
            </section>

            {homologado && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 space-y-1">
                <p className="font-bold text-emerald-700">Resultado oficial homologado</p>
                <p>
                  Por <strong>{resultado.homologado_por_nome || "—"}</strong> em{" "}
                  {formatarDataBrasilia(resultado.homologado_em)}. O resultado não pode mais ser alterado.
                </p>
                <Link
                  href={`/hackathons/${resultado.hackathon_id}/aprovadas`}
                  className="inline-block font-semibold text-emerald-700 hover:text-emerald-700 underline"
                >
                  Ver página pública das propostas aprovadas
                </Link>
              </div>
            )}

            {!homologado && resultado.pendencias.length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 space-y-2">
                <p className="font-bold text-amber-800">
                  O que ainda impede a homologação ({resultado.pendencias.length})
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {resultado.pendencias.map((p, i) => (
                    <li key={`${p.codigo}-${p.submissao_id ?? i}`}>{p.mensagem}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ranking */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900">Ranking das propostas ({propostas.length})</h2>
                {!homologado && propostas.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setConfirmando(false);
                        setAprovadas(new Set(propostas.map((p) => p.submissao_id)));
                      }}
                    >
                      Marcar todas
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setConfirmando(false);
                        setAprovadas(new Set());
                      }}
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>

              {propostas.length === 0 ? (
                <p className="text-xs text-gray-600 bg-[#F6F9F8] border border-gray-200 rounded-lg p-3">
                  Nenhuma proposta enviada nesta edição.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F6F9F8] text-[11px] uppercase text-gray-600">
                      <tr>
                        <th className="p-3 text-left font-semibold">#</th>
                        <th className="p-3 text-left font-semibold">Equipe / Proposta</th>
                        <th className="p-3 text-right font-semibold">Média</th>
                        <th className="p-3 text-center font-semibold">Avaliações</th>
                        <th className="p-3 text-center font-semibold">Recomendações</th>
                        <th className="p-3 text-center font-semibold">{homologado ? "Decisão" : "Aprovar"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {propostas.map((p) => {
                        const completa = p.avaliacoes_enviadas >= p.avaliadores_designados && p.avaliadores_designados > 0;
                        const marcada = aprovadas.has(p.submissao_id);
                        return (
                          <tr key={p.submissao_id} className={marcada ? "bg-emerald-500/5" : undefined}>
                            <td className="p-3 font-mono font-bold text-gray-900">
                              {p.classificacao != null ? `${p.classificacao}º` : "—"}
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{p.equipe_nome || "Equipe sem nome"}</p>
                              <p className="text-gray-600">{p.titulo || "Sem título"}</p>
                              {p.tema_titulo && <p className="text-[11px] text-emerald-700">{p.tema_titulo}</p>}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-gray-900">{formatarNota(p.nota_media)}</td>
                            <td className={`p-3 text-center font-mono ${completa ? "text-emerald-700" : "text-amber-700"}`}>
                              {p.avaliacoes_enviadas}/{p.avaliadores_designados}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className="text-emerald-700" title="Recomendações de aprovação">
                                {p.recomendacoes_aprovacao} apr.
                              </span>{" "}
                              <span className="text-gray-500">/</span>{" "}
                              <span className="text-red-600" title="Recomendações de reprovação">
                                {p.recomendacoes_reprovacao} repr.
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {homologado ? (
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                                    p.aprovada
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                                      : "bg-red-500/10 border-red-500/30 text-red-700"
                                  }`}
                                >
                                  {p.aprovada ? "Aprovada" : "Reprovada"}
                                </span>
                              ) : (
                                <input
                                  type="checkbox"
                                  aria-label={`Aprovar a proposta da equipe ${p.equipe_nome ?? ""}`}
                                  className="h-4 w-4 accent-emerald-500 cursor-pointer"
                                  checked={marcada}
                                  onChange={() => alternar(p.submissao_id)}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Homologação */}
            {!homologado && (
              <section className="space-y-3 border-t border-gray-200 pt-6">
                <h2 className="text-sm font-bold text-gray-900">Homologar resultado</h2>
                <p className="text-xs text-gray-600">
                  Marque acima as propostas aprovadas. As não marcadas ficam reprovadas
                  {aprovadas.size === 0 && propostas.length > 0 ? " (nenhuma marcada: todas serão reprovadas)" : ""}.
                  Depois de homologar não é possível avaliar, redistribuir nem desfazer.
                </p>

                {!confirmando ? (
                  <button
                    type="button"
                    disabled={!resultado.pode_homologar || homologando}
                    title={!resultado.pode_homologar ? "Resolva as pendências antes de homologar" : undefined}
                    onClick={() => {
                      setMensagem(null);
                      setConfirmando(true);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm cursor-pointer"
                  >
                    Homologar resultado
                  </button>
                ) : (
                  <div
                    role="alertdialog"
                    aria-labelledby="titulo-confirmar-homologacao"
                    className="rounded-xl border border-amber-500/40 bg-[#F6F9F8] p-4 space-y-3"
                  >
                    <p id="titulo-confirmar-homologacao" className="text-sm font-bold text-gray-900">
                      Confirmar a homologação de {edicaoAtual?.nome || "esta edição"}?
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>
                        <strong className="text-emerald-700">{aprovadas.size}</strong> proposta(s) aprovada(s)
                        {aprovadas.size > 0 && (
                          <>
                            :{" "}
                            {propostas
                              .filter((p) => aprovadas.has(p.submissao_id))
                              .map((p) => p.equipe_nome || "Equipe sem nome")
                              .join(", ")}
                          </>
                        )}
                      </li>
                      <li>
                        <strong className="text-red-700">{propostas.length - aprovadas.size}</strong> proposta(s)
                        reprovada(s); essas equipes passam a modo somente leitura.
                      </li>
                    </ul>
                    <p className="text-xs text-amber-800">
                      Esta ação é irreversível. Todos os integrantes serão notificados e a lista de aprovadas
                      ficará pública.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={homologando}
                        onClick={homologar}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        {homologando ? "Homologando..." : "Sim, homologar"}
                      </button>
                      <button
                        type="button"
                        disabled={homologando}
                        onClick={() => setConfirmando(false)}
                        className={btnGhost}
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Resumo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "emerald" | "amber";
}) {
  const cor =
    destaque === "emerald" ? "text-emerald-700" : destaque === "amber" ? "text-amber-700" : "text-gray-900";
  return (
    <div className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] uppercase font-semibold text-gray-500">{rotulo}</p>
      <p className={`text-sm font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  );
}

export default function AdminResultadoPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoResultado />
    </Suspense>
  );
}
