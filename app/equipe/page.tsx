"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";

import { equipes } from "@/lib/api";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import PropostaRascunho from "@/components/proposta/PropostaRascunho";

type EstadoEquipe = "carregando" | "pronto" | "semEquipe" | "erro";

export default function EquipeDashboard() {
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const [erroEquipe, setErroEquipe] = useState<unknown>(null);
  const [estadoEquipe, setEstadoEquipe] =
    useState<EstadoEquipe>("carregando");

  const requisicaoEquipeRef = useRef(0);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Validar Ideia com o Mentor", done: true },
    { id: 2, text: "Construir MVP do Front-end", done: true },
    { id: 3, text: "Conectar API do Back-end", done: false },
    { id: 4, text: "Enviar Pitch de 3 minutos", done: false },
  ]);

  const carregarEquipe = useCallback(async () => {
    const requisicaoId = ++requisicaoEquipeRef.current;

    setEstadoEquipe("carregando");
    setErroEquipe(null);

    try {
      const minhasEquipes = await equipes.minhas();

      if (requisicaoId !== requisicaoEquipeRef.current) return;

      const primeiraEquipe = minhasEquipes[0];

      if (!primeiraEquipe) {
        setEquipeId(null);
        setEstadoEquipe("semEquipe");
        return;
      }

      setEquipeId(primeiraEquipe.id);
      setEstadoEquipe("pronto");
    } catch (err) {
      if (requisicaoId !== requisicaoEquipeRef.current) return;

      setEquipeId(null);
      setErroEquipe(err);
      setEstadoEquipe("erro");
    }
  }, []);

  useEffect(() => {
    void carregarEquipe();

    return () => {
      requisicaoEquipeRef.current += 1;
    };
  }, [carregarEquipe]);

  const toggleTask = (id: number) => {
    setTasks((atuais) =>
      atuais.map((task) =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex overflow-hidden">
      {/* BACKGROUND GLOBAL DA FLORESTA */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1110] via-[#0A1110]/90 to-[#0A1110]/80" />
      </div>

      {/* SIDEBAR */}
      <aside className="relative z-10 w-64 border-r border-white/5 bg-[#0A1110]/60 backdrop-blur-2xl flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              IA
            </div>
            <span className="text-white font-bold tracking-widest text-sm uppercase">
              Hackathon 2027
            </span>
          </Link>
        </div>

        <nav
          aria-label="Painel da equipe"
          className="flex-1 p-4 space-y-2"
        >
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-medium transition-all"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Visão Geral
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Materiais ODS
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-black font-bold border-2 border-emerald-900">
              AL
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Ada Lovelace
              </p>
              <p className="text-xs text-gray-500">
                Líder Técnico
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="relative z-10 flex-1 min-w-0 flex flex-col h-full overflow-y-auto">
        <header className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
              Equipe Sistema Curupira
            </h1>
            <p className="text-emerald-500 text-sm font-medium flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              />
              Hackathon em Andamento
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Tempo Restante
            </p>
            <p className="text-2xl font-mono text-white font-bold">
              48:15:22
            </p>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* S4-08: Carregamento da equipe e proposta */}
          {estadoEquipe === "carregando" && (
            <section
              aria-label="Carregamento da equipe"
              aria-busy="true"
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md"
            >
              <div
                role="status"
                className="flex items-center justify-center gap-3 py-8 text-gray-400"
              >
                <Loader2
                  aria-hidden="true"
                  className="w-5 h-5 animate-spin text-emerald-400"
                />
                Carregando sua equipe...
              </div>
            </section>
          )}

          {estadoEquipe === "erro" && (
            <section
              aria-labelledby="erro-equipe-titulo"
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-4"
            >
              <div>
                <h2
                  id="erro-equipe-titulo"
                  className="text-lg font-bold text-white"
                >
                  Não foi possível carregar sua equipe
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Precisamos identificar sua equipe antes de
                  carregar a proposta.
                </p>
              </div>

              {erroEquipe !== null ? (
                <ApiErrorAlert
                  erro={erroEquipe}
                  onRetry={() => void carregarEquipe()}
                  onClose={() => setErroEquipe(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void carregarEquipe()}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Tentar carregar novamente
                </button>
              )}
            </section>
          )}

          {estadoEquipe === "semEquipe" && (
            <section
              aria-labelledby="sem-equipe-titulo"
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md"
            >
              <h2
                id="sem-equipe-titulo"
                className="text-lg font-bold text-white"
              >
                Você ainda não está em uma equipe
              </h2>

              <p className="text-sm text-gray-400 mt-2">
                Crie ou entre em uma equipe para carregar e salvar
                o rascunho da proposta.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/inscricao"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Ir para inscrição
                </Link>

                <button
                  type="button"
                  onClick={() => void carregarEquipe()}
                  className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Atualizar situação
                </button>
              </div>
            </section>
          )}

          {estadoEquipe === "pronto" && equipeId && (
            <PropostaRascunho
              key={equipeId}
              equipeId={equipeId}
            />
          )}

          {/* Seção 1: Esquadrão — dados demonstrativos */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Sincronização do Esquadrão
                </h2>
                <p className="text-sm text-gray-400">
                  Capacidade atual: 2/4 membros exigidos.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 hidden md:block" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                <div className="bg-[#131D1C] border border-emerald-500/30 p-5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)] backdrop-blur-md flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900 border-2 border-emerald-400 mb-3 overflow-hidden">
                    <img
                      src="https://i.pravatar.cc/150?img=5"
                      alt="Ada"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm">
                    Ada Lovelace
                  </h3>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded mt-1 border border-emerald-500/20">
                    Líder / Tech Lead
                  </span>
                </div>

                <div className="bg-[#131D1C] border border-white/10 p-5 rounded-xl backdrop-blur-md flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-600 mb-3 overflow-hidden">
                    <img
                      src="https://i.pravatar.cc/150?img=11"
                      alt="Alan"
                      className="w-full h-full object-cover opacity-80 grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                  <h3 className="font-bold text-gray-300 text-sm">
                    Alan Turing
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded mt-1 border border-gray-700">
                    Especialista IA
                  </span>
                </div>

                <div className="border-2 border-dashed border-white/10 bg-white/5 p-5 rounded-xl flex flex-col items-center text-center justify-center min-h-[160px] group hover:border-emerald-500/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-gray-500 group-hover:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-400 text-sm group-hover:text-white transition-colors">
                    Aguardando Match
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Clique para buscar UX/UI
                  </p>
                </div>

                <div className="border-2 border-dashed border-white/10 bg-white/5 p-5 rounded-xl flex flex-col items-center text-center justify-center min-h-[160px] group hover:border-emerald-500/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-gray-500 group-hover:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-400 text-sm group-hover:text-white transition-colors">
                    Aguardando Match
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Clique para buscar Dev
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Desafio e Tarefas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                  Desafio Foco (ODS)
                </h3>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <h4 className="text-white font-bold">
                      Bioeconomia e Conservação
                    </h4>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      Desenvolvendo uma IA para monitoramento
                      preditivo de queimadas usando dados de
                      satélite da região norte.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-b from-[#131D1C] to-transparent border border-emerald-900/30 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-4">
                  Mentor Alocado
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-600 overflow-hidden">
                    <img
                      src="https://i.pravatar.cc/150?img=33"
                      alt="Mentor"
                      className="w-full h-full object-cover opacity-80 grayscale"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">
                      Dr. Carlos Souza
                    </h4>
                    <p className="text-xs text-emerald-500">
                      Engenharia de Dados (AWS)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg border border-emerald-500/20 transition-colors"
                >
                  Agendar Check-in
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">
                  Próximos Passos da Maratona
                </h3>
                <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-300">
                  {tasks.filter((task) => task.done).length}
                  {" / "}
                  {tasks.length} concluídos
                </span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer border transition-all ${
                      task.done
                        ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                        : "bg-black/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-black/40 accent-emerald-500"
                    />
                    <span
                      className={`text-sm font-medium ${
                        task.done
                          ? "text-gray-400 line-through"
                          : "text-gray-200"
                      }`}
                    >
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}