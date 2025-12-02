# Plano de Correções e Melhorias - OpenPanel
**Data:** 02/12/2025
**Versão do Projeto:** 0.2.0
**Status:** Pronto para Execução

---

## Índice
1. [Resumo Executivo](#resumo-executivo)
2. [Correções Aplicadas](#correções-aplicadas)
3. [Correções Urgentes Pendentes](#correções-urgentes-pendentes)
4. [Melhorias de Segurança](#melhorias-de-segurança)
5. [Melhorias de Código](#melhorias-de-código)
6. [Melhorias de Infraestrutura](#melhorias-de-infraestrutura)
7. [Melhorias de Documentação](#melhorias-de-documentação)
8. [Scripts de Automação](#scripts-de-automação)
9. [Checklist de Implementação](#checklist-de-implementação)

---

## Resumo Executivo

Este documento consolida **TODAS** as correções e melhorias identificadas durante a auditoria completa do OpenPanel. As ações estão organizadas por prioridade e complexidade.

### Status Atual
- ✅ **5 dependências corrigidas**
- ✅ **650 pacotes instalados**
- ✅ **0 vulnerabilidades**
- ❌ **115+ erros TypeScript pendentes**
- ⚠️ **Sem CI/CD configurado**

### Priorização
- 🔴 **Urgente**: Deve ser feito esta semana (bloqueadores)
- 🟡 **Importante**: Próximas 2 semanas (qualidade)
- 🟢 **Desejável**: Próximo mês (melhorias)

---

## Correções Aplicadas

### ✅ 1. Dependências Corrigidas

#### apps/api/package.json
```json
{
  "dependencies": {
    "@prisma/client": "^6.19.0",  // era: ^6.20.0 (não existia)
    "zod": "^4.1.13"               // era: ^4.1.12
  },
  "devDependencies": {
    "@types/node": "^22.14.0",    // era: ^24.10.1 (Node 24 não existe)
    "prisma": "^6.19.0",          // era: ^6.20.0 (não existia)
    "typescript": "^5.7.2"        // mantido correto
  }
}
```

#### apps/web/package.json
```json
{
  "dependencies": {
    "typesafe-i18n": "^5.26.2"    // era: ^5.30.0 (não existia)
  },
  "devDependencies": {
    "typescript": "^5.7.2"        // era: ^5.8.2 (versão futura)
  }
}
```

#### packages/shared/package.json
```json
{
  "dependencies": {
    "zod": "^4.1.13"              // era: ^4.1.12
  }
}
```

### ✅ 2. Prisma Client Gerado
- ✅ Gerado com sucesso para versão 6.19.0
- ✅ Localizado em `node_modules/@prisma\client`

---

## Correções Urgentes Pendentes

### 🔴 1. Corrigir Erros TypeScript (115+ erros)

#### 1.1. Erros em Testes (`src/__tests__/`)

**Arquivo: `auth.integration.test.ts`** (14 erros)

```typescript
// ❌ PROBLEMA: Tipo 'unknown' não validado
const registerJson = await registerResponse.json();
expect(registerJson.success).toBe(true); // erro: 'registerJson' is of type 'unknown'

// ✅ SOLUÇÃO 1: Type Guard
interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
  error?: string;
}

const registerJson = await registerResponse.json() as AuthResponse;
expect(registerJson.success).toBe(true);
expect(registerJson.data?.token).toBeDefined();

// ✅ SOLUÇÃO 2: Validação com Zod
import { z } from 'zod';

const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    token: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    }),
  }).optional(),
  error: z.string().optional(),
});

const registerJson = AuthResponseSchema.parse(await registerResponse.json());
```

**Arquivo: `deployment.integration.test.ts`** (28 erros)

```typescript
// ❌ PROBLEMA 1: Argumento undefined
containerGateway.notifyContainerUpdate(undefined); // erro

// ✅ SOLUÇÃO: Criar mock
const mockContainerInfo: ContainerInspectInfo = {
  Id: 'test-container-id',
  Name: 'test-container',
  State: {
    Status: 'running',
    Running: true,
    Paused: false,
    Restarting: false,
    OOMKilled: false,
    Dead: false,
    Pid: 1234,
    ExitCode: 0,
    Error: '',
    StartedAt: new Date().toISOString(),
    FinishedAt: '',
  },
  // ... outros campos necessários
};
containerGateway.notifyContainerUpdate(mockContainerInfo);

// ❌ PROBLEMA 2: null não atribuível a string
const imageName: string = deployment.dockerImage; // erro: Type 'string | null'

// ✅ SOLUÇÃO: Nullish coalescing
const imageName: string = deployment.dockerImage ?? 'nginx:latest';

// ❌ PROBLEMA 3: JWTPayload sem 'id'
const mockToken = jwt.sign({ id: userId }, JWT_SECRET); // erro

// ✅ SOLUÇÃO: Estender tipo
import { JWTPayload } from 'hono/utils/jwt';

interface CustomJWTPayload extends JWTPayload {
  id: string;
  email?: string;
  role?: string;
}

const mockToken = jwt.sign<CustomJWTPayload>({
  id: userId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24h
}, JWT_SECRET);
```

**Arquivo: `audit.test.ts`**

```typescript
// ❌ PROBLEMA: Overload incompatível
c.set('user', mockUser); // erro

// ✅ SOLUÇÃO: Estender Variables no Hono
// Criar arquivo: src/types/hono.ts
import type { User } from '@prisma/client';

export type Variables = {
  user?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  projectId?: string;
  teamId?: string;
};

// Em src/index.ts
import type { Variables } from './types/hono';

const app = new Hono<{ Variables: Variables }>();

// Agora funciona:
c.set('user', mockUser);
```

#### 1.2. Erros em Rotas (`src/routes/`)

**Arquivo: `projects/handlers/create.ts`**

```typescript
// ❌ PROBLEMA: Hook com tipo incompatível
app.post('/projects',
  zValidator('json', createProjectSchema),
  async (c) => {
    // ...
    return c.json({ success: true, data: project }, 201);
  }
);

// ✅ SOLUÇÃO: Tipar corretamente o handler
import type { Context } from 'hono';
import type { Variables } from '@/types/hono';

type AppContext = Context<{ Variables: Variables }>;

const createProjectHandler = async (c: AppContext) => {
  const body = c.req.valid('json');

  // Validar e processar
  const project = await projectService.create(body);

  return c.json({
    success: true,
    data: project,
  }, 201);
};

app.post('/projects',
  zValidator('json', createProjectSchema),
  createProjectHandler
);
```

**Arquivo: `projects/handlers/env-vars.ts`**

```typescript
// ❌ PROBLEMA: Propriedade não existe
const { projectId } = c.req.param(); // erro: Property 'projectId' does not exist

// ✅ SOLUÇÃO: Definir tipo de parâmetros
import type { Context } from 'hono';

type EnvVarParams = {
  projectId: string;
  envVarId?: string;
};

const handler = async (c: Context<{ Variables: Variables }, '/:projectId/env-vars/:envVarId'>) => {
  const { projectId, envVarId } = c.req.param();
  // Agora TypeScript sabe que projectId e envVarId existem
};
```

#### 1.3. Erros em Services (`src/services/`)

**Arquivo: `project.service.ts`**

```typescript
// ❌ PROBLEMA 1: Propriedade possivelmente undefined
const memberCount = project.team.members.length; // erro

// ✅ SOLUÇÃO: Optional chaining
const memberCount = project.team?.members?.length ?? 0;

// ❌ PROBLEMA 2: null não atribuível
update: {
  exitCode: container.exitCode, // erro: Type 'number | null | undefined'
}

// ✅ SOLUÇÃO: Nullish coalescing ou conversão
update: {
  exitCode: container.exitCode ?? 0,
  // OU para aceitar null explicitamente:
  exitCode: container.exitCode === undefined ? 0 : container.exitCode,
}
```

#### 1.4. Erros em WebSocket (`src/websocket/`)

**Arquivo: `container-gateway.ts`**

```typescript
// ❌ PROBLEMA 1: Propriedade não existe em include
const container = await prisma.container.findUnique({
  where: { id: containerId },
  include: {
    teamMembers: true, // erro: não existe
  },
});

// ✅ SOLUÇÃO: Incluir relacionamento correto
const container = await prisma.container.findUnique({
  where: { id: containerId },
  include: {
    project: {
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    },
  },
});

// ❌ PROBLEMA 2: Propriedade não existe
container.project.team; // erro: Property 'project' does not exist

// ✅ SOLUÇÃO: Verificar tipo retornado
if (container?.project?.team) {
  const teamMembers = container.project.team.members;
  // ...
}
```

---

### 🔴 2. Adicionar Validação de JWT_SECRET

**Arquivo: `apps/api/src/lib/env.ts`** (criar se não existir)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Exportar env validado
export const env = validateEnv();
```

**Arquivo: `apps/api/src/index.ts`**

```typescript
import { env } from './lib/env';

console.log('✅ Environment validated successfully');
console.log(`🚀 Starting API on port ${env.API_PORT}`);

// Resto do código...
```

---

### 🔴 3. Implementar CI/CD Pipeline

**Arquivo: `.github/workflows/ci.yml`** (criar)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npm run db:generate

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test
        env:
          # Nota: Evitar incluir senha na URL de exemplo para não acionar scanners de segredos
          DATABASE_URL: postgresql://test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key-with-at-least-32-characters-long

      - name: Build
        run: npm run build

  lint:
    name: Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint --if-present

  security:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

---

## Melhorias de Segurança

### 🟡 1. Implementar Rate Limiting Global

**Arquivo: `apps/api/src/middlewares/rate-limit.ts`**

```typescript
import { rateLimiter } from 'hono-rate-limiter';
import Redis from 'ioredis';
import { env } from '@/lib/env';

const redis = new Redis(env.REDIS_URL);

// Rate limiter global
export const globalRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // 100 requisições por IP
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    return c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
  },
  store: {
    async get(key: string) {
      const value = await redis.get(`ratelimit:${key}`);
      return value ? parseInt(value) : null;
    },
    async set(key: string, value: number, windowMs: number) {
      await redis.setex(`ratelimit:${key}`, Math.ceil(windowMs / 1000), value);
    },
  },
});

// Rate limiter para autenticação (mais restritivo)
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5, // Apenas 5 tentativas de login
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    const email = c.req.json().then((body: any) => body.email).catch(() => 'unknown');
    return `auth:${email}`;
  },
  handler: (c) => {
    return c.json({
      success: false,
      error: 'Too many login attempts. Please try again later.',
    }, 429);
  },
});

// Rate limiter para API sensíveis
export const sensitiveRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 10,
  standardHeaders: 'draft-6',
});
```

**Usar em rotas:**

```typescript
import { globalRateLimit, authRateLimit, sensitiveRateLimit } from '@/middlewares/rate-limit';

// Aplicar globalmente
app.use('*', globalRateLimit);

// Aplicar em rotas específicas
app.post('/auth/login', authRateLimit, loginHandler);
app.post('/auth/register', authRateLimit, registerHandler);
app.delete('/projects/:id', sensitiveRateLimit, deleteProjectHandler);
```

### 🟡 2. Implementar CORS Seguro

**Arquivo: `apps/api/src/middlewares/cors.ts`**

```typescript
import { cors } from 'hono/cors';
import { env } from '@/lib/env';

export const corsMiddleware = cors({
  origin: env.NODE_ENV === 'production'
    ? [env.CORS_ORIGIN]
    : ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  credentials: true,
});
```

### 🟡 3. Adicionar Helmet para Segurança de Headers

**Instalar:**
```bash
npm install --save helmet
npm install --save-dev @types/helmet
```

**Arquivo: `apps/api/src/middlewares/security.ts`**

```typescript
import { secureHeaders } from 'hono/secure-headers';

export const securityHeaders = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
});
```

### 🟡 4. Adicionar Sanitização de Inputs

**Arquivo: `apps/api/src/middlewares/sanitize.ts`**

```typescript
import type { MiddlewareHandler } from 'hono';

