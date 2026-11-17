# 🌿 Hackathon IA Amazônia 2027 — Front-end

Interface em **Next.js 16** (App Router) e **Tailwind CSS v4** para inscrições, aprovação de vínculos e acompanhamento de equipes do **Hackathon IA Amazônia 2027**.

O front consome a API REST do backend FastAPI (`hackathon_backend`). O contrato de referência é o Swagger do backend em `http://localhost:8000/docs`.

---

## Status da integração

| Rota | Tela | Estado | Endpoints usados |
|------|------|--------|------------------|
| `/login` | Login e cadastro de participante (com upload do comprovante) | Integrada | `POST /auth/login`, `POST /auth/cadastro` |
| `/inscricao` | Formulário em etapas (Wizard): conta, validação, equipe, proposta e envio | Integrada | `POST /auth/cadastro`, `POST /auth/login`, `/auth/me`, `/comprovantes/meus`, `/comprovantes`, `/equipes`, `/equipes/minhas`, `/equipes/{id}/painel`, `/equipes/{id}/convites`, `/convites/*`, `/hackathons/{id}/termos/*`, `/hackathons/{id}/temas`, `/equipes/{id}/inscricao/concluir`, `/equipes/{id}/proposta/rascunho`, `/equipes/{id}/proposta`, `/equipes/{id}/proposta/enviar` |
| `/sucesso` | Confirmação com o protocolo da inscrição | Integrada | `/equipes/minhas`, `/equipes/{id}/painel` (quando o protocolo não vem na URL) |
| `/admin` | Painel do Organizador e do Comitê Científico | Integrada | — (protege a rota por perfil) |
| `/admin/comprovantes` | Fila de comprovantes: aprovar e recusar com motivo | Integrada | `GET /admin/comprovantes`, `POST /admin/comprovantes/{id}/aprovar`, `POST /admin/comprovantes/{id}/recusar` |
| `/admin/hackathon` | Gestão da edição | **Informativa**: a API ainda não tem rotas para criar ou editar o hackathon | — |
| `/equipe` | Painel do Esquadrão: situação do grupo, integrantes, protocolos e pendências | Integrada | `/auth/me`, `/equipes/minhas`, `/equipes/{id}/painel` |
| `/`, `/cronograma` | Landing e cronograma | Sem integração com a API | — |

### Acessibilidade (WCAG 2.1 AA)

Disponível em todas as páginas pelo botão flutuante (`components/AccessibilityBar.tsx`, no `layout.tsx`):

| Recurso | Atalho | O que faz |
|---------|--------|-----------|
| Alto contraste | `Alt + Shift + C` | Fundo preto, texto branco, links e destaques em amarelo |
| Fonte +20% | `Alt + Shift + F` | Aumenta em 20% o tamanho base; textos e espaçamentos em `rem` acompanham |
| Pular para o conteúdo | primeiro `Tab` | Leva o foco ao `<main>` da página |

As preferências ficam salvas no navegador (`lib/acessibilidade.ts`) e são aplicadas antes da primeira pintura. Para o aumento funcionar, use tamanhos em `rem` (classes do Tailwind ou `text-[0.625rem]`), nunca em `px`.

---

## Fluxos

### Participante

O formulário de `/inscricao` tem cinco etapas. A etapa inicial vem do estado no servidor, então a pessoa pode sair e voltar de outro dispositivo.

1. **Conta**: dados pessoais e comprovante de vínculo (PDF, PNG ou JPG, até 10 MB). O arquivo vai direto ao Cloudinary e o backend recebe só o link. Depois do `POST /auth/cadastro`, o login é automático. O cadastro também está na aba *Criar Conta* de `/login`.
2. **Validação.** Até o Comitê aprovar o comprovante, a conta fica `PENDENTE` e a API recusa (403) quase tudo. A etapa mostra o estado do comprovante e permite reenviar se ele foi recusado.
3. **Equipe.** Depois da aprovação, o participante escolhe um caminho:
   - **Criar equipe**: vira o líder técnico.
   - **Aceitar um convite** recebido: lê e aceita o regulamento e o termo de consentimento e entra na equipe.

   O líder aceita os termos, convida integrantes pelo **e-mail da conta deles** e conclui a inscrição quando não houver pendências bloqueantes. O protocolo da inscrição é emitido pelo backend e exibido em `/sucesso`. A equipe passa a `HOMOLOGADA` automaticamente quando todos os integrantes têm comprovante aprovado e termos aceitos.
