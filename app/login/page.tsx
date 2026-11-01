"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, auth, enviarArquivoComprovante, type PapelUsuario } from "@/lib/api";

const inp =
  "w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-xs uppercase text-gray-400 mb-1 font-semibold";
const btn =
  "w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer mt-2";

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
      {erro && <p className="text-red-400 text-xs mt-1">{erro}</p>}
    </div>
  );
}

function destinoPorPapel(papel: PapelUsuario) {
  if (papel === "ORGANIZADOR" || papel === "COMITE_CIENTIFICO" || papel === "DEV") return "/admin";
  if (papel === "PARTICIPANTE") return "/inscricao";
  return "/";
}

export default function AuthPage() {
  const router = useRouter();
  const [aba, setAba] = useState<"login" | "cadastro">("login");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const [login, setLogin] = useState({ email: "", senha: "" });
  const [cad, setCad] = useState({ nome: "", email: "", senha: "", instituicao: "", curso: "", periodo: "" });
  const [arquivo, setArquivo] = useState<File | null>(null);

  const trocarAba = (a: "login" | "cadastro") => {
    setAba(a);
    setErro(null);
    setAviso(null);
    setFields({});
  };

  const tratar = (err: unknown) => {
    if (err instanceof ApiError) {
      setFields(err.fields);
      if (err.status === 429) {
        const min = err.retryAfter ? Math.ceil(err.retryAfter / 60) : null;
        setErro(
          `Conta bloqueada por tentativas incorretas. Tente novamente ${min ? `em ${min} min` : "mais tarde"}.`
        );
      } else {
        setErro(err.message);
      }
    } else {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setAviso(null);
    try {
      const t = await auth.login(login.email.toLowerCase().trim(), login.senha);
      router.push(destinoPorPapel(t.usuario.papel));
    } catch (err) {
      tratar(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setFields({});
    try {
      if (!arquivo) throw new Error("Anexe o comprovante de vínculo (PDF, PNG ou JPG, até 10 MB).");
      const comprovante_url = await enviarArquivoComprovante(arquivo);
      const email = cad.email.toLowerCase().trim();
      await auth.cadastrar({
        nome: cad.nome.trim(),
        email,
        senha: cad.senha,
        instituicao: cad.instituicao.trim(),
        curso: cad.curso.trim(),
        periodo: Number(cad.periodo),
        comprovante_url,
      });
      setLogin({ email, senha: "" });
      setCad({ nome: "", email: "", senha: "", instituicao: "", curso: "", periodo: "" });
      setArquivo(null);
      setAba("login");
      setAviso(
        "Conta criada! Ela fica pendente até o Comitê validar seu comprovante. Você já pode entrar para acompanhar a situação."
      );
    } catch (err) {
      tratar(err);
    } finally {
      setLoading(false);
    }
  };

  const abaCls = (a: string) =>
    `flex-1 py-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
      aba === a ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-400"
    }`;

  return (
    <main className="min-h-screen bg-[#0A1110] text-gray-300 font-sans flex items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="w-full max-w-md bg-[#131D1C] p-8 rounded-2xl border border-emerald-900/50 shadow-xl">
        <Link href="/" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold mb-6 inline-block">
          &larr; Voltar ao início
        </Link>

        <div className="flex border-b border-gray-800 mb-6">
          <button type="button" onClick={() => trocarAba("login")} className={abaCls("login")}>
            Entrar
          </button>
          <button type="button" onClick={() => trocarAba("cadastro")} className={abaCls("cadastro")}>
            Criar Conta
          </button>
        </div>

        {aviso && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs leading-relaxed">
            {aviso}
          </div>
        )}
        {erro && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">⚠️ {erro}</div>
        )}

        {aba === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Campo label="E-mail *" erro={fields.email}>
              <input
                required
                type="email"
                autoComplete="email"
                className={inp}
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
              />
            </Campo>
            <Campo label="Senha *" erro={fields.senha}>
              <input
                required
                type="password"
                autoComplete="current-password"
                className={inp}
                value={login.senha}
                onChange={(e) => setLogin({ ...login, senha: e.target.value })}
              />
            </Campo>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Autenticando..." : "Entrar no Sistema →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCadastro} className="space-y-4">
            <Campo label="Nome Completo *" erro={fields.nome}>
              <input
                required
                className={inp}
                value={cad.nome}
                onChange={(e) => setCad({ ...cad, nome: e.target.value })}
              />
            </Campo>
            <Campo label="E-mail *" erro={fields.email}>
              <input
                required
                type="email"
                autoComplete="email"
                className={inp}
                value={cad.email}
                onChange={(e) => setCad({ ...cad, email: e.target.value })}
              />
            </Campo>
            <Campo label="Senha *" erro={fields.senha}>
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                className={inp}
                value={cad.senha}
                onChange={(e) => setCad({ ...cad, senha: e.target.value })}
              />
              <p className="text-[11px] text-gray-500 mt-1">8 a 128 caracteres, com ao menos uma letra e um número.</p>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Instituição *" erro={fields.instituicao}>
                <input
                  required
                  className={inp}
                  value={cad.instituicao}
                  onChange={(e) => setCad({ ...cad, instituicao: e.target.value })}
                />
              </Campo>
              <Campo label="Período *" erro={fields.periodo}>
                <input
                  required
                  type="number"
                  min={1}
                  className={inp}
                  value={cad.periodo}
                  onChange={(e) => setCad({ ...cad, periodo: e.target.value })}
                />
              </Campo>
            </div>
            <Campo label="Curso *" erro={fields.curso}>
              <input
                required
                className={inp}
                value={cad.curso}
                onChange={(e) => setCad({ ...cad, curso: e.target.value })}
              />
            </Campo>
            <Campo label="Comprovante de vínculo *" erro={fields.comprovante_url}>
              <input
                required
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:cursor-pointer"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-gray-500 mt-1">PDF, PNG ou JPG, até 10 MB.</p>
            </Campo>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Enviando..." : "Cadastrar Participante →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
