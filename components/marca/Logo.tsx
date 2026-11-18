import Image from "next/image";
import { MARCA } from "@/lib/marca";

/**
 * Marca da plataforma. Os arquivos ficam em public/marca/:
 * - icone.svg: só o símbolo (também é o favicon, em app/icon.svg);
 * - icone-escuro.svg: o símbolo com as cores do logo escuro (fundo creme);
 * - logo.svg: símbolo + nome, para fundo claro;
 * - logo-escuro.svg: símbolo + nome, para fundo escuro (tema escuro).
 */
export function LogoMarca({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <>
      <Image src="/marca/icone.svg" alt="" aria-hidden="true" width={32} height={32} className={`logo-claro ${className}`} />
      <Image src="/marca/icone-escuro.svg" alt="" aria-hidden="true" width={32} height={32} className={`logo-escuro ${className}`} />
    </>
  );
}

export default function Logo({ compacto = false }: { compacto?: boolean }) {
  if (compacto) return <LogoMarca className="h-8 w-8 shrink-0" />;

  // As duas versões vão no HTML; o CSS (app/globals.css) mostra a do tema atual, sem piscar
  return (
    <span className="inline-flex items-center">
      <Image src="/marca/logo.svg" alt={MARCA.nome} width={726} height={220} priority className="logo-claro h-12 w-auto" />
      <Image src="/marca/logo-escuro.svg" alt={MARCA.nome} width={726} height={220} priority className="logo-escuro h-12 w-auto" />
    </span>
  );
}