4. **Proposta.** O líder salva o rascunho (`POST` no primeiro salvamento, `PATCH` nos seguintes) a qualquer momento depois de criar a equipe, mesmo incompleto: tema, título, descrição, ODS, bases de dados e link opcional. Os demais integrantes só leem.
5. **Envio.** O líder revisa e faz o envio definitivo (`POST /equipes/{id}/proposta/enviar`), que exige equipe homologada, todos os campos obrigatórios e o período de propostas aberto. O protocolo da proposta aparece nessa etapa, e a proposta deixa de poder ser alterada.

### Organizador e Comitê Científico

1. Login em `/login`: o redirecionamento vai para `/admin` conforme o `papel` devolvido pela API.
2. Em `/admin/comprovantes`: aprovar (ativa a conta e reavalia a homologação) ou recusar com motivo obrigatório.

### Regras que vêm do backend

Tamanho da equipe (padrão de 3 a 5 integrantes, configurado em `hackathon.min_integrantes` e `max_integrantes`), prazo de inscrições, uma equipe por pessoa em cada edição e permissões por perfil. O front mostra o que a API retorna e não repete essas regras. Esconder um botão é só conforto: a API responde 403 para o que o perfil não pode fazer.

---

## Configuração

### Pré-requisitos

- Node.js compatível com Next.js 16.
- Backend rodando (por padrão em `http://localhost:8000`). Veja o README do backend.
- O backend precisa ter um hackathon com `status = INSCRICOES` e o regulamento e o termo de consentimento vigentes. Sem isso, o cadastro responde 409.
- Um usuário Organizador, criado com o script do backend (`app.scripts.criar_usuario`).

### Variáveis de ambiente (`.env.local`)

Copie o `.env.example` e preencha. **Nunca commite o `.env.local`.**

```env
# Upload do comprovante (Cloudinary, upload preset "unsigned")
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# Endereço do backend usado pelo proxy do Next (servidor)
BACKEND_URL=http://localhost:8000
```

Opcional: `NEXT_PUBLIC_API_URL` troca o caminho base das chamadas (o padrão é `/api-backend`).

O preset do Cloudinary precisa estar em modo **Unsigned**. O backend exige que o link do comprovante seja `https` e termine em `.pdf`, `.png`, `.jpg` ou `.jpeg`.

### Proxy para o backend (`next.config.ts`)

O front chama `/api-backend/*`, e o Next repassa para o FastAPI. Assim não há problema de CORS e o cabeçalho `Retry-After` (bloqueio de login) fica legível.

```ts
async rewrites() {
  return [
    {
      source: "/api-backend/:path*",
      destination: `${process.env.BACKEND_URL ?? "http://localhost:8000"}/:path*`,
    },
  ];
},
```

Reinicie o `npm run dev` ao alterar o `next.config.ts` ou o `.env.local`.

### Alias de imports

O projeto usa `@/lib/...`. No `tsconfig.json`:

```json
"paths": { "@/*": ["./*"] }
```

---

## Estrutura de pastas

```text
app/
├── page.tsx                      # Landing Page (/)
├── layout.tsx                    # Layout raiz com acessibilidade
├── globals.css                   # Estilos globais e Tailwind v4
├── login/page.tsx                # Login e cadastro (/login)
├── inscricao/page.tsx            # Formulário em etapas (/inscricao)
├── sucesso/page.tsx              # Protocolo da inscrição (/sucesso)
├── cronograma/page.tsx           # Cronograma (/cronograma)
├── equipe/page.tsx               # Painel do Esquadrão (/equipe)
└── admin/
    ├── page.tsx                  # Painel do admin (/admin)
    ├── comprovantes/page.tsx     # Fila de comprovantes
    └── hackathon/page.tsx        # Gestão da edição (informativa)
components/
├── AccessibilityBar.tsx          # Painel e atalhos de acessibilidade
├── SkipLink.tsx                  # Link "Pular para o conteúdo"
├── ui.tsx                        # Classes e campos compartilhados
├── auth/CadastroForm.tsx         # Cadastro do participante (usado em /login e /inscricao)
├── feedback/ApiErrorAlert.tsx    # Alerta de erros da API
└── inscricao/                    # Etapas do formulário de inscrição
lib/
├── acessibilidade.ts             # Preferências de alto contraste e fonte
├── api.ts                        # Cliente da API: tipos, endpoints, erros e sessão
├── rotulos.ts                    # Textos dos enums da API, lista de ODS e datas
└── useSession.ts                 # Hook que protege páginas por login e perfil
```

