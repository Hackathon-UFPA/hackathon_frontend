"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  HeartHandshake,
  Lightbulb,
  Link2,
  MapPin,
  MessageCircleQuestion,
  Share2,
  Trophy,
  Users,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import FundoAnimado from "@/components/plataforma/FundoAnimado";
import { PAINEL_SECAO } from "@/components/plataforma/painel";
import {
  COR_STATUS,
  formatarData,
  ROTULO_STATUS,
  inscricoesAbertas,
  paraData,
  periodo,
  tempoAte,
} from "@/components/plataforma/hackathon-util";
import {
  ApiError,
  CATALOGO_ODS,
  getUser,
  hackathons as api,
  organizacoes,
  ROTULO_TIPO_ORGANIZACAO,
  temas as temasApi,
  termos as termosApi,
  type EquipesDoHackathon,
  type HackathonResponse,
  type Organizacao,
  type TemaItem,
  type Termo,
  type Usuario,
} from "@/lib/api";
import { publico, type FaseCronograma, type PaginaPublica } from "@/lib/api-conteudo";
import ApoiadoresPublicos from "@/components/conteudo/ApoiadoresPublicos";
import FaqPublica from "@/components/conteudo/FaqPublica";

type EstadoFase = "concluida" | "atual" | "futura";
type Fase = { nome: string; descricao: string; quando: string | null; estado: EstadoFase };

/** Monta o cronograma a partir das datas da edição; fases sem data ficam de fora. */
function montarFases(h: HackathonResponse, agora: Date): Fase[] {
  const estado = (inicio?: string | null, fim?: string | null): EstadoFase => {
    const a = paraData(inicio);
    const b = paraData(fim);
    if (b && b < agora) return "concluida";
    if ((a ?? b) && (!a || a <= agora) && (!b || agora < b)) return "atual";
    return "futura";
  };
  const fases: (Fase & { tem: boolean })[] = [
    {
      nome: "Inscrições",
      descricao: "Monte sua equipe, aceite os termos e envie o comprovante de vínculo.",
      quando: periodo(h.inscricoes_inicio, h.inscricoes_fim),
      estado: estado(h.inscricoes_inicio, h.inscricoes_fim),
      tem: Boolean(h.inscricoes_inicio || h.inscricoes_fim),
    },
    {
      nome: "Homologação",
      descricao: "A organização confere as inscrições e homologa as equipes.",
      quando: periodo(h.inscricoes_fim, h.homologacao_fim),
      estado: estado(h.inscricoes_fim, h.homologacao_fim),
      tem: Boolean(h.homologacao_fim),
    },
    {
      nome: "Envio das propostas",
      descricao: "As equipes escolhem um tema e enviam a proposta.",
      quando: periodo(h.propostas_inicio, h.propostas_fim),
      estado: estado(h.propostas_inicio, h.propostas_fim),
      tem: Boolean(h.propostas_inicio || h.propostas_fim),
    },
    {
      nome: "Evento",
      descricao: "Os dias do hackathon.",
      quando: periodo(h.data_inicio, h.data_fim),
      estado: estado(h.data_inicio, h.data_fim),
      tem: Boolean(h.data_inicio || h.data_fim),
    },
    {
      nome: "Resultado",
      descricao: "Avaliação pelo comitê e divulgação das propostas aprovadas.",
      quando: null,
      estado: h.status === "FINALIZADO" ? "concluida" : h.status === "EM_AVALIACAO" ? "atual" : "futura",
      tem: true,
    },
  ];
  return fases.filter((f) => f.tem);
}

/** Textos de apoio para as datas do edital que vêm do cronograma público (origem EDITAL). */
const DESCRICAO_EDITAL: Record<string, string> = {
  "Inscrições": "Monte sua equipe, aceite os termos e envie o comprovante de vínculo.",
  "Homologação das equipes": "A organização confere as inscrições e homologa as equipes.",
  "Envio de propostas": "As equipes escolhem um tema e enviam a proposta.",
  "Evento": "Os dias do hackathon.",
};

/**
 * Cronograma vindo de /publico (datas do edital + fases publicadas pela organização, já com a
 * situação calculada no servidor). A fase "Resultado" não existe lá e continua vindo das datas locais.
 */
function fasesDoCronogramaPublico(cronograma: FaseCronograma[], resultado?: Fase): Fase[] {
  const fases: Fase[] = cronograma.map((f) => ({
    nome: f.nome,
    descricao: f.descricao ?? DESCRICAO_EDITAL[f.nome] ?? "",
    quando: periodo(f.inicio, f.fim),
    estado: f.situacao === "ENCERRADA" ? "concluida" : f.atual || f.situacao === "EM_ANDAMENTO" ? "atual" : "futura",
  }));
  return resultado ? [...fases, resultado] : fases;
}

