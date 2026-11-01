"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, comprovantes, type ComprovanteAdmin, type StatusComprovante } from "@/lib/api";
import { useSession } from "@/lib/useSession";

const msgErro = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Erro inesperado.";

export default function AdminComprovantesPage() {
  const { pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const [status, setStatus] = useState<StatusComprovante>("PENDENTE");
  const [lista, setLista] = useState<ComprovanteAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recusando, setRecusando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const buscar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      setLista(await comprovantes.fila({ status, limite: 100 }));
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (pronto) buscar();
  }, [pronto, buscar]);

  const decidir = async (fn: () => Promise<unknown>, ok: string) => {
    setMensagem(null);
    setErro(null);
    try {
      await fn();
      setMensagem(ok);
      setRecusando(null);
      setMotivo("");
      await buscar();
    } catch (e) {
      setErro(msgErro(e));
    }
  };

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 p-6 md:p-10 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold mb-6 inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Aprovação de Vínculos</h1>
            <p className="text-xs text-gray-400">
              Aprovar ativa a conta do participante e reavalia a homologação da equipe.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusComprovante)}
              className="bg-[#0A1110] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="PENDENTE">Pendentes</option>
              <option value="APROVADO">Aprovados</option>
              <option value="RECUSADO">Recusados</option>
            </select>
            <button onClick={buscar} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 text-xs rounded-lg text-white font-bold cursor-pointer">
              Atualizar
            </button>
          </div>
        </div>

        {mensagem && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">✅ {mensagem}</div>
        )}
        {erro && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">⚠️ {erro}</div>
        )}

        {loading ? (
          <p className="text-emerald-400 text-sm font-mono">Carregando comprovantes...</p>
        ) : lista.length === 0 ? (
          <div className="bg-[#131D1C] p-8 rounded-xl border border-gray-800 text-center">
            <p className="text-gray-400 text-sm">Nenhum comprovante nesta situação.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lista.map((c) => (
              <div key={c.id} className="bg-[#131D1C] p-6 rounded-xl border border-emerald-900/40">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-bold text-sm">{c.usuario.nome || c.usuario.email}</p>
                    <p className="text-xs text-gray-400">{c.usuario.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {[c.usuario.instituicao, c.usuario.curso, c.usuario.periodo && `${c.usuario.periodo}º período`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <a href={c.arquivo_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline mt-2 inline-block font-mono">
                      Ver comprovante enviado &rarr;
                    </a>
                    {c.motivo_recusa && <p className="text-xs text-red-400 mt-2">Motivo da recusa: {c.motivo_recusa}</p>}
                  </div>

                  {c.status === "PENDENTE" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => decidir(() => comprovantes.aprovar(c.id), "Comprovante aprovado e conta ativada.")}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          setRecusando(recusando === c.id ? null : c.id);
                          setMotivo("");
                        }}
                        className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>

                {recusando === c.id && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Motivo da recusa (obrigatório)"
                      maxLength={2000}
                      className="flex-1 bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      disabled={!motivo.trim()}
                      onClick={() => decidir(() => comprovantes.recusar(c.id, motivo.trim()), "Comprovante recusado.")}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
