"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import CartaoAuth, { btn, Campo, inp } from "@/components/auth/CartaoAuth";
import { auth } from "@/lib/api";

/** RF04: pede o link de redefinição. A resposta é a mesma exista ou não a conta. */
export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await auth.recuperarSenha(email.toLowerCase().trim());
      setMensagem(r.detail);
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  };

  if (mensagem) {
    return (
      <CartaoAuth titulo="Confira seu e-mail">
        <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <MailCheck className="h-5 w-5 shrink-0 text-emerald-700" />
          <div className="space-y-2">
            <p>{mensagem}</p>
            <p className="text-xs text-emerald-800">
              O link vale por pouco tempo e só pode ser usado uma vez. Não chegou? Veja a caixa de
              spam ou peça de novo daqui a um minuto.
            </p>
          </div>
        </div>
        <Link href="/login" className={`${btn} mt-6 block text-center`}>
          Voltar ao login
        </Link>
      </CartaoAuth>
    );
  }

  return (
    <CartaoAuth
      titulo="Esqueci minha senha"
      subtitulo="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para você criar uma senha nova."
    >
      {erro !== null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}
      <form onSubmit={enviar} className="space-y-4">
        <Campo label="E-mail *">
          <input
            required
            type="email"
            autoComplete="email"
            className={inp}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>
        <button type="submit" disabled={enviando} className={btn}>
          {enviando ? "Enviando..." : "Enviar link →"}
        </button>
      </form>
    </CartaoAuth>
  );
}
