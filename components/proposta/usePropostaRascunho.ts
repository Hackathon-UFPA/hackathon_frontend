"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ApiError,
  propostas,
  type Proposta,
  type PropostaInput,
} from "@/lib/api";

type EstadoRascunho =
  | "semEquipe"
  | "carregando"
  | "novo"
  | "rascunho"
  | "salvando"
  | "salvo"
  | "erro";

type OperacaoRascunho = "carregar" | "salvar";

export type FormProposta = {
  titulo: string;
  descricao: string;
  ods: number[];
  bases_dados: string;
  documento_url: string;
};

const INTERVALO_AUTOSAVE_MS = 2000;

function criarFormVazio(): FormProposta {
  return {
    titulo: "",
    descricao: "",
    ods: [],
    bases_dados: "",
    documento_url: "",
  };
}

function propostaParaForm(proposta: Proposta): FormProposta {
  return {
    titulo: proposta.titulo ?? "",
    descricao: proposta.descricao ?? "",
    ods: [...(proposta.ods ?? [])],
    bases_dados: proposta.bases_dados ?? "",
    documento_url: proposta.documento_url ?? "",
  };
}

function formulariosIguais(
  primeiro: FormProposta,
  segundo: FormProposta
): boolean {
  const primeirosOds = [...primeiro.ods].sort((a, b) => a - b);
  const segundosOds = [...segundo.ods].sort((a, b) => a - b);

  return (
    primeiro.titulo === segundo.titulo &&
    primeiro.descricao === segundo.descricao &&
    primeiro.bases_dados === segundo.bases_dados &&
    primeiro.documento_url === segundo.documento_url &&
    JSON.stringify(primeirosOds) === JSON.stringify(segundosOds)
  );
}

function normalizarForm(form: FormProposta): PropostaInput {
  return {
    titulo: form.titulo.trim() || null,
    descricao: form.descricao.trim() || null,
    ods: form.ods.length > 0 ? [...form.ods] : null,
    bases_dados: form.bases_dados.trim() || null,
    documento_url: form.documento_url.trim() || null,
  };
}

