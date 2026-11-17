"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";
import {
  CATALOGO_ODS,
  formatarDataBrasilia,
  type RecomendacaoAvaliacao,
  type TemaItem,
} from "@/lib/api";
import {
  avaliadorApi,
  ehNaoEncontrado,
  formatarDecimal,
  obterTema,
  rubricaApi,
  type AvaliacaoPayload,
  type AvaliacaoResp,
  type CriterioRubricaResp,
  type PropostaParaAvaliacao,
  type RubricaResp,
} from "@/lib/api-avaliacao";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Avaliação científica de uma proposta designada (RF30, RN11, RN12).
 * Comitê Científico (ou DEV com designação). Rascunho pode ficar incompleto;
 * o envio exige todas as notas, parecer e recomendação e é definitivo.
 */

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm disabled:opacity-60";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";

const paraNumero = (s: string) => Number(s.trim().replace(",", "."));

/** Mesma fórmula do backend (estimativa; o valor oficial é calculado no envio). */
function notaPonderada(criterios: CriterioRubricaResp[], notas: Record<string, string>): number | null {
  let total = 0;
  for (const c of criterios) {
    const n = paraNumero(notas[c.id] ?? "");
    if (!(notas[c.id] ?? "").trim() || !Number.isFinite(n)) return null;
    total += ((10 * (n - c.escala_min)) / (c.escala_max - c.escala_min)) * (Number(c.peso) / 100);
  }
  return Math.round(total * 100) / 100;
}

function erroNota(c: CriterioRubricaResp, valor: string): string | null {
  if (!valor.trim()) return null;
  if (!/^-?\d+([.,]\d+)?$/.test(valor.trim())) return "Use um número (ex.: 7,5).";
  const n = paraNumero(valor);
  if (n < c.escala_min || n > c.escala_max) return `A nota deve estar entre ${c.escala_min} e ${c.escala_max}.`;
  return null;
}

async function buscarTudo(id: string) {
  const proposta = await avaliadorApi.proposta(id);
  const [rubrica, avaliacao, tema] = await Promise.all([
    rubricaApi.publicada(proposta.hackathon_id).catch((e) => {
      if (ehNaoEncontrado(e)) return null;
      throw e;
    }),
    avaliadorApi.avaliacao(id).catch((e) => {
      if (ehNaoEncontrado(e)) return null;
      throw e;
    }),
    proposta.tema_id ? obterTema(proposta.tema_id).catch(() => null) : Promise.resolve(null),
  ]);
  return { proposta, rubrica, avaliacao, tema };
}

