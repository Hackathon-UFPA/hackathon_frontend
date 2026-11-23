"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Shuffle, UserCog } from "lucide-react";
import {
  formatarDataBrasilia,
  hackathons as hackathonsApi,
  type HackathonResponse,
} from "@/lib/api";
import {
  distribuicaoApi,
  type AvaliadorDesignado,
  type DistribuicaoResp,
  type PropostaDesignadaAdmin,
} from "@/lib/api-avaliacao";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Distribuição das propostas entre avaliadores (RF29, Q07). Somente Organizador ou DEV.
 * 1. Define quantos avaliadores por proposta (2 ou 3).
 * 2. Distribui automaticamente as propostas ENVIADA (só completa o que falta).
 * 3. Ajusta manualmente uma proposta (redistribuição), antes de a avaliação começar.
 */

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm disabled:opacity-60";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";
const btnGhost =
  "inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-[11px] rounded-lg text-gray-900 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const STATUS_BLOQUEADOS = ["EM_AVALIACAO", "FINALIZADO", "CANCELADO"];
const OUTRO = "__outro__";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rotuloAvaliador = (a: AvaliadorDesignado) => (a.nome ? `${a.nome} (${a.email})` : a.email);

function ConteudoAvaliacoes() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const searchParams = useSearchParams();

  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [hackathonId, setHackathonId] = useState("");
  const [designacoes, setDesignacoes] = useState<PropostaDesignadaAdmin[]>([]);
  /** null = mostra o valor salvo na edição. */

  const [resultado, setResultado] = useState<DistribuicaoResp | null>(null);

  // Redistribuição: proposta em edição e ids escolhidos (por posição)
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [escolhas, setEscolhas] = useState<string[]>([]);
  const [manuais, setManuais] = useState<string[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .daMinhaOrganizacao()
      .then((lst) => {
        setEdicoes(lst);
        const daUrl = searchParams.get("hackathon_id");
        const alvo =
          lst.find((h) => h.id === daUrl) ??
          lst.find((h) => h.status === "ATIVO") ??
          lst.find((h) => h.status === "INSCRICOES_ENCERRADAS") ??
          lst.find((h) => h.status === "INSCRICOES") ??
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

  const edicao = edicoes.find((h) => h.id === hackathonId);
  const qtd = edicao?.avaliadores_por_proposta ?? null;
  const bloqueado = !!edicao?.status && STATUS_BLOQUEADOS.includes(edicao.status);


  // Quem troca de edição liga o "carregando"; o efeito só altera estado nos callbacks.
  useEffect(() => {
    if (!hackathonId) return;
    distribuicaoApi
      .designacoes(hackathonId)
      .then(setDesignacoes)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [hackathonId]);

  const carregar = async () => {
    try {
      setDesignacoes(await distribuicaoApi.designacoes(hackathonId));
    } catch (e) {
      setErro(e);
    }
  };

  /** Não há rota que liste os avaliadores elegíveis: usamos os que já aparecem nas designações. */
  const conhecidos = (() => {
    const m = new Map<string, AvaliadorDesignado & { carga: number }>();
    for (const p of designacoes) {
      for (const a of p.avaliadores) {
        const atual = m.get(a.id);
        m.set(a.id, { ...a, carga: (atual?.carga ?? 0) + 1 });
      }
    }
    return [...m.values()].sort((a, b) => rotuloAvaliador(a).localeCompare(rotuloAvaliador(b), "pt-BR"));
  })();

  const semAvaliador = designacoes.filter((p) => p.avaliadores.length === 0).length;
  const completas = qtd ? designacoes.filter((p) => p.avaliadores.length >= qtd).length : 0;
  const resumo = { total: designacoes.length, semAvaliador, incompletas: designacoes.length - completas };

  const limpar = () => {
    setMensagem(null);
    setErro(null);
  };

  const trocarEdicao = (id: string) => {
    if (id !== hackathonId) setCarregando(true);
    setHackathonId(id);
    setEditandoId(null);
    setResultado(null);
    limpar();
  };



  const distribuir = async () => {
    if (
      !window.confirm(
        "Distribuir as propostas enviadas entre os avaliadores? Propostas já completas ou com avaliação iniciada não são alteradas."
      )
    )
      return;
    setOcupado("distribuir");
    setResultado(null);
    limpar();
    try {
      setResultado(await distribuicaoApi.distribuir(hackathonId));
      await carregar();
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(null);
    }
  };

  const abrirEdicao = (p: PropostaDesignadaAdmin) => {
    if (!qtd) return;
    const ids = p.avaliadores.map((a) => a.id).slice(0, qtd);
    while (ids.length < qtd) ids.push("");
    setEditandoId(p.submissao_id);
    setEscolhas(ids);
    setManuais(Array(qtd).fill(""));
    limpar();
  };

  const idsEscolhidos = () => escolhas.map((v, i) => (v === OUTRO ? manuais[i].trim() : v));

  const salvarRedistribuicao = async (p: PropostaDesignadaAdmin) => {
    const ids = idsEscolhidos();
    if (ids.some((x) => !x)) {
      setErro(`Escolha ${qtd} avaliadores.`);
      return;
    }
    if (ids.some((x) => !UUID_RE.test(x))) {
      setErro("Algum ID informado manualmente não é um UUID válido.");
      return;
    }
    if (new Set(ids).size !== ids.length) {
      setErro("Não repita o mesmo avaliador.");
      return;
    }
    setOcupado(p.submissao_id);
    limpar();
    try {
      const r = await distribuicaoApi.redistribuir(p.submissao_id, ids);
      setDesignacoes((lst) => lst.map((x) => (x.submissao_id === r.submissao_id ? r : x)));
      setEditandoId(null);
      setMensagem(`Avaliadores da proposta "${r.titulo || "sem título"}" atualizados.`);
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(null);
    }
  };

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <Link href="/admin" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Distribuição de Avaliações</h1>
          <p className="text-xs text-gray-600">
            Defina quantos avaliadores do Comitê Científico leem cada proposta, distribua as propostas enviadas e,
            se precisar, troque os avaliadores de uma proposta antes de a avaliação começar.
          </p>
        </div>

        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs">
            {mensagem}
          </div>
        )}
        {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}

        <div>
          <label className={lbl} htmlFor="sel-edicao-avaliacoes">
            Edição
          </label>
          <select
            id="sel-edicao-avaliacoes"
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

        {!hackathonId && !carregando ? (
          <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            Nenhuma edição cadastrada.
          </p>
        ) : (
          <>
            {bloqueado && (
              <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                Esta edição está {edicao?.status === "EM_AVALIACAO" ? "em avaliação" : edicao?.status?.toLowerCase()}:
                a API não permite mais distribuir nem trocar avaliadores.
              </p>
            )}

            {/* 1 e 2: configuração e distribuição */}
            <section className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Distribuição automática</h2>

              <p className="text-[11px] text-gray-500">
                Configuração atual:{" "}
                <strong className="text-gray-700">
                  {qtd ? `${qtd} avaliador(es) por proposta` : "não configurada"}
                </strong>
                . A configuração pode ser alterada em{" "}
                <Link
                  href={`/admin/avaliacoes/configuracao?hackathon_id=${hackathonId}`}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  Configuração de Avaliação
                </Link>
                .
              </p>

              <p className="text-[11px] text-gray-500">
                Cada proposta enviada é completada até {qtd ?? "N"} avaliadores, priorizando
                quem tem menos propostas. Se faltar avaliador elegível, nada é gravado.
              </p>

              <button
                type="button"
                onClick={distribuir}
                disabled={!!ocupado || !qtd || bloqueado}
                title={!qtd ? "Configure a quantidade de avaliadores antes." : undefined}
                className="w-full inline-flex justify-center items-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                <Shuffle className="h-4 w-4" />
                {ocupado === "distribuir" ? "Distribuindo..." : "Distribuir propostas"}
              </button>

              {resultado && (
                <p className="text-[11px] text-emerald-700">
                  {resultado.propostas_distribuidas} proposta(s) receberam avaliadores (
                  {resultado.designacoes_criadas} designação(ões) nova(s));{" "}
                  {resultado.propostas_ja_completas} já estavam completas.
                </p>
              )}
            </section>

            {/* 3: designações */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900">3. Propostas enviadas e avaliadores</h2>
                <p className="text-[11px] text-gray-500">
                  {resumo.total} proposta(s) · {resumo.semAvaliador} sem avaliador
                  {qtd ? ` · ${resumo.incompletas} incompleta(s)` : ""}
                </p>
              </div>

              {carregando ? (
                <p className="text-emerald-700 text-xs font-mono">Carregando designações...</p>
              ) : designacoes.length === 0 ? (
                <p className="text-xs text-gray-600 bg-[#F6F9F8] border border-gray-200 rounded-lg p-3">
                  Nenhuma proposta enviada nesta edição. Rascunhos não entram na distribuição.
                </p>
              ) : (
                designacoes.map((p) => {
                  const incompleta = !!qtd && p.avaliadores.length < qtd;
                  const editando = editandoId === p.submissao_id;
                  return (
                    <div
                      key={p.submissao_id}
                      className={`bg-[#F6F9F8] border rounded-xl p-4 space-y-3 ${incompleta ? "border-amber-500/30" : "border-emerald-100"
                        }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 break-words">{p.titulo || "Proposta sem título"}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            proposta {p.submissao_id.slice(0, 8)} · equipe {p.equipe_id.slice(0, 8)}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${p.avaliadores.length === 0
                              ? "bg-gray-50 border-gray-300 text-gray-600"
                              : incompleta
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-700"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                            }`}
                        >
                          {p.avaliadores.length}
                          {qtd ? `/${qtd}` : ""} avaliador(es)
                        </span>
                      </div>

                      {!editando && (
                        <>
                          {p.avaliadores.length > 0 ? (
                            <ul className="space-y-1">
                              {p.avaliadores.map((a) => (
                                <li key={a.id} className="text-xs text-gray-700 flex flex-wrap justify-between gap-2">
                                  <span>{rotuloAvaliador(a)}</span>
                                  {a.atribuido_em && (
                                    <span className="text-[10px] text-gray-500">
                                      desde {formatarDataBrasilia(a.atribuido_em)}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500">Ainda não distribuída.</p>
                          )}
                          <button
                            type="button"
                            className={btnGhost}
                            disabled={!qtd || bloqueado || !!ocupado}
                            title={!qtd ? "Configure a quantidade de avaliadores antes." : undefined}
                            onClick={() => abrirEdicao(p)}
                          >
                            <UserCog className="h-3.5 w-3.5" /> Trocar avaliadores
                          </button>
                        </>
                      )}

                      {editando && qtd && (
                        <div className="space-y-3 border-t border-gray-200 pt-3">
                          <p className="text-[11px] text-gray-500">
                            Escolha exatamente {qtd} avaliadores do Comitê Científico com conta ativa. Quem continuar
                            na lista mantém a designação. Não é possível trocar se a proposta já tem avaliação
                            iniciada (inclusive rascunho).
                          </p>
                          {escolhas.map((v, i) => (
                            <div key={i} className="space-y-1.5">
                              <label className={lbl} htmlFor={`av-${p.submissao_id}-${i}`}>
                                Avaliador {i + 1}
                              </label>
                              <select
                                id={`av-${p.submissao_id}-${i}`}
                                className={inp}
                                value={v}
                                onChange={(e) =>
                                  setEscolhas((es) => es.map((x, j) => (j === i ? e.target.value : x)))
                                }
                              >
                                <option value="">Escolha...</option>
                                {conhecidos.map((a) => (
                                  <option
                                    key={a.id}
                                    value={a.id}
                                    disabled={escolhas.some((x, j) => j !== i && x === a.id)}
                                  >
                                    {rotuloAvaliador(a)} · {a.carga} proposta(s)
                                  </option>
                                ))}
                                <option value={OUTRO}>Outro avaliador (informar ID)</option>
                              </select>
                              {v === OUTRO && (
                                <input
                                  className={`${inp} font-mono`}
                                  placeholder="ID (UUID) do usuário avaliador"
                                  value={manuais[i]}
                                  onChange={(e) =>
                                    setManuais((ms) => ms.map((x, j) => (j === i ? e.target.value : x)))
                                  }
                                />
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => salvarRedistribuicao(p)}
                              disabled={!!ocupado}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                            >
                              {ocupado === p.submissao_id ? "Salvando..." : "Salvar avaliadores"}
                            </button>
                            <button type="button" className={btnGhost} onClick={() => setEditandoId(null)}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {conhecidos.length === 0 && designacoes.length > 0 && (
                <p className="text-[11px] text-gray-500">
                  A API não lista os avaliadores elegíveis; depois da primeira distribuição eles aparecem nas
                  opções de troca. Antes disso, informe o ID manualmente.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminAvaliacoesPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoAvaliacoes />
    </Suspense>
  );
}
