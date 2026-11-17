"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Users } from "lucide-react";
import CadastroForm from "@/components/auth/CadastroForm";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import EtapaEnvio from "@/components/inscricao/EtapaEnvio";
import { ComEquipe, SemEquipe } from "@/components/inscricao/EtapaEquipe";
import EtapaProposta, {
  dadosDoForm,
  formDaProposta,
  formsIguais,
  type FormProposta,
} from "@/components/inscricao/EtapaProposta";
import EtapaValidacao from "@/components/inscricao/EtapaValidacao";
import Stepper, { ETAPAS, type Etapa } from "@/components/inscricao/Stepper";
import { Selo, btnGhost, cartao } from "@/components/ui";
import {
  ApiError,
  auth,
  comprovantes,
  convites,
  destinoPorPapel,
  enviarArquivoComprovante,
  equipes,
  getToken,
  propostas,
  temas as temasApi,
  type Comprovante,
  type Convite,
  type ConviteRecebido,
  type PainelEquipe,
  type PapelUsuario,
  type Proposta,
  type PropostaEnviada,
  type Tema,
  type Usuario,
} from "@/lib/api";

type Visao =
  | { tipo: "carregando" }
  | { tipo: "anonimo" }
  | { tipo: "outro-perfil"; papel: PapelUsuario }
  | { tipo: "pendente"; usuario: Usuario; comps: Comprovante[] }
  | {
      tipo: "sem-equipe";
      usuario: Usuario;
      comps: Comprovante[];
      hackathonId: string | null;
      recebidos: ConviteRecebido[];
    }
  | {
      tipo: "equipe";
      usuario: Usuario;
      comps: Comprovante[];
      painel: PainelEquipe;
      convites: Convite[];
      temas: Tema[];
      rascunho: Proposta | null;
      enviada: PropostaEnviada | null;
    };

