"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ApiError,
  auth,
  comprovantes,
  convites,
  enviarArquivoComprovante,
  equipes,
  propostas,
  termos,
  type Comprovante,
  type Convite,
  type ConviteRecebido,
  type PainelEquipe,
  type Termo,
} from "@/lib/api";
import { useSession } from "@/lib/useSession";

const inp =
  "w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-xs uppercase text-gray-400 mb-1 font-semibold";
const btn =
  "px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer";
const btnGhost =
  "px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 text-xs rounded-lg text-white font-bold cursor-pointer disabled:opacity-50";
const card = "bg-[#131D1C] p-6 rounded-2xl border border-emerald-900/50 shadow-xl";

const msg = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Erro inesperado.";

/* ───────── Leitura e aceite do regulamento + termo de consentimento ───────── */
function TermosBox({
  hackathonId,
  rotulo,
  onConfirmar,
}: {
  hackathonId: string;
  rotulo: string;
  onConfirmar: (ids: string[]) => Promise<void>;
}) {
  const [lista, setLista] = useState<Termo[]>([]);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    termos.vigentes(hackathonId).then(setLista).catch((e) => setErro(msg(e)));
  }, [hackathonId]);

  const confirmar = async () => {
    setBusy(true);
    setErro(null);
    try {
      await onConfirmar(lista.map((t) => t.id));
    } catch (e) {
      setErro(msg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {lista.map((t) => (
        <details key={t.id} className="bg-[#0A1110] border border-gray-800 rounded-lg p-3 text-xs">
          <summary className="cursor-pointer text-white font-semibold">
            {t.titulo} (v{t.versao})
          </summary>
          {t.conteudo && <p className="mt-2 whitespace-pre-line text-gray-400">{t.conteudo}</p>}
          {t.url && (
            <a href={t.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline mt-2 inline-block">
              Abrir documento &rarr;
            </a>
          )}
        </details>
      ))}
      {erro && <p className="text-red-400 text-xs">⚠️ {erro}</p>}
      {lista.length > 0 && (
        <>
          <label className="flex items-start gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5" />
            Li e aceito o regulamento e o termo de consentimento.
          </label>
          <button disabled={!ok || busy} onClick={confirmar} className={btn}>
            {busy ? "Registrando..." : rotulo}
          </button>
        </>
      )}
    </div>
  );
}

type Visao =
  | { tipo: "carregando" }
  | { tipo: "pendente"; comps: Comprovante[] }
  | { tipo: "sem-equipe"; hackathonId: string | null; recebidos: ConviteRecebido[] }
  | { tipo: "equipe"; painel: PainelEquipe; convites: Convite[] };

export default function InscricaoPage() {
  const router = useRouter();
  const { user, pronto } = useSession(["PARTICIPANTE"]);
  const [visao, setVisao] = useState<Visao>({ tipo: "carregando" });
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [novaEquipe, setNovaEquipe] = useState({ nome: "", descricao: "" });
  const [convite, setConvite] = useState({ nome: "", email: "" });
  const [aceitando, setAceitando] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const eu = await auth.me();
      if (eu.situacao_conta === "PENDENTE") {
        setVisao({ tipo: "pendente", comps: await comprovantes.meus() });
        return;
      }
      const [eq] = await equipes.minhas();
      if (eq) {
        const [painel, lista] = await Promise.all([equipes.painel(eq.id), convites.daEquipe(eq.id)]);
        setVisao({ tipo: "equipe", painel, convites: lista });
        return;
      }
      const [recebidos, comps] = await Promise.all([convites.meus(), comprovantes.meus()]);
      setVisao({ tipo: "sem-equipe", hackathonId: comps[0]?.hackathon_id ?? null, recebidos });
    } catch (e) {
      setErro(msg(e));
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  // Executa uma ação, mostra o erro da API e recarrega o estado
  const acao = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErro(null);
    try {
      await fn();
      await carregar();
    } catch (e) {
      setErro(msg(e));
    } finally {
      setBusy(false);
    }
  };

  const criarEquipe = (hackathonId: string) =>
    acao(async () => {
      const eq = await equipes.criar(hackathonId, novaEquipe.nome.trim());
      if (novaEquipe.descricao.trim()) {
        // A descrição vira o rascunho da proposta; falha aqui não desfaz a equipe
        await propostas
          .criarRascunho(eq.id, { titulo: novaEquipe.nome.trim(), descricao: novaEquipe.descricao.trim() })
          .catch(() => {});
      }
    });

  const reenviarComprovante = () =>
    acao(async () => {
      if (!arquivo) throw new Error("Selecione o arquivo do comprovante.");
      await comprovantes.reenviar(await enviarArquivoComprovante(arquivo));
      setArquivo(null);
    });

  const concluir = (equipeId: string) =>
    acao(async () => {
      const r = await equipes.concluirInscricao(equipeId);
      router.push(`/sucesso?protocolo=${encodeURIComponent(r.protocolo.numero)}`);
    });

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 font-sans p-6 md:p-10 selection:bg-emerald-500/30">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold">
            &larr; Voltar ao início
          </Link>
          <button
            className={btnGhost}
            onClick={() => {
              auth.logout();
              router.push("/login");
            }}
          >
            Sair {user?.nome ? `(${user.nome.split(" ")[0]})` : ""}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-white">Inscrição da Equipe</h1>

        {erro && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">⚠️ {erro}</div>
        )}

        {visao.tipo === "carregando" && !erro && (
          <p className="text-emerald-400 text-sm font-mono animate-pulse">Carregando...</p>
        )}

        {/* ───── Conta pendente ───── */}
        {visao.tipo === "pendente" && (
          <div className={card}>
            <h2 className="text-white font-bold mb-2">Aguardando validação do comprovante</h2>
            <p className="text-xs text-gray-400 mb-4">
              Sua conta será liberada quando o Comitê aprovar o comprovante de vínculo. Enquanto isso, as demais telas
              ficam bloqueadas.
            </p>
            <ul className="space-y-2 mb-4">
              {visao.comps.map((c) => (
                <li key={c.id} className="text-xs bg-[#0A1110] border border-gray-800 rounded-lg p-3">
                  <span className="font-bold text-white">{c.status}</span>
                  {c.motivo_recusa && <span className="text-red-400"> — {c.motivo_recusa}</span>}
                </li>
              ))}
            </ul>
            {visao.comps[0]?.status === "RECUSADO" && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:cursor-pointer"
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                />
                <button className={btn} disabled={busy || !arquivo} onClick={reenviarComprovante}>
                  {busy ? "Enviando..." : "Reenviar comprovante"}
                </button>
              </div>
            )}
            <button className={`${btnGhost} mt-4`} onClick={carregar}>
              Atualizar situação
            </button>
          </div>
        )}

        {/* ───── Sem equipe: aceitar convite ou criar a própria ───── */}
        {visao.tipo === "sem-equipe" && (
          <>
            {visao.recebidos.length > 0 && (
              <div className={card}>
                <h2 className="text-white font-bold mb-3">Convites recebidos</h2>
                <div className="space-y-4">
                  {visao.recebidos.map((c) => (
                    <div key={c.id} className="bg-[#0A1110] border border-gray-800 rounded-lg p-4">
                      <p className="text-sm text-white font-semibold">{c.equipe_nome || "Equipe sem nome"}</p>
                      {aceitando === c.id ? (
                        <div className="mt-3">
                          <TermosBox
                            hackathonId={c.hackathon_id}
                            rotulo="Aceitar convite e entrar na equipe"
                            onConfirmar={async (ids) => {
                              await convites.aceitar(c.id, ids);
                              await carregar();
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button className={btn} onClick={() => setAceitando(c.id)}>
                            Aceitar
                          </button>
                          <button className={btnGhost} disabled={busy} onClick={() => acao(async () => void (await convites.recusar(c.id)))}>
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={card}>
              <h2 className="text-white font-bold mb-1">Criar nova equipe</h2>
              <p className="text-xs text-gray-400 mb-4">Quem cria a equipe se torna o líder técnico.</p>
              {visao.hackathonId ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    criarEquipe(visao.hackathonId!);
                  }}
                >
                  <div>
                    <label className={lbl}>Nome da Equipe *</label>
                    <input
                      required
                      maxLength={255}
                      className={inp}
                      value={novaEquipe.nome}
                      onChange={(e) => setNovaEquipe({ ...novaEquipe, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Descrição do Projeto</label>
                    <textarea
                      rows={3}
                      className={`${inp} resize-none`}
                      value={novaEquipe.descricao}
                      onChange={(e) => setNovaEquipe({ ...novaEquipe, descricao: e.target.value })}
                    />
                  </div>
                  <button type="submit" disabled={busy} className={`${btn} w-full`}>
                    {busy ? "Criando..." : "Criar Equipe →"}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-amber-400">
                  Nenhum hackathon com inscrições abertas está vinculado à sua conta. Fale com a organização.
                </p>
              )}
            </div>
          </>
        )}

        {/* ───── Painel da equipe ───── */}
        {visao.tipo === "equipe" && (() => {
          const { painel, convites: lista } = visao;
          const eu = painel.integrantes.find((i) => i.usuario_id === user?.id);
          const emFormacao = painel.situacao === "EM_FORMACAO";
          return (
            <>
              <div className={card}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{painel.nome || "Equipe sem nome"}</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {painel.total_integrantes} integrante(s) — mínimo {painel.minimo_integrantes}, máximo{" "}
                      {painel.maximo_integrantes}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {painel.situacao.replace(/_/g, " ")}
                  </span>
                </div>
                {painel.protocolo && (
                  <p className="mt-4 text-xs text-gray-400">
                    Protocolo: <span className="font-mono text-white">{painel.protocolo.numero}</span>
                  </p>
                )}
              </div>

              <div className={card}>
                <h3 className="text-white font-bold mb-3">Integrantes</h3>
                <ul className="space-y-2">
                  {painel.integrantes.map((i) => (
                    <li key={i.email} className="bg-[#0A1110] border border-gray-800 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold">{i.nome || i.email}</p>
                        <p className="text-gray-500">{i.funcao || (i.integrante ? "Sem função" : "")}</p>
                      </div>
                      <div className="flex gap-2 text-[10px] font-bold">
                        <span className="px-2 py-1 rounded bg-white/5">
                          {i.integrante ? "Integrante" : `Convite ${i.convite ?? ""}`}
                        </span>
                        <span className="px-2 py-1 rounded bg-white/5">Termos {i.termos_aceitos ? "✓" : "✗"}</span>
                        <span className="px-2 py-1 rounded bg-white/5">Vínculo: {i.comprovante ?? "—"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {painel.pendencias.length > 0 && (
                <div className={card}>
                  <h3 className="text-white font-bold mb-3">O que ainda falta</h3>
                  <ul className="space-y-2 text-xs">
                    {painel.pendencias.map((p, idx) => (
                      <li key={idx} className="text-amber-300">
                        • {p.mensagem}
                        {!p.bloqueia_conclusao && <span className="text-gray-500"> (impede só a homologação)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {emFormacao && eu && !eu.termos_aceitos && (
                <div className={card}>
                  <h3 className="text-white font-bold mb-3">Aceite do regulamento e do termo de consentimento</h3>
                  <TermosBox
                    hackathonId={painel.hackathon_id}
                    rotulo="Aceitar e continuar"
                    onConfirmar={async (ids) => {
                      await termos.aceitar(painel.hackathon_id, ids);
                      await carregar();
                    }}
                  />
                </div>
              )}

              {emFormacao && painel.voce_e_lider && painel.inscricoes_abertas && (
                <div className={card}>
                  <h3 className="text-white font-bold mb-3">Convidar integrante</h3>
                  <form
                    className="grid md:grid-cols-[1fr_1fr_auto] gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      acao(async () => {
                        await convites.enviar(painel.equipe_id, convite.nome.trim(), convite.email.trim());
                        setConvite({ nome: "", email: "" });
                      });
                    }}
                  >
                    <input required placeholder="Nome" className={inp} value={convite.nome} onChange={(e) => setConvite({ ...convite, nome: e.target.value })} />
                    <input required type="email" placeholder="E-mail (da conta dele)" className={inp} value={convite.email} onChange={(e) => setConvite({ ...convite, email: e.target.value })} />
                    <button type="submit" disabled={busy} className={btn}>Convidar</button>
                  </form>
                  <p className="text-[11px] text-gray-500 mt-2">
                    O convidado precisa ter conta ativa com esse e-mail. O envio por e-mail ainda não existe: avise-o para entrar no sistema.
                  </p>
                  {lista.some((c) => c.status === "PENDENTE") && (
                    <ul className="mt-4 space-y-2">
                      {lista.filter((c) => c.status === "PENDENTE").map((c) => (
                        <li key={c.id} className="flex items-center justify-between bg-[#0A1110] border border-gray-800 rounded-lg p-3 text-xs">
                          <span>{c.nome} — {c.email}</span>
                          <button className={btnGhost} disabled={busy} onClick={() => acao(async () => void (await convites.cancelar(c.id)))}>
                            Cancelar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {painel.pode_concluir ? (
                <button className={`${btn} w-full`} disabled={busy} onClick={() => concluir(painel.equipe_id)}>
                  {busy ? "Concluindo..." : "Concluir inscrição da equipe →"}
                </button>
              ) : emFormacao && painel.voce_e_lider ? (
                <p className="text-xs text-gray-500 text-center">
                  O botão de concluir aparece quando não houver pendências bloqueantes.
                </p>
              ) : null}

              {painel.protocolo && (
                <Link href={`/sucesso?protocolo=${encodeURIComponent(painel.protocolo.numero)}`} className={`${btnGhost} block text-center`}>
                  Ver comprovante da inscrição
                </Link>
              )}
            </>
          );
        })()}
      </div>
    </main>
  );
}
