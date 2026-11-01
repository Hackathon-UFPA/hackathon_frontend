"use client";

import Link from "next/link";
import { useSession } from "@/lib/useSession";

/**
 * O backend ainda NÃO tem rotas para criar ou alterar hackathon (não existe nada em
 * /hackathons além de /termos). A versão anterior desta tela chamava rotas inexistentes
 * e mostrava "sucesso" gravando só no localStorage, o que enganava quem a usava.
 *
 * Quando o backend publicar, por exemplo, POST/PATCH /admin/hackathons, o formulário
 * volta aqui chamando `request` em lib/api.ts.
 */
export default function AdminHackathonPage() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-lg bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-lg h-fit">
        <Link href="/admin" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold mb-6 inline-block">
          &larr; Voltar ao Painel Admin
        </Link>

        <h1 className="text-2xl font-bold text-white mb-3">Gerenciar Edição do Hackathon</h1>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs leading-relaxed space-y-2">
          <p>
            Esta tela ainda não pode gravar nada: a API não tem rota para criar ou editar o hackathon, os termos ou o
            status das inscrições.
          </p>
          <p>
            Enquanto isso, a edição precisa existir no banco com <span className="font-mono">status = INSCRICOES</span> e
            com o regulamento e o termo de consentimento vigentes (via migration ou seed). Sem isso, o cadastro de
            participantes responde 409.
          </p>
        </div>
      </div>
    </main>
  );
}
