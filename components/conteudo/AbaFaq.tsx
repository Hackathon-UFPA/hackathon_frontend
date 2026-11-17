"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Eye, EyeOff, MessageCircleQuestion, Pencil, Plus } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { ApiError } from "@/lib/api";
import { faqAdmin, type FaqItem } from "@/lib/api-conteudo";
import {
  BotaoExcluir,
  CampoPublicado,
  Carregando,
  EstadoVazio,
  SeloPublicado,
  btnIcone,
  btnPrimario,
  btnSecundario,
  cartao,
  erroCampo,
  inp,
  lbl,
} from "./ui";

const VAZIO = { pergunta: "", resposta: "", publicado: true };

export default function AbaFaq({ hackathonId }: { hackathonId: string }) {
  const [lista, setLista] = useState<FaqItem[] | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista(await faqAdmin.listar(hackathonId));
    } catch (e) {
      setErro(e);
      setLista((l) => l ?? []);
    }
  }, [hackathonId]);

  // O pai usa key={hackathonId}: trocar de hackathon remonta a aba com estado limpo.
  useEffect(() => {
    faqAdmin
      .listar(hackathonId)
      .then(setLista)
      .catch((e: unknown) => {
        setErro(e);
        setLista([]);
      });
  }, [hackathonId]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setSalvando(true);
    const dados = { pergunta: form.pergunta.trim(), resposta: form.resposta.trim(), publicado: form.publicado };
    try {
      if (editando) {
        await faqAdmin.editar(hackathonId, editando, dados);
        setOk("Pergunta atualizada.");
      } else {
        await faqAdmin.criar(hackathonId, dados);
        setOk("Pergunta cadastrada. Ela entra no fim da lista.");
      }
      setForm(VAZIO);
      setEditando(null);
      await carregar();
    } catch (err) {
      setErro(err);
    } finally {
      setSalvando(false);
    }
  };

  const editar = (f: FaqItem) => {
    setEditando(f.id);
    setOk(null);
    setForm({ pergunta: f.pergunta, resposta: f.resposta, publicado: f.publicado });
  };

  const alternarPublicado = async (f: FaqItem) => {
    setErro(null);
    try {
      await faqAdmin.editar(hackathonId, f.id, { publicado: !f.publicado });
      await carregar();
    } catch (err) {
      setErro(err);
    }
  };

  const mover = async (indice: number, delta: -1 | 1) => {
    if (!lista) return;
    const nova = [...lista];
    const [item] = nova.splice(indice, 1);
    nova.splice(indice + delta, 0, item);
    setLista(nova);
    setOcupado(true);
    setErro(null);
    try {
      setLista(await faqAdmin.reordenar(hackathonId, nova.map((f) => f.id)));
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 409
          ? "Alguém alterou as perguntas enquanto você reordenava. A lista foi recarregada; tente de novo."
          : err
      );
      await carregar();
    } finally {
      setOcupado(false);
    }
  };

  const excluir = async (f: FaqItem) => {
    setErro(null);
    try {
      await faqAdmin.excluir(hackathonId, f.id);
      if (editando === f.id) {
        setEditando(null);
        setForm(VAZIO);
      }
      setOk("Pergunta excluída.");
      await carregar();
    } catch (err) {
      setErro(err);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-label="Perguntas frequentes" className="min-w-0 space-y-3">
        {!!erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} onRetry={carregar} />}
        {ok && (
          <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {ok}
          </p>
        )}

        {lista === null ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <EstadoVazio
            icone={MessageCircleQuestion}
            titulo="Nenhuma pergunta ainda"
            texto="Responda as dúvidas mais comuns (quem pode participar, como montar a equipe, prazos). As publicadas aparecem na página pública, na ordem que você definir."
          />
        ) : (
          <ol className="space-y-2">
            {lista.map((f, i) => (
              <li key={f.id} className={`${cartao} flex gap-3 p-4 ${editando === f.id ? "ring-2 ring-emerald-400" : ""}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{f.pergunta}</span>
                    <SeloPublicado publicado={f.publicado} />
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-gray-600">{f.resposta}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-start">
                  <button type="button" className={btnIcone} disabled={i === 0 || ocupado} onClick={() => mover(i, -1)} aria-label="Subir pergunta" title="Subir">
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" className={btnIcone} disabled={i === lista.length - 1 || ocupado} onClick={() => mover(i, 1)} aria-label="Descer pergunta" title="Descer">
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" className={btnIcone} onClick={() => alternarPublicado(f)} aria-label={f.publicado ? "Ocultar pergunta" : "Publicar pergunta"} title={f.publicado ? "Ocultar da página pública" : "Publicar"}>
                    {f.publicado ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                  <button type="button" className={btnIcone} onClick={() => editar(f)} aria-label="Editar pergunta" title="Editar">
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <BotaoExcluir rotulo="pergunta" onConfirmar={() => excluir(f)} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <form onSubmit={salvar} className={`${cartao} space-y-4 self-start p-5 lg:sticky lg:top-24`}>
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          {editando ? <Pencil className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <Plus className="h-4 w-4 text-emerald-700" aria-hidden="true" />}
          {editando ? "Editar pergunta" : "Nova pergunta"}
        </h2>
        <div>
          <label className={lbl} htmlFor="fq-perg">Pergunta</label>
          <input id="fq-perg" required maxLength={500} placeholder="Ex.: Quem pode participar?" className={inp} value={form.pergunta} onChange={(e) => setForm({ ...form, pergunta: e.target.value })} />
          {erroCampo(erro, "pergunta") && <p className="mt-1 text-xs text-red-700">{erroCampo(erro, "pergunta")}</p>}
        </div>
        <div>
          <label className={lbl} htmlFor="fq-resp">Resposta</label>
          <textarea id="fq-resp" required rows={6} maxLength={20000} className={inp} value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value })} />
          {erroCampo(erro, "resposta") && <p className="mt-1 text-xs text-red-700">{erroCampo(erro, "resposta")}</p>}
        </div>
        <CampoPublicado valor={form.publicado} onChange={(v) => setForm({ ...form, publicado: v })} />
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className={`${btnPrimario} flex-1`}>
            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar pergunta"}
          </button>
          {editando && (
            <button type="button" className={btnSecundario} onClick={() => { setEditando(null); setForm(VAZIO); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
