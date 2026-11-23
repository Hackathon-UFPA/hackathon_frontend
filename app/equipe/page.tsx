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

  // Vindo do cadastro ("Cadastrar e criar equipe"): destaca a criação da equipe.
  const querCriarEquipe = searchParams.get("intencao") === "criar-equipe";

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
      if (
        primeiraCarga.current &&
        !querCriarEquipe &&
        (me.situacao_conta === "PENDENTE" || hackathonIdUrlRef.current)
      ) {
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
      setHackathonCriacaoId((atual) => atual || hackathonIdUrlRef.current || edicaoAberta?.id || "");


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
  }, [querCriarEquipe]);


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


        {/* Destaque do fluxo "Cadastrar e criar equipe" */}
        {querCriarEquipe && !equipeSelecionadaId && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Criar equipe
                </p>
                <h2 className="text-lg font-extrabold text-gray-900 mt-1">
                  Vamos criar sua equipe
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                  {usuario.situacao_conta === "PENDENTE"
                    ? "Sua conta está aguardando a aprovação do comprovante. Depois da aprovação, você poderá criar a equipe, convidar integrantes por nome e e-mail e acompanhar a inscrição."
                    : "Sua conta está ativa. Você pode criar a equipe agora, informar o nome e o e-mail dos integrantes e enviar os convites."}
                </p>
              </div>


              <div className="shrink-0">
                <BadgeSituacaoConta situacao={usuario.situacao_conta} />
              </div>
            </div>
          </section>
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
        {/* Próxima ação recomendada */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Próximo passo
          </p>

          <h2 className="text-lg font-extrabold text-gray-900 mt-1">
            {usuario.situacao_conta === "PENDENTE"
              ? "Sua conta está aguardando validação"
              : "Sua conta está ativa"}
          </h2>

          <p className="text-xs text-gray-600 mt-2 max-w-3xl">
            {usuario.situacao_conta === "PENDENTE"
              ? "O Comitê Científico precisa aprovar seu comprovante de vínculo. Após a aprovação, você poderá criar uma equipe ou aceitar um convite recebido."
              : "Você pode criar uma equipe ou aceitar um convite recebido. Após formar a equipe, conclua a inscrição para aguardar a homologação."}
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={() => setAbaAtiva("convites-conta")}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              Ver comprovante
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva("convites-conta")}
              className="rounded-xl border border-emerald-600 bg-transparent px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
            >
              Ver convites recebidos
            </button>

            {usuario.situacao_conta === "ATIVA" && (
              <button
                type="button"
                onClick={() => setAbaAtiva("inscricao")}
                className="rounded-xl border border-emerald-600 bg-transparent px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
              >
                Criar equipe
              </button>
            )}
          </div>
        </section>

        {/* Resumo da conta */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Minha conta
            </p>
            <h2 className="text-base font-bold text-gray-900 mt-1">
              {usuario.nome}
            </h2>
            <p className="text-xs text-gray-600">
              {usuario.email}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold text-gray-900">
                Situação da conta
              </p>
              <div className="mt-2">
                <BadgeSituacaoConta situacao={usuario.situacao_conta} />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {usuario.situacao_conta === "PENDENTE"
                  ? "Seu comprovante de vínculo está em análise."
                  : "Sua conta está ativa e pronta para participar."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold text-gray-900">
                Comprovante de vínculo
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {usuario.situacao_conta === "PENDENTE"
                  ? "Aguarde a análise do Comitê Científico."
                  : "Seu comprovante foi aprovado."}
              </p>
              <button
                type="button"
                onClick={() => setAbaAtiva("convites-conta")}
                className="mt-3 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Ver comprovante &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* Pendências prioritárias */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            Pendências prioritárias
          </h2>

          <ul className="space-y-2 text-xs text-gray-700">
            {usuario.situacao_conta === "PENDENTE" && (
              <li className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800">
                Aguardando aprovação do comprovante de vínculo.
              </li>
            )}

            {usuario.situacao_conta === "ATIVA" && (
              <li className="rounded-xl border border-gray-200 bg-white p-3">
                Nenhuma pendência de conta registrada.
              </li>
            )}

            <li className="rounded-xl border border-gray-200 bg-white p-3">
              {usuario.situacao_conta === "PENDENTE"
                ? "A criação de equipe será liberada após a aprovação do comprovante."
                : "Você ainda não possui equipe. Crie uma equipe ou aceite um convite."}
            </li>
          </ul>
        </section>

        {/* Prazos importantes */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            Prazos importantes
          </h2>

          <p className="text-xs text-gray-600">
            Acompanhe os prazos da edição selecionada para não perder etapas de inscrição, homologação e envio de proposta.
          </p>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-bold text-gray-900">
              Hackathon IA Amazônia 2027
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Consulte o cronograma completo na página do hackathon.
            </p>
          </div>
        </section>

        {/* Atalho para convites */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Convites recebidos
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Quando um líder convidar seu e-mail para uma equipe, o convite aparecerá em “Conta & Convites”.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAbaAtiva("convites-conta")}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
          >
            Abrir convites
          </button>
        </section>
      </>
    ) : carregandoPainel || !painel ? (
      <p className="text-xs text-emerald-700 animate-pulse">
        Carregando painel da equipe...
      </p>
    ) : (
      <>
        {/* Cards de Situações Independentes */}
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

        {/* Próxima ação da equipe */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Próximo passo
          </p>

          <h2 className="text-lg font-extrabold text-gray-900 mt-1">
            {painel.situacao === "EM_FORMACAO"
              ? "Conclua a inscrição da equipe"
              : painel.situacao === "AGUARDANDO_HOMOLOGACAO"
                ? "Aguarde a homologação da equipe"
                : painel.situacao === "HOMOLOGADA"
                  ? painel.protocolo_proposta
                    ? "Acompanhe o resultado científico"
                    : "Crie e envie a proposta científica"
                  : "Consulte os detalhes da inscrição"}
          </h2>

          <p className="text-xs text-gray-600 mt-2 max-w-3xl">
            {painel.situacao === "EM_FORMACAO" &&
              "Conclua a formação da equipe, aceite os termos e envie a inscrição para aguardar a homologação."}
            {painel.situacao === "AGUARDANDO_HOMOLOGACAO" &&
              "Sua inscrição foi concluída. A equipe será homologada após a validação da organização."}
            {painel.situacao === "HOMOLOGADA" &&
              !painel.protocolo_proposta &&
              "Sua equipe está homologada. Agora você pode criar e enviar a proposta científica."}
            {painel.situacao === "HOMOLOGADA" &&
              painel.protocolo_proposta &&
              "Sua proposta foi enviada. Acompanhe o resultado na aba Resultado Científico."}
            {painel.situacao === "NAO_HOMOLOGADA" &&
              "A inscrição da equipe não foi homologada. Consulte os detalhes e pendências."}
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={() => setAbaAtiva("inscricao")}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              Gerenciar equipe
            </button>

            {painel.situacao === "HOMOLOGADA" && (
              <button
                type="button"
                onClick={() => setAbaAtiva("proposta")}
                className="rounded-xl border border-emerald-600 bg-transparent px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
              >
                {painel.protocolo_proposta
                  ? "Ver resultado científico"
                  : "Abrir proposta"}
              </button>
            )}
          </div>
        </section>

        <MentorEquipe key={painel.equipe_id} equipeId={painel.equipe_id} />

        {/* Protocolos */}
        {painel.protocolo_inscricao && (
          <ReciboProtocolo
            tipo="INSCRICAO_EQUIPE"
            numero={painel.protocolo_inscricao.numero}
            emitidoEm={painel.protocolo_inscricao.emitido_em}
          />
        )}

        {painel.protocolo_proposta && (
          <ReciboProtocolo
            tipo="PROPOSTA"
            numero={painel.protocolo_proposta.numero}
            emitidoEm={painel.protocolo_proposta.emitido_em}
          />
        )}

        {/* Pendências da equipe */}
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
              <>
                {querCriarEquipe && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                    <h2 className="text-base font-extrabold text-gray-900">
                      Crie sua equipe
                    </h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {usuario.situacao_conta === "PENDENTE"
                        ? "Sua conta está pendente. Após a aprovação do comprovante, você poderá criar a equipe e convidar integrantes."
                        : "Informe os dados da equipe e o nome/e-mail dos integrantes que deseja convidar."}
                    </p>
                  </div>
                )}


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


                {/* O convidado também pode ver e responder convites nesta tela. */}
               
              </>
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