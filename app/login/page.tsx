"use client";
import CadastroForm from "@/components/auth/CadastroForm";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ApiError,
  auth,
  destinoInterno,
  destinoPorPapel,
  getToken,
  getUser,
  type PapelUsuario,
} from "@/lib/api";

const inp =
  "w-full bg-[#0A1110] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-xs uppercase text-gray-400 mb-1 font-semibold";
const btn =
  "w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer mt-2";

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      {children}
      {erro && <span className="block text-red-400 text-xs mt-1">{erro}</span>}
    </label>
  );
}

// Volta à página que pediu o login (?proximo=); sem ela, vai ao painel do perfil.
function destinoAposLogin(papel: PapelUsuario) {
  const proximo = new URLSearchParams(window.location.search).get("proximo");
  return destinoInterno(proximo) ?? destinoPorPapel(papel);
}

export default function AuthPage() {
  const router = useRouter();
  const [aba, setAba] = useState<"login" | "cadastro">("login");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const [login, setLogin] = useState({ email: "", senha: "" });

  // Quem já tem sessão válida não precisa ver o formulário de login.
  useEffect(() => {
    const usuario = getToken() ? getUser() : null;
    if (usuario) router.replace(destinoAposLogin(usuario.papel));
  }, [router]);

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
      router.push(destinoAposLogin(t.usuario.papel));
    } catch (err) {
      tratar(err);
    } finally {
      setLoading(false);
    }
  };

  const abaCls = (a: string) =>
    `flex-1 py-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${aba === a ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-400"
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
          <ApiErrorAlert
            erro={erro}
            onClose={() => setErro(null)}
          />
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
          <CadastroForm
            onCadastrado={(email) => {
              setLogin({ email, senha: "" });
              trocarAba("login");
              setAviso(
                "Conta criada! Ela fica pendente até o Comitê validar seu comprovante. Você já pode entrar para acompanhar a situação."
              );
            }}
          />
        )}
      </div>
    </main>
  );
}
