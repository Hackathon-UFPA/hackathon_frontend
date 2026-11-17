"use client";

import { useState } from "react";
import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { Campo, btn, btnGhost, inputArquivo } from "@/components/ui";
import type { Comprovante } from "@/lib/api";
import { STATUS_COMPROVANTE, formatarDataHora } from "@/lib/rotulos";

const ICONE = {
  PENDENTE: <Clock className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />,
  APROVADO: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />,
  RECUSADO: <XCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />,
};

/** Comprovantes do participante. `onReenviar` só existe enquanto a conta está pendente. */
export default function EtapaValidacao({
  comprovantes,
  contaAtiva,
  ocupado,
  onReenviar,
  onAtualizar,
}: {
  comprovantes: Comprovante[];
  contaAtiva: boolean;
  ocupado: boolean;
  onReenviar: (arquivo: File) => Promise<boolean>;
  onAtualizar: () => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const recusado = comprovantes[0]?.status === "RECUSADO";

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-300">
        {contaAtiva
          ? "Sua conta está ativa. O vínculo foi validado e as próximas etapas estão liberadas."
          : "Sua conta será liberada quando a organização aprovar o comprovante de vínculo. As próximas etapas ficam bloqueadas até lá."}
      </p>

      {comprovantes.length > 0 ? (
        <ul className="space-y-2">
          {comprovantes.map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
              {ICONE[c.status]}
              <div className="min-w-0">
                <p className="font-bold text-white">{STATUS_COMPROVANTE[c.status]}</p>
                <p className="text-xs text-gray-400">Enviado em {formatarDataHora(c.enviado_em)}</p>
                {c.motivo_recusa && <p className="mt-1 text-xs text-red-300">Motivo: {c.motivo_recusa}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-amber-300">Nenhum comprovante enviado.</p>
      )}

      {!contaAtiva && (recusado || comprovantes.length === 0) && (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (arquivo && (await onReenviar(arquivo))) setArquivo(null);
          }}
        >
          <Campo label="Novo comprovante *" dica="PDF, PNG ou JPG, até 10 MB.">
            <input
              required
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className={inputArquivo}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </Campo>
          <button type="submit" className={btn} disabled={ocupado || !arquivo}>
            {ocupado ? "Enviando..." : "Enviar comprovante"}
          </button>
        </form>
      )}

      {!contaAtiva && (
        <button type="button" className={btnGhost} onClick={onAtualizar}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Atualizar situação
        </button>
      )}
    </div>
  );
}
