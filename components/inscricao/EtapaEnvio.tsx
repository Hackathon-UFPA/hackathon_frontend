"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ArrowLeft, Send } from "lucide-react";
import { btn, btnGhost } from "@/components/ui";
import type { PainelEquipe, Proposta, PropostaEnviada, Tema } from "@/lib/api";
import { ODS, SITUACAO_EQUIPE, formatarDataHora } from "@/lib/rotulos";

/** Mesma lista de app/validations/submissao.py, para avisar antes de o servidor recusar. */
function camposPendentes(p: Proposta | null): string[] {
  const faltando: string[] = [];
  if (!p?.tema_id) faltando.push("tema");
  if (!p?.titulo?.trim()) faltando.push("título");
  if (!p?.descricao?.trim()) faltando.push("descrição");
  if (!p?.ods?.length) faltando.push("ODS");
  if (!p?.bases_dados?.trim()) faltando.push("bases de dados");
  return faltando;
}

function Resumo({ proposta, temas }: { proposta: Proposta; temas: Tema[] }) {
  const tema = temas.find((t) => t.id === proposta.tema_id);
  const nomesOds = (proposta.ods ?? []).map(
    (n) => `${n}. ${ODS.find((o) => o.numero === n)?.nome ?? ""}`
  );
  const linhas: [string, string | null | undefined][] = [
    ["Tema", tema?.titulo ?? (proposta.tema_id ? "Tema indisponível" : null)],
    ["Título", proposta.titulo],
    ["Descrição", proposta.descricao],
    ["ODS", nomesOds.join("; ")],
    ["Bases de dados", proposta.bases_dados],
    ["Documento", proposta.documento_url],
  ];
  return (
    <dl className="grid gap-4 rounded-xl border border-white/10 bg-black/30 p-5 text-sm">
      {linhas.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{rotulo}</dt>
          <dd className="mt-1 whitespace-pre-line break-words text-white">{valor || "Não informado"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Requisito({ cumprido, children }: { cumprido: boolean; children: React.ReactNode }) {
  const Icone = cumprido ? CheckCircle2 : Circle;
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Icone
        className={`mt-0.5 h-4 w-4 shrink-0 ${cumprido ? "text-emerald-400" : "text-amber-300"}`}
        aria-hidden="true"
      />
      <span className={cumprido ? "text-gray-300" : "text-white"}>
        <span className="sr-only">{cumprido ? "Cumprido: " : "Pendente: "}</span>
        {children}
      </span>
    </li>
  );
}

export default function EtapaEnvio({
  painel,
  rascunho,
  enviada,
  temas,
  alteracoesNaoSalvas,
  ocupado,
  onEnviar,
  onVoltar,
}: {
  painel: PainelEquipe;
  rascunho: Proposta | null;
  enviada: PropostaEnviada | null;
  temas: Tema[];
  alteracoesNaoSalvas: boolean;
  ocupado: boolean;
  onEnviar: () => void;
  onVoltar: () => void;
}) {
  const [confirmado, setConfirmado] = useState(false);

  if (enviada) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5" role="status">
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-300">Protocolo da proposta</p>
          <p className="mt-2 break-all font-mono text-2xl font-extrabold tracking-tight text-white">
            {enviada.protocolo.numero}
          </p>
          <p className="mt-1 text-xs text-gray-300">
            Protocolo emitido em {formatarDataHora(enviada.protocolo.emitido_em)}. A proposta não pode mais ser alterada.
          </p>
        </div>
        <Resumo proposta={enviada} temas={temas} />
      </div>
    );
  }

  const faltando = camposPendentes(rascunho);
  const homologada = painel.situacao === "HOMOLOGADA";
  const temaAtivo = !rascunho?.tema_id || temas.some((t) => t.id === rascunho.tema_id);
  const pronto = homologada && faltando.length === 0 && temaAtivo && !alteracoesNaoSalvas;

  return (
    <div className="space-y-6">
      <ul className="space-y-2.5">
        <Requisito cumprido={homologada}>
          Equipe homologada. Situação atual: {SITUACAO_EQUIPE[painel.situacao]}.
        </Requisito>
        <Requisito cumprido={faltando.length === 0}>
          {faltando.length === 0 ? "Proposta completa." : `Falta preencher: ${faltando.join(", ")}.`}
        </Requisito>
        <Requisito cumprido={temaAtivo}>
          {temaAtivo ? "Tema disponível." : "O tema escolhido foi desativado. Escolha outro."}
        </Requisito>
        <Requisito cumprido={!alteracoesNaoSalvas}>
          {alteracoesNaoSalvas ? "Há alterações não salvas no formulário." : "Revisão igual à versão salva."}
        </Requisito>
      </ul>

      {rascunho ? (
        <Resumo proposta={rascunho} temas={temas} />
      ) : (
        <p className="text-sm text-amber-300">Nenhum rascunho salvo ainda.</p>
      )}

      {painel.voce_e_lider ? (
        <div className="space-y-4">
          <label className="flex items-start gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmado}
              disabled={!pronto}
              onChange={(e) => setConfirmado(e.target.checked)}
            />
            Revisei a proposta e sei que, depois de enviada, ela não pode mais ser alterada.
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn} disabled={!pronto || !confirmado || ocupado} onClick={onEnviar}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {ocupado ? "Enviando..." : "Enviar proposta"}
            </button>
            <button type="button" className={btnGhost} onClick={onVoltar}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Voltar à proposta
            </button>
          </div>
          <p className="text-xs text-gray-400">
            O período de envio é conferido pelo servidor no momento do envio.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Somente o líder técnico pode enviar a proposta.</p>
      )}
    </div>
  );
}
