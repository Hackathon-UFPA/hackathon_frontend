"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InscricaoPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Salvamento automático ativo");

  // Estado dos dados
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    papel: "",
    nomeProjeto: "",
    ods: "bio",
    pitch: "",
    aceite: false
  });

  // Estado para armazenar as mensagens de erro
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const dadosSalvos = localStorage.getItem("hackathon_form_dados");
    const etapaSalva = localStorage.getItem("hackathon_form_etapa");

    if (dadosSalvos) setFormData(JSON.parse(dadosSalvos));
    if (etapaSalva) setStep(parseInt(etapaSalva, 10));
    
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setSaveStatus("Sincronizando...");
      localStorage.setItem("hackathon_form_dados", JSON.stringify(formData));
      localStorage.setItem("hackathon_form_etapa", step.toString());
      
      const timer = setTimeout(() => setSaveStatus("Progresso guardado localmente"), 800);
      return () => clearTimeout(timer);
    }
  }, [formData, step, isMounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    
    // Remove o erro da tela assim que o usuário começa a digitar no campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Função de Validação
  const validateStep = (currentStep: number) => {
    let newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.nome.trim()) {
        newErrors.nome = "Campo obrigatório";
        isValid = false;
      }
      if (!formData.email.trim()) {
        newErrors.email = "Campo obrigatório";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Insira um e-mail válido (ex: ada@email.com)";
        isValid = false;
      }
      if (!formData.papel) {
        newErrors.papel = "Selecione um papel na equipe";
        isValid = false;
      }
    }

    if (currentStep === 2) {
      if (!formData.nomeProjeto.trim()) {
        newErrors.nomeProjeto = "Campo obrigatório";
        isValid = false;
      }
    }

    if (currentStep === 3) {
      if (!formData.pitch.trim()) {
        newErrors.pitch = "Campo obrigatório";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const avancar = () => { 
    // Só avança se a validação passar
    if (validateStep(step)) {
      if (step < 3) setStep(step + 1); 
    }
  };

  const voltar = () => { if (step > 1) setStep(step - 1); };

  const finalizar = () => {
    if (validateStep(3)) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        localStorage.removeItem("hackathon_form_dados");
        localStorage.removeItem("hackathon_form_etapa");
        router.push("/sucesso");
      }, 1500);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0A1110] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
      </div>
    );
  }

  // Função auxiliar para definir as classes CSS de borda com base no erro
  const getInputClass = (fieldName: string) => `w-full bg-black/40 border rounded-lg p-3 text-white outline-none transition-all placeholder:text-gray-600 focus:ring-1 ${
    errors[fieldName] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500'
  }`;

  return (
    <div className="min-h-screen bg-[#0A1110] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15" style={{ backgroundImage: "url('/floresta.jpg')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1110]/40 via-[#0A1110]/80 to-[#0A1110]"></div>
      </div>

      <header className="relative z-10 w-full border-b border-white/5 bg-[#0A1110]/70 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">IA</div>
          <span className="text-white font-bold tracking-widest text-sm uppercase hidden sm:block">Hackathon Amazônia</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          &larr; Voltar ao Início
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-2xl">
          
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
            {[1, 2, 3].map((num) => (
              <div key={num} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                step >= num ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-[#0A1110] border-gray-600 text-gray-500'
              }`}>{num}</div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {step === 1 && "1. Dados do Participante"}
                {step === 2 && "2. A Solução (IA + Amazônia)"}
                {step === 3 && "3. Resumo e Confirmação"}
              </h2>
              <p className="text-gray-400 text-sm">
                {step === 1 && "Precisamos conhecer você e qual será o seu papel na equipe."}
                {step === 2 && "Conte-nos sobre o desafio ODS que sua equipe pretende resolver."}
                {step === 3 && "Revise sua ideia e aceite os termos para finalizar a inscrição."}
              </p>
            </div>

            {/* ETAPA 1 */}
            <div className={step === 1 ? "space-y-5" : "hidden"}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome Completo</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Ada Lovelace da Silva" className={getInputClass("nome")} />
                {errors.nome && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ada@universidade.edu.br" className={getInputClass("email")} />
                {errors.email && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Papel na Equipe</label>
                <select name="papel" value={formData.papel} onChange={handleChange} className={`${getInputClass("papel")} appearance-none`}>
                  <option value="" disabled>Selecione um papel...</option>
                  <option value="LIDER">Líder / Tech Lead</option>
                  <option value="DESENVOLVEDOR">Desenvolvedor (Front/Back)</option>
                  <option value="DADOS">Especialista em Dados / IA</option>
                  <option value="DESIGNER">Designer (UX/UI)</option>
                </select>
                {errors.papel && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.papel}</p>}
              </div>
            </div>

            {/* ETAPA 2 */}
            <div className={step === 2 ? "space-y-5" : "hidden"}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome Provisório do Projeto</label>
                <input type="text" name="nomeProjeto" value={formData.nomeProjeto} onChange={handleChange} placeholder="Ex: Sistema Curupira" className={getInputClass("nomeProjeto")} />
                {errors.nomeProjeto && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.nomeProjeto}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Desafio ODS Foco</label>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg bg-black/20 cursor-pointer hover:border-emerald-500 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10">
                    <input type="radio" name="ods" value="bio" checked={formData.ods === "bio"} onChange={handleChange} className="text-emerald-500 bg-black border-gray-600 focus:ring-emerald-500" />
                    <span className="text-white font-medium">🌱 Bioeconomia e Conservação</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg bg-black/20 cursor-pointer hover:border-emerald-500 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10">
                    <input type="radio" name="ods" value="hidro" checked={formData.ods === "hidro"} onChange={handleChange} className="text-emerald-500 bg-black border-gray-600 focus:ring-emerald-500" />
                    <span className="text-white font-medium">💧 Monitoramento Hidrográfico</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg bg-black/20 cursor-pointer hover:border-emerald-500 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10">
                    <input type="radio" name="ods" value="saude" checked={formData.ods === "saude"} onChange={handleChange} className="text-emerald-500 bg-black border-gray-600 focus:ring-emerald-500" />
                    <span className="text-white font-medium">🏥 Saúde Ribeirinha Isolada</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ETAPA 3 */}
            <div className={step === 3 ? "space-y-5" : "hidden"}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Resumo da Solução (Pitch)</label>
                <textarea name="pitch" value={formData.pitch} onChange={handleChange} rows={4} placeholder="Descreva como a Inteligência Artificial será aplicada..." className={`${getInputClass("pitch")} resize-none`}></textarea>
                {errors.pitch && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.pitch}</p>}
              </div>
              <div className="flex items-start gap-3 pt-2">
                <input type="checkbox" name="aceite" checked={formData.aceite} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-black/40" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Confirmo que li e aceito o regulamento do evento e entendo que os dados submetidos serão avaliados pela comissão.
                </p>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'Sincronizando...' ? 'bg-yellow-400' : 'bg-emerald-500'} animate-pulse`}></span>
                  {saveStatus}
                </span>
              </div>
              <div className="flex gap-3">
                {step > 1 && (
                  <button onClick={voltar} className="px-6 py-2.5 rounded-lg font-semibold text-gray-300 hover:text-white transition-colors">
                    Voltar
                  </button>
                )}
                
                {step < 3 ? (
                  <button onClick={avancar} className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    Avançar
                  </button>
                ) : (
                  <button 
                    onClick={finalizar} 
                    disabled={isSubmitting || !formData.aceite} 
                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Enviando..." : "Finalizar Inscrição"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}