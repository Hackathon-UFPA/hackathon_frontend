"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { ApiError, formatarDataBrasilia, getToken, getUser } from "@/lib/api";
import {
  avisarNotificacoesAlteradas,
  EVENTO_NOTIFICACOES_ALTERADAS,
  linkDaNotificacao,
  notificacoes as notificacoesApi,
  type Notificacao,
} from "@/lib/api-participante";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { IconeNotificacao } from "./visual";

const MAX_NA_LISTA = 6;
const INTERVALO_MS = 60_000;

/**
 * Sino da central de notificações. O contador vem do servidor
 * (GET /me/notificacoes/nao-lidas/contagem) e a leitura também (POST .../lida).
 * Não renderiza nada sem sessão. Conta pendente recebe 403: o sino fica sem contador
 * e a lista explica que a central abre com a conta ativa.
 */
export default function NotificacoesSino() {
  const router = useRouter();
  const [logado, setLogado] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [contaPendente, setContaPendente] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // Chamada por timer ou evento, nunca direto no corpo do efeito.
  const contar = useCallback(async () => {
    if (!getToken()) {
      setLogado(false);
      return;
    }
    setLogado(true);
    try {
      const { nao_lidas } = await notificacoesApi.contarNaoLidas();
      setNaoLidas(nao_lidas);
      setContaPendente(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setContaPendente(true);
      setNaoLidas(0);
    }
  }, []);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    try {
      setLista(await notificacoesApi.listar({ limite: MAX_NA_LISTA }));
      setErro(null);
    } catch (e) {
      setErro(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const inicial = window.setTimeout(contar, 0);
    const t = window.setInterval(contar, INTERVALO_MS);
    const aoAlterar = () => void contar();
    window.addEventListener(EVENTO_NOTIFICACOES_ALTERADAS, aoAlterar);
    window.addEventListener("focus", aoAlterar);
    return () => {
      window.clearTimeout(inicial);
      window.clearInterval(t);
      window.removeEventListener(EVENTO_NOTIFICACOES_ALTERADAS, aoAlterar);
      window.removeEventListener("focus", aoAlterar);
    };
  }, [contar]);

  // Fecha ao clicar fora ou com Esc.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const alternar = () => {
    const abrir = !aberto;
    setAberto(abrir);
    if (abrir && !contaPendente) void carregarLista();
  };

  const abrirNotificacao = async (n: Notificacao) => {
    const destino = linkDaNotificacao(n, getUser()?.papel);
    if (!n.lida_em) {
      try {
        const lida = await notificacoesApi.marcarLida(n.notificacao_id);
        setLista((l) => l.map((x) => (x.notificacao_id === n.notificacao_id ? lida : x)));
        setNaoLidas((c) => Math.max(0, c - 1));
        avisarNotificacoesAlteradas();
      } catch {
        /* a leitura não impede abrir o assunto */
      }
    }
    if (destino) {
      setAberto(false);
      router.push(destino);
    }
  };

  const marcarTodas = async () => {
    setMarcando(true);
    try {
      await notificacoesApi.marcarTodasLidas();
      const agora = new Date().toISOString();
      setLista((l) => l.map((x) => (x.lida_em ? x : { ...x, lida_em: agora })));
      setNaoLidas(0);
      avisarNotificacoesAlteradas();
    } catch (e) {
      setErro(e);
    } finally {
      setMarcando(false);
    }
  };

  if (!logado) return null;

  const rotulo = naoLidas > 0 ? `Notificações: ${naoLidas} não lida(s)` : "Notificações";

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-haspopup="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-emerald-500/40 hover:text-gray-900"
      >
        <Bell className="h-4 w-4" />
        {naoLidas > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-100 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-bold text-gray-900">
              Notificações
              {naoLidas > 0 && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {naoLidas} não lida{naoLidas > 1 ? "s" : ""}
                </span>
              )}
            </p>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                disabled={marcando}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {marcando ? "Marcando..." : "Marcar todas como lidas"}
              </button>
            )}
          </div>

          {contaPendente ? (
            <p className="px-1 py-4 text-center text-xs text-gray-600">
              A central de notificações abre quando sua conta estiver ativa, depois da aprovação do
              comprovante. Os convites recebidos ficam em Minha Equipe.
            </p>
          ) : erro !== null && lista.length === 0 ? (
            <ApiErrorAlert erro={erro} onRetry={carregarLista} />
          ) : carregando && lista.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-emerald-700">Carregando...</p>
          ) : lista.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-gray-600">Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="max-h-96 space-y-1.5 overflow-y-auto">
              {lista.map((n) => {
                const naoLida = !n.lida_em;
                return (
                  <li key={n.notificacao_id}>
                    <button
                      type="button"
                      onClick={() => abrirNotificacao(n)}
                      className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors hover:border-emerald-200 ${
                        naoLida ? "border-emerald-100 bg-emerald-50/50" : "border-gray-100 bg-white"
                      }`}
                    >
                      <IconeNotificacao n={n} tamanho="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs ${naoLida ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}
                          >
                            {n.titulo}
                          </span>
                          {naoLida && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-label="Não lida" />
                          )}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-600 line-clamp-2">{n.mensagem}</span>
                        <span className="mt-1 block text-[10px] text-gray-500">{formatarDataBrasilia(n.criado_em)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/notificacoes"
            onClick={() => setAberto(false)}
            className="mt-2 block rounded-lg px-1 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-gray-50"
          >
            Ver todas as notificações
          </Link>
        </div>
      )}
    </div>
  );
}
