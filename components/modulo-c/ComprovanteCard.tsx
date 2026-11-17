// components/modulo-c/ComprovanteCard.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ComprovanteItem,
  enviarArquivoComprovante,
  HackathonResumo,
  moduloCApi,
} from "@/lib/api";
import { BadgeComprovante, formatarDataBrasilia } from "./StatusBadges";

interface ComprovanteCardProps {
  /** Hackathons em que a pessoa pode pedir participação (vitrine pública). */
  hackathons: HackathonResumo[];
  /** Hackathon já escolhido (ex.: vindo da página do hackathon). */
  hackathonInicialId?: string;
  onAtualizarUsuario?: () => Promise<void>;
}

/**
 * Comprovante de vínculo por hackathon: cada organização confere os comprovantes de quem quer
 * participar dos hackathons dela. Sem comprovante aprovado no hackathon, a equipe não é
 * homologada.
 */
export function ComprovanteCard({
  hackathons,
  hackathonInicialId,
  onAtualizarUsuario,
}: ComprovanteCardProps) {
  const [hackathonId, setHackathonId] = useState(hackathonInicialId ?? "");
  const [comprovantes, setComprovantes] = useState<ComprovanteItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novaUrl, setNovaUrl] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await moduloCApi.listarMeusComprovantes();
      setComprovantes(lista);
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível consultar o histórico de comprovantes."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Quando o hackathon de origem muda (ex.: painel da equipe carregou), ajusta durante o render.
  const [inicialAnterior, setInicialAnterior] = useState(hackathonInicialId);
  if (hackathonInicialId !== inicialAnterior) {
    setInicialAnterior(hackathonInicialId);
    if (hackathonInicialId) setHackathonId(hackathonInicialId);
  }

  const nomeDoHackathon = (id: string) =>
    hackathons.find((h) => h.id === id)?.nome || "Hackathon";
  const abertos = hackathons.filter((h) => h.status === "INSCRICOES");
  const doHackathon = comprovantes.filter((c) => c.hackathon_id === hackathonId);
  const maisRecente = doHackathon[0] ?? null;
  const reenvioPermitido =
    Boolean(hackathonId) && (!maisRecente || maisRecente.status === "RECUSADO");

  const handleReenviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucessoMsg(null);

    const urlLimpa = novaUrl.trim();
    if (!hackathonId) {
      setErro("Escolha o hackathon de que você quer participar.");
      return;
    }
    if (!arquivo) {
      if (!urlLimpa) {
        setErro("Selecione o arquivo do comprovante ou informe um link.");
        return;
      }
      if (!urlLimpa.startsWith("https://")) {
        setErro("Informe um link HTTPS válido do documento hospedado (ex.: Cloudinary).");
        return;
      }
      if (!/\.(pdf|png|jpe?g)$/i.test(urlLimpa.split("?")[0])) {
        setErro("O arquivo deve terminar em .pdf, .png, .jpg ou .jpeg.");
        return;
      }
    }

    setEnviando(true);
    try {
      // Com arquivo, o upload vai direto ao Cloudinary e a API recebe só o link.
      const url = arquivo ? await enviarArquivoComprovante(arquivo) : urlLimpa;
      await moduloCApi.enviarComprovante(hackathonId, url);
      setNovaUrl("");
      setArquivo(null);
      setSucessoMsg("Comprovante enviado para análise da organização do hackathon.");
      await carregar();
      if (onAtualizarUsuario) await onAtualizarUsuario();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao enviar novo comprovante."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="bg-white border border-[#D8CFC0] rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EDE6D6] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B4332]">
            Comprovante de Vínculo por Hackathon
          </h2>
          <p className="text-xs text-[#5C574F] mt-1">
            Cada hackathon pede o seu comprovante de vínculo (matrícula, crachá, contrato...).
            A organização do evento confere e aprova; sem ele a equipe não é homologada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await carregar();
              if (onAtualizarUsuario) await onAtualizarUsuario();
            }}
            disabled={carregando}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8CFC0] bg-[#FAF8F5] text-[#1B4332] hover:bg-[#EDE6D6] transition-colors cursor-pointer disabled:opacity-50"
          >
            {carregando ? "Atualizando..." : "Atualizar consulta"}
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F5C2C7] text-[#9B2226] text-xs"
        >
          {erro}
        </div>
      )}

      {sucessoMsg && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#E6F4EA] border border-[#95D5B2] text-[#1B4332] text-xs font-medium"
        >
          {sucessoMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="comprovante-hackathon"
          className="block text-xs font-bold uppercase tracking-wider text-[#6B4F3B]"
        >
          Hackathon
        </label>
        <select
          id="comprovante-hackathon"
          value={hackathonId}
          onChange={(e) => {
            setHackathonId(e.target.value);
            setErro(null);
            setSucessoMsg(null);
          }}
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8CFC0] rounded-lg text-[#1F2421] focus:outline-none focus:border-[#2D6A4F]"
        >
          <option value="">Selecione um hackathon...</option>
          {hackathons
            .filter((h) => h.status === "INSCRICOES" || comprovantes.some((c) => c.hackathon_id === h.id))
            .map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome || "Hackathon sem nome"}
                {h.organizacao_nome ? ` — ${h.organizacao_nome}` : ""}
              </option>
            ))}
        </select>
        {abertos.length === 0 && (
          <p className="text-[11px] text-[#5C574F]">
            Nenhum hackathon com inscrições abertas no momento.
          </p>
        )}
      </div>

      {maisRecente && maisRecente.status !== "RECUSADO" && (
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE6D6] text-xs text-[#1F2421] flex items-center gap-2 flex-wrap">
          <BadgeComprovante status={maisRecente.status} />
          {maisRecente.status === "APROVADO"
            ? "Vínculo aprovado para este hackathon."
            : "Comprovante em análise pela organização deste hackathon."}
        </div>
      )}

      {/* Alerta de Recusa */}
      {maisRecente?.status === "RECUSADO" && (
        <div className="p-4 rounded-xl bg-[#FDECEA] border border-[#F5C2C7] space-y-1">
          <p className="text-xs font-bold text-[#9B2226]">
            Seu último comprovante foi recusado
          </p>
          <p className="text-xs text-[#7F1D1D]">
            <strong>Motivo informado:</strong>{" "}
            {maisRecente.motivo_recusa || "Documento ilegível ou inválido."}
          </p>
          <p className="text-xs text-[#7F1D1D] pt-1">
            Envie um novo comprovante abaixo para nova avaliação.
          </p>
        </div>
      )}

      {/* Formulário de Reenvio */}
      {reenvioPermitido && (
        <form
          onSubmit={handleReenviar}
          className="bg-[#FAF8F5] border border-[#EDE6D6] rounded-xl p-4 space-y-3"
        >
          <label
            htmlFor="novo-comprovante-arquivo"
            className="block text-xs font-bold uppercase tracking-wider text-[#6B4F3B]"
          >
            {maisRecente ? "Reenviar comprovante" : "Enviar comprovante"} (PDF, PNG ou JPG, até 10 MB)
          </label>
          <input
            id="novo-comprovante-arquivo"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-[#5C574F] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#1B4332] file:text-white file:font-bold file:cursor-pointer"
          />
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="novo-comprovante-url"
              type="url"
              aria-label="Ou informe o link HTTPS do comprovante"
              disabled={Boolean(arquivo)}
              placeholder="Ou cole um link: https://.../comprovante.pdf"
              value={novaUrl}
              onChange={(e) => setNovaUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#D8CFC0] rounded-lg text-[#1F2421] focus:outline-none focus:border-[#2D6A4F]"
            />
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2.5 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar comprovante"}
            </button>
          </div>
          <p className="text-[11px] text-[#5C574F]">
            Envie o arquivo ou, se preferir, um link HTTPS terminado em .pdf, .png, .jpg ou .jpeg.
          </p>
        </form>
      )}

      {/* Histórico de Comprovantes */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4F3B] mb-2.5">
          Histórico de Envios ({comprovantes.length})
        </h3>
        {carregando ? (
          <p className="text-xs text-[#5C574F]">Carregando histórico...</p>
        ) : comprovantes.length === 0 ? (
          <p className="text-xs text-[#5C574F] bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE6D6]">
            Você ainda não enviou comprovante para nenhum hackathon.
          </p>
        ) : (
          <ul className="divide-y divide-[#EDE6D6] border border-[#EDE6D6] rounded-xl overflow-hidden">
            {comprovantes.map((item) => (
              <li
                key={item.id}
                className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BadgeComprovante status={item.status} />
                    <span className="font-semibold text-[#1B4332]">
                      {nomeDoHackathon(item.hackathon_id)}
                    </span>
                    <span className="text-[#5C574F]">
                      Enviado em {formatarDataBrasilia(item.enviado_em)}
                    </span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2D6A4F] hover:underline font-mono truncate block max-w-md"
                  >
                    {item.url}
                  </a>
                  {item.motivo_recusa && (
                    <p className="text-[#9B2226]">Motivo: {item.motivo_recusa}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

