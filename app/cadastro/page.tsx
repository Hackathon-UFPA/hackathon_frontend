"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Mail, UsersRound } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import CartaoAuth, { btn, Campo, DICA_SENHA, inp } from "@/components/auth/CartaoAuth";
import { ApiError, auth, enviarArquivoComprovante, formatarDataBrasilia } from "@/lib/api";
import {
  cadastroConvite,
  ROTULO_TIPO_INTEGRANTE,
  type ConviteCadastro,
} from "@/lib/api-participante";

const assinarHash = (aviso: () => void) => {
  window.addEventListener("hashchange", aviso);
  return () => window.removeEventListener("hashchange", aviso);
};

/** Token do e-mail de convite (`/cadastro#convite=...`). No servidor (SSR) ainda não existe. */
function useTokenDoConvite(): string | null | undefined {
  return useSyncExternalStore(
    assinarHash,
    () => new URLSearchParams(window.location.hash.slice(1)).get("convite"),
    () => undefined
  );
}

const nuloSeVazio = (v: string) => (v.trim() ? v.trim() : null);

/**
 * BE-S5-02: quem foi convidado para uma equipe sem ter conta cria o próprio acesso pelo
 * link do e-mail. O e-mail é o do convite; a conta nasce pendente e o convite continua
 * para ser aceito depois, com a própria conta.
 */
export default function CadastroPorConvitePage() {
  const token = useTokenDoConvite();

  if (token === undefined) return null; // ainda no servidor

  if (!token) {
    return (
      <CartaoAuth
        titulo="Criar conta"
        subtitulo="Esta página é aberta pelo link do convite que o líder da equipe enviou ao seu e-mail."
      >
        <p className="mb-4 text-sm text-gray-600">
          Se você recebeu um convite, abra o link exatamente como chegou no e-mail. Se não, escolha um
          hackathon e faça a sua inscrição.
        </p>
        <Link href="/hackathons" className={`${btn} block text-center`}>
          Ver hackathons
        </Link>
      </CartaoAuth>
    );
  }

  return <CadastroComToken key={token} token={token} />;
}