function Secao({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Clock; children: React.ReactNode }) {
  return (
    <section className={PAINEL_SECAO}>
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Icone className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Cronograma({ fases }: { fases: Fase[] }) {
  return (
    <ol className="relative space-y-6">
      {fases.map((f, i) => (
        <li key={`${f.nome}-${i}`} className="relative flex gap-4">
          {i < fases.length - 1 && (
            <span
              aria-hidden="true"
              className={`absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-0.5 ${
                f.estado === "concluida" ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
          )}
          <span
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
              f.estado === "concluida"
                ? "border-emerald-500 bg-emerald-500 text-white"
                : f.estado === "atual"
                  ? "border-emerald-500 bg-white text-emerald-700 ring-4 ring-emerald-100"
                  : "border-gray-300 bg-white text-gray-400"
            }`}
          >
            {f.estado === "concluida" ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
          </span>
          <div className="min-w-0 pb-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`font-semibold ${f.estado === "futura" ? "text-gray-500" : "text-gray-900"}`}>{f.nome}</span>
              {f.estado === "atual" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Agora</span>
              )}
              {f.estado === "concluida" && <span className="sr-only">(concluída)</span>}
            </p>
            {f.quando && <p className="text-sm font-medium text-emerald-800">{f.quando}</p>}
            <p className="mt-0.5 text-sm text-gray-600">{f.descricao}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || nome.slice(0, 2).toUpperCase();
}

export default function HackathonDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [h, setH] = useState<HackathonResponse | null>(null);
  const [org, setOrg] = useState<Organizacao | null>(null);
  const [termos, setTermos] = useState<Termo[]>([]);
  const [temas, setTemas] = useState<TemaItem[]>([]);
  const [equipes, setEquipes] = useState<EquipesDoHackathon | null>(null);
  // Página pública (apoiadores, FAQ, cronograma e regulamento). 404 em rascunho: fica null.
  const [pub, setPub] = useState<PaginaPublica | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [agora, setAgora] = useState<Date | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api
      .obter(id)
      .then((dados) => {
        setUsuario(getUser());
        setAgora(new Date());
        setH(dados);
        if (dados.organizacao_id) organizacoes.obter(dados.organizacao_id).then(setOrg).catch(() => {});
        termosApi.vigentes(id).then(setTermos).catch(() => {});
        temasApi.listar(id).then(setTemas).catch(() => {});
        api.equipes(id).then(setEquipes).catch(() => {});
        publico.pagina(id).then(setPub).catch(() => {});
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && (e.status === 404 || e.status === 422)) setNaoEncontrado(true);
        else setErro(e instanceof Error ? e.message : "Erro ao carregar.");
      });
  }, [id]);

  const compartilhar = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: h?.nome ?? "Hackathon", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* compartilhamento cancelado */
    }
  };

  if (naoEncontrado) {
    return (
      <main className="relative min-h-[70vh] px-4 py-20 text-center">
        <FundoAnimado intensidade="suave" trechos={false} />
        <div className={`${PAINEL_SECAO} mx-auto max-w-md`}>
          <p className="text-lg font-bold text-gray-900">Hackathon não encontrado</p>
          <p className="mt-2 text-sm text-gray-600">O link pode estar errado ou o hackathon ainda não foi publicado.</p>
          <Link href="/hackathons" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
            Ver todos os hackathons <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  if (!h || !agora) {
    return (
      <main className="relative mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6">
        <FundoAnimado intensidade="suave" trechos={false} />
        {erro ? (
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        ) : (
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-3xl bg-white/70" />
            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
              <div className="h-80 animate-pulse rounded-3xl bg-white/70" />
              <div className="h-64 animate-pulse rounded-3xl bg-white/70" />
            </div>
          </div>
        )}
      </main>
    );
  }

  const status = h.status ?? "INSCRICOES";
  // RN06: com a página pública carregada, vale o cálculo do servidor.
  const abertas = pub ? pub.inscricoes_abertas : inscricoesAbertas(h, agora);
  const fasesLocais = montarFases(h, agora);
  const fases = pub?.cronograma.length
    ? fasesDoCronogramaPublico(pub.cronograma, fasesLocais.find((f) => f.nome === "Resultado"))
    : fasesLocais;
  const descricao = h.descricao || pub?.descricao;
  // O regulamento público só entra se o usuário não recebeu um REGULAMENTO em termos vigentes.
  const regulamentoPublico =
    pub?.regulamento && !termos.some((t) => t.tipo === "REGULAMENTO") ? pub.regulamento : null;
  const faltam = abertas ? tempoAte(h.inscricoes_fim, agora) : null;
  const destino = `/equipe?hackathon_id=${id}`;
  const participante = usuario?.papel === "PARTICIPANTE" || usuario?.papel === "DEV";

  const meta = [
    h.organizacao_nome && { icone: Building2, texto: h.organizacao_nome },
    periodo(h.data_inicio, h.data_fim) && { icone: CalendarDays, texto: periodo(h.data_inicio, h.data_fim)! },
    h.local && { icone: MapPin, texto: h.local },
    { icone: Users, texto: `Equipes de ${h.min_integrantes ?? 3} a ${h.max_integrantes ?? 5} pessoas` },
  ].filter(Boolean) as { icone: typeof Clock; texto: string }[];

  const botaoParticipar = !abertas ? null : !usuario ? (
    <Link
      href={`/login?aba=cadastro&next=${encodeURIComponent(destino)}`}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(5,150,105,0.7)] transition-all hover:bg-emerald-700 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.8)]"
    >
      Quero participar <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  ) : participante ? (
    <Link
      href={destino}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(5,150,105,0.7)] transition-all hover:bg-emerald-700"
    >
      Quero participar <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  ) : null;

  return (
    <main className="relative pb-6">
      <FundoAnimado intensidade="suave" trechos={false} />

      {/* Topo */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <nav aria-label="Caminho" className="mb-4 flex items-center gap-1 text-xs text-gray-500">
          <Link href="/hackathons" className="hover:text-emerald-700">Hackathons</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate text-gray-700">{h.nome || "Hackathon"}</span>
        </nav>

        <header className="entrar relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/75 p-6 shadow-[0_12px_50px_-15px_rgba(6,78,59,0.25)] backdrop-blur-[3px] sm:p-10">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />

          <div className="relative flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${COR_STATUS[status]}`}>{ROTULO_STATUS[status]}</span>
            {faltam && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Inscrições encerram {faltam}
              </span>
            )}
          </div>

          <h1 className="relative mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">{h.nome || "Hackathon"}</h1>
          {h.tema && <p className="relative mt-2 text-lg font-medium text-emerald-700 sm:text-xl">{h.tema}</p>}

          <ul className="relative mt-6 flex flex-wrap gap-2">
            {meta.map(({ icone: Icone, texto }) => (
              <li key={texto} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm text-gray-700">
                <Icone className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>

          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {botaoParticipar && <div className="sm:w-56">{botaoParticipar}</div>}
            <button
              type="button"
              onClick={compartilhar}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {copiado ? <Link2 className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
              {copiado ? "Link copiado!" : "Compartilhar"}
            </button>
            {status === "FINALIZADO" && (
              <Link href={`/hackathons/${id}/aprovadas`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/40 bg-white px-5 py-3.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                <Trophy className="h-4 w-4" aria-hidden="true" /> Propostas aprovadas
              </Link>
            )}
          </div>
        </header>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {descricao && (
            <Secao titulo="Sobre o hackathon" icone={FileText}>
              <p className="whitespace-pre-line leading-relaxed text-gray-700">{descricao}</p>
            </Secao>
          )}

          <Secao titulo="Cronograma" icone={CalendarDays}>
            <Cronograma fases={fases} />
          </Secao>

          <Secao titulo="Temas" icone={Lightbulb}>
            {temas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-5 text-sm text-gray-600">
                Os temas ainda não foram divulgados pela organização.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {temas.map((t) => (
                  <li key={t.id} className="rounded-2xl border border-gray-200 bg-white/90 p-4">
                    <p className="font-semibold text-gray-900">{t.titulo}</p>
                    <p className="mt-1 text-sm text-gray-600">{t.descricao}</p>
                    {t.ods.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Objetivos de desenvolvimento sustentável">
                        {[...new Set(t.ods)].map((n) => (
                          <li
                            key={n}
                            title={CATALOGO_ODS.find((o) => o.numero === n)?.titulo}
                            className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200"
                          >
                            ODS {n}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          {equipes && (
            <Secao titulo="Equipes" icone={Users}>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  { rotulo: "Homologadas", valor: equipes.total_homologadas, cor: "text-emerald-700" },
                  { rotulo: "Aguardando homologação", valor: equipes.total_aguardando_homologacao, cor: "text-amber-700" },
                  { rotulo: "Em formação", valor: equipes.total_em_formacao, cor: "text-gray-700" },
                ].map((c) => (
                  <div key={c.rotulo} className="rounded-2xl border border-gray-200 bg-white/90 p-4 text-center">
                    <dd className={`text-3xl font-extrabold ${c.cor}`}>{c.valor}</dd>
                    <dt className="mt-1 text-xs font-medium text-gray-600">{c.rotulo}</dt>
                  </div>
                ))}
              </dl>

              <h3 className="mb-3 mt-6 text-sm font-bold text-gray-900">Equipes aceitas e completas</h3>
              {equipes.homologadas.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-5 text-sm text-gray-600">
                  Nenhuma equipe homologada ainda. As equipes aparecem aqui quando a organização
                  confirma a inscrição completa.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {equipes.homologadas.map((e, i) => (
                    <li key={`${e.nome}-${i}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
                        {e.nome.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-gray-900">{e.nome}</span>
                        <span className="block text-xs text-gray-500">
                          {e.integrantes} {e.integrantes === 1 ? "integrante" : "integrantes"}
                        </span>
                      </span>
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Homologada" />
                    </li>
                  ))}
                </ul>
              )}
            </Secao>
          )}

          {(termos.length > 0 || regulamentoPublico) && (
            <Secao titulo="Regulamento e termos" icone={FileText}>
              <ul className="divide-y divide-gray-100">
                {regulamentoPublico && (
                  <li className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {regulamentoPublico.titulo}{" "}
                        <span className="ml-1 text-xs font-normal text-gray-500">versão {regulamentoPublico.versao}</span>
                      </p>
                      {regulamentoPublico.url && (
                        <a href={regulamentoPublico.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
                          Abrir documento <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    {regulamentoPublico.publicado_em && (
                      <p className="text-xs text-gray-500">Atualizado em {formatarData(regulamentoPublico.publicado_em)}</p>
                    )}
                    {regulamentoPublico.conteudo && (
                      <details className="group mt-2">
                        <summary className="cursor-pointer text-sm font-semibold text-emerald-700 hover:underline">Ler o texto</summary>
                        <p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-line rounded-xl bg-gray-50 p-4 text-sm text-gray-700">{regulamentoPublico.conteudo}</p>
                      </details>
                    )}
                  </li>
                )}
                {termos.map((t) => (
                  <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {t.titulo} <span className="ml-1 text-xs font-normal text-gray-500">versão {t.versao}</span>
                      </p>
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
                          Abrir documento <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    {t.conteudo && (
                      <details className="group mt-2">
                        <summary className="cursor-pointer text-sm font-semibold text-emerald-700 hover:underline">Ler o texto</summary>
                        <p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-line rounded-xl bg-gray-50 p-4 text-sm text-gray-700">{t.conteudo}</p>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          {pub && pub.faq.length > 0 && (
            <Secao titulo="Perguntas frequentes" icone={MessageCircleQuestion}>
              <FaqPublica itens={pub.faq} />
            </Secao>
          )}
        </div>

        {/* Lateral */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className={PAINEL_SECAO.replace("sm:p-10", "sm:p-6")}>
            <h2 className="text-base font-bold text-gray-900">Como participar</h2>
            <ol className="mt-4 space-y-3 text-sm text-gray-700">
              {[
                usuario ? "Você já tem conta" : "Crie sua conta grátis",
                "Envie o comprovante de vínculo",
                `Monte sua equipe (${h.min_integrantes ?? 3} a ${h.max_integrantes ?? 5} pessoas) e aceite os termos`,
                "Escolha um tema e envie a proposta",
              ].map((passo, i) => (
                <li key={passo} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {usuario && i === 0 ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="pt-0.5">{passo}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              {botaoParticipar ?? (
                <p className="rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-600">
                  {abertas
                    ? `Você está logado como ${usuario?.papel}. A inscrição é feita com uma conta de participante.`
                    : status === "INSCRICOES"
                      ? "As inscrições não estão abertas neste momento."
                      : "Inscrições encerradas."}
                </p>
              )}
              {abertas && !usuario && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Já tem conta?{" "}
                  <Link href={`/login?next=${encodeURIComponent(destino)}`} className="font-semibold text-emerald-700 hover:underline">
                    Entrar
                  </Link>
                </p>
              )}
            </div>
          </div>

          {(org || h.organizacao_nome) && (
            <div className={PAINEL_SECAO.replace("sm:p-10", "sm:p-6")}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Quem organiza</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white">
                  {iniciais(org?.nome ?? h.organizacao_nome ?? "?")}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">{org?.nome ?? h.organizacao_nome}</p>
                  {org && <p className="text-xs text-gray-500">{ROTULO_TIPO_ORGANIZACAO[org.tipo]}</p>}
                </div>
              </div>
              {org?.descricao && <p className="mt-3 text-sm text-gray-600">{org.descricao}</p>}
              <div className="mt-4 flex flex-col gap-2 text-sm">
                {org?.site && (
                  <a href={org.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline">
                    <Globe className="h-4 w-4" aria-hidden="true" /> Site da organização
                  </a>
                )}
                {h.organizacao_id && (
                  <Link href={`/hackathons?organizacao_id=${h.organizacao_id}`} className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" /> Outros hackathons desta organização
                  </Link>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {pub && pub.apoiadores.length > 0 && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <Secao titulo="Apoiadores" icone={HeartHandshake}>
            <ApoiadoresPublicos grupos={pub.apoiadores} />
          </Secao>
        </div>
      )}
    </main>
  );
}
