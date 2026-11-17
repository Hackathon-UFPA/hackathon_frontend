"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import {
  admin,
  organizacoes,
  ROTULO_TIPO_ORGANIZACAO,
  type Organizacao,
  type PapelUsuario,
  type TipoOrganizacao,
} from "@/lib/api";
import { useSession } from "@/lib/useSession";

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";
const btn =
  "w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer";

const ROTULO_PAPEL: Partial<Record<PapelUsuario, string>> = {
  ORGANIZADOR: "Organizador",
  COMITE_CIENTIFICO: "Comitê Científico (avaliador)",
  COMITE_TECNICO: "Comitê Técnico",
  MENTOR: "Mentor",
  PARTICIPANTE: "Participante",
  DEV: "DEV",
};

const NOVO_USUARIO = { nome: "", email: "", senha: "", papel: "" as PapelUsuario | "" };

export default function AdminOrganizacaoPage() {
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);
  const ehOrganizador = user?.papel === "ORGANIZADOR";

  const [org, setOrg] = useState<Organizacao | null>(null);
  const [formOrg, setFormOrg] = useState({ nome: "", tipo: "EMPRESA" as TipoOrganizacao, site: "", descricao: "" });
  const [perfis, setPerfis] = useState<PapelUsuario[]>([]);
  const [novo, setNovo] = useState(NOVO_USUARIO);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    if (user?.organizacao_id) {
      organizacoes
        .minha()
        .then((o) => {
          setOrg(o);
          setFormOrg({ nome: o.nome, tipo: o.tipo, site: o.site ?? "", descricao: o.descricao ?? "" });
        })
        .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
    }
    admin
      .perfisCadastraveis()
      .then((r) => {
        // Participante se cadastra sozinho; aqui é só a equipe interna da organização.
        // Mentor tem fluxo próprio (convite por e-mail + aceite dos termos) em /admin/mentores.
        const internos = r.perfis.filter((p) => p !== "PARTICIPANTE" && p !== "DEV" && p !== "MENTOR");
        setPerfis(internos);
        setNovo((n) => ({ ...n, papel: n.papel || internos[0] || "" }));
      })
      .catch(() => setPerfis([]));
  }, [pronto, user?.organizacao_id]);

  if (!pronto) return null;

  const executar = async (acao: () => Promise<void>) => {
    setErro(null);
    setOk(null);
    setSalvando(true);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSalvando(false);
    }
  };

  const salvarOrg = (e: React.FormEvent) => {
    e.preventDefault();
    executar(async () => {
      const o = await organizacoes.editarMinha({
        nome: formOrg.nome.trim(),
        tipo: formOrg.tipo,
        site: formOrg.site.trim() || null,
        descricao: formOrg.descricao.trim() || null,
      });
      setOrg(o);
      setOk("Dados da organização salvos.");
    });
  };

  const cadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo.papel) return;
    executar(async () => {
      const u = await admin.cadastrarUsuario({
        nome: novo.nome.trim(),
        email: novo.email.toLowerCase().trim(),
        senha: novo.senha,
        papel: novo.papel as PapelUsuario,
      });
      setOk(`${u.nome || u.email} cadastrado como ${ROTULO_PAPEL[u.papel] ?? u.papel}. Passe a senha inicial para a pessoa entrar.`);
      setNovo({ ...NOVO_USUARIO, papel: novo.papel });
    });
  };

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-4 sm:p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <Link href="/admin" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
          &larr; Painel
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Organização e equipe</h1>

        {erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
        {ok && (
          <div role="status" className="p-3 rounded-lg text-xs border bg-emerald-500/10 border-emerald-500/30 text-emerald-700">
            {ok}
          </div>
        )}

        {org && (
          <form onSubmit={salvarOrg} className="bg-white border border-emerald-100 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Dados da organização</h2>
            <fieldset disabled={!ehOrganizador} className="space-y-4 disabled:opacity-70">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="org-nome">Nome</label>
                  <input id="org-nome" required maxLength={255} className={inp} value={formOrg.nome} onChange={(e) => setFormOrg({ ...formOrg, nome: e.target.value })} />
                </div>
                <div>
                  <label className={lbl} htmlFor="org-tipo">Tipo</label>
                  <select id="org-tipo" className={inp} value={formOrg.tipo} onChange={(e) => setFormOrg({ ...formOrg, tipo: e.target.value as TipoOrganizacao })}>
                    {(Object.keys(ROTULO_TIPO_ORGANIZACAO) as TipoOrganizacao[]).map((t) => (
                      <option key={t} value={t}>{ROTULO_TIPO_ORGANIZACAO[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl} htmlFor="org-site">Site</label>
                <input id="org-site" type="url" className={inp} value={formOrg.site} onChange={(e) => setFormOrg({ ...formOrg, site: e.target.value })} />
              </div>
              <div>
                <label className={lbl} htmlFor="org-desc">Sobre</label>
                <textarea id="org-desc" rows={3} maxLength={2000} className={inp} value={formOrg.descricao} onChange={(e) => setFormOrg({ ...formOrg, descricao: e.target.value })} />
              </div>
              {ehOrganizador && (
                <button type="submit" disabled={salvando} className={btn}>Salvar</button>
              )}
            </fieldset>
          </form>
        )}

        {perfis.length > 0 && (
          <form onSubmit={cadastrar} className="bg-white border border-emerald-100 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Adicionar à equipe</h2>
              <p className="text-xs text-gray-600 mt-1">
                Organizadores, avaliadores do Comitê Científico e Comitê Técnico. A conta já nasce
                ativa e ligada a {org?.nome ?? "sua organização"}. Mentores são convidados em{" "}
                <Link href="/admin/mentores" className="font-semibold text-emerald-700 hover:underline">Mentores</Link>.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl} htmlFor="u-papel">Perfil</label>
                <select id="u-papel" className={inp} value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value as PapelUsuario })}>
                  {perfis.map((p) => <option key={p} value={p}>{ROTULO_PAPEL[p] ?? p}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="u-nome">Nome</label>
                <input id="u-nome" required className={inp} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
              </div>
              <div>
                <label className={lbl} htmlFor="u-email">E-mail</label>
                <input id="u-email" type="email" required className={inp} value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
              </div>
              <div>
                <label className={lbl} htmlFor="u-senha">Senha inicial</label>
                <input id="u-senha" type="text" required minLength={8} autoComplete="off" className={inp} value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">Senha: 8 a 128 caracteres, com ao menos uma letra e um número.</p>
            <button type="submit" disabled={salvando} className={btn}>Cadastrar</button>
          </form>
        )}

        <Link
          href="/admin/mentores"
          className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <span>
            <span className="block text-sm font-bold text-gray-900">Mentores</span>
            <span className="mt-1 block text-xs text-gray-600">
              Cadastre mentores e envie o convite: cada um ativa a própria conta e aceita os termos do hackathon.
            </span>
          </span>
          <span className="text-sm font-semibold text-emerald-700">Abrir &rarr;</span>
        </Link>
      </div>
    </main>
  );
}
