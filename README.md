# 🌿 Hackathon IA Amazônia 2027 — Front-end

Interface em **Next.js 16** (App Router) e **Tailwind CSS v4** para inscrições, aprovação de vínculos e acompanhamento de equipes do **Hackathon IA Amazônia 2027**.

O front consome a API REST do backend FastAPI (`hackathon_backend`). O contrato de referência é o Swagger do backend em `http://localhost:8000/docs`.

---

## Status da integração

| Rota | Tela | Estado | Endpoints usados |
|------|------|--------|------------------|
| `/login` | Login e cadastro de participante (com upload do comprovante) | Integrada | `POST /auth/login`, `POST /auth/cadastro` |
| `/inscricao` | Inscrição e painel da equipe do participante | Integrada | `/auth/me`, `/comprovantes/meus`, `/comprovantes`, `/equipes`, `/equipes/minhas`, `/equipes/{id}/painel`, `/equipes/{id}/convites`, `/convites/*`, `/hackathons/{id}/termos/*`, `/equipes/{id}/inscricao/concluir`, `/equipes/{id}/proposta/rascunho` |
| `/sucesso` | Confirmação com o protocolo da inscrição | Integrada | `/equipes/minhas`, `/equipes/{id}/painel` (quando o protocolo não vem na URL) |
| `/admin` | Painel do Organizador e do Comitê Científico | Integrada | — (protege a rota por perfil) |
| `/admin/comprovantes` | Fila de comprovantes: aprovar e recusar com motivo | Integrada | `GET /admin/comprovantes`, `POST /admin/comprovantes/{id}/aprovar`, `POST /admin/comprovantes/{id}/recusar` |
| `/admin/hackathon` | Gestão da edição | **Informativa**: a API ainda não tem rotas para criar ou editar o hackathon | — |
| `/`, `/cronograma`, `/equipe` | Landing, cronograma e dashboard da equipe | Não alteradas nesta etapa (sem integração com a API) | — |

O componente de acessibilidade (`components/AccessibilityBar.tsx`, no `layout.tsx`) não foi alterado.

---

## Fluxos

### Participante

1. **Cadastro** em `/login` (aba *Criar Conta*): dados pessoais e comprovante de vínculo (PDF, PNG ou JPG, até 10 MB). O arquivo vai direto ao Cloudinary e o backend recebe só o link.
2. **Conta pendente.** Até o Comitê aprovar o comprovante, a conta fica `PENDENTE` e a API recusa (403) quase tudo. A tela `/inscricao` mostra o estado do comprovante e permite reenviar se ele foi recusado.
3. **Depois da aprovação**, o participante escolhe um caminho:
   - **Criar equipe**: vira o líder técnico. A descrição informada vira o rascunho da proposta.
   - **Aceitar um convite** recebido: lê e aceita o regulamento e o termo de consentimento e entra na equipe.
4. **Líder**: aceita os termos, convida integrantes pelo **e-mail da conta deles** e conclui a inscrição quando não houver pendências bloqueantes. O protocolo é emitido pelo backend e exibido em `/sucesso`.
5. **Homologação**: a equipe passa a `HOMOLOGADA` automaticamente quando todos os integrantes têm comprovante aprovado e termos aceitos.

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
├── inscricao/page.tsx            # Inscrição e painel da equipe (/inscricao)
├── sucesso/page.tsx              # Protocolo da inscrição (/sucesso)
├── cronograma/page.tsx           # Cronograma (/cronograma)
├── equipe/page.tsx               # Dashboard da equipe (/equipe)
└── admin/
    ├── page.tsx                  # Painel do admin (/admin)
    ├── comprovantes/page.tsx     # Fila de comprovantes
    └── hackathon/page.tsx        # Gestão da edição (informativa)
components/
└── AccessibilityBar.tsx          # Painel de acessibilidade
lib/
├── api.ts                        # Cliente da API: tipos, endpoints, erros e sessão
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
- Um `401` limpa a sessão e leva para `/login`.
- `enviarArquivoComprovante(file)` faz o upload ao Cloudinary e devolve o link para o cadastro.
- Para proteger uma página: `const { user, pronto } = useSession(["ORGANIZADOR"]);` (o perfil `DEV` sempre passa).

---

## Como testar

1. Suba o backend e confira `http://localhost:8000/health`.
2. Confirme os dados mínimos no banco: um hackathon em `INSCRICOES` e dois termos com `vigente = true`.
3. `npm run dev` e abra `http://localhost:3000/login`.
4. Roteiro resumido, alternando contas pelo botão **Sair**:
   1. Cadastrar os participantes A, B e C com comprovante.
   2. Entrar como Organizador e aprovar os três comprovantes em `/admin/comprovantes`.
   3. A cria a equipe e aceita os termos.
   4. A convida B e C pelo e-mail; cada um aceita o convite em `/inscricao`.
   5. A conclui a inscrição e recebe o protocolo em `/sucesso`.

Os logs do backend ajudam a depurar: `docker compose logs -f app` (na pasta do backend).

---

## Limitações conhecidas

- A conta só é liberada depois que o Comitê aprova o comprovante.
- Não há busca de participantes ou de equipes: o convite é feito pelo e-mail de uma conta existente. Isso depende de novos endpoints no backend.
- Não há envio de e-mail (convites, recusas): o backend ainda não tem essa infraestrutura.
- Criar ou editar o hackathon e os termos só é possível por banco de dados, por enquanto.
- A proposta é só um rascunho (título e descrição). Falta escolher tema ou ODS e enviar a proposta definitivamente, que também dependem do backend.
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