/** Sem rascunho a API responde 404: aqui isso significa "ainda não salvou", não um erro. */
async function buscarRascunho(equipeId: string): Promise<Proposta | null> {
  try {
    return await propostas.obterRascunho(equipeId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** O servidor decide em que ponto a pessoa está; o formulário só reflete esse estado. */
async function buscarVisao(): Promise<Visao> {
  if (!getToken()) return { tipo: "anonimo" };

  const usuario = await auth.me();
  if (usuario.papel !== "PARTICIPANTE" && usuario.papel !== "DEV") {
    return { tipo: "outro-perfil", papel: usuario.papel };
  }

  const comps = await comprovantes.meus();
  if (usuario.situacao_conta === "PENDENTE") return { tipo: "pendente", usuario, comps };

  const [equipe] = await equipes.minhas();
  if (!equipe) {
    const recebidos = await convites.meus();
    return { tipo: "sem-equipe", usuario, comps, hackathonId: comps[0]?.hackathon_id ?? null, recebidos };
  }

  const painel = await equipes.painel(equipe.id);
  const [lista, temas, enviada] = await Promise.all([
    convites.daEquipe(equipe.id),
    temasApi.listar(equipe.hackathon_id),
    painel.protocolo_proposta ? propostas.obterEnviada(equipe.id) : Promise.resolve(null),
  ]);
  const rascunho = enviada ? null : await buscarRascunho(equipe.id);
  return { tipo: "equipe", usuario, comps, painel, convites: lista, temas, rascunho, enviada };
}

/** Motivo de a proposta estar só para consulta; null quando a pessoa pode editar. */
function avisoLeitura(v: Extract<Visao, { tipo: "equipe" }>): string | null {
  if (v.enviada) return "A proposta foi enviada e não pode mais ser alterada.";
  if (v.painel.situacao === "NAO_HOMOLOGADA") return "A equipe não foi homologada: a proposta fica só para consulta.";
  if (v.painel.voce_e_lider) return null;
  return v.rascunho
    ? "Somente o líder técnico edita a proposta. Você vê a versão salva."
    : "O líder técnico ainda não salvou um rascunho da proposta.";
}

function etapaSugerida(v: Visao): Etapa {
  if (v.tipo === "pendente") return "validacao";
  if (v.tipo === "sem-equipe") return "equipe";
  if (v.tipo === "equipe") {
    if (v.enviada) return "envio";
    return v.painel.situacao === "EM_FORMACAO" ? "equipe" : "proposta";
  }
  return "conta";
}

function etapasAlcancaveis(v: Visao): Etapa[] {
  if (v.tipo === "pendente") return ["conta", "validacao"];
  if (v.tipo === "sem-equipe") return ["conta", "validacao", "equipe"];
  if (v.tipo === "equipe") return ["conta", "validacao", "equipe", "proposta", "envio"];
  return ["conta"];
}

function etapasConcluidas(v: Visao): Etapa[] {
  if (v.tipo === "pendente") return ["conta"];
  if (v.tipo === "sem-equipe") return ["conta", "validacao"];
  if (v.tipo === "equipe") {
    const feitas: Etapa[] = ["conta", "validacao"];
    if (v.painel.situacao !== "EM_FORMACAO") feitas.push("equipe");
    if (v.enviada) feitas.push("proposta", "envio");
    return feitas;
  }
  return [];
}

export default function InscricaoPage() {
  const router = useRouter();
  const [visao, setVisao] = useState<Visao>({ tipo: "carregando" });
  const [erro, setErro] = useState<unknown>(null);
  const [falhouAoCarregar, setFalhouAoCarregar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [selecionada, setSelecionada] = useState<Etapa | null>(null);
  const [form, setForm] = useState<FormProposta>(() => formDaProposta(null));
  const [errosProposta, setErrosProposta] = useState<Record<string, string>>({});
  // Última versão vinda do servidor: edições ainda não salvas não são sobrescritas ao recarregar.
  const formSalvo = useRef<FormProposta>(formDaProposta(null));
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const moverFoco = useRef(false);

  const carregar = useCallback(async () => {
    try {
      const nova = await buscarVisao();
      if (nova.tipo === "outro-perfil") {
        router.replace(destinoPorPapel(nova.papel));
        return;
      }
      if (nova.tipo === "equipe") {
        const doServidor = formDaProposta(nova.enviada ?? nova.rascunho);
        const anterior = formSalvo.current;
        formSalvo.current = doServidor;
        setForm((atual) => (formsIguais(atual, anterior) ? doServidor : atual));
      }
      setVisao(nova);
      setFalhouAoCarregar(false);
    } catch (e) {
      setErro(e);
      setFalhouAoCarregar(true);
    }
  }, [router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const tentarDeNovo = () => {
    setErro(null);
    void carregar();
  };

  // Executa uma ação, mostra o erro da API e recarrega o estado. Devolve se deu certo.
  const acao = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setOcupado(true);
    setErro(null);
    setFalhouAoCarregar(false);
    try {
      await fn();
      await carregar();
      return true;
    } catch (e) {
      setErro(e);
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const irPara = (etapa: Etapa) => {
    moverFoco.current = true;
    setSelecionada(etapa);
  };

  const alcancaveis = etapasAlcancaveis(visao);
  const etapa = selecionada && alcancaveis.includes(selecionada) ? selecionada : etapaSugerida(visao);
  const indice = ETAPAS.findIndex((e) => e.id === etapa);

  // Ao trocar de etapa pelo teclado, o foco acompanha o novo conteúdo.
  useEffect(() => {
    if (moverFoco.current) {
      moverFoco.current = false;
      tituloRef.current?.focus();
    }
  }, [etapa]);

  const sair = () => {
    auth.logout();
    router.push("/login");
  };

  const aoCadastrar = async (email: string, senha: string) => {
    try {
      await auth.login(email, senha);
    } catch {
      // A conta já existe: tentar o cadastro de novo daria 409. O login resolve.
      router.push("/login?proximo=%2Finscricao");
      return;
    }
    await carregar();
  };

  const salvarProposta = async (revisarDepois: boolean) => {
    if (visao.tipo !== "equipe") return;
    const { painel, rascunho } = visao;
    setErrosProposta({});
    const certo = await acao(async () => {
      try {
        const dados = dadosDoForm(form);
        if (rascunho) await propostas.salvarRascunho(painel.equipe_id, dados);
        else await propostas.criarRascunho(painel.equipe_id, dados);
        // A versão enviada já é a salva: o recarregamento pode trocar o formulário normalizado.
        formSalvo.current = form;
      } catch (e) {
        if (e instanceof ApiError) setErrosProposta(e.fields);
        throw e;
      }
    });
    if (certo && revisarDepois) irPara("envio");
  };

  const titulo: Record<Etapa, string> = {
    conta: visao.tipo === "anonimo" ? "Crie sua conta" : "Sua conta",
    validacao: "Validação do vínculo",
    equipe: "Monte sua equipe",
    proposta: "Escreva a proposta",
    envio: visao.tipo === "equipe" && visao.enviada ? "Proposta enviada" : "Revise e envie",
  };

  const temSessao = visao.tipo === "pendente" || visao.tipo === "sem-equipe" || visao.tipo === "equipe";

  return (
    <main className="relative min-h-screen bg-[#0A1110] p-6 font-sans text-gray-300 selection:bg-emerald-500/30 md:p-10">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/90 to-[#0A1110]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
            &larr; Voltar ao início
          </Link>
          {temSessao && (
            <div className="flex flex-wrap gap-2">
              {visao.tipo === "equipe" && (
                <Link href="/equipe" className={btnGhost}>
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Painel do Esquadrão
                </Link>
              )}
              <button type="button" className={btnGhost} onClick={sair}>
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sair {visao.usuario.nome ? `(${visao.usuario.nome.split(" ")[0]})` : ""}
              </button>
            </div>
          )}
        </div>

        <header>
          <Selo>{"Inscrição // Hackathon IA Amazônia"}</Selo>
          <h1 className="mt-2 text-3xl font-black tracking-tighter text-white md:text-4xl">
            Inscrição da equipe
          </h1>
        </header>

        <Stepper
          atual={etapa}
          alcancaveis={alcancaveis}
          concluidas={etapasConcluidas(visao)}
          onSelecionar={irPara}
        />

        {erro != null && (
          <ApiErrorAlert
            erro={erro}
            onRetry={falhouAoCarregar ? tentarDeNovo : undefined}
            onClose={() => setErro(null)}
          />
        )}

        {visao.tipo === "carregando" || visao.tipo === "outro-perfil" ? (
          !erro && (
            <p role="status" className="animate-pulse font-mono text-sm text-emerald-400">
              Carregando...
            </p>
          )
        ) : (
          <section className={cartao} aria-labelledby="titulo-etapa">
            <Selo>
              {`[ ${String(indice + 1).padStart(2, "0")} // ${ETAPAS[indice].nome} ]`}
            </Selo>
            <h2
              id="titulo-etapa"
              ref={tituloRef}
              tabIndex={-1}
              className="mb-6 mt-2 text-2xl font-extrabold tracking-tight text-white"
            >
              {titulo[etapa]}
            </h2>

            {etapa === "conta" && visao.tipo === "anonimo" && (
              <div className="space-y-5">
                <p className="text-sm text-gray-300">
                  Já tem conta?{" "}
                  <Link
                    href="/login?proximo=%2Finscricao"
                    className="font-bold text-emerald-400 underline hover:text-emerald-300"
                  >
                    Entrar
                  </Link>
                </p>
                <CadastroForm onCadastrado={aoCadastrar} />
              </div>
            )}

            {etapa === "conta" && temSessao && (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {[
                  ["Nome", visao.usuario.nome],
                  ["E-mail", visao.usuario.email],
                  ["Instituição", visao.usuario.instituicao],
                  ["Curso", visao.usuario.curso],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{rotulo}</dt>
                    <dd className="mt-1 break-words text-white">{valor || "Não informado"}</dd>
                  </div>
                ))}
              </dl>
            )}

            {etapa === "validacao" && temSessao && (
              <EtapaValidacao
                comprovantes={visao.comps}
                contaAtiva={visao.tipo !== "pendente"}
                ocupado={ocupado}
                onReenviar={(arquivo) =>
                  acao(async () => comprovantes.reenviar(await enviarArquivoComprovante(arquivo)))
                }
                onAtualizar={tentarDeNovo}
              />
            )}

            {etapa === "equipe" && visao.tipo === "sem-equipe" && (
              <SemEquipe
                hackathonId={visao.hackathonId}
                recebidos={visao.recebidos}
                ocupado={ocupado}
                onCriar={(nome) => {
                  void acao(() => equipes.criar(visao.hackathonId!, nome));
                }}
                onAcao={(fn) => {
                  void acao(fn);
                }}
                onAtualizar={carregar}
              />
            )}

            {etapa === "equipe" && visao.tipo === "equipe" && (
              <ComEquipe
                painel={visao.painel}
                convites={visao.convites}
                usuarioId={visao.usuario.id}
                ocupado={ocupado}
                onAcao={acao}
                onAtualizar={carregar}
                onConcluir={() => {
                  void acao(async () => {
                    const r = await equipes.concluirInscricao(visao.painel.equipe_id);
                    router.push(`/sucesso?protocolo=${encodeURIComponent(r.protocolo.numero)}`);
                  });
                }}
                onContinuar={() => irPara("proposta")}
              />
            )}

            {etapa === "proposta" && visao.tipo === "equipe" && (
              <EtapaProposta
                form={form}
                temas={visao.temas}
                rascunho={visao.rascunho ?? visao.enviada}
                avisoLeitura={avisoLeitura(visao)}
                ocupado={ocupado}
                erros={errosProposta}
                onAlterar={setForm}
                onSalvar={() => void salvarProposta(false)}
                onSalvarERevisar={() => void salvarProposta(true)}
              />
            )}

            {etapa === "envio" && visao.tipo === "equipe" && (
              <EtapaEnvio
                painel={visao.painel}
                rascunho={visao.rascunho}
                enviada={visao.enviada}
                temas={visao.temas}
                alteracoesNaoSalvas={!formsIguais(form, formDaProposta(visao.rascunho))}
                ocupado={ocupado}
                onEnviar={() => {
                  void acao(() => propostas.enviar(visao.painel.equipe_id));
                }}
                onVoltar={() => irPara("proposta")}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}
