// app/equipe/page.tsx
"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ConviteRecebido,
  HackathonResumo,
  MinhaEquipeResumo,
  moduloCApi,
  PainelEquipeNormalizado,
  UsuarioMe,
} from "@/lib/api";
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
import { ResultadoCientifico } from "@/components/modulo-d/ResultadoCientifico";
import { ComposicaoEquipe } from "@/components/modulo-c/ComposicaoEquipe";
import { MentorEquipe } from "@/components/modulo-c/MentorEquipe";

type AbaPainel = "visao-geral" | "inscricao" | "convites-conta" | "proposta" | "resultado";

function FundoPadrao() {
  // Brilho verde suave no topo, no lugar da antiga foto de floresta do evento
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]"
    />
  );
}

function ConteudoPainelEquipe() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipeIdUrl = searchParams.get("equipe_id");
  // Vindo da página pública do hackathon ("Quero participar"): abre o comprovante dele.
  const hackathonIdUrl = searchParams.get("hackathon_id") ?? "";
  const hackathonIdUrlRef = useRef(hackathonIdUrl);

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

  // A URL só define a equipe inicial. Ler o valor por ref evita recarregar
  // o contexto inteiro (com a tela de carregamento) a cada troca de equipe.
  const equipeIdUrlRef = useRef(equipeIdUrl);
  const primeiraCarga = useRef(true);

  const carregarContextoBase = useCallback(async () => {
    if (primeiraCarga.current) setCarregandoInicial(true);
    setErroGeral(null);

    try {
      const me = await moduloCApi.obterMe();
      setUsuario(me);
      // Conta pendente: o primeiro passo é o comprovante (EQP-01).
      if (primeiraCarga.current && (me.situacao_conta === "PENDENTE" || hackathonIdUrlRef.current)) {
        setAbaAtiva("convites-conta");
      }

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
      setHackathonCriacaoId((atual) => atual || edicaoAberta?.id || "");

      const daUrl = equipeIdUrlRef.current;
      setEquipeSelecionadaId((atual) => {
        if (atual && listaEquipes.some((e) => e.id === atual)) return atual;
        if (daUrl && listaEquipes.some((e) => e.id === daUrl)) return daUrl;
        if (listaEquipes.length === 1) return listaEquipes[0].id;
        return "";
      });
    } catch (err: unknown) {
      setErroGeral(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados da sua sessão."
      );
    } finally {
      primeiraCarga.current = false;
      setCarregandoInicial(false);
    }
  }, []);

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
      <div className="min-h-screen bg-[#F6F9F8] text-gray-700 relative flex items-center justify-center p-6">
        <FundoPadrao />
        <p className="relative z-10 text-sm font-semibold text-emerald-700 animate-pulse">
          Carregando área do participante...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#F6F9F8] text-gray-700 relative flex items-center justify-center p-6">
        <FundoPadrao />
        <div className="relative z-10 max-w-md w-full bg-gray-50 border border-gray-200 backdrop-blur-xl rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 text-[11px] font-semibold tracking-widest uppercase">
            Sessão Necessária
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Acesso Restrito</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            {erroGeral || "Faça login com sua conta de participante para continuar."}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/10"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#F6F9F8] text-gray-700 relative">
      <FundoPadrao />

      {/* Barra Superior Institucional */}
      <header className="bg-[#F6F9F8]/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm"
            >
              IA
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 leading-tight">
                Área do Participante
              </h1>
              <p className="text-xs text-gray-600">
                {usuario.nome} ({usuario.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <BadgeSituacaoConta situacao={usuario.situacao_conta} />
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Página Inicial
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {erroGeral && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs"
          >
            {erroGeral}
          </div>
        )}

        {/* EQP-03: Seletor Explícito de Equipe / Edição */}
        <section className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Contexto de Edição e Equipe (EQP-03)
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
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
                className="px-3.5 py-2 rounded-lg bg-[#F6F9F8] border border-gray-200 text-xs font-semibold text-gray-900 min-w-[260px] focus:outline-none focus:border-emerald-500"
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
          className="flex flex-wrap gap-2 border-b border-gray-200 pb-3"
        >
          <button
            type="button"
            onClick={() => setAbaAtiva("visao-geral")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              abaAtiva === "visao-geral"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-white"
            }`}
          >
            Visão Geral
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("inscricao")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              abaAtiva === "inscricao"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-white"
            }`}
          >
            Inscrição & Integrantes
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("convites-conta")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              abaAtiva === "convites-conta"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-white"
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
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-white"
            }`}
          >
            Proposta (Módulo D)
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("resultado")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              abaAtiva === "resultado"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-white"
            }`}
          >
            Resultado Científico
          </button>

          <span
            title="Disponível após homologação científica e abertura da fase de mentoria"
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.02] text-gray-500 border border-gray-100 cursor-not-allowed"
          >
            Entregas & Chat (Fase 2)
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
                {/* A conta pendente também vê e responde aos convites (BE-S5-02). */}
                <ConvitesRecebidos
                  situacaoConta={usuario.situacao_conta}
                  onConviteRespondido={carregarContextoBase}
                />
              </>
            ) : carregandoPainel || !painel ? (
              <p className="text-xs text-emerald-700 animate-pulse">
                Carregando painel da equipe...
              </p>
            ) : (
              <>
                {/* Cards de Situações Independentes (Regra 3.3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      1. Situação da Sua Conta
                    </span>
                    <div>
                      <BadgeSituacaoConta situacao={usuario.situacao_conta} />
                    </div>
                    <p className="text-xs text-gray-600">
                      {usuario.situacao_conta === "ATIVA"
                        ? "Conta ativa. O vínculo é conferido por hackathon, na aba Conta & Convites."
                        : "Aguardando aprovação do comprovante."}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      2. Inscrição da Equipe
                    </span>
                    <div>
                      <BadgeSituacaoEquipe situacao={painel.situacao} />
                    </div>
                    <p className="text-xs text-gray-600">
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

                  <div className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      3. Proposta Científica
                    </span>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-50 text-gray-800 border-gray-200">
                        {painel.protocolo_proposta
                          ? "Proposta Enviada"
                          : painel.situacao === "NAO_HOMOLOGADA"
                            ? "Bloqueada"
                            : painel.situacao === "HOMOLOGADA"
                              ? "Liberada para Envio"
                              : "Rascunho Liberado"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {painel.protocolo_proposta
                        ? `Protocolo ${painel.protocolo_proposta.numero}. O resultado aparece na aba Resultado Científico.`
                        : "O rascunho pode ser salvo desde a formação; o envio exige a equipe homologada."}
                    </p>
                  </div>
                </div>

                <MentorEquipe key={painel.equipe_id} equipeId={painel.equipe_id} />

                {/* Protocolo de Inscrição (se já concluída) */}
                {painel.protocolo_inscricao && (
                  <ReciboProtocolo
                    tipo="INSCRICAO_EQUIPE"
                    numero={painel.protocolo_inscricao.numero}
                    emitidoEm={painel.protocolo_inscricao.emitido_em}
                  />
                )}

                {/* Protocolo da Proposta (último envio) */}
                {painel.protocolo_proposta && (
                  <ReciboProtocolo
                    tipo="PROPOSTA"
                    numero={painel.protocolo_proposta.numero}
                    emitidoEm={painel.protocolo_proposta.emitido_em}
                  />
                )}

                {/* Pendências da Equipe */}
                <div className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">
                      Pendências da Equipe ({painel.pendencias.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setAbaAtiva("inscricao")}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Gerenciar integrantes &rarr;
                    </button>
                  </div>

                  {painel.pendencias.length === 0 ? (
                    <p className="text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
                      Nenhuma pendência registrada no momento.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-amber-800 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 list-disc pl-8">
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
              <>
                <GestaoEquipe
                  painel={painel}
                  usuario={usuario}
                  onRecarregarPainel={async () => {
                    await carregarPainelSelecionado(equipeSelecionadaId);
                    await carregarContextoBase();
                  }}
                />
                {/* Remonta quando o painel muda, para refletir convites e retiradas. */}
                <ComposicaoEquipe
                  key={`${painel.equipe_id}-${painel.integrantes.length}-${painel.situacao}`}
                  equipeId={painel.equipe_id}
                  podeEditar={
                    (painel.voce_e_lider || usuario.papel === "DEV") &&
                    painel.situacao === "EM_FORMACAO" &&
                    painel.inscricoes_abertas
                  }
                  onAlterada={() => carregarPainelSelecionado(equipeSelecionadaId)}
                />
              </>
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
              hackathons={hackathons}
              hackathonInicialId={hackathonIdUrl || painel?.hackathon_id || hackathonCriacaoId}
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
          <div className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Proposta Científica da Equipe
            </h2>
            {!painel ? (
              <p className="text-xs text-gray-600">
                Selecione ou crie uma equipe primeiro para acessar o editor de proposta.
              </p>
            ) : painel.situacao === "NAO_HOMOLOGADA" ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 space-y-1">
                <p className="font-bold">
                  Proposta bloqueada — Situação atual da equipe: {painel.situacao}
                </p>
                <p className="text-gray-700">
                  Equipes não homologadas não podem criar, editar nem enviar proposta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-700">
                  {painel.situacao === "HOMOLOGADA"
                    ? "Sua equipe está homologada e pode enviar a proposta."
                    : "O líder já pode preencher e salvar o rascunho. O envio definitivo é liberado quando a equipe estiver HOMOLOGADA."}{" "}
                  Equipe: <strong className="text-gray-900">{painel.nome}</strong>.
                </p>
                <Link
                  href={`/proposta?equipe_id=${encodeURIComponent(painel.equipe_id)}`}
                  className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-900/10"
                >
                  Abrir Editor da Proposta &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ABA 5: RESULTADO CIENTÍFICO PRIVADO (PRO-04) */}
        {abaAtiva === "resultado" &&
          (painel ? (
            <ResultadoCientifico key={painel.equipe_id} equipeId={painel.equipe_id} />
          ) : (
            <div className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-6 text-xs text-gray-600">
              Selecione ou crie uma equipe para consultar o resultado.
            </div>
          ))}
      </main>
    </div>
  );
}

export default function PainelEquipePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F9F8] flex items-center justify-center text-xs text-emerald-700">
          Carregando painel...
        </div>
      }
    >
      <ConteudoPainelEquipe />
    </Suspense>
  );
}