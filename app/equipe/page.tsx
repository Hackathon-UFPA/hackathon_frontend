// app/equipe/page.tsx
"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ConviteRecebido,
  HackathonResumo,
  MinhaEquipeResumo,
  moduloCApi,
  PainelEquipeNormalizado,
  UsuarioMe,
} from "@/lib/moduloC-api";
import {
  BadgeSituacaoConta,
  BadgeSituacaoEquipe,
  ReciboProtocolo,
} from "@/components/modulo-c/StatusBadges";
import { ComprovanteCard } from "@/components/modulo-c/ComprovanteCard";
import { ConvitesRecebidos } from "@/components/modulo-c/ConvitesRecebidos";
import {
  FormCriarEquipe,
  GestaoEquipe,
} from "@/components/modulo-c/GestaoEquipe";

type AbaPainel = "visao-geral" | "inscricao" | "convites-conta" | "proposta";

function FundoPadrao() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=2069&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/85 to-[#0A1110]" />
    </div>
  );
}

function ConteudoPainelEquipe() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipeIdUrl = searchParams.get("equipe_id");

  const [usuario, setUsuario] = useState<UsuarioMe | null>(null);
  const [hackathons, setHackathons] = useState<HackathonResumo[]>([]);
  const [minhasEquipes, setMinhasEquipes] = useState<MinhaEquipeResumo[]>([]);
  const [convitesPendentesCount, setConvitesPendentesCount] = useState(0);

  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<string>("");
  const [hackathonCriacaoId, setHackathonCriacaoId] = useState<string>("");
  const [painel, setPainel] = useState<PainelEquipeNormalizado | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>("visao-geral");
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoPainel, setCarregandoPainel] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const carregarContextoBase = useCallback(async () => {
    setCarregandoInicial(true);
    setErroGeral(null);

    try {
      const me = await moduloCApi.obterMe();
      setUsuario(me);

      if (me.papel !== "PARTICIPANTE" && me.papel !== "DEV") {
        setErroGeral(
          `Seu perfil atual é ${me.papel}. Esta área é exclusiva para participantes.`
        );
        setCarregandoInicial(false);
        return;
      }

      const [listaEquipes, listaConvites, listaHackathons] = await Promise.all([
        moduloCApi.listarMinhasEquipes().catch(() => [] as MinhaEquipeResumo[]),
        moduloCApi.listarMeusConvites().catch(() => [] as ConviteRecebido[]),
        moduloCApi.listarHackathons().catch(() => [] as HackathonResumo[]),
      ]);

      setMinhasEquipes(listaEquipes);
      setConvitesPendentesCount(
        listaConvites.filter((c) => c.status === "PENDENTE").length
      );
      setHackathons(listaHackathons);

      const edicaoAberta = listaHackathons.find((h) => h.status === "INSCRICOES");
      if (edicaoAberta && !hackathonCriacaoId) {
        setHackathonCriacaoId(edicaoAberta.id);
      }

      if (equipeIdUrl && listaEquipes.some((e) => e.id === equipeIdUrl)) {
        setEquipeSelecionadaId(equipeIdUrl);
      } else if (listaEquipes.length === 1) {
        setEquipeSelecionadaId(listaEquipes[0].id);
      } else if (
        equipeSelecionadaId &&
        listaEquipes.some((e) => e.id === equipeSelecionadaId)
      ) {
        // Mantém seleção existente
      } else {
        setEquipeSelecionadaId("");
      }
    } catch (err: unknown) {
      setErroGeral(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados da sua sessão."
      );
    } finally {
      setCarregandoInicial(false);
    }
  }, [equipeIdUrl, equipeSelecionadaId, hackathonCriacaoId]);

  const carregarPainelSelecionado = useCallback(async (id: string) => {
    if (!id) {
      setPainel(null);
      return;
    }
    setCarregandoPainel(true);
    try {
      const dados = await moduloCApi.obterPainelEquipe(id);
      setPainel(dados);
    } catch (err: unknown) {
      setErroGeral(
        err instanceof Error ? err.message : "Erro ao carregar painel da equipe."
      );
    } finally {
      setCarregandoPainel(false);
    }
  }, []);

  useEffect(() => {
    carregarContextoBase();
  }, [carregarContextoBase]);

  useEffect(() => {
    if (equipeSelecionadaId) {
      carregarPainelSelecionado(equipeSelecionadaId);
    } else {
      setPainel(null);
    }
  }, [equipeSelecionadaId, carregarPainelSelecionado]);

  const selecionarEquipe = (novoId: string) => {
    setEquipeSelecionadaId(novoId);
    const params = new URLSearchParams(searchParams.toString());
    if (novoId) {
      params.set("equipe_id", novoId);
    } else {
      params.delete("equipe_id");
    }
    router.replace(`/equipe?${params.toString()}`);
  };

  if (carregandoInicial) {
    return (
      <div className="min-h-screen bg-[#0A1110] text-gray-300 relative flex items-center justify-center p-6">
        <FundoPadrao />
        <p className="relative z-10 text-sm font-semibold text-emerald-400 animate-pulse">
          Carregando área do participante...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#0A1110] text-gray-300 relative flex items-center justify-center p-6">
        <FundoPadrao />
        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-semibold tracking-widest uppercase">
            Sessão Necessária
          </div>
          <h1 className="text-2xl font-extrabold text-white">Acesso Restrito</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            {erroGeral || "Faça login com sua conta de participante para continuar."}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 relative">
      <FundoPadrao />

      {/* Barra Superior Institucional */}
      <header className="bg-[#0A1110]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm"
            >
              IA
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-white leading-tight">
                Hackathon IA Amazônia — Área do Participante
              </h1>
              <p className="text-xs text-gray-400">
                {usuario.nome} ({usuario.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <BadgeSituacaoConta situacao={usuario.situacao_conta} />
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Página Inicial
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {erroGeral && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
          >
            {erroGeral}
          </div>
        )}

        {/* EQP-03: Seletor Explícito de Equipe / Edição */}
        <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Contexto de Edição e Equipe (EQP-03)
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {minhasEquipes.length === 0
                ? "Você ainda não participa de nenhuma equipe."
                : minhasEquipes.length === 1
                ? "Equipe vinculada carregada."
                : `Você possui ${minhasEquipes.length} equipes vinculadas. Selecione qual deseja gerenciar:`}
            </p>
          </div>

          {minhasEquipes.length > 0 && (
            <div className="flex items-center gap-2.5">
              <label htmlFor="seletor-equipe-ativa" className="sr-only">
                Selecionar equipe e edição
              </label>
              <select
                id="seletor-equipe-ativa"
                value={equipeSelecionadaId}
                onChange={(e) => selecionarEquipe(e.target.value)}
                className="px-3.5 py-2 rounded-lg bg-[#0A1110] border border-white/15 text-xs font-semibold text-white min-w-[260px] focus:outline-none focus:border-emerald-500"
              >
                {minhasEquipes.length > 1 && (
                  <option value="">-- Escolha uma equipe / edição --</option>
                )}
                {minhasEquipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome} — {eq.hackathon_nome || eq.hackathon_id} ({eq.situacao})
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Navegação de Abas (EQP-06) */}
        <nav
          aria-label="Navegação do painel do participante"
          className="flex flex-wrap gap-2 border-b border-white/10 pb-3"
        >
          <button
            type="button"
            onClick={() => setAbaAtiva("visao-geral")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              abaAtiva === "visao-geral"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Visão Geral
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("inscricao")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              abaAtiva === "inscricao"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Inscrição & Integrantes
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("convites-conta")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              abaAtiva === "convites-conta"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>Conta & Convites</span>
            {convitesPendentesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-extrabold">
                {convitesPendentesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("proposta")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              abaAtiva === "proposta"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Proposta (Módulo D)
          </button>

          <span
            title="Disponível após homologação científica e abertura da fase de mentoria"
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.02] text-gray-500 border border-white/5 cursor-not-allowed"
          >
            Entregas, Mentoria & Chat (Fase 2)
          </span>
        </nav>

        {/* ABA 1: VISÃO GERAL */}
        {abaAtiva === "visao-geral" && (
          <div className="space-y-6">
            {!equipeSelecionadaId ? (
              <>
                <FormCriarEquipe
                  hackathons={hackathons}
                  hackathonSelecionadoId={hackathonCriacaoId}
                  onSelectHackathon={setHackathonCriacaoId}
                  situacaoConta={usuario.situacao_conta}
                  onEquipeCriada={async (novaId) => {
                    await carregarContextoBase();
                    selecionarEquipe(novaId);
                    setAbaAtiva("inscricao");
                  }}
                />
                <ConvitesRecebidos
                  situacaoConta={usuario.situacao_conta}
                  onConviteRespondido={carregarContextoBase}
                />
              </>
            ) : carregandoPainel || !painel ? (
              <p className="text-xs text-emerald-400 animate-pulse">
                Carregando painel da equipe...
              </p>
            ) : (
              <>
                {/* Cards de Situações Independentes (Regra 3.3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      1. Situação da Sua Conta
                    </span>
                    <div>
                      <BadgeSituacaoConta situacao={usuario.situacao_conta} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {usuario.situacao_conta === "ATIVA"
                        ? "Vínculo validado pelo Comitê."
                        : "Aguardando aprovação do comprovante."}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      2. Inscrição da Equipe
                    </span>
                    <div>
                      <BadgeSituacaoEquipe situacao={painel.situacao} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {painel.situacao === "EM_FORMACAO" &&
                        "Conclua a formação e aceite os termos para enviar."}
                      {painel.situacao === "AGUARDANDO_HOMOLOGACAO" &&
                        "Inscrição concluída; aguardando homologação oficial."}
                      {painel.situacao === "HOMOLOGADA" &&
                        "Equipe homologada e apta para submeter proposta."}
                      {painel.situacao === "NAO_HOMOLOGADA" &&
                        "Inscrição não homologada. Consulte os detalhes com a organização."}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      3. Proposta Científica
                    </span>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-white/5 text-gray-200 border-white/15">
                        {painel.situacao === "HOMOLOGADA"
                          ? "Liberada para Elaboração"
                          : "Aguardando Homologação da Equipe"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      O envio da proposta exige a equipe com inscrição homologada.
                    </p>
                  </div>
                </div>

                {/* Protocolo de Inscrição (se já concluída) */}
                {painel.protocolo_inscricao && (
                  <ReciboProtocolo
                    tipo="INSCRICAO_EQUIPE"
                    numero={painel.protocolo_inscricao.numero}
                    emitidoEm={painel.protocolo_inscricao.emitido_em}
                  />
                )}

                {/* Pendências da Equipe */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">
                      Pendências da Equipe ({painel.pendencias.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setAbaAtiva("inscricao")}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Gerenciar integrantes &rarr;
                    </button>
                  </div>

                  {painel.pendencias.length === 0 ? (
                    <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
                      Nenhuma pendência registrada no momento.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 list-disc pl-8">
                      {painel.pendencias.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ABA 2: INSCRIÇÃO & INTEGRANTES (EQP-04) */}
        {abaAtiva === "inscricao" && (
          <div className="space-y-6">
            {equipeSelecionadaId && painel ? (
              <GestaoEquipe
                painel={painel}
                usuario={usuario}
                onRecarregarPainel={async () => {
                  await carregarPainelSelecionado(equipeSelecionadaId);
                  await carregarContextoBase();
                }}
              />
            ) : (
              <FormCriarEquipe
                hackathons={hackathons}
                hackathonSelecionadoId={hackathonCriacaoId}
                onSelectHackathon={setHackathonCriacaoId}
                situacaoConta={usuario.situacao_conta}
                onEquipeCriada={async (novaId) => {
                  await carregarContextoBase();
                  selecionarEquipe(novaId);
                }}
              />
            )}
          </div>
        )}

        {/* ABA 3: CONTA, COMPROVANTES E CONVITES (EQP-01 + EQP-02) */}
        {abaAtiva === "convites-conta" && (
          <div className="space-y-6">
            <ComprovanteCard
              situacaoConta={usuario.situacao_conta}
              onAtualizarUsuario={carregarContextoBase}
            />
            <ConvitesRecebidos
              situacaoConta={usuario.situacao_conta}
              onConviteRespondido={async () => {
                await carregarContextoBase();
                setAbaAtiva("visao-geral");
              }}
            />
          </div>
        )}

        {/* ABA 4: PONTE PARA MÓDULO D (PROPOSTA) */}
        {abaAtiva === "proposta" && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-white">
              Proposta Científica da Equipe
            </h2>
            {!painel ? (
              <p className="text-xs text-gray-400">
                Selecione ou crie uma equipe primeiro para acessar o editor de proposta.
              </p>
            ) : painel.situacao !== "HOMOLOGADA" ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <p className="font-bold">
                  Proposta bloqueada — Situação atual da equipe: {painel.situacao}
                </p>
                <p className="text-gray-300">
                  A elaboração e o envio da proposta (Módulo D) são liberados assim que a inscrição da equipe for <strong>Homologada</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-300">
                  Sua equipe <strong className="text-white">{painel.nome}</strong> está homologada. Acesse o editor da proposta científica vinculada a esta equipe:
                </p>
                <Link
                  href={`/proposta?equipe_id=${encodeURIComponent(painel.equipe_id)}`}
                  className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-950/50"
                >
                  Abrir Editor da Proposta &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PainelEquipePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A1110] flex items-center justify-center text-xs text-emerald-400">
          Carregando painel...
        </div>
      }
    >
      <ConteudoPainelEquipe />
    </Suspense>
  );
}