import { ChevronDown } from "lucide-react";
import type { FaqPublico } from "@/lib/api-conteudo";

/** Perguntas publicadas, na ordem definida pela organização. */
export default function FaqPublica({ itens }: { itens: FaqPublico[] }) {
  return (
    <ul className="divide-y divide-gray-100">
      {itens.map((f) => (
        <li key={f.id}>
          <details className="group py-3">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-gray-900 hover:text-emerald-800 [&::-webkit-details-marker]:hidden">
              {f.pergunta}
              <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{f.resposta}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