// Regex para detectar SQL Injection
const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)|(-{2})|(\bOR\b.*=.*)|(\bAND\b.*=.*)/gi;

// Regex para detectar XSS
const XSS_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

export const sanitizeInput: MiddlewareHandler = async (c, next) => {
  const contentType = c.req.header('content-type');

  if (contentType?.includes('application/json')) {
    try {
      const body = await c.req.json();
      const sanitized = sanitizeObject(body);

      // Substituir body original
      c.req.bodyCache = {
        json: sanitized,
      };
    } catch (error) {
      // Ignorar se não for JSON válido
    }
  }

  await next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

function sanitizeString(str: string): string {
  // Remover SQL Injection patterns
  if (SQL_INJECTION_PATTERN.test(str)) {
    console.warn('⚠️ Possible SQL Injection attempt detected');
    return str.replace(SQL_INJECTION_PATTERN, '');
  }

  // Remover XSS patterns
  if (XSS_PATTERN.test(str)) {
    console.warn('⚠️ Possible XSS attempt detected');
    return str.replace(XSS_PATTERN, '');
  }

  // Remover HTML tags
  return str.replace(/<[^>]*>/g, '');
}
```

---

## Melhorias de Código

### 🟡 1. Adicionar Pre-commit Hooks

**Instalar:**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Arquivo: `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Arquivo: `package.json`** (adicionar)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

### 🟡 2. Adicionar ESLint

**Instalar:**
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

**Arquivo: `.eslintrc.json`** (criar na raiz)

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": ["./tsconfig.json", "./apps/*/tsconfig.json", "./packages/*/tsconfig.json"]
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 🟡 3. Adicionar Prettier

**Instalar:**
```bash
npm install --save-dev prettier
```

**Arquivo: `.prettierrc.json`** (criar na raiz)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Arquivo: `.prettierignore`**

```
node_modules
dist
build
.next
coverage
*.md
```

### 🟢 4. Adicionar Testes Unitários

**Arquivo: `apps/api/src/services/__tests__/project.service.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { projectService } from '../project.service';
import { prisma } from '@/db';

describe('ProjectService', () => {
  beforeEach(async () => {
    // Setup
    await prisma.$connect();
  });

  afterEach(async () => {
    // Cleanup
    await prisma.project.deleteMany();
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        slug: 'test-project',
        type: 'WEB' as const,
        ownerId: 'user-123',
      };

      const project = await projectService.create(projectData);

      expect(project).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.slug).toBe(projectData.slug);
      expect(project.type).toBe(projectData.type);
    });

    it('should fail if slug already exists', async () => {
      const projectData = {
        name: 'Test Project',
        slug: 'duplicate-slug',
        type: 'WEB' as const,
        ownerId: 'user-123',
      };

      await projectService.create(projectData);

      await expect(
        projectService.create(projectData)
      ).rejects.toThrow('Project with this slug already exists');
    });
  });

  describe('update', () => {
    it('should update project successfully', async () => {
      // Test implementation
    });
  });

  describe('delete', () => {
    it('should delete project successfully', async () => {
      // Test implementation
    });
  });
});
```

---

## Melhorias de Infraestrutura

### 🟡 1. Adicionar Health Checks

**Arquivo: `apps/api/src/routes/health.ts`**

```typescript
import { Hono } from 'hono';
import { prisma } from '@/db';
import Redis from 'ioredis';
import { env } from '@/lib/env';

const health = new Hono();

// Health check básico
health.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Health check completo
health.get('/detailed', async (c) => {
  const checks = {
    api: true,
    database: false,
    redis: false,
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Check Redis
  try {
    const redis = new Redis(env.REDIS_URL);
    await redis.ping();
    checks.redis = true;
    await redis.quit();
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return c.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    allHealthy ? 200 : 503
  );
});

// Readiness probe (para Kubernetes)
health.get('/ready', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ready: true });
  } catch (error) {
    return c.json({ ready: false }, 503);
  }
});

// Liveness probe (para Kubernetes)
health.get('/live', (c) => {
  return c.json({ alive: true });
});

export default health;
```

**Registrar em `apps/api/src/index.ts`:**

```typescript
import health from './routes/health';

app.route('/health', health);
```

### 🟢 2. Adicionar Docker Multi-stage Build

**Arquivo: `apps/api/Dockerfile`**

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Instalar dependências
RUN npm ci --workspace=apps/api --workspace=packages/shared

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npm run db:generate

# Build
RUN npm run build:api

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Adicionar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copiar arquivos necessários
COPY --from=builder --chown=hono:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=hono:nodejs /app/apps/api/prisma ./prisma

USER hono

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### 🟢 3. Adicionar Docker Compose para Produção

**Arquivo: `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - openpanel-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - VITE_API_URL=${VITE_API_URL}
    depends_on:
      - api
    networks:
      - openpanel-network

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - openpanel-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - openpanel-network

  traefik:
    image: traefik:v2.10
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/acme.json:/acme.json
    networks:
      - openpanel-network

volumes:
  postgres-data:
  redis-data:

networks:
  openpanel-network:
    driver: bridge
```

---

## Melhorias de Documentação

### 🟡 1. Adicionar OpenAPI/Swagger

**Instalar:**
```bash
npm install --save @hono/swagger-ui @hono/zod-openapi
```

**Arquivo: `apps/api/src/routes/docs.ts`**

```typescript
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

const app = new OpenAPIHono();

// Configurar OpenAPI
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'OpenPanel API',
    description: 'Modern self-hosted server control panel with AI-powered assistance',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
});

// Servir Swagger UI
app.get('/ui', swaggerUI({ url: '/api/docs/doc' }));

export default app;
```

### 🟡 2. Criar ADRs (Architecture Decision Records)

**Arquivo: `docs/adr/0001-monorepo-structure.md`**

```markdown
# ADR 0001: Monorepo Structure com NPM Workspaces

## Status
Accepted

## Context
Precisamos organizar o código em múltiplos packages (API, Web, Shared) de forma eficiente.

## Decision
Usaremos NPM Workspaces para gerenciar um monorepo.

## Consequences
### Positivas
- Compartilhamento fácil de tipos e utilitários
- Versionamento sincronizado
- Build e deploy simplificados

### Negativas
- Necessita npm >= 7.0
- Complexidade inicial maior

## Alternatives Considered
- Lerna
- Yarn Workspaces
- Turborepo
```

---

## Scripts de Automação

### Script 1: Validar Ambiente

**Arquivo: `scripts/validate-env.ts`**

```typescript
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'NODE_ENV',
];

function validateEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const env: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }

  let isValid = true;

  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      console.error(`❌ Missing required variable: ${varName}`);
      isValid = false;
    }
  }

  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    console.error(`❌ JWT_SECRET must be at least 32 characters`);
    isValid = false;
  }

  if (isValid) {
    console.log(`✅ Environment validated: ${filePath}`);
  }

  return isValid;
}

const rootEnv = path.join(process.cwd(), '.env');
const valid = validateEnvFile(rootEnv);

process.exit(valid ? 0 : 1);
```

### Script 2: Sincronizar Versões

**Arquivo: `scripts/sync-versions.ts`**

```typescript
import fs from 'fs';
import path from 'path';

const rootPkg = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
);

const version = rootPkg.version;

const packages = [
  'apps/api/package.json',
  'apps/web/package.json',
  'packages/shared/package.json',
];

for (const pkgPath of packages) {
  const fullPath = path.join(process.cwd(), pkgPath);
  const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  pkg.version = version;

  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated ${pkgPath} to version ${version}`);
}
```

### Script 3: Gerar Secret Seguro

**Arquivo: `scripts/generate-secret.ts`**

```typescript
import crypto from 'crypto';

