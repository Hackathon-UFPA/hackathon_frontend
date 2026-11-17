"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  ApiError,
  formatarDataBrasilia,
  hackathons as hackathonsApi,
  type HackathonResponse,
} from "@/lib/api";
import {
  CRITERIOS_MINIMOS_RN10,
  ehNaoEncontrado,
  formatarDecimal,
  rubricaApi,
  somaPesos,
  type CriterioRubricaIn,
  type RubricaRascunhoResp,
} from "@/lib/api-avaliacao";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Montagem e publicação da rubrica científica (RF16, RF17, RN09, RN10).
 * Somente Organizador ou DEV. O rascunho pode ficar incompleto; a publicação exige
 * soma dos pesos = 100% e os critérios mínimos da RN10, e só uma vez (depois é imutável).
 */

type Linha = {
  chave: string;
  nome: string;
  descricao: string;
  peso: string;
  escala_min: string;
  escala_max: string;
};

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm disabled:opacity-60";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";
const btnGhost =
  "inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-[11px] rounded-lg text-gray-900 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

let seq = 0;
const novaChave = () => `l${++seq}`;

const linhaVazia = (nome = ""): Linha => ({
  chave: novaChave(),
  nome,
  descricao: "",
  peso: "",
  escala_min: "0",
  escala_max: "10",
});

/** Mesma comparação do backend: sem diferenciar maiúsculas, acentos e espaços nas pontas. */
const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

function paraLinhas(r: RubricaRascunhoResp | null): Linha[] {
  if (!r) return [];
  return [...r.criterios]
    .sort((a, b) => a.ordem - b.ordem)
    .map((c) => ({
      chave: novaChave(),
      nome: c.nome,
      descricao: c.descricao,
      peso: String(Number(c.peso)),
      escala_min: String(c.escala_min),
      escala_max: String(c.escala_max),
    }));
}

function paraPayload(linhas: Linha[]): CriterioRubricaIn[] {
  return linhas.map((l) => ({
    nome: l.nome.trim(),
    descricao: l.descricao.trim(),
    peso: l.peso.trim().replace(",", "."),
    escala_min: Number(l.escala_min),
    escala_max: Number(l.escala_max),
  }));
}

/** Problemas que o próprio formulário já detecta antes de chamar a API. */
function problemasLocais(linhas: Linha[]): string[] {
  const p: string[] = [];
  const nomes = new Set<string>();
  linhas.forEach((l, i) => {
    const n = `Critério ${i + 1}`;
    if (!l.nome.trim()) p.push(`${n}: informe o nome.`);
    if (!l.descricao.trim()) p.push(`${n}: informe a descrição.`);
    const peso = Number(l.peso.replace(",", "."));
    if (!l.peso.trim() || !Number.isFinite(peso) || peso <= 0 || peso > 100) {
      p.push(`${n}: o peso deve ser maior que 0 e no máximo 100.`);
    } else if (!/^\d+([.,]\d{1,2})?$/.test(l.peso.trim())) {
      p.push(`${n}: use no máximo 2 casas decimais no peso.`);
    }
    const min = Number(l.escala_min);
    const max = Number(l.escala_max);
    if (!Number.isInteger(min) || !Number.isInteger(max) || l.escala_min === "" || l.escala_max === "") {
      p.push(`${n}: a escala deve ter valores inteiros.`);
    } else if (min < 0 || max > 1000 || min >= max) {
      p.push(`${n}: a escala mínima deve ser menor que a máxima (entre 0 e 1000).`);
    }
    const chave = normalizar(l.nome);
    if (chave) {
      if (nomes.has(chave)) p.push(`${n}: já existe outro critério com o nome "${l.nome.trim()}".`);
      nomes.add(chave);
    }
  });
  return p;
}

/** Rascunho da rubrica; null quando a edição ainda não tem rubrica (404). */
const buscarRubrica = (hackathonId: string) =>
  rubricaApi.rascunho(hackathonId).catch((e) => {
    if (ehNaoEncontrado(e)) return null;
    throw e;
  });

