// app/equipe/page.tsx
"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

type AbaPainel =
  | "visao-geral"
  | "inscricao"
  | "convites-conta"
  | "proposta"
  | "resultado";

const ABAS_VALIDAS: AbaPainel[] = [
  "visao-geral",
  "inscricao",
  "convites-conta",
  "proposta",
  "resultado",
];

function FundoPadrao() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]"
    />
  );
}

function ConteudoPainelEquipe() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const equipeIdUrl = searchParams.get("equipe_id");
  const hackathonIdUrl = searchParams.get("hackathon_id") ?? "";
  const hackathonIdUrlRef = useRef(hackathonIdUrl);

  const querCriarEquipe =
    searchParams.get("intencao") === "criar-equipe";

  const [usuario, setUsuario] = useState<UsuarioMe | null>(null);
  const [hackathons, setHackathons] = useState<HackathonResumo[]>([]);
  const [minhasEquipes, setMinhasEquipes] = useState<
    MinhaEquipeResumo[]
  >([]);

  const [equipeSelecionadaId, setEquipeSelecionadaId] =
    useState<string>("");
  const [hackathonCriacaoId, setHackathonCriacaoId] =
    useState<string>("");
  const [painel, setPainel] =
    useState<PainelEquipeNormalizado | null>(null);

  const abaUrl = searchParams.get("aba") as AbaPainel | null;

  const abaInicial: AbaPainel =
    abaUrl && ABAS_VALIDAS.includes(abaUrl)
      ? abaUrl
      : "visao-geral";

  const [abaAtivaEstado, setAbaAtivaEstado] =
    useState<AbaPainel>(abaInicial);
  const [abaAnterior, setAbaAnterior] = useState<string | null>(
    abaInicial
  );

  const abaAtiva: AbaPainel =
    abaUrl && ABAS_VALIDAS.includes(abaUrl)
      ? abaUrl
      : abaAtivaEstado;

  if (abaUrl !== abaAnterior) {
    setAbaAnterior(abaUrl);

    if (abaUrl && ABAS_VALIDAS.includes(abaUrl)) {
      setAbaAtivaEstado(abaUrl);
    }
  }

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoPainel, setCarregandoPainel] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const equipeIdUrlRef = useRef(equipeIdUrl);
  const primeiraCarga = useRef(true);

  const selecionarAba = (novaAba: AbaPainel) => {
    setAbaAtivaEstado(novaAba);

    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", novaAba);

    router.replace(`/equipe?${params.toString()}`, {
      scroll: false,
    });
  };

  const carregarContextoBase = useCallback(async () => {
    await Promise.resolve();

    if (primeiraCarga.current) {
      setCarregandoInicial(true);
    }

    setErroGeral(null);

    try {
      const me = await moduloCApi.obterMe();
      setUsuario(me);

      if (
        primeiraCarga.current &&
        !querCriarEquipe &&
        (me.situacao_conta === "PENDENTE" ||
          hackathonIdUrlRef.current)
      ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("aba", "convites-conta");

        setAbaAtivaEstado("convites-conta");
        router.replace(`/equipe?${params.toString()}`, {
          scroll: false,
        });
      }

      if (
        me.papel !== "PARTICIPANTE" &&
        me.papel !== "DEV"
      ) {
        setErroGeral(
          `Seu perfil atual é ${me.papel}. Esta área é exclusiva para participantes.`
        );
        setCarregandoInicial(false);
        return;
      }

      const [listaEquipes, , listaHackathons] = await Promise.all([
  moduloCApi.listarMinhasEquipes().catch(() => [] as MinhaEquipeResumo[]),
  moduloCApi.listarMeusConvites().catch(() => [] as ConviteRecebido[]),
  moduloCApi.listarHackathons().catch(() => [] as HackathonResumo[]),
]);

      setMinhasEquipes(listaEquipes);
      setHackathons(listaHackathons);

      const edicaoAberta = listaHackathons.find(
        (hackathon) => hackathon.status === "INSCRICOES"
      );

      setHackathonCriacaoId(
        (atual) =>
          atual ||
          hackathonIdUrlRef.current ||
          edicaoAberta?.id ||
          ""
      );

      const daUrl = equipeIdUrlRef.current;

      setEquipeSelecionadaId((atual) => {
        if (
          atual &&
          listaEquipes.some((equipe) => equipe.id === atual)
        ) {
          return atual;
        }

        if (
          daUrl &&
          listaEquipes.some((equipe) => equipe.id === daUrl)
        ) {
          return daUrl;
        }

        if (listaEquipes.length === 1) {
          return listaEquipes[0].id;
        }

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
  }, [querCriarEquipe, router, searchParams]);

  const carregarPainelSelecionado = useCallback(
    async (id: string) => {
      await Promise.resolve();

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
          err instanceof Error
            ? err.message
            : "Erro ao carregar painel da equipe."
        );
      } finally {
        setCarregandoPainel(false);
      }
    },
    []
  );

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
      <div className="relative flex min-h-screen items-center justify-center bg-[#F6F9F8] p-6 text-gray-700">
        <FundoPadrao />

        <p className="relative z-10 animate-pulse text-sm font-semibold text-emerald-700">
          Carregando área do participante...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#F6F9F8] p-6 text-gray-700">
        <FundoPadrao />

        <div className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
            Sessão Necessária
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">
            Acesso Restrito
          </h1>

          <p className="text-xs leading-relaxed text-gray-600">
            {erroGeral ||
              "Faça login com sua conta de participante para continuar."}
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block w-full rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-500 sm:w-auto"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {erroGeral && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700"
        >
          {erroGeral}
        </div>
      )}

      {querCriarEquipe && !equipeSelecionadaId && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-lg">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Criar equipe
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-gray-900">
                Vamos criar sua equipe
              </h2>

              <p className="mt-1 max-w-2xl text-xs text-gray-600">
                {usuario.situacao_conta === "PENDENTE"
                  ? "Sua conta está aguardando a aprovação do comprovante. Depois da aprovação, você poderá criar a equipe, convidar integrantes por nome e e-mail e acompanhar a inscrição."
                  : "Sua conta está ativa. Você pode criar a equipe agora, informar o nome e o e-mail dos integrantes e enviar os convites."}
              </p>
            </div>

            <div className="shrink-0">
              <BadgeSituacaoConta
                situacao={usuario.situacao_conta}
              />
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-lg backdrop-blur-md md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Contexto de Edição e Equipe (EQP-03)
          </p>

          <p className="mt-0.5 text-xs text-gray-600">
            {minhasEquipes.length === 0
              ? "Você ainda não participa de nenhuma equipe."
              : minhasEquipes.length === 1
                ? "Equipe vinculada carregada."
                : `Você possui ${minhasEquipes.length} equipes vinculadas. Selecione qual deseja gerenciar:`}
          </p>
        </div>

        {minhasEquipes.length > 0 && (
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="seletor-equipe-ativa"
              className="sr-only"
            >
              Selecionar equipe e edição
            </label>

            <select
              id="seletor-equipe-ativa"
              value={equipeSelecionadaId}
              onChange={(evento) =>
                selecionarEquipe(evento.target.value)
              }
              className="min-w-[260px] rounded-lg border border-gray-200 bg-[#F6F9F8] px-3.5 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none"
            >
              {minhasEquipes.length > 1 && (
                <option value="">
                  -- Escolha uma equipe / edição --
                </option>
              )}

              {minhasEquipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome} —{" "}
                  {equipe.hackathon_nome || equipe.hackathon_id} (
                  {equipe.situacao})
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {abaAtiva === "visao-geral" && (
        <div className="space-y-6">
          {!equipeSelecionadaId ? (
            <>
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-lg">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Próximo passo
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-gray-900">
                  {usuario.situacao_conta === "PENDENTE"
                    ? "Sua conta está aguardando validação"
                    : "Sua conta está ativa"}
                </h2>

                <p className="mt-2 max-w-3xl text-xs text-gray-600">
                  {usuario.situacao_conta === "PENDENTE"
                    ? "O Comitê Científico precisa aprovar seu comprovante de vínculo. Após a aprovação, você poderá criar uma equipe ou aceitar um convite recebido."
                    : "Você pode criar uma equipe ou aceitar um convite recebido. Após formar a equipe, conclua a inscrição para aguardar a homologação."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      selecionarAba("convites-conta")
                    }
                    className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Ver comprovante
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selecionarAba("convites-conta")
                    }
                    className="cursor-pointer rounded-xl border border-emerald-600 bg-transparent px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Ver convites recebidos
                  </button>

                  {usuario.situacao_conta === "ATIVA" && (
                    <button
                      type="button"
                      onClick={() => selecionarAba("inscricao")}
                      className="cursor-pointer rounded-xl border border-emerald-600 bg-transparent px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Criar equipe
                    </button>
                  )}
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Minha conta
                  </p>

                  <h2 className="mt-1 text-base font-bold text-gray-900">
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

                    <p className="mt-2 text-xs text-gray-600">
                      {usuario.situacao_conta === "PENDENTE"
                        ? "Seu comprovante de vínculo está em análise."
                        : "Sua conta está ativa e pronta para participar."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-bold text-gray-900">
                      Comprovante de vínculo
                    </p>

                    <p className="mt-2 text-xs text-gray-600">
                      {usuario.situacao_conta === "PENDENTE"
                        ? "Aguarde a análise do Comitê Científico."
                        : "Seu comprovante foi aprovado."}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        selecionarAba("convites-conta")
                      }
                      className="mt-3 cursor-pointer text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Ver comprovante &rarr;
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg">
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

              <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg">
                <h2 className="text-base font-bold text-gray-900">
                  Prazos importantes
                </h2>

                <p className="text-xs text-gray-600">
                  Acompanhe os prazos da edição selecionada para não
                  perder etapas de inscrição, homologação e envio de
                  proposta.
                </p>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-900">
                    Hackathon IA Amazônia 2027
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Consulte o cronograma completo na página do
                    hackathon.
                  </p>
                </div>
              </section>

              <section className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Convites recebidos
                  </h2>

                  <p className="mt-1 text-xs text-gray-600">
                    Quando um líder convidar seu e-mail para uma
                    equipe, o convite aparecerá em “Conta & Convites”.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    selecionarAba("convites-conta")
                  }
                  className="shrink-0 cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  Abrir convites
                </button>
              </section>
            </>
          ) : carregandoPainel || !painel ? (
            <p className="animate-pulse text-xs text-emerald-700">
              Carregando painel da equipe...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-gray-50 p-5 backdrop-blur-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    1. Situação da Sua Conta
                  </span>

                  <p className="text-xs text-gray-600">
                    {usuario.situacao_conta === "ATIVA"
                      ? "Conta ativa. O vínculo é conferido por hackathon, na aba Conta & Convites."
                      : "Aguardando aprovação do comprovante."}
                  </p>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-gray-50 p-5 backdrop-blur-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    2. Inscrição da Equipe
                  </span>

                  <div>
                    <BadgeSituacaoEquipe
                      situacao={painel.situacao}
                    />
                  </div>

                  <p className="text-xs text-gray-600">
                    {painel.situacao === "EM_FORMACAO" &&
                      "Conclua a formação e aceite os termos para enviar."}
                    {painel.situacao ===
                      "AGUARDANDO_HOMOLOGACAO" &&
                      "Inscrição concluída; aguardando homologação oficial."}
                    {painel.situacao === "HOMOLOGADA" &&
                      "Equipe homologada e apta para submeter proposta."}
                    {painel.situacao === "NAO_HOMOLOGADA" &&
                      "Inscrição não homologada. Consulte os detalhes com a organização."}
                  </p>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-gray-50 p-5 backdrop-blur-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    3. Proposta Científica
                  </span>

                  <div>
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
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

              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-lg">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Próximo passo
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-gray-900">
                  {painel.situacao === "EM_FORMACAO"
                    ? "Conclua a inscrição da equipe"
                    : painel.situacao ===
                        "AGUARDANDO_HOMOLOGACAO"
                      ? "Aguarde a homologação da equipe"
                      : painel.situacao === "HOMOLOGADA"
                        ? painel.protocolo_proposta
                          ? "Acompanhe o resultado científico"
                          : "Crie e envie a proposta científica"
                        : "Consulte os detalhes da inscrição"}
                </h2>

                <p className="mt-2 max-w-3xl text-xs text-gray-600">
                  {painel.situacao === "EM_FORMACAO" &&
                    "Conclua a formação da equipe, aceite os termos e envie a inscrição para aguardar a homologação."}
                  {painel.situacao ===
                    "AGUARDANDO_HOMOLOGACAO" &&
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

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => selecionarAba("inscricao")}
                    className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Gerenciar equipe
                  </button>

                  {painel.situacao === "HOMOLOGADA" && (
                    <button
                      type="button"
                      onClick={() => selecionarAba("proposta")}
                      className="cursor-pointer rounded-xl border border-emerald-600 bg-transparent px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      {painel.protocolo_proposta
                        ? "Ver resultado científico"
                        : "Abrir proposta"}
                    </button>
                  )}
                </div>
              </section>

              <MentorEquipe
                key={painel.equipe_id}
                equipeId={painel.equipe_id}
              />

              {painel.protocolo_inscricao && (
                <ReciboProtocolo
                  tipo="INSCRICAO_EQUIPE"
                  numero={painel.protocolo_inscricao.numero}
                  emitidoEm={
                    painel.protocolo_inscricao.emitido_em
                  }
                />
              )}

              {painel.protocolo_proposta && (
                <ReciboProtocolo
                  tipo="PROPOSTA"
                  numero={painel.protocolo_proposta.numero}
                  emitidoEm={
                    painel.protocolo_proposta.emitido_em
                  }
                />
              )}

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">
                    Pendências da Equipe (
                    {painel.pendencias.length})
                  </h2>

                  <button
                    type="button"
                    onClick={() => selecionarAba("inscricao")}
                    className="cursor-pointer text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Gerenciar integrantes &rarr;
                  </button>
                </div>

                {painel.pendencias.length === 0 ? (
                  <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700">
                    Nenhuma pendência registrada no momento.
                  </p>
                ) : (
                  <ul className="list-disc space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 pl-8 text-xs text-amber-800">
                    {painel.pendencias.map(
                      (pendencia, indice) => (
                        <li key={indice}>
                          {pendencia}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {abaAtiva === "inscricao" && (
        <div className="space-y-6">
          {equipeSelecionadaId && painel ? (
            <>
              <GestaoEquipe
                painel={painel}
                usuario={usuario}
                onRecarregarPainel={async () => {
                  await carregarPainelSelecionado(
                    equipeSelecionadaId
                  );
                  await carregarContextoBase();
                }}
              />

              <ComposicaoEquipe
                key={`${painel.equipe_id}-${painel.integrantes.length}-${painel.situacao}`}
                equipeId={painel.equipe_id}
                podeEditar={
                  (painel.voce_e_lider ||
                    usuario.papel === "DEV") &&
                  painel.situacao === "EM_FORMACAO" &&
                  painel.inscricoes_abertas
                }
                onAlterada={() =>
                  carregarPainelSelecionado(
                    equipeSelecionadaId
                  )
                }
              />
            </>
          ) : (
            <>
              {querCriarEquipe && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <h2 className="text-base font-extrabold text-gray-900">
                    Crie sua equipe
                  </h2>

                  <p className="mt-1 text-xs text-gray-600">
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
            </>
          )}
        </div>
      )}

      {abaAtiva === "convites-conta" && (
        <div className="space-y-6">
          <ComprovanteCard
            hackathons={hackathons}
            hackathonInicialId={
              hackathonIdUrl ||
              painel?.hackathon_id ||
              hackathonCriacaoId
            }
            onAtualizarUsuario={carregarContextoBase}
          />

          <ConvitesRecebidos
            situacaoConta={usuario.situacao_conta}
            onConviteRespondido={async () => {
              await carregarContextoBase();
              selecionarAba("visao-geral");
            }}
          />
        </div>
      )}

      {abaAtiva === "proposta" && (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-lg font-bold text-gray-900">
            Proposta Científica da Equipe
          </h2>

          {!painel ? (
            <p className="text-xs text-gray-600">
              Selecione ou crie uma equipe primeiro para acessar o
              editor de proposta.
            </p>
          ) : painel.situacao === "NAO_HOMOLOGADA" ? (
            <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800">
              <p className="font-bold">
                Proposta bloqueada — Situação atual da equipe:{" "}
                {painel.situacao}
              </p>

              <p className="text-gray-700">
                Equipes não homologadas não podem criar, editar nem
                enviar proposta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-700">
                {painel.situacao === "HOMOLOGADA"
                  ? "Sua equipe está homologada e pode enviar a proposta."
                  : "O líder já pode preencher e salvar o rascunho. O envio definitivo é liberado quando a equipe estiver HOMOLOGADA."}{" "}
                Equipe:{" "}
                <strong className="text-gray-900">
                  {painel.nome}
                </strong>
                .
              </p>

              <Link
                href={`/proposta?equipe_id=${encodeURIComponent(
                  painel.equipe_id
                )}`}
                className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-500"
              >
                Abrir Editor da Proposta &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {abaAtiva === "resultado" &&
        (painel ? (
          <ResultadoCientifico
            key={painel.equipe_id}
            equipeId={painel.equipe_id}
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-xs text-gray-600 backdrop-blur-md">
            Selecione ou crie uma equipe para consultar o resultado.
          </div>
        ))}
    </div>
  );
}

export default function PainelEquipePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F9F8] text-xs text-emerald-700">
          Carregando painel...
        </div>
      }
    >
      <ConteudoPainelEquipe />
    </Suspense>
  );
}