"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Eye, EyeOff, HeartHandshake, Pencil, Plus } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { apoiadoresAdmin, type Apoiador } from "@/lib/api-conteudo";
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

const VAZIO = { nome: "", categoria: "", logo_url: "", site_url: "", publicado: true };
const CATEGORIAS_SUGERIDAS = ["Patrocinador", "Apoio", "Realização", "Parceiro institucional", "Mídia"];

export function LogoApoiador({ nome, logo }: { nome: string; logo: string | null }) {
  const [falhou, setFalhou] = useState(false);
  if (logo && !falhou) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo externo (link informado pela organização)
      <img src={logo} alt="" onError={() => setFalhou(true)} className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 bg-white object-contain p-1" />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
      {nome.trim().slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function AbaApoiadores({ hackathonId }: { hackathonId: string }) {
  const [lista, setLista] = useState<Apoiador[] | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista(await apoiadoresAdmin.listar(hackathonId));
    } catch (e) {
      setErro(e);
      setLista((l) => l ?? []);
    }
  }, [hackathonId]);

  // O pai usa key={hackathonId}: trocar de hackathon remonta a aba com estado limpo.
  useEffect(() => {
    apoiadoresAdmin
      .listar(hackathonId)
      .then(setLista)
      .catch((e: unknown) => {
        setErro(e);
        setLista([]);
      });
  }, [hackathonId]);

  const categorias = useMemo(
    () => [...new Set([...(lista ?? []).map((a) => a.categoria), ...CATEGORIAS_SUGERIDAS])],
    [lista]
  );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setSalvando(true);
    const dados = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim(),
      logo_url: form.logo_url.trim() || null,
      site_url: form.site_url.trim() || null,
      publicado: form.publicado,
    };
    try {
      if (editando) {
        await apoiadoresAdmin.editar(hackathonId, editando, dados);
        setOk("Apoiador atualizado.");
      } else {
        await apoiadoresAdmin.criar(hackathonId, dados);
        setOk("Apoiador cadastrado. Ele entra no fim da lista.");
      }
      setForm({ ...VAZIO, categoria: dados.categoria });
      setEditando(null);
      await carregar();
    } catch (err) {
      setErro(err);
    } finally {
      setSalvando(false);
    }
  };

  const editar = (a: Apoiador) => {
    setEditando(a.id);
    setOk(null);
    setForm({
      nome: a.nome,
      categoria: a.categoria,
      logo_url: a.logo_url ?? "",
      site_url: a.site_url ?? "",
      publicado: a.publicado,
    });
  };

  const alternarPublicado = async (a: Apoiador) => {
    setErro(null);
    try {
      await apoiadoresAdmin.editar(hackathonId, a.id, { publicado: !a.publicado });
      await carregar();
    } catch (err) {
      setErro(err);
    }
  };

  /** A API só grava o número de `ordem`; renumeramos quem mudou de posição. */
  const mover = async (indice: number, delta: -1 | 1) => {
    if (!lista) return;
    const nova = [...lista];
    const [item] = nova.splice(indice, 1);
    nova.splice(indice + delta, 0, item);
    setLista(nova);
    setOcupado(true);
    setErro(null);
    try {
      for (const [i, a] of nova.entries()) {
        if (a.ordem !== i) await apoiadoresAdmin.editar(hackathonId, a.id, { ordem: i });
      }
    } catch (err) {
      setErro(err);
    } finally {
      await carregar();
      setOcupado(false);
    }
  };

  const excluir = async (a: Apoiador) => {
    setErro(null);
    try {
      await apoiadoresAdmin.excluir(hackathonId, a.id);
      if (editando === a.id) {
        setEditando(null);
        setForm(VAZIO);
      }
      setOk(`"${a.nome}" foi excluído.`);
      await carregar();
    } catch (err) {
      setErro(err);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-label="Apoiadores cadastrados" className="min-w-0 space-y-3">
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
            icone={HeartHandshake}
            titulo="Nenhum apoiador cadastrado"
            texto="Cadastre patrocinadores, parceiros e apoiadores. Eles aparecem na página pública agrupados por categoria, com o logo levando ao site."
          />
        ) : (
          <>
            <p className="text-xs text-gray-500">
              A ordem abaixo é a da página pública. As categorias aparecem na posição do primeiro apoiador de cada uma.
            </p>
            <ul className="space-y-2">
              {lista.map((a, i) => (
                <li key={a.id} className={`${cartao} flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap ${editando === a.id ? "ring-2 ring-emerald-400" : ""}`}>
                  <LogoApoiador nome={a.nome} logo={a.logo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-gray-900">{a.nome}</span>
                      <SeloPublicado publicado={a.publicado} />
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">{a.categoria}</span>
                      {a.site_url ? (
                        <a href={a.site_url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[16rem] items-center gap-1 truncate text-emerald-700 hover:underline">
                          {a.site_url.replace(/^https:\/\//, "")} <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </a>
                      ) : (
                        <span>Sem site</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" className={btnIcone} disabled={i === 0 || ocupado} onClick={() => mover(i, -1)} aria-label={`Subir ${a.nome}`} title="Subir">
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" className={btnIcone} disabled={i === lista.length - 1 || ocupado} onClick={() => mover(i, 1)} aria-label={`Descer ${a.nome}`} title="Descer">
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" className={btnIcone} onClick={() => alternarPublicado(a)} aria-label={a.publicado ? `Ocultar ${a.nome}` : `Publicar ${a.nome}`} title={a.publicado ? "Ocultar da página pública" : "Publicar"}>
                      {a.publicado ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <button type="button" className={btnIcone} onClick={() => editar(a)} aria-label={`Editar ${a.nome}`} title="Editar">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <BotaoExcluir rotulo={a.nome} onConfirmar={() => excluir(a)} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <form onSubmit={salvar} className={`${cartao} space-y-4 self-start p-5 lg:sticky lg:top-24`}>
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          {editando ? <Pencil className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <Plus className="h-4 w-4 text-emerald-700" aria-hidden="true" />}
          {editando ? "Editar apoiador" : "Novo apoiador"}
        </h2>
        <div>
          <label className={lbl} htmlFor="ap-nome">Nome</label>
          <input id="ap-nome" required maxLength={255} className={inp} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          {erroCampo(erro, "nome") && <p className="mt-1 text-xs text-red-700">{erroCampo(erro, "nome")}</p>}
        </div>
        <div>
          <label className={lbl} htmlFor="ap-cat">Categoria</label>
          <input id="ap-cat" required maxLength={80} list="ap-categorias" placeholder="Ex.: Patrocinador" className={inp} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <datalist id="ap-categorias">
            {categorias.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={lbl} htmlFor="ap-logo">Link do logo</label>
          <input id="ap-logo" type="url" placeholder="https://.../logo.png" className={inp} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          <p className="mt-1 text-[11px] text-gray-500">https, terminando em .png, .jpg, .jpeg, .webp ou .svg. A plataforma guarda só o link.</p>
          {erroCampo(erro, "logo_url") && <p className="mt-1 text-xs text-red-700">{erroCampo(erro, "logo_url")}</p>}
        </div>
        <div>
          <label className={lbl} htmlFor="ap-site">Site</label>
          <input id="ap-site" type="url" placeholder="https://..." className={inp} value={form.site_url} onChange={(e) => setForm({ ...form, site_url: e.target.value })} />
          {erroCampo(erro, "site_url") && <p className="mt-1 text-xs text-red-700">{erroCampo(erro, "site_url")}</p>}
        </div>
        <CampoPublicado valor={form.publicado} onChange={(v) => setForm({ ...form, publicado: v })} />
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className={`${btnPrimario} flex-1`}>
            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar apoiador"}
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
