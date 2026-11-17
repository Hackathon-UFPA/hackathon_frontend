"use client";

import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Campo, btn, btnGhost, inp } from "@/components/ui";
import {
  convites as convitesApi,
  termos,
  type Convite,
  type ConviteRecebido,
  type PainelEquipe,
} from "@/lib/api";
import {
  FUNCAO_MEMBRO,
  SITUACAO_EQUIPE,
  STATUS_COMPROVANTE,
  STATUS_CONVITE,
} from "@/lib/rotulos";
import TermosBox from "./TermosBox";

/** Ainda sem equipe: aceitar um convite recebido ou criar a própria equipe. */
export function SemEquipe({
  hackathonId,
  recebidos,
  ocupado,
  onCriar,
  onAcao,
  onAtualizar,
}: {
  hackathonId: string | null;
  recebidos: ConviteRecebido[];
  ocupado: boolean;
  onCriar: (nome: string) => void;
  onAcao: (fn: () => Promise<unknown>) => void;
  onAtualizar: () => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [aceitando, setAceitando] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {recebidos.length > 0 && (
        <section aria-labelledby="titulo-convites">
          <h3 id="titulo-convites" className="mb-3 font-bold text-white">
            Convites recebidos
          </h3>
          <ul className="space-y-3">
            {recebidos.map((c) => (
              <li key={c.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-white">{c.equipe_nome || "Equipe sem nome"}</p>
                {aceitando === c.id ? (
                  <div className="mt-3">
                    <TermosBox
                      hackathonId={c.hackathon_id}
                      rotulo="Aceitar convite e entrar na equipe"
                      onConfirmar={async (ids) => {
                        await convitesApi.aceitar(c.id, ids);
                        await onAtualizar();
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={btn} onClick={() => setAceitando(c.id)}>
                      Aceitar
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      disabled={ocupado}
                      onClick={() => onAcao(() => convitesApi.recusar(c.id))}
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="titulo-nova-equipe">
        <h3 id="titulo-nova-equipe" className="font-bold text-white">
          Criar nova equipe
        </h3>
        <p className="mb-4 mt-1 text-sm text-gray-400">Quem cria a equipe se torna o líder técnico.</p>
        {hackathonId ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onCriar(nome.trim());
            }}
          >
            <Campo label="Nome da equipe *">
              <input
                required
                maxLength={255}
                className={inp}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </Campo>
            <button type="submit" disabled={ocupado || !nome.trim()} className={`${btn} w-full`}>
              {ocupado ? "Criando..." : "Criar equipe"}
              {!ocupado && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>
        ) : (
          <p className="text-sm text-amber-300">
            Nenhum hackathon com inscrições abertas está vinculado à sua conta. Fale com a organização.
          </p>
        )}
      </section>
    </div>
  );
}

/** Com equipe: integrantes, pendências, termos, convites e conclusão da inscrição. */
export function ComEquipe({
  painel,
  convites,
  usuarioId,
  ocupado,
  onAcao,
  onAtualizar,
  onConcluir,
  onContinuar,
}: {
  painel: PainelEquipe;
  convites: Convite[];
  usuarioId: string;
  ocupado: boolean;
  onAcao: (fn: () => Promise<unknown>) => Promise<boolean>;
  onAtualizar: () => Promise<void>;
  onConcluir: () => void;
  onContinuar: () => void;
}) {
  const [convite, setConvite] = useState({ nome: "", email: "" });
  const eu = painel.integrantes.find((i) => i.usuario_id === usuarioId);
  const emFormacao = painel.situacao === "EM_FORMACAO";
  const pendentes = convites.filter((c) => c.status === "PENDENTE");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-xl font-extrabold tracking-tight text-white">
            {painel.nome || "Equipe sem nome"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {painel.total_integrantes} integrante(s), mínimo {painel.minimo_integrantes}, máximo{" "}
            {painel.maximo_integrantes}
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
          {SITUACAO_EQUIPE[painel.situacao]}
        </span>
      </div>

      {painel.protocolo && (
        <p className="text-sm text-gray-400">
          Protocolo da inscrição: <span className="font-mono text-white">{painel.protocolo.numero}</span>
        </p>
      )}

      <section aria-labelledby="titulo-integrantes">
        <h3 id="titulo-integrantes" className="mb-3 font-bold text-white">
          Integrantes
        </h3>
        <ul className="space-y-2">
          {painel.integrantes.map((i) => (
            <li
              key={i.email}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold text-white">{i.nome || i.email}</p>
                <p className="text-xs text-gray-400">
                  {i.funcao ? FUNCAO_MEMBRO[i.funcao] : i.integrante ? "Sem função definida" : "Ainda não entrou"}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2 text-xs font-bold text-gray-200">
                {i.integrante ? (
                  <>
                    <li className="rounded bg-white/5 px-2 py-1">
                      Termos {i.termos_aceitos ? "aceitos" : "pendentes"}
                    </li>
                    <li className="rounded bg-white/5 px-2 py-1">
                      Vínculo: {i.comprovante ? STATUS_COMPROVANTE[i.comprovante] : "não enviado"}
                    </li>
                  </>
                ) : (
                  // Antes de entrar, a API não informa termos nem comprovante do convidado.
                  i.convite && <li className="rounded bg-white/5 px-2 py-1">{STATUS_CONVITE[i.convite]}</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {painel.pendencias.length > 0 && (
        <section aria-labelledby="titulo-pendencias">
          <h3 id="titulo-pendencias" className="mb-3 font-bold text-white">
            O que ainda falta
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-amber-200">
            {painel.pendencias.map((p) => (
              <li key={`${p.codigo}-${p.usuario_id ?? "equipe"}`}>
                {p.mensagem}
                {!p.bloqueia_conclusao && <span className="text-gray-400"> (impede só a homologação)</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {emFormacao && eu && !eu.termos_aceitos && (
        <section aria-labelledby="titulo-termos">
          <h3 id="titulo-termos" className="mb-3 font-bold text-white">
            Aceite do regulamento e do termo de consentimento
          </h3>
          <TermosBox
            hackathonId={painel.hackathon_id}
            rotulo="Aceitar e continuar"
            onConfirmar={async (ids) => {
              await termos.aceitar(painel.hackathon_id, ids);
              await onAtualizar();
            }}
          />
        </section>
      )}

      {emFormacao && painel.voce_e_lider && painel.inscricoes_abertas && (
        <section aria-labelledby="titulo-convidar">
          <h3 id="titulo-convidar" className="mb-3 font-bold text-white">
            Convidar integrante
          </h3>
          <form
            className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              const certo = await onAcao(() =>
                convitesApi.enviar(painel.equipe_id, convite.nome.trim(), convite.email.trim())
              );
              if (certo) setConvite({ nome: "", email: "" });
            }}
          >
            <Campo label="Nome *">
              <input
                required
                className={inp}
                value={convite.nome}
                onChange={(e) => setConvite({ ...convite, nome: e.target.value })}
              />
            </Campo>
            <Campo label="E-mail da conta *">
              <input
                required
                type="email"
                className={inp}
                value={convite.email}
                onChange={(e) => setConvite({ ...convite, email: e.target.value })}
              />
            </Campo>
            <button type="submit" disabled={ocupado} className={btn}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Convidar
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-400">
            O convidado precisa ter conta ativa com esse e-mail. O envio por e-mail ainda não existe: avise-o para
            entrar no sistema.
          </p>
          {pendentes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {pendentes.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm"
                >
                  <span className="min-w-0 break-words">
                    {c.nome} ({c.email})
                  </span>
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={ocupado}
                    onClick={() => onAcao(() => convitesApi.cancelar(c.id))}
                  >
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {painel.pode_concluir && (
          <button type="button" className={btn} disabled={ocupado} onClick={onConcluir}>
            {ocupado ? "Concluindo..." : "Concluir inscrição da equipe"}
          </button>
        )}
        <button type="button" className={painel.pode_concluir ? btnGhost : btn} onClick={onContinuar}>
          Ir para a proposta
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {!painel.pode_concluir && emFormacao && painel.voce_e_lider && (
        <p className="text-xs text-gray-400">
          O botão de concluir aparece quando não houver pendências bloqueantes.
        </p>
      )}
    </div>
  );
}
