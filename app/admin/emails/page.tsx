"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { formatarDataBrasilia } from "@/lib/api";
import {
  ROTULO_STATUS_EMAIL,
  ROTULO_TIPO_EMAIL,
  emailsAdmin,
  type EmailFila,
  type StatusEmail,
  type TipoEmail,
} from "@/lib/api-admin";
import { useSession } from "@/lib/useSession";

const POR_PAGINA = 50;

const ABAS: { status: StatusEmail | ""; rotulo: string }[] = [
  { status: "", rotulo: "Todos" },
  { status: "FALHA", rotulo: "Falhas" },
  { status: "PENDENTE", rotulo: "Na fila" },
  { status: "ENVIANDO", rotulo: "Enviando" },
  { status: "ENVIADO", rotulo: "Enviados" },
];

const ESTILO_STATUS: Record<StatusEmail, { cor: string; Icone: typeof Clock }> = {
  PENDENTE: { cor: "bg-amber-100 text-amber-800", Icone: Clock },
  ENVIANDO: { cor: "bg-sky-100 text-sky-800", Icone: Loader2 },
  ENVIADO: { cor: "bg-emerald-100 text-emerald-800", Icone: CheckCircle2 },
  FALHA: { cor: "bg-red-100 text-red-800", Icone: AlertTriangle },
};

