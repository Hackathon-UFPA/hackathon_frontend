"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { ApiError } from "@/lib/api";

type ApiErrorAlertProps = {
  erro: unknown;
  onRetry?: () => void;
  onClose?: () => void;
};

export default function ApiErrorAlert({
  erro,
  onRetry,
  onClose,
}: ApiErrorAlertProps) {
  const isApiError = erro instanceof ApiError;
  const status = isApiError ? erro.status : undefined;

  const mensagem =
    typeof erro === "string"
      ? erro
      : erro instanceof Error
      ? erro.message
      : "Erro inesperado. Tente novamente.";

  const semConexao =
    status === 0 ||
    mensagem.toLowerCase().includes("não foi possível conectar");

  const titulo = semConexao
    ? "Servidor indisponível"
    : status === 401
    ? "Sessão expirada"
    : status === 403
    ? "Acesso negado"
    : status === 422
    ? "Dados inválidos"
    : status === 429
    ? "Muitas tentativas"
    : "Erro na solicitação";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/10 p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(239,68,68,0.15)]"
    >
      <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-red-500/15 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/15 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-wide text-white">
            {titulo}
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-gray-300">
            {mensagem}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-red-500/25 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar mensagem de erro"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}