---

## Cliente de API (`lib/api.ts`)

Centraliza as chamadas ao backend, com tipos espelhando o OpenAPI.

```ts
import { auth, equipes, comprovantes, ApiError } from "@/lib/api";

try {
  const t = await auth.login(email, senha);      // guarda o token na sessão
  const minhas = await equipes.minhas();
} catch (e) {
  if (e instanceof ApiError) {
    e.status;       // código HTTP
    e.message;      // mensagem para mostrar ao usuário
    e.fields;       // erros 422 por campo: { senha: "..." }
    e.retryAfter;   // segundos de bloqueio (429)
  }
}
```

- O token JWT é guardado em `localStorage` (`hk_token`) com a validade devolvida pela API (60 min, sem renovação).
- Um `401` limpa a sessão e leva para `/login?proximo=<página atual>`; depois de entrar, a pessoa volta para onde estava. O `proximo` só aceita caminhos internos.
- `useSession` confere a sessão em `GET /auth/me` ao abrir a página, então perfil e situação da conta nunca ficam desatualizados.
- Quem já tem sessão válida e abre `/login` segue direto para o painel do seu perfil.
- `enviarArquivoComprovante(file)` faz o upload ao Cloudinary e devolve o link para o cadastro.
- Para proteger uma página: `const { user, pronto } = useSession(["ORGANIZADOR"]);` (o perfil `DEV` sempre passa).

---

## Como testar

1. Suba o backend e confira `http://localhost:8000/health`.
2. Confirme os dados mínimos no banco: um hackathon em `INSCRICOES`, com `propostas_inicio` e `propostas_fim` abrangendo a data atual, dois termos com `vigente = true` e ao menos um tema ativo (`POST /hackathons/{id}/temas`).
3. `npm run dev` e abra `http://localhost:3000/inscricao`.
4. Roteiro resumido, alternando contas pelo botão **Sair**:
   1. Cadastrar os participantes A, B e C com comprovante.
   2. Entrar como Organizador e aprovar os três comprovantes em `/admin/comprovantes`.
   3. A cria a equipe e aceita os termos.
   4. A convida B e C pelo e-mail; cada um aceita o convite em `/inscricao`.
   5. A conclui a inscrição e recebe o protocolo em `/sucesso`.
   6. Em `/inscricao`, A salva a proposta completa e faz o envio definitivo; o protocolo da proposta aparece na etapa *Envio* e em `/equipe`.

Os logs do backend ajudam a depurar: `docker compose logs -f app` (na pasta do backend).

---

## Limitações conhecidas

- A conta só é liberada depois que o Comitê aprova o comprovante.
- Não há busca de participantes ou de equipes: o convite é feito pelo e-mail de uma conta existente. Isso depende de novos endpoints no backend.
- Não há envio de e-mail (convites, recusas): o backend ainda não tem essa infraestrutura.
- Criar ou editar o hackathon e os termos só é possível por banco de dados, por enquanto.
- A API não expõe as datas do período de propostas para o participante: o formulário só descobre que o prazo está fechado na resposta 409 do envio.
- Enquanto o salvamento automático (S4-04) não entra, edições não salvas da proposta se perdem ao recarregar a página. A etapa de envio fica bloqueada enquanto houver alterações não salvas.
- O líder ainda não define a função de cada integrante nem remove integrantes pela interface (os endpoints existem).
- O número do protocolo é gerado pelo banco (prefixo `HK2026-`).
- Os textos institucionais da landing (por exemplo, "4 integrantes") não foram revisados e podem divergir do tamanho de equipe configurado no backend.

---

## Tecnologias

- **Framework:** Next.js 16 (App Router e Turbopack)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Estado:** React (`useState`, `useEffect`) e `localStorage` para a sessão
- **Upload de arquivos:** Cloudinary (upload não assinado)
- **API:** FastAPI (repositório `hackathon_backend`)

---

## Como executar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Antes, configure o `.env.local` e o proxy conforme a seção **Configuração**.

Verificações antes de um commit:

```bash
npx tsc --noEmit
npm run lint
npm run build
```