function CadastroComToken({ token }: { token: string }) {
  const router = useRouter();
  const [convite, setConvite] = useState<ConviteCadastro | null>(null);
  const [erroConsulta, setErroConsulta] = useState<unknown>(null);

  const [form, setForm] = useState({
    nome: "",
    senha: "",
    confirmacao: "",
    instituicao: "",
    curso: "",
    periodo: "",
    comprovante_url: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [concluido, setConcluido] = useState<{ entrou: boolean } | null>(null);

  useEffect(() => {
    cadastroConvite
      .consultar(token)
      .then((c) => {
        setConvite(c);
        setForm((f) => ({ ...f, nome: c.nome }));
      })
      .catch((e) => setErroConsulta(e));
  }, [token]);

  const campo = (chave: keyof typeof form) => ({
    className: inp,
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [chave]: e.target.value }),
  });

  const anexar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setEnviandoArquivo(true);
    setFields((f) => ({ ...f, comprovante_url: "" }));
    try {
      const url = await enviarArquivoComprovante(arquivo);
      setForm((f) => ({ ...f, comprovante_url: url }));
    } catch (err) {
      setFields((f) => ({
        ...f,
        comprovante_url: err instanceof Error ? err.message : "Não foi possível enviar o arquivo.",
      }));
    } finally {
      setEnviandoArquivo(false);
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convite) return;
    if (form.senha !== form.confirmacao) {
      setFields({ confirmacao: "As senhas não conferem." });
      return;
    }
    setEnviando(true);
    setErro(null);
    setFields({});
    try {
      const estudante = convite.tipo_integrante === "ESTUDANTE";
      await cadastroConvite.cadastrar({
        token,
        senha: form.senha,
        nome: nuloSeVazio(form.nome),
        instituicao: estudante ? nuloSeVazio(form.instituicao) : null,
        curso: estudante ? nuloSeVazio(form.curso) : null,
        periodo: estudante && form.periodo ? Number(form.periodo) : null,
        comprovante_url: nuloSeVazio(form.comprovante_url),
      });
      // A conta já existe: entra direto para a pessoa responder ao convite.
      try {
        await auth.login(convite.email, form.senha);
        setConcluido({ entrou: true });
      } catch {
        setConcluido({ entrou: false });
      }
    } catch (err) {
      if (err instanceof ApiError) setFields(err.fields);
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  if (erroConsulta !== null) {
    const invalido = erroConsulta instanceof ApiError && erroConsulta.status === 400;
    return (
      <CartaoAuth
        titulo={invalido ? "Link de convite inválido" : "Não foi possível abrir o convite"}
        subtitulo={
          invalido
            ? "Este link já foi usado, venceu ou o convite não está mais em aberto. Peça ao líder da equipe para convidar você de novo."
            : undefined
        }
      >
        {!invalido && <ApiErrorAlert erro={erroConsulta} />}
        <p className="mt-4 text-xs text-gray-600">
          Já criou sua conta?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-600">
            Entre com ela
          </Link>{" "}
          e responda ao convite em Minha Equipe.
        </p>
      </CartaoAuth>
    );
  }

  if (!convite) {
    return (
      <CartaoAuth titulo="Abrindo seu convite...">
        <p className="text-sm text-emerald-700 animate-pulse">Conferindo o link...</p>
      </CartaoAuth>
    );
  }

  if (concluido) {
    return (
      <CartaoAuth titulo="Conta criada">
        <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
          <p>
            Seu acesso com <strong>{convite.email}</strong> está pronto. O convite
            {convite.equipe_nome ? ` da equipe ${convite.equipe_nome}` : ""} ainda não foi aceito:
            responda a ele em Minha Equipe, junto com os termos da edição.
          </p>
        </div>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-gray-600">
          <li>Aceite o convite e os termos.</li>
          <li>Declare o seu vínculo no perfil ({ROTULO_TIPO_INTEGRANTE[convite.tipo_integrante].toLowerCase()}).</li>
          <li>
            {form.comprovante_url
              ? "Aguarde a conferência do comprovante que você enviou."
              : "Envie o comprovante do vínculo: a equipe só é homologada com ele aprovado."}
          </li>
        </ol>
        {concluido.entrou ? (
          <button type="button" onClick={() => router.push("/equipe")} className={`${btn} mt-6`}>
            Ir para Minha Equipe →
          </button>
        ) : (
          <Link href="/login" className={`${btn} mt-6 block text-center`}>
            Entrar →
          </Link>
        )}
      </CartaoAuth>
    );
  }

  const estudante = convite.tipo_integrante === "ESTUDANTE";
  const jaTemConta = erro instanceof ApiError && erro.status === 409;
  const linkUsado = erro instanceof ApiError && erro.status === 400;

  return (
    <CartaoAuth
      titulo="Criar meu acesso"
      subtitulo="Você foi convidado para uma equipe. Crie sua conta para responder ao convite."
    >
      <div className="mb-5 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-gray-900">
          <UsersRound className="h-4 w-4 text-emerald-700" />
          {convite.equipe_nome ? `Equipe ${convite.equipe_nome}` : "Convite para equipe"}
        </p>
        {convite.lider_nome && <p className="text-xs text-gray-700">Convite de {convite.lider_nome}, líder da equipe.</p>}
        <p className="flex items-center gap-2 text-xs text-gray-700">
          <Mail className="h-3.5 w-3.5 text-emerald-700" /> {convite.email}
        </p>
        <p className="text-xs text-gray-700">
          Participação como <strong>{ROTULO_TIPO_INTEGRANTE[convite.tipo_integrante].toLowerCase()}</strong>, indicada
          pelo líder.
        </p>
        {convite.expira_em && (
          <p className="text-[11px] text-gray-500">Link válido até {formatarDataBrasilia(convite.expira_em)}.</p>
        )}
      </div>

      {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      {jaTemConta && (
        <p className="my-3 text-xs text-gray-600">
          Já existe uma conta com este e-mail.{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-600">
            Entre com ela
          </Link>{" "}
          e responda ao convite em Minha Equipe.
        </p>
      )}
      {linkUsado && (
        <p className="my-3 text-xs text-gray-600">
          Este link já foi usado ou venceu. Peça ao líder da equipe um convite novo.
        </p>
      )}

      <form onSubmit={enviar} className="mt-4 space-y-4">
        <Campo label="E-mail">
          <input className={`${inp} opacity-70`} value={convite.email} readOnly disabled />
        </Campo>
        <Campo label="Nome completo *" erro={fields.nome} dica="Corrija se o líder escreveu diferente.">
          <input required autoComplete="name" maxLength={255} {...campo("nome")} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Senha *" erro={fields.senha} dica={DICA_SENHA}>
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              {...campo("senha")}
            />
          </Campo>
          <Campo label="Repita a senha *" erro={fields.confirmacao}>
            <input required type="password" autoComplete="new-password" {...campo("confirmacao")} />
          </Campo>
        </div>

        {estudante && (
          <>
            <Campo label="Instituição" erro={fields.instituicao}>
              <input maxLength={255} {...campo("instituicao")} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
              <Campo label="Curso" erro={fields.curso}>
                <input maxLength={255} {...campo("curso")} />
              </Campo>
              <Campo label="Período" erro={fields.periodo}>
                <input type="number" min={1} {...campo("periodo")} />
              </Campo>
            </div>
          </>
        )}

        <Campo
          label="Comprovante do vínculo (opcional)"
          erro={fields.comprovante_url}
          dica="PDF, PNG ou JPG. Pode ser enviado depois, mas a equipe só é homologada com ele aprovado."
        >
          <div className="flex gap-2">
            <input type="url" placeholder="https://..." {...campo("comprovante_url")} />
            <label className="inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50">
              {enviandoArquivo ? "Enviando..." : "Anexar"}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                disabled={enviandoArquivo}
                onChange={anexar}
              />
            </label>
          </div>
        </Campo>

        <button type="submit" disabled={enviando || enviandoArquivo} className={btn}>
          {enviando ? "Criando conta..." : "Criar minha conta →"}
        </button>
        <p className="text-center text-[11px] text-gray-500">
          Criar a conta não aceita o convite: você responde a ele depois, já logado.
        </p>
      </form>
    </CartaoAuth>
  );
}
