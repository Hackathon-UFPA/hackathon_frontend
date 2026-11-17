"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import CartaoAuth, {
  btn,
  Campo,
  DICA_SENHA,
  inp,
  useTokenDoLink,
} from "@/components/auth/CartaoAuth";
import { ApiError, auth } from "@/lib/api";

/** RF04: aberta pelo link do e-mail (`/redefinir-senha#token=...`). */
export default function RedefinirSenhaPage() {
  const token = useTokenDoLink();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (senha !== confirmacao) {
      setFields({ confirmacao: "As senhas não conferem." });
      return;
    }
    setEnviando(true);
    setErro(null);
    setFields({});
    try {
      await auth.redefinirSenha(token, senha);
      setConcluido(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setFields(err.fields);
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  if (token === undefined) return null; // ainda no servidor

  if (!token) {
    return (
      <CartaoAuth
        titulo="Link incompleto"
        subtitulo="Abra o link exatamente como chegou no e-mail, ou peça um novo."
      >
        <Link href="/esqueci-senha" className={`${btn} block text-center`}>
          Pedir um novo link
        </Link>
      </CartaoAuth>
    );
  }

  if (concluido) {
    return (
      <CartaoAuth titulo="Senha alterada">
        <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
          <p>
            Sua senha nova já vale. Por segurança, encerramos as sessões abertas em todos os
            aparelhos: entre de novo com a senha nova.
          </p>
        </div>
        <Link href="/login" className={`${btn} mt-6 block text-center`}>
          Entrar →
        </Link>
      </CartaoAuth>
    );
  }

  const linkInvalido = erro instanceof ApiError && erro.status === 400;

  return (
    <CartaoAuth titulo="Criar senha nova" subtitulo="Escolha a senha que você vai usar para entrar.">
      {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      {linkInvalido && (
        <p className="mb-4 text-xs text-gray-600">
          Este link já foi usado ou venceu.{" "}
          <Link href="/esqueci-senha" className="font-semibold text-emerald-700 hover:text-emerald-600">
            Peça um novo
          </Link>
          .
        </p>
      )}
      <form onSubmit={enviar} className="space-y-4">
        <Campo label="Senha nova *" erro={fields.senha_nova} dica={DICA_SENHA}>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            className={inp}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Campo>
        <Campo label="Repita a senha nova *" erro={fields.confirmacao}>
          <input
            required
            type="password"
            autoComplete="new-password"
            className={inp}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </Campo>
        <button type="submit" disabled={enviando} className={btn}>
          {enviando ? "Salvando..." : "Salvar senha nova →"}
        </button>
      </form>
    </CartaoAuth>
  );
}