export function usePropostaRascunho(equipeId: string | null) {
  const [proposta, setProposta] = useState<Proposta | null>(null);

  const [form, setForm] = useState<FormProposta>(criarFormVazio);

  const [ultimoSalvo, setUltimoSalvo] =
    useState<FormProposta>(criarFormVazio);

  const [estado, setEstado] = useState<EstadoRascunho>(
    equipeId ? "carregando" : "semEquipe"
  );

  const [erro, setErro] = useState<unknown>(null);

  const [operacaoComErro, setOperacaoComErro] =
    useState<OperacaoRascunho | null>(null);

  const [mensagemSucesso, setMensagemSucesso] =
    useState<string | null>(null);

  const [carregamentoConcluido, setCarregamentoConcluido] =
    useState(false);

  const versaoContextoRef = useRef(0);
  const carregamentoIdRef = useRef(0);
  const salvandoRef = useRef(false);

  const carregarRascunho = useCallback(async () => {
    if (!equipeId || salvandoRef.current) return;

    const versaoContexto = versaoContextoRef.current;
    const carregamentoId = ++carregamentoIdRef.current;

    const respostaAtual = () =>
      versaoContexto === versaoContextoRef.current &&
      carregamentoId === carregamentoIdRef.current;

    setEstado("carregando");
    setErro(null);
    setOperacaoComErro(null);
    setMensagemSucesso(null);
    setCarregamentoConcluido(false);

    try {
      const rascunho = await propostas.obterRascunho(equipeId);

      if (!respostaAtual()) return;

      const dadosForm = propostaParaForm(rascunho);

      setProposta(rascunho);
      setForm(dadosForm);
      setUltimoSalvo(dadosForm);
      setCarregamentoConcluido(true);
      setEstado("rascunho");
    } catch (err) {
      if (!respostaAtual()) return;

      if (err instanceof ApiError && err.status === 404) {
        setProposta(null);
        setForm(criarFormVazio());
        setUltimoSalvo(criarFormVazio());
        setCarregamentoConcluido(true);
        setEstado("novo");
        return;
      }

      setErro(err);
      setOperacaoComErro("carregar");
      setEstado("erro");
    }
  }, [equipeId]);

  useEffect(() => {
    versaoContextoRef.current += 1;
    salvandoRef.current = false;

    setProposta(null);
    setForm(criarFormVazio());
    setUltimoSalvo(criarFormVazio());
    setErro(null);
    setOperacaoComErro(null);
    setMensagemSucesso(null);
    setCarregamentoConcluido(false);

    if (!equipeId) {
      setEstado("semEquipe");
    } else {
      void carregarRascunho();
    }

    return () => {
      versaoContextoRef.current += 1;
      carregamentoIdRef.current += 1;
    };
  }, [equipeId, carregarRascunho]);

  const alteracoesPendentes = useMemo(
    () => !formulariosIguais(form, ultimoSalvo),
    [form, ultimoSalvo]
  );

  const atualizarCampo = useCallback(
    <K extends keyof FormProposta>(
      campo: K,
      valor: FormProposta[K]
    ) => {
      setForm((atual) => ({
        ...atual,
        [campo]: valor,
      }));

      setMensagemSucesso(null);
    },
    []
  );

  const alternarOds = useCallback((ods: number) => {
    setForm((atual) => ({
      ...atual,
      ods: atual.ods.includes(ods)
        ? atual.ods.filter((item) => item !== ods)
        : [...atual.ods, ods],
    }));

    setMensagemSucesso(null);
  }, []);

  const fecharErro = useCallback(() => {
    setErro(null);
  }, []);

  const salvarRascunho = useCallback(async () => {
    if (
      !equipeId ||
      !carregamentoConcluido ||
      salvandoRef.current
    ) {
      return;
    }

    if (proposta?.status === "ENVIADA") {
      setErro(
        new Error(
          "Esta proposta já foi enviada e não pode ser salva como rascunho."
        )
      );
      setOperacaoComErro(null);
      setEstado("erro");
      return;
    }

    salvandoRef.current = true;

    const versaoContexto = versaoContextoRef.current;

    const formEnviado: FormProposta = {
      ...form,
      ods: [...form.ods],
    };

    setEstado("salvando");
    setErro(null);
    setOperacaoComErro(null);
    setMensagemSucesso(null);

    try {
      const dados = normalizarForm(formEnviado);

      const rascunhoSalvo = proposta
        ? await propostas.salvarRascunho(equipeId, dados)
        : await propostas.criarRascunho(equipeId, dados);

      if (versaoContexto !== versaoContextoRef.current) return;

      const dadosSalvos = propostaParaForm(rascunhoSalvo);

      setProposta(rascunhoSalvo);
      setUltimoSalvo(dadosSalvos);

      // Mantém alterações feitas durante a requisição.
      setForm((atual) =>
        formulariosIguais(atual, formEnviado)
          ? dadosSalvos
          : atual
      );

      setEstado("salvo");
      setMensagemSucesso("Rascunho salvo com sucesso.");
    } catch (err) {
      if (versaoContexto !== versaoContextoRef.current) return;

      setErro(err);
      setOperacaoComErro("salvar");
      setEstado("erro");
    } finally {
      if (versaoContexto === versaoContextoRef.current) {
        salvandoRef.current = false;
      }
    }
  }, [equipeId, carregamentoConcluido, form, proposta]);

  const tentarNovamente = useCallback(async () => {
    if (operacaoComErro === "salvar") {
      await salvarRascunho();
      return;
    }

    if (operacaoComErro === "carregar") {
      await carregarRascunho();
    }
  }, [
    operacaoComErro,
    salvarRascunho,
    carregarRascunho,
  ]);

  const podeEditar =
    Boolean(equipeId) &&
    carregamentoConcluido &&
    proposta?.status !== "ENVIADA";

  const podeSalvar =
    podeEditar &&
    estado !== "carregando" &&
    estado !== "salvando" &&
    (proposta === null || alteracoesPendentes);

  // Salva após dois segundos sem alterações.
  useEffect(() => {
    const deveSalvarAutomaticamente =
      podeSalvar &&
      alteracoesPendentes &&
      estado !== "erro";

    if (!deveSalvarAutomaticamente) return;

    const temporizador = window.setTimeout(() => {
      void salvarRascunho();
    }, INTERVALO_AUTOSAVE_MS);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [
    podeSalvar,
    alteracoesPendentes,
    estado,
    salvarRascunho,
  ]);

  // Solicita confirmação ao sair com alterações ainda não salvas.
  useEffect(() => {
    const deveAvisarAoSair =
      alteracoesPendentes || estado === "salvando";

    if (!deveAvisarAoSair) return;

    const avisarAntesDeSair = (event: BeforeUnloadEvent) => {
      event.preventDefault();

      // Compatibilidade com navegadores que exigem returnValue.
      event.returnValue = true;
    };

    window.addEventListener(
      "beforeunload",
      avisarAntesDeSair
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        avisarAntesDeSair
      );
    };
  }, [alteracoesPendentes, estado]);

  return {
    proposta,
    form,
    estado,
    erro,
    operacaoComErro,
    mensagemSucesso,
    alteracoesPendentes,
    carregamentoConcluido,
    podeEditar,
    podeSalvar,
    atualizarCampo,
    alternarOds,
    salvarRascunho,
    fecharErro,
    tentarNovamente,
    recarregar: carregarRascunho,
  };
}