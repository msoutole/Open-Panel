# Playbook de Agentes de IA – OpenPanel

Este documento define papéis e responsabilidades para agentes de IA trabalhando neste monorepo. O objetivo é acelerar a execução com um Gestor que delega para especialistas, alinhados aos padrões reais do projeto.

## Papéis principais

-### 1) Gestor (Orquestrador)

- Planeja e decompõe tarefas; mantém checklist viva usando o todo list interno do agente.
- Garante ambiente pronto e fluxos corretos:
  - Start automático: `npm start` na raiz (gera .env, instala deps, sobe infra e inicia API/Web).
  - Dev manual: `npm run dev`, `npm run dev:api`, `npm run dev:web`.
  - Banco: `npm run db:generate`, `db:push`, `db:migrate`, `db:studio` (workspace `apps/api`).
- Direciona padrões-chave:
  - Backend: Hono + Prisma; `env` tipado (lib/env.ts), middlewares globais, `HTTPException` + `errorHandler`, serviços em `src/services/**`, rotas por feature (ordem importa), Prisma singleton.
  - Frontend: chamadas via `apps/web/services/api.ts`, `VITE_*` no `.env.local` gerado, cache/backoff utilitários.
  - Comunicação: 3 gateways WebSocket (`/ws/containers`, `/ws/logs`, `/ws/metrics`).
- Aprova PRs: pede testes (Vitest em `apps/api/src/__tests__/**`) e `npm run type-check`.

-### 2) Especialista em FrontEnd (React + Vite)

- Foco em `apps/web/**`.
- Padrões obrigatórios:
  - HTTP centralizado em `services/api.ts` (base URL por `getApiBaseUrl`, headers de auth via `localStorage`, `handleResponse` trata 401).
  - Variáveis de ambiente sempre `VITE_*` (ex.: `VITE_API_URL`).
  - Resiliência: `utils/retry.ts` (backoff) e `utils/cache.ts` (TTL curto para métricas).
- Exemplos úteis: `components/**`, `hooks/**`, `pages/**`.
- Tempo real: integrar aos gateways WebSocket; evitar duplicação de conexões; respeitar rate limit.
- Entregáveis típicos: páginas e componentes, hooks de dados com cache/refresh, integração de métricas/logs.

-### 3) Especialista em BackEnd (Hono + Prisma)

- Foco em `apps/api/**`.
- Padrões obrigatórios:
  - Entrypoint `src/index.ts`; ambiente via `lib/env.ts`; middlewares: `loggerMiddleware`, `prettyJSON`, `apiRateLimiter/publicRateLimiter`, `cors` dinâmico.
  - Erros: usar `HTTPException` nas rotas e `errorHandler` global (`lib/error-handler.ts`). Para erros de domínio: `AppError`/`ErrorCode`.
  - Rotas: feature-first em `src/routes/**`; rotas específicas antes das genéricas (ex.: `/:id/logs` antes de `/:id`).
  - Serviços em `src/services/**` (Docker via Dockerode, Traefik, backups, builds, git); logging via `lib/logger.ts`.
  - Banco: Prisma em `lib/prisma.ts`; esquema em `prisma/schema.prisma`.
- Tempo real: gateways `src/websocket/*-gateway.ts` para containers, logs, métricas.
- Entregáveis típicos: novas rotas REST, serviços coesos, integrações Docker/Traefik, migrações Prisma.

-### 4) Especialista em Testes (QA/CI)

- Foco em `apps/api/src/__tests__/**` com Vitest.
- Boas práticas do projeto:
  - Cobrir rotas, serviços e tratamentos de erro (`HTTPException`, `AppError`).
  - Testar gateways WebSocket com casos de autenticação e rate limit.
  - Type-check em toda a workspace: `npm run type-check`.
- Entregáveis típicos: testes unitários e de integração, fixtures/mocks, automação de watch (`npm run test -w apps/api`).

-### 5) DevOps/Infra (opcional, recomendado)

- Docker Compose sobe somente infraestrutura: PostgreSQL, Redis, Traefik, opcional Ollama.
- Em Windows: socket Docker é `//./pipe/docker_engine` (sincronizado no `.env`).
- Traefik: proxy reverso com dashboard opcional em `:8080`; compose define `providers.docker`.
- Scripts úteis (raiz `scripts/**`): `start.js`, `status.js`, `restart.ps1/.sh`, `setup/**`, `start/**`, `status/**`.

-### 6) Segurança & Compliance (opcional)

- Revisar `docs/SECURITY.md` e middlewares de rate limit/CORS.
- Validar que envs sensíveis nunca são lidos direto de `process.env`: usar `lib/env.ts`.
- Confirmar sanitização de logs e padrões de erro.

-### 7) Dados/DB (opcional)

- Prisma: manter esquema, migrações e sincronização (`db:generate`, `db:push`, `db:migrate`).
- Postgres com `pgvector`; observar interações com Redis (cache/filas via BullMQ).

-### 8) Docs/UX (opcional)

- Manter `docs/**` atualizados (Quick Start, Setup, Integration, Troubleshooting).
- Criar exemplos em `docs/architecture/**` quando necessário.

## Fluxo de delegação sugerido

1. Gestor cria checklist, valida ambiente e define metas.
2. Backend implementa serviços/rotas e (se preciso) migrações Prisma.
3. Frontend integra chamadas e UI, com cache/backoff e tempo real.
4. Testes cobrem cenários críticos e gateways.
5. DevOps verifica Compose, Traefik e variáveis.
6. Segurança revisa erros, CORS, rate limit e logs.
7. Docs consolidam o conhecimento.

## Comandos úteis (PowerShell)

```powershell
# Na raiz do monorepo
npm start
npm run dev
npm run dev:api
npm run dev:web

# Banco (apps/api)
npm run db:generate -w apps/api
npm run db:push -w apps/api
npm run db:migrate -w apps/api
npm run db:studio -w apps/api

# Testes e tipos
npm run test -w apps/api
npm run type-check
```

## Referências rápidas

- Arquitetura: `.github/copilot-instructions.md`, `docs/README.md`, `docs/QUICK_START.md`, `docs/SETUP_GUIDE.md`, `docs/INTEGRATION.md`.
- Exemplos: `apps/api/src/routes/containers/index.ts`, `apps/api/src/services/container.service.ts`, `apps/web/services/api.ts`.
