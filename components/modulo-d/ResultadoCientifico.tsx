// components/modulo-d/ResultadoCientifico.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  formatarDataBrasilia,
  resultados,
  type RecomendacaoAvaliacao,
  type ResultadoEquipe,
} from "@/lib/api";

/**
 * PRO-04 — Resultado científico privado da equipe.
 * Mostra só o que a API devolve: divulgado ou não, aprovada ou não e os pareceres
 * anônimos. Não calcula nem infere nota média ou classificação.
 */

const ROTULO_RECOMENDACAO: Record<RecomendacaoAvaliacao, string> = {
  APROVACAO: "Recomenda aprovação",
  REPROVACAO: "Recomenda reprovação",
};

export function ResultadoCientifico({ equipeId }: { equipeId: string }) {
  const [resultado, setResultado] = useState<ResultadoEquipe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setResultado(await resultados.daEquipe(equipeId));
    } catch (err: unknown) {
      setResultado(null);
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Somente os integrantes da equipe podem consultar este resultado."
          : err instanceof Error
            ? err.message
            : "Não foi possível consultar o resultado."
      );
    } finally {
      setCarregando(false);
    }
  }, [equipeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <section className="bg-gray-50 border border-gray-200 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Resultado Científico</h2>
          <p className="text-xs text-gray-600">
            Resultado da avaliação da proposta. Visível só para a equipe.
          </p>
        </div>
        <button
          type="button"
          onClick={carregar}
          disabled={carregando}
          className="px-3.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer disabled:opacity-50"
        >
          {carregando ? "Consultando..." : "Atualizar"}
        </button>
      </div>

      {carregando && !resultado && (
        <p className="text-xs text-emerald-700 animate-pulse">Consultando resultado...</p>
      )}

      {erro && (
        <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs">
          {erro}
        </div>
      )}

      {resultado && !resultado.divulgado && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-1">
          <p className="font-bold text-gray-900">Resultado ainda não divulgado</p>
          <p>
            O resultado aparece aqui depois que a organização homologar a avaliação científica da
            edição. Até lá, nenhuma informação de avaliação é exibida.
          </p>
        </div>
      )}

      {resultado && resultado.divulgado && (
        <div className="space-y-4">
          {!resultado.submissao_id ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800">
              A equipe não tinha proposta enviada quando o resultado foi homologado.
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                resultado.aprovada
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
                  : "bg-red-500/10 border-red-500/30 text-red-700"
              }`}
            >
              <p className="text-sm font-extrabold">
                {resultado.aprovada ? "Proposta aprovada" : "Proposta não aprovada"}
              </p>
              {resultado.titulo && (
                <p>
                  Proposta: <strong>{resultado.titulo}</strong>
                </p>
              )}
              {resultado.divulgado_em && (
                <p className="opacity-80">Divulgado em {formatarDataBrasilia(resultado.divulgado_em)}</p>
              )}
            </div>
          )}

          {resultado.somente_leitura && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
              <strong className="text-gray-900">Somente leitura:</strong> como a proposta não foi
              aprovada, a equipe pode consultar seus dados, mas não pode mais editá-los nem enviar
              novos conteúdos.
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">
              Pareceres dos avaliadores ({resultado.pareceres.length})
            </h3>
            {resultado.pareceres.length === 0 ? (
              <p className="text-xs text-gray-600">Nenhum parecer foi disponibilizado.</p>
            ) : (
              resultado.pareceres.map((p, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-[#F6F9F8]/70 p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800">Parecer {i + 1}</span>
                    {p.recomendacao && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          p.recomendacao === "APROVACAO"
                            ? "border-emerald-500/40 text-emerald-700"
                            : "border-red-500/40 text-red-700"
                        }`}
                      >
                        {ROTULO_RECOMENDACAO[p.recomendacao]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                    {p.parecer || "Sem texto de parecer."}
                  </p>
                </div>
              ))
            )}
            <p className="text-[11px] text-gray-500">
              Os pareceres não identificam quem os escreveu. Nota média e classificação não são
              divulgadas à equipe.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}