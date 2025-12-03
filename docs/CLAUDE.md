<!-- markdownlint-disable MD025 MD024 MD036 -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANTE**: Todas as respostas devem ser em português brasileiro.

## Visão Geral

OpenPanel é um painel de controle auto-hospedado moderno para gerenciamento de servidores Docker com assistente de IA integrado. Monorepo TypeScript com foco em segurança, observabilidade e DX (Developer Experience).

## Comandos Essenciais

```bash
# Setup inicial completo (recomendado para primeira vez)
npm start              # Configura .env, instala deps, inicia Docker e dev servers

# Desenvolvimento
npm run dev            # API (port 3001) + Web (port 3000) em paralelo
npm run dev:api        # Apenas backend
npm run dev:web        # Apenas frontend

# Database (Prisma)
npm run db:generate    # Gera Prisma Client após alterar schema
npm run db:push        # Sincroniza schema com DB (dev)
npm run db:migrate     # Cria e roda migrations (prod)
npm run db:studio      # Abre Prisma Studio GUI

# Build e Qualidade
npm run build          # Build API + Web
npm run type-check     # TypeScript validation em todos workspaces
npm test               # Roda testes (Vitest)

# Admin
npm run create:admin   # Cria usuário admin (email: admin@admin.com.br, senha: admin123)

# Segurança
npm run check-secrets        # Verifica credenciais expostas (Linux/macOS)
npm run check-secrets:win    # Verifica credenciais expostas (Windows)
npm run rotate-credentials   # Rotaciona credenciais comprometidas
```

## Arquitetura do Monorepo

### Estrutura de Workspaces

`
apps/
├── api/              # Backend Hono + Prisma
│   ├── src/
│   │   ├── routes/   # Feature-based routes (auth, users, projects, containers, etc)
│   │   ├── services/ # Business logic (docker, git, backup, build, scheduler)
│   │   ├── middlewares/ # auth, RBAC, rate-limit, logger, error-handler
│   │   ├── websocket/   # 3 gateways WS (containers, logs, metrics)
│   │   ├── queues/      # BullMQ jobs para tarefas assíncronas
│   │   ├── lib/         # env (Zod), logger (Winston), prisma, utils
│   │   └── index.ts     # Hono app entry point
│   └── prisma/schema.prisma
└── web/              # Frontend React + Vite
    └── src/
        ├── components/
        ├── services/    # API client e chamadas HTTP
        ├── hooks/
        └── i18n/

packages/
└── shared/           # Tipos e validadores Zod compartilhados
    └── src/validators/
`

### Stack Tecnológico Chave

**Backend:**

- Framework: Hono (ultraperformático, edge-ready)
- Database: PostgreSQL + Prisma ORM + pgvector (para embeddings AI)
- Cache/Queue: Redis + BullMQ
- Container Orchestration: Dockerode (Docker API nativa)
- WebSocket: 3 gateways (containers, logs, metrics)

**Frontend:**

- Framework: React 19
- Build: Vite
- Proxy: Vite proxy `/api` → `http://localhost:3001`

**Infraestrutura Local (Docker Compose):**

- PostgreSQL (openpanel-postgres)
- Redis (openpanel-redis)
- Traefik (reverse proxy, dashboard em :8080)
- Ollama (opcional, modelos AI locais em :11434)

## Padrões de Desenvolvimento Críticos

### Backend (apps/api)

#### 1. Validação de Ambiente SEMPRE Primeiro

**REGRA**: Nunca use `process.env` diretamente. Use sempre `env` tipado de `lib/env.ts`:

```typescript
// ❌ ERRADO
const port = process.env.API_PORT

// ✅ CORRETO
import { env, isDevelopment, isProduction } from './lib/env'
const port = env.API_PORT  // number tipado, validado por Zod
```

O arquivo `lib/env.ts` valida TODAS variáveis com Zod na inicialização. Se houver erro, a app falha antes de iniciar.

#### 2. Ordem de Middlewares Importa

Ordem em `apps/api/src/index.ts:L55-70`:

1. `loggerMiddleware` (adiciona `requestId` a cada request)
2. `prettyJSON()` (formatting)
3. Rate limiters (`apiRateLimiter`, `publicRateLimiter`)
4. `cors()` (validação de origem)
5. Rotas específicas ANTES de genéricas

Exemplo: `/api/containers/:id/logs` DEVE vir antes de `/api/containers/:id`

#### 3. Estrutura de Rotas Feature-Based

Rotas complexas usam subpastas com handlers:

`
routes/
├── containers/
│   ├── index.ts          # Registra todas subrotas
│   ├── validators.ts     # Zod schemas específicos
│   └── handlers/
│       ├── list.ts
│       ├── create.ts
│       ├── logs.ts
│       └── stats.ts
└── auth.ts               # Rotas simples podem ficar flat
`

**Pattern de handler:**

```typescript
// handlers/list.ts
export const listHandler = async (c: Context<{ Variables: Variables }>) => {
  const user = c.get('user')  // De authMiddleware
  const result = await ContainerService.list(user.id)
  return c.json(result)
}
```

