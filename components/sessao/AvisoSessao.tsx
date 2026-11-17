"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, X } from "lucide-react";
import { clearSession, getToken } from "@/lib/api";
import { sessao } from "@/lib/api-participante";

/** A partir de quanto tempo restante o aviso aparece. */
const AVISAR_COM_SEGUNDOS = 10 * 60;
/** Consulta o servidor de tempos em tempos (a versão da sessão pode mudar em outro aparelho). */
const CONSULTA_MS = 5 * 60_000;

function formatarRestante(seg: number): string {
  if (seg <= 0) return "agora";
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  if (m === 0) return `${s} s`;
  return `${m} min${s ? ` ${String(s).padStart(2, "0")} s` : ""}`;
}

/**
 * RF09: aviso discreto quando faltar pouco para a sessão vencer. O token não é renovado,
 * então a única ação é entrar de novo. Usa GET /auth/sessao (vale para conta pendente).
 * Montar uma vez, no layout raiz, depois de {children}. Sem sessão não renderiza nada.
 */
export default function AvisoSessao() {
  const router = useRouter();
  const [expiraEm, setExpiraEm] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const [dispensadoEm, setDispensadoEm] = useState<number | null>(null);
  const tokenVisto = useRef<string | null>(null);

  const consultar = useCallback(async () => {
    const token = getToken();
    if (!token) {
      tokenVisto.current = null;
      setExpiraEm(null);
      return;
    }
    if (token !== tokenVisto.current) {
      tokenVisto.current = token;
      setDispensadoEm(null);
    }
    try {
      const r = await sessao.obter();
      // `segundos_restantes` evita depender do relógio do aparelho.
      setExpiraEm(Date.now() + r.segundos_restantes * 1000);
    } catch {
      /* sem resposta: tenta de novo na próxima consulta; 401 já leva ao login */
    }
  }, []);

  useEffect(() => {
    const inicial = window.setTimeout(consultar, 0);
    const consulta = window.setInterval(consultar, CONSULTA_MS);
    const relogio = window.setInterval(() => setAgora(Date.now()), 1000);
    window.addEventListener("focus", consultar);
    window.addEventListener("storage", consultar);
    return () => {
      window.clearTimeout(inicial);
      window.clearInterval(consulta);
      window.clearInterval(relogio);
      window.removeEventListener("focus", consultar);
      window.removeEventListener("storage", consultar);
    };
  }, [consultar]);

  if (expiraEm === null) return null;
  const restante = Math.max(0, Math.round((expiraEm - agora) / 1000));
  if (restante > AVISAR_COM_SEGUNDOS) return null;
  // Dispensado: volta a aparecer só no último minuto.
  if (dispensadoEm !== null && restante > 60) return null;

  const venceu = restante === 0;

  // Só limpa este navegador: POST /auth/logout encerraria a sessão em todos os aparelhos.
  const entrarDeNovo = () => {
    clearSession();
    setExpiraEm(null);
    router.push("/login");
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[60] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-amber-200 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">
            {venceu ? "Sua sessão venceu" : `Sua sessão vence em ${formatarRestante(restante)}`}
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {venceu
              ? "Entre de novo para continuar."
              : "Salve o que estiver fazendo. Para continuar depois disso, será preciso entrar de novo."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={entrarDeNovo}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              Entrar de novo
            </button>
            {!venceu && (
              <button
                type="button"
                onClick={() => setDispensadoEm(Date.now())}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Entendi
              </button>
            )}
          </div>
        </div>
        {!venceu && (
          <button
            type="button"
            onClick={() => setDispensadoEm(Date.now())}
            aria-label="Fechar aviso"
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
