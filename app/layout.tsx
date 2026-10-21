import type { Metadata } from "next";
import AccessibilityBar from "@/components/AccessibilityBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hackathon IA 2027 - Amazônia",
  description: "Soluções de Inteligência Artificial para os desafios da região amazônica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased bg-[#0A1110] selection:bg-emerald-500/30">
        {children}
        {/* Componente Flutuante de Acessibilidade */}
        <AccessibilityBar />
      </body>
    </html>
  );
}