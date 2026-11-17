"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { Campo, inp } from "@/components/auth/CartaoAuth";
import {
  inputLocalParaIso,
  isoParaInputLocal,
  type SessaoTreinamento,
  type SessaoTreinamentoCreate,
} from "@/lib/api-treinamento";

type Valores = {
  titulo: string;
  descricao: string;
  inicio: string;
  fim: string;
  local: string;
  link_url: string;
  publicado: boolean;
};

const VAZIO: Valores = { titulo: "", descricao: "", inicio: "", fim: "", local: "", link_url: "", publicado: false };

function valoresDe(s: SessaoTreinamento | null): Valores {
  if (!s) return VAZIO;
  return {
    titulo: s.titulo,
    descricao: s.descricao ?? "",
    inicio: isoParaInputLocal(s.inicio),
    fim: isoParaInputLocal(s.fim),
    local: s.local ?? "",
    link_url: s.link_url ?? "",
    publicado: s.publicado,
  };
}

/**
 * Formulário de cadastro/edição de sessão. Na edição envia o corpo completo no PATCH
 * (campos vazios viram null), o que o backend aceita e simplifica a lógica.
 */
export default function FormSessao({
  sessao,
  onSalvar,
  onCancelar,
}: {
  sessao: SessaoTreinamento | null;
  onSalvar: (dados: SessaoTreinamentoCreate) => Promise<void>;
  onCancelar?: () => void;
}) {
  const [v, setV] = useState<Valores>(() => valoresDe(sessao));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<unknown>(null);
  const [salvando, setSalvando] = useState(false);

  const set = <K extends keyof Valores>(k: K, val: Valores[K]) => setV((a) => ({ ...a, [k]: val }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const loc: Record<string, string> = {};
    if (!v.titulo.trim()) loc.titulo = "Informe o título.";
    if (!v.inicio) loc.inicio = "Informe a data e hora de início.";
    if (v.inicio && v.fim && new Date(v.fim) < new Date(v.inicio)) loc.fim = "O fim não pode ser antes do início.";
    if (!v.local.trim() && !v.link_url.trim()) loc.local = "Informe o local ou o link da sala virtual.";
    if (v.link_url.trim() && !v.link_url.trim().startsWith("https://")) loc.link_url = "O link precisa começar com https://";
    setErros(loc);
    if (Object.keys(loc).length) return;

    setSalvando(true);
    try {
      await onSalvar({
        titulo: v.titulo.trim(),
        descricao: v.descricao.trim() || null,
        inicio: inputLocalParaIso(v.inicio)!,
        fim: inputLocalParaIso(v.fim),
        local: v.local.trim() || null,
        link_url: v.link_url.trim() || null,
        publicado: v.publicado,
      });
      if (!sessao) setV(VAZIO);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setErros(err.fields);
      setErro(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-3" noValidate>
      {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}

      <Campo label="Título *" erro={erros.titulo}>
        <input className={inp} value={v.titulo} maxLength={255} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Introdução ao desafio" />
      </Campo>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Campo label="Início *" erro={erros.inicio}>
          <input type="datetime-local" className={inp} value={v.inicio} onChange={(e) => set("inicio", e.target.value)} />
        </Campo>
        <Campo label="Fim" erro={erros.fim} dica="Opcional.">
          <input type="datetime-local" className={inp} value={v.fim} min={v.inicio || undefined} onChange={(e) => set("fim", e.target.value)} />
        </Campo>
      </div>

      <Campo label="Local" erro={erros.local} dica="Presencial: sala, auditório, endereço.">
        <input className={inp} value={v.local} maxLength={255} onChange={(e) => set("local", e.target.value)} placeholder="Ex.: Auditório do ICEN" />
      </Campo>
      <Campo label="Link da sala virtual" erro={erros.link_url} dica="On-line: link https (Meet, Zoom, Teams...). Informe local, link ou os dois.">
        <input className={inp} value={v.link_url} inputMode="url" onChange={(e) => set("link_url", e.target.value)} placeholder="https://meet.exemplo.com/abc" />
      </Campo>

      <Campo label="Descrição" erro={erros.descricao}>
        <textarea className={`${inp} min-h-24`} value={v.descricao} maxLength={20000} onChange={(e) => set("descricao", e.target.value)} placeholder="O que será abordado, o que levar, pré-requisitos..." />
      </Campo>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#F6F9F8] p-3">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-600" checked={v.publicado} onChange={(e) => set("publicado", e.target.checked)} />
        <span className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Publicar para as equipes</span>
          <span className="block text-xs text-gray-500">Sem marcar, a sessão fica como rascunho e só a organização vê.</span>
        </span>
      </label>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={salvando} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer">
          <Save className="h-4 w-4" aria-hidden="true" />
          {salvando ? "Salvando..." : sessao ? "Salvar alterações" : "Cadastrar sessão"}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="inline-flex items-center gap-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-400 cursor-pointer">
            <X className="h-4 w-4" aria-hidden="true" /> Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