Handlers são PUROS: recebem Context, chamam Services, retornam JSON. Lógica complexa vai em Services.

#### 4. Error Handling Padronizado

```typescript
// Em handlers/routes
import { HTTPException } from 'hono/http-exception'

throw new HTTPException(404, { message: 'Container não encontrado' })

// Em services (erros de domínio)
import { AppError, ErrorCode } from '@/lib/error-handler'

throw new AppError('Porta já em uso', 409, ErrorCode.CONFLICT)
```

O `errorHandler` global (`middlewares/error-handler.ts`) captura tudo e normaliza resposta.

#### 5. Logging Estruturado

```typescript
import { logInfo, logError, logHttp } from '@/lib/logger'

logInfo('Container criado', { containerId: 'abc123', userId })
logError('Falha ao conectar Docker', error, { dockerHost: env.DOCKER_HOST })
```

Em produção: JSON estruturado. Em dev: colorido com timestamps.

Cada request tem `requestId` único (via `loggerMiddleware`) logado automaticamente.

#### 6. WebSocket Gateways

**3 gateways disponíveis:**

1. `ContainerWebSocketGateway` (`/ws/containers`):
   - Mensagens: `auth`, `subscribe_logs`, `subscribe_stats`, `unsubscribe_logs`, etc
   - Rate limit: 100 mensagens/minuto por cliente

2. `LogsWebSocketGateway` (`/ws/logs`):
   - Streaming de logs em tempo real

3. `MetricsWebSocketGateway` (`/ws/metrics`):
   - Métricas de containers (CPU, RAM, I/O)

**Padrão de autenticação WS:**

```typescript
// Cliente envia primeiro:
{ type: 'auth', token: 'jwt_token' }

// Depois pode enviar comandos:
{ type: 'subscribe_logs', containerId: 'abc123' }
```

### Frontend (apps/web)

#### 1. Chamadas HTTP Centralizadas

**SEMPRE use `services/api.ts`:**

```typescript
import { get, post, put, del } from '@/services/api'

// ✅ CORRETO
const containers = await get('/api/containers')

// ❌ ERRADO (não use fetch direto)
fetch('http://localhost:3001/api/containers')
```

O `api.ts` gerencia:

- Base URL (`VITE_API_URL` ou fallback para Vite proxy)
- Headers de autenticação (JWT do `localStorage`)
- Tratamento de 401 (redireciona para login)
- Retry logic com backoff (via `utils/retry.ts`)

#### 2. Variáveis de Ambiente no Frontend

**TODAS variáveis devem ter prefixo `VITE_`:**

```typescript
// ✅ CORRETO
const apiUrl = import.meta.env.VITE_API_URL

// ❌ ERRADO (não vai funcionar)
const apiUrl = import.meta.env.API_URL
```

Vite expõe apenas variáveis com `VITE_` no bundle do cliente.

### Shared Package (packages/shared)

**Validadores Zod compartilhados:**

```typescript
// Definir em packages/shared/src/validators/
export const createContainerSchema = z.object({
  name: z.string().min(3),
  image: z.string(),
  // ...
})

// Usar no backend
import { createContainerSchema } from '@openpanel/shared'
const data = createContainerSchema.parse(await c.req.json())

// Usar no frontend (type inference)
import type { z } from 'zod'
import { createContainerSchema } from '@openpanel/shared'
type CreateContainerInput = z.infer<typeof createContainerSchema>
```

## Modelo de Dados (Prisma)

### Entidades Principais

```prisma
User (id, email, name, password, role, status, mustChangePassword)
  ├─ teams: TeamMember[]
  ├─ projects: Project[]
  ├─ apiKeys: ApiKey[]
  └─ aiProviders: AIProviderConfig[]

Team (id, name, slug)
  ├─ members: TeamMember[]
  └─ projects: Project[]

Project (id, name, slug, type, status, gitRepoUrl)
  ├─ owner: User
  ├─ team: Team
  ├─ containers: Container[]
  ├─ builds: Build[]
  ├─ domains: Domain[]
  └─ envVars: EnvironmentVariable[]

Container (id, name, image, status, ports, volumes)
  ├─ project: Project
  └─ backups: Backup[]
```

### Enums Importantes

```typescript
UserRole: OWNER | ADMIN | MEMBER | VIEWER
UserStatus: ACTIVE | INACTIVE | SUSPENDED
ProjectStatus: ACTIVE | PAUSED | ERROR | DEPLOYING | STOPPED
ProjectType: WEB | API | WORKER | CRON | DATABASE | REDIS | MONGODB
ContainerStatus: RUNNING | STOPPED | PAUSED | RESTARTING | CREATED
```

## Configuração de Ambiente

### Arquivo .env Centralizado

**CRÍTICO**: Edite APENAS `.env` na raiz do projeto. Os arquivos `apps/api/.env` e `apps/web/.env.local` são gerados automaticamente pelo `start.js`.

**Variáveis essenciais:**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/openpanel

# Redis
REDIS_URL=redis://:password@localhost:6379
# OU usar separado:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=suaSenhaAqui

