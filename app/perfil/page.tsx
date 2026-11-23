"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  IdCard,
  KeyRound,
  LogOut,
  Mail,
  MailWarning,
  UserRound,
} from "lucide-react";

import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { Campo, DICA_SENHA, inp } from "@/components/auth/CartaoAuth";
import AppShell from "@/components/layout/AppShell";
import { useSession } from "@/lib/useSession";
import { NAVEGACAO } from "@/lib/navegacao";
import {
  ApiError,
  auth,
  comprovantes as comprovantesApi,
  equipes as equipesApi,
  formatarDataBrasilia,
  hackathons as hackathonsApi,
  type HackathonResponse,
  perfil as perfilApi,
  type PapelUsuario,
  type PerfilUpdate,
  type Usuario,
} from "@/lib/api";
import {
  autodeclaracao as autodeclaracaoApi,
  ROTULO_TIPO_INTEGRANTE,
  type AutodeclaracaoEnvio,
  type SituacaoAutodeclaracao,
  type TipoIntegrante,
} from "@/lib/api-participante";
import { inscricoesAbertas } from "@/components/plataforma/hackathon-util";

const ROTULO_PAPEL: Record<PapelUsuario, string> = {
  PARTICIPANTE: "Participante",
  ORGANIZADOR: "Organizador",
  COMITE_CIENTIFICO: "Comitê Científico",
  COMITE_TECNICO: "Comitê Técnico",
  MENTOR: "Mentor",
  DEV: "Desenvolvedor",
} as Record<PapelUsuario, string>;

const btnPrimario =
  "inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer";

const btnSecundario =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 cursor-pointer";

type Aviso = {
  tipo: "ok" | "erro";
  erro?: unknown;
  texto?: string;
} | null;

