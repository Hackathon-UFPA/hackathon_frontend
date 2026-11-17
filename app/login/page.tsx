"use client";

import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FundoAnimado from "@/components/plataforma/FundoAnimado";
import { LogoMarca } from "@/components/marca/Logo";
import {
  ApiError,
  auth,
  enviarArquivoComprovante,
  ROTULO_TIPO_ORGANIZACAO,
  type PapelUsuario,
  type TipoOrganizacao,
} from "@/lib/api";

const inp =
  "w-full bg-[#F6F9F8] border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-emerald-500 focus:outline-none text-sm";
const lbl = "block text-xs uppercase text-gray-600 mb-1 font-semibold";
const btn =
  "w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm cursor-pointer mt-2";

type Aba = "login" | "cadastro" | "organizacao";

function Campo({
  label,
  erro,
  dica,
  children,
}: {
  label: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
      {dica && !erro && <p className="text-[11px] text-gray-500 mt-1">{dica}</p>}
      {erro && <p className="text-red-600 text-xs mt-1">{erro}</p>}
    </div>
  );
}

function destinoPorPapel(papel: PapelUsuario) {
  if (papel === "ORGANIZADOR" || papel === "COMITE_CIENTIFICO" || papel === "DEV") {
    return "/admin";
  }
  if (papel === "PARTICIPANTE") return "/equipe";
  if (papel === "MENTOR") return "/mentor";
  return "/";
}

