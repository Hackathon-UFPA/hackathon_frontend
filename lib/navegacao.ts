import {
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Handshake,
  Mail,
  Megaphone,
  Rocket,
  Scale,
  Settings2,
  Sparkles,
  Trophy,
  UserCheck,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PapelUsuario } from "@/lib/api";

export type ItemNavegacao = {
  href: string;
  titulo: string;
  descricao?: string;
  icone: LucideIcon;
  papeis: PapelUsuario[];
  contador?: "comprovantes";
  aba?: string;
  desabilitado?: boolean;
};

export type GrupoNavegacao = {
  titulo: string;
  itens: ItemNavegacao[];
};

export const NAVEGACAO: GrupoNavegacao[] = [
  {
    titulo: "Participante",
    itens: [
      {
        href: "/equipe?aba=visao-geral",
        titulo: "Visão Geral",
        descricao: "Situação da conta, equipe e próximos passos",
        icone: Rocket,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "visao-geral",
      },
      {
        href: "/equipe?aba=inscricao",
        titulo: "Inscrição & Integrantes",
        descricao: "Crie a equipe, convide e gerencie integrantes",
        icone: Users,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "inscricao",
      },
      {
        href: "/equipe?aba=proposta",
        titulo: "Proposta Científica",
        descricao: "Crie, envie e acompanhe a proposta",
        icone: FileText,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "proposta",
      },
      {
        href: "/equipe?aba=resultado",
        titulo: "Resultado Científico",
        descricao: "Acompanhe a avaliação da proposta",
        icone: Scale,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "resultado",
      },
      {
        href: "/equipe?aba=mentoria",
        titulo: "Mentoria & Entregas",
        descricao: "Mentor, prazos e entregas parciais",
        icone: ClipboardList,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "mentoria",
      },
    ],
  },
  {
    titulo: "Minha conta",
    itens: [
      {
        href: "/perfil",
        titulo: "Meu perfil",
        descricao: "Dados da sua conta",
        icone: UserCircle,
        papeis: [
          "PARTICIPANTE",
          "MENTOR",
          "ORGANIZADOR",
          "COMITE_CIENTIFICO",
          "DEV",
        ],
      },
      {
        href: "/equipe?aba=convites-conta",
        titulo: "Conta & Convites",
        descricao: "Comprovante de vínculo e convites recebidos",
        icone: ClipboardCheck,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "convites-conta",
      },
    ],
  },
  {
    titulo: "Plataforma",
    itens: [
      {
        href: "/cronograma",
        titulo: "Cronograma",
        descricao: "Datas e etapas do hackathon",
        icone: CalendarDays,
        papeis: [
          "PARTICIPANTE",
          "MENTOR",
          "ORGANIZADOR",
          "COMITE_CIENTIFICO",
          "DEV",
        ],
      },
    ],
  },
  {
    titulo: "Avaliação",
    itens: [
      {
        href: "/avaliador",
        titulo: "Minhas avaliações",
        descricao: "Propostas designadas para você",
        icone: Scale,
        papeis: ["COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/admin/avaliacoes/configuracao",
        titulo: "Configuração",
        descricao: "Defina avaliadores por proposta",
        icone: Settings2,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/avaliacoes",
        titulo: "Distribuição",
        descricao: "Distribua propostas ao comitê",
        icone: Users,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/resultado",
        titulo: "Resultado",
        descricao: "Homologue e divulgue aprovados",
        icone: Trophy,
        papeis: ["ORGANIZADOR", "DEV"],
      },
    ],
  },
  {
    titulo: "Preparação",
    itens: [
      {
        href: "/admin/termos",
        titulo: "Regulamento e termos",
        descricao: "Rascunhos e versões vigentes",
        icone: FileText,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/conteudo",
        titulo: "Página pública",
        descricao: "Apoiadores, cronograma e FAQ",
        icone: Megaphone,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/temas",
        titulo: "Temas",
        descricao: "Temas disponíveis às equipes",
        icone: Sparkles,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/rubrica",
        titulo: "Rubrica de avaliação",
        descricao: "Critérios e pesos",
        icone: Scale,
        papeis: ["ORGANIZADOR", "DEV"],
      },
    ],
  },
  {
    titulo: "Mentoria",
    itens: [
      {
        href: "/mentor",
        titulo: "Minhas equipes",
        descricao: "Equipes que você acompanha",
        icone: UserCheck,
        papeis: ["MENTOR", "DEV"],
      },
      {
        href: "/admin/treinamento",
        titulo: "Treinamento",
        descricao: "Sessões, materiais e conclusão",
        icone: GraduationCap,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/mentores",
        titulo: "Mentores",
        descricao: "Cadastre e convide mentores",
        icone: Handshake,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/admin/mentoria",
        titulo: "Mentoria das equipes",
        descricao: "Escolha o mentor de cada equipe",
        icone: UserCheck,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/admin/mentoria/marcos",
        titulo: "Calendário de entregas",
        descricao: "Marcos e prazos das equipes",
        icone: CalendarClock,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      {
        href: "/admin",
        titulo: "Painel Admin",
        descricao: "Visão geral e pendências",
        icone: Settings2,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/admin/hackathon",
        titulo: "Hackathons",
        descricao: "Crie e gerencie hackathons",
        icone: Rocket,
        papeis: ["ORGANIZADOR", "DEV"],
      },
      {
        href: "/admin/comprovantes",
        titulo: "Comprovantes",
        descricao: "Aprove o vínculo dos participantes",
        icone: ClipboardCheck,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
        contador: "comprovantes",
      },
      {
        href: "/admin/organizacao",
        titulo: "Organização",
        descricao: "Dados da organização e comitê",
        icone: Building2,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/admin/usuarios",
        titulo: "Equipe e acessos",
        descricao: "Gerencie contas e permissões",
        icone: UserCog,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/admin/emails",
        titulo: "Fila de e-mails",
        descricao: "Acompanhe envios e reenvios",
        icone: Mail,
        papeis: ["ORGANIZADOR", "DEV"],
      },
    ],
  },
];

export function filtrarNavegacao(
  grupos: GrupoNavegacao[],
  papel: PapelUsuario
): GrupoNavegacao[] {
  return grupos
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter(
        (item) => papel === "DEV" || item.papeis.includes(papel)
      ),
    }))
    .filter((grupo) => grupo.itens.length > 0);
}