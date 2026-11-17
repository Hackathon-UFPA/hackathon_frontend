"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { MaterialTreinamentoCreate } from "@/lib/api-treinamento";

const campo =
  "w-full rounded-lg border border-gray-300 bg-[#F6F9F8] px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none";

/** Linha compacta para anexar um material (título + link https) a uma sessão. */
export default function FormMaterial({
  onAdicionar,
  onCancelar,
}: {
  onAdicionar: (dados: MaterialTreinamentoCreate) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) return setErro("Informe o título e o link.");
    if (!url.trim().startsWith("https://")) return setErro("O link precisa começar com https:// (a plataforma não recebe arquivos: use Drive, Cloudinary etc.).");
    setErro(null);
    setSalvando(true);
    try {
      await onAdicionar({ titulo: titulo.trim(), url: url.trim() });
      setTitulo("");
      setUrl("");
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 422
          ? err.fields.url ?? err.fields.titulo ?? err.message
          : err instanceof Error
            ? err.message
            : "Erro ao anexar o material."
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="mt-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3" noValidate>
      <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input className={campo} value={titulo} maxLength={255} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ex.: Slides)" aria-label="Título do material" autoFocus />
        <input className={campo} value={url} inputMode="url" onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.exemplo.com/slides" aria-label="Link do material" />
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer">
            <Plus className="h-4 w-4" aria-hidden="true" /> {salvando ? "..." : "Anexar"}
          </button>
          <button type="button" onClick={onCancelar} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer">
            Fechar
          </button>
        </div>
      </div>
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </form>
  );
}