function ConteudoRubrica() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const searchParams = useSearchParams();

  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [hackathonId, setHackathonId] = useState("");
  const [rubrica, setRubrica] = useState<RubricaRascunhoResp | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [alterado, setAlterado] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .daMinhaOrganizacao()
      .then((lst) => {
        setEdicoes(lst);
        const daUrl = searchParams.get("hackathon_id");
        const alvo =
          lst.find((h) => h.id === daUrl) ??
          lst.find((h) => h.status === "RASCUNHO") ??
          lst.find((h) => h.status === "INSCRICOES") ??
          lst[0];
        setHackathonId(alvo?.id ?? "");
        if (!alvo) setCarregando(false);
      })
      .catch((e) => {
        setErro(e);
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  const aplicar = (r: RubricaRascunhoResp | null) => {
    setRubrica(r);
    setLinhas(paraLinhas(r));
    setAlterado(false);
  };

  // Quem troca de edição liga o "carregando"; o efeito só altera estado nos callbacks.
  useEffect(() => {
    if (!hackathonId) return;
    buscarRubrica(hackathonId)
      .then(aplicar)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [hackathonId]);

  const carregar = async () => {
    try {
      aplicar(await buscarRubrica(hackathonId));
    } catch (e) {
      setErro(e);
    }
  };

  const [agora] = useState(() => Date.now());

  const edicao = edicoes.find((h) => h.id === hackathonId);
  const publicada = rubrica?.publicada ?? false;
  const soma = useMemo(() => somaPesos(linhas.map((l) => l.peso)), [linhas]);
  const locais = useMemo(() => problemasLocais(linhas), [linhas]);
  const faltandoRn10 = CRITERIOS_MINIMOS_RN10.filter(
    (c) => !linhas.some((l) => normalizar(l.nome) === normalizar(c))
  );
  const inscricoesIniciadas =
    !!edicao?.inscricoes_inicio && new Date(edicao.inscricoes_inicio).getTime() <= agora;

  const mudar = (fn: (ls: Linha[]) => Linha[]) => {
    setLinhas(fn);
    setAlterado(true);
    setMensagem(null);
  };
  const editarLinha = (chave: string, campo: keyof Omit<Linha, "chave">, valor: string) =>
    mudar((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));
  const mover = (i: number, d: -1 | 1) =>
    mudar((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const c = [...ls];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const trocarEdicao = (id: string) => {
    if (alterado && !window.confirm("Há alterações não salvas. Trocar de edição mesmo assim?")) return;
    if (id !== hackathonId) setCarregando(true);
    setHackathonId(id);
    setMensagem(null);
    setErro(null);
  };

  const salvar = async () => {
    if (locais.length) {
      setErro("Corrija os problemas indicados na lista antes de salvar.");
      return;
    }
    setSalvando(true);
    setMensagem(null);
    setErro(null);
    try {
      const r = await rubricaApi.salvar(hackathonId, paraPayload(linhas));
      setRubrica(r);
      setLinhas(paraLinhas(r));
      setAlterado(false);
      setMensagem("Rubrica salva.");
    } catch (e) {
      setErro(e);
    } finally {
      setSalvando(false);
    }
  };

  const publicar = async () => {
    if (
      !window.confirm(
        "Publicar a rubrica? Depois de publicada ela fica visível para todos e NÃO pode mais ser alterada."
      )
    )
      return;
    setPublicando(true);
    setMensagem(null);
    setErro(null);
    try {
      await rubricaApi.publicar(hackathonId);
      setMensagem("Rubrica publicada. A partir de agora ela não pode ser alterada.");
      await carregar();
    } catch (e) {
      setErro(e);
      // 422/409 podem refletir pendências novas: recarrega o estado do servidor.
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) await carregar();
    } finally {
      setPublicando(false);
    }
  };

  if (!pronto) return null;

  const pendenciasServidor = rubrica?.pendencias ?? [];
  const podePublicar =
    !!rubrica && !publicada && !alterado && pendenciasServidor.length === 0 && linhas.length > 0;

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <Link href="/admin" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Rubrica de Avaliação</h1>
          <p className="text-xs text-gray-600">
            Monte os critérios da avaliação científica das propostas. O rascunho pode ficar incompleto; para
            publicar, a soma dos pesos precisa dar <strong className="text-emerald-700">100%</strong> e os
            critérios mínimos ({CRITERIOS_MINIMOS_RN10.join(", ")}) precisam existir. A publicação é única e
            deve ocorrer antes do início das inscrições.
          </p>
        </div>

        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs">
            {mensagem}
          </div>
        )}
        {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}

        <div>
          <label className={lbl} htmlFor="sel-edicao-rubrica">
            Edição
          </label>
          <select
            id="sel-edicao-rubrica"
            className={inp}
            value={hackathonId}
            onChange={(e) => trocarEdicao(e.target.value)}
          >
            {edicoes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome || "Sem nome"} ({h.status ?? "—"})
              </option>
            ))}
          </select>
          {edicao && (
            <p className="text-[11px] text-gray-500 mt-1">
              Início das inscrições:{" "}
              {edicao.inscricoes_inicio ? formatarDataBrasilia(edicao.inscricoes_inicio) : "não definido"}
            </p>
          )}
        </div>

        {!hackathonId && !carregando ? (
          <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            Nenhuma edição cadastrada.
          </p>
        ) : carregando ? (
          <p className="text-emerald-700 text-xs font-mono">Carregando rubrica...</p>
        ) : (
          <>
            {/* Situação */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] uppercase text-gray-500 font-semibold">Situação</p>
                <p className={`text-sm font-bold mt-1 ${publicada ? "text-emerald-700" : "text-amber-700"}`}>
                  {publicada ? "Publicada" : rubrica ? "Rascunho" : "Não criada"}
                </p>
                {publicada && rubrica?.publicada_em && (
                  <p className="text-[11px] text-gray-500 mt-0.5">em {formatarDataBrasilia(rubrica.publicada_em)}</p>
                )}
                {!publicada && rubrica?.atualizado_em && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    salva em {formatarDataBrasilia(rubrica.atualizado_em)}
                  </p>
                )}
              </div>
              <div className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] uppercase text-gray-500 font-semibold">Soma dos pesos</p>
                <p
                  className={`text-sm font-bold mt-1 ${
                    soma === 100 ? "text-emerald-700" : soma > 100 ? "text-red-600" : "text-amber-700"
                  }`}
                >
                  {formatarDecimal(soma)}%
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-50 overflow-hidden">
                  <div
                    className={`h-full ${soma === 100 ? "bg-emerald-500" : soma > 100 ? "bg-red-500" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(soma, 100)}%` }}
                  />
                </div>
              </div>
              <div className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] uppercase text-gray-500 font-semibold">Critérios</p>
                <p className="text-sm font-bold mt-1 text-gray-900">{linhas.length}</p>
                {alterado && <p className="text-[11px] text-amber-700 mt-0.5">Alterações não salvas</p>}
              </div>
            </section>

            {/* Pendências */}
            {!publicada && (pendenciasServidor.length > 0 || locais.length > 0 || faltandoRn10.length > 0) && (
              <section className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <h2 className="text-xs font-bold text-amber-700 uppercase">Pendências para publicar</h2>
                <ul className="list-disc pl-5 space-y-1 text-xs text-amber-800">
                  {locais.map((p) => (
                    <li key={`l-${p}`}>{p}</li>
                  ))}
                  {alterado && soma !== 100 && linhas.length > 0 && (
                    <li>A soma dos pesos está em {formatarDecimal(soma)}%; precisa ser 100%.</li>
                  )}
                  {alterado &&
                    faltandoRn10.map((c) => <li key={`rn10-${c}`}>Falta o critério mínimo &quot;{c}&quot;.</li>)}
                  {!alterado && pendenciasServidor.map((p) => <li key={`s-${p}`}>{p}</li>)}
                  {!rubrica && !alterado && <li>A rubrica desta edição ainda não foi criada.</li>}
                </ul>
                {faltandoRn10.length > 0 && (
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => mudar((ls) => [...ls, ...faltandoRn10.map((n) => linhaVazia(n))])}
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar critérios mínimos que faltam
                  </button>
                )}
              </section>
            )}

            {publicada && (
              <p className="text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                Rubrica publicada: não pode mais ser alterada (RN09). Ela já aparece para as equipes e é usada
                pelos avaliadores.
              </p>
            )}
            {!publicada && inscricoesIniciadas && (
              <p className="text-xs text-red-700 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                As inscrições desta edição já começaram: a API recusa a publicação (409). Ajuste a data de início
                das inscrições em Gestão da Edição, se for o caso.
              </p>
            )}

            {/* Critérios */}
            <section className="space-y-3">
              {linhas.length === 0 && (
                <p className="text-xs text-gray-600 bg-[#F6F9F8] border border-gray-200 rounded-lg p-3">
                  Nenhum critério ainda. Adicione critérios abaixo.
                </p>
              )}
              {linhas.map((l, i) => (
                <div key={l.chave} className="bg-[#F6F9F8] border border-emerald-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">Critério {i + 1}</span>
                    {!publicada && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={i === 0}
                          onClick={() => mover(i, -1)}
                          aria-label={`Mover critério ${i + 1} para cima`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={i === linhas.length - 1}
                          onClick={() => mover(i, 1)}
                          aria-label={`Mover critério ${i + 1} para baixo`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className={`${btnGhost} hover:border-red-500/40 hover:text-red-700`}
                          onClick={() => mudar((ls) => ls.filter((x) => x.chave !== l.chave))}
                          aria-label={`Remover critério ${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem_6rem_6rem] gap-3">
                    <div>
                      <label className={lbl} htmlFor={`nome-${l.chave}`}>
                        Nome *
                      </label>
                      <input
                        id={`nome-${l.chave}`}
                        className={inp}
                        maxLength={255}
                        disabled={publicada}
                        value={l.nome}
                        onChange={(e) => editarLinha(l.chave, "nome", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={lbl} htmlFor={`peso-${l.chave}`}>
                        Peso (%) *
                      </label>
                      <input
                        id={`peso-${l.chave}`}
                        className={inp}
                        inputMode="decimal"
                        placeholder="ex.: 25"
                        disabled={publicada}
                        value={l.peso}
                        onChange={(e) => editarLinha(l.chave, "peso", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={lbl} htmlFor={`min-${l.chave}`}>
                        Nota mín.
                      </label>
                      <input
                        id={`min-${l.chave}`}
                        type="number"
                        min={0}
                        max={999}
                        step={1}
                        className={inp}
                        disabled={publicada}
                        value={l.escala_min}
                        onChange={(e) => editarLinha(l.chave, "escala_min", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={lbl} htmlFor={`max-${l.chave}`}>
                        Nota máx.
                      </label>
                      <input
                        id={`max-${l.chave}`}
                        type="number"
                        min={1}
                        max={1000}
                        step={1}
                        className={inp}
                        disabled={publicada}
                        value={l.escala_max}
                        onChange={(e) => editarLinha(l.chave, "escala_max", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lbl} htmlFor={`desc-${l.chave}`}>
                      Descrição *
                    </label>
                    <textarea
                      id={`desc-${l.chave}`}
                      rows={2}
                      className={`${inp} resize-none`}
                      disabled={publicada}
                      value={l.descricao}
                      onChange={(e) => editarLinha(l.chave, "descricao", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {!publicada && (
                <button
                  type="button"
                  className={btnGhost}
                  disabled={linhas.length >= 50}
                  onClick={() => mudar((ls) => [...ls, linhaVazia()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar critério
                </button>
              )}
            </section>

            {!publicada && (
              <div className="flex flex-col sm:flex-row gap-2 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={salvar}
                  disabled={salvando || publicando || !alterado}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm cursor-pointer"
                >
                  {salvando ? "Salvando..." : "Salvar rascunho"}
                </button>
                <button
                  type="button"
                  onClick={publicar}
                  disabled={!podePublicar || salvando || publicando}
                  title={alterado ? "Salve as alterações antes de publicar." : undefined}
                  className="flex-1 py-3 bg-gray-50 hover:bg-emerald-500/15 border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 font-bold rounded-lg text-sm cursor-pointer"
                >
                  {publicando ? "Publicando..." : "Publicar rubrica"}
                </button>
                {alterado && (
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setLinhas(paraLinhas(rubrica));
                      setAlterado(false);
                    }}
                  >
                    Descartar alterações
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminRubricaPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoRubrica />
    </Suspense>
  );
}
