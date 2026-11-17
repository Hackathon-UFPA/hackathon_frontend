"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crown,
  FileCheck2,
  LogOut,
  RefreshCw,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { Selo, btn, btnGhost, inp } from "@/components/ui";
import {
  auth,
  equipes,
  type Equipe,
  type IntegrantePainel,
  type PainelEquipe,
  type SituacaoEquipe,
} from "@/lib/api";
import {
  FUNCAO_MEMBRO,
  SITUACAO_EQUIPE,
  STATUS_COMPROVANTE,
  STATUS_CONVITE,
  formatarDataHora,
} from "@/lib/rotulos";
import { useSession } from "@/lib/useSession";

const bloco = "rounded-2xl border border-white/10 bg-[#131D1C]/90 p-6 backdrop-blur-md";
const rotuloBloco = "font-mono text-xs uppercase tracking-widest text-gray-400";

const ESTILO_SITUACAO: Record<SituacaoEquipe, { Icone: LucideIcon; classe: string }> = {
  EM_FORMACAO: { Icone: Users, classe: "border-sky-400/40 bg-sky-400/10 text-sky-300" },
  AGUARDANDO_HOMOLOGACAO: { Icone: Clock, classe: "border-amber-300/40 bg-amber-300/10 text-amber-200" },
  HOMOLOGADA: { Icone: CheckCircle2, classe: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
  NAO_HOMOLOGADA: { Icone: XCircle, classe: "border-red-400/40 bg-red-400/10 text-red-300" },
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function CartaoIntegrante({ pessoa, ehVoce }: { pessoa: IntegrantePainel; ehVoce: boolean }) {
  const nome = pessoa.nome || pessoa.email;
  const lider = pessoa.funcao === "LIDER";

  return (
    <li
      className={`flex flex-col rounded-2xl border p-5 ${
        lider ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-black/30"
      } ${pessoa.integrante ? "" : "border-dashed"}`}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 font-mono text-sm font-bold text-white"
        >
          {iniciais(nome)}
        </div>
        <div className="min-w-0">
          <h3 className="break-words text-sm font-bold text-white">
            {nome}
            {ehVoce && <span className="font-normal text-gray-400"> (você)</span>}
          </h3>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            {lider && <Crown className="h-3 w-3 text-emerald-400" aria-hidden="true" />}
            {pessoa.funcao
              ? FUNCAO_MEMBRO[pessoa.funcao]
              : pessoa.integrante
                ? "Sem função definida"
                : "Ainda não entrou"}
          </p>
        </div>
      </div>

      {pessoa.integrante ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-gray-400">Termos</dt>
            <dd className="font-bold text-white">{pessoa.termos_aceitos ? "Aceitos" : "Pendentes"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Vínculo</dt>
            <dd className="font-bold text-white">
              {pessoa.comprovante ? STATUS_COMPROVANTE[pessoa.comprovante] : "Não enviado"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-xs font-bold text-amber-200">
          {pessoa.convite ? STATUS_CONVITE[pessoa.convite] : "Convite em aberto"}
        </p>
      )}
    </li>
  );
}

function Painel({ painel, usuarioId }: { painel: PainelEquipe; usuarioId?: string }) {
  const { Icone, classe } = ESTILO_SITUACAO[painel.situacao];
  const membros = painel.integrantes.filter((i) => i.integrante);
  const emAberto = painel.integrantes.filter((i) => !i.integrante && i.convite === "PENDENTE");
  const recusados = painel.integrantes.filter((i) => !i.integrante && i.convite !== "PENDENTE");
  const vagas = Math.max(painel.maximo_integrantes - membros.length - emAberto.length, 0);
  const faltaParaMinimo = Math.max(painel.minimo_integrantes - painel.total_integrantes, 0);
  const podeConvidar = painel.situacao === "EM_FORMACAO" && painel.voce_e_lider && painel.inscricoes_abertas;
  const bloqueios = painel.pendencias.filter((p) => p.bloqueia_conclusao);
  const avisos = painel.pendencias.filter((p) => !p.bloqueia_conclusao);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Selo>{"[ Painel do Esquadrão ]"}</Selo>
          <h1 className="mt-2 break-words text-4xl font-black tracking-tighter text-white md:text-5xl">
            {painel.nome || "Equipe sem nome"}
          </h1>
        </div>
        <p className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${classe}`}>
          <Icone className="h-4 w-4" aria-hidden="true" />
          {SITUACAO_EQUIPE[painel.situacao]}
        </p>
      </header>

      {/* Grade assimétrica: composição em destaque, protocolos ao lado */}
      <section aria-label="Resumo da equipe" className="grid gap-6 md:grid-cols-3">
        <div className={`${bloco} md:col-span-2`}>
          <p className={rotuloBloco}>Integrantes</p>
          <p className="mt-2 text-5xl font-black tracking-tighter text-white">
            {painel.total_integrantes}
            <span className="text-2xl font-bold text-gray-400"> / {painel.maximo_integrantes}</span>
          </p>
          <div
            role="progressbar"
            aria-label="Integrantes na equipe"
            aria-valuemin={0}
            aria-valuemax={painel.maximo_integrantes}
            aria-valuenow={painel.total_integrantes}
            className="mt-4 h-2 overflow-hidden rounded-full border border-white/10"
          >
            <div
              className="h-full bg-emerald-400"
              style={{
                width: `${Math.min((painel.total_integrantes / painel.maximo_integrantes) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="mt-3 text-sm text-gray-300">
            {faltaParaMinimo > 0
              ? `Falta ${faltaParaMinimo} para o mínimo de ${painel.minimo_integrantes}.`
              : `Mínimo de ${painel.minimo_integrantes} integrantes atingido.`}
          </p>
        </div>

        <div className={`${bloco} space-y-5`}>
          <div>
            <p className={rotuloBloco}>Protocolo da inscrição</p>
            {painel.protocolo ? (
              <>
                <p className="mt-1 break-all font-mono text-lg font-bold text-white">{painel.protocolo.numero}</p>
                <p className="text-xs text-gray-400">{formatarDataHora(painel.protocolo.emitido_em)}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-300">Inscrição ainda não concluída.</p>
            )}
          </div>
          <div>
            <p className={rotuloBloco}>Protocolo da proposta</p>
            {painel.protocolo_proposta ? (
              <>
                <p className="mt-1 break-all font-mono text-lg font-bold text-white">
                  {painel.protocolo_proposta.numero}
                </p>
                <p className="text-xs text-gray-400">{formatarDataHora(painel.protocolo_proposta.emitido_em)}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-300">Proposta ainda não enviada.</p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-esquadrao">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-esquadrao" className="text-xl font-extrabold tracking-tight text-white">
            Esquadrão
          </h2>
          {podeConvidar && (
            <Link href="/inscricao" className={btnGhost}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Convidar integrante
            </Link>
          )}
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...membros, ...emAberto].map((pessoa) => (
            <CartaoIntegrante
              key={pessoa.email}
              pessoa={pessoa}
              ehVoce={!!usuarioId && pessoa.usuario_id === usuarioId}
            />
          ))}
          {painel.situacao === "EM_FORMACAO" && vagas > 0 && (
            <li className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-gray-400">
              {vagas === 1 ? "1 vaga disponível" : `${vagas} vagas disponíveis`}
            </li>
          )}
        </ul>
        {recusados.length > 0 && (
          <p className="mt-4 text-xs text-gray-400">
            Convites sem efeito:{" "}
            {recusados
              .map((i) => `${i.nome || i.email} (${i.convite ? STATUS_CONVITE[i.convite].toLowerCase() : "sem resposta"})`)
              .join(", ")}
            .
          </p>
        )}
      </section>

      <section aria-labelledby="titulo-pendencias" className={bloco}>
        <h2 id="titulo-pendencias" className="text-xl font-extrabold tracking-tight text-white">
          O que falta
        </h2>
        {painel.pendencias.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
            <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Nenhuma pendência na equipe.
          </p>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {bloqueios.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-white">Impedem concluir a inscrição</h3>
                <ul className="space-y-2">
                  {bloqueios.map((p) => (
                    <li key={`${p.codigo}-${p.usuario_id ?? "equipe"}`} className="flex items-start gap-2 text-sm text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {p.mensagem}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {avisos.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-white">Impedem só a homologação</h3>
                <ul className="space-y-2">
                  {avisos.map((p) => (
                    <li key={`${p.codigo}-${p.usuario_id ?? "equipe"}`} className="flex items-start gap-2 text-sm text-gray-300">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {p.mensagem}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <Link href="/inscricao" className={`${btnGhost} mt-6`}>
          Abrir formulário de inscrição
        </Link>
      </section>
    </>
  );
}

/** A API lista da equipe mais recente para a mais antiga: sem escolha, abre a primeira. */
async function buscarEquipe(escolhida: string | null) {
  const lista = await equipes.minhas();
  const alvo = lista.find((e) => e.id === escolhida) ?? lista[0];
  return { lista, dados: alvo ? await equipes.painel(alvo.id) : null };
}

export default function EquipeDashboard() {
  const router = useRouter();
  const { user, pronto } = useSession();
  const [minhas, setMinhas] = useState<Equipe[] | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const [painel, setPainel] = useState<PainelEquipe | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [atualizando, setAtualizando] = useState(false);

  const contaAtiva = user?.situacao_conta === "ATIVA";

  const carregar = useCallback(
    (escolhida: string | null) =>
      buscarEquipe(escolhida)
        .then(({ lista, dados }) => {
          setMinhas(lista);
          setEquipeId(dados?.equipe_id ?? null);
          setPainel(dados);
          setErro(null);
        })
        .catch(setErro),
    []
  );

  useEffect(() => {
    if (pronto && contaAtiva) void carregar(null);
  }, [pronto, contaAtiva, carregar]);

  const atualizar = async (escolhida: string | null) => {
    setAtualizando(true);
    await carregar(escolhida);
    setAtualizando(false);
  };

  if (!pronto) {
    return (
      <main className="min-h-screen bg-[#0A1110] p-10">
        <p role="status" className="animate-pulse font-mono text-sm text-emerald-400">
          Carregando...
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#0A1110] font-sans text-gray-300 selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/90 to-[#0A1110]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 p-6 md:p-10">
        <nav aria-label="Navegação do painel" className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500 text-xs font-extrabold text-black">
              IA
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-white">Hackathon 2027</span>
          </Link>
          <div className="flex flex-wrap gap-2">
            {contaAtiva && (
              <button
                type="button"
                className={btnGhost}
                disabled={atualizando}
                onClick={() => void atualizar(equipeId)}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {atualizando ? "Atualizando..." : "Atualizar"}
              </button>
            )}
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                auth.logout();
                router.push("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair {user?.nome ? `(${user.nome.split(" ")[0]})` : ""}
            </button>
          </div>
        </nav>

        {!contaAtiva && (
          <section className={bloco}>
            <Selo>{"[ Conta em análise ]"}</Selo>
            <h1 className="mb-2 mt-2 text-3xl font-black tracking-tighter text-white">
              Aguardando validação do vínculo
            </h1>
            <p className="mb-6 text-sm text-gray-300">
              O Painel do Esquadrão abre quando a organização aprovar seu comprovante.
            </p>
            <Link href="/inscricao" className={btn}>
              Acompanhar comprovante
            </Link>
          </section>
        )}

        {contaAtiva && erro != null && (
          <ApiErrorAlert
            erro={erro}
            onRetry={() => void atualizar(equipeId)}
            onClose={() => setErro(null)}
          />
        )}

        {contaAtiva && minhas === null && erro == null && (
          <p role="status" className="animate-pulse font-mono text-sm text-emerald-400">
            Carregando equipe...
          </p>
        )}

        {contaAtiva && minhas?.length === 0 && (
          <section className={bloco}>
            <Selo>{"[ Painel do Esquadrão ]"}</Selo>
            <h1 className="mb-2 mt-2 text-3xl font-black tracking-tighter text-white">Você ainda não tem equipe</h1>
            {user?.papel === "PARTICIPANTE" ? (
              <>
                <p className="mb-6 text-sm text-gray-300">Crie uma equipe ou aceite um convite recebido.</p>
                <Link href="/inscricao" className={btn}>
                  Ir para a inscrição
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-300">Este perfil não participa de equipes.</p>
            )}
          </section>
        )}

        {minhas && minhas.length > 1 && (
          <label className="block max-w-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Equipe exibida
            </span>
            <select
              className={inp}
              value={equipeId ?? ""}
              disabled={atualizando}
              onChange={(e) => void atualizar(e.target.value)}
            >
              {minhas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome || "Equipe sem nome"}
                </option>
              ))}
            </select>
          </label>
        )}

        {contaAtiva && painel && <Painel painel={painel} usuarioId={user?.id} />}
      </div>
    </main>
  );
}
