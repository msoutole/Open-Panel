# OpenPanel – instruções para agentes de IA

Estas instruções tornam você imediatamente produtivo neste monorepo. Foque em padrões do projeto e nos fluxos reais usados aqui.

## Visão geral de arquitetura
- Monorepo com npm workspaces: `apps/api` (backend Hono + Prisma) e `apps/web` (React + Vite), mais `packages/shared` (tipos/validadores Zod).
- Docker Compose sobe apenas infraestrutura local: PostgreSQL, Redis, Traefik, opcional Ollama. API e Web rodam em modo dev fora dos containers.
- Backend expõe REST em `/api/**` e três gateways WebSocket: `ws://localhost:<API_PORT>/ws/containers`, `/ws/logs` e `/ws/metrics`.

## Fluxos essenciais de desenvolvimento
- Use `npm start` para configuração 100% automatizada: cria `.env` na raiz, sincroniza `apps/api/.env` e `apps/web/.env.local`, instala deps, sobe infra e inicia API/Web.
- Para dev manual: `npm run dev` (ou `dev:api` e `dev:web`). Banco: `db:generate`, `db:push`, `db:migrate`, `db:studio`. Admin: `npm run create:admin`.
- Edite somente o `.env` da raiz. Os `.env` de subprojetos são gerados e sobrescritos pelo `start.js`.

## Padrões do backend (Hono)
- Entrypoint: `apps/api/src/index.ts`.
  - Validação de ambiente via `lib/env.ts` (Zod). Use `env`, `isDevelopment`, `isProduction` em vez de `process.env` direto.
  - Middlewares globais: `loggerMiddleware` (inclui `requestId`), `prettyJSON`, `apiRateLimiter`/`publicRateLimiter`, `cors` com origem dinâmica por ambiente.
  - Erros: padronize com `HTTPException` nas rotas e `errorHandler` global (`lib/error-handler.ts`). Para erros de domínio, use `AppError`/`ErrorCode`.
- Organização de rotas: feature-first em `src/routes/**`.
  - Exemplo real: `containers.get('/', listContainersHandler)` e rotas específicas antes das genéricas (`/:id/logs` antes de `/:id`).
  - Handlers pequenos, puros, chamam serviços. Ex.: `ContainerService.listContainers()` em `services/container.service.ts`.
- Camada de serviços: `src/services/**` encapsula regras de negócio (Docker via `dockerService`, Traefik, backups, builds, git).
- Banco: Prisma singleton em `lib/prisma.ts`. Esquema em `apps/api/prisma/schema.prisma`.
- Logging: `lib/logger.ts` (Winston) com níveis, `logInfo/logError/logHttp`; em produção formato JSON; em dev colorido.

## Convenções do frontend (React + Vite)
- Chamadas HTTP centralizadas em `apps/web/services/api.ts`:
  - Base URL via `getApiBaseUrl()` e `VITE_API_URL`; auth por `getAuthHeaders()` usando tokens no `localStorage`.
  - Tratamento uniforme de respostas em `handleResponse` (redireciona 401 para login).
  - Resiliência: utilitários `utils/retry.ts` (backoff) e `utils/cache.ts` (TTL curto para métricas).
- Variáveis de ambiente do frontend sempre prefixadas com `VITE_` (ex.: `VITE_API_URL`).

## Comunicação e tempo real
- Use os gateways WebSocket:
  - Containers: `/ws/containers` (mensagens `auth`, `subscribe_logs`, `subscribe_stats` etc; rate limit por cliente).
  - Logs em tempo real e métricas por container; ver `src/websocket/*-gateway.ts`.

## Integrações e infraestrutura
- Docker: acesso via Dockerode; em Windows, o socket padrão é `//./pipe/docker_engine` (sincronizado no `.env` gerado).
- Traefik: proxy reverso com dashboard opcional em `:8080`; Compose define `providers.docker`.
- Redis: cache/filas (BullMQ) e Postgres com `pgvector`. Compose usa nomes de serviços (`openpanel-postgres`, `openpanel-redis`).

## Testes e qualidade
- Testes com Vitest em `apps/api/src/__tests__/**`. Use `npm run test -w apps/api` e `test:watch` quando necessário.
- Type checking: `npm run type-check` (API, Web e Shared).

## Regras e exemplos que diferem do comum
- Sempre preferir `env` tipado de `lib/env.ts` para config.
- Erros nos handlers: lance `HTTPException`; erros de domínio: `new AppError(msg, 4xx/5xx, ErrorCode.*)`.
- Rotas: ordens específicas importam (ex.: defina `/containers/:id/logs` antes de `/containers/:id`).
- Compartilhe tipos/validadores de `@openpanel/shared` em ambos os lados.
- Não edite manualmente `apps/api/.env` e `apps/web/.env.local`.

## Referências rápidas
- Documentação detalhada: `docs/README.md`, `docs/QUICK_START.md`, `docs/SETUP_GUIDE.md`, `docs/INTEGRATION.md`.
- Exemplos de implementação: `apps/api/src/routes/containers/index.ts`, `apps/api/src/services/container.service.ts`, `apps/web/services/api.ts`.

## Multi‑agentes
- Para orquestração de papéis (Gestor, FrontEnd, BackEnd, Testes, DevOps, etc.), use o playbook `docs/AGENTS.md`.
- Em VS Code, mantenha um checklist do Gestor e valide os fluxos com `npm start`, `npm run dev`, `npm run test -w apps/api` e `npm run type-check`.
