// components/modulo-c/GestaoEquipe.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  FuncaoMembro,
  HackathonResumo,
  moduloCApi,
  PainelEquipeNormalizado,
  SituacaoConta,
  TermoVigente,
  UsuarioMe,
} from "@/lib/api";
import { inscricoesAbertas } from "@/components/plataforma/hackathon-util";
import {
  ROTULO_CATEGORIA,
  ROTULO_TIPO_INTEGRANTE,
  type CategoriaEquipe,
  type TipoIntegrante,
} from "@/lib/api-participante";
import {
  BadgeComprovante,
  BadgeConvite,
  BadgeSituacaoConta,
  BadgeSituacaoEquipe,
  labelFuncao,
} from "./StatusBadges";

interface FormCriarEquipeProps {
  hackathons: HackathonResumo[];
  hackathonSelecionadoId: string;
  onSelectHackathon: (id: string) => void;
  situacaoConta: SituacaoConta;
  onEquipeCriada: (novaEquipeId: string) => Promise<void>;
}

type LinhaIntegrante = { nome: string; email: string; tipo: TipoIntegrante | "" };
const LINHA_VAZIA: LinhaIntegrante = { nome: "", email: "", tipo: "" };
const CATEGORIAS = Object.keys(ROTULO_CATEGORIA) as CategoriaEquipe[];
const TIPOS: TipoIntegrante[] = ["ESTUDANTE", "PROFISSIONAL"];
const novaChave = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const campoCls =
  "w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] border border-[#D8CFC0] text-sm text-[#1F2421] focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50";
const rotuloCls = "block text-xs font-bold uppercase tracking-wider text-[#5C574F] mb-1.5";

