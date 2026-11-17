"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, CheckCircle2, GraduationCap, Lock, Settings2 } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import CartaoSessao, { momentoDaSessao } from "@/components/treinamento/CartaoSessao";
import {
  ApiError,
  equipes as equipesApi,
  hackathons as hackathonsApi,
  type HackathonResponse,
  type Usuario,
} from "@/lib/api";
import {
  dataHora,
  periodoSessao,
  treinamento as treinamentoApi,
  treinamentoAdmin,
  type MarcoTreinamento,
  type SessaoTreinamento,
} from "@/lib/api-treinamento";
import { useSession } from "@/lib/useSession";

/** Edições que fazem sentido para cada perfil (a API decide o acesso de fato). */
async function edicoesDoUsuario(u: Usuario): Promise<HackathonResponse[]> {
  if (u.papel === "ORGANIZADOR" || u.papel === "DEV") {
    return hackathonsApi.daMinhaOrganizacao();
  }
  if (u.papel === "PARTICIPANTE") {
    const minhas = await equipesApi.minhas();
    const ids = [...new Set(minhas.map((e) => e.hackathon_id))];
    const lista = await Promise.all(
      ids.map((id) => hackathonsApi.obter(id).catch(() => ({ id, nome: "Hackathon" }) as HackathonResponse))
    );
    return lista;
  }
  return hackathonsApi.listar(u.organizacao_id ?? undefined);
}

const PODE_VER_MARCO = ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"];

