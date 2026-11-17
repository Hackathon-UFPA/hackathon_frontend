// components/modulo-d/EditorProposta.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  History,
  Lock,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  ApiError,
  CATALOGO_ODS,
  formatarDataBrasilia,
  moduloDApi,
  RubricaPublicadaResponse,
  SubmissaoEnviadaResponse,
  SubmissaoPayload,
  SubmissaoResponse,
  TemaItem,
  VersaoPropostaResponse,
  type SituacaoEquipe,
} from "@/lib/api";

export interface EditorPropostaProps {
  equipeId: string;
  equipeNome: string;
  hackathonId: string;
  situacaoEquipe: SituacaoEquipe;
  podeEditar: boolean;
  onPropostaAtualizada?: () => void;
}

/** Sem resposta do servidor (rede) ou erro interno: o envio pode ter sido gravado mesmo assim. */
function falhaSemConfirmacao(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 0 || err.status >= 500;
  return true;
}

interface BackupLocal {
  tema_id: string;
  titulo: string;
  descricao: string;
  ods: number[];
  bases_dados: string;
  documento_url: string;
  salvo_em: string;
}

export function EditorProposta({
  equipeId,
  equipeNome,
  hackathonId,
  situacaoEquipe,
  podeEditar,
  onPropostaAtualizada,
}: EditorPropostaProps) {
  const storageKey = `proposta_backup_${equipeId}`;

  const [temas, setTemas] = useState<TemaItem[]>([]);
  const [rubrica, setRubrica] = useState<RubricaPublicadaResponse | null>(null);
  const [rascunho, setRascunho] = useState<SubmissaoResponse | null>(null);
  const [propostaEnviada, setPropostaEnviada] =
    useState<SubmissaoEnviadaResponse | null>(null);
  const [versoes, setVersoes] = useState<VersaoPropostaResponse[]>([]);

  // Campos do formulário
  const [temaId, setTemaId] = useState<string>("");
  const [titulo, setTitulo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [odsSelecionados, setOdsSelecionados] = useState<number[]>([]);
  const [basesDados, setBasesDados] = useState<string>("");
  const [documentoUrl, setDocumentoUrl] = useState<string>("");

  // Estados de interface
  const [carregando, setCarregando] = useState<boolean>(true);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [fazendoUpload, setFazendoUpload] = useState<boolean>(false);
  const [modoReenvio, setModoReenvio] = useState<boolean>(false);
  const [confirmarEnvioAberto, setConfirmarEnvioAberto] =
    useState<boolean>(false);

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [backupRestaurado, setBackupRestaurado] = useState<boolean>(false);
  // Trava síncrona contra clique repetido (o estado `enviando` só muda no próximo render).
  const envioEmCurso = useRef(false);

  const preencherFormulario = useCallback(
    (dados: {
      tema_id?: string | null;
      titulo?: string | null;
      descricao?: string | null;
      ods?: number[] | null;
      bases_dados?: string | null;
      documento_url?: string | null;
    }) => {
      setTemaId(dados.tema_id || "");
      setTitulo(dados.titulo || "");
      setDescricao(dados.descricao || "");
      setOdsSelecionados(Array.isArray(dados.ods) ? dados.ods : []);
      setBasesDados(dados.bases_dados || "");
      setDocumentoUrl(dados.documento_url || "");
    },
    []
  );

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setBackupRestaurado(false);

    try {
      const [listaTemas, dadosRubrica, enviada, listaVersoes, rasc] =
        await Promise.all([
          hackathonId
            ? moduloDApi
                .listarTemasEdicao(hackathonId)
                .catch(() => [] as TemaItem[])
            : Promise.resolve([] as TemaItem[]),
          hackathonId
            ? moduloDApi.obterRubricaProposta(hackathonId).catch(() => null)
            : Promise.resolve(null),
          moduloDApi.obterPropostaEnviada(equipeId),
          moduloDApi.listarVersoes(equipeId),
          moduloDApi.obterRascunho(equipeId),
        ]);

      setTemas(listaTemas);
      setRubrica(dadosRubrica);
      setPropostaEnviada(enviada);
      setVersoes(listaVersoes);
      setRascunho(rasc);

      if (enviada) {
        preencherFormulario(enviada);
        setModoReenvio(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
      } else if (rasc) {
        preencherFormulario(rasc);
      } else if (typeof window !== "undefined") {
        // Verifica se há rascunho salvo localmente no navegador
        const rawBackup = localStorage.getItem(storageKey);
        if (rawBackup) {
          try {
            const parsed: BackupLocal = JSON.parse(rawBackup);
            preencherFormulario(parsed);
            setBackupRestaurado(true);
          } catch {
            // Ignora JSON inválido
          }
        } else {
          preencherFormulario({});
        }
      }
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados da proposta."
      );
    } finally {
      setCarregando(false);
    }
  }, [equipeId, hackathonId, preencherFormulario, storageKey]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Salva backup automático no navegador enquanto edita rascunho
  useEffect(() => {
    if (carregando || propostaEnviada || !podeEditar) return;
    if (typeof window === "undefined") return;

    const temAlgo =
      temaId ||
      titulo.trim() ||
      descricao.trim() ||
      odsSelecionados.length > 0 ||
      basesDados.trim() ||
      documentoUrl.trim();

    if (!temAlgo) return;

    const backup: BackupLocal = {
      tema_id: temaId,
      titulo,
      descricao,
      ods: odsSelecionados,
      bases_dados: basesDados,
      documento_url: documentoUrl,
      salvo_em: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(backup));
  }, [
    carregando,
    propostaEnviada,
    podeEditar,
    temaId,
    titulo,
    descricao,
    odsSelecionados,
    basesDados,
    documentoUrl,
    storageKey,
  ]);

  const temaSelecionadoObj = useMemo(
    () => temas.find((t) => t.id === temaId) || null,
    [temas, temaId]
  );

  const equipeNaoHomologada = situacaoEquipe === "NAO_HOMOLOGADA";
  const equipeHomologada = situacaoEquipe === "HOMOLOGADA";

  const formularioEditavel = useMemo(() => {
    if (!podeEditar || equipeNaoHomologada) return false;
    if (!propostaEnviada) return true;
    return modoReenvio;
  }, [podeEditar, equipeNaoHomologada, propostaEnviada, modoReenvio]);

  const camposObrigatoriosPreenchidos = useMemo(() => {
    return (
      Boolean(temaId.trim()) &&
      Boolean(titulo.trim()) &&
      Boolean(descricao.trim()) &&
      odsSelecionados.length > 0 &&
      Boolean(basesDados.trim())
    );
  }, [temaId, titulo, descricao, odsSelecionados, basesDados]);

  const alternarOds = (numero: number) => {
    if (!formularioEditavel) return;
    setOdsSelecionados((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero].sort((a, b) => a - b)
    );
  };

  const montarPayloadRascunho = (): SubmissaoPayload => ({
    tema_id: temaId.trim() ? temaId.trim() : null,
    titulo: titulo.trim() ? titulo.trim() : null,
    descricao: descricao.trim() ? descricao.trim() : null,
    ods: odsSelecionados.length > 0 ? odsSelecionados : null,
    bases_dados: basesDados.trim() ? basesDados.trim() : null,
    documento_url: documentoUrl.trim() ? documentoUrl.trim() : null,
  });

  const handleUploadDocumento = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setErro(
        "Upload direto indisponível. Cole o link HTTPS do documento no campo ao lado."
      );
      return;
    }

    setFazendoUpload(true);
    setErro(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Falha ao enviar o arquivo anexo.");
      }

      const data = await res.json();
      if (data.secure_url) {
        setDocumentoUrl(data.secure_url);
        setSucesso("Documento complementar anexado com sucesso.");
      }
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao anexar documento."
      );
    } finally {
      setFazendoUpload(false);
    }
  };

  const handleSalvarRascunho = async () => {
    if (!formularioEditavel || propostaEnviada) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);

    try {
      const payload = montarPayloadRascunho();
      const salvo = rascunho
        ? await moduloDApi.editarRascunho(equipeId, payload)
        : await moduloDApi.criarRascunho(equipeId, payload);

      setRascunho(salvo);
      setBackupRestaurado(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      setSucesso(
        `Rascunho salvo no servidor às ${formatarDataBrasilia(salvo.atualizado_em || new Date().toISOString())}.`
      );
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar rascunho."
      );
    } finally {
      setSalvando(false);
    }
  };

  /**
   * PRO-02: se a conexão cair depois do envio, consulta a proposta enviada antes de
   * orientar uma nova tentativa. Devolve true se o servidor registrou uma versão nova.
   */
  const confirmarEnvioNoServidor = async (versaoAnterior: number): Promise<boolean> => {
    try {
      const enviada = await moduloDApi.obterPropostaEnviada(equipeId);
      if (!enviada || (enviada.versao ?? 1) <= versaoAnterior) return false;
      setPropostaEnviada(enviada);
      preencherFormulario(enviada);
      setRascunho(null);
      setModoReenvio(false);
      if (typeof window !== "undefined") localStorage.removeItem(storageKey);
      setVersoes(await moduloDApi.listarVersoes(equipeId).catch(() => versoes));
      setSucesso(
        `A conexão falhou, mas o servidor registrou o envio. Protocolo: ${enviada.protocolo.numero}.`
      );
      onPropostaAtualizada?.();
      return true;
    } catch {
      return false;
    }
  };

  const handleEnviarDefinitivo = async () => {
    if (envioEmCurso.current) return;
    if (!formularioEditavel || !equipeHomologada) return;
    if (!camposObrigatoriosPreenchidos) {
      setErro(
        "Preencha tema, título, descrição, pelo menos 1 ODS e as bases de dados antes de enviar."
      );
      return;
    }

    envioEmCurso.current = true;
    setEnviando(true);
    setErro(null);
    setSucesso(null);
    setConfirmarEnvioAberto(false);

    try {
      // Garante que o rascunho no servidor esteja sincronizado com o formulário atual
      const payload = montarPayloadRascunho();
      const rascunhoAtualizado = rascunho
        ? await moduloDApi.editarRascunho(equipeId, payload)
        : await moduloDApi.criarRascunho(equipeId, payload);
      setRascunho(rascunhoAtualizado);

      // Envio definitivo
      const resposta = await moduloDApi.enviarProposta(equipeId);
      setPropostaEnviada(resposta);
      setRascunho(null);
      setModoReenvio(false);

      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }

      const historicoAtualizado = await moduloDApi.listarVersoes(equipeId);
      setVersoes(historicoAtualizado);

      setSucesso(
        `Proposta enviada com sucesso! Protocolo oficial emitido: ${resposta.protocolo.numero}.`
      );
      onPropostaAtualizada?.();
    } catch (err: unknown) {
      if (falhaSemConfirmacao(err) && (await confirmarEnvioNoServidor(0))) return;
      setErro(
        falhaSemConfirmacao(err)
          ? "Não foi possível confirmar o envio e a proposta não consta como enviada no servidor. Confira a conexão e tente novamente."
          : err instanceof Error
            ? err.message
            : "Não foi possível enviar a proposta definitiva."
      );
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  };

  const handleReenviarNovaVersao = async () => {
    if (envioEmCurso.current) return;
    if (!formularioEditavel || !propostaEnviada || !equipeHomologada) return;
    if (!camposObrigatoriosPreenchidos) {
      setErro(
        "Preencha todos os campos obrigatórios antes de confirmar a nova versão."
      );
      return;
    }

    const versaoAnterior = propostaEnviada.versao ?? 1;
    envioEmCurso.current = true;
    setEnviando(true);
    setErro(null);
    setSucesso(null);
    setConfirmarEnvioAberto(false);

    try {
      const resposta = await moduloDApi.reenviarProposta(equipeId, {
        tema_id: temaId.trim(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        ods: odsSelecionados,
        bases_dados: basesDados.trim(),
        documento_url: documentoUrl.trim() ? documentoUrl.trim() : null,
      });

      setPropostaEnviada(resposta);
      setModoReenvio(false);

      const historicoAtualizado = await moduloDApi.listarVersoes(equipeId);
      setVersoes(historicoAtualizado);

      setSucesso(
        `Versão ${resposta.versao ?? ""} registrada com sucesso! Novo protocolo: ${resposta.protocolo.numero}.`
      );
      onPropostaAtualizada?.();
    } catch (err: unknown) {
      if (falhaSemConfirmacao(err) && (await confirmarEnvioNoServidor(versaoAnterior))) return;
      setErro(
        falhaSemConfirmacao(err)
          ? "Não foi possível confirmar o reenvio e nenhuma versão nova consta no servidor. Confira a conexão e tente novamente."
          : err instanceof Error
            ? err.message
            : "Não foi possível registrar o reenvio da proposta."
      );
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
        <p className="font-mono text-xs text-emerald-700">
          Carregando editor de proposta, temas e rubrica científica...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Coluna Principal (2/3): Status, Protocolo, Formulário e Histórico */}
      <div className="space-y-6 lg:col-span-2">
        {/* Alertas de Feedback */}
        {erro && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <span>{sucesso}</span>
          </div>
        )}

        {backupRestaurado && !propostaEnviada && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800">
            <span>
              Recuperamos uma edição local não sincronizada deste navegador.
              Clique em <strong>Salvar Rascunho</strong> para gravar no
              servidor.
            </span>
          </div>
        )}

        {/* Banners de Permissão / Homologação */}
        {!podeEditar && (
          <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-gray-900">Modo Somente Leitura</p>
              <p className="mt-0.5 text-gray-600">
                Você está visualizando a proposta da equipe{" "}
                <strong className="text-gray-800">{equipeNome}</strong>. Apenas o{" "}
                <strong className="text-emerald-700">Líder Técnico</strong> da
                equipe pode salvar rascunhos, enviar ou reenviar versões.
              </p>
            </div>
          </div>
        )}

        {podeEditar && equipeNaoHomologada && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold text-rose-100">
                Equipe Não Homologada (Somente Leitura)
              </p>
              <p className="mt-0.5">
                A inscrição desta equipe não foi homologada. Por regra do
                regulamento, não é possível criar, editar ou submeter propostas.
              </p>
            </div>
          </div>
        )}

        {podeEditar && !equipeHomologada && !equipeNaoHomologada && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-800">
                Rascunho Liberado • Envio Aguardando Homologação ({situacaoEquipe})
              </p>
              <p className="mt-0.5 text-amber-800">
                Você já pode preencher e salvar o rascunho da proposta
                normalmente. O botão <strong>Enviar Proposta Definitiva</strong>{" "}
                será habilitado assim que a situação da equipe mudar para{" "}
                <strong>HOMOLOGADA</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Recibo de Protocolo Oficial (quando já enviada) */}
        {propostaEnviada && (
          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 backdrop-blur-xl space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                    Proposta Submetida • Versão {propostaEnviada.versao ?? 1}
                  </span>
                  <h2 className="text-base font-extrabold text-gray-900">
                    Protocolo: {propostaEnviada.protocolo.numero}
                  </h2>
                  <p className="text-xs text-emerald-800">
                    Emitido em{" "}
                    {formatarDataBrasilia(propostaEnviada.protocolo.emitido_em)}
                  </p>
                </div>
              </div>

              {podeEditar && equipeHomologada && !modoReenvio && (
                <button
                  type="button"
                  onClick={() => {
                    setModoReenvio(true);
                    setErro(null);
                    setSucesso(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-[#F6F9F8]/80 px-4 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-black"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Editar e Enviar Nova Versão
                </button>
              )}
            </div>

            {modoReenvio && (
              <div className="rounded-xl border border-amber-400/30 bg-[#F6F9F8]/70 p-3 text-xs text-amber-800">
                <strong>Modo de Reenvio Versionado ativo:</strong> altere os
                campos desejados abaixo e clique em{" "}
                <strong>Confirmar Reenvio (Nova Versão)</strong>. A versão
                anterior permanecerá salva no histórico.
              </div>
            )}
          </section>
        )}

        {/* Formulário Principal da Proposta */}
        <section className="rounded-2xl border border-gray-200 bg-white/[0.04] p-6 backdrop-blur-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                {propostaEnviada
                  ? modoReenvio
                    ? "Nova Versão da Proposta Científica"
                    : "Conteúdo da Proposta Enviada"
                  : "Rascunho da Proposta Científica"}
              </h2>
              <p className="text-xs text-gray-600">
                Equipe: <strong className="text-gray-800">{equipeNome}</strong>
                {rascunho?.atualizado_em && !propostaEnviada && (
                  <>
                    {" "}
                    • Último salvamento:{" "}
                    <span className="text-emerald-700">
                      {formatarDataBrasilia(rascunho.atualizado_em)}
                    </span>
                  </>
                )}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                propostaEnviada
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-700"
                  : "border border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {propostaEnviada ? "ENVIADA" : "RASCUNHO"}
            </span>
          </div>

          {/* 1. Seleção do Tema */}
          <div className="space-y-2">
            <label
              htmlFor="campo-tema"
              className="block text-xs font-bold text-gray-800"
            >
              1. Tema / Desafio da Edição <span className="text-rose-400">*</span>
            </label>
            <select
              id="campo-tema"
              disabled={!formularioEditavel}
              value={temaId}
              onChange={(e) => setTemaId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F6F9F8] px-3.5 py-2.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            >
              <option value="">-- Selecione um tema ativo --</option>
              {temas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>

            {temaSelecionadoObj && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs space-y-1.5">
                <p className="font-bold text-emerald-700">
                  {temaSelecionadoObj.titulo}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {temaSelecionadoObj.descricao}
                </p>
                {temaSelecionadoObj.contexto && (
                  <p className="text-gray-600">
                    <strong>Contexto:</strong> {temaSelecionadoObj.contexto}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Título da Solução */}
          <div className="space-y-2">
            <label
              htmlFor="campo-titulo"
              className="block text-xs font-bold text-gray-800"
            >
              2. Título da Proposta <span className="text-rose-400">*</span>
            </label>
            <input
              id="campo-titulo"
              type="text"
              maxLength={255}
              disabled={!formularioEditavel}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Monitoramento Preditivo de Queimadas com IA na Amazônia"
              className="w-full rounded-xl border border-gray-200 bg-[#F6F9F8] px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* 3. Descrição Científica e Metodologia */}
          <div className="space-y-2">
            <label
              htmlFor="campo-descricao"
              className="block text-xs font-bold text-gray-800"
            >
              3. Resumo Executivo, Problema, Metodologia e Impacto{" "}
              <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="campo-descricao"
              rows={7}
              disabled={!formularioEditavel}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema abordado, a abordagem científica/técnica, o uso de Inteligência Artificial e o impacto esperado..."
              className="w-full rounded-xl border border-gray-200 bg-[#F6F9F8] p-3.5 text-xs leading-relaxed text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* 4. ODS Relacionados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                4. Objetivos de Desenvolvimento Sustentável (ODS){" "}
                <span className="text-rose-400">*</span>
              </span>
              <span className="text-[11px] text-emerald-700">
                {odsSelecionados.length} selecionado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CATALOGO_ODS.map((ods) => {
                const ativo = odsSelecionados.includes(ods.numero);
                return (
                  <button
                    key={ods.numero}
                    type="button"
                    disabled={!formularioEditavel}
                    onClick={() => alternarOds(ods.numero)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      ativo
                        ? "border-emerald-400 bg-emerald-500/20 text-white font-semibold"
                        : "border-gray-200 bg-[#F6F9F8]/70 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                    } disabled:cursor-not-allowed disabled:opacity-65`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${
                        ativo
                          ? "bg-emerald-500 text-black"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ods.numero}
                    </span>
                    <span className="truncate">{ods.titulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Bases de Dados */}
          <div className="space-y-2">
            <label
              htmlFor="campo-bases"
              className="block text-xs font-bold text-gray-800"
            >
              5. Bases de Dados Utilizadas ou Previstas{" "}
              <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="campo-bases"
              rows={3}
              disabled={!formularioEditavel}
              value={basesDados}
              onChange={(e) => setBasesDados(e.target.value)}
              placeholder="Ex.: INPE (TerraBrasilis / PRODES), IBGE Censo 2022, MapBiomas..."
              className="w-full rounded-xl border border-gray-200 bg-[#F6F9F8] p-3.5 text-xs text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* 6. Documento Complementar (Opcional) */}
          <div className="space-y-2">
            <label
              htmlFor="campo-doc"
              className="block text-xs font-bold text-gray-800"
            >
              6. Link de Documento Complementar (Opcional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="campo-doc"
                type="url"
                disabled={!formularioEditavel}
                value={documentoUrl}
                onChange={(e) => setDocumentoUrl(e.target.value)}
                placeholder="https://... (PDF técnico, arquitetura ou anexo)"
                className="flex-1 rounded-xl border border-gray-200 bg-[#F6F9F8] px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
              />

              {formularioEditavel && (
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-800 transition-colors hover:border-emerald-400/50 hover:text-gray-900">
                  <Upload className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{fazendoUpload ? "Enviando..." : "Anexar PDF"}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={fazendoUpload}
                    onChange={handleUploadDocumento}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {documentoUrl && (
              <a
                href={documentoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir documento anexado
              </a>
            )}
          </div>

          {/* Barra de Ações */}
          {formularioEditavel && (
            <div className="flex flex-col justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">
              {!propostaEnviada ? (
                <>
                  <button
                    type="button"
                    disabled={salvando || enviando}
                    onClick={handleSalvarRascunho}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-xs font-bold text-gray-900 transition-colors hover:border-emerald-400/50 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 text-emerald-700" />
                    {salvando ? "Salvando Rascunho..." : "Salvar Rascunho"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      salvando ||
                      enviando ||
                      !equipeHomologada ||
                      !camposObrigatoriosPreenchidos
                    }
                    onClick={() => setConfirmarEnvioAberto(true)}
                    title={
                      !equipeHomologada
                        ? "A equipe precisa estar HOMOLOGADA para enviar"
                        : !camposObrigatoriosPreenchidos
                          ? "Preencha todos os campos obrigatórios"
                          : "Enviar proposta definitiva"
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-extrabold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    {enviando
                      ? "Enviando Proposta..."
                      : "Enviar Proposta Definitiva"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => {
                      setModoReenvio(false);
                      preencherFormulario(propostaEnviada);
                      setConfirmarEnvioAberto(false);
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar Edição
                  </button>

                  <button
                    type="button"
                    disabled={enviando || !camposObrigatoriosPreenchidos}
                    onClick={() => setConfirmarEnvioAberto(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-extrabold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {enviando
                      ? "Registrando Nova Versão..."
                      : "Confirmar Reenvio (Nova Versão)"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Confirmação Explícita antes de Enviar / Reenviar */}
          {confirmarEnvioAberto && (
            <div className="rounded-2xl border border-emerald-500/40 bg-[#F6F9F8] p-4 space-y-3">
              <p className="text-xs font-bold text-gray-900">
                {propostaEnviada
                  ? "Confirmar envio de nova versão da proposta?"
                  : "Confirmar envio definitivo da proposta?"}
              </p>
              {/* Resumo do que será enviado (PRO-02) */}
              <dl className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200 bg-white/[0.03] p-3 text-xs sm:grid-cols-[auto_1fr]">
                <dt className="font-bold text-gray-600">Tema</dt>
                <dd className="text-gray-800">{temaSelecionadoObj?.titulo || "—"}</dd>
                <dt className="font-bold text-gray-600">Título</dt>
                <dd className="text-gray-800">{titulo.trim() || "—"}</dd>
                <dt className="font-bold text-gray-600">ODS</dt>
                <dd className="text-gray-800">{odsSelecionados.join(", ") || "—"}</dd>
                <dt className="font-bold text-gray-600">Descrição</dt>
                <dd className="text-gray-800">
                  {descricao.trim().length > 220
                    ? `${descricao.trim().slice(0, 220)}…`
                    : descricao.trim() || "—"}
                </dd>
                <dt className="font-bold text-gray-600">Bases de dados</dt>
                <dd className="text-gray-800">{basesDados.trim() || "—"}</dd>
                <dt className="font-bold text-gray-600">Documento</dt>
                <dd className="text-gray-800">{documentoUrl.trim() ? "Anexado" : "Nenhum"}</dd>
              </dl>
              <p className="text-xs text-gray-600">
                O servidor registrará esta versão com data e hora oficiais e
                emitirá um protocolo <strong>PROPOSTA</strong>. A versão enviada
                não pode ser alterada: dentro do período de propostas, o líder
                pode enviar uma nova versão, e as anteriores ficam no histórico.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={enviando}
                  onClick={
                    propostaEnviada
                      ? handleReenviarNovaVersao
                      : handleEnviarDefinitivo
                  }
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {enviando ? "Enviando..." : "Sim, Confirmar Envio"}
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setConfirmarEnvioAberto(false)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Voltar e Revisar
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Histórico Imutável de Versões */}
        {versoes.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white/[0.04] p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-extrabold text-gray-900">
                Histórico de Versões Enviadas ({versoes.length})
              </h3>
            </div>

            <div className="space-y-3">
              {versoes.map((v) => (
                <div
                  key={v.numero}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-[#F6F9F8]/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
                        Versão {v.numero}
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {v.protocolo.numero}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800">
                      {v.titulo || "Sem título"}
                    </p>
                  </div>

                  <div className="text-left text-[11px] text-gray-600 sm:text-right">
                    <span className="block">Enviada em</span>
                    <span className="font-medium text-gray-800">
                      {formatarDataBrasilia(v.enviada_em)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Coluna Lateral (1/3): Rubrica Científica da Fase PROPOSTA */}
      <aside className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white/[0.04] p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3.5">
            <BookOpen className="h-4 w-4 text-emerald-700" />
            <div>
              <h2 className="text-sm font-extrabold text-gray-900">
                Rubrica de Avaliação
              </h2>
              <p className="text-[11px] text-gray-600">
                Critérios oficiais da fase Proposta
              </p>
            </div>
          </div>

          {!rubrica || rubrica.criterios.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-[#F6F9F8]/60 p-4 text-xs text-gray-600">
              A rubrica científica desta edição ainda não foi publicada pelo
              Comitê Científico.
            </div>
          ) : (
            <div className="space-y-3">
              {rubrica.criterios.map((crit) => (
                <div
                  key={crit.id}
                  className="rounded-xl border border-gray-200 bg-[#F6F9F8]/70 p-3.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-gray-900">
                      {crit.ordem}. {crit.nome}
                    </h3>
                    <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
                      {crit.peso}%
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-600">
                    {crit.descricao}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500">
                    Escala: {crit.escala_min} a {crit.escala_max} pontos
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-[11px] text-gray-700 space-y-1">
            <p className="flex items-center gap-1.5 font-bold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Dica de Submissão
            </p>
            <p className="leading-relaxed text-gray-600">
              Alinhe o resumo metodológico e as bases de dados aos pesos da
              rubrica acima antes do envio definitivo.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}