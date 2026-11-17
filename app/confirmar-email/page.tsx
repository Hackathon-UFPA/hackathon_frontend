"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import CartaoAuth, { btn, useTokenDoLink } from "@/components/auth/CartaoAuth";
import { ApiError, atualizarUsuarioDaSessao, auth, getToken, getUser } from "@/lib/api";

type Estado =
  | { tipo: "confirmando" }
  | { tipo: "ok"; email: string }
  | { tipo: "erro"; mensagem: string };

/** RF01: aberta pelo link do e-mail (`/confirmar-email#token=...`). Não exige login. */
export default function ConfirmarEmailPage() {
  const token = useTokenDoLink();
  const [estado, setEstado] = useState<Estado>({ tipo: "confirmando" });
  // O link é de uso único: em desenvolvimento o React roda o efeito duas vezes.
  const enviado = useRef(false);

  useEffect(() => {
    if (!token || enviado.current) return;
    enviado.current = true;
    auth
      .confirmarEmail(token)
      .then((u) => {
        // Se quem confirmou é quem está logado aqui, o cabeçalho e o perfil já mostram o novo e-mail
        if (getToken() && getUser()?.id === u.id) atualizarUsuarioDaSessao(u);
        setEstado({ tipo: "ok", email: u.email });
      })
      .catch((err) =>
        setEstado({
          tipo: "erro",
          mensagem:
            err instanceof ApiError && err.status === 409
              ? "Este e-mail já estava confirmado. Está tudo certo."
              : err instanceof ApiError && err.status === 400
                ? "Este link já foi usado ou venceu. Peça um novo na página do seu perfil."
                : "Não foi possível confirmar agora. Tente abrir o link de novo.",
        })
      );
  }, [token]);

  if (token === undefined) return null; // ainda no servidor

  if (!token) {
    return (
      <CartaoAuth
        titulo="Link incompleto"
        subtitulo="Abra o link exatamente como chegou no e-mail. Se precisar, peça um novo na página do seu perfil."
      >
        <Link href="/perfil" className={`${btn} block text-center`}>
          Ir para o meu perfil
        </Link>
      </CartaoAuth>
    );
  }

  if (estado.tipo === "confirmando") {
    return (
      <CartaoAuth titulo="Confirmando seu e-mail...">
        <p className="mt-4 text-xs font-mono text-emerald-700">Só um instante.</p>
      </CartaoAuth>
    );
  }

  const ok = estado.tipo === "ok";
  return (
    <CartaoAuth titulo={ok ? "E-mail confirmado" : "Não deu para confirmar"}>
      <div
        className={`mt-4 flex gap-3 rounded-xl border p-4 text-sm ${
          ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {ok ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-amber-700" />
        )}
        <p>{ok ? `Tudo certo: ${estado.email} está confirmado na sua conta.` : estado.mensagem}</p>
      </div>
      <Link href={getToken() ? "/perfil" : "/login"} className={`${btn} mt-6 block text-center`}>
        {getToken() ? "Ir para o meu perfil" : "Entrar"}
      </Link>
    </CartaoAuth>
  );
}
