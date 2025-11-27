# ⚡ Quick Start: Implementação de Correções Críticas

**Tempo Estimado**: 3-5 horas
**Prioridade**: 🔴 BLOCKER - Imprescindível antes de produção

---

## 📋 Checklist de Implementação

### ✅ PASSO 1: Corrigir Dockerfiles (45 min)

**API Dockerfile** - `apps/api/Dockerfile`

```bash
# Fazer backup
cp apps/api/Dockerfile apps/api/Dockerfile.bak

# Editar linha 23
# ANTES: CMD ["npm", "run", "dev"]
# DEPOIS: CMD ["npm", "run", "start"]
```

**Arquivo Final esperado**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

# Gerar Prisma client
RUN npm run db:generate

# Build production
RUN npm run build:api

EXPOSE 3001

# Importante: Executar em modo produção
CMD ["npm", "run", "start"]
```

**Web Dockerfile** - `apps/web/Dockerfile` (Opção Melhor - Multi-stage)

```bash
cp apps/web/Dockerfile apps/web/Dockerfile.bak
```

**Arquivo Final esperado**:
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build:web

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

RUN npm install -g http-server

# Copiar apenas arquivo built
COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

# Servir arquivo estático
CMD ["http-server", "./dist", "-p", "3000"]
```

**Teste Local**:
```bash
# Build
docker build -t openpanel-api:test .

# Run
docker run -p 3001:3001 \
  -e DATABASE_URL="postgres://user:pass@localhost/openpanel" \
  openpanel-api:test

# Verificar
curl http://localhost:3001/health/live
# Response: {"status":"alive"}
```

---

### ✅ PASSO 2: Converter console.log() para Logger (60 min)

**Arquivos a modificar** (em ordem):

#### 1. `apps/api/src/routes/builds.ts`

Adicionar no topo:
```typescript
import { logger } from '../lib/logger';
```

Substituições (10 linhas):
```typescript
// Linha 104
// ANTES: console.log(`Cloning repository: ${data.gitUrl}`);
// DEPOIS:
logger.info('Repository cloning initiated', {
  gitUrl: data.gitUrl,
  projectId: data.projectId,
  action: 'git.clone'
});

// Linha 173
// ANTES: console.log(`Build started for ${project.name}`);
// DEPOIS:
logger.info('Build started', {
  projectId: project.id,
  projectName: project.name,
  buildId: build.id,
  action: 'build.start'
});

// Linha 182 (similar)
logger.info('Build step executing', {
  stepNumber: i + 1,
  command: step,
  action: 'build.step'
});

// Linha 198 (similar)
logger.info('Build step completed', {
  stepNumber: i + 1,
  action: 'build.step.complete'
});

// Linha 205 (similar)
logger.info('Docker build executing', {
  dockerfile: 'Dockerfile',
  action: 'docker.build'
});

// Linha 263 (similar)
logger.info('Build completed successfully', {
  projectId: data.projectId,
  duration: Date.now() - startTime,
  action: 'build.success'
});

// Linha 271 (similar)
logger.info('Registering Docker image', {
  imageName: project.name,
  action: 'docker.push'
});

// Linha 373 (similar)
logger.info('Deployment started', {
  projectId: data.projectId,
  action: 'deploy.start'
});

// Linha 387 (similar)
logger.info('Container started', {
  containerId: container.id,
  action: 'container.start'
});

// Linha 398 (error)
// ANTES: console.error(`Build failed: ${error.message}`);
// DEPOIS:
logger.error('Build failed', {
  projectId: data.projectId,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  action: 'build.failed'
});
```

#### 2. `apps/api/src/websocket/container-gateway.ts` (6 linhas)

```typescript
import { logger } from '../lib/logger';

// Linha 37
// ANTES: console.log(`Client connected`);
// DEPOIS:
logger.info('WebSocket client connected', {
  clientId: ws.id,
  action: 'websocket.connect'
});

// (similarmente para as outras 5)
```

#### 3. `apps/api/src/routes/containers.ts` (3 linhas)

```typescript
import { logger } from '../lib/logger';

// Adicionar logs estruturados
logger.info('Syncing container state', {
  action: 'container.sync',
  timestamp: new Date().toISOString()
});
```

**Validação**:
```bash
# Verificar se todos console.log foram removidos
grep -r "console.log\|console.error" apps/api/src --exclude-dir=node_modules

# Se retornar vazio, está bom!
# Se retornar linhas, corrigir antes de continuar
```

---

### ✅ PASSO 3: Criar Type Guard para Errors (30 min)

**Criar arquivo**: `apps/api/src/lib/error-utils.ts`

```typescript
/**
 * Utilitários para tratamento type-safe de erros
 */

export interface HttpError {
  statusCode: number;
  message: string;
  code: string;
}

/**
 * Extrai mensagem de erro de qualquer tipo
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error === null || error === undefined) return 'Unknown error';
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Extrai código de erro
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    if ('code' in error) return String((error as any).code);
    return error.name;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Mapeia erro para status HTTP apropriado
 */
export function getHttpStatus(error: unknown): number {
  if (error instanceof Error) {
    const code = getErrorCode(error);
    if (code === 'VALIDATION_ERROR') return 400;
    if (code === 'UNAUTHORIZED') return 401;
    if (code === 'FORBIDDEN') return 403;
    if (code === 'NOT_FOUND') return 404;
    if (code === 'CONFLICT') return 409;
  }
  return 500;
}

/**
 * Cria resposta de erro padrão
 */
export function createErrorResponse(error: unknown, requestId?: string) {
  return {
    error: getErrorMessage(error),
    code: getErrorCode(error),
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId })
  };
}

/**
 * Type guard para verificar se é erro HTTP
 */
export function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error &&
    'code' in error
  );
}
```

