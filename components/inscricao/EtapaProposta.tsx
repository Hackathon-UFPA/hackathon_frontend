"use client";

import { ArrowRight, Save } from "lucide-react";
import { Campo, btn, btnGhost, inp } from "@/components/ui";
import type { Proposta, PropostaInput, Tema } from "@/lib/api";
import { ODS, formatarDataHora } from "@/lib/rotulos";

export interface FormProposta {
  tema_id: string;
  titulo: string;
  descricao: string;
  ods: number[];
  bases_dados: string;
  documento_url: string;
}

export function formDaProposta(p: Proposta | null): FormProposta {
  return {
    tema_id: p?.tema_id ?? "",
    titulo: p?.titulo ?? "",
    descricao: p?.descricao ?? "",
    ods: [...(p?.ods ?? [])].sort((a, b) => a - b),
    bases_dados: p?.bases_dados ?? "",
    documento_url: p?.documento_url ?? "",
  };
}

/** Campos vazios viram null: é assim que o rascunho limpa um valor salvo antes. */
export function dadosDoForm(f: FormProposta): PropostaInput {
  return {
    tema_id: f.tema_id || null,
    titulo: f.titulo.trim() || null,
    descricao: f.descricao.trim() || null,
    ods: f.ods.length > 0 ? f.ods : null,
    bases_dados: f.bases_dados.trim() || null,
    documento_url: f.documento_url.trim() || null,
  };
}

export function formsIguais(a: FormProposta, b: FormProposta): boolean {
  return JSON.stringify(dadosDoForm(a)) === JSON.stringify(dadosDoForm(b));
}

export default function EtapaProposta({
  form,
  temas,
  rascunho,
  avisoLeitura,
  ocupado,
  erros,
  onAlterar,
  onSalvar,
  onSalvarERevisar,
}: {
  form: FormProposta;
  temas: Tema[];
  rascunho: Proposta | null;
  avisoLeitura: string | null;
  ocupado: boolean;
  erros: Record<string, string>;
  onAlterar: (form: FormProposta) => void;
  onSalvar: () => void;
  onSalvarERevisar: () => void;
}) {
  const somenteLeitura = avisoLeitura !== null;

  const alternarOds = (numero: number) =>
    onAlterar({
      ...form,
      ods: form.ods.includes(numero)
        ? form.ods.filter((n) => n !== numero)
        : [...form.ods, numero].sort((a, b) => a - b),
    });

  const escolherTema = (temaId: string) => {
    const tema = temas.find((t) => t.id === temaId);
    // Sugere os ODS do tema só quando nenhum foi marcado, sem apagar uma escolha da equipe.
    onAlterar({ ...form, tema_id: temaId, ods: form.ods.length === 0 && tema ? [...tema.ods] : form.ods });
  };

  const temaDescricao = temas.find((t) => t.id === form.tema_id)?.descricao;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar();
      }}
    >
      {avisoLeitura ? (
        <p className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-gray-300">{avisoLeitura}</p>
      ) : (
        <p className="text-sm text-gray-400">
          O rascunho pode ficar incompleto. Todos os campos com * são exigidos no envio definitivo.
        </p>
      )}

      <Campo label="Tema *" erro={erros.tema_id} dica={temaDescricao ?? undefined}>
        <select
          className={inp}
          disabled={somenteLeitura}
          value={form.tema_id}
          onChange={(e) => escolherTema(e.target.value)}
        >
          <option value="">Selecione um tema</option>
          {temas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo}
            </option>
          ))}
        </select>
      </Campo>
      {temas.length === 0 && (
        <p className="text-sm text-amber-300">
          A organização ainda não publicou temas. O rascunho pode ser salvo, mas o envio exige um tema.
        </p>
      )}

      <Campo label="Título *" erro={erros.titulo}>
        <input
          maxLength={255}
          className={inp}
          disabled={somenteLeitura}
          value={form.titulo}
          onChange={(e) => onAlterar({ ...form, titulo: e.target.value })}
        />
      </Campo>

      <Campo label="Descrição *" erro={erros.descricao}>
        <textarea
          rows={5}
          className={`${inp} resize-y`}
          disabled={somenteLeitura}
          value={form.descricao}
          onChange={(e) => onAlterar({ ...form, descricao: e.target.value })}
        />
      </Campo>

      <fieldset>
        <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
          ODS relacionados *
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ODS.map(({ numero, nome }) => {
            const marcado = form.ods.includes(numero);
            return (
              <label
                key={numero}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                  marcado ? "border-emerald-400 bg-emerald-400/10 text-white" : "border-white/10 bg-black/30 text-gray-300"
                } ${somenteLeitura ? "" : "cursor-pointer hover:border-emerald-500/50"}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-emerald-500"
                  disabled={somenteLeitura}
                  checked={marcado}
                  onChange={() => alternarOds(numero)}
                />
                <span>
                  <span className="font-mono font-bold">{numero}.</span> {nome}
                </span>
              </label>
            );
          })}
        </div>
        {erros.ods && <p className="mt-1.5 text-xs text-red-400">{erros.ods}</p>}
      </fieldset>

      <Campo
        label="Bases de dados *"
        erro={erros.bases_dados}
        dica="Fontes que a solução vai usar, como IBGE ou INPE."
      >
        <textarea
          rows={3}
          className={`${inp} resize-y`}
          disabled={somenteLeitura}
          value={form.bases_dados}
          onChange={(e) => onAlterar({ ...form, bases_dados: e.target.value })}
        />
      </Campo>

      <Campo label="Link do documento (opcional)" erro={erros.documento_url}>
        <input
          type="url"
          placeholder="https://"
          className={inp}
          disabled={somenteLeitura}
          value={form.documento_url}
          onChange={(e) => onAlterar({ ...form, documento_url: e.target.value })}
        />
      </Campo>

      {rascunho?.atualizado_em && (
        <p className="text-xs text-gray-400">Último salvamento: {formatarDataHora(rascunho.atualizado_em)}</p>
      )}

      {!somenteLeitura && (
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={btn} disabled={ocupado}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {ocupado ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            type="button"
            className={btnGhost}
            disabled={ocupado}
            onClick={(e) => {
              // type="button" não dispara a validação nativa, então o link é conferido aqui.
              if (e.currentTarget.form?.reportValidity()) onSalvarERevisar();
            }}
          >
            Salvar e revisar envio
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </form>
  );
}
