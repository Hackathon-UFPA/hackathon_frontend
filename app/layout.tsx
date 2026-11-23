import type { Metadata } from "next";
import Script from "next/script";
import AccessibilityBar from "@/components/AccessibilityBar";
import AppHeader from "@/components/layout/AppHeader";
import Rodape from "@/components/layout/Rodape";
import AvisoSessao from "@/components/sessao/AvisoSessao";
import { MARCA } from "@/lib/marca";
import "./globals.css";
import AppHeaderPlataforma from "@/components/layout/AppHeaderPlataforma";


export const metadata: Metadata = {
  title: MARCA.nome,
  description: MARCA.descricao,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <body className="antialiased bg-[#F6F9F8] selection:bg-emerald-500/30">
        <AppHeaderPlataforma />

        {children}
        <AvisoSessao />

        <Rodape />

        {/* Reaplica o tema (claro/escuro) e as preferências de acessibilidade antes da hidratação,
            para a página não piscar no tema padrão. Script inline: precisa de id (next/script). */}
        <Script
          id="preferencias-acessibilidade"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("hk_tema");(t?t==="escuro":matchMedia("(prefers-color-scheme: dark)").matches)&&document.documentElement.classList.add("dark")}catch(e){}try{var p=JSON.parse(localStorage.getItem("hk_acessibilidade")||"{}"),c=document.documentElement.classList;p.contraste&&c.add("high-contrast");p.semAnimacao&&c.add("sem-animacao");p.destacarLinks&&c.add("destacar-links");p.espacamento&&c.add("espacamento-texto");p.texto===1&&c.add("texto-grande");p.texto===2&&c.add("texto-muito-grande")}catch(e){}`,
          }}
        />

        {/* Componente Flutuante de Acessibilidade */}
        <AccessibilityBar />
      </body>
    </html>
  );
}