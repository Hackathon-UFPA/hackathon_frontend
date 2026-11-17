"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Minus, Plus, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  equipeParticipante,
  ROTULO_CATEGORIA,
  ROTULO_TIPO_INTEGRANTE,
  type CategoriaEquipe,
  type Composicao,
  type IntegranteComposicao,
  type TipoIntegrante,
} from "@/lib/api-participante";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

const CATEGORIAS = Object.keys(ROTULO_CATEGORIA) as CategoriaEquipe[];
const TIPOS: TipoIntegrante[] = ["ESTUDANTE", "PROFISSIONAL"];

const ROTULO_CONVITE: Record<string, string> = {
  PENDENTE: "Convite em aberto",
  ACEITO: "Aceitou",
  RECUSADO: "Recusou",
  CANCELADO: "Cancelado",
};
const ROTULO_COMPROVANTE: Record<string, string> = {
  PENDENTE: "Em conferência",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};

const inp =
  "w-full rounded-lg border border-gray-300 bg-[#F6F9F8] px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none";

type Linha = { nome: string; email: string; tipo: TipoIntegrante | "" };

const ehLider = (i: IntegranteComposicao) =>
  i.indicado_pelo_lider.funcao === "LIDER" || (i.confirmado_pelo_integrante.integrante && !i.confirmado_pelo_integrante.convite);

