import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import HackathonsEmDestaque from "@/components/plataforma/HackathonsEmDestaque";
import FundoAnimado, { TrechosSubindo } from "@/components/plataforma/FundoAnimado";
import Revelar from "@/components/plataforma/Revelar";
import { LogoMarca } from "@/components/marca/Logo";
import { MARCA } from "@/lib/marca";
import { CARTAO_NO_PAINEL, PAINEL_SECAO } from "@/components/plataforma/painel";
import FaixaDestaques from "@/components/plataforma/FaixaDestaques";
import { DivisorMarajoara, FaixaMarajoara } from "@/components/marajoara/Grafismos";

import {
  IlustracaoAvaliacao,
  IlustracaoComprovante,
  IlustracaoCronograma,
  IlustracaoEquipe,
  IlustracaoProposta,
  IlustracaoSite,
  IlustracaoTrofeu,
} from "@/components/ilustracoes/Ilustracoes";

const PARA_ORGANIZACOES = [
  { Ilustracao: IlustracaoSite, titulo: "Crie a edição", texto: "Datas, regras de equipe, regulamento e temas, com página pública pronta." },
  { Ilustracao: IlustracaoComprovante, titulo: "Gerencie inscrições", texto: "Confira comprovantes de vínculo e acompanhe a homologação das equipes." },
  { Ilustracao: IlustracaoAvaliacao, titulo: "Avalie com rubrica", texto: "Distribua as propostas entre o comitê e avalie por critérios e pesos." },
  { Ilustracao: IlustracaoTrofeu, titulo: "Divulgue o resultado", texto: "Homologue o resultado, notifique as equipes e publique as aprovadas." },
];

const PARA_PARTICIPANTES = [
  { Ilustracao: IlustracaoCronograma, titulo: "Encontre um hackathon", texto: "Eventos de empresas e universidades num lugar só." },
  { Ilustracao: IlustracaoEquipe, titulo: "Monte sua equipe", texto: "Convide colegas, aceite os termos e conclua a inscrição." },
  { Ilustracao: IlustracaoProposta, titulo: "Envie a proposta", texto: "Escreva, salve rascunhos e envie com protocolo." },
];

// Card com a ilustração "saindo" pela borda de cima
function Passo({ Ilustracao, titulo, texto }: { Ilustracao: typeof IlustracaoSite; titulo: string; texto: string }) {
  return (
    <div className="group h-full pt-12">
      <div className={`relative h-full rounded-3xl border border-gray-200 ${CARTAO_NO_PAINEL} px-5 pb-6 pt-16 text-center transition-all duration-300 group-hover:-translate-y-1 group-hover:border-emerald-500/40 group-hover:bg-white group-hover:shadow-[0_14px_40px_-12px_rgba(16,185,129,0.4)]`}>
        <Ilustracao className="absolute -top-12 left-1/2 h-24 w-28 -translate-x-1/2 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105" />
        <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{texto}</p>
        <FaixaMarajoara variante="triangulos" className="absolute inset-x-10 bottom-3 opacity-30 transition-opacity group-hover:opacity-80" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-gray-700 selection:bg-emerald-500/30">
      <FundoAnimado trechos={false} />
      <section className="relative px-4 py-20 sm:px-6 md:py-32">
        {/* Palavras subindo só nesta parte de cima da home */}
        <TrechosSubindo className="trechos-secao pointer-events-none absolute inset-0 overflow-hidden" escalaDuracao={0.75} />
        <div className="relative mx-auto max-w-4xl text-center">
          <LogoMarca className="entrar mx-auto mb-8 h-16 w-16 dark:drop-shadow-[0_0_30px_rgba(16,185,129,0.55)]" />
          <h1 style={{ animationDelay: "160ms" }} className="entrar text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Organize e participe de{" "}
            <span className="texto-brilho bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
              hackathons
            </span>
          </h1>
          <p style={{ animationDelay: "240ms" }} className="entrar mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-700 md:text-lg">{MARCA.descricao}</p>
          <div style={{ animationDelay: "320ms" }} className="entrar mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/hackathons" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all hover:shadow-[0_0_35px_rgba(16,185,129,0.55)]">
              Encontrar hackathons <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/login?aba=organizacao" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-6 py-3.5 text-sm font-bold text-gray-900 hover:border-emerald-500/50">
              <Building2 className="h-4 w-4" aria-hidden="true" /> Organizar um hackathon
            </Link>
          </div>
        </div>
      </section>


      <Revelar>
        <HackathonsEmDestaque />
      </Revelar>

      <FaixaDestaques />

      <section id="organizacoes" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6">
        <div className={PAINEL_SECAO}>
        <Revelar>
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Para organizações</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Empresas e instituições de ensino cadastram a organização, montam a equipe interna
            (organizadores, comitê científico, mentores) e conduzem o hackathon do início ao fim.
          </p>
        </Revelar>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {PARA_ORGANIZACOES.map((p, i) => (
            <Revelar key={p.titulo} atraso={i * 90}>
              <Passo {...p} />
            </Revelar>
          ))}
        </div>
        <Link href="/login?aba=organizacao" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500">
          Cadastrar minha organização <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        </div>
      </section>

      <DivisorMarajoara className="my-6" />

      <section id="participantes" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6">
        <div className={PAINEL_SECAO}>
        <Revelar>
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Para participantes</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Crie sua conta grátis em um minuto. O comprovante de vínculo só é pedido quando você
            escolhe um hackathon.
          </p>
        </Revelar>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-3">
          {PARA_PARTICIPANTES.map((p, i) => (
            <Revelar key={p.titulo} atraso={i * 90}>
              <Passo {...p} />
            </Revelar>
          ))}
        </div>
        <Link href="/login?aba=cadastro" className="mt-8 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-bold text-gray-900 hover:border-emerald-500/50">
          Criar minha conta <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        </div>
      </section>

    </div>
  );
}