/** Só aceita caminhos internos, para o `?next=` não virar redirecionamento aberto. */
function destinoSeguro(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

const DICA_SENHA = "8 a 128 caracteres, com ao menos uma letra e um número.";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaParametro = searchParams.get("aba");
  const next = destinoSeguro(searchParams.get("next"));

  const abaDoParametro = (): Aba =>
    abaParametro === "cadastro" || abaParametro === "organizacao" ? abaParametro : "login";

  const [aba, setAba] = useState<Aba>(abaDoParametro);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const [login, setLogin] = useState({ email: "", senha: "" });
  const [cad, setCad] = useState({
    nome: "",
    email: "",
    senha: "",
    instituicao: "",
    curso: "",
    periodo: "",
  });
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [org, setOrg] = useState({
    nome: "",
    tipo: "INSTITUICAO_ENSINO" as TipoOrganizacao,
    site: "",
    descricao: "",
    responsavelNome: "",
    email: "",
    senha: "",
  });

  useEffect(() => {
    setAba(abaDoParametro());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaParametro]);

  const trocarAba = (novaAba: Aba) => {
    setAba(novaAba);
    setErro(null);
    setFields({});
  };

  const tratar = (err: unknown) => {
    if (err instanceof ApiError) {
      setFields(err.fields);
      if (err.status === 429) {
        const min = err.retryAfter ? Math.ceil(err.retryAfter / 60) : null;
        setErro(
          `Conta bloqueada por tentativas incorretas. Tente novamente ${
            min ? `em ${min} min` : "mais tarde"
          }.`
        );
      } else {
        setErro(err.message);
      }
    } else {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    }
  };

  const executar = async (acao: () => Promise<void>) => {
    setLoading(true);
    setErro(null);
    setFields({});
    try {
      await acao();
    } catch (err) {
      tratar(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executar(async () => {
      const resposta = await auth.login(login.email.toLowerCase().trim(), login.senha);
      router.push(next ?? destinoPorPapel(resposta.usuario.papel));
    });
  };

  // Cadastro de participante (RF01): o comprovante de vínculo vai junto e a conta nasce
  // pendente até a organização aprovar o comprovante. A pessoa já consegue entrar.
  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprovante) {
      setErro("Anexe o comprovante de vínculo (PDF, PNG ou JPG).");
      return;
    }
    executar(async () => {
      const email = cad.email.toLowerCase().trim();
      // O arquivo vai direto ao serviço de armazenamento; a API recebe só o link.
      const comprovanteUrl = await enviarArquivoComprovante(comprovante);
      await auth.cadastrar({
        nome: cad.nome.trim(),
        email,
        senha: cad.senha,
        instituicao: cad.instituicao.trim(),
        curso: cad.curso.trim(),
        periodo: Number(cad.periodo),
        comprovante_url: comprovanteUrl,
      });
      await auth.login(email, cad.senha);
      router.push(next ?? "/hackathons");
    });
  };

  const handleOrganizacao = (e: React.FormEvent) => {
    e.preventDefault();
    executar(async () => {
      await auth.cadastrarOrganizacao({
        organizacao: {
          nome: org.nome.trim(),
          tipo: org.tipo,
          site: org.site.trim() || null,
          descricao: org.descricao.trim() || null,
        },
        responsavel: {
          nome: org.responsavelNome.trim(),
          email: org.email.toLowerCase().trim(),
          senha: org.senha,
        },
      });
      router.push("/admin/hackathon");
    });
  };

  const abaCls = (abaAtual: Aba) =>
    `flex-1 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
      aba === abaAtual
        ? "border-emerald-500 text-emerald-700"
        : "border-transparent text-gray-600 hover:text-gray-800"
    }`;

  // Erros de validação do cadastro de organização vêm como "organizacao.nome" etc.
  const f = (campo: string) => fields[campo] ?? fields[campo.split(".").pop() ?? campo];

  return (
    <main className="relative min-h-screen text-gray-700 font-sans flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30">
      <FundoAnimado intensidade="suave" />
      <div className="entrar w-full max-w-md bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-emerald-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        <LogoMarca className="mx-auto mb-4 h-10 w-10 drop-shadow-[0_0_18px_rgba(16,185,129,0.5)]" />
        <Link
          href="/"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold mb-6 inline-block"
        >
          &larr; Voltar ao início
        </Link>

        <div className="flex border-b border-gray-200 mb-6" role="tablist">
          <button type="button" role="tab" aria-selected={aba === "login"} onClick={() => trocarAba("login")} className={abaCls("login")}>
            Entrar
          </button>
          <button type="button" role="tab" aria-selected={aba === "cadastro"} onClick={() => trocarAba("cadastro")} className={abaCls("cadastro")}>
            Sou participante
          </button>
          <button type="button" role="tab" aria-selected={aba === "organizacao"} onClick={() => trocarAba("organizacao")} className={abaCls("organizacao")}>
            Quero organizar
          </button>
        </div>

        {erro && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}

        {aba === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Campo label="E-mail *" erro={fields.email}>
              <input required type="email" autoComplete="email" className={inp} value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
            </Campo>
            <Campo label="Senha *" erro={fields.senha}>
              <input required type="password" autoComplete="current-password" className={inp} value={login.senha} onChange={(e) => setLogin({ ...login, senha: e.target.value })} />
            </Campo>
            <div className="-mt-2 text-right">
              <Link href="/esqueci-senha" className="text-xs font-semibold text-emerald-700 hover:text-emerald-600">
                Esqueci minha senha
              </Link>
            </div>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Autenticando..." : "Entrar →"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Ainda não tem conta?{" "}
              <button type="button" onClick={() => trocarAba("cadastro")} className="text-emerald-700 hover:underline cursor-pointer">
                Cadastre-se grátis
              </button>
            </p>
          </form>
        )}

        {aba === "cadastro" && (
          <form onSubmit={handleCadastro} className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Crie sua conta para participar de hackathons de empresas e universidades. Envie o
              comprovante de vínculo (matrícula, crachá, contrato): sua conta fica pendente até a
              organização aprovar, mas você já consegue entrar.
            </p>
            <Campo label="Nome completo *" erro={fields.nome}>
              <input required autoComplete="name" className={inp} value={cad.nome} onChange={(e) => setCad({ ...cad, nome: e.target.value })} />
            </Campo>
            <Campo label="E-mail *" erro={fields.email}>
              <input required type="email" autoComplete="email" className={inp} value={cad.email} onChange={(e) => setCad({ ...cad, email: e.target.value })} />
            </Campo>
            <Campo label="Senha *" erro={fields.senha} dica={DICA_SENHA}>
              <input required type="password" autoComplete="new-password" minLength={8} className={inp} value={cad.senha} onChange={(e) => setCad({ ...cad, senha: e.target.value })} />
            </Campo>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_6rem] gap-3">
              <Campo label="Instituição *" erro={fields.instituicao}>
                <input required className={inp} value={cad.instituicao} onChange={(e) => setCad({ ...cad, instituicao: e.target.value })} />
              </Campo>
              <Campo label="Período *" erro={fields.periodo}>
                <input required type="number" min={1} className={inp} value={cad.periodo} onChange={(e) => setCad({ ...cad, periodo: e.target.value })} />
              </Campo>
            </div>
            <Campo label="Curso *" erro={fields.curso}>
              <input required className={inp} value={cad.curso} onChange={(e) => setCad({ ...cad, curso: e.target.value })} />
            </Campo>
            <Campo label="Comprovante de vínculo *" erro={fields.comprovante_url}>
              <input
                required
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className={`${inp} file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
                onChange={(e) => setComprovante(e.target.files?.[0] ?? null)}
              />
            </Campo>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Criando conta..." : "Criar conta →"}
            </button>
          </form>
        )}

        {aba === "organizacao" && (
          <form onSubmit={handleOrganizacao} className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Cadastre sua empresa ou instituição de ensino para criar e gerenciar hackathons:
              inscrições, equipes, temas, avaliação e resultado.
            </p>
            <Campo label="Nome da organização *" erro={f("organizacao.nome")}>
              <input required className={inp} value={org.nome} onChange={(e) => setOrg({ ...org, nome: e.target.value })} />
            </Campo>
            <Campo label="Tipo *" erro={f("organizacao.tipo")}>
              <select className={inp} value={org.tipo} onChange={(e) => setOrg({ ...org, tipo: e.target.value as TipoOrganizacao })}>
                {(Object.keys(ROTULO_TIPO_ORGANIZACAO) as TipoOrganizacao[]).map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO_ORGANIZACAO[t]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Site" erro={f("organizacao.site")}>
              <input type="url" placeholder="https://" className={inp} value={org.site} onChange={(e) => setOrg({ ...org, site: e.target.value })} />
            </Campo>
            <Campo label="Sobre a organização" erro={f("organizacao.descricao")}>
              <textarea rows={2} maxLength={2000} className={inp} value={org.descricao} onChange={(e) => setOrg({ ...org, descricao: e.target.value })} />
            </Campo>

            <p className="text-xs uppercase text-emerald-600 font-bold pt-2 border-t border-gray-200">
              Responsável (primeiro organizador)
            </p>
            <Campo label="Seu nome *">
              <input required autoComplete="name" className={inp} value={org.responsavelNome} onChange={(e) => setOrg({ ...org, responsavelNome: e.target.value })} />
            </Campo>
            <Campo label="E-mail *" erro={fields.email}>
              <input required type="email" autoComplete="email" className={inp} value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
            </Campo>
            <Campo label="Senha *" erro={fields.senha} dica={DICA_SENHA}>
              <input required type="password" autoComplete="new-password" minLength={8} className={inp} value={org.senha} onChange={(e) => setOrg({ ...org, senha: e.target.value })} />
            </Campo>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Cadastrando..." : "Cadastrar organização →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
