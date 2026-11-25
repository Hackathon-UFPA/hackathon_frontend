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
  const inicializar = async () => {
    await Promise.resolve();

    const u = getUser();

    if (!u) {
      setPronto(true);
      return;
    }

    setUser(u);
    setPronto(true);
  };

  inicializar();
}, []);

  return { user, pronto };
}
