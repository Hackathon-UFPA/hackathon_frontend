"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, type PapelUsuario, type Usuario } from "./api";

/**
 * Protege uma página no cliente. Sem token válido -> /login.
 * Com `papeis`, perfis fora da lista (exceto DEV) vão para "/".
 * Esconder telas é só conforto: a API recusa com 403 o que o perfil não pode fazer.
 */
export function useSession(papeis?: PapelUsuario[]) {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const u = getToken() ? getUser() : null;
    if (!u) {
      router.replace("/login");
      return;
    }
    if (papeis && u.papel !== "DEV" && !papeis.includes(u.papel)) {
      router.replace("/");
      return;
    }
    setUser(u);
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, pronto };
}
