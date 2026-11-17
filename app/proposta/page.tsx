// app/proposta/page.tsx
"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import {
  MinhaEquipeResumo,
  moduloCApi,
  PainelEquipeNormalizado,
  UsuarioMe,
} from "@/lib/api";
import { EditorProposta } from "@/components/modulo-d/EditorProposta";

function ConteudoPaginaProposta() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipeIdUrl = searchParams.get("equipe_id") || "";

  const [usuario, setUsuario] = useState<UsuarioMe | null>(null);
  const [minhasEquipes, setMinhasEquipes] = useState<MinhaEquipeResumo[]>([]);
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<string>("");
  const [painel, setPainel] = useState<PainelEquipeNormalizado | null>(null);

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoPainel, setCarregandoPainel] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // A URL só define a equipe inicial (evita recarregar tudo a cada troca de equipe).
  const equipeIdUrlRef = useRef(equipeIdUrl);

  const carregarBase = useCallback(async () => {
    setCarregandoInicial(true);
    setErro(null);

    try {
      const me = await moduloCApi.obterMe();
      setUsuario(me);

      if (me.papel !== "PARTICIPANTE" && me.papel !== "DEV") {
        setErro(
          `Seu perfil atual é ${me.papel}. Apenas participantes vinculados a equipes acessam o editor de propostas.`
        );
        setCarregandoInicial(false);
        return;
      }

      const listaEquipes = await moduloCApi
        .listarMinhasEquipes()
        .catch(() => [] as MinhaEquipeResumo[]);
      setMinhasEquipes(listaEquipes);

      const daUrl = equipeIdUrlRef.current;
      setEquipeSelecionadaId((atual) => {
        if (atual && listaEquipes.some((e) => e.id === atual)) return atual;
        if (daUrl && listaEquipes.some((e) => e.id === daUrl)) return daUrl;
        if (listaEquipes.length === 1) return listaEquipes[0].id;
        return "";
      });
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível validar sua sessão."
      );
    } finally {
      setCarregandoInicial(false);
    }
  }, []);

  const carregarPainel = useCallback(async (id: string) => {
    if (!id) {
      setPainel(null);
      return;
    }
    setCarregandoPainel(true);
    try {
      const dados = await moduloCApi.obterPainelEquipe(id);
      setPainel(dados);
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados da equipe."
      );
    } finally {
      setCarregandoPainel(false);
    }
  }, []);

  useEffect(() => {
    carregarBase();
  }, [carregarBase]);

  useEffect(() => {
    if (equipeSelecionadaId) {
      carregarPainel(equipeSelecionadaId);
    } else {
      setPainel(null);
    }
  }, [equipeSelecionadaId, carregarPainel]);

  const selecionarEquipe = (novoId: string) => {
    setEquipeSelecionadaId(novoId);
    const params = new URLSearchParams(searchParams.toString());
    if (novoId) {
      params.set("equipe_id", novoId);
    } else {
      params.delete("equipe_id");
    }
    router.replace(`/proposta?${params.toString()}`);
  };

  const ehLiderOuDev = React.useMemo(() => {
    if (!usuario || !painel) return false;
    if (usuario.papel === "DEV") return true;
    const euNaEquipe = painel.integrantes.find(
      (i) => i.usuario_id === usuario.id
    );
    if (euNaEquipe) return euNaEquipe.funcao === "LIDER";
    const resumo = minhasEquipes.find((e) => e.id === painel.equipe_id);
    return resumo?.minha_funcao === "LIDER";
  }, [usuario, painel, minhasEquipes]);

  if (carregandoInicial) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <p className="font-mono text-sm text-emerald-700">
          Carregando Módulo de Propostas...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center backdrop-blur-xl space-y-4">
          <h1 className="text-lg font-extrabold text-gray-900">Acesso Restrito</h1>
          <p className="text-xs text-gray-700">
            {erro || "Faça login com sua conta de participante para continuar."}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-black hover:bg-emerald-400"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Cabeçalho da Página */}
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              Módulo D • Submissão Científica
            </span>
            <h1 className="text-xl font-extrabold text-gray-900">
              Proposta da Equipe
            </h1>
          </div>
        </div>

        <Link
          href={
            equipeSelecionadaId
              ? `/equipe?equipe_id=${encodeURIComponent(equipeSelecionadaId)}`
              : "/equipe"
          }
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-800 transition-colors hover:border-emerald-400/50 hover:text-gray-900 sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel da Equipe
        </Link>
      </header>

      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200"
        >
          {erro}
        </div>
      )}

      {/* Seletor de Equipe */}
      {minhasEquipes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white/[0.04] p-8 text-center backdrop-blur-xl space-y-3">
          <p className="text-sm font-bold text-gray-900">
            Você ainda não possui nenhuma equipe vinculada.
          </p>
          <p className="text-xs text-gray-600">
            Crie ou aceite o convite de uma equipe no painel antes de elaborar
            uma proposta.
          </p>
          <Link
            href="/equipe"
            className="inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-black hover:bg-emerald-400"
          >
            Ir para Minhas Equipes
          </Link>
        </div>
      ) : (
        <>
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white/[0.04] p-4 backdrop-blur-xl sm:flex-row sm:items-center">
            <span className="text-xs font-semibold text-gray-700">
              Equipe selecionada para a proposta:
            </span>
            <select
              aria-label="Selecionar equipe"
              value={equipeSelecionadaId}
              onChange={(e) => selecionarEquipe(e.target.value)}
              className="min-w-[260px] rounded-xl border border-gray-200 bg-[#F6F9F8] px-3.5 py-2 text-xs font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
            >
              {minhasEquipes.length > 1 && (
                <option value="">-- Selecione uma equipe --</option>
              )}
              {minhasEquipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome} ({eq.situacao})
                </option>
              ))}
            </select>
          </section>

          {carregandoPainel ? (
            <p className="font-mono text-xs text-emerald-700">
              Carregando contexto da equipe...
            </p>
          ) : painel ? (
            <EditorProposta
              equipeId={painel.equipe_id}
              equipeNome={painel.nome}
              hackathonId={painel.hackathon_id}
              situacaoEquipe={painel.situacao}
              podeEditar={ehLiderOuDev}
              onPropostaAtualizada={() => carregarPainel(painel.equipe_id)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export default function PropostaPage() {
  return (
    <div className="min-h-screen bg-[#F6F9F8] text-gray-700 font-sans selection:bg-emerald-500/30">

      <Suspense
        fallback={
          <div className="relative z-10 flex min-h-screen items-center justify-center font-mono text-sm text-emerald-700">
            Carregando editor...
          </div>
        }
      >
        <ConteudoPaginaProposta />
      </Suspense>
    </div>
  );
}

