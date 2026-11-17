"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { IlustracaoComprovante, IlustracaoTudoEmDia } from "@/components/ilustracoes/Ilustracoes";
import { formatarData } from "@/components/plataforma/hackathon-util";
import {
  ApiError,
  comprovantes,
  hackathons as hackathonsApi,
  type ComprovanteAdmin,
  type StatusComprovante,
} from "@/lib/api";
import { useSession } from "@/lib/useSession";

const ABAS: { status: StatusComprovante; rotulo: string }[] = [
  { status: "PENDENTE", rotulo: "Pendentes" },
  { status: "APROVADO", rotulo: "Aprovados" },
  { status: "RECUSADO", rotulo: "Recusados" },
];

// Motivos comuns: um clique preenche o campo, que continua editável
const MOTIVOS_PRONTOS = [
  "Documento ilegível",
  "Documento não comprova o vínculo",
  "Nome diferente do cadastro",
  "Documento vencido",
];

const LIMITE = 200;

const msgErro = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Erro inesperado.";

const ehImagem = (url: string) => /\.(png|jpe?g)(\?|$)/i.test(url);
const ehPdf = (url: string) => /\.pdf(\?|$)/i.test(url);

function iniciais(nome: string) {
  return nome
    .split(/[\s@.]+/)
    .map((p) => p.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function tempoDesde(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (min < 60) return rtf.format(-Math.max(min, 0), "minute");
  if (min < 60 * 48) return rtf.format(-Math.round(min / 60), "hour");
  return rtf.format(-Math.round(min / 1440), "day");
}

function Documento({ url }: { url: string }) {
  if (ehImagem(url)) {
    // eslint-disable-next-line @next/next/no-img-element -- arquivo externo (Cloudinary), sem otimização do Next
    return <img src={url} alt="Comprovante de vínculo enviado" className="mx-auto max-h-[55vh] w-auto rounded-xl object-contain" />;
  }
  if (ehPdf(url)) {
    return <iframe src={url} title="Comprovante de vínculo (PDF)" className="h-[55vh] w-full rounded-xl border border-gray-200 bg-white" />;
  }
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 text-sm text-gray-600">
      <FileText className="h-8 w-8 text-gray-400" aria-hidden="true" />
      Pré-visualização indisponível para este arquivo.
    </div>
  );
}

export default function AdminComprovantesPage() {
  const { pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const [status, setStatus] = useState<StatusComprovante>("PENDENTE");
  const [lista, setLista] = useState<ComprovanteAdmin[] | null>(null);
  const [contagem, setContagem] = useState<Partial<Record<StatusComprovante, number>>>({});
  const [nomesHackathon, setNomesHackathon] = useState<Record<string, string>>({});
  const [filtroHackathon, setFiltroHackathon] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Nomes dos hackathons (a vitrine pública basta: comprovante só existe com inscrições abertas)
  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .listar()
      .then((l) => setNomesHackathon(Object.fromEntries(l.map((h) => [h.id, h.nome || "Sem nome"]))))
      .catch(() => {});
  }, [pronto]);

  const carregar = useCallback(
    (manterSelecao?: string | null) =>
      Promise.all(ABAS.map((a) => comprovantes.fila({ status: a.status, limite: LIMITE })))
        .then((resultados) => {
          setContagem(Object.fromEntries(ABAS.map((a, i) => [a.status, resultados[i].length])));
          const atual = resultados[ABAS.findIndex((a) => a.status === status)];
          setLista(atual);
          setSelecionadoId((sel) => {
            const alvo = manterSelecao === undefined ? sel : manterSelecao;
            return atual.some((c) => c.id === alvo) ? alvo! : atual[0]?.id ?? null;
          });
        })
        .catch((e: unknown) => setErro(msgErro(e))),
    [status]
  );

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (lista ?? []).filter(
      (c) =>
        (!filtroHackathon || c.hackathon_id === filtroHackathon) &&
        (!termo ||
          [c.usuario.nome, c.usuario.email, c.usuario.instituicao, c.usuario.curso].some((v) =>
            v?.toLowerCase().includes(termo)
          ))
    );
  }, [lista, busca, filtroHackathon]);

  const hackathonsNaLista = useMemo(
    () => [...new Set((lista ?? []).map((c) => c.hackathon_id))],
    [lista]
  );

  const selecionado = visiveis.find((c) => c.id === selecionadoId) ?? visiveis[0] ?? null;

  if (!pronto) return null;

  const trocarAba = (s: StatusComprovante) => {
    setStatus(s);
    setLista(null);
    setSelecionadoId(null);
    setRecusando(false);
    setMensagem(null);
  };

  const selecionar = (id: string) => {
    setSelecionadoId(id);
    setRecusando(false);
    setMotivo("");
  };

  // Depois de decidir, segue para o próximo da fila (o que estava logo abaixo)
  const decidir = async (acao: () => Promise<unknown>, ok: string) => {
    if (!selecionado) return;
    const indice = visiveis.findIndex((c) => c.id === selecionado.id);
    const proximo = visiveis[indice + 1]?.id ?? visiveis[indice - 1]?.id ?? null;
    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      await acao();
      setMensagem(ok);
      setRecusando(false);
      setMotivo("");
      await carregar(proximo);
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setEnviando(false);
    }
  };

  const nome = (c: ComprovanteAdmin) => c.usuario.nome || c.usuario.email;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      {/* Cabeçalho */}
      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <IlustracaoComprovante className="hidden h-20 w-24 shrink-0 sm:block" />
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Comprovantes de vínculo</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-600">
              Confira o documento de quem quer participar dos seus hackathons. Ao aprovar, a equipe da
              pessoa é reavaliada e pode ser homologada na hora.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => carregar()}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
        </button>
      </header>

      {/* Abas e filtros */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Situação" className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
          {ABAS.map((a) => (
            <button
              key={a.status}
              type="button"
              role="tab"
              aria-selected={status === a.status}
              onClick={() => trocarAba(a.status)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                status === a.status ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {a.rotulo}
              {contagem[a.status] !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    status === a.status
                      ? "bg-white/25 text-white"
                      : a.status === "PENDENTE" && contagem[a.status]
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {contagem[a.status]! >= LIMITE ? `${LIMITE}+` : contagem[a.status]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Buscar participante</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou curso"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none sm:w-72"
            />
          </label>
          {hackathonsNaLista.length > 1 && (
            <select
              aria-label="Filtrar por hackathon"
              value={filtroHackathon}
              onChange={(e) => setFiltroHackathon(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos os hackathons</option>
              {hackathonsNaLista.map((id) => (
                <option key={id} value={id}>{nomesHackathon[id] ?? "Hackathon"}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {mensagem && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {mensagem}
          </p>
        )}
        {erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      </div>

      {/* Lista + detalhe */}
      {lista === null ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </div>
      ) : visiveis.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <IlustracaoTudoEmDia className="mx-auto h-28 w-32" />
          <p className="mt-4 text-lg font-bold text-gray-900">
            {lista.length > 0 ? "Nada encontrado com esses filtros" : status === "PENDENTE" ? "Tudo em dia!" : "Nenhum comprovante aqui"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {lista.length > 0
              ? "Tente outra busca ou outro hackathon."
              : status === "PENDENTE"
                ? "Não há comprovantes aguardando conferência."
                : `Nenhum comprovante ${status === "APROVADO" ? "aprovado" : "recusado"} ainda.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[22rem_1fr]">
          {/* Lista */}
          <ul className="max-h-[75vh] space-y-2 overflow-y-auto rounded-3xl border border-gray-200 bg-white p-3" aria-label="Comprovantes">
            {visiveis.map((c) => {
              const ativo = selecionado?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selecionar(c.id)}
                    aria-current={ativo}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors cursor-pointer ${
                      ativo ? "bg-emerald-50 ring-2 ring-emerald-500" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                      {iniciais(nome(c))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{nome(c)}</span>
                      <span className="block truncate text-xs text-gray-500">{nomesHackathon[c.hackathon_id] ?? "Hackathon"}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{tempoDesde(c.enviado_em)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detalhe */}
          {selecionado && (
            <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6" aria-label={`Comprovante de ${nome(selecionado)}`}>
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                    {iniciais(nome(selecionado))}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900">{nome(selecionado)}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {selecionado.usuario.email}
                    </p>
                    {(selecionado.usuario.instituicao || selecionado.usuario.curso) && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {[
                          selecionado.usuario.instituicao,
                          selecionado.usuario.curso,
                          selecionado.usuario.periodo && `${selecionado.usuario.periodo}º período`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-sm sm:text-right">
                  <dt className="text-gray-500">Hackathon</dt>
                  <dd className="font-semibold text-gray-900">{nomesHackathon[selecionado.hackathon_id] ?? "—"}</dd>
                  <dt className="text-gray-500">Enviado em</dt>
                  <dd className="text-gray-900">{formatarData(selecionado.enviado_em) ?? "—"}</dd>
                  {selecionado.validado_em && (
                    <>
                      <dt className="text-gray-500">Decidido em</dt>
                      <dd className="text-gray-900">{formatarData(selecionado.validado_em)}</dd>
                    </>
                  )}
                </dl>
              </div>

              {selecionado.motivo_recusa && (
                <p className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span><strong>Motivo da recusa:</strong> {selecionado.motivo_recusa}</span>
                </p>
              )}

              {selecionado.status === "PENDENTE" && (
                <div className="mt-5">
                  {!recusando ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() => decidir(() => comprovantes.aprovar(selecionado.id), `Vínculo de ${nome(selecionado)} aprovado.`)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {enviando ? "Salvando..." : "Aprovar vínculo"}
                      </button>
                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() => setRecusando(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" /> Recusar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4">
                      <label htmlFor="motivo" className="block text-sm font-bold text-gray-900">
                        Motivo da recusa <span className="font-normal text-gray-500">(a pessoa vê este texto e pode enviar outro documento)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MOTIVOS_PRONTOS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMotivo(m)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                              motivo === m ? "border-red-400 bg-red-100 text-red-800" : "border-gray-300 bg-white text-gray-700 hover:border-red-300"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <textarea
                        id="motivo"
                        rows={2}
                        maxLength={2000}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Explique o que precisa ser corrigido"
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-red-400 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!motivo.trim() || enviando}
                          onClick={() => decidir(() => comprovantes.recusar(selecionado.id, motivo.trim()), `Comprovante de ${nome(selecionado)} recusado.`)}
                          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                        >
                          {enviando ? "Salvando..." : "Confirmar recusa"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecusando(false);
                            setMotivo("");
                          }}
                          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Documento enviado</h3>
                  <a href={selecionado.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
                    Abrir em nova aba <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <Documento key={selecionado.id} url={selecionado.arquivo_url} />
                </div>
              </div>

            </section>
          )}
        </div>
      )}
    </main>
  );
}