function Selo({ ok, texto }: { ok: boolean | null; texto: string }) {
  const cor =
    ok === null ? "bg-gray-100 text-gray-600" : ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${cor}`}>{texto}</span>;
}

/**
 * Composição da equipe (BE-S5-01): o que o líder indicou ao lado do que cada pessoa já
 * confirmou com a própria conta, com as pendências. O líder pode refazer a composição
 * inteira enquanto a equipe está em formação e as inscrições estão abertas.
 */
export function ComposicaoEquipe({
  equipeId,
  podeEditar,
  onAlterada,
}: {
  equipeId: string;
  /** Líder, equipe EM_FORMACAO e inscrições abertas. */
  podeEditar: boolean;
  onAlterada?: () => void | Promise<void>;
}) {
  const [composicao, setComposicao] = useState<Composicao | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [editando, setEditando] = useState(false);

  const carregar = useCallback(() => {
    equipeParticipante
      .composicao(equipeId)
      .then((c) => {
        setComposicao(c);
        setErro(null);
      })
      .catch(setErro);
  }, [equipeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro !== null && !composicao) return <ApiErrorAlert erro={erro} onRetry={carregar} />;
  if (!composicao) {
    return (
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 text-xs text-emerald-700">
        Carregando composição...
      </section>
    );
  }

  const nomePorUsuario = new Map(
    composicao.integrantes
      .filter((i) => i.confirmado_pelo_integrante.usuario_id)
      .map((i) => [i.confirmado_pelo_integrante.usuario_id!, i.indicado_pelo_lider.nome || i.indicado_pelo_lider.email])
  );

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <UsersRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">Composição e vínculos</h2>
            <p className="text-xs text-gray-600">
              Categoria <strong className="text-gray-900">{ROTULO_CATEGORIA[composicao.categoria]}</strong> ·{" "}
              {composicao.total_integrantes} integrante(s) e {composicao.total_indicados} indicado(s), de{" "}
              {composicao.minimo_integrantes} a {composicao.maximo_integrantes}.
            </p>
          </div>
        </div>
        {podeEditar && !editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50"
          >
            Alterar composição
          </button>
        )}
      </div>

      {editando ? (
        <EditorComposicao
          equipeId={equipeId}
          composicao={composicao}
          onCancelar={() => setEditando(false)}
          onSalva={async (nova) => {
            setComposicao(nova);
            setEditando(false);
            await onAlterada?.();
          }}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-[#F6F9F8] text-[10px] uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-bold">Pessoa (indicada pelo líder)</th>
                  <th className="px-3 py-2 font-bold">Tipo indicado</th>
                  <th className="px-3 py-2 font-bold">Tipo declarado</th>
                  <th className="px-3 py-2 font-bold">Convite</th>
                  <th className="px-3 py-2 font-bold">Termos</th>
                  <th className="px-3 py-2 font-bold">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {composicao.integrantes.map((i) => {
                  const c = i.confirmado_pelo_integrante;
                  const lider = ehLider(i);
                  const divergente = Boolean(c.tipo_declarado && c.tipo_declarado !== i.indicado_pelo_lider.tipo_integrante);
                  return (
                    <tr key={i.indicado_pelo_lider.email} className="align-top">
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-gray-900">
                          {i.indicado_pelo_lider.nome || i.indicado_pelo_lider.email}
                          {lider && (
                            <span className="ml-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                              Líder
                            </span>
                          )}
                        </p>
                        <p className="text-gray-500">{i.indicado_pelo_lider.email}</p>
                        {c.conta_ativa === false && <p className="text-[11px] text-amber-700">Conta pendente</p>}
                        {i.pendencias.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {i.pendencias.map((p) => (
                              <li key={p.codigo} className="flex gap-1 text-[11px] text-amber-800">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {p.mensagem}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800">{ROTULO_TIPO_INTEGRANTE[i.indicado_pelo_lider.tipo_integrante]}</td>
                      <td className="px-3 py-2.5">
                        {c.tipo_declarado ? (
                          <Selo ok={!divergente} texto={ROTULO_TIPO_INTEGRANTE[c.tipo_declarado]} />
                        ) : (
                          <Selo ok={null} texto="Não declarou" />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {lider ? (
                          <span className="text-gray-500">—</span>
                        ) : (
                          <Selo ok={c.convite === "ACEITO" ? true : c.convite === "PENDENTE" ? null : false} texto={ROTULO_CONVITE[c.convite ?? ""] ?? "—"} />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Selo ok={c.termos_aceitos} texto={c.termos_aceitos ? "Aceitos" : "Pendentes"} />
                      </td>
                      <td className="px-3 py-2.5">
                        {c.comprovante ? (
                          <Selo
                            ok={c.vinculo_comprovado ? true : c.comprovante === "PENDENTE" ? null : false}
                            texto={ROTULO_COMPROVANTE[c.comprovante] ?? c.comprovante}
                          />
                        ) : (
                          <Selo ok={c.integrante ? false : null} texto="Não enviado" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {composicao.pendencias_da_equipe.length === 0 &&
          composicao.integrantes.every((i) => i.pendencias.length === 0) ? (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Nenhuma pendência de composição.
            </p>
          ) : (
            composicao.pendencias_da_equipe.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-xs font-bold text-amber-900">Pendências da equipe</p>
                <ul className="space-y-1 text-xs text-amber-900">
                  {composicao.pendencias_da_equipe.map((p, n) => (
                    <li key={`${p.codigo}-${n}`}>
                      {p.mensagem}
                      {p.usuario_id && nomePorUsuario.get(p.usuario_id) ? ` (${nomePorUsuario.get(p.usuario_id)})` : ""}
                      {!p.bloqueia_conclusao && <span className="text-amber-700"> · impede só a homologação</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}

function EditorComposicao({
  equipeId,
  composicao,
  onCancelar,
  onSalva,
}: {
  equipeId: string;
  composicao: Composicao;
  onCancelar: () => void;
  onSalva: (c: Composicao) => void | Promise<void>;
}) {
  const lider = composicao.integrantes.find(ehLider);
  // Fica na lista quem já entrou ou tem convite em aberto; o líder vai à parte.
  const iniciais: Linha[] = composicao.integrantes
    .filter(
      (i) =>
        i !== lider &&
        (i.confirmado_pelo_integrante.integrante || i.confirmado_pelo_integrante.convite === "PENDENTE")
    )
    .map((i) => ({
      nome: i.indicado_pelo_lider.nome ?? "",
      email: i.indicado_pelo_lider.email,
      tipo: i.indicado_pelo_lider.tipo_integrante,
    }));

  const [categoria, setCategoria] = useState<CategoriaEquipe>(composicao.categoria);
  const [tipoLider, setTipoLider] = useState<TipoIntegrante>(lider?.indicado_pelo_lider.tipo_integrante ?? "ESTUDANTE");
  const [linhas, setLinhas] = useState<Linha[]>(iniciais.length ? iniciais : [{ nome: "", email: "", tipo: "" }]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const emailsAntes = new Set(iniciais.map((l) => l.email.toLowerCase()));
  const emailsDepois = new Set(linhas.map((l) => l.email.trim().toLowerCase()).filter(Boolean));
  const saem = iniciais.filter((l) => !emailsDepois.has(l.email.toLowerCase()));
  const entram = linhas.filter((l) => l.email.trim() && !emailsAntes.has(l.email.trim().toLowerCase()));
  const total = 1 + linhas.filter((l) => l.email.trim()).length;
  const mista = categoria === "MISTA";

  const alterar = (n: number, campo: keyof Linha, valor: string) =>
    setLinhas((ls) => ls.map((l, i) => (i === n ? { ...l, [campo]: valor } : l)));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setFields({});
    try {
      const tipoDaCategoria: TipoIntegrante | null =
        categoria === "ESTUDANTES" ? "ESTUDANTE" : categoria === "PROFISSIONAIS" ? "PROFISSIONAL" : null;
      const nova = await equipeParticipante.alterarComposicao(equipeId, {
        categoria,
        tipo_lider: mista ? tipoLider : tipoDaCategoria,
        integrantes: linhas
          .filter((l) => l.email.trim())
          .map((l) => ({
            nome: l.nome.trim(),
            email: l.email.trim().toLowerCase(),
            tipo_integrante: mista ? (l.tipo || null) : tipoDaCategoria,
          })),
      });
      await onSalva(nova);
    } catch (err) {
      if (err instanceof ApiError) setFields(err.fields);
      setErro(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={salvar} className="space-y-4">
      <p className="text-xs text-gray-600">
        Informe a composição inteira. Quem sair da lista é retirado e avisado, e os convites em aberto dessas
        pessoas são cancelados; quem for novo recebe convite por e-mail. Termos e comprovantes continuam sendo de
        cada pessoa.
      </p>

      {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Categoria *</span>
          <select className={inp} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaEquipe)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA[c]}
              </option>
            ))}
          </select>
          {fields.categoria && <span className="mt-1 block text-xs text-red-600">{fields.categoria}</span>}
        </label>
        {mista && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">Seu tipo (líder) *</span>
            <select className={inp} value={tipoLider} onChange={(e) => setTipoLider(e.target.value as TipoIntegrante)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {ROTULO_TIPO_INTEGRANTE[t]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-gray-600">
          Integrantes além de você ({total} de {composicao.minimo_integrantes} a {composicao.maximo_integrantes})
        </p>
        {linhas.map((l, n) => (
          <div
            key={n}
            className={`grid gap-2 rounded-xl border border-gray-200 bg-[#F6F9F8] p-3 ${
              mista ? "sm:grid-cols-[1fr_1.2fr_10rem_auto]" : "sm:grid-cols-[1fr_1.2fr_auto]"
            }`}
          >
            <input
              required
              aria-label={`Nome do integrante ${n + 1}`}
              placeholder="Nome"
              maxLength={255}
              className={inp}
              value={l.nome}
              onChange={(e) => alterar(n, "nome", e.target.value)}
            />
            <input
              required
              type="email"
              aria-label={`E-mail do integrante ${n + 1}`}
              placeholder="E-mail"
              className={inp}
              value={l.email}
              onChange={(e) => alterar(n, "email", e.target.value)}
            />
            {mista && (
              <select
                required
                aria-label={`Tipo do integrante ${n + 1}`}
                className={inp}
                value={l.tipo}
                onChange={(e) => alterar(n, "tipo", e.target.value)}
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
              onClick={() => setLinhas((ls) => ls.filter((_, i) => i !== n))}
              className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        ))}
        {total < composicao.maximo_integrantes && (
          <button
            type="button"
            onClick={() => setLinhas((ls) => [...ls, { nome: "", email: "", tipo: "" }])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar integrante
          </button>
        )}
        {fields.integrantes && <p className="text-xs text-red-600">{fields.integrantes}</p>}
      </div>

      {(saem.length > 0 || entram.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
          {saem.length > 0 && <p>Saem da equipe: {saem.map((l) => l.nome || l.email).join(", ")}.</p>}
          {entram.length > 0 && <p>Recebem convite: {entram.map((l) => l.nome || l.email).join(", ")}.</p>}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar composição"}
        </button>
      </div>
    </form>
  );
}
