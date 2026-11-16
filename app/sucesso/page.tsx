"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { equipes, formatarDataBrasilia, type Equipe, type PainelEquipe } from "@/lib/api";
import { useSession } from "@/lib/useSession";

/**
 * EQP-05 — Confirmação da inscrição da equipe.
 * O protocolo, o horário e a situação vêm do servidor (painel da equipe).
 * Não escolhe a "primeira equipe": localiza a equipe pelo protocolo ou pelo equipe_id da URL.
 */

type Achado = { equipe: Equipe; painel: PainelEquipe };

const TEXTO_SITUACAO: Record<PainelEquipe["situacao"], { titulo: string; texto: string }> = {
  EM_FORMACAO: {
    titulo: "Em formação",
    texto: "A inscrição ainda não foi concluída.",
  },
  AGUARDANDO_HOMOLOGACAO: {
    titulo: "Inscrição concluída — aguardando homologação",
    texto:
      "A inscrição foi registrada, mas a equipe ainda não está homologada. A homologação acontece automaticamente quando todos os integrantes tiverem o comprovante aprovado e os termos aceitos.",
  },
  HOMOLOGADA: {
    titulo: "Inscrição concluída e homologada",
    texto: "A equipe está homologada e pode enviar a proposta dentro do período de propostas.",
  },
  NAO_HOMOLOGADA: {
    titulo: "Inscrição não homologada",
    texto: "A inscrição foi concluída, mas a equipe não foi homologada. Procure a organização.",
  },
};

function ConteudoSucesso() {
  const { pronto } = useSession(["PARTICIPANTE"]);
  const searchParams = useSearchParams();
  const protocoloUrl = searchParams.get("protocolo");
  const equipeIdUrl = searchParams.get("equipe_id");

  const [achado, setAchado] = useState<Achado | null>(null);
  const [opcoes, setOpcoes] = useState<Achado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pronto) return;
    let ativo = true;
    (async () => {
      try {
        const minhas = await equipes.minhas();
        const candidatas = equipeIdUrl ? minhas.filter((e) => e.id === equipeIdUrl) : minhas;
        const paineis = await Promise.all(
          candidatas.map(async (equipe) => ({ equipe, painel: await equipes.painel(equipe.id) }))
        );
        const comProtocolo = paineis.filter((p) => p.painel.protocolo?.numero);
        const encontrados = protocoloUrl
          ? comProtocolo.filter((p) => p.painel.protocolo?.numero === protocoloUrl)
          : comProtocolo;
        if (!ativo) return;
        if (encontrados.length === 1) setAchado(encontrados[0]);
        else setOpcoes(encontrados);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível consultar a inscrição.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [pronto, protocoloUrl, equipeIdUrl]);

  if (!pronto) return null;

  const caixa =
    "bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-2xl w-full max-w-lg backdrop-blur-xl relative z-10";

  if (carregando) {
    return (
      <div className={`${caixa} text-center`}>
        <p className="text-emerald-400 text-sm font-mono animate-pulse">Consultando a inscrição no servidor...</p>
      </div>
    );
  }

  if (erro || !achado) {
    return (
      <div className={`${caixa} space-y-4`}>
        <h1 className="text-xl font-bold text-white">Confirmação da inscrição</h1>
        {erro ? (
          <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{erro}</p>
        ) : opcoes.length > 1 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Você tem mais de uma inscrição concluída. Escolha qual consultar:</p>
            {opcoes.map((o) => (
              <Link
                key={o.equipe.id}
                href={`/sucesso?equipe_id=${encodeURIComponent(o.equipe.id)}`}
                className="block p-3 rounded-lg bg-[#0A1110] border border-gray-800 hover:border-emerald-500/50 text-xs text-white"
              >
                {o.painel.nome || "Equipe sem nome"} — {o.painel.protocolo?.numero}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            Não encontramos uma inscrição concluída{protocoloUrl ? ` com o protocolo ${protocoloUrl}` : ""} nas suas
            equipes. Confira no painel da equipe se a inscrição já foi concluída.
          </p>
        )}
        <Link
          href="/equipe"
          className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs text-center"
        >
          Ir para o Painel da Equipe &rarr;
        </Link>
      </div>
    );
  }

  const { equipe, painel } = achado;
  const situacao = TEXTO_SITUACAO[painel.situacao];
  const homologada = painel.situacao === "HOMOLOGADA";
  const pendenciasHomologacao = painel.pendencias.filter((p) => !p.bloqueia_conclusao);

  return (
    <div className={`${caixa} space-y-6`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[11px] uppercase font-semibold text-emerald-500 tracking-wider">Inscrição da equipe</p>
        <h1 className="text-2xl font-bold text-white">Inscrição concluída</h1>
        <p className="text-xs text-gray-400 mt-1">Equipe {painel.nome || "sem nome"}</p>
      </div>

      <div className="bg-[#0A1110] p-4 rounded-xl border border-emerald-900/40 text-center">
        <p className="text-[10px] uppercase font-semibold text-emerald-500 tracking-wider mb-1">
          Protocolo de inscrição da equipe
        </p>
        <p className="text-xl font-extrabold text-white font-mono tracking-widest">{painel.protocolo?.numero}</p>
        <p className="text-[11px] text-gray-400 mt-1">
          Registrado pelo servidor em {formatarDataBrasilia(painel.protocolo?.emitido_em ?? painel.inscricao_concluida_em)}
        </p>
      </div>

      <div
        className={`p-4 rounded-xl border text-xs space-y-1 ${
          homologada
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            : "bg-amber-500/10 border-amber-500/30 text-amber-200"
        }`}
      >
        <p className="font-bold">Situação: {situacao.titulo}</p>
        <p className="leading-relaxed">{situacao.texto}</p>
        {!homologada && pendenciasHomologacao.length > 0 && (
          <ul className="pt-1 space-y-0.5">
            {pendenciasHomologacao.map((p, i) => (
              <li key={i}>• {p.mensagem}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider">Próxima ação</p>
        {homologada ? (
          <Link
            href={`/proposta?equipe_id=${encodeURIComponent(equipe.id)}`}
            className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs text-center"
          >
            Preparar e enviar a proposta &rarr;
          </Link>
        ) : (
          <p className="text-xs text-gray-300">
            Acompanhe as pendências de homologação no painel da equipe.
          </p>
        )}
        <Link
          href={`/equipe?equipe_id=${encodeURIComponent(equipe.id)}`}
          className="block w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold rounded-lg text-xs text-center"
        >
          Painel da equipe
        </Link>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col items-center justify-center p-6 relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/80 to-[#0A1110]"></div>
      </div>

      <Suspense fallback={<p className="text-emerald-400 font-mono text-xs">Carregando...</p>}>
        <ConteudoSucesso />
      </Suspense>
    </main>
  );
}