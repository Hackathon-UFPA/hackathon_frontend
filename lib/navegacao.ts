import {
  ClipboardCheck,
  FileText,
  Rocket,
  Scale,
  Settings2,
  Users,
  UserCheck,
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
        href: "/equipe",
        titulo: "Minha equipe",
        descricao: "Equipe, integrantes e convites",
        icone: Users,
        papeis: ["PARTICIPANTE", "MENTOR", "ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/inscricao",
        titulo: "Inscrição",
        descricao: "Equipe, integrantes e conta",
        icone: ClipboardCheck,
        papeis: ["PARTICIPANTE", "MENTOR", "ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/proposta",
        titulo: "Proposta",
        descricao: "Crie e envie a proposta da equipe",
        icone: FileText,
        papeis: ["PARTICIPANTE", "MENTOR", "ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
      },
      {
        href: "/cronograma",
        titulo: "Cronograma",
        descricao: "Datas e etapas do hackathon",
        icone: Rocket,
        papeis: ["PARTICIPANTE", "MENTOR", "ORGANIZADOR", "COMITE_CIENTIFICO", "DEV"],
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