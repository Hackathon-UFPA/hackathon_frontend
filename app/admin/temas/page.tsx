"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ApiError,
  CATALOGO_ODS,
  hackathons as hackathonsApi,
  temas as temasApi,
  type HackathonResponse,
  type TemaItem,
} from "@/lib/api";
import { useSession } from "@/lib/useSession";

/**
 * Catálogo de temas da proposta (RF15): Comitê Científico, Organizador ou DEV.
 * Só os temas ATIVOS aparecem para o participante escolher em /proposta.
 */

type Form = { titulo: string; descricao: string; contexto: string; ods: number[]; ativo: boolean };

const FORM_VAZIO: Form = { titulo: "", descricao: "", contexto: "", ods: [], ativo: true };

const inp =
  "w-full bg-[#0A1110] border border-gray-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-[11px] uppercase text-gray-400 mb-1 font-semibold";
const btnGhost =
  "px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-gray-700 text-[11px] rounded-lg text-white font-bold cursor-pointer disabled:opacity-50";

const msgErro = (e: unknown) => {
  if (e instanceof ApiError && e.status === 403) {
    return "Somente Comitê Científico, Organizador ou DEV podem gerenciar temas.";
  }
  return e instanceof Error ? e.message : "Erro inesperado.";
};

function ConteudoTemas() {
  const { pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const searchParams = useSearchParams();

  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [hackathonId, setHackathonId] = useState("");
  const [lista, setLista] = useState<TemaItem[]>([]);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [acaoId, setAcaoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Edições: começa pela da URL, senão pela que está com inscrições abertas.
  useEffect(() => {
    if (!pronto) return;
    hackathonsApi
      .listar()
      .then((lst) => {
        setEdicoes(lst);
        const daUrl = searchParams.get("hackathon_id");
        const alvo =
          lst.find((h) => h.id === daUrl) ?? lst.find((h) => h.status === "INSCRICOES") ?? lst[0];
        setHackathonId(alvo?.id ?? "");
        if (!alvo) setCarregando(false);
      })
      .catch((e) => {
        setErro(msgErro(e));
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  const carregarTemas = useCallback(async () => {
    if (!hackathonId) return;
    setCarregando(true);
    try {
      setLista(await temasApi.listar(hackathonId, true));
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setCarregando(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    carregarTemas();
  }, [carregarTemas]);

  const limparForm = () => {
    setForm(FORM_VAZIO);
    setEditandoId(null);
  };

  const trocarEdicao = (id: string) => {
    setHackathonId(id);
    limparForm();
    setMensagem(null);
    setErro(null);
  };

  const alternarOds = (n: number) =>
    setForm((f) => ({
      ...f,
      ods: f.ods.includes(n) ? f.ods.filter((x) => x !== n) : [...f.ods, n].sort((a, b) => a - b),
    }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ods.length === 0) {
      setErro("Escolha pelo menos um ODS.");
      return;
    }
    setSalvando(true);
    setMensagem(null);
    setErro(null);
    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      contexto: form.contexto.trim() || null,
      ods: form.ods,
      ativo: form.ativo,
    };
    try {
      if (editandoId) {
        await temasApi.editar(editandoId, dados);
        setMensagem("Tema atualizado.");
      } else {
        await temasApi.criar(hackathonId, dados);
        setMensagem("Tema criado.");
      }
      limparForm();
      await carregarTemas();
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setSalvando(false);
    }
  };

  const editar = (t: TemaItem) => {
    setEditandoId(t.id);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      contexto: t.contexto ?? "",
      ods: [...t.ods],
      ativo: t.ativo,
    });
    setMensagem(null);
    setErro(null);
  };

  const acao = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setAcaoId(id);
    setMensagem(null);
    setErro(null);
    try {
      await fn();
      setMensagem(ok);
      if (editandoId === id) limparForm();
      await carregarTemas();
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 409
          ? `${err.message} Se o tema já tem propostas, desative-o em vez de excluir.`
          : msgErro(err)
      );
    } finally {
      setAcaoId(null);
    }
  };

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-3xl bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-lg h-fit space-y-6">
        <Link href="/admin" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Temas da Proposta</h1>
          <p className="text-xs text-gray-400">
            Só os temas <strong className="text-emerald-400">ativos</strong> aparecem para o líder escolher em
            /proposta. Cada tema precisa de título, descrição e pelo menos um ODS.
          </p>
        </div>

        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
            {mensagem}
          </div>
        )}
        {erro && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">{erro}</div>
        )}

        <div>
          <label className={lbl} htmlFor="sel-edicao-temas">
            Edição
          </label>
          <select
            id="sel-edicao-temas"
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
        </div>

        {/* Lista */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Temas cadastrados ({lista.length})</h2>
          {carregando ? (
            <p className="text-emerald-400 text-xs font-mono">Carregando temas...</p>
          ) : lista.length === 0 ? (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              Nenhum tema nesta edição. Sem tema ativo, o líder não consegue enviar a proposta.
            </p>
          ) : (
            lista.map((t) => (
              <div
                key={t.id}
                className={`bg-[#0A1110] border rounded-xl p-4 space-y-2 ${
                  t.ativo ? "border-emerald-900/60" : "border-gray-800 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">{t.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.descricao}</p>
                    {t.contexto && <p className="text-[11px] text-gray-500 mt-1">{t.contexto}</p>}
                    <p className="text-[11px] text-emerald-400 mt-1">ODS: {t.ods.join(", ")}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                      t.ativo
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-gray-700 text-gray-400"
                    }`}
                  >
                    {t.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnGhost} disabled={acaoId === t.id} onClick={() => editar(t)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={acaoId === t.id}
                    onClick={() =>
                      acao(
                        t.id,
                        () => temasApi.editar(t.id, { ativo: !t.ativo }),
                        t.ativo ? "Tema desativado." : "Tema ativado."
                      )
                    }
                  >
                    {t.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    className={`${btnGhost} hover:border-red-500/40 hover:text-red-300`}
                    disabled={acaoId === t.id}
                    onClick={() => {
                      if (window.confirm(`Excluir o tema "${t.titulo}"?`)) {
                        acao(t.id, () => temasApi.excluir(t.id), "Tema excluído.");
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Formulário */}
        {hackathonId && (
          <form onSubmit={salvar} className="space-y-4 border-t border-gray-800 pt-6">
            <h2 className="text-sm font-bold text-white">{editandoId ? "Editar tema" : "Novo tema"}</h2>

            <div>
              <label className={lbl}>Título *</label>
              <input
                required
                maxLength={255}
                className={inp}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div>
              <label className={lbl}>Descrição *</label>
              <textarea
                required
                rows={3}
                className={`${inp} resize-none`}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div>
              <label className={lbl}>Contexto (opcional)</label>
              <textarea
                rows={2}
                className={`${inp} resize-none`}
                value={form.contexto}
                onChange={(e) => setForm({ ...form, contexto: e.target.value })}
              />
            </div>

            <div>
              <label className={lbl}>ODS relacionados * ({form.ods.length} selecionado(s))</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {CATALOGO_ODS.map((o) => (
                  <label
                    key={o.numero}
                    className={`flex items-center gap-2 text-[11px] rounded-lg border px-2.5 py-1.5 cursor-pointer ${
                      form.ods.includes(o.numero)
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-gray-800 text-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.ods.includes(o.numero)}
                      onChange={() => alternarOds(o.numero)}
                    />
                    {o.numero}. {o.titulo}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Tema ativo (aparece para escolha na proposta)
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer"
              >
                {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar tema"}
              </button>
              {editandoId && (
                <button type="button" className={btnGhost} onClick={limparForm}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AdminTemasPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoTemas />
    </Suspense>
  );
}
