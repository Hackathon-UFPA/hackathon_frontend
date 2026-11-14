// components/modulo-c/ConvitesRecebidos.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  ConviteRecebido,
  moduloCApi,
  SituacaoConta,
  TermoVigente,
} from "@/lib/moduloC-api";
import {
  BadgeConvite,
  formatarDataBrasilia,
  labelFuncao,
} from "./StatusBadges";

interface ConvitesRecebidosProps {
  situacaoConta: SituacaoConta;
  onConviteRespondido: () => Promise<void>;
}

export function ConvitesRecebidos({
  situacaoConta,
  onConviteRespondido,
}: ConvitesRecebidosProps) {
  const [convites, setConvites] = useState<ConviteRecebido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [conviteEmAceite, setConviteEmAceite] = useState<ConviteRecebido | null>(null);
  const [termos, setTermos] = useState<TermoVigente[]>([]);
  const [termosLidos, setTermosLidos] = useState<Record<string, boolean>>({});
  const [carregandoTermos, setCarregandoTermos] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const carregarConvites = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await moduloCApi.listarMeusConvites();
      setConvites(lista);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar convites recebidos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarConvites();
  }, [carregarConvites]);

  const abrirAceiteComTermos = async (convite: ConviteRecebido) => {
    setErro(null);
    setSucesso(null);
    setConviteEmAceite(convite);
    setCarregandoTermos(true);
    setTermosLidos({});

    try {
      const vigentes = await moduloCApi.listarTermosVigentes(convite.hackathon_id);
      setTermos(vigentes);
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os termos vigentes desta edição."
      );
      setConviteEmAceite(null);
    } finally {
      setCarregandoTermos(false);
    }
  };

  const todosTermosMarcados =
    termos.length > 0 && termos.every((t) => Boolean(termosLidos[t.id]));

  const confirmarAceite = async () => {
    if (!conviteEmAceite || !todosTermosMarcados) return;
    setProcessandoId(conviteEmAceite.id);
    setErro(null);

    try {
      const termosIds = termos.map((t) => t.id);
      await moduloCApi.aceitarConvite(conviteEmAceite.id, termosIds);
      setSucesso(
        `Você ingressou na equipe "${conviteEmAceite.equipe_nome}" com sucesso!`
      );
      setConviteEmAceite(null);
      await carregarConvites();
      await onConviteRespondido();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setErro(
          `${err.message} Atualizamos a lista de convites e termos vigentes.`
        );
        await carregarConvites();
      } else {
        setErro(err instanceof Error ? err.message : "Falha ao aceitar convite.");
      }
      setConviteEmAceite(null);
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRecusar = async (convite: ConviteRecebido) => {
    setProcessandoId(convite.id);
    setErro(null);
    setSucesso(null);
    try {
      await moduloCApi.recusarConvite(convite.id);
      setSucesso(`Convite da equipe "${convite.equipe_nome}" recusado.`);
      await carregarConvites();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Falha ao recusar convite.");
      await carregarConvites();
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <section className="bg-white border border-[#D8CFC0] rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE6D6] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B4332]">Convites Recebidos</h2>
          <p className="text-xs text-[#5C574F] mt-1">
            Consulte a equipe, leia o regulamento e o termo de consentimento vigentes antes de aceitar.
          </p>
        </div>
        <button
          type="button"
          onClick={carregarConvites}
          disabled={carregando}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8CFC0] bg-[#FAF8F5] text-[#1B4332] hover:bg-[#EDE6D6] transition-colors cursor-pointer"
        >
          {carregando ? "Atualizando..." : "Atualizar convites"}
        </button>
      </div>

      {situacaoConta === "PENDENTE" && (
        <div className="p-4 rounded-xl bg-[#FDF3E7] border border-[#E6CCB2] text-xs text-[#6B4F3B] space-y-1">
          <p className="font-bold">Sua conta está aguardando validação do comprovante</p>
          <p>
            Você já pode visualizar seus convites abaixo, mas o aceite fica bloqueado até que o Comitê aprove seu comprovante de vínculo.
          </p>
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F5C2C7] text-[#9B2226] text-xs"
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#E6F4EA] border border-[#95D5B2] text-[#1B4332] text-xs font-medium"
        >
          {sucesso}
        </div>
      )}

      {carregando ? (
        <p className="text-xs text-[#5C574F]">Buscando convites...</p>
      ) : convites.length === 0 ? (
        <div className="p-6 text-center bg-[#FAF8F5] border border-[#EDE6D6] rounded-xl">
          <p className="text-sm font-semibold text-[#3D3A35]">Nenhum convite recebido</p>
          <p className="text-xs text-[#5C574F] mt-1">
            Quando um líder convidar seu e-mail para uma equipe, o convite aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {convites.map((convite) => {
            const pendente = convite.status === "PENDENTE";
            const bloqueadoPorConta = situacaoConta === "PENDENTE";
            return (
              <div
                key={convite.id}
                className="p-4 rounded-xl border border-[#D8CFC0] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#1B4332]">
                      {convite.equipe_nome}
                    </span>
                    <BadgeConvite status={convite.status} />
                  </div>
                  <p className="text-xs text-[#5C574F]">
                    Edição:{" "}
                    <strong className="text-[#3D3A35]">
                      {convite.hackathon_nome || convite.hackathon_id}
                    </strong>{" "}
                    • Função convidada:{" "}
                    <strong className="text-[#3D3A35]">
                      {labelFuncao(convite.funcao)}
                    </strong>
                  </p>
                  <p className="text-[11px] text-[#7A746B]">
                    Recebido em {formatarDataBrasilia(convite.criado_em)}
                  </p>
                </div>

                {pendente && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={processandoId === convite.id}
                      onClick={() => handleRecusar(convite)}
                      className="px-3.5 py-2 rounded-lg border border-[#D8CFC0] bg-white hover:bg-[#FDECEA] hover:text-[#9B2226] hover:border-[#F5C2C7] text-xs font-semibold text-[#5C574F] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Recusar
                    </button>
                    <button
                      type="button"
                      disabled={bloqueadoPorConta || processandoId === convite.id}
                      title={
                        bloqueadoPorConta
                          ? "Aguarde a validação do seu comprovante para aceitar"
                          : "Ler termos e aceitar convite"
                      }
                      onClick={() => abrirAceiteComTermos(convite)}
                      className="px-4 py-2 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {bloqueadoPorConta ? "Conta Pendente" : "Ler Termos e Aceitar"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Leitura e Aceite dos Termos Vigentes */}
      {conviteEmAceite && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-termos-convite-titulo"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#D8CFC0] rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3
              id="modal-termos-convite-titulo"
              className="text-lg font-bold text-[#1B4332]"
            >
              Aceitar Convite — {conviteEmAceite.equipe_nome}
            </h3>
            <p className="text-xs text-[#5C574F]">
              Para confirmar sua entrada na equipe, leia e concorde com todas as versões vigentes dos termos abaixo:
            </p>

            {carregandoTermos ? (
              <p className="text-xs text-[#5C574F] py-6 text-center">
                Carregando documentos vigentes...
              </p>
            ) : termos.length === 0 ? (
              <p className="text-xs text-[#9B2226] bg-[#FDECEA] p-3 rounded-lg">
                Nenhum termo vigente foi publicado para esta edição no servidor.
              </p>
            ) : (
              <div className="space-y-3">
                {termos.map((termo) => (
                  <div
                    key={termo.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D8CFC0] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1B4332]">
                        {termo.titulo} (v{termo.versao})
                      </span>
                      {termo.url && (
                        <a
                          href={termo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#2D6A4F] underline"
                        >
                          Abrir documento
                        </a>
                      )}
                    </div>
                    {termo.conteudo && (
                      <div className="max-h-28 overflow-y-auto text-[11px] text-[#3D3A35] bg-white p-2.5 rounded border border-[#EDE6D6] whitespace-pre-line">
                        {termo.conteudo}
                      </div>
                    )}
                    <label className="flex items-start gap-2 text-xs text-[#1F2421] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(termosLidos[termo.id])}
                        onChange={(e) =>
                          setTermosLidos((prev) => ({
                            ...prev,
                            [termo.id]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 accent-[#1B4332]"
                      />
                      <span>
                        Li e concordo integralmente com <strong>{termo.titulo}</strong> (versão {termo.versao}).
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EDE6D6]">
              <button
                type="button"
                onClick={() => setConviteEmAceite(null)}
                className="px-4 py-2 rounded-lg border border-[#D8CFC0] text-xs font-semibold text-[#5C574F] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!todosTermosMarcados || processandoId === conviteEmAceite.id}
                onClick={confirmarAceite}
                className="px-5 py-2 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processandoId === conviteEmAceite.id
                  ? "Confirmando..."
                  : "Confirmar Aceite e Entrar na Equipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}