function Secao({
  icone,
  titulo,
  descricao,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icone}
        </span>

        <div>
          <h2 className="text-base font-bold text-gray-900">{titulo}</h2>
          {descricao && (
            <p className="mt-0.5 text-xs text-gray-600">{descricao}</p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function AvisoSecao({
  aviso,
  onClose,
}: {
  aviso: Aviso;
  onClose: () => void;
}) {
  if (!aviso) return null;

  if (aviso.tipo === "erro") {
    return (
      <ApiErrorAlert erro={aviso.erro} onClose={onClose} />
    );
  }

  return (
    <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
      {aviso.texto}
    </p>
  );
}

const texto = (valor?: string | null) => valor ?? "";

const nuloSeVazio = (valor: string) =>
  valor.trim() ? valor.trim() : null;

export default function PerfilPage() {
  const router = useRouter();
  const { user, pronto } = useSession();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [erroCarga, setErroCarga] = useState<unknown>(null);

  useEffect(() => {
    if (!pronto) return;

    perfilApi
      .obter()
      .then(setUsuario)
      .catch(setErroCarga);
  }, [pronto]);

  if (!pronto || !user) {
    return null;
  }

  const usuarioAtual = usuario ?? user;

  const sair = async () => {
    await auth.logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <AppShell
      titulo="Meu perfil"
      navegacao={NAVEGACAO}
      papel={user.papel}
      nomeOrganizacao="IA Hackathon Amazônia"
      tipoOrganizacao={null}
      nomeUsuario={user.nome ?? ""}
      emailUsuario={user.email}
      pendentes={null}
      onSair={sair}
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
            {(usuarioAtual.nome || usuarioAtual.email)
              .trim()
              .charAt(0)
              .toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-gray-900">
              {usuarioAtual.nome || "Meu perfil"}
            </h1>

            <p className="truncate text-sm text-gray-600">
              {usuarioAtual.email}
            </p>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {ROTULO_PAPEL[usuarioAtual.papel] ?? usuarioAtual.papel}
              </span>

              {usuarioAtual.situacao_conta === "PENDENTE" ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                  Conta pendente: aguardando aprovação do comprovante
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                  Conta ativa
                </span>
              )}

              {usuarioAtual.email_confirmado_em ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  E-mail confirmado
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                  E-mail não confirmado
                </span>
              )}
            </div>
          </div>
        </header>

        {erroCarga !== null && (
          <ApiErrorAlert
            erro={erroCarga}
            onClose={() => setErroCarga(null)}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="space-y-6">
            <DadosPessoais
              usuario={usuarioAtual}
              onSalvo={setUsuario}
            />

            {(usuarioAtual.papel === "PARTICIPANTE" ||
              usuarioAtual.papel === "DEV") && (
              <Vinculo usuario={usuarioAtual} />
            )}
          </div>

          <div className="space-y-6">
            <Email usuario={usuarioAtual} />
            <Senha />

            <Secao
              icone={<LogOut className="h-4 w-4" />}
              titulo="Sessões"
              descricao="Sair encerra o acesso em todos os aparelhos em que você entrou."
            >
              <button
                type="button"
                onClick={sair}
                className={`${btnSecundario} w-full hover:border-red-400 hover:bg-red-50 hover:text-red-700`}
              >
                Sair de todos os aparelhos
              </button>
            </Secao>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DadosPessoais({
  usuario,
  onSalvo,
}: {
  usuario: Usuario;
  onSalvo: (usuario: Usuario) => void;
}) {
  const ehMentor = usuario.papel === "MENTOR";
  const ehParticipante = usuario.papel === "PARTICIPANTE";

  const [form, setForm] = useState({
    nome: texto(usuario.nome),
    instituicao: texto(usuario.instituicao),
    curso: texto(usuario.curso),
    periodo: usuario.periodo ? String(usuario.periodo) : "",
    empresa_parceira: texto(usuario.empresa_parceira),
    area_atuacao: texto(usuario.area_atuacao),
  });

  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const salvar = async (evento: React.FormEvent) => {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);
    setFields({});

    const dados: PerfilUpdate = {
      nome: form.nome.trim(),
      instituicao: nuloSeVazio(form.instituicao),
      curso: nuloSeVazio(form.curso),
      periodo: form.periodo ? Number(form.periodo) : null,
    };

    if (ehMentor) {
      dados.empresa_parceira = nuloSeVazio(form.empresa_parceira);
      dados.area_atuacao = nuloSeVazio(form.area_atuacao);
    }

    try {
      const usuarioAtualizado = await perfilApi.atualizar(dados);
      onSalvo(usuarioAtualizado);

      setAviso({
        tipo: "ok",
        texto: "Dados salvos com sucesso.",
      });
    } catch (erro) {
      if (erro instanceof ApiError) {
        setFields(erro.fields);
      }

      setAviso({
        tipo: "erro",
        erro,
      });
    } finally {
      setSalvando(false);
    }
  };

  const campo = (chave: keyof typeof form) => ({
    className: inp,
    value: form[chave],
    onChange: (evento: React.ChangeEvent<HTMLInputElement>) =>
      setForm((atual) => ({
        ...atual,
        [chave]: evento.target.value,
      })),
  });

  return (
    <Secao
      icone={<UserRound className="h-4 w-4" />}
      titulo="Dados pessoais"
      descricao={
        ehParticipante
          ? "Instituição, curso e período aparecem para a organização ao conferir seu comprovante."
          : "Como você aparece para as equipes e para a organização."
      }
    >
      <AvisoSecao
        aviso={aviso}
        onClose={() => setAviso(null)}
      />

      <form onSubmit={salvar} className="space-y-4">
        <Campo label="Nome completo *" erro={fields.nome}>
          <input
            required
            autoComplete="name"
            {...campo("nome")}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <Campo label="Instituição" erro={fields.instituicao}>
            <input {...campo("instituicao")} />
          </Campo>

          <Campo label="Período" erro={fields.periodo}>
            <input
              type="number"
              min={1}
              {...campo("periodo")}
            />
          </Campo>
        </div>

        <Campo label="Curso" erro={fields.curso}>
          <input {...campo("curso")} />
        </Campo>

        {ehMentor && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Empresa parceira" erro={fields.empresa_parceira}>
              <input {...campo("empresa_parceira")} />
            </Campo>

            <Campo label="Área de atuação" erro={fields.area_atuacao}>
              <input {...campo("area_atuacao")} />
            </Campo>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-gray-500">
            {usuario.atualizado_em
              ? `Última alteração em ${formatarDataBrasilia(
                  usuario.atualizado_em
                )}`
              : "Perfil e e-mail não mudam por aqui."}
          </p>

          <button
            type="submit"
            disabled={salvando}
            className={btnPrimario}
          >
            {salvando ? "Salvando..." : "Salvar dados"}
          </button>
        </div>
      </form>
    </Secao>
  );
}

function Email({ usuario }: { usuario: Usuario }) {
  const [novoEmail, setNovoEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const trocarEmail = async (evento: React.FormEvent) => {
    evento.preventDefault();

    setEnviando(true);
    setAviso(null);
    setFields({});

    try {
      const resposta = await perfilApi.trocarEmail(
        novoEmail.toLowerCase().trim(),
        senha
      );

      setAviso({
        tipo: "ok",
        texto: `${resposta.detail} Seu e-mail atual continua valendo até você abrir o link.`,
      });

      setNovoEmail("");
      setSenha("");
    } catch (erro) {
      if (erro instanceof ApiError) {
        setFields(erro.fields);
      }

      setAviso({
        tipo: "erro",
        erro,
      });
    } finally {
      setEnviando(false);
    }
  };

  const reenviarConfirmacao = async () => {
    setReenviando(true);
    setAviso(null);

    try {
      const resposta = await perfilApi.reenviarConfirmacao();

      setAviso({
        tipo: "ok",
        texto: resposta.detail,
      });
    } catch (erro) {
      setAviso({
        tipo: "erro",
        erro,
      });
    } finally {
      setReenviando(false);
    }
  };

  return (
    <Secao
      icone={<Mail className="h-4 w-4" />}
      titulo="E-mail"
    >
      <AvisoSecao
        aviso={aviso}
        onClose={() => setAviso(null)}
      />

      <div className="mb-5 rounded-xl border border-gray-200 bg-[#F6F9F8] p-3">
        <p className="truncate text-sm font-semibold text-gray-900">
          {usuario.email}
        </p>

        {usuario.email_confirmado_em ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Confirmado
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-amber-800">
              <MailWarning className="h-3.5 w-3.5" />
              Ainda não confirmado
            </p>

            <button
              type="button"
              onClick={reenviarConfirmacao}
              disabled={reenviando}
              className={btnSecundario}
            >
              {reenviando ? "Enviando..." : "Reenviar link"}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={trocarEmail} className="space-y-3">
        <p className="text-xs font-semibold text-gray-800">
          Trocar e-mail
        </p>

        <Campo label="Novo e-mail *" erro={fields.novo_email}>
          <input
            required
            type="email"
            autoComplete="email"
            className={inp}
            value={novoEmail}
            onChange={(evento) => setNovoEmail(evento.target.value)}
          />
        </Campo>

        <Campo label="Senha atual *" erro={fields.senha}>
          <input
            required
            type="password"
            autoComplete="current-password"
            className={inp}
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
          />
        </Campo>

        <button
          type="submit"
          disabled={enviando}
          className={`${btnPrimario} w-full`}
        >
          {enviando
            ? "Enviando..."
            : "Enviar link de confirmação"}
        </button>
      </form>
    </Secao>
  );
}

function Senha() {
  const [form, setForm] = useState({
    atual: "",
    nova: "",
    confirmacao: "",
  });

  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const trocarSenha = async (evento: React.FormEvent) => {
    evento.preventDefault();

    if (form.nova !== form.confirmacao) {
      setFields({
        confirmacao: "As senhas não conferem.",
      });

      return;
    }

    setEnviando(true);
    setAviso(null);
    setFields({});

    try {
      await perfilApi.trocarSenha(form.atual, form.nova);

      setForm({
        atual: "",
        nova: "",
        confirmacao: "",
      });

      setAviso({
        tipo: "ok",
        texto:
          "Senha alterada. Os outros aparelhos foram desconectados; este continua logado.",
      });
    } catch (erro) {
      if (erro instanceof ApiError) {
        setFields(erro.fields);
      }

      setAviso({
        tipo: "erro",
        erro,
      });
    } finally {
      setEnviando(false);
    }
  };

  const campo = (
    chave: keyof typeof form,
    autoComplete: string
  ) => ({
    required: true,
    type: "password",
    autoComplete,
    className: inp,
    value: form[chave],
    onChange: (evento: React.ChangeEvent<HTMLInputElement>) =>
      setForm((atual) => ({
        ...atual,
        [chave]: evento.target.value,
      })),
  });

  return (
    <Secao
      icone={<KeyRound className="h-4 w-4" />}
      titulo="Senha"
    >
      <AvisoSecao
        aviso={aviso}
        onClose={() => setAviso(null)}
      />

      <form onSubmit={trocarSenha} className="space-y-3">
        <Campo label="Senha atual *" erro={fields.senha_atual}>
          <input {...campo("atual", "current-password")} />
        </Campo>

        <Campo
          label="Senha nova *"
          erro={fields.senha_nova}
          dica={DICA_SENHA}
        >
          <input
            minLength={8}
            maxLength={128}
            {...campo("nova", "new-password")}
          />
        </Campo>

        <Campo
          label="Repita a senha nova *"
          erro={fields.confirmacao}
        >
          <input
            {...campo("confirmacao", "new-password")}
          />
        </Campo>

        <button
          type="submit"
          disabled={enviando}
          className={`${btnPrimario} w-full`}
        >
          {enviando ? "Salvando..." : "Trocar senha"}
        </button>
      </form>
    </Secao>
  );
}

const ROTULO_STATUS_COMPROVANTE: Record<string, string> = {
  PENDENTE: "em conferência",
  APROVADO: "aprovado",
  RECUSADO: "recusado",
};

async function carregarEdicoes(): Promise<{
  edicoes: HackathonResponse[];
  inicial: string;
}> {
  const [todas, minhas, meus] = await Promise.all([
    hackathonsApi.listar(),
    equipesApi.minhas().catch(() => []),
    comprovantesApi.meus().catch(() => []),
  ]);

  const idsRelacionados = new Set([
    ...minhas.map((equipe) => equipe.hackathon_id),
    ...meus.map((comprovante) => comprovante.hackathon_id),
  ]);

  const edicoes = todas.filter(
    (hackathon) =>
      idsRelacionados.has(hackathon.id) ||
      inscricoesAbertas(hackathon)
  );

  const idDaUrl = new URLSearchParams(
    window.location.search
  ).get("hackathon_id");

  const edicaoAberta = edicoes.find(
    (hackathon) =>
      minhas.some(
        (equipe) => equipe.hackathon_id === hackathon.id
      ) && inscricoesAbertas(hackathon)
  );

  const inicial =
    (idDaUrl &&
    edicoes.some((hackathon) => hackathon.id === idDaUrl)
      ? idDaUrl
      : null) ??
    edicaoAberta?.id ??
    edicoes.find((hackathon) =>
      idsRelacionados.has(hackathon.id)
    )?.id ??
    edicoes[0]?.id ??
    "";

  return {
    edicoes,
    inicial,
  };
}

function Vinculo({ usuario }: { usuario: Usuario }) {
  const [edicoes, setEdicoes] = useState<
    HackathonResponse[] | null
  >(null);

  const [hackathonId, setHackathonId] = useState("");
  const [situacao, setSituacao] =
    useState<SituacaoAutodeclaracao | null>(null);
  const [erroCarga, setErroCarga] = useState<unknown>(null);

  const pedidoAtual = useRef(0);

  const [tipo, setTipo] = useState<TipoIntegrante>("ESTUDANTE");

  const [form, setForm] = useState({
    instituicao: texto(usuario.instituicao),
    curso: texto(usuario.curso),
    periodo: usuario.periodo ? String(usuario.periodo) : "",
    organizacao: "",
    cargo: "",
  });

  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const aplicarSituacao = useCallback(
    (novaSituacao: SituacaoAutodeclaracao) => {
      setSituacao(novaSituacao);

      const atual = novaSituacao.atual;

      if (atual) {
        setTipo(atual.tipo);

        setForm((atualForm) => ({
          instituicao: atual.instituicao ?? atualForm.instituicao,
          curso: atual.curso ?? atualForm.curso,
          periodo: atual.periodo
            ? String(atual.periodo)
            : atualForm.periodo,
          organizacao: atual.organizacao ?? atualForm.organizacao,
          cargo: atual.cargo ?? atualForm.cargo,
        }));
      } else if (novaSituacao.tipo_indicado_pelo_lider) {
        setTipo(novaSituacao.tipo_indicado_pelo_lider);
      }
    },
    []
  );

  useEffect(() => {
    carregarEdicoes()
      .then(({ edicoes: lista, inicial }) => {
        setEdicoes(lista);
        setHackathonId(inicial);
      })
      .catch(setErroCarga);
  }, []);

  const carregarSituacao = useCallback(
    (id: string) => {
      const pedido = ++pedidoAtual.current;

      autodeclaracaoApi
        .obter(id)
        .then((novaSituacao) => {
          if (pedido === pedidoAtual.current) {
            aplicarSituacao(novaSituacao);
          }
        })
        .catch((erro) => {
          if (pedido === pedidoAtual.current) {
            setErroCarga(erro);
          }
        });
    },
    [aplicarSituacao]
  );

  useEffect(() => {
    if (hackathonId) {
      carregarSituacao(hackathonId);
    }
  }, [hackathonId, carregarSituacao]);

  const escolherEdicao = (id: string) => {
    setSituacao(null);
    setErroCarga(null);
    setAviso(null);
    setFields({});
    setHackathonId(id);
  };

  const edicao =
    edicoes?.find(
      (hackathon) => hackathon.id === hackathonId
    ) ?? null;

  const podeDeclarar = edicao
    ? inscricoesAbertas(edicao)
    : false;

  const salvar = async (evento: React.FormEvent) => {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);
    setFields({});

    const dados: AutodeclaracaoEnvio =
      tipo === "ESTUDANTE"
        ? {
            tipo,
            instituicao: form.instituicao.trim(),
            curso: form.curso.trim(),
            periodo: Number(form.periodo),
          }
        : {
            tipo,
            organizacao: form.organizacao.trim(),
            cargo: form.cargo.trim(),
          };

    const id = hackathonId;

    try {
      await autodeclaracaoApi.declarar(id, dados);

      const pedido = ++pedidoAtual.current;
      const novaSituacao = await autodeclaracaoApi.obter(id);

      if (pedido !== pedidoAtual.current) {
        return;
      }

      aplicarSituacao(novaSituacao);

      setAviso({
        tipo: "ok",
        texto: "Declaração registrada com sucesso.",
      });
    } catch (erro) {
      if (erro instanceof ApiError) {
        setFields(erro.fields);
      }

      setAviso({
        tipo: "erro",
        erro,
      });
    } finally {
      setSalvando(false);
    }
  };

  const campo = (chave: keyof typeof form) => ({
    className: inp,
    value: form[chave],
    onChange: (evento: React.ChangeEvent<HTMLInputElement>) =>
      setForm((atual) => ({
        ...atual,
        [chave]: evento.target.value,
      })),
  });

  const indicado =
    situacao?.tipo_indicado_pelo_lider ?? null;

  const divergente = Boolean(
    indicado &&
      situacao?.atual &&
      situacao.atual.tipo !== indicado
  );

  const comprovante = situacao?.comprovante ?? null;

  return (
    <Secao
      icone={<IdCard className="h-4 w-4" />}
      titulo="Meu vínculo"
      descricao="Declare se você participa como estudante ou como profissional. Quem confirma é você; a organização confere o comprovante à parte."
    >
      {edicoes !== null && edicoes.length > 0 && (
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase text-gray-600">
            Hackathon
          </span>

          <select
            className={inp}
            value={hackathonId}
            onChange={(evento) =>
              escolherEdicao(evento.target.value)
            }
          >
            {edicoes.map((hackathon) => (
              <option key={hackathon.id} value={hackathon.id}>
                {hackathon.nome || "Hackathon sem nome"}
                {hackathon.organizacao_nome
                  ? ` · ${hackathon.organizacao_nome}`
                  : ""}
                {inscricoesAbertas(hackathon)
                  ? ""
                  : " (inscrições encerradas)"}
              </option>
            ))}
          </select>

          <span className="mt-1 block text-[11px] text-gray-500">
            A declaração vale só para o hackathon escolhido.
          </span>
        </label>
      )}

      {erroCarga !== null ? (
        <ApiErrorAlert
          erro={erroCarga}
          onClose={() => setErroCarga(null)}
          onRetry={
            hackathonId
              ? () => {
                  setErroCarga(null);
                  carregarSituacao(hackathonId);
                }
              : undefined
          }
        />
      ) : edicoes !== null && edicoes.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-[#F6F9F8] p-4 text-xs text-gray-600">
          Nenhum hackathon com inscrições abertas e nenhuma equipe sua
          agora. Escolha um hackathon em{" "}
          <Link
            href="/hackathons"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Hackathons
          </Link>{" "}
          para declarar o vínculo.
        </p>
      ) : !situacao ? (
        <p className="text-xs text-emerald-700">Carregando...</p>
      ) : (
        <>
          <AvisoSecao
            aviso={aviso}
            onClose={() => setAviso(null)}
          />

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-[#F6F9F8] p-3">
              <p className="text-[10px] font-bold uppercase text-gray-500">
                Você declarou
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {situacao.atual
                  ? ROTULO_TIPO_INTEGRANTE[situacao.atual.tipo]
                  : "Ainda não declarou"}
              </p>

              {situacao.autodeclaracao_exigida &&
                !situacao.atual && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Exigida para homologar a equipe.
                  </p>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#F6F9F8] p-3">
              <p className="text-[10px] font-bold uppercase text-gray-500">
                Indicado pelo líder
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {indicado
                  ? ROTULO_TIPO_INTEGRANTE[indicado]
                  : "Sem equipe"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#F6F9F8] p-3">
              <p className="text-[10px] font-bold uppercase text-gray-500">
                Comprovante
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  situacao.vinculo_comprovado
                    ? "text-emerald-700"
                    : "text-gray-900"
                }`}
              >
                {comprovante
                  ? `${ROTULO_TIPO_INTEGRANTE[comprovante.tipo_vinculo]}: ${
                      ROTULO_STATUS_COMPROVANTE[
                        comprovante.status
                      ] ?? comprovante.status
                    }`
                  : "Não enviado"}
              </p>

              {comprovante?.status === "RECUSADO" &&
                comprovante.motivo_recusa && (
                  <p className="mt-1 text-[11px] text-red-700">
                    Motivo: {comprovante.motivo_recusa}
                  </p>
                )}

              {!situacao.vinculo_comprovado &&
                situacao.comprovante_exigido && (
                  <p className="mt-1 text-[11px] text-gray-600">
                    A equipe só é homologada com o comprovante aprovado.{" "}
                    <Link
                      href={`/equipe?hackathon_id=${hackathonId}`}
                      className="font-semibold text-emerald-700 hover:underline"
                    >
                      Enviar
                    </Link>
                  </p>
                )}
            </div>
          </div>

          {divergente && indicado && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              O líder indicou você como{" "}
              {ROTULO_TIPO_INTEGRANTE[indicado].toLowerCase()},
              mas sua declaração diz{" "}
              {ROTULO_TIPO_INTEGRANTE[
                situacao.atual!.tipo
              ].toLowerCase()}
              . A equipe não é homologada até um dos dois corrigir.
            </p>
          )}

          {!podeDeclarar && (
            <p className="mb-4 rounded-lg border border-gray-200 bg-[#F6F9F8] px-3 py-2 text-xs text-gray-600">
              As inscrições deste hackathon estão encerradas: a
              declaração fica só para consulta.
            </p>
          )}

          <form onSubmit={salvar} className="space-y-4">
            <fieldset
              disabled={!podeDeclarar}
              className="space-y-4 disabled:opacity-60"
            >
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="Tipo de vínculo"
              >
                {(
                  ["ESTUDANTE", "PROFISSIONAL"] as TipoIntegrante[]
                ).map((tipoVinculo) => (
                  <button
                    key={tipoVinculo}
                    type="button"
                    role="radio"
                    aria-checked={tipo === tipoVinculo}
                    onClick={() => setTipo(tipoVinculo)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      tipo === tipoVinculo
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    {ROTULO_TIPO_INTEGRANTE[tipoVinculo]}

                    <span className="block text-[11px] font-normal text-gray-500">
                      {tipoVinculo === "ESTUDANTE"
                        ? "Instituição, curso e período"
                        : "Organização e cargo"}
                    </span>
                  </button>
                ))}
              </div>

              {tipo === "ESTUDANTE" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                    <Campo
                      label="Instituição *"
                      erro={fields.instituicao}
                    >
                      <input
                        required
                        maxLength={255}
                        {...campo("instituicao")}
                      />
                    </Campo>

                    <Campo label="Período *" erro={fields.periodo}>
                      <input
                        required
                        type="number"
                        min={1}
                        {...campo("periodo")}
                      />
                    </Campo>
                  </div>

                  <Campo label="Curso *" erro={fields.curso}>
                    <input
                      required
                      maxLength={255}
                      {...campo("curso")}
                    />
                  </Campo>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    label="Organização *"
                    erro={fields.organizacao}
                  >
                    <input
                      required
                      maxLength={255}
                      {...campo("organizacao")}
                    />
                  </Campo>

                  <Campo label="Cargo *" erro={fields.cargo}>
                    <input
                      required
                      maxLength={255}
                      {...campo("cargo")}
                    />
                  </Campo>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-gray-500">
                  {situacao.atual?.declarada_em
                    ? `Declarado em ${formatarDataBrasilia(
                        situacao.atual.declarada_em
                      )}. Cada mudança fica no histórico.`
                    : "Cada mudança fica registrada no histórico."}
                </p>

                <button
                  type="submit"
                  disabled={salvando}
                  className={btnPrimario}
                >
                  {salvando
                    ? "Salvando..."
                    : situacao.atual
                      ? "Atualizar declaração"
                      : "Declarar vínculo"}
                </button>
              </div>
            </fieldset>
          </form>

          {situacao.historico.length > 1 && (
            <details className="mt-5 rounded-xl border border-gray-100 bg-[#F6F9F8] p-3">
              <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                Histórico de declarações (
                {situacao.historico.length})
              </summary>

              <ul className="mt-3 space-y-2 text-xs text-gray-700">
                {situacao.historico.map((declaracao) => (
                  <li
                    key={declaracao.id}
                    className="flex flex-wrap justify-between gap-2 border-l-2 border-gray-300 pl-3"
                  >
                    <span>
                      <strong>
                        {ROTULO_TIPO_INTEGRANTE[declaracao.tipo]}
                      </strong>
                      :{" "}
                      {declaracao.tipo === "ESTUDANTE"
                        ? [
                            declaracao.instituicao,
                            declaracao.curso,
                            declaracao.periodo
                              ? `${declaracao.periodo}º período`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : [
                            declaracao.organizacao,
                            declaracao.cargo,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                    </span>

                    <span className="text-gray-500">
                      {formatarDataBrasilia(
                        declaracao.declarada_em
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </Secao>
  );
}