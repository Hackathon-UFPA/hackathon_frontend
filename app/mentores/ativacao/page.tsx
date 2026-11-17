"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, ExternalLink, FileText, Handshake, Loader2 } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import CartaoAuth, { btn, Campo, DICA_SENHA, inp } from "@/components/auth/CartaoAuth";
import { ApiError, type Termo } from "@/lib/api";
import { ativacaoMentor, type ConsultaConviteMentor } from "@/lib/api-mentores";

const ROTULO_TERMO: Record<string, string> = {
  REGULAMENTO: "Regulamento",
  TERMO_CONSENTIMENTO: "Termo de consentimento",
};

const assinarHash = (aviso: () => void) => {
  window.addEventListener("hashchange", aviso);
  return () => window.removeEventListener("hashchange", aviso);
};

/** `#token=...&hackathon_id=...` do e-mail. No servidor (SSR) ainda não existe: undefined. */
function useFragmento(): string | undefined {
  return useSyncExternalStore(
    assinarHash,
    () => window.location.hash.slice(1),
    () => undefined
  );
}

type LinkConvite = { token: string; hackathon_id: string };

function DocumentoTermo({ termo, aceito, onAceite }: { termo: Termo; aceito: boolean; onAceite: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-gray-500">{ROTULO_TERMO[termo.tipo] ?? termo.tipo}</p>
          <h3 className="font-bold text-gray-900">
            {termo.titulo} <span className="text-xs font-normal text-gray-500">versão {termo.versao}</span>
          </h3>
        </div>
      </div>
      {termo.conteudo && (
        <div
          tabIndex={0}
          aria-label={`Texto de ${termo.titulo}`}
          className="mt-3 max-h-64 overflow-y-auto whitespace-pre-line rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700"
        >
          {termo.conteudo}
        </div>
      )}
      {termo.url && (
        <a href={termo.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
          Abrir o documento <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-gray-800">
        <input type="checkbox" required checked={aceito} onChange={(e) => onAceite(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
        Li e aceito {termo.tipo === "REGULAMENTO" ? "o regulamento" : "o termo de consentimento"}.
      </label>
    </div>
  );
}

/** RF37/RN33: aberta pelo link do convite (`/mentores/ativacao#token=...&hackathon_id=...`). */
export default function AtivacaoMentorPage() {
  const fragmento = useFragmento();
  const [link, setLink] = useState<LinkConvite | null>(null);
  const [consulta, setConsulta] = useState<ConsultaConviteMentor | null>(null);
  const [erroConsulta, setErroConsulta] = useState<unknown>(null);
  const [form, setForm] = useState({ nome: "", empresa_parceira: "", area_atuacao: "", senha: "", confirmacao: "" });
  const [trocarSenha, setTrocarSenha] = useState(false);
  const [aceites, setAceites] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [concluido, setConcluido] = useState(false);

  const params = new URLSearchParams(fragmento ?? "");
  const tokenNoLink = params.get("token");
  const hackathonNoLink = params.get("hackathon_id");

  // Lê o convite e tira o token da barra de endereço (não fica no histórico nem em capturas de tela)
  useEffect(() => {
    if (!tokenNoLink || !hackathonNoLink || link) return;
    const lido = { token: tokenNoLink, hackathon_id: hackathonNoLink };
    ativacaoMentor
      .consultar(lido.token, lido.hackathon_id)
      .then((c) => {
        setConsulta(c);
        setForm((f) => ({
          ...f,
          nome: c.mentor.nome ?? "",
          empresa_parceira: c.mentor.empresa_parceira ?? "",
          area_atuacao: c.mentor.area_atuacao ?? "",
        }));
      })
      .catch(setErroConsulta)
      .finally(() => {
        setLink(lido);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      });
  }, [tokenNoLink, hackathonNoLink, link]);

  if (fragmento === undefined) return null; // ainda no servidor

  if (!link && (!tokenNoLink || !hackathonNoLink)) {
    return (
      <CartaoAuth titulo="Link incompleto" subtitulo="Abra o link exatamente como chegou no e-mail de convite. Se não funcionar, peça um novo convite à organização do hackathon.">
        <Link href="/login" className={`${btn} block text-center`}>Ir para o login</Link>
      </CartaoAuth>
    );
  }

  if (!link || (!consulta && !erroConsulta)) {
    return (
      <CartaoAuth titulo="Abrindo seu convite...">
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Conferindo o link.
        </p>
      </CartaoAuth>
    );
  }

  if (erroConsulta || !consulta) {
    const status = erroConsulta instanceof ApiError ? erroConsulta.status : 0;
    return (
      <CartaoAuth
        titulo={status === 400 ? "Este convite não vale mais" : "Não foi possível abrir o convite"}
        subtitulo={
          status === 400
            ? "O link venceu, já foi usado ou foi substituído por um convite mais novo. Peça um novo convite à organização do hackathon."
            : undefined
        }
      >
        {status !== 400 && <ApiErrorAlert erro={erroConsulta} />}
        <Link href="/login" className={`${btn} mt-4 block text-center`}>Ir para o login</Link>
      </CartaoAuth>
    );
  }

  if (concluido) {
    return (
      <CartaoAuth titulo="Conta de mentor ativada">
        <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <p>
            Tudo certo, {form.nome.split(" ")[0]}! Entre com <strong>{consulta.mentor.email}</strong> e a sua senha para
            ver as equipes que você vai acompanhar.
          </p>
        </div>
        <Link href="/login" className={`${btn} mt-6 block text-center`}>Entrar →</Link>
      </CartaoAuth>
    );
  }

  const precisaSenha = consulta.senha_necessaria || trocarSenha;
  const todosAceitos = consulta.termos.length > 0 && consulta.termos.every((t) => aceites[t.id]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (precisaSenha && form.senha !== form.confirmacao) {
      setFields({ confirmacao: "As senhas não conferem." });
      return;
    }
    setEnviando(true);
    setErro(null);
    setFields({});
    try {
      await ativacaoMentor.concluir({
        token: link.token,
        hackathon_id: link.hackathon_id,
        nome: form.nome.trim(),
        empresa_parceira: form.empresa_parceira.trim(),
        area_atuacao: form.area_atuacao.trim(),
        senha: precisaSenha ? form.senha : null,
        termos_ids: consulta.termos.map((t) => t.id),
      });
      setConcluido(true);
    } catch (err) {
      if (err instanceof ApiError) setFields(err.fields);
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_8px_40px_-16px_rgba(6,78,59,0.2)] sm:p-8">
        <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
          <Handshake className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Boas-vindas à mentoria</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Você foi convidado(a) para mentorar equipes. Confira seus dados, {consulta.senha_necessaria ? "crie sua senha" : "mantenha ou troque sua senha"}{" "}
            e aceite os documentos do hackathon para ativar a conta.
          </p>
        </div>
      </header>

      {erro !== null && (
        <div className="mt-4">
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        </div>
      )}

      <form onSubmit={enviar} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* Dados */}
        <section className="h-fit space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6" aria-labelledby="t-dados">
          <h2 id="t-dados" className="text-lg font-bold text-gray-900">Seus dados</h2>
          <Campo label="E-mail">
            <input className={`${inp} opacity-70`} value={consulta.mentor.email} readOnly />
          </Campo>
          <Campo label="Nome completo *" erro={fields.nome}>
            <input required maxLength={255} autoComplete="name" className={inp} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Campo>
          <Campo label="Empresa de origem *" erro={fields.empresa_parceira}>
            <input required maxLength={255} autoComplete="organization" className={inp} value={form.empresa_parceira} onChange={(e) => setForm({ ...form, empresa_parceira: e.target.value })} />
          </Campo>
          <Campo label="Área de atuação *" erro={fields.area_atuacao}>
            <input required maxLength={255} className={inp} value={form.area_atuacao} onChange={(e) => setForm({ ...form, area_atuacao: e.target.value })} />
          </Campo>

          {!consulta.senha_necessaria && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={trocarSenha} onChange={(e) => setTrocarSenha(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              Quero trocar minha senha atual
            </label>
          )}
          {precisaSenha && (
            <>
              <Campo label={consulta.senha_necessaria ? "Crie uma senha *" : "Senha nova *"} erro={fields.senha} dica={DICA_SENHA}>
                <input required type="password" autoComplete="new-password" minLength={8} maxLength={128} className={inp} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
              </Campo>
              <Campo label="Repita a senha *" erro={fields.confirmacao}>
                <input required type="password" autoComplete="new-password" className={inp} value={form.confirmacao} onChange={(e) => setForm({ ...form, confirmacao: e.target.value })} />
              </Campo>
            </>
          )}
        </section>

        {/* Documentos */}
        <section className="space-y-4" aria-labelledby="t-docs">
          <div>
            <h2 id="t-docs" className="text-lg font-bold text-gray-900">Documentos do hackathon</h2>
            <p className="text-sm text-gray-600">Leia e aceite as versões vigentes para concluir.</p>
          </div>
          {consulta.termos.length === 0 ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              O hackathon ainda não publicou os documentos. Avise a organização e tente de novo mais tarde.
            </p>
          ) : (
            consulta.termos.map((t) => (
              <DocumentoTermo key={t.id} termo={t} aceito={!!aceites[t.id]} onAceite={(v) => setAceites({ ...aceites, [t.id]: v })} />
            ))
          )}
          {fields.termos_ids && <p className="text-xs text-red-600">{fields.termos_ids}</p>}
          <button type="submit" disabled={enviando || !todosAceitos} className={btn}>
            {enviando ? "Ativando..." : "Ativar minha conta →"}
          </button>
        </section>
      </form>
    </main>
  );
}
