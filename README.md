# 🌿 Hackathon IA Amazônia 2027 — Front-end MVP

Interface de usuário desenvolvida em **Next.js 16** e **Tailwind CSS v4** para a plataforma de gerenciamento, inscrições, cronograma e acompanhamento do **Hackathon IA Amazônia 2027**.

---

## 💻 Arquitetura de Telas e Rotas

### 1. Landing Page (`/`)
- **Hero Section**: Apresentação principal da edição 2027, métricas do evento (72h de maratona, premiação) e botões de ação rápida.
- **Sobre o Evento**: Descrição dos objetivos, suporte de mentoria e certificação.
- **Desafios Regionais (ODS)**: Mapeamento visual das trilhas socioambientais (*Bioeconomia e Conservação*, *Monitoramento Hidrográfico* e *Saúde Ribeirinha Isolada*).
- **Rodapé Informativo**:
  - **Regulamento**: Regras de formação de equipes (4 integrantes) e critérios de avaliação.
  - **Privacidade & LGPD**: Diretrizes de tratamento de dados e propriedade intelectual do código-fonte.
  - **FAQ Interativo**: Respostas para dúvidas frequentes com sanfona expansível nativa.

### 2. Cronograma (`/cronograma`)
- Tela dedicada com linha do tempo vertical interativa:
  1. **Inscrições de Esquadrões** *(Etapa Ativa / Em Andamento)*
  2. **Seleção e Capacitação**
  3. **Mentoria e Desenvolvimento (Imersão 72h)**
  4. **Avaliação e Premiação**
  5. **Continuidade Pós-Hackathon (Aceleração e Incubação)**

### 3. Wizard de Inscrição (`/inscricao`)
- **Fluxo em 3 Etapas**:
  - **Etapa 1**: Dados do Participante (Nome Completo, E-mail, Telefone, Vínculo).
  - **Etapa 2**: A Solução (Nome do Esquadrão, Trilha ODS, Resumo da Proposta e Impacto Socioambiental).
  - **Etapa 3**: Revisão e Confirmação.
- **Mecanismos de UX e Resiliência**:
  - **Persistência em LocalStorage**: Salva automaticamente o progresso do formulário no navegador para evitar perda de dados por queda de conexão ou atualização acidental.
  - **Validação de Inputs**: Alertas e destaques visuais em vermelho para campos obrigatórios não preenchidos ou formato de e-mail inválido.

### 4. Confirmação de Sucesso (`/sucesso`)
- Confirmação do envio da submissão.
- Geração dinâmica de número de protocolo exclusivo em formato *monospace*.
- Atalho para redirecionamento direto ao Painel da Equipe.

### 5. Painel da Equipe / Dashboard (`/equipe`)
- **Gestão do Esquadrão**:
  - Visualização de membros confirmados e slots abertos para integração de participantes.
  - Exibição de mentor alocado e trilha ODS selecionada.
  - Cronômetro regressivo da maratona em tempo real.
  - Lista de tarefas (*To-Do List*) interativa com estado persistente.

### 6. Barramento de Acessibilidade (Global)
- Componente flutuante (♿) integrado ao layout global (`layout.tsx`).
- **Modo Alto Contraste**: Alternância de contraste para acessibilidade visual.
- **Aumento de Fonte**: Opção de redimensionamento dos textos do sistema em +20%.

---

## 🔌 Integração e Payload (Mock API)

O front-end está estruturado para consumir a API REST em JSON do servidor FastAPI. O formulário de inscrição envia os dados montados conforme a estrutura de dados prevista:

```json
{
  "usuario": {
    "nome_completo": "Nome do Participante",
    "email": "participante@email.com",
    "telefone": "92999999999",
    "papel": "PARTICIPANTE"
  },
  "equipe": {
    "nome": "Nome do Esquadrão"
  },
  "vinculo": {
    "funcao": "LIDER"
  }
}

## 📂 Estrutura de Pastas

```text
app/
├── page.tsx               # Landing Page (/)
├── cronograma/
│   └── page.tsx           # Tela do Cronograma (/cronograma)
├── inscricao/
│   └── page.tsx           # Wizard de Inscrição (/inscricao)
├── sucesso/
│   └── page.tsx           # Confirmador e Protocolo (/sucesso)
├── equipe/
│   └── page.tsx           # Painel / Dashboard (/equipe)
├── layout.tsx             # Layout raiz com Acessibilidade
└── globals.css            # Estilos globais e Tailwind v4
components/
└── AccessibilityBar.tsx   # Painel de acessibilidade flutuante

🛠️ Tecnologias Utilizadas

Framework: Next.js 16 (App Router & Turbopack)

Linguagem: TypeScript

Estilização: Tailwind CSS v4

Gerenciamento de Estado: React (useState, useEffect) + localStorage

🚀 Como Executar o Projeto Localmente

Instale as dependências:

Bash
npm install

Inicie o servidor de desenvolvimento:

Bash
npm run dev

Acesse no navegador:

Abra http://localhost:3000 para visualizar a aplicação em execução.