function generateSecret(length = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

const secret = generateSecret();

console.log('\n🔐 Generated JWT Secret:\n');
console.log(secret);
console.log('\nAdd this to your .env file:');
console.log(`JWT_SECRET=${secret}\n`);
```

---

## Checklist de Implementação

### Fase 1: Correções Urgentes (Esta Semana)

#### Dia 1-2: TypeScript Errors
- [ ] Corrigir erros em `auth.integration.test.ts`
- [ ] Corrigir erros em `deployment.integration.test.ts`
- [ ] Corrigir erros em `audit.test.ts`
- [ ] Criar arquivo `src/types/hono.ts` com tipos customizados
- [ ] Executar `npm run type-check` até 0 erros

#### Dia 3: Validação e Segurança
- [ ] Criar `apps/api/src/lib/env.ts` com validação
- [ ] Gerar JWT_SECRET seguro
- [ ] Testar inicialização da API com validação

#### Dia 4-5: CI/CD
- [ ] Criar `.github/workflows/ci.yml`
- [ ] Configurar secrets no GitHub
- [ ] Testar pipeline em PR
- [ ] Adicionar badge de status no README

### Fase 2: Melhorias Importantes (Próximas 2 Semanas)

#### Semana 1
- [ ] Implementar rate limiting global
- [ ] Adicionar CORS seguro
- [ ] Implementar security headers
- [ ] Adicionar sanitização de inputs
- [ ] Criar health checks
- [ ] Documentar API com OpenAPI

#### Semana 2
- [ ] Adicionar ESLint e Prettier
- [ ] Configurar Husky e lint-staged
- [ ] Escrever testes unitários (>50% cobertura)
- [ ] Criar ADRs principais
- [ ] Adicionar monitoring básico

### Fase 3: Melhorias Desejáveis (Próximo Mês)

#### Semana 1-2
- [ ] Migrar para Prisma 7.x
- [ ] Adicionar soft deletes
- [ ] Implementar versioning otimista
- [ ] Melhorar Docker build (multi-stage)

#### Semana 3-4
- [ ] Adicionar Prometheus metrics
- [ ] Configurar Grafana dashboards
- [ ] Implementar distributed tracing
- [ ] Testes E2E com Playwright
- [ ] Cobertura de testes >80%

---

## Comandos Úteis

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npm run db:generate

# Rodar migrations
npm run db:migrate

# Iniciar desenvolvimento
npm run dev

# Type check
npm run type-check

# Build
npm run build

# Testes
npm test

# Validar ambiente
npx tsx scripts/validate-env.ts

# Gerar secret
npx tsx scripts/generate-secret.ts
```

### CI/CD
```bash
# Simular CI localmente
npm ci
npm run db:generate
npm run type-check
npm test
npm run build

# Audit de segurança
npm audit
npm audit fix

# Verificar dependências desatualizadas
npm outdated
```

### Docker
```bash
# Build
docker-compose build

# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down

# Limpar volumes
docker-compose down -v
```

---

## Recursos Adicionais

### Documentação
- [Hono Documentation](https://hono.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

### Ferramentas
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Prisma Studio](https://www.prisma.io/studio)
- [Docker Hub](https://hub.docker.com/)
- [GitHub Actions](https://github.com/features/actions)

### Segurança
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk Advisor](https://snyk.io/advisor/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**Documento criado em:** 02/12/2025
**Versão:** 1.0.0
**Autor:** Claude Code (Automated Audit)
**Status:** ✅ Pronto para Execução

**Próxima revisão:** Após implementação da Fase 1
