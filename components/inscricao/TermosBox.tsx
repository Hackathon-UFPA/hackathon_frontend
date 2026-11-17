"use client";

import { useCallback, useEffect, useState } from "react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { btn } from "@/components/ui";
import { termos, type Termo } from "@/lib/api";

/** Leitura e aceite do regulamento e do termo de consentimento vigentes. */
export default function TermosBox({
  hackathonId,
  rotulo,
  onConfirmar,
}: {
  hackathonId: string;
  rotulo: string;
  onConfirmar: (ids: string[]) => Promise<void>;
}) {
  const [lista, setLista] = useState<Termo[]>([]);
  const [aceito, setAceito] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [falhouAoCarregar, setFalhouAoCarregar] = useState(false);

  const carregar = useCallback(
    () =>
      termos
        .vigentes(hackathonId)
        .then((vigentes) => {
          setLista(vigentes);
          setErro(null);
          setFalhouAoCarregar(false);
        })
        .catch((e) => {
          setErro(e);
          setFalhouAoCarregar(true);
        }),
    [hackathonId]
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const confirmar = async () => {
    setOcupado(true);
    setErro(null);
    try {
      await onConfirmar(lista.map((t) => t.id));
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-3">
      {lista.map((t) => (
        <details key={t.id} className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-white">
            {t.titulo} (v{t.versao})
          </summary>
          {t.conteudo && <p className="mt-2 whitespace-pre-line text-xs text-gray-300">{t.conteudo}</p>}
          {t.url && (
            <a
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
            >
              Abrir documento &rarr;
            </a>
          )}
        </details>
      ))}

      {erro != null && (
        <ApiErrorAlert
          erro={erro}
          onRetry={falhouAoCarregar ? carregar : undefined}
          onClose={() => setErro(null)}
        />
      )}

      {lista.length > 0 && (
        <>
          <label className="flex items-start gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => setAceito(e.target.checked)}
              className="mt-1"
            />
            Li e aceito o regulamento e o termo de consentimento.
          </label>
          <button type="button" disabled={!aceito || ocupado} onClick={confirmar} className={btn}>
            {ocupado ? "Registrando..." : rotulo}
          </button>
        </>
      )}
    </div>
  );
}