export function FormCriarEquipe({
  hackathons,
  hackathonSelecionadoId,
  onSelectHackathon,
  situacaoConta,
  onEquipeCriada,
}: FormCriarEquipeProps) {
  const [nomeEquipe, setNomeEquipe] = useState("");
  // RF18: o líder inscreve a equipe inteira de uma vez (categoria + integrantes)
  const [categoria, setCategoria] = useState<CategoriaEquipe>("ESTUDANTES");
  const [tipoLider, setTipoLider] = useState<TipoIntegrante>("ESTUDANTE");
  const [integrantes, setIntegrantes] = useState<LinhaIntegrante[]>([LINHA_VAZIA]);
  // Mesma chave enquanto for o mesmo pedido: repetir após falha de rede não duplica a equipe
  const [chave, setChave] = useState(novaChave);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Status e período (RN06): a API recusa edição com inscrições que ainda não abriram ou já fecharam
  const edicoesAbertas = hackathons.filter((h) => inscricoesAbertas(h));
  const edicao = edicoesAbertas.find((h) => h.id === hackathonSelecionadoId);
  const minimo = edicao?.min_integrantes ?? 3;
  const maximo = edicao?.max_integrantes ?? 5;
  const mista = categoria === "MISTA";
  const preenchidos = integrantes.filter((l) => l.email.trim());
  const total = 1 + preenchidos.length;
  const bloqueado = situacaoConta === "PENDENTE";

  const alterarLinha = (n: number, campo: keyof LinhaIntegrante, valor: string) => {
    setIntegrantes((ls) => ls.map((l, i) => (i === n ? { ...l, [campo]: valor } : l)));
    setChave(novaChave());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonSelecionadoId || !nomeEquipe.trim()) return;
    if (total < minimo || total > maximo) {
      setErro(`A equipe precisa ter de ${minimo} a ${maximo} pessoas contando com você (agora são ${total}).`);
      return;
    }

    setCriando(true);
    setErro(null);
    const tipoDaCategoria: TipoIntegrante | null =
      categoria === "ESTUDANTES" ? "ESTUDANTE" : categoria === "PROFISSIONAIS" ? "PROFISSIONAL" : null;
    try {
      const criada = await moduloCApi.criarEquipe({
        hackathon_id: hackathonSelecionadoId,
        nome: nomeEquipe.trim(),
        composicao: {
          categoria,
          tipo_lider: mista ? tipoLider : tipoDaCategoria,
          integrantes: preenchidos.map((l) => ({
            nome: l.nome.trim(),
            email: l.email.trim().toLowerCase(),
            tipo_integrante: mista ? (l.tipo || null) : tipoDaCategoria,
          })),
        },
        idempotencia: chave,
      });
      setNomeEquipe("");
      setIntegrantes([LINHA_VAZIA]);
      setChave(novaChave());
      await onEquipeCriada(criada.id);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Não foi possível criar a equipe."
      );
    } finally {
      setCriando(false);
    }
  };

  return (
    <section className="bg-white border border-[#D8CFC0] rounded-2xl p-6 shadow-sm space-y-5">
      <div className="border-b border-[#EDE6D6] pb-4">
        <h2 className="text-lg font-bold text-[#1B4332]">Criar Nova Equipe</h2>
        <p className="text-xs text-[#5C574F] mt-1">
          Como criador da equipe, você assumirá automaticamente a função de{" "}
          <strong>Líder</strong>.
        </p>
      </div>

      {situacaoConta === "PENDENTE" && (
        <div className="p-4 rounded-xl bg-[#FDF3E7] border border-[#E6CCB2] text-xs text-[#6B4F3B]">
          <strong>Conta Pendente:</strong> a criação de equipe exige que seu comprovante de vínculo esteja aprovado pelo Comitê.
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F5C2C7] text-[#9B2226] text-xs"
        >
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="select-edicao-equipe"
            className="block text-xs font-bold uppercase tracking-wider text-[#5C574F] mb-1.5"
          >
            Edição do Hackathon *
          </label>
          <select
            id="select-edicao-equipe"
            required
            value={hackathonSelecionadoId}
            onChange={(e) => onSelectHackathon(e.target.value)}
            disabled={situacaoConta === "PENDENTE" || edicoesAbertas.length === 0}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] border border-[#D8CFC0] text-sm text-[#1F2421] focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {edicoesAbertas.length === 0
                ? "Nenhuma edição com inscrições abertas"
                : "Selecione a edição..."}
            </option>
            {edicoesAbertas.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome} ({h.min_integrantes ?? 3} a {h.max_integrantes ?? 5} integrantes)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="input-nome-equipe"
            className="block text-xs font-bold uppercase tracking-wider text-[#5C574F] mb-1.5"
          >
            Nome da Equipe *
          </label>
          <input
            id="input-nome-equipe"
            type="text"
            required
            maxLength={100}
            placeholder="Ex.: Guardiões da Floresta IA"
            value={nomeEquipe}
            onChange={(e) => setNomeEquipe(e.target.value)}
            disabled={situacaoConta === "PENDENTE"}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] border border-[#D8CFC0] text-sm text-[#1F2421] focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="select-categoria-equipe" className={rotuloCls}>
              Categoria *
            </label>
            <select
              id="select-categoria-equipe"
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value as CategoriaEquipe);
                setChave(novaChave());
              }}
              disabled={bloqueado}
              className={campoCls}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {ROTULO_CATEGORIA[c]}
                </option>
              ))}
            </select>
          </div>
          {mista && (
            <div>
              <label htmlFor="select-tipo-lider" className={rotuloCls}>
                Seu tipo (líder) *
              </label>
              <select
                id="select-tipo-lider"
                value={tipoLider}
                onChange={(e) => {
                  setTipoLider(e.target.value as TipoIntegrante);
                  setChave(novaChave());
                }}
                disabled={bloqueado}
                className={campoCls}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO_INTEGRANTE[t]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <fieldset disabled={bloqueado} className="space-y-2">
          <legend className={rotuloCls}>
            Integrantes além de você ({total} de {minimo} a {maximo}) *
          </legend>
          <p className="text-[11px] text-[#5C574F]">
            Cada pessoa recebe um convite por e-mail para entrar, aceitar os termos e enviar o
            próprio comprovante. Quem ainda não tem conta cria pelo link do convite.
          </p>
          {integrantes.map((l, n) => (
            <div
              key={n}
              className={`grid gap-2 rounded-xl border border-[#EDE6D6] bg-[#FAF8F5] p-3 ${
                mista ? "sm:grid-cols-[1fr_1.2fr_9rem_auto]" : "sm:grid-cols-[1fr_1.2fr_auto]"
              }`}
            >
              <input
                required
                aria-label={`Nome do integrante ${n + 1}`}
                placeholder="Nome"
                maxLength={255}
                value={l.nome}
                onChange={(e) => alterarLinha(n, "nome", e.target.value)}
                className={campoCls}
              />
              <input
                required
                type="email"
                aria-label={`E-mail do integrante ${n + 1}`}
                placeholder="E-mail"
                value={l.email}
                onChange={(e) => alterarLinha(n, "email", e.target.value)}
                className={campoCls}
              />
              {mista && (
                <select
                  required
                  aria-label={`Tipo do integrante ${n + 1}`}
                  value={l.tipo}
                  onChange={(e) => alterarLinha(n, "tipo", e.target.value)}
                  className={campoCls}
                >
                  <option value="">Tipo...</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {ROTULO_TIPO_INTEGRANTE[t]}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                aria-label={`Retirar integrante ${n + 1}`}
                onClick={() => {
                  setIntegrantes((ls) => (ls.length > 1 ? ls.filter((_, i) => i !== n) : [LINHA_VAZIA]));
                  setChave(novaChave());
                }}
                className="rounded-lg border border-[#D8CFC0] bg-white px-3 text-sm text-[#5C574F] hover:border-[#F5C2C7] hover:text-[#9B2226]"
              >
                −
              </button>
            </div>
          ))}
          {total < maximo && (
            <button
              type="button"
              onClick={() => setIntegrantes((ls) => [...ls, LINHA_VAZIA])}
              className="rounded-lg border border-dashed border-[#95D5B2] px-3 py-2 text-xs font-semibold text-[#2D6A4F] hover:bg-[#E6F4EA]"
            >
              + Adicionar integrante
            </button>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={
            criando ||
            situacaoConta === "PENDENTE" ||
            !hackathonSelecionadoId ||
            !nomeEquipe.trim()
          }
          className="px-5 py-2.5 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {criando ? "Criando equipe..." : "Criar equipe e enviar convites"}
        </button>
      </form>
    </section>
  );
}

interface GestaoEquipeProps {
  painel: PainelEquipeNormalizado;
  usuario: UsuarioMe;
  onRecarregarPainel: () => Promise<void>;
}

export function GestaoEquipe({
  painel,
  usuario,
  onRecarregarPainel,
}: GestaoEquipeProps) {
  const router = useRouter();

  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState(painel.nome);
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [emailConvite, setEmailConvite] = useState("");
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const [modalTermosAberto, setModalTermosAberto] = useState(false);
  const [termosVigentes, setTermosVigentes] = useState<TermoVigente[]>([]);
  const [termosMarcados, setTermosMarcados] = useState<Record<string, boolean>>({});
  const [carregandoTermos, setCarregandoTermos] = useState(false);
  const [aceitandoTermos, setAceitandoTermos] = useState(false);

  const [modalConcluirAberto, setModalConcluirAberto] = useState(false);
  const [concluindo, setConcluindo] = useState(false);

  const [acaoEmCurso, setAcaoEmCurso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const emFormacao = painel.situacao === "EM_FORMACAO";
  const meuRegistro = painel.integrantes.find(
    (i) => i.usuario_id === usuario.id || i.email === usuario.email
  );
  // `voce_e_lider` vem da API; `pode_concluir` não indica liderança.
  const souLider =
    painel.voce_e_lider || meuRegistro?.funcao === "LIDER" || usuario.papel === "DEV";

  const integrantesConfirmados = painel.integrantes.filter((i) => i.integrante);
  const convitesPendentes = painel.integrantes.filter(
    (i) => !i.integrante && i.status_convite === "PENDENTE"
  );
  const vagasOcupadas = integrantesConfirmados.length + convitesPendentes.length;
  const percentualVagas = Math.min(
    100,
    Math.round((integrantesConfirmados.length / painel.max_integrantes) * 100)
  );

  const handleSalvarNome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    setSalvandoNome(true);
    setErro(null);
    setSucesso(null);
    try {
      await moduloCApi.editarNomeEquipe(painel.equipe_id, novoNome.trim());
      setEditandoNome(false);
      setSucesso("Nome da equipe atualizado.");
      await onRecarregarPainel();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao editar nome.");
    } finally {
      setSalvandoNome(false);
    }
  };

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConvite.trim()) return;
    setEnviandoConvite(true);
    setErro(null);
    setSucesso(null);
    try {
      // A API não grava função no convite: o líder define depois do aceite, na tabela.
      await moduloCApi.convidarIntegrante(painel.equipe_id, {
        email: emailConvite.trim().toLowerCase(),
      });
      setEmailConvite("");
      setSucesso("Convite enviado com sucesso.");
      await onRecarregarPainel();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar convite.");
    } finally {
      setEnviandoConvite(false);
    }
  };

  const handleCancelarConvite = async (conviteId: string) => {
    setAcaoEmCurso(conviteId);
    setErro(null);
    setSucesso(null);
    try {
      await moduloCApi.cancelarConviteEquipe(painel.equipe_id, conviteId);
      setSucesso("Convite cancelado.");
      await onRecarregarPainel();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao cancelar convite.");
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const handleAlterarFuncao = async (
    usuarioId: string,
    novaFuncao: Exclude<FuncaoMembro, "LIDER">
  ) => {
    setAcaoEmCurso(usuarioId);
    setErro(null);
    setSucesso(null);
    try {
      await moduloCApi.alterarFuncaoIntegrante(
        painel.equipe_id,
        usuarioId,
        novaFuncao
      );
      setSucesso("Função do integrante atualizada.");
      await onRecarregarPainel();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao alterar função.");
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const handleRemoverIntegrante = async (usuarioId: string, nome: string) => {
    if (!window.confirm(`Remover ${nome} da equipe?`)) return;
    setAcaoEmCurso(usuarioId);
    setErro(null);
    setSucesso(null);
    try {
      await moduloCApi.removerIntegrante(painel.equipe_id, usuarioId);
      setSucesso(`${nome} foi removido da equipe.`);
      await onRecarregarPainel();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao remover integrante.");
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const abrirModalTermosLider = async () => {
    setErro(null);
    setModalTermosAberto(true);
    setCarregandoTermos(true);
    setTermosMarcados({});
    try {
      const lista = await moduloCApi.listarTermosVigentes(painel.hackathon_id);
      setTermosVigentes(lista);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar termos vigentes."
      );
      setModalTermosAberto(false);
    } finally {
      setCarregandoTermos(false);
    }
  };

  const todosTermosMarcados =
    termosVigentes.length > 0 &&
    termosVigentes.every((t) => Boolean(termosMarcados[t.id]));

  const handleAceitarTermosLider = async () => {
    if (!todosTermosMarcados) return;
    setAceitandoTermos(true);
    setErro(null);
    try {
      const ids = termosVigentes.map((t) => t.id);
      await moduloCApi.aceitarTermos(painel.hackathon_id, ids);
      setModalTermosAberto(false);
      setSucesso("Aceite dos termos vigentes registrado com sucesso.");
      await onRecarregarPainel();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setErro(`${err.message} Os termos vigentes foram atualizados.`);
      } else {
        setErro(err instanceof Error ? err.message : "Erro ao aceitar termos.");
      }
      setModalTermosAberto(false);
    } finally {
      setAceitandoTermos(false);
    }
  };

  const handleConcluirInscricao = async () => {
    setConcluindo(true);
    setErro(null);
    try {
      const resposta = await moduloCApi.concluirInscricao(painel.equipe_id);
      setModalConcluirAberto(false);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `protocolo_inscricao_${painel.equipe_id}`,
          JSON.stringify({
            equipe_id: resposta.equipe_id,
            equipe_nome: painel.nome,
            hackathon_nome: painel.hackathon_nome || "",
            situacao: resposta.situacao,
            inscricao_concluida_em: resposta.inscricao_concluida_em,
            protocolo: resposta.protocolo,
          })
        );
      }

      router.push(
        `/sucesso?equipe_id=${encodeURIComponent(
          resposta.equipe_id
        )}&protocolo=${encodeURIComponent(
          resposta.protocolo.numero
        )}&emitido_em=${encodeURIComponent(resposta.protocolo.emitido_em)}`
      );
    } catch (err: unknown) {
      setModalConcluirAberto(false);
      if (err instanceof ApiError && err.status === 409) {
        setErro(
          `${err.message} Verifique o checklist de pendências atualizado abaixo.`
        );
        await onRecarregarPainel();
      } else {
        setErro(
          err instanceof Error ? err.message : "Não foi possível concluir a inscrição."
        );
      }
    } finally {
      setConcluindo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Equipe e Barra de Vagas */}
      <section className="bg-white border border-[#D8CFC0] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EDE6D6] pb-4">
          <div className="space-y-1">
            {editandoNome && emFormacao && souLider ? (
              <form onSubmit={handleSalvarNome} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#2D6A4F] text-base font-bold text-[#1B4332]"
                />
                <button
                  type="submit"
                  disabled={salvandoNome}
                  className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold cursor-pointer"
                >
                  {salvandoNome ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditandoNome(false);
                    setNovoNome(painel.nome);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#D8CFC0] text-xs font-semibold text-[#5C574F] cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-[#1B4332]">
                  {painel.nome}
                </h2>
                <BadgeSituacaoEquipe situacao={painel.situacao} />
                {emFormacao && souLider && (
                  <button
                    type="button"
                    onClick={() => {
                      setNovoNome(painel.nome);
                      setEditandoNome(true);
                    }}
                    className="text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
                  >
                    Editar nome
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-[#5C574F]">
              Edição:{" "}
              <strong>{painel.hackathon_nome || painel.hackathon_id}</strong> • Composição exigida:{" "}
              <strong>
                {painel.min_integrantes} a {painel.max_integrantes} integrantes
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onRecarregarPainel}
            className="px-3 py-1.5 rounded-lg border border-[#D8CFC0] bg-[#FAF8F5] hover:bg-[#EDE6D6] text-xs font-semibold text-[#1B4332] cursor-pointer"
          >
            Atualizar painel
          </button>
        </div>

        {/* Barra de Vagas */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[#3D3A35]">
            <span>
              Integrantes confirmados: {integrantesConfirmados.length} de{" "}
              {painel.max_integrantes} vagas (mínimo {painel.min_integrantes})
            </span>
            <span>{convitesPendentes.length} convite(s) pendente(s)</span>
          </div>
          <div className="w-full h-2.5 bg-[#EDE6D6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D6A4F] transition-all"
              style={{ width: `${percentualVagas}%` }}
            />
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

        {sucesso && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-[#E6F4EA] border border-[#95D5B2] text-[#1B4332] text-xs font-medium"
          >
            {sucesso}
          </div>
        )}

        {/* Aceite de termos do próprio participante logado */}
        {meuRegistro && !meuRegistro.termos_aceitos && (
          <div className="p-4 rounded-xl bg-[#FDF3E7] border border-[#E6CCB2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#6B4F3B]">
              <p className="font-bold">Aceite pendente dos termos vigentes</p>
              <p>
                Você precisa ler e aceitar o regulamento e o termo de consentimento vigentes antes que a inscrição possa ser concluída.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirModalTermosLider}
              className="px-4 py-2 rounded-lg bg-[#8C5E3C] hover:bg-[#6B4F3B] text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Ler e Aceitar Termos
            </button>
          </div>
        )}
      </section>

      {/* Tabela de Integrantes e Convites */}
      <section className="bg-white border border-[#D8CFC0] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1B4332]">
          Integrantes e Convites da Equipe
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D8CFC0] text-[#5C574F] uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-3">Participante</th>
                <th className="py-2.5 px-3">Função</th>
                <th className="py-2.5 px-3">Vínculo / Convite</th>
                <th className="py-2.5 px-3">Conta & Comprovante</th>
                <th className="py-2.5 px-3">Termos</th>
                {emFormacao && souLider && (
                  <th className="py-2.5 pl-3 text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE6D6]">
              {painel.integrantes.map((item, idx) => {
                const ehLiderItem = item.funcao === "LIDER";
                const itemKey = item.usuario_id || item.convite_id || `${item.email}-${idx}`;
                return (
                  <tr key={itemKey} className="align-middle">
                    <td className="py-3 pr-3">
                      <p className="font-bold text-[#1F2421]">{item.nome || "Convidado"}</p>
                      <p className="text-[11px] text-[#5C574F]">{item.email}</p>
                      {item.pendencias.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[11px] text-[#8C5E3C]">
                          {item.pendencias.map((p, i) => (
                            <li key={i}>• {p}</li>
                          ))}
                        </ul>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {emFormacao && souLider && item.integrante && !ehLiderItem && item.usuario_id ? (
                        <select
                          aria-label={`Função de ${item.nome}`}
                          disabled={acaoEmCurso === item.usuario_id}
                          value={item.funcao ?? ""}
                          onChange={(e) =>
                            handleAlterarFuncao(
                              item.usuario_id!,
                              e.target.value as Exclude<FuncaoMembro, "LIDER">
                            )
                          }
                          className="px-2 py-1 rounded border border-[#D8CFC0] bg-[#FAF8F5] text-xs font-medium"
                        >
                          <option value="" disabled>
                            Definir função...
                          </option>
                          <option value="DESENVOLVEDOR">Desenvolvedor(a)</option>
                          <option value="DESIGNER">Designer</option>
                          <option value="NEGOCIOS">Negócios</option>
                          <option value="OUTRO">Outro</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-[#3D3A35]">
                          {labelFuncao(item.funcao)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <BadgeConvite status={item.status_convite} />
                    </td>

                    <td className="py-3 px-3 space-y-1">
                      {item.situacao_conta && (
                        <div>
                          <BadgeSituacaoConta situacao={item.situacao_conta} />
                        </div>
                      )}
                      {item.status_comprovante && (
                        <div>
                          <BadgeComprovante status={item.status_comprovante} />
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {item.termos_aceitos ? (
                        <span className="text-[#1B4332] font-bold">Aceitos</span>
                      ) : (
                        <span className="text-[#8C5E3C] font-semibold">Pendente</span>
                      )}
                    </td>

                    {emFormacao && souLider && (
                      <td className="py-3 pl-3 text-right">
                        {!item.integrante &&
                          item.status_convite === "PENDENTE" &&
                          item.convite_id && (
                            <button
                              type="button"
                              disabled={acaoEmCurso === item.convite_id}
                              onClick={() => handleCancelarConvite(item.convite_id!)}
                              className="px-2.5 py-1 rounded border border-[#F5C2C7] bg-[#FDECEA] text-[#9B2226] font-semibold hover:opacity-80 cursor-pointer"
                            >
                              Cancelar convite
                            </button>
                          )}

                        {item.integrante && !ehLiderItem && item.usuario_id && (
                          <button
                            type="button"
                            disabled={acaoEmCurso === item.usuario_id}
                            onClick={() =>
                              handleRemoverIntegrante(item.usuario_id!, item.nome)
                            }
                            className="px-2.5 py-1 rounded border border-[#D8CFC0] bg-white hover:bg-[#FDECEA] hover:text-[#9B2226] text-[#5C574F] font-semibold cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Formulário de Novo Convite (Líder + EM_FORMACAO) */}
        {emFormacao && souLider && (
          <form
            onSubmit={handleConvidar}
            className="pt-4 border-t border-[#EDE6D6] flex flex-col sm:flex-row gap-3 items-end"
          >
            <div className="flex-1 w-full">
              <label
                htmlFor="input-email-convite"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#5C574F] mb-1"
              >
                Convidar participante por e-mail
              </label>
              <input
                id="input-email-convite"
                type="email"
                required
                placeholder="colega@ufpa.br"
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                disabled={vagasOcupadas >= painel.max_integrantes}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8F5] border border-[#D8CFC0] text-xs text-[#1F2421] focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={
                enviandoConvite ||
                vagasOcupadas >= painel.max_integrantes ||
                !emailConvite.trim()
              }
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviandoConvite ? "Enviando..." : "Enviar Convite"}
            </button>
          </form>
        )}
                {emFormacao && souLider && (
          <p className="text-[11px] text-[#5C574F]">
            O convidado precisa ter conta com esse e-mail. A função de cada integrante é definida
            na tabela acima, depois que ele aceitar o convite.
          </p>
        )}
        {emFormacao && souLider && !painel.inscricoes_abertas && (
          <p className="text-[11px] text-[#8C5E3C]">
            As inscrições desta edição não estão abertas agora (status ou datas da edição). Enquanto
            isso, o servidor recusa novos convites.
          </p>
        )}
        {!emFormacao && souLider && (
          <p className="text-[11px] text-[#5C574F]">
            A inscrição desta equipe já foi concluída. Convites, troca de função e remoção de
            integrantes só são permitidos enquanto a equipe está em formação.
          </p>
        )}
      </section>

      {/* Checklist de Pendências e Conclusão da Inscrição */}
      {emFormacao && (
        <section className="bg-white border border-[#D8CFC0] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#1B4332]">
            Conclusão da Inscrição da Equipe
          </h3>

          {painel.pendencias.length > 0 ? (
            <div className="p-4 rounded-xl bg-[#FDF3E7] border border-[#E6CCB2] space-y-2">
              <p className="text-xs font-bold text-[#6B4F3B]">
                Pendências da equipe:
              </p>
              <ul className="list-disc pl-5 text-xs text-[#8C5E3C] space-y-1">
                {painel.pendencias.map((pendencia, idx) => (
                  <li key={idx}>{pendencia}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#E6F4EA] border border-[#95D5B2] text-xs text-[#1B4332]">
              Todos os requisitos da equipe foram cumpridos. A inscrição está pronta para ser concluída pelo líder.
            </div>
          )}

          {souLider && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!painel.pode_concluir}
                onClick={() => setModalConcluirAberto(true)}
                className="px-6 py-3 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Concluir Inscrição da Equipe
              </button>
            </div>
          )}
        </section>
      )}

      {/* Modal de Aceite de Termos pelo Líder */}
      {modalTermosAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#D8CFC0] rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1B4332]">
              Regulamento e Termo de Consentimento Vigentes
            </h3>
            <p className="text-xs text-[#5C574F]">
              Leia os documentos vigentes abaixo e confirme sua concordância para liberar a inscrição da equipe:
            </p>

            {carregandoTermos ? (
              <p className="text-xs text-[#5C574F] py-6 text-center">
                Carregando termos vigentes...
              </p>
            ) : termosVigentes.length === 0 ? (
              <p className="text-xs text-[#9B2226] bg-[#FDECEA] p-3 rounded-lg">
                Nenhum termo vigente foi publicado para esta edição no servidor.
              </p>
            ) : (
              <div className="space-y-3">
                {termosVigentes.map((termo) => (
                  <div
                    key={termo.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D8CFC0] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1B4332]">
                        {termo.titulo} (v{termo.versao})
                      </span>
                      {termo.url && (
                        <a
                          href={termo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#2D6A4F] underline"
                        >
                          Abrir documento
                        </a>
                      )}
                    </div>
                    {termo.conteudo && (
                      <div className="max-h-28 overflow-y-auto text-[11px] text-[#3D3A35] bg-white p-2.5 rounded border border-[#EDE6D6] whitespace-pre-line">
                        {termo.conteudo}
                      </div>
                    )}
                    <label className="flex items-start gap-2 text-xs text-[#1F2421] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(termosMarcados[termo.id])}
                        onChange={(e) =>
                          setTermosMarcados((prev) => ({
                            ...prev,
                            [termo.id]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 accent-[#1B4332]"
                      />
                      <span>
                        Li e concordo integralmente com <strong>{termo.titulo}</strong> (versão {termo.versao}).
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EDE6D6]">
              <button
                type="button"
                onClick={() => setModalTermosAberto(false)}
                className="px-4 py-2 rounded-lg border border-[#D8CFC0] text-xs font-semibold text-[#5C574F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!todosTermosMarcados || aceitandoTermos}
                onClick={handleAceitarTermosLider}
                className="px-5 py-2 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                {aceitandoTermos ? "Registrando aceite..." : "Confirmar Aceite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Final da Inscrição */}
      {modalConcluirAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#D8CFC0] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#1B4332]">
              Confirmar Conclusão da Inscrição?
            </h3>
            <p className="text-xs text-[#3D3A35] leading-relaxed">
              Ao concluir a inscrição da equipe <strong>{painel.nome}</strong>, eventuais convites ainda sem resposta serão cancelados e o servidor emitirá o protocolo oficial de inscrição.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EDE6D6]">
              <button
                type="button"
                disabled={concluindo}
                onClick={() => setModalConcluirAberto(false)}
                className="px-4 py-2 rounded-lg border border-[#D8CFC0] text-xs font-semibold text-[#5C574F] cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={concluindo}
                onClick={handleConcluirInscricao}
                className="px-5 py-2 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {concluindo ? "Concluindo..." : "Confirmar e Gerar Protocolo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}