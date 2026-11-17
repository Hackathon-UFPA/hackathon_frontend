"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, formatarDataBrasilia } from "@/lib/api";
import { propostasAprovadas, type PropostasAprovadas } from "@/lib/api-resultado";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Propostas aprovadas de uma edição (RF32). Página pública: a rota do backend
 * não exige login e é chamada sem token. Antes da homologação a API responde
 * `divulgado = false` com lista vazia.
 */
export default function PropostasAprovadasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [dados, setDados] = useState<PropostasAprovadas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<unknown>(null);

  // Estado só nos callbacks da promise: o efeito abaixo chama esta função.
  const carregar = useCallback(() => {
    propostasAprovadas
      .listar(id)
      .then((d) => {
        setErro(null);
        setDados(d);
      })
      .catch((e) => {
        setDados(null);
        setErro(e);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // 404 (hackathon inexistente) e 422 (id malformado) viram "não encontrado".
  const naoEncontrado = erro instanceof ApiError && (erro.status === 404 || erro.status === 422);

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <Link href="/" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar ao início
        </Link>

        <div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-700">Resultado oficial</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Propostas aprovadas</h1>
          {dados?.hackathon_nome && <p className="text-sm text-gray-600 mt-1">{dados.hackathon_nome}</p>}
        </div>

        {carregando ? (
          <p className="text-emerald-700 text-xs font-mono">Carregando resultado...</p>
        ) : naoEncontrado ? (
          <p className="text-xs text-gray-600 bg-[#F6F9F8] border border-gray-200 rounded-lg p-4">
            Edição não encontrada. Confira o link.
          </p>
        ) : erro !== null ? (
          <ApiErrorAlert
            erro={erro}
            onRetry={() => {
              setCarregando(true);
              carregar();
            }}
          />
        ) : !dados ? null : !dados.divulgado ? (
          <div className="text-xs text-amber-800 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            O resultado desta edição ainda não foi divulgado. Volte depois da homologação.
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600">
              Homologado em {formatarDataBrasilia(dados.divulgado_em)}. Lista em ordem alfabética pela equipe,
              sem notas nem classificação.
            </p>

            {dados.propostas.length === 0 ? (
              <p className="text-xs text-gray-600 bg-[#F6F9F8] border border-gray-200 rounded-lg p-4">
                Nenhuma proposta foi aprovada nesta edição.
              </p>
            ) : (
              <ul className="space-y-3">
                {dados.propostas.map((p) => (
                  <li
                    key={p.submissao_id}
                    className="bg-[#F6F9F8] border border-emerald-200 rounded-xl p-4 space-y-1"
                  >
                    <p className="text-sm font-bold text-gray-900">{p.titulo || "Sem título"}</p>
                    <p className="text-xs text-gray-700">
                      Equipe: <strong className="text-gray-900">{p.equipe || "—"}</strong>
                    </p>
                    {p.tema && <p className="text-[11px] text-emerald-700">Tema: {p.tema}</p>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
