"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  formatarDataBrasilia,
  hackathons as hackathonsApi,
  type HackathonResponse,
} from "@/lib/api";
import {
  distribuicaoApi,
} from "@/lib/api-avaliacao";
import { useSession } from "@/lib/useSession";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";

/**
 * Configuração da avaliação científica (RF29). Somente Organizador.
 * Define quantos avaliadores do Comitê Científico lerão cada proposta.
 * A alteração vale para as próximas distribuições; designações já feitas não mudam.
 */

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm disabled:opacity-60";
const lbl = "block text-[11px] uppercase text-gray-600 mb-1 font-semibold";

function ConteudoConfiguracao() {
  const { pronto } = useSession(["ORGANIZADOR"]);
  const searchParams = useSearchParams();

  const [edicoes, setEdicoes] = useState<HackathonResponse[]>([]);
  const [hackathonId, setHackathonId] = useState("");
  const [qtdEditada, setQtdEditada] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  useEffect(() => {
  if (!pronto) return;

  hackathonsApi
    .daMinhaOrganizacao()
    .then((lst) => {
      setEdicoes(lst);

      const daUrl = searchParams.get("hackathon_id");
      const alvo =
        lst.find((h) => h.id === daUrl) ??
        lst.find((h) => h.status === "ATIVO") ??
        lst.find((h) => h.status === "INSCRICOES_ENCERRADAS") ??
        lst.find((h) => h.status === "INSCRICOES") ??
        lst[0];

      setHackathonId(alvo?.id ?? "");
      setCarregando(false);
    })
    .catch((e) => {
      setErro(e);
      setCarregando(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pronto]);

  const edicao = edicoes.find((h) => h.id === hackathonId);
  const qtd = edicao?.avaliadores_por_proposta ?? null;
  const qtdForm = qtdEditada ?? (qtd ? String(qtd) : "");

  const trocarEdicao = (id: string) => {
    setHackathonId(id);
    setQtdEditada(null);
    setMensagem(null);
    setErro(null);
  };

  const salvar = async () => {
    const n = Number(qtdForm);

    if (n !== 2 && n !== 3) {
      setErro("Escolha 2 ou 3 avaliadores por proposta.");
      return;
    }

    setSalvando(true);
    setMensagem(null);
    setErro(null);

    try {
      const r = await distribuicaoApi.configurar(hackathonId, n);

      setEdicoes((lst) =>
        lst.map((h) =>
          h.id === hackathonId
            ? { ...h, avaliadores_por_proposta: r.avaliadores_por_proposta }
            : h
        )
      );

      setQtdEditada(null);
      setMensagem(
        `Configuração salva: ${r.avaliadores_por_proposta} avaliadores por proposta. Vale para as próximas distribuições; designações já feitas não mudam.`
      );
    } catch (e) {
      setErro(e);
    } finally {
      setSalvando(false);
    }
  };

  if (!pronto) return null;

  return (
    <main className="min-h-screen bg-[#F6F9F8] text-gray-700 p-6 flex justify-center selection:bg-emerald-500/30">
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl border border-emerald-100 shadow-lg h-fit space-y-6">
        <Link
          href="/admin"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-block"
        >
          &larr; Voltar ao Painel Admin
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Configuração de Avaliação
          </h1>
          <p className="text-xs text-gray-600">
            Defina quantos avaliadores do Comitê Científico lerão cada proposta.
            A configuração vale para as próximas distribuições; designações já
            feitas não são alteradas.
          </p>
        </div>

        {mensagem && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs">
            {mensagem}
          </div>
        )}

        {erro !== null && (
          <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />
        )}

        <div>
          <label className={lbl} htmlFor="sel-edicao-configuracao">
            Edição
          </label>

          <select
            id="sel-edicao-configuracao"
            className={inp}
            value={hackathonId}
            onChange={(e) => trocarEdicao(e.target.value)}
          >
            {edicoes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome || "Sem nome"} ({h.status ?? "—"})
              </option>
            ))}
          </select>

          {edicao && (
            <p className="text-[11px] text-gray-500 mt-1">
              Início das inscrições:{" "}
              {edicao.inscricoes_inicio
                ? formatarDataBrasilia(edicao.inscricoes_inicio)
                : "não definido"}
            </p>
          )}
        </div>

        {!hackathonId && !carregando ? (
          <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            Nenhuma edição cadastrada.
          </p>
        ) : carregando ? (
          <p className="text-emerald-700 text-xs font-mono">
            Carregando configuração...
          </p>
        ) : (
          <section className="bg-[#F6F9F8] border border-gray-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-gray-900">
              Avaliadores por proposta
            </h2>

            <p className="text-[11px] text-gray-500">
              Atual:{" "}
              <strong className="text-gray-700">
                {qtd ?? "não configurado"}
              </strong>
              . Mudar o valor não altera designações já feitas.
            </p>

            <div className="flex gap-2">
              <select
                aria-label="Avaliadores por proposta"
                className={inp}
                value={qtdForm}
                onChange={(e) => setQtdEditada(e.target.value)}
              >
                <option value="" disabled>
                  Escolha...
                </option>
                <option value="2">2 avaliadores</option>
                <option value="3">3 avaliadores</option>
              </select>

              <button
                type="button"
                onClick={salvar}
                disabled={
                  salvando ||
                  !qtdForm ||
                  Number(qtdForm) === qtd
                }
                className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function AdminConfiguracaoAvaliacaoPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoConfiguracao />
    </Suspense>
  );
}