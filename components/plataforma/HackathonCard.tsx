import Link from "next/link";
import { Building2, CalendarDays, MapPin } from "lucide-react";
import type { HackathonResponse } from "@/lib/api";
import { CantoMarajoara } from "@/components/marajoara/Grafismos";
import { COR_STATUS, ROTULO_STATUS, periodo } from "./hackathon-util";

export default function HackathonCard({ hackathon }: { hackathon: HackathonResponse }) {
  const status = hackathon.status ?? "INSCRICOES";
  const datas = periodo(hackathon.data_inicio, hackathon.data_fim);
  return (
    <Link
      href={`/hackathons/${hackathon.id}`}
      className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white/85 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.35)]"
    >
      <CantoMarajoara canto="sup-dir" className="h-7 w-7 opacity-30 transition-opacity group-hover:opacity-90" />
      <span className={`self-start rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${COR_STATUS[status]}`}>
        {ROTULO_STATUS[status]}
      </span>
      <h3 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-emerald-700">
        {hackathon.nome || "Hackathon sem nome"}
      </h3>
      {hackathon.tema && <p className="mt-1 text-sm text-emerald-800">{hackathon.tema}</p>}
      {hackathon.descricao && (
        <p className="mt-2 line-clamp-3 text-sm text-gray-600">{hackathon.descricao}</p>
      )}
      <div className="mt-auto space-y-1.5 pt-4 text-xs text-gray-600">
        {hackathon.organizacao_nome && (
          <p className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {hackathon.organizacao_nome}
          </p>
        )}
        {datas && (
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {datas}
          </p>
        )}
        {hackathon.local && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {hackathon.local}
          </p>
        )}
      </div>
    </Link>
  );
}
