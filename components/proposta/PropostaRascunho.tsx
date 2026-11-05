"use client";

import { useId } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Save,
} from "lucide-react";

import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { usePropostaRascunho } from "@/components/proposta/usePropostaRascunho";

type Props = {
  equipeId: string | null;
};

const ODS_DISPONIVEIS = [
  { id: 3, nome: "Saúde e Bem-Estar" },
  { id: 6, nome: "Água Potável e Saneamento" },
  { id: 13, nome: "Ação contra a Mudança Global do Clima" },
  { id: 14, nome: "Vida na Água" },
  { id: 15, nome: "Vida Terrestre" },
];

const CLASSE_CAMPO =
  "w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 " +
  "text-white placeholder:text-gray-500 focus:border-emerald-500 " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 " +
  "transition disabled:cursor-not-allowed disabled:opacity-60";

const CLASSE_STATUS_NEUTRO =
  "bg-white/5 text-gray-300 border-white/10";

const CLASSE_STATUS_VERDE =
  "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

const CLASSE_STATUS_AMARELO =
  "bg-amber-500/10 text-amber-300 border-amber-500/30";

const CLASSE_STATUS_ERRO =
  "bg-red-500/10 text-red-300 border-red-500/30";

export default function PropostaRascunho({ equipeId }: Props) {
  const id = useId();

  const {
    proposta,
    form,
    estado,
    erro,
    operacaoComErro,
    mensagemSucesso,
    alteracoesPendentes,
    carregamentoConcluido,
    podeEditar,
    podeSalvar,
    atualizarCampo,
    alternarOds,
    salvarRascunho,
    fecharErro,
    tentarNovamente,
  } = usePropostaRascunho(equipeId);

  const carregando = estado === "carregando";
  const salvando = estado === "salvando";
  const semEquipe = !equipeId || estado === "semEquipe";
  const propostaEnviada = proposta?.status === "ENVIADA";

  let textoStatus = "Novo rascunho";
  let classeStatus = CLASSE_STATUS_NEUTRO;

  if (semEquipe) {
    textoStatus = "Equipe não selecionada";
  } else if (carregando) {
    textoStatus = "Carregando...";
  } else if (salvando) {
    textoStatus = "Salvando...";
    classeStatus = CLASSE_STATUS_VERDE;
  } else if (!carregamentoConcluido) {
    textoStatus = "Rascunho não carregado";
    classeStatus = CLASSE_STATUS_ERRO;
  } else if (propostaEnviada) {
    textoStatus = "Proposta enviada";
    classeStatus = CLASSE_STATUS_VERDE;
  } else if (alteracoesPendentes) {
    textoStatus = "Alterações não salvas";
    classeStatus = CLASSE_STATUS_AMARELO;
  } else if (proposta) {
    textoStatus = "Rascunho atualizado";
    classeStatus = CLASSE_STATUS_VERDE;
  }

  const tituloId = `${id}-titulo`;
  const descricaoId = `${id}-descricao`;
  const basesId = `${id}-bases`;
  const documentoId = `${id}-documento`;
  const cabecalhoId = `${id}-cabecalho`;
  const ajudaId = `${id}-ajuda`;

  return (
    <section
      aria-labelledby={cabecalhoId}
      aria-busy={carregando || salvando}
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3
            id={cabecalhoId}
            className="text-lg font-bold text-white flex items-center gap-2"
          >
            <FileText
              aria-hidden="true"
              className="w-5 h-5 shrink-0 text-emerald-400"
            />
            Proposta da equipe
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            Salve sua ideia como rascunho e continue editando depois.
          </p>
        </div>

        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`self-start sm:self-auto shrink-0 text-xs font-medium px-3 py-1 rounded-full border ${classeStatus}`}
        >
          {textoStatus}
        </span>
      </div>

      {erro !== null && (
        <div className="mb-5">
          <ApiErrorAlert
            erro={erro}
            onRetry={
              operacaoComErro
                ? () => void tentarNovamente()
                : undefined
            }
            onClose={fecharErro}
          />
        </div>
      )}

      {semEquipe ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <FileText
            aria-hidden="true"
            className="w-6 h-6 text-gray-500"
          />

          <p className="text-sm text-gray-400 max-w-lg">
            Nenhuma equipe foi selecionada. Selecione uma equipe
            para carregar ou criar o rascunho da proposta.
          </p>
        </div>
      ) : carregando ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 py-10 text-gray-400"
        >
          <Loader2
            aria-hidden="true"
            className="w-5 h-5 animate-spin text-emerald-400"
          />
          Carregando rascunho...
        </div>
      ) : !carregamentoConcluido ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">
            Não foi possível carregar o rascunho. Tente novamente
            antes de iniciar a edição.
          </p>

          {erro === null && (
            <button
              type="button"
              onClick={() => void tentarNovamente()}
              className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Tentar carregar novamente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {mensagemSucesso && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
            >
              <CheckCircle2
                aria-hidden="true"
                className="w-5 h-5 shrink-0 mt-0.5"
              />

              <div>
                <p>{mensagemSucesso}</p>

                {alteracoesPendentes && (
                  <p className="mt-1 text-sm text-gray-300">
                    Existem novas alterações que ainda precisam
                    ser salvas.
                  </p>
                )}
              </div>
            </div>
          )}

          {propostaEnviada && (
            <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
              Esta proposta já foi enviada. Os campos estão
              disponíveis apenas para consulta.
            </p>
          )}

          <div>
            <label
              htmlFor={tituloId}
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Título da proposta
            </label>

            <input
              id={tituloId}
              type="text"
              value={form.titulo}
              disabled={!podeEditar}
              onChange={(event) =>
                atualizarCampo("titulo", event.target.value)
              }
              placeholder="Ex.: Monitoramento inteligente de queimadas"
              className={CLASSE_CAMPO}
            />
          </div>

          <div>
            <label
              htmlFor={descricaoId}
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Descrição / pitch
            </label>

            <textarea
              id={descricaoId}
              rows={5}
              value={form.descricao}
              disabled={!podeEditar}
              onChange={(event) =>
                atualizarCampo("descricao", event.target.value)
              }
              placeholder="Explique o problema, a solução proposta e o impacto socioambiental."
              className={`${CLASSE_CAMPO} resize-y`}
            />
          </div>

          <fieldset disabled={!podeEditar}>
            <legend className="block text-sm font-medium text-gray-300 mb-2">
              ODS relacionados
            </legend>

            <div className="flex flex-wrap gap-2">
              {ODS_DISPONIVEIS.map((ods) => {
                const selecionado = form.ods.includes(ods.id);

                return (
                  <button
                    key={ods.id}
                    type="button"
                    aria-pressed={selecionado}
                    onClick={() => alternarOds(ods.id)}
                    className={`px-3 py-2 rounded-lg text-sm border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                      selecionado
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "bg-black/40 border-white/10 text-gray-300 hover:border-emerald-500/40 hover:text-white"
                    }`}
                  >
                    ODS {ods.id} — {ods.nome}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor={basesId}
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Bases de dados
            </label>

            <input
              id={basesId}
              type="text"
              value={form.bases_dados}
              disabled={!podeEditar}
              onChange={(event) =>
                atualizarCampo("bases_dados", event.target.value)
              }
              placeholder="Ex.: INPE, IBGE, dados satelitais..."
              className={CLASSE_CAMPO}
            />
          </div>

          <div>
            <label
              htmlFor={documentoId}
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Link do documento
            </label>

            <input
              id={documentoId}
              type="url"
              value={form.documento_url}
              disabled={!podeEditar}
              onChange={(event) =>
                atualizarCampo("documento_url", event.target.value)
              }
              placeholder="https://..."
              className={CLASSE_CAMPO}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <p
              id={ajudaId}
              className="text-xs text-gray-400 max-w-md"
            >
              {propostaEnviada
                ? "A proposta enviada não pode ser alterada neste formulário."
                : "Salvar o rascunho não envia a proposta definitiva. Você pode continuar preenchendo depois."}
            </p>

            <button
              type="button"
              onClick={() => void salvarRascunho()}
              disabled={!podeSalvar}
              aria-describedby={ajudaId}
              className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1110] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {salvando ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="w-4 h-4 animate-spin"
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Save
                    aria-hidden="true"
                    className="w-4 h-4"
                  />
                  Salvar rascunho
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}