function Situacao({ e }: { e: EmailFila }) {
  if (e.cancelado_em) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700">
        <Ban className="h-3 w-3" aria-hidden="true" /> Cancelado
      </span>
    );
  }
  const { cor, Icone } = ESTILO_STATUS[e.status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${cor}`}>
      <Icone className="h-3 w-3" aria-hidden="true" /> {ROTULO_STATUS_EMAIL[e.status]}
    </span>
  );
}

const rotuloTipo = (t: TipoEmail) => ROTULO_TIPO_EMAIL[t] ?? t;

export default function AdminEmailsPage() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const [status, setStatus] = useState<StatusEmail | "">("");
  const [tipo, setTipo] = useState<TipoEmail | "">("");
  const [destinatario, setDestinatario] = useState("");
  const [destinatarioAplicado, setDestinatarioAplicado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [lista, setLista] = useState<EmailFila[] | null>(null);
  const [selecionado, setSelecionado] = useState<EmailFila | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  const carregar = useCallback(
    () =>
      emailsAdmin
        .listar({
          status: status || undefined,
          tipo: tipo || undefined,
          destinatario: destinatarioAplicado || undefined,
          limite: POR_PAGINA,
          deslocamento: pagina * POR_PAGINA,
        })
        .then((l) => {
          setLista(l);
          setSelecionado((s) => (s ? l.find((x) => x.id === s.id) ?? s : null));
        })
        .catch((e: unknown) => {
          setErro(e);
          setLista([]);
        }),
    [status, tipo, destinatarioAplicado, pagina]
  );

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  if (!pronto) return null;

  const mudarFiltro = (acao: () => void) => {
    acao();
    setPagina(0);
    setLista(null);
  };

  const abrir = (e: EmailFila) => {
    setSelecionado(e);
    setMensagem(null);
    // Situação atualizada (tentativas, próxima tentativa, último erro)
    emailsAdmin
      .obter(e.id)
      .then((atual) => {
        setSelecionado((s) => (s?.id === atual.id ? atual : s));
        setLista((l) => l?.map((x) => (x.id === atual.id ? atual : x)) ?? l);
      })
      .catch((err: unknown) => setErro(err));
  };

  const reenviar = async (e: EmailFila) => {
    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      const atual = await emailsAdmin.reenviar(e.id);
      setSelecionado(atual);
      setLista((l) => l?.map((x) => (x.id === atual.id ? atual : x)) ?? l);
      setMensagem(`E-mail para ${atual.destinatario_email} voltou para a fila. O envio sai em até 15 segundos.`);
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  const podeReenviar = (e: EmailFila) => e.status === "FALHA" && !e.cancelado_em;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Painel
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 sm:flex">
            <Mail className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Fila de e-mails</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Acompanhe os avisos automáticos da plataforma (convites, inscrições, protocolos,
              resultados, acesso de mentores). O sistema tenta de novo sozinho; quando um envio
              falha de vez, você pode devolvê-lo à fila.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLista(null);
            carregar();
          }}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
        </button>
      </header>

      <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div role="tablist" aria-label="Situação do envio" className="inline-flex flex-wrap self-start rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
          {ABAS.map((a) => (
            <button
              key={a.rotulo}
              type="button"
              role="tab"
              aria-selected={status === a.status}
              onClick={() => mudarFiltro(() => setStatus(a.status))}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                status === a.status ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Filtrar por tipo"
            value={tipo}
            onChange={(e) => mudarFiltro(() => setTipo(e.target.value as TipoEmail | ""))}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todos os tipos</option>
            {(Object.keys(ROTULO_TIPO_EMAIL) as TipoEmail[]).map((t) => (
              <option key={t} value={t}>{ROTULO_TIPO_EMAIL[t]}</option>
            ))}
          </select>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              mudarFiltro(() => setDestinatarioAplicado(destinatario.trim()));
            }}
          >
            <label className="relative flex-1">
              <span className="sr-only">Destinatário (e-mail completo)</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="email"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="E-mail completo do destinatário"
                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none sm:w-72"
              />
            </label>
            <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 cursor-pointer">
              Buscar
            </button>
            {destinatarioAplicado && (
              <button
                type="button"
                aria-label="Limpar destinatário"
                onClick={() => {
                  setDestinatario("");
                  mudarFiltro(() => setDestinatarioAplicado(""));
                }}
                className="rounded-xl border border-gray-300 bg-white px-3 text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {mensagem && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {mensagem}
          </p>
        )}
        {!!erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      </div>

      <div className={`mt-4 grid items-start gap-4 ${selecionado ? "lg:grid-cols-[1fr_24rem]" : ""}`}>
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white" aria-label="E-mails">
          {lista === null ? (
            <div className="h-80 animate-pulse bg-white" />
          ) : lista.length === 0 ? (
            <div className="p-10 text-center">
              <Inbox className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
              <p className="mt-3 text-lg font-bold text-gray-900">Nenhum e-mail aqui</p>
              <p className="mt-1 text-sm text-gray-600">
                {status === "FALHA" ? "Nenhum envio falhou." : "Tente outros filtros."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead className="border-b border-gray-100 text-[11px] uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Destinatário</th>
                      <th className="px-3 py-3 font-semibold">Tipo</th>
                      <th className="px-3 py-3 font-semibold">Situação</th>
                      <th className="px-3 py-3 font-semibold">Tentativas</th>
                      <th className="px-5 py-3 font-semibold">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lista.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => abrir(e)}
                        className={`cursor-pointer transition-colors ${selecionado?.id === e.id ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              abrir(e);
                            }}
                            className="block max-w-[18rem] text-left cursor-pointer">
                            <span className="block truncate font-semibold text-gray-900">{e.destinatario_nome || e.destinatario_email}</span>
                            {e.destinatario_nome && <span className="block truncate text-xs text-gray-500">{e.destinatario_email}</span>}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-gray-700">{rotuloTipo(e.tipo)}</td>
                        <td className="px-3 py-3"><Situacao e={e} /></td>
                        <td className="px-3 py-3 text-gray-700">{e.tentativas}/{e.max_tentativas}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-gray-600">{formatarDataBrasilia(e.criado_em)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
                <span>
                  {pagina * POR_PAGINA + 1}–{pagina * POR_PAGINA + lista.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagina === 0}
                    onClick={() => {
                      setLista(null);
                      setPagina((p) => p - 1);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anteriores
                  </button>
                  <button
                    type="button"
                    disabled={lista.length < POR_PAGINA}
                    onClick={() => {
                      setLista(null);
                      setPagina((p) => p + 1);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Próximos <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {selecionado && (
          <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-4" aria-label="Detalhes do e-mail">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Situacao e={selecionado} />
                <h2 className="mt-2 text-lg font-bold text-gray-900">{selecionado.assunto}</h2>
                <p className="mt-1 text-sm text-gray-600">{rotuloTipo(selecionado.tipo)}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setSelecionado(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-sm">
              <dt className="text-gray-500">Para</dt>
              <dd className="min-w-0 break-all text-gray-900">
                {selecionado.destinatario_nome && <span className="block font-semibold">{selecionado.destinatario_nome}</span>}
                {selecionado.destinatario_email}
              </dd>
              <dt className="text-gray-500">Tentativas</dt>
              <dd className="text-gray-900">{selecionado.tentativas} de {selecionado.max_tentativas}</dd>
              <dt className="text-gray-500">Criado em</dt>
              <dd className="text-gray-900">{formatarDataBrasilia(selecionado.criado_em)}</dd>
              {selecionado.status === "PENDENTE" && !selecionado.cancelado_em && (
                <>
                  <dt className="text-gray-500">Próxima tentativa</dt>
                  <dd className="text-gray-900">{formatarDataBrasilia(selecionado.proxima_tentativa_em)}</dd>
                </>
              )}
              {selecionado.enviado_em && (
                <>
                  <dt className="text-gray-500">Enviado em</dt>
                  <dd className="text-gray-900">{formatarDataBrasilia(selecionado.enviado_em)}</dd>
                </>
              )}
              {selecionado.cancelado_em && (
                <>
                  <dt className="text-gray-500">Cancelado em</dt>
                  <dd className="text-gray-900">{formatarDataBrasilia(selecionado.cancelado_em)}</dd>
                </>
              )}
              <dt className="text-gray-500">Atualizado em</dt>
              <dd className="text-gray-900">{formatarDataBrasilia(selecionado.atualizado_em)}</dd>
            </dl>

            {selecionado.ultimo_erro && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-[11px] font-semibold uppercase text-red-700">Último erro</p>
                <p className="mt-1 break-words font-mono text-xs text-red-900">{selecionado.ultimo_erro}</p>
              </div>
            )}

            {selecionado.cancelado_em ? (
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                Convite revogado: esta mensagem foi cancelada e não pode ser reenviada. Para dar
                acesso de novo, emita outro convite.
              </p>
            ) : podeReenviar(selecionado) ? (
              <button
                type="button"
                disabled={enviando}
                onClick={() => reenviar(selecionado)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> {enviando ? "Devolvendo à fila..." : "Reenviar"}
              </button>
            ) : (
              <p className="text-xs text-gray-500">
                {selecionado.status === "ENVIADO"
                  ? "Já enviado: reenviar duplicaria o aviso."
                  : "Ainda na fila: o sistema tenta de novo sozinho. O reenvio manual fica disponível se o envio falhar de vez."}
              </p>
            )}
            <p className="text-[11px] text-gray-500">
              O conteúdo da mensagem não é exibido: ele pode conter links de acesso e é apagado
              após o envio.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
