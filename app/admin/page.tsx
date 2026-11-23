"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  EyeOff,
  FileText,
  GraduationCap,
  Handshake,
  Mail,
  Megaphone,
  Pencil,
  Plus,
  Rocket,
  Scale,
  Settings2,
  Sparkles,
  Trophy,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  comprovantes,
  hackathons as hackathonsApi,
  organizacoes,
  ROTULO_TIPO_ORGANIZACAO,
  termos as termosApi,
  type EquipesDoHackathon,
  type HackathonResponse,
  type Organizacao,
  type PapelUsuario,
} from "@/lib/api";
import { COR_STATUS, ROTULO_STATUS, periodo } from "@/components/plataforma/hackathon-util";
import { useSession } from "@/lib/useSession";


type Ferramenta = {
  href: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  papeis: PapelUsuario[];
  contador?: "comprovantes";
};


// Agrupadas pela etapa do hackathon em que são usadas. Os papéis espelham a API: esconder é só
// conforto, a API responde 403 de todo modo.
const GRUPOS: { titulo: string; ferramentas: Ferramenta[] }[] = [
  {
    titulo: "Preparação",
    ferramentas: [
      { href: "/admin/hackathon", titulo: "Hackathons", descricao: "Datas, status, descrição e equipes", icone: Rocket, papeis: ["ORGANIZADOR"] },
      { href: "/admin/termos", titulo: "Regulamento e termos", descricao: "Rascunhos e versões vigentes", icone: FileText, papeis: ["ORGANIZADOR"] },
      { href: "/admin/conteudo", titulo: "Página pública", descricao: "Apoiadores, cronograma e perguntas frequentes", icone: Megaphone, papeis: ["ORGANIZADOR"] },
      { href: "/admin/temas", titulo: "Temas", descricao: "O que as equipes podem escolher", icone: Sparkles, papeis: ["ORGANIZADOR"] },
      { href: "/admin/rubrica", titulo: "Rubrica de avaliação", descricao: "Critérios e pesos", icone: Scale, papeis: ["ORGANIZADOR"] },
    ],
  },
  {
    titulo: "Inscrições",
    ferramentas: [
      { href: "/admin/comprovantes", titulo: "Comprovantes", descricao: "Aprove o vínculo dos participantes", icone: ClipboardCheck, papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO"], contador: "comprovantes" },
    ],
  },
  {
    titulo: "Avaliação e resultado",
    ferramentas: [
      { href: "/admin/avaliacoes/configuracao", titulo: "Configuração de Avaliação", descricao: "Defina quantos avaliadores lerão cada proposta", icone: Settings2, papeis: ["ORGANIZADOR"] },
      { href: "/admin/avaliacoes", titulo: "Distribuição", descricao: "Propostas para o Comitê Científico", icone: Users, papeis: ["ORGANIZADOR"] },
      { href: "/avaliador", titulo: "Minhas avaliações", descricao: "Propostas designadas para você", icone: Scale, papeis: ["COMITE_CIENTIFICO"] },
      { href: "/admin/resultado", titulo: "Resultado", descricao: "Homologue e divulgue as aprovadas", icone: Trophy, papeis: ["ORGANIZADOR"] },
    ],
  },
  {
    titulo: "Treinamento e mentoria",
    ferramentas: [
      { href: "/admin/treinamento", titulo: "Treinamento das equipes", descricao: "Sessões, materiais e conclusão", icone: GraduationCap, papeis: ["ORGANIZADOR"] },
      { href: "/admin/mentores", titulo: "Mentores", descricao: "Cadastre e convide mentores", icone: Handshake, papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO"] },
      { href: "/admin/mentoria", titulo: "Mentoria das equipes", descricao: "Escolha o mentor de cada equipe aprovada", icone: UserCheck, papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO"] },
    ],
  },
  {
    titulo: "Organização",
    ferramentas: [
      { href: "/admin/organizacao", titulo: "Organização", descricao: "Dados da organização e cadastro do comitê", icone: Building2, papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO"] },
      { href: "/admin/usuarios", titulo: "Equipe e acessos", descricao: "Edite, troque o perfil, desative ou reative contas", icone: UserCog, papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO"] },
      { href: "/admin/emails", titulo: "Fila de e-mails", descricao: "Acompanhe os envios e reenvie os que falharam", icone: Mail, papeis: ["ORGANIZADOR"] },
    ],
  },
];


type Resumo = {
  hackathon: HackathonResponse;
  equipes: EquipesDoHackathon | null; // null em rascunho (rota pública não mostra)
  termosOk: boolean;
};


const LIMITE_FILA = 200;


function Indicador({ rotulo, valor, detalhe, icone: Icone, destaque }: { rotulo: string; valor: string; detalhe?: string; icone: LucideIcon; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${destaque ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{rotulo}</p>
        <Icone className={`h-5 w-5 ${destaque ? "text-amber-600" : "text-emerald-600"}`} aria-hidden="true" />
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${destaque ? "text-amber-800" : "text-gray-900"}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-gray-500">{detalhe}</p>}
    </div>
  );
}


function iniciais(nome: string) {
  return (
    nome
      .split(/\s+/)
      .filter((p) => p.length > 2)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || nome.slice(0, 2).toUpperCase()
  );
}


export default function AdminDashboardPage() {
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const [org, setOrg] = useState<Organizacao | null>(null);
  const [resumos, setResumos] = useState<Resumo[] | null>(null);
  const [pendentes, setPendentes] = useState<number | null>(null);


  const gestor = user?.papel === "ORGANIZADOR" || user?.papel === "DEV";


  useEffect(() => {
    if (!pronto || !user) return;
    if (user.organizacao_id) organizacoes.minha().then(setOrg).catch(() => {});
    comprovantes
      .fila({ status: "PENDENTE", limite: LIMITE_FILA })
      .then((l) => setPendentes(l.length))
      .catch(() => setPendentes(null));
    if (user.papel === "ORGANIZADOR" || user.papel === "DEV") {
      hackathonsApi
        .daMinhaOrganizacao()
        .then((lista) =>
          Promise.all(
            lista.map(async (hackathon): Promise<Resumo> => {
              const [equipes, termos] = await Promise.all([
                hackathon.status === "RASCUNHO" ? null : hackathonsApi.equipes(hackathon.id).catch(() => null),
                termosApi.vigentes(hackathon.id).catch(() => []),
              ]);
              const tipos = new Set(termos.map((t) => t.tipo));
              return { hackathon, equipes, termosOk: tipos.has("REGULAMENTO") && tipos.has("TERMO_CONSENTIMENTO") };
            })
          )
        )
        .then(setResumos)
        .catch(() => setResumos([]));
    }
  }, [pronto, user]);


  if (!pronto || !user) return null;


  const lista = resumos ?? [];
  const publicados = lista.filter((r) => r.hackathon.status !== "RASCUNHO" && r.hackathon.status !== "CANCELADO");
  const rascunhos = lista.filter((r) => r.hackathon.status === "RASCUNHO");
  const abertos = lista.filter((r) => r.hackathon.status === "INSCRICOES");
  const semTermos = lista.filter((r) => !r.termosOk && r.hackathon.status !== "CANCELADO" && r.hackathon.status !== "FINALIZADO");
  const homologadas = lista.reduce((soma, r) => soma + (r.equipes?.total_homologadas ?? 0), 0);
  const aguardando = lista.reduce((soma, r) => soma + (r.equipes?.total_aguardando_homologacao ?? 0), 0);
  const textoPendentes = pendentes === null ? "—" : pendentes >= LIMITE_FILA ? `${LIMITE_FILA}+` : String(pendentes);


  const atencao: { texto: string; href: string; acao: string }[] = [
    ...(pendentes ? [{ texto: `${textoPendentes} ${pendentes === 1 ? "comprovante aguarda" : "comprovantes aguardam"} sua conferência`, href: "/admin/comprovantes", acao: "Conferir" }] : []),
    ...(gestor ? rascunhos.map((r) => ({ texto: `"${r.hackathon.nome || "Sem nome"}" ainda é rascunho e não aparece no site`, href: `/admin/hackathon?id=${r.hackathon.id}`, acao: "Publicar" })) : []),
    ...(gestor ? semTermos.map((r) => ({ texto: `"${r.hackathon.nome || "Sem nome"}" está sem regulamento ou termo de consentimento`, href: `/admin/termos?hackathon_id=${r.hackathon.id}`, acao: "Publicar termos" })) : []),
  ];


  const ferramentasVisiveis = GRUPOS.map((g) => ({
    ...g,
    ferramentas: g.ferramentas.filter((f) => user.papel === "DEV" || f.papeis.includes(user.papel)),
  })).filter((g) => g.ferramentas.length > 0);


  const nomeOrg = org?.nome ?? (user.papel === "DEV" ? "Acesso de desenvolvimento" : "Sua organização");


  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
            {iniciais(nomeOrg)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              {org ? ROTULO_TIPO_ORGANIZACAO[org.tipo] : "Painel"}
            </p>
            <h1 className="truncate text-2xl font-extrabold text-gray-900 sm:text-3xl">{nomeOrg}</h1>
            <p className="text-sm text-gray-600">
              Olá, {user.nome?.split(" ")[0] || user.email}
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                {user.papel === "COMITE_CIENTIFICO" ? "Comitê Científico" : user.papel === "ORGANIZADOR" ? "Organizador" : user.papel}
              </span>
            </p>
          </div>
        </div>
        {gestor && (
          <div className="flex flex-wrap gap-2">
            {user.organizacao_id && (
              <Link href={`/hackathons?organizacao_id=${user.organizacao_id}`} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver no site
              </Link>
            )}
            <Link href="/admin/hackathon?novo=1" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700">
              <Plus className="h-4 w-4" aria-hidden="true" /> Novo hackathon
            </Link>
          </div>
        )}
      </header>


      {/* Indicadores */}
      <section aria-label="Resumo" className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {gestor && (
          <Indicador
            rotulo="Hackathons"
            valor={resumos ? String(lista.length) : "—"}
            detalhe={resumos ? `${publicados.length} ${publicados.length === 1 ? "publicado" : "publicados"} · ${rascunhos.length} em rascunho` : "Carregando..."}
            icone={Rocket}
          />
        )}
        {gestor && (
          <Indicador rotulo="Inscrições abertas" valor={resumos ? String(abertos.length) : "—"} detalhe="Hackathons recebendo equipes" icone={CalendarDays} />
        )}
        <Indicador
          rotulo="Comprovantes"
          valor={textoPendentes}
          detalhe="Aguardando conferência"
          icone={ClipboardCheck}
          destaque={Boolean(pendentes)}
        />
        {gestor && (
          <Indicador
            rotulo="Equipes homologadas"
            valor={resumos ? String(homologadas) : "—"}
            detalhe={resumos ? `${aguardando} aguardando homologação` : undefined}
            icone={Users}
          />
        )}
      </section>


      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {/* Hackathons */}
          {gestor && (
            <section className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">Seus hackathons</h2>
                <Link href="/admin/hackathon" className="text-sm font-semibold text-emerald-700 hover:underline">
                  Gerenciar
                </Link>
              </div>


              {resumos === null ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
                </div>
              ) : lista.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                  <Rocket className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-gray-900">Nenhum hackathon ainda</p>
                  <p className="mt-1 text-sm text-gray-600">Crie o primeiro: ele começa como rascunho e só aparece no site quando você publicar.</p>
                  <Link href="/admin/hackathon?novo=1" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                    <Plus className="h-4 w-4" aria-hidden="true" /> Criar hackathon
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {lista.map(({ hackathon: h, equipes, termosOk }) => {
                    const status = h.status ?? "INSCRICOES";
                    return (
                      <li key={h.id} className="rounded-2xl border border-gray-200 p-4 transition-colors hover:border-emerald-300">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-bold text-gray-900">{h.nome || "Sem nome"}</h3>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${COR_STATUS[status]}`}>
                                {ROTULO_STATUS[status]}
                              </span>
                            </div>
                            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                              {periodo(h.inscricoes_inicio, h.inscricoes_fim) && <span>Inscrições: {periodo(h.inscricoes_inicio, h.inscricoes_fim)}</span>}
                              {periodo(h.data_inicio, h.data_fim) && <span>Evento: {periodo(h.data_inicio, h.data_fim)}</span>}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/admin/hackathon?id=${h.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700">
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                            </Link>
                            {status !== "RASCUNHO" && (
                              <Link href={`/hackathons/${h.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700">
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Página
                              </Link>
                            )}
                          </div>
                        </div>


                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          {status === "RASCUNHO" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Não aparece no site
                            </span>
                          ) : (
                            equipes && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-gray-700">
                                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                {equipes.total_homologadas} homologadas · {equipes.total_aguardando_homologacao} aguardando · {equipes.total_em_formacao} em formação
                              </span>
                            )
                          )}
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${termosOk ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                            {termosOk ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                            {termosOk ? "Termos publicados" : "Faltam termos"}
                          </span>
                          <span className="ml-auto flex flex-wrap gap-3 font-semibold">
                            <Link href={`/admin/temas?hackathon_id=${h.id}`} className="text-emerald-700 hover:underline">Temas</Link>
                            <Link href={`/admin/termos?hackathon_id=${h.id}`} className="text-emerald-700 hover:underline">Termos</Link>
                            <Link href={`/admin/rubrica?hackathon_id=${h.id}`} className="text-emerald-700 hover:underline">Rubrica</Link>
                            <Link href={`/admin/resultado?hackathon_id=${h.id}`} className="text-emerald-700 hover:underline">Resultado</Link>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}


          {/* Ferramentas */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Ferramentas</h2>
            <div className="space-y-5">
              {ferramentasVisiveis.map((grupo) => (
                <div key={grupo.titulo}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{grupo.titulo}</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {grupo.ferramentas.map(({ href, titulo, descricao, icone: Icone, contador }) => (
                      <li key={href}>
                        <Link href={href} className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/40">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100">
                            <Icone className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 font-semibold text-gray-900">
                              {titulo}
                              {contador === "comprovantes" && pendentes ? (
                                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">{textoPendentes}</span>
                              ) : null}
                            </span>
                            <span className="block truncate text-xs text-gray-500">{descricao}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>


        {/* Atenção */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Precisa da sua atenção</h2>
            {atencao.length === 0 ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {resumos === null && gestor ? "Verificando pendências..." : "Tudo em dia. Nenhuma pendência no momento."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {atencao.map((item) => (
                  <li key={item.texto} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="flex gap-2 text-sm text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                      {item.texto}
                    </p>
                    <Link href={item.href} className="mt-2 inline-flex items-center gap-1 pl-6 text-xs font-bold text-amber-900 hover:underline">
                      {item.acao} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}