**Usar em todos os catch blocks**:

```typescript
// ANTES
catch (error: any) {
  logger.error(error.message);
}

// DEPOIS
catch (error: unknown) {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  logger.error('Operation failed', {
    message,
    code,
    stack: error instanceof Error ? error.stack : undefined
  });
  return c.json({ error: message, code }, getHttpStatus(error));
}
```

**Validação**:
```bash
# TypeScript deve compilar sem erros
npm run type-check

# Deve retornar sem erros
```

---

### ✅ PASSO 4: Adicionar Health Checks (45 min)

**Criar arquivo**: `apps/api/src/routes/health.ts`

```typescript
import type { Context } from 'hono';
import { db } from '../db';
import { redis } from '../lib/redis';
import { docker } from '../services/docker';
import { logger } from '../lib/logger';

export interface HealthStatus {
  status: 'alive' | 'ready' | 'error';
  timestamp: string;
  version?: string;
  checks?: Record<string, { status: string; error?: string }>;
}

/**
 * Liveness probe - indica se servidor está rodando
 */
export const getLiveness = (c: Context) => {
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness probe - indica se servidor está pronto para receber tráfego
 */
export const getReadiness = async (c: Context): Promise<Response> => {
  const checks: Record<string, { status: string; error?: string }> = {};
  let ready = true;

  // 1. Check Database
  try {
    await db.user.findFirst();
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = { status: 'error', error: getErrorMessage(error) };
    ready = false;
  }

  // 2. Check Redis
  try {
    await redis.ping();
    checks.redis = { status: 'ok' };
  } catch (error) {
    checks.redis = { status: 'error', error: getErrorMessage(error) };
    // Redis é importante mas não crítico
    logger.warn('Redis unhealthy', { error: getErrorMessage(error) });
  }

  // 3. Check Docker
  try {
    await docker.ping();
    checks.docker = { status: 'ok' };
  } catch (error) {
    checks.docker = { status: 'error', error: getErrorMessage(error) };
    ready = false;
  }

  if (!ready) {
    return c.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks
      },
      503
    );
  }

  return c.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks
  });
};

/**
 * Startup probe - usado por Kubernetes para saber quando app iniciou
 */
export const getStartup = async (c: Context) => {
  // Usar mesmo check que readiness
  return getReadiness(c);
};
```

**Registrar em `apps/api/src/index.ts`**:

```typescript
import { getLiveness, getReadiness, getStartup } from './routes/health';

// Antes das outras rotas (health checks devem ser rápidas)
app.get('/health/live', getLiveness);
app.get('/health/ready', getReadiness);
app.get('/health/startup', getStartup);
```

**Adicionar a docker-compose.yml**:

```yaml
api:
  image: openpanel-api:latest
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3001/health/ready"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 30s

web:
  image: openpanel-web:latest
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 15s
```

**Teste Local**:
```bash
# Liveness (sempre deve responder)
curl http://localhost:3001/health/live

# Readiness (dependências)
curl http://localhost:3001/health/ready

# Status esperado:
# { "status": "ready", "timestamp": "...", "checks": { "database": {...}, ... } }
```

---

## 🧪 Teste de Validação

Após implementar todas as mudanças:

```bash
# 1. Type Check
npm run type-check
# Expected: ✅ No errors

# 2. Verificar console.log
grep -r "console\." apps/api/src --exclude-dir=node_modules | grep -v "logger"
# Expected: (empty)

# 3. Build Docker
docker build -t openpanel-api:test apps/api
docker build -t openpanel-web:test apps/web
# Expected: ✅ Build successful

# 4. Run Docker
docker run -p 3001:3001 openpanel-api:test
# Em outro terminal:
curl http://localhost:3001/health/live
# Expected: {"status":"alive","timestamp":"..."}

# 5. Verificar Logs
# Nos logs do container, deve haver logs estruturados JSON
# Exemplo:
# {"level":"info","message":"Repository cloning initiated","gitUrl":"...","timestamp":"..."}
```

---

## 📊 Progresso

```
┌─────────────────────────────────────┐
│ Correções Críticas                  │
├─────────────────────────────────────┤
│ ✅ P1: Dockerfiles           45min │
│ ✅ P2: Logging               60min │
│ ✅ P3: Type Safety           30min │
│ ✅ P4: Health Checks         45min │
│ ✅ P5: Testing              +4-6h  │
│ ✅ P6: WebSocket Auth       +3-4h  │
├─────────────────────────────────────┤
│ Total: 3-5h para blocker     │
│ Total: +7-10h para P1/P2     │
│ Total: 10-15h para Phase 1-2 │
└─────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. **Após completar PASSO 1-4 (2-3h)**:
   - [ ] Fazer commit: "fix: critical production issues"
   - [ ] Push para branch
   - [ ] Testar em staging

2. **Próximos (8-12h)**:
   - [ ] Implementar WebSocket Auth
   - [ ] Adicionar testes de integração
   - [ ] Corrigir type safety (eliminar any)
   - [ ] Completar settings implementation

3. **Documentação**:
   - [ ] Criar runbook de deployment
   - [ ] OpenAPI/Swagger docs
   - [ ] Guia de troubleshooting

---

**Tempo Total**: 3-5 horas para blocker
**Data Target**: 2025-11-27 (hoje)
**Status**: Pronto para começar
