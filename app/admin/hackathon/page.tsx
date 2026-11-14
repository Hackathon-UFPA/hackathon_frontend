"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface HackathonItem {
  id: string;
  nome: string;
  status: string;
  min_integrantes?: number;
  max_integrantes?: number;
}

interface TermoItem {
  id: string;
  tipo: string;
  titulo: string;
  versao: string;
}

interface SessaoUsuario {
  id?: string;
  email?: string;
  papel?: string;
  situacao_conta?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

function obterToken(): string | null {
  if (typeof window === "undefined") return null;

  const chavesDiretas = ["token", "access_token", "auth_token", "jwt"];
  for (const chave of chavesDiretas) {
    const val = localStorage.getItem(chave) || sessionStorage.getItem(chave);
    if (val && val.startsWith("eyJ") && val.split(".").length === 3) return val;
  }

  for (const storage of [localStorage, sessionStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      const val = storage.getItem(key);
      if (!val) continue;
      if (val.startsWith("eyJ") && val.split(".").length === 3) return val;
      try {
        const parsed = JSON.parse(val);
        const candidato =
          parsed?.token ||
          parsed?.access_token ||
          parsed?.accessToken ||
          parsed?.jwt ||
          parsed?.session?.access_token ||
          parsed?.state?.token;
        if (typeof candidato === "string" && candidato.startsWith("eyJ")) {
          return candidato;
        }
      } catch {
        // Ignora valores não-JSON
      }
    }
  }
  return null;
}

function criarHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function extrairErroDetalhado(res: Response, endpoint: string): Promise<string> {
  let detalhe = "";
  try {
    const data = await res.json();
    if (typeof data.detail === "string") {
      detalhe = data.detail;
    } else if (Array.isArray(data.detail)) {
      detalhe = data.detail
        .map((e: { loc?: string[]; msg?: string }) => {
          const campo = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : "campo";
          return `${campo}: ${e.msg}`;
        })
        .join(" | ");
    } else if (data.message) {
      detalhe = data.message;
    }
  } catch {
    // Sem corpo JSON
  }
  return `[HTTP ${res.status} em ${endpoint}] ${detalhe || "Sem detalhe retornado pelo servidor."}`;
}

export default function AdminHackathonPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<SessaoUsuario | null>(null);
  const [erroSessao, setErroSessao] = useState<string | null>(null);
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [termos, setTermos] = useState<TermoItem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [publicandoTermos, setPublicandoTermos] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "Hackathon IA Amazônia 2027",
    min_integrantes: 3,
    max_integrantes: 5,
    status: "INSCRICOES",
  });

  const carregarDados = useCallback(async () => {
    setCarregandoLista(true);
    setErroSessao(null);
    const token = obterToken();
    const headers = criarHeaders(token);

    try {
      const [resMe, resHack, resTermos] = await Promise.all([
        fetch(`${API_BASE}/auth/me`, { headers, credentials: "include" }).catch(() => null),
        fetch(`${API_BASE}/hackathons`, { headers, credentials: "include" }).catch(() => null),
        fetch(`${API_BASE}/termos/vigentes`, { headers, credentials: "include" }).catch(() => null),
      ]);

      if (resMe && resMe.ok) {
        const me = await resMe.json();
        setUsuarioAtual(me);
      } else {
        setUsuarioAtual(null);
        const statusMe = resMe ? `HTTP ${resMe.status}` : "sem resposta";
        setErroSessao(
          `Sessão não reconhecida pelo /auth/me (${statusMe}). Token no storage: ${token ? "encontrado" : "ausente"}.`
        );
      }

      if (resHack && resHack.ok) {
        const raw = await resHack.json();
        setHackathons(Array.isArray(raw) ? raw : raw?.items || []);
      }

      if (resTermos && resTermos.ok) {
        const rawT = await resTermos.json();
        setTermos(Array.isArray(rawT) ? rawT : rawT?.items || []);
      }
    } finally {
      setCarregandoLista(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleCriarHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    setErro(null);

    const token = obterToken();
    const headers = criarHeaders(token);
    const payload = JSON.stringify({
      nome: form.nome.trim(),
      min_integrantes: Number(form.min_integrantes),
      max_integrantes: Number(form.max_integrantes),
      status: form.status,
    });

    try {
      const endpoint = `${API_BASE}/admin/hackathons`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        credentials: "include",
        body: payload,
      });

      if (!res.ok) {
        throw new Error(await extrairErroDetalhado(res, `POST ${endpoint}`));
      }

      const criado = await res.json();
      setMensagem(`Edição "${criado.nome || form.nome}" criada com status ${criado.status || form.status}!`);
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Falha ao criar a edição do Hackathon.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarStatus = async (hackathonId: string, novoStatus: string) => {
    setSalvando(true);
    setMensagem(null);
    setErro(null);

    const token = obterToken();
    const endpoint = `${API_BASE}/admin/hackathons/${hackathonId}`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: criarHeaders(token),
        credentials: "include",
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) {
        throw new Error(await extrairErroDetalhado(res, `PATCH ${endpoint}`));
      }

      setMensagem(`Status atualizado para "${novoStatus}" com sucesso!`);
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar status.");
    } finally {
      setSalvando(false);
    }
  };

  const handlePublicarTermosPadrao = async () => {
    setPublicandoTermos(true);
    setMensagem(null);
    setErro(null);

    const hackathonAtivo = hackathons.find((h) => h.status === "INSCRICOES") || hackathons[0];
    if (!hackathonAtivo) {
      setErro("Crie ou abra uma edição do Hackathon antes de publicar os termos.");
      setPublicandoTermos(false);
      return;
    }

    const token = obterToken();
    const endpoint = `${API_BASE}/admin/termos`;

    try {
      const payloads = [
        {
          hackathon_id: hackathonAtivo.id,
          tipo: "REGULAMENTO",
          titulo: "Regulamento Oficial - Hackathon IA Amazônia 2027",
          versao: "1.0",
          conteudo: "Regras gerais de participação, formação de equipes, propriedade intelectual e critérios de avaliação.",
        },
        {
          hackathon_id: hackathonAtivo.id,
          tipo: "TERMO_CONSENTIMENTO",
          titulo: "Termo de Consentimento e Privacidade (LGPD)",
          versao: "1.0",
          conteudo: "Autorização para tratamento de dados pessoais exclusivamente para fins de inscrição e credenciamento no evento.",
        },
      ];

      for (const item of payloads) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: criarHeaders(token),
          credentials: "include",
          body: JSON.stringify(item),
        });

        if (!res.ok) {
          throw new Error(await extrairErroDetalhado(res, `POST ${endpoint}`));
        }
      }

      setMensagem("Regulamento e Termo de Consentimento publicados com sucesso!");
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao publicar os termos.");
    } finally {
      setPublicandoTermos(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-[#131D1C] p-6 rounded-2xl border border-emerald-900/50 shadow-lg">
          <Link href="/admin" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold mb-4 inline-block">
            &larr; Voltar ao painel
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">Gerenciar Edição do Hackathon</h1>
          <p className="text-xs text-gray-400 mb-4">
            Crie a edição no servidor e deixe o status em <strong className="text-emerald-400">INSCRICOES</strong> para liberar o cadastro de participantes.
          </p>

          {/* Status da Sessão Atual */}
          {usuarioAtual ? (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-xs font-mono text-emerald-300">
              Sessão ativa: <strong>{usuarioAtual.email}</strong> | Papel: <strong>{usuarioAtual.papel}</strong> | Conta: <strong>{usuarioAtual.situacao_conta}</strong>
            </div>
          ) : erroSessao ? (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300">
              {erroSessao}
            </div>
          ) : null}

          {mensagem && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono">
              {erro}
            </div>
          )}

          {/* Edições já cadastradas */}
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
              Edições Cadastradas no Banco
            </h2>
            {carregandoLista ? (
              <p className="text-xs text-gray-500">Carregando edições...</p>
            ) : hackathons.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                Nenhuma edição cadastrada ainda. Use o formulário abaixo para criar a primeira.
              </p>
            ) : (
              <div className="space-y-2">
                {hackathons.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1110] border border-gray-800 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{h.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        Status: <span className="text-emerald-400 font-bold">{h.status}</span> | Equipe: {h.min_integrantes ?? 3}–{h.max_integrantes ?? 5}
                      </p>
                    </div>
                    {h.status !== "INSCRICOES" && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleAlterarStatus(h.id, "INSCRICOES")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Abrir Inscrições
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário de Criação */}
          <form onSubmit={handleCriarHackathon} className="space-y-4 border-t border-gray-800 pt-5">
            <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Criar Nova Edição
            </h2>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1 font-semibold">Nome da Edição *</label>
              <input
                required
                type="text"
                className="w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1 font-semibold">Mín. Integrantes</label>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                  value={form.min_integrantes}
                  onChange={(e) => setForm({ ...form, min_integrantes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1 font-semibold">Máx. Integrantes</label>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                  value={form.max_integrantes}
                  onChange={(e) => setForm({ ...form, max_integrantes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1 font-semibold">Status Inicial</label>
              <select
                className="w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="INSCRICOES">INSCRICOES (Aberto)</option>
                <option value="RASCUNHO">RASCUNHO</option>
                <option value="ENCERRADO">ENCERRADO</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all text-sm cursor-pointer"
            >
              {salvando ? "Salvando no servidor..." : "Criar Edição no Servidor"}
            </button>
          </form>

          {/* Termos Vigentes */}
          <div className="border-t border-gray-800 pt-5 mt-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Termos Vigentes ({termos.length}/2)
              </h2>
              <button
                type="button"
                disabled={publicandoTermos || hackathons.length === 0}
                onClick={handlePublicarTermosPadrao}
                className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40"
              >
                {publicandoTermos ? "Publicando..." : "Publicar Regulamento e Consentimento"}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Necessários para que os participantes aceitem os termos e concluam a inscrição da equipe sem erro 409.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}