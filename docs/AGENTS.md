# Playbook de Agentes de IA – OpenPanel

Este documento define papéis e responsabilidades para agentes de IA trabalhando neste monorepo. O objetivo é acelerar a execução com um Gestor que delega para especialistas, alinhados aos padrões reais do projeto.

**IMPORTANTE**: Todos os agentes respondem EXCLUSIVAMENTE em português brasileiro.

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

## Fluxo de Delegação Multi-Agentes

Este fluxo garante que cada especialista trabalhe em sua área de expertise, mantendo qualidade e conformidade arquitetural:

### 1. Planejamento e Preparação (Gestor/Orchestrator)

**Responsável**: `.claude/agents/openpanel-orchestrator.md`

- Cria checklist estruturada no todo list interno
- Valida ambiente de desenvolvimento (Docker, Node, dependências)
- Define metas e critérios de aceitação
- Decompõe a tarefa em subtarefas atribuíveis a especialistas
- Coordena todos os demais agentes

### 2. Implementação Backend (Backend Specialist)

**Responsável**: `.claude/agents/openpanel-backend-specialist.md`

- Implementa serviços em `apps/api/src/services/`
- Cria rotas em `apps/api/src/routes/`
- Adiciona middlewares se necessário
- Se houver mudanças de schema: coordena com Database Architect para migrations Prisma
- Garante uso de `HTTPException`, `errorHandler`, logging estruturado

### 3. Integração Frontend (Frontend Specialist)

**Responsável**: `.claude/agents/openpanel-frontend-specialist.md`

- Implementa chamadas HTTP via `services/api.ts`
- Cria componentes e páginas necessários
- Implementa cache e backoff para resiliência (`utils/retry.ts`, `utils/cache.ts`)
- Configura WebSocket para recursos em tempo real
- Garante uso correto de variáveis `VITE_*`

### 4. Cobertura de Testes (QA Specialist)

**Responsável**: `.claude/agents/openpanel-qa-specialist.md`

- Cria testes unitários e de integração em `apps/api/src/__tests__/`
- Cobre cenários críticos e casos de erro
- Testa gateways WebSocket (autenticação e rate limit)
- Valida type-check em toda workspace (`npm run type-check`)
- Garante >80% de cobertura em código crítico

### 5. Validação DevOps (DevOps Specialist)

**Responsável**: `.claude/agents/openpanel-devops-infra-specialist.md`

- Verifica configuração Docker Compose
- Valida configurações Traefik se aplicável
- Confirma variáveis de ambiente documentadas
- Testa inicialização e conectividade de serviços
- Resolve problemas de socket Docker (especialmente Windows)

### 6. Auditoria de Segurança (Security Auditor)

**Responsável**: `.claude/agents/openpanel-security-compliance-auditor.md`

- Revisa tratamento de erros e logging
- Valida configurações CORS e rate limiting
- Confirma uso correto de `lib/env.ts` (nunca `process.env` direto)
- Verifica sanitização de logs (sem exposição de credenciais)
- Audita conformidade com `docs/SECURITY.md`

### 7. Documentação (Docs Maintainer)

**Responsável**: `.claude/agents/openpanel-docs-ux-maintainer.md`

- Atualiza `docs/` com novas features
- Documenta endpoints em `docs/API.md`
- Atualiza guias de setup/troubleshooting
- Cria documentação de arquitetura em `docs/architecture/**` se necessário
- Mantém consistência e clareza em português brasileiro

### 8. Arquitetura de Dados (Database Architect - Opcional)

**Responsável**: `.claude/agents/openpanel-database-architect.md`

- Modifica schemas Prisma (`apps/api/prisma/schema.prisma`)
- Cria e executa migrations seguras
- Otimiza queries e adiciona índices
- Integra cache Redis e filas BullMQ
- Implementa extensões PostgreSQL como `pgvector`

## Princípios de Coordenação

- **Paralelização**: Backend e Frontend podem trabalhar simultaneamente quando não há dependência
- **Validação por Etapa**: Testes devem passar antes de documentar; type-check antes de aprovar PR
- **Comunicação de Blockers**: Qualquer impedimento deve ser comunicado imediatamente ao usuário
- **Checklist Sempre Atualizada**: O Gestor mantém o progresso real visível para o usuário

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

## Referências Rápidas

### Documentação

- Arquitetura: `.github/copilot-instructions.md`, `docs/README.md`, `docs/QUICK_START.md`, `docs/SETUP_GUIDE.md`, `docs/INTEGRATION.md`
- Exemplos de código: `apps/api/src/routes/containers/index.ts`, `apps/api/src/services/container.service.ts`, `apps/web/services/api.ts`

### Agentes Especializados

Todos os agentes estão em `.claude/agents/` e respondem **exclusivamente em português brasileiro**:

1. `openpanel-orchestrator.md` - Gestor e coordenador principal
2. `openpanel-backend-specialist.md` - Especialista em Hono + Prisma
3. `openpanel-frontend-specialist.md` - Especialista em React + Vite
4. `openpanel-qa-specialist.md` - Especialista em testes (Vitest)
5. `openpanel-devops-infra-specialist.md` - Especialista em Docker/Infraestrutura
6. `openpanel-security-compliance-auditor.md` - Auditor de segurança
7. `openpanel-docs-ux-maintainer.md` - Mantenedor de documentação
8. `openpanel-database-architect.md` - Arquiteto de dados (Prisma/PostgreSQL)
