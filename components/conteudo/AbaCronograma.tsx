"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Eye, EyeOff, Lock, Pencil, Plus } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { periodo } from "@/components/plataforma/hackathon-util";
import {
  cronogramaAdmin,
  inputLocalParaIso,
  isoParaInputLocal,
  ROTULO_SITUACAO_FASE,
  type FaseCronograma,
  type SituacaoFase,
} from "@/lib/api-conteudo";
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

const VAZIO = { nome: "", descricao: "", inicio: "", fim: "", publicado: true };

const COR_SITUACAO: Record<SituacaoFase, string> = {
  NAO_INICIADA: "bg-gray-100 text-gray-700 ring-gray-200",
  EM_ANDAMENTO: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  ENCERRADA: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function AbaCronograma({ hackathonId }: { hackathonId: string }) {
  const [lista, setLista] = useState<FaseCronograma[] | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista(await cronogramaAdmin.listar(hackathonId));
    } catch (e) {
      setErro(e);
      setLista((l) => l ?? []);
    }
  }, [hackathonId]);

  // O pai usa key={hackathonId}: trocar de hackathon remonta a aba com estado limpo.
  useEffect(() => {
    cronogramaAdmin
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
    if (form.fim < form.inicio) {
      setErro("O fim não pode ser antes do início.");
      return;
    }
    setSalvando(true);
    const dados = {
      nome: form.nome.trim(),
      inicio: inputLocalParaIso(form.inicio),
      fim: inputLocalParaIso(form.fim),
      publicado: form.publicado,
    };
    const descricao = form.descricao.trim();
    try {
      if (editando) {
        await cronogramaAdmin.editar(hackathonId, editando, { ...dados, descricao: descricao || null });
        setOk("Fase atualizada.");
      } else {
        await cronogramaAdmin.criar(hackathonId, { ...dados, ...(descricao ? { descricao } : {}) });
        setOk("Fase cadastrada.");
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

  const editar = (f: FaseCronograma) => {
    if (!f.id) return;
    setEditando(f.id);
    setOk(null);
    setForm({
      nome: f.nome,
      descricao: f.descricao ?? "",
      inicio: isoParaInputLocal(f.inicio),
      fim: isoParaInputLocal(f.fim),
      publicado: f.publicado,
    });
  };

  const alternarPublicado = async (f: FaseCronograma) => {
    if (!f.id) return;
    setErro(null);
    try {
      await cronogramaAdmin.editar(hackathonId, f.id, { publicado: !f.publicado });
      await carregar();
    } catch (err) {
      setErro(err);
    }
  };

  const excluir = async (f: FaseCronograma) => {
    if (!f.id) return;
    setErro(null);
    try {
      await cronogramaAdmin.excluir(hackathonId, f.id);
      if (editando === f.id) {
        setEditando(null);
        setForm(VAZIO);
      }
      setOk(`"${f.nome}" foi excluída.`);
      await carregar();
    } catch (err) {
      setErro(err);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-label="Linha do tempo" className="min-w-0 space-y-3">
        {!!erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} onRetry={carregar} />}
        {ok && (
          <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {ok}
          </p>
        )}

        <p className="text-xs text-gray-500">
          As datas do edital (inscrições, homologação, propostas e evento) vêm do cadastro do hackathon e entram sozinhas.
          Para mudá-las,{" "}
          <Link href={`/admin/hackathon?id=${hackathonId}`} className="font-semibold text-emerald-700 hover:underline">
            edite o hackathon
          </Link>
          . Aqui você acrescenta fases extras, como treinamentos e bancas.
        </p>

        {lista === null ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <EstadoVazio
            icone={CalendarClock}
            titulo="Cronograma vazio"
            texto="Este hackathon ainda não tem datas no edital nem fases extras. Cadastre as datas no hackathon ou adicione uma fase ao lado."
          />
        ) : (
          <ol className="space-y-2">
            {lista.map((f, i) => {
              const edital = f.origem === "EDITAL" || !f.id;
              const situacao = (f.situacao in COR_SITUACAO ? f.situacao : "NAO_INICIADA") as SituacaoFase;
              return (
                <li
                  key={f.id ?? `edital-${f.nome}-${i}`}
                  className={`${cartao} flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap ${f.atual ? "border-emerald-400 ring-2 ring-emerald-100" : ""} ${editando && editando === f.id ? "ring-2 ring-emerald-400" : ""}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${edital ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-700"}`}>
                    {edital ? <Lock className="h-4 w-4" aria-hidden="true" /> : <CalendarClock className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{f.nome}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${COR_SITUACAO[situacao]}`}>
                        {f.atual ? "Agora" : ROTULO_SITUACAO_FASE[situacao]}
                      </span>
                      {edital ? (
                        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200">Data do edital</span>
                      ) : (
                        <SeloPublicado publicado={f.publicado} />
                      )}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-emerald-800">{periodo(f.inicio, f.fim)}</p>
                    {f.descricao && <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{f.descricao}</p>}
                  </div>
                  {!edital && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" className={btnIcone} onClick={() => alternarPublicado(f)} aria-label={f.publicado ? `Ocultar ${f.nome}` : `Publicar ${f.nome}`} title={f.publicado ? "Ocultar da página pública" : "Publicar"}>
                        {f.publicado ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      <button type="button" className={btnIcone} onClick={() => editar(f)} aria-label={`Editar ${f.nome}`} title="Editar">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <BotaoExcluir rotulo={f.nome} onConfirmar={() => excluir(f)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <form onSubmit={salvar} className={`${cartao} space-y-4 self-start p-5 lg:sticky lg:top-24`}>
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          {editando ? <Pencil className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <Plus className="h-4 w-4 text-emerald-700" aria-hidden="true" />}
          {editando ? "Editar fase" : "Nova fase"}
        </h2>
        <div>
          <label className={lbl} htmlFor="fa-nome">Nome</label>
          <input id="fa-nome" required maxLength={255} placeholder="Ex.: Treinamento das equipes" className={inp} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div>
          <label className={lbl} htmlFor="fa-desc">Descrição (opcional)</label>
          <textarea id="fa-desc" rows={3} maxLength={20000} className={inp} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <label className={lbl} htmlFor="fa-ini">Início</label>
            <input id="fa-ini" type="datetime-local" required className={inp} value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
          </div>
          <div>
            <label className={lbl} htmlFor="fa-fim">Fim</label>
            <input id="fa-fim" type="datetime-local" required min={form.inicio || undefined} className={inp} value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-gray-500">Horário do seu navegador.</p>
        {(erroCampo(erro, "inicio") || erroCampo(erro, "fim")) && (
          <p className="text-xs text-red-700">{erroCampo(erro, "inicio") ?? erroCampo(erro, "fim")}</p>
        )}
        <CampoPublicado valor={form.publicado} onChange={(v) => setForm({ ...form, publicado: v })} />
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className={`${btnPrimario} flex-1`}>
            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar fase"}
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
