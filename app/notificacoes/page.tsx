"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Check } from "lucide-react";
import { ApiError, formatarDataBrasilia } from "@/lib/api";
import {
  avisarNotificacoesAlteradas,
  EVENTO_NOTIFICACOES_ALTERADAS,
  linkDaNotificacao,
  notificacoes as notificacoesApi,
  ROTULO_TIPO_NOTIFICACAO,
  type Notificacao,
  type TipoNotificacao,
} from "@/lib/api-participante";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { IconeNotificacao } from "@/components/notificacoes/visual";

const POR_PAGINA = 20;
const TIPOS = Object.keys(ROTULO_TIPO_NOTIFICACAO) as TipoNotificacao[];

type FiltroLeitura = "todas" | "nao-lidas";

/** Central de notificações (RF19, RF22, RF28, RF33, RF38...): qualquer perfil com conta ativa. */
export default function NotificacoesPage() {
  const { user, pronto } = useSession();

  const [lista, setLista] = useState<Notificacao[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [leitura, setLeitura] = useState<FiltroLeitura>("todas");
  const [tipo, setTipo] = useState<TipoNotificacao | "">("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [erro, setErro] = useState<unknown>(null);

  const filtro = useCallback(
    (deslocamento: number) => ({
      lida: leitura === "nao-lidas" ? false : undefined,
      tipo: tipo || undefined,
      limite: POR_PAGINA,
      deslocamento,
    }),
    [leitura, tipo]
  );

  const contar = useCallback(() => {
    notificacoesApi
      .contarNaoLidas()
      .then((r) => setNaoLidas(r.nao_lidas))
      .catch(() => {});
  }, []);

  // Estado só nos callbacks da promise: o efeito abaixo chama esta função.
  const carregar = useCallback(() => {
    notificacoesApi
      .listar(filtro(0))
      .then((l) => {
        setErro(null);
        setLista(l);
        setTemMais(l.length === POR_PAGINA);
      })
      .catch((e) => setErro(e))
      .finally(() => setCarregando(false));
    contar();
  }, [filtro, contar]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  // O sino (ou outra ação nesta aba) pode marcar como lidas.
  useEffect(() => {
    window.addEventListener(EVENTO_NOTIFICACOES_ALTERADAS, contar);
    return () => window.removeEventListener(EVENTO_NOTIFICACOES_ALTERADAS, contar);
  }, [contar]);

  const carregarMais = async () => {
    setCarregandoMais(true);
    try {
      const l = await notificacoesApi.listar(filtro(lista.length));
      setLista((atual) => [...atual, ...l]);
      setTemMais(l.length === POR_PAGINA);
    } catch (e) {
      setErro(e);
    } finally {
      setCarregandoMais(false);
    }
  };

  const marcarLida = async (n: Notificacao) => {
    if (n.lida_em) return;
    try {
      const lida = await notificacoesApi.marcarLida(n.notificacao_id);
      setLista((l) =>
        leitura === "nao-lidas"
          ? l.filter((x) => x.notificacao_id !== n.notificacao_id)
          : l.map((x) => (x.notificacao_id === n.notificacao_id ? lida : x))
      );
      setNaoLidas((c) => Math.max(0, c - 1));
      avisarNotificacoesAlteradas();
    } catch (e) {
      setErro(e);
    }
  };

  const marcarTodas = async () => {
    setMarcandoTodas(true);
    try {
      await notificacoesApi.marcarTodasLidas();
      const agora = new Date().toISOString();
      setLista((l) => (leitura === "nao-lidas" ? [] : l.map((x) => (x.lida_em ? x : { ...x, lida_em: agora }))));
      setNaoLidas(0);
      avisarNotificacoesAlteradas();
    } catch (e) {
      setErro(e);
    } finally {
      setMarcandoTodas(false);
    }
  };

  if (!pronto) return null;

  const contaPendente = erro instanceof ApiError && erro.status === 403;

  const chip = (ativo: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      ativo
        ? "border-emerald-600 bg-emerald-600 text-white"
        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
    }`;

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 px-4 py-8 sm:px-6 selection:bg-emerald-500/30">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Link href="/" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar ao início
        </Link>

        <header className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
              <p className="mt-0.5 text-xs text-gray-600">
                Convites, inscrição, proposta, resultado e mentoria, do mais recente para o mais antigo.
                {naoLidas > 0 && (
                  <strong className="ml-1 text-emerald-700">
                    {naoLidas} não lida{naoLidas > 1 ? "s" : ""}.
                  </strong>
                )}
              </p>
            </div>
          </div>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={marcarTodas}
              disabled={marcandoTodas}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              {marcandoTodas ? "Marcando..." : "Marcar todas como lidas"}
            </button>
          )}
        </header>

        {!contaPendente && (
          <section className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por leitura">
              <button type="button" className={chip(leitura === "todas")} onClick={() => { setCarregando(true); setLeitura("todas"); }}>
                Todas
              </button>
              <button
                type="button"
                className={chip(leitura === "nao-lidas")}
                onClick={() => { setCarregando(true); setLeitura("nao-lidas"); }}
              >
                Não lidas
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              Assunto
              <select
                value={tipo}
                onChange={(e) => {
                  setCarregando(true);
                  setTipo(e.target.value as TipoNotificacao | "");
                }}
                className="rounded-lg border border-gray-300 bg-[#F6F9F8] px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Todos</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO_NOTIFICACAO[t]}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}

        {contaPendente ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            A central de notificações abre quando sua conta estiver ativa, depois que a organização
            aprovar o seu comprovante. Enquanto isso, os convites para equipes aparecem em{" "}
            <Link href="/equipe" className="font-semibold underline">
              Minha Equipe
            </Link>
            .
          </p>
        ) : (
          erro !== null && (
            <ApiErrorAlert
              erro={erro}
              onRetry={() => {
                setCarregando(true);
                setErro(null);
                carregar();
              }}
            />
          )
        )}

        {contaPendente ? null : carregando ? (
          <p className="text-emerald-700 text-xs font-mono">Carregando notificações...</p>
        ) : erro === null && lista.length === 0 ? (
          <p className="rounded-2xl border border-emerald-100 bg-white p-6 text-center text-sm text-gray-600">
            {leitura === "nao-lidas" || tipo
              ? "Nenhuma notificação com esses filtros."
              : "Nenhuma notificação por enquanto. Avisos de convites, inscrição, proposta e resultado aparecem aqui."}
          </p>
        ) : (
          <ul className="space-y-3">
            {lista.map((n) => (
              <ItemNotificacao
                key={n.notificacao_id}
                n={n}
                link={linkDaNotificacao(n, user?.papel)}
                onMarcarLida={() => marcarLida(n)}
              />
            ))}
          </ul>
        )}

        {!carregando && temMais && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={carregarMais}
              disabled={carregandoMais}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-xs font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
            >
              {carregandoMais ? "Carregando..." : "Carregar mais antigas"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function ItemNotificacao({
  n,
  link,
  onMarcarLida,
}: {
  n: Notificacao;
  link: string | null;
  onMarcarLida: () => void;
}) {
  const naoLida = !n.lida_em;
  return (
    <li
      className={`rounded-2xl border bg-white p-5 shadow-sm space-y-3 ${
        naoLida ? "border-emerald-300 ring-1 ring-emerald-100" : "border-emerald-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <IconeNotificacao n={n} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
              {ROTULO_TIPO_NOTIFICACAO[n.tipo] ?? n.tipo}
            </span>
            {n.tipo === "RESULTADO" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  n.aprovada ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {n.aprovada ? "Proposta aprovada" : "Proposta não aprovada"}
              </span>
            )}
            {naoLida && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Nova
              </span>
            )}
            <span className="text-[11px] text-gray-500">{formatarDataBrasilia(n.criado_em)}</span>
          </div>
          <p className={`text-sm ${naoLida ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>{n.titulo}</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{n.mensagem}</p>
          {n.tipo === "RESULTADO" && n.status_envio === "FALHA" && n.erro && (
            <p className="text-[11px] text-amber-700">Falha no envio: {n.erro}</p>
          )}
        </div>
      </div>

      {n.tipo === "RESULTADO" && n.pareceres.length > 0 && (
        <details className="rounded-xl border border-gray-100 bg-[#F6F9F8] p-3">
          <summary className="cursor-pointer text-xs font-semibold text-emerald-700">
            Pareceres dos avaliadores ({n.pareceres.length}), sem identificar quem escreveu
          </summary>
          <ul className="mt-3 space-y-2">
            {n.pareceres.map((p, i) => (
              <li key={i} className="text-xs border-l-2 border-gray-300 pl-3 space-y-1">
                {p.recomendacao && (
                  <p
                    className={`text-[10px] font-bold uppercase ${
                      p.recomendacao === "APROVACAO" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    Recomendou {p.recomendacao === "APROVACAO" ? "aprovação" : "reprovação"}
                  </p>
                )}
                <p className="text-gray-700 whitespace-pre-line">{p.parecer || "Sem parecer escrito."}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {(link || naoLida) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          {link && (
            <Link
              href={link}
              onClick={onMarcarLida}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
            >
              Abrir &rarr;
            </Link>
          )}
          {naoLida && (
            <button
              type="button"
              onClick={onMarcarLida}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Check className="h-3.5 w-3.5" /> Marcar como lida
            </button>
          )}
        </div>
      )}
    </li>
  );
}