export default function AvaliarPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { pronto } = useSession(["COMITE_CIENTIFICO"]);

  const [proposta, setProposta] = useState<PropostaParaAvaliacao | null>(null);
  const [rubrica, setRubrica] = useState<RubricaResp | null>(null);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [avaliacao, setAvaliacao] = useState<AvaliacaoResp | null>(null);

  const [notas, setNotas] = useState<Record<string, string>>({});
  const [parecer, setParecer] = useState("");
  const [recomendacao, setRecomendacao] = useState<RecomendacaoAvaliacao | "">("");
  const [alterado, setAlterado] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [semRubrica, setSemRubrica] = useState(false);
  const [ocupado, setOcupado] = useState<"salvar" | "enviar" | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  const aplicarAvaliacao = (a: AvaliacaoResp | null) => {
    setAvaliacao(a);
    setNotas(Object.fromEntries((a?.notas ?? []).map((n) => [n.criterio_id, String(Number(n.nota))])));
    setParecer(a?.parecer ?? "");
    setRecomendacao(a?.recomendacao ?? "");
    setAlterado(false);
  };

  useEffect(() => {
    if (!pronto) return;
    buscarTudo(id)
      .then(({ proposta: p, rubrica: r, avaliacao: a, tema: t }) => {
        setProposta(p);
        setRubrica(r);
        setSemRubrica(!r);
        setTema(t);
        aplicarAvaliacao(a);
      })
      .catch((e) => {
        if (ehNaoEncontrado(e)) setNaoEncontrada(true);
        else setErro(e);
      })
      .finally(() => setCarregando(false));
  }, [pronto, id]);

  const criterios = useMemo(
    () => [...(rubrica?.criterios ?? [])].sort((a, b) => a.ordem - b.ordem),
    [rubrica]
  );
  const enviada = avaliacao?.status === "ENVIADA";
  const errosNotas = useMemo(
    () => Object.fromEntries(criterios.map((c) => [c.id, erroNota(c, notas[c.id] ?? "")])),
    [criterios, notas]
  );
  const temErroNota = Object.values(errosNotas).some(Boolean);
  const preenchidas = criterios.filter((c) => (notas[c.id] ?? "").trim()).length;
  const estimativa = useMemo(() => (temErroNota ? null : notaPonderada(criterios, notas)), [criterios, notas, temErroNota]);

  const montarPayload = (): AvaliacaoPayload => ({
    notas: criterios
      .filter((c) => (notas[c.id] ?? "").trim())
      .map((c) => ({ criterio_id: c.id, nota: notas[c.id].trim().replace(",", ".") })),
    parecer: parecer.trim() ? parecer : null,
    recomendacao: recomendacao || null,
  });

  const mudar = () => {
    setAlterado(true);
    setMensagem(null);
  };

  const salvar = async () => {
    if (temErroNota) {
      setErro("Corrija as notas fora da escala antes de salvar.");
      return;
    }
    setOcupado("salvar");
    setMensagem(null);
    setErro(null);
    try {
      aplicarAvaliacao(await avaliadorApi.salvarRascunho(id, montarPayload()));
      setMensagem("Rascunho salvo.");
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(null);
    }
  };

  const enviar = async () => {
    const faltas: string[] = [];
    if (temErroNota) faltas.push("há notas fora da escala");
    if (preenchidas < criterios.length) faltas.push(`faltam ${criterios.length - preenchidas} nota(s)`);
    if (!parecer.trim()) faltas.push("escreva o parecer");
    if (!recomendacao) faltas.push("escolha a recomendação");
    if (faltas.length) {
      setErro(`Para enviar: ${faltas.join("; ")}.`);
      return;
    }
    if (
      !window.confirm(
        "Enviar a avaliação? Depois do envio ela é definitiva e não pode mais ser alterada."
      )
    )
      return;
    setOcupado("enviar");
    setMensagem(null);
    setErro(null);
    try {
      aplicarAvaliacao(await avaliadorApi.enviar(id, montarPayload()));
      setMensagem("Avaliação enviada.");
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(null);
    }
  };

  if (!pronto) return null;

  const tituloOds = (n: number) => CATALOGO_ODS.find((o) => o.numero === n)?.titulo ?? "";

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-5xl space-y-6">
        <Link href="/avaliador" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar às minhas avaliações
        </Link>

        {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs">
            {mensagem}
          </div>
        )}

        {carregando ? (
          <p className="text-emerald-700 text-xs font-mono">Carregando proposta...</p>
        ) : naoEncontrada ? (
          <div className="bg-white p-8 rounded-2xl border border-emerald-100 text-sm">
            Proposta não encontrada ou não designada a você.
          </div>
        ) : proposta ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Proposta */}
            <section className="lg:col-span-2 bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-4">
              <div>
                <p className="text-[10px] uppercase text-emerald-700 font-bold">Proposta</p>
                <h1 className="text-xl font-bold text-gray-900 mt-1 break-words">
                  {proposta.titulo || "Proposta sem título"}
                </h1>
                {proposta.enviado_em && (
                  <p className="text-[11px] text-gray-500 mt-1">Enviada em {formatarDataBrasilia(proposta.enviado_em)}</p>
                )}
              </div>
              {tema && (
                <div>
                  <p className={lbl}>Tema</p>
                  <p className="text-sm text-gray-900">{tema.titulo}</p>
                </div>
              )}
              <div>
                <p className={lbl}>Descrição</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{proposta.descricao || "—"}</p>
              </div>
              {proposta.bases_dados && (
                <div>
                  <p className={lbl}>Bases de dados</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{proposta.bases_dados}</p>
                </div>
              )}
              {!!proposta.ods?.length && (
                <div>
                  <p className={lbl}>ODS</p>
                  <ul className="space-y-0.5">
                    {proposta.ods.map((n) => (
                      <li key={n} className="text-xs text-emerald-700">
                        {n}. {tituloOds(n)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {proposta.documento_url && (
                <a
                  href={proposta.documento_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir documento da proposta
                </a>
              )}
            </section>

            {/* Avaliação */}
            <section className="lg:col-span-3 bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Sua avaliação</h2>
                  <p className="text-[11px] text-gray-500">
                    {enviada && avaliacao?.avaliado_em
                      ? `Enviada em ${formatarDataBrasilia(avaliacao.avaliado_em)}`
                      : avaliacao
                        ? `Rascunho salvo em ${formatarDataBrasilia(avaliacao.atualizado_em)}`
                        : "Ainda não iniciada"}
                    {alterado && " · alterações não salvas"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-gray-500 font-semibold">
                    {enviada ? "Nota final" : "Nota estimada"}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {enviada ? formatarDecimal(avaliacao?.nota_final) : estimativa !== null ? formatarDecimal(estimativa) : "—"}
                    <span className="text-xs text-gray-500"> / 10</span>
                  </p>
                </div>
              </div>

              {enviada && (
                <p className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <Lock className="h-4 w-4 shrink-0" /> Avaliação enviada: não pode mais ser alterada.
                </p>
              )}

              {semRubrica ? (
                <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  A rubrica desta edição ainda não foi publicada. A avaliação só pode ser feita depois da publicação.
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-500">
                      Notas por critério ({preenchidas}/{criterios.length}). A nota final é a soma ponderada das notas
                      normalizadas de 0 a 10 e é calculada pelo servidor no envio.
                    </p>
                    {criterios.map((c) => (
                      <div key={c.id} className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                              {c.nome}{" "}
                              <span className="text-[11px] font-semibold text-emerald-700">
                                peso {formatarDecimal(c.peso)}%
                              </span>
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{c.descricao}</p>
                          </div>
                          <div className="sm:w-36">
                            <label className={lbl} htmlFor={`nota-${c.id}`}>
                              Nota ({c.escala_min} a {c.escala_max})
                            </label>
                            <input
                              id={`nota-${c.id}`}
                              inputMode="decimal"
                              className={`${inp} ${errosNotas[c.id] ? "border-red-500/60" : ""}`}
                              disabled={enviada}
                              value={notas[c.id] ?? ""}
                              onChange={(e) => {
                                setNotas((ns) => ({ ...ns, [c.id]: e.target.value }));
                                mudar();
                              }}
                            />
                          </div>
                        </div>
                        {errosNotas[c.id] && <p className="text-[11px] text-red-600 mt-1">{errosNotas[c.id]}</p>}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className={lbl} htmlFor="parecer">
                      Parecer *
                    </label>
                    <textarea
                      id="parecer"
                      rows={6}
                      className={`${inp} resize-y`}
                      disabled={enviada}
                      placeholder="Justifique as notas: pontos fortes, fragilidades e recomendações à equipe."
                      value={parecer}
                      onChange={(e) => {
                        setParecer(e.target.value);
                        mudar();
                      }}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Após a homologação do resultado, a equipe pode ver o parecer e a recomendação, sem saber quem
                      avaliou.
                    </p>
                  </div>

                  <fieldset>
                    <legend className={lbl}>Recomendação *</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["APROVACAO", "Aprovação", "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"],
                          ["REPROVACAO", "Reprovação", "border-red-500/50 bg-red-500/10 text-red-700"],
                        ] as const
                      ).map(([valor, rotulo, ativo]) => (
                        <label
                          key={valor}
                          className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2.5 ${
                            enviada ? "" : "cursor-pointer"
                          } ${recomendacao === valor ? ativo : "border-gray-200 text-gray-600"}`}
                        >
                          <input
                            type="radio"
                            name="recomendacao"
                            value={valor}
                            disabled={enviada}
                            checked={recomendacao === valor}
                            onChange={() => {
                              setRecomendacao(valor);
                              mudar();
                            }}
                          />
                          {rotulo}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {!enviada && (
                    <div className="flex flex-col sm:flex-row gap-2 border-t border-gray-200 pt-5">
                      <button
                        type="button"
                        onClick={salvar}
                        disabled={!!ocupado}
                        className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 text-gray-900 font-bold rounded-lg text-sm cursor-pointer"
                      >
                        {ocupado === "salvar" ? "Salvando..." : "Salvar rascunho"}
                      </button>
                      <button
                        type="button"
                        onClick={enviar}
                        disabled={!!ocupado}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer"
                      >
                        {ocupado === "enviar" ? "Enviando..." : "Enviar avaliação"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
