"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ApiErrorAlert from "@/components/feedback/ApiErrorAlert";
import { Campo, btn, inp, inputArquivo } from "@/components/ui";
import { ApiError, auth, enviarArquivoComprovante } from "@/lib/api";

const VAZIO = { nome: "", email: "", senha: "", instituicao: "", curso: "", periodo: "" };

/**
 * Cadastro público do participante: envia o comprovante ao Cloudinary e faz POST /auth/cadastro.
 * `onCadastrado` recebe as credenciais para quem chamou decidir o próximo passo.
 */
export default function CadastroForm({
  onCadastrado,
}: {
  onCadastrado: (email: string, senha: string) => Promise<void> | void;
}) {
  const [dados, setDados] = useState(VAZIO);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  // Uma nova tentativa com o mesmo arquivo reaproveita o link, sem outro upload.
  const enviado = useRef<{ arquivo: File; url: string } | null>(null);

  const alterar = (campo: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados({ ...dados, [campo]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setCampos({});
    try {
      if (!arquivo) throw new Error("Anexe o comprovante de vínculo (PDF, PNG ou JPG, até 10 MB).");
      if (enviado.current?.arquivo !== arquivo) {
        enviado.current = { arquivo, url: await enviarArquivoComprovante(arquivo) };
      }
      const email = dados.email.toLowerCase().trim();
      await auth.cadastrar({
        nome: dados.nome.trim(),
        email,
        senha: dados.senha,
        instituicao: dados.instituicao.trim(),
        curso: dados.curso.trim(),
        periodo: Number(dados.periodo),
        comprovante_url: enviado.current.url,
      });
      await onCadastrado(email, dados.senha);
    } catch (err) {
      setErro(err);
      if (err instanceof ApiError) setCampos(err.fields);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      {erro != null && <ApiErrorAlert erro={erro} onClose={() => setErro(null)} />}

      <Campo label="Nome completo *" erro={campos.nome}>
        <input
          required
          maxLength={255}
          autoComplete="name"
          className={inp}
          value={dados.nome}
          onChange={alterar("nome")}
        />
      </Campo>
      <Campo label="E-mail *" erro={campos.email}>
        <input
          required
          type="email"
          autoComplete="email"
          className={inp}
          value={dados.email}
          onChange={alterar("email")}
        />
      </Campo>
      <Campo
        label="Senha *"
        erro={campos.senha}
        dica="8 a 128 caracteres, com ao menos uma letra e um número."
      >
        <input
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          className={inp}
          value={dados.senha}
          onChange={alterar("senha")}
        />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Campo label="Instituição *" erro={campos.instituicao}>
          <input
            required
            maxLength={255}
            autoComplete="organization"
            className={inp}
            value={dados.instituicao}
            onChange={alterar("instituicao")}
          />
        </Campo>
        <Campo label="Período *" erro={campos.periodo}>
          <input
            required
            type="number"
            min={1}
            step={1}
            className={inp}
            value={dados.periodo}
            onChange={alterar("periodo")}
          />
        </Campo>
      </div>
      <Campo label="Curso *" erro={campos.curso}>
        <input
          required
          maxLength={255}
          className={inp}
          value={dados.curso}
          onChange={alterar("curso")}
        />
      </Campo>
      <Campo
        label="Comprovante de vínculo *"
        erro={campos.comprovante_url}
        dica="PDF, PNG ou JPG, até 10 MB."
      >
        <input
          required
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className={inputArquivo}
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        />
      </Campo>
      <button type="submit" disabled={enviando} className={`${btn} w-full`}>
        {enviando ? "Enviando..." : "Criar conta"}
        {!enviando && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </form>
  );
}