# JWT (gerar com: openssl rand -hex 64)
JWT_SECRET=sua_chave_secreta_minimo_32_caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Docker (Windows usa pipe, Linux/Mac usa socket Unix)
DOCKER_HOST=//./pipe/docker_engine  # Windows
# DOCKER_HOST=/var/run/docker.sock # Linux/Mac

# Traefik (opcional)
TRAEFIK_API_URL=http://localhost:8080
TRAEFIK_CONFIG_PATH=/etc/traefik

# Ollama (opcional, modelos AI locais)
OLLAMA_HOST=http://localhost:11434
```

## Fluxos de Desenvolvimento Comuns

### Adicionar Nova Rota na API

1. **Criar validadores** em `packages/shared/src/validators/feature.ts`:

   ```typescript
   export const createFeatureSchema = z.object({ ... })
   ```

2. **Criar service** em `apps/api/src/services/feature.service.ts`:

   ```typescript
   export class FeatureService {
     static async create(data: CreateFeatureInput) { ... }
   }
   ```

3. **Criar handler** em `apps/api/src/routes/feature/handlers/create.ts`:

   ```typescript
   export const createHandler = async (c) => {
     const data = createFeatureSchema.parse(await c.req.json())
     const result = await FeatureService.create(data)
     return c.json(result, 201)
   }
   ```

4. **Registrar rota** em `apps/api/src/routes/feature/index.ts`:

   ```typescript
   import { Hono } from 'hono'
   import { authMiddleware } from '@/middlewares/auth'
   import { createHandler } from './handlers/create'

   const feature = new Hono()
   feature.post('/', authMiddleware, createHandler)
   export default feature
   ```

5. **Montar no app** em `apps/api/src/index.ts`:

   ```typescript
   import feature from './routes/feature'
   app.route('/api/feature', feature)
   ```

### Rodar Testes de Uma Feature Específica

```bash
# Backend
npm run test -w apps/api -- routes/onboarding.test.ts

# Com watch mode
npm run test:watch -w apps/api -- routes/onboarding.test.ts
```

### Modificar Schema do Banco

1. Editar `apps/api/prisma/schema.prisma`
2. Gerar client: `npm run db:generate`
3. Sincronizar (dev): `npm run db:push`
4. OU criar migration (prod): `npm run db:migrate`

## Segurança

### Autenticação e Autorização

- **JWT Tokens**: Access (15min) + Refresh (7 dias)
- **RBAC Middleware**: Valida permissões por rota (`requireRole(['ADMIN'])`)
- **Rate Limiting**: 100 req/min em `/api/*`, 20 req/min em `/health`
- **Audit Logging**: Todas ações sensíveis registradas em `AuditLog`

### Criptografia

- **API Keys**: AES-256-GCM encryption no banco (via `middlewares/encryption.ts`)
- **Senhas**: bcrypt com salt rounds configurável
- **Senhas Fortes**: Obrigatório no onboarding (8+ chars, maiúsc, minúsc, nums, símbolos)

### CORS

Em desenvolvimento: permissivo para `localhost`.
Em produção: apenas `env.CORS_ORIGIN`.

Ver lógica em `apps/api/src/index.ts:L72-100`.

## Debugging e Troubleshooting

### Logs de Erro

Logs estruturados salvos em `.logs/` (gitignored):

- `combined.log` - Todos logs
- `error.log` - Apenas erros

### Verificar Status dos Serviços

```bash
docker-compose ps           # Status containers
npm run status              # Script custom de status

# Acessar logs de um serviço
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Prisma Studio para Debug de Dados

```bash
npm run db:studio           # Abre GUI em http://localhost:5555
```

## Referências Rápidas

- **Documentação completa**: `docs/README.md`
- **Guia de instalação**: `docs/INSTALL.md`
- **Setup detalhado**: `docs/SETUP_GUIDE.md`
- **API Reference**: `docs/API.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Playbook Multi-Agentes**: `docs/AGENTS.md` (para orquestração de papéis)

## Scripts de Infraestrutura

O projeto tem scripts cross-platform (Linux/macOS/Windows) em `scripts/`:

- `start.js` - Setup completo automatizado
- `setup.js` - Configura ambiente
- `create-admin.ts` - Cria usuário admin
- `check-secrets.sh/.ps1` - Verifica credenciais expostas
- `rotate-credentials.sh/.ps1` - Rotaciona credenciais comprometidas

**Convenção**: Scripts `.sh` para Unix, `.ps1` para Windows, `.js` cross-platform em Node.

## Convenções Específicas do Projeto

1. **Tipos compartilhados**: Use sempre `@openpanel/shared` para validadores e tipos entre API/Web
2. **Path aliases**: Backend usa `@/*` para `src/*`, Frontend também
3. **Commits**: Mensagens seguem Conventional Commits (feat, fix, chore, docs, etc)
4. **TypeScript Strict Mode**: Habilitado em todos workspaces
5. **ESM Only**: Projeto usa ES Modules (`"type": "module"` nos package.json)
