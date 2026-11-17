"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, auth, caminhoDeLogin, getToken, getUser, type PapelUsuario, type Usuario } from "./api";

/**
 * Protege uma página no cliente. Sem token válido -> /login, voltando a esta página depois.
 * Com `papeis`, perfis fora da lista (exceto DEV) vão para "/".
 * Confere a sessão em GET /auth/me, porque o perfil e a situação da conta podem ter mudado.
 * Esconder telas é só conforto: a API recusa com 403 o que o perfil não pode fazer.
 */
export function useSession(papeis?: PapelUsuario[]) {
  const router = useRouter();
  const [sessao, setSessao] = useState<{ user: Usuario | null; pronto: boolean }>({
    user: null,
    pronto: false,
  });

  useEffect(() => {
    let ativo = true;

    (async () => {
      let usuario = getToken() ? getUser() : null;
      if (!usuario) {
        router.replace(caminhoDeLogin());
        return;
      }
      try {
        usuario = await auth.me();
      } catch (e) {
        // No 401 o cliente da API já limpou a sessão e foi para o login.
        if (e instanceof ApiError && e.status === 401) return;
        // Servidor fora do ar: segue com a cópia local e a tela mostra o erro da própria chamada.
      }
      if (!ativo) return;
      if (papeis && usuario.papel !== "DEV" && !papeis.includes(usuario.papel)) {
        router.replace("/");
        return;
      }
      setSessao({ user: usuario, pronto: true });
    })();

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return sessao;
}
