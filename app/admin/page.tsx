"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { useSession } from "@/lib/useSession";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, pronto } = useSession(["ORGANIZADOR", "COMITE_CIENTIFICO"]);

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 p-8 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-2xl bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-lg h-fit">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold">
            &larr; Voltar ao início
          </Link>
          <button
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 text-xs rounded-lg text-white font-bold cursor-pointer"
            onClick={() => {
              auth.logout();
              router.push("/login");
            }}
          >
            Sair
          </button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Painel de Administração</h1>
        <p className="text-xs text-gray-400 mb-8">
          Logado como {user?.nome || user?.email} ({user?.papel})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/comprovantes"
            className="p-6 bg-[#0A1110] border border-gray-800 hover:border-emerald-500/50 rounded-xl transition-all group"
          >
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              Aprovar Comprovantes
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Fila de comprovantes: aprove para ativar a conta ou recuse com motivo.
            </p>
          </Link>

          <Link
            href="/admin/hackathon"
            className="p-6 bg-[#0A1110] border border-gray-800 hover:border-amber-500/50 rounded-xl transition-all group"
          >
            <div className="text-2xl mb-2">🏆</div>
            <h2 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              Hackathon
            </h2>
            <p className="text-xs text-gray-400 mt-1">Depende de rotas que o backend ainda não tem.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
