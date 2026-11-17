// Ícone e cores de cada tipo da central de notificações, usados pelo sino e pela página.

import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Notificacao, TipoNotificacao } from "@/lib/api-participante";

const ICONE: Record<TipoNotificacao, LucideIcon> = {
  CONVITE: Mail,
  ACEITE: UserCheck,
  INSCRICAO: ClipboardCheck,
  PROPOSTA: FileText,
  RESULTADO: CheckCircle2,
  MENTOR: GraduationCap,
  CHAT: MessageSquare,
  PRAZO: Clock,
};

const COR: Record<TipoNotificacao, string> = {
  CONVITE: "bg-sky-50 text-sky-700",
  ACEITE: "bg-emerald-50 text-emerald-700",
  INSCRICAO: "bg-emerald-50 text-emerald-700",
  PROPOSTA: "bg-violet-50 text-violet-700",
  RESULTADO: "bg-emerald-50 text-emerald-700",
  MENTOR: "bg-amber-50 text-amber-700",
  CHAT: "bg-sky-50 text-sky-700",
  PRAZO: "bg-orange-50 text-orange-700",
};

export function IconeNotificacao({ n, tamanho = "md" }: { n: Notificacao; tamanho?: "sm" | "md" }) {
  const reprovada = n.tipo === "RESULTADO" && !n.aprovada;
  const recusa = n.tipo === "ACEITE" && n.dados?.resposta === "RECUSADO";
  const Icone = reprovada ? XCircle : ICONE[n.tipo] ?? Mail;
  const cor = reprovada || recusa ? "bg-red-50 text-red-600" : COR[n.tipo] ?? "bg-gray-100 text-gray-600";
  const caixa = tamanho === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const icone = tamanho === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className={`flex shrink-0 items-center justify-center ${caixa} ${cor}`} aria-hidden="true">
      <Icone className={icone} />
    </span>
  );
}
