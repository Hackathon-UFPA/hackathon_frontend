import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Rocket,
  Scale,
  Settings2,
  UserCircle,
  UserCheck,
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
  papeis: ["PARTICIPANTE", "DEV"],
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
    titulo: "Em breve",
    itens: [
      {
        href: "/equipe?aba=visao-geral",
        titulo: "Entregas & Chat",
        descricao: "Disponível em uma próxima fase",
        icone: MessageSquare,
        papeis: ["PARTICIPANTE", "DEV"],
        aba: "visao-geral",
        desabilitado: true,
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
    ],
  },
  {
    titulo: "Administração",
    itens: [
      {
        href: "/admin",
        titulo: "Painel Admin",
        descricao: "Gerencie hackathons e avaliações",
        icone: Settings2,
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
        href: "/admin/mentoria",
        titulo: "Mentoria",
        descricao: "Equipes e mentores",
        icone: UserCheck,
        papeis: ["ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
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