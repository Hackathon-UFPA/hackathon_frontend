"use client";

import Link from "next/link";

import SponsorsSection from "@/components/publico/ SponsorsSection";
import FaqSection from "@/components/publico/FaqSection";
import CtaSection from "@/components/publico/CtaSection";
import ContactSection from "@/components/publico/ContactSection";
import SiteFooter from "@/components/publico/SiteFooter";
import OdsSection from "@/components/publico/OdsSection";
import AboutSection from "@/components/publico/AboutSection";
import Hero from "@/components/publico/Hero";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-x-hidden">
      
      {/* BACKGROUND GLOBAL DA FLORESTA */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/floresta.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/60 via-[#0A1110]/80 to-[#0A1110]"></div>
      </div>

      {/* CABEÇALHO DE NAVEGAÇÃO FIXO */}
     

      {/* CONTEÚDO PRINCIPAL */}
      <main className="relative z-10 flex-1">
        
        {/* HERO SECTION */}
               {/* HERO SECTION */}
        <Hero />

        {/* SEÇÃO SOBRE O EVENTO */}
        <AboutSection/>

        {/* SEÇÃO DESAFIOS ODS */}
           <OdsSection />

                {/* SEÇÃO PATROCINADORES */}
        <SponsorsSection />

          <FaqSection />

          <CtaSection />

           <ContactSection />

      </main>

      {/* RODAPÉ REGULAMENTO, LGPD E FAQ */}
            {/* RODAPÉ */}
      <SiteFooter />
    </div>
  );
}