function TreinamentoConteudo() {
  const { user, pronto } = useSession();
  const params = useSearchParams();
  const router = useRouter();

  const [edicoes, setEdicoes] = useState<HackathonResponse[] | null>(null);
  const [hackathonId, setHackathonId] = useState(params.get("hackathon_id") ?? "");
  const [sessoes, setSessoes] = useState<SessaoTreinamento[] | null>(null);
  const [marco, setMarco] = useState<MarcoTreinamento | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [semAcesso, setSemAcesso] = useState<string | null>(null);

  useEffect(() => {
    if (!pronto || !user) return;
    edicoesDoUsuario(user)
      .then((l) => {
        setEdicoes(l);
        setHackathonId((atual) => atual || l[0]?.id || "");
      })
      .catch((e: unknown) => {
        setEdicoes([]);
        setErro(e);
      });
  }, [pronto, user]);

  // Só altera estado em callbacks de promessa (é chamada por um efeito); `recarregar` limpa antes.
  const carregar = useCallback(
    (id: string) => {
      if (user && PODE_VER_MARCO.includes(user.papel)) {
        treinamentoAdmin.marco(id).then(setMarco).catch(() => setMarco(null));
      }
      return treinamentoApi
        .agenda(id)
        .then(setSessoes)
        .catch((e: unknown) => {
          setSessoes([]);
          if (e instanceof ApiError && e.status === 403) setSemAcesso(e.message);
          else setErro(e);
        });
    },
    [user]
  );

  useEffect(() => {
    if (pronto && hackathonId) carregar(hackathonId);
  }, [pronto, hackathonId, carregar]);

  const limpar = () => {
    setErro(null);
    setSemAcesso(null);
    setSessoes(null);
    setMarco(null);
  };

  const recarregar = (id: string) => {
    limpar();
    carregar(id);
  };

  const trocarEdicao = (id: string) => {
    limpar();
    setHackathonId(id);
    router.replace(`/treinamento?hackathon_id=${id}`, { scroll: false });
  };

  const { proximas, realizadas } = useMemo(() => {
    const l = sessoes ?? [];
    return {
      proximas: l.filter((s) => momentoDaSessao(s) !== "realizada"),
      realizadas: l.filter((s) => momentoDaSessao(s) === "realizada").reverse(),
    };
  }, [sessoes]);

  if (!pronto || !user) return null;

  const destaque = proximas[0];
  const totalMateriais = (sessoes ?? []).reduce((n, s) => n + s.materiais.length, 0);
  const edicaoAtual = edicoes?.find((h) => h.id === hackathonId);
  const ehOrganizador = user.papel === "ORGANIZADOR" || user.papel === "DEV";
  // Seletor só quando há mais de uma edição possível (ou quando o id veio pela URL e não está na lista).
  const mostrarSeletor = (edicoes?.length ?? 0) > 1 || (!!hackathonId && edicoes !== null && !edicaoAtual);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white sm:flex">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {edicaoAtual?.nome ?? "Treinamento"}
            </p>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Agenda do treinamento</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Sessões de preparação para as equipes aprovadas: datas, local ou sala virtual e os
              materiais de apoio de cada encontro.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {mostrarSeletor && (
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase text-gray-600">Hackathon</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none sm:w-72"
                value={hackathonId}
                onChange={(e) => trocarEdicao(e.target.value)}
              >
                {!edicaoAtual && hackathonId && <option value={hackathonId}>Hackathon selecionado</option>}
                {edicoes?.map((h) => (
                  <option key={h.id} value={h.id}>{h.nome || "Sem nome"}</option>
                ))}
              </select>
            </label>
          )}
          {ehOrganizador && hackathonId && (
            <Link
              href={`/admin/treinamento?hackathon_id=${hackathonId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-600 hover:text-emerald-700"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" /> Gerenciar
            </Link>
          )}
        </div>
      </header>

      {erro !== null && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} onRetry={hackathonId ? () => recarregar(hackathonId) : undefined} />
        </div>
      )}

      {edicoes !== null && edicoes.length === 0 && !hackathonId ? (
        <EstadoVazio
          icone={<GraduationCap className="h-12 w-12 text-emerald-500" aria-hidden="true" />}
          titulo={user.papel === "PARTICIPANTE" ? "Você ainda não participa de nenhum hackathon" : "Nenhum hackathon disponível"}
          texto={
            user.papel === "PARTICIPANTE"
              ? "O treinamento aparece aqui quando sua equipe for aprovada no resultado de um hackathon."
              : "Não encontramos hackathons ligados à sua conta."
          }
          acao={user.papel === "PARTICIPANTE" ? { href: "/hackathons", rotulo: "Ver hackathons" } : undefined}
        />
      ) : semAcesso !== null ? (
        <EstadoVazio
          icone={<Lock className="h-12 w-12 text-amber-500" aria-hidden="true" />}
          titulo="Treinamento ainda não liberado para você"
          detalhe={semAcesso.toLowerCase().includes("pendente") ? semAcesso : undefined}
          texto={
            user.papel === "PARTICIPANTE"
              ? "A agenda e os materiais ficam disponíveis para os integrantes das equipes aprovadas no resultado homologado desta edição. Acompanhe a situação da sua equipe."
              : "A agenda do treinamento é visível para as equipes aprovadas, a organização e o Comitê Científico da edição."
          }
          acao={user.papel === "PARTICIPANTE" ? { href: "/equipe", rotulo: "Ver minha equipe" } : undefined}
        />
      ) : sessoes === null ? (
        <div className="mt-6 space-y-3">
          <div className="h-28 animate-pulse rounded-2xl bg-white" />
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
        </div>
      ) : sessoes.length === 0 ? (
        <EstadoVazio
          icone={<CalendarClock className="h-12 w-12 text-emerald-500" aria-hidden="true" />}
          titulo="A agenda ainda não foi divulgada"
          texto="A organização ainda não publicou sessões do treinamento. Volte em breve: as datas e os materiais aparecem aqui assim que forem publicados."
          acao={ehOrganizador ? { href: `/admin/treinamento?hackathon_id=${hackathonId}`, rotulo: "Cadastrar sessões" } : undefined}
        />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="t-proximas">
              <h2 id="t-proximas" className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Próximas sessões {proximas.length > 0 && <span className="text-emerald-700">({proximas.length})</span>}
              </h2>
              {proximas.length === 0 ? (
                <p className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-gray-600">
                  Todas as sessões publicadas já aconteceram. Os materiais continuam disponíveis abaixo.
                </p>
              ) : (
                <div className="space-y-3">
                  {proximas.map((s) => <CartaoSessao key={s.id} sessao={s} />)}
                </div>
              )}
            </section>

            {realizadas.length > 0 && (
              <section aria-labelledby="t-realizadas">
                <h2 id="t-realizadas" className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                  Já realizadas ({realizadas.length})
                </h2>
                <div className="space-y-3">
                  {realizadas.map((s) => <CartaoSessao key={s.id} sessao={s} />)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            {destaque && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                  {momentoDaSessao(destaque) === "agora" ? "Acontecendo agora" : "Próximo encontro"}
                </p>
                <p className="mt-1 text-lg font-bold leading-snug">{destaque.titulo}</p>
                <p className="mt-1 text-sm text-emerald-50">{periodoSessao(destaque.inicio, destaque.fim)}</p>
                {destaque.local && <p className="mt-1 text-sm text-emerald-50">{destaque.local}</p>}
                {destaque.link_url && (
                  <a
                    href={destaque.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                  >
                    Abrir sala virtual
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-2xl font-extrabold text-gray-900">{sessoes.length}</p>
                <p className="text-xs font-semibold text-gray-500">Sessões</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-2xl font-extrabold text-gray-900">{totalMateriais}</p>
                <p className="text-xs font-semibold text-gray-500">Materiais</p>
              </div>
            </div>

            {marco && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm">
                <p className="font-semibold text-gray-900">Conclusão do treinamento</p>
                {marco.treinamento_concluido_em ? (
                  <p className="mt-1 flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {dataHora(marco.treinamento_concluido_em)}
                  </p>
                ) : (
                  <p className="mt-1 text-amber-700">Ainda não confirmada pela organização.</p>
                )}
              </div>
            )}

            <p className="px-1 text-xs text-gray-500">
              Horários no fuso do seu dispositivo. Os materiais abrem em serviços externos (Drive, slides etc.).
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

function EstadoVazio({
  icone,
  titulo,
  texto,
  detalhe,
  acao,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
  detalhe?: string;
  acao?: { href: string; rotulo: string };
}) {
  return (
    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-10 text-center">
      <div className="flex justify-center">{icone}</div>
      <p className="mt-3 text-lg font-bold text-gray-900">{titulo}</p>
      <p className="mx-auto mt-1 max-w-xl text-sm text-gray-600">{texto}</p>
      {detalhe && (
        <p className="mx-auto mt-3 max-w-xl rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">{detalhe}</p>
      )}
      {acao && (
        <Link href={acao.href} className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}

export default function TreinamentoPage() {
  return (
    <Suspense fallback={null}>
      <TreinamentoConteudo />
    </Suspense>
  );
}
