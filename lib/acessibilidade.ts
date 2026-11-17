// lib/acessibilidade.ts — preferências de alto contraste e fonte ampliada (S4-11).
// A classe em <html> é a fonte da verdade da tela; o localStorage guarda a escolha entre visitas.

export type PreferenciaAcessibilidade = "contraste" | "fonte";

const CONFIG: Record<PreferenciaAcessibilidade, { classe: string; chave: string }> = {
  contraste: { classe: "high-contrast", chave: "hk_a11y_contraste" },
  fonte: { classe: "large-text", chave: "hk_a11y_fonte" },
};

const PREFERENCIAS = Object.keys(CONFIG) as PreferenciaAcessibilidade[];

/** Roda no <head>, antes da primeira pintura, para a página não piscar sem a preferência. */
export const SCRIPT_PREFERENCIAS = `(function(){try{var d=document.documentElement;${PREFERENCIAS.map(
  (p) => `if(localStorage.getItem("${CONFIG[p].chave}")==="1")d.classList.add("${CONFIG[p].classe}");`
).join("")}}catch(e){}})()`;

const ouvintes = new Set<() => void>();

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

function lerSalvo(p: PreferenciaAcessibilidade): boolean {
  try {
    return window.localStorage.getItem(CONFIG[p].chave) === "1";
  } catch {
    return false;
  }
}

/** Reaplica o que está salvo. Cobre outra aba e o remount do Strict Mode, que limpa o <html>. */
export function sincronizarPreferencias() {
  for (const p of PREFERENCIAS) {
    document.documentElement.classList.toggle(CONFIG[p].classe, lerSalvo(p));
  }
  avisar();
}

export function preferenciaAtiva(p: PreferenciaAcessibilidade): boolean {
  return document.documentElement.classList.contains(CONFIG[p].classe);
}

export function alternarPreferencia(p: PreferenciaAcessibilidade): boolean {
  const ativa = !preferenciaAtiva(p);
  document.documentElement.classList.toggle(CONFIG[p].classe, ativa);
  try {
    if (ativa) window.localStorage.setItem(CONFIG[p].chave, "1");
    else window.localStorage.removeItem(CONFIG[p].chave);
  } catch {
    // Sem armazenamento a preferência vale só até recarregar a página.
  }
  avisar();
  return ativa;
}

export function assinarPreferencias(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}
