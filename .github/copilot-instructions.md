# OpenPanel AI Agent Instructions

**Goal:** Enable AI agents to be immediately productive in this Node/TypeScript monorepo.

## 🏗 Big Picture & Architecture

- **Monorepo Structure:**
  - `apps/api`: Backend (Hono, Node.js, Prisma, Redis, BullMQ).
  - `apps/web`: Frontend (React, Vite, Tailwind-like styling).
  - `packages/shared`: Shared Zod schemas, types, and utilities.
  - `config/traefik`: Local infrastructure configuration.

- **Backend (`apps/api`)**:
  - **Framework:** Hono (lightweight, standards-based).
  - **Database:** PostgreSQL via Prisma ORM.
  - **Async Jobs:** BullMQ with Redis.
  - **Container Mgmt:** `dockerode` for interacting with the Docker daemon.
  - **Real-time:** WebSocket gateway in `src/websocket/`.
  - **Entrypoint:** `src/index.ts` (server setup, middlewares).

- **Frontend (`apps/web`)**:
  - **Stack:** React 19, Vite.
  - **UI Components:** Lucide React (icons), Recharts (charts), Xterm.js (web terminal).
  - **State/API:** Custom hooks and API services in `src/services/`.

## 🚀 Developer Workflows & Commands

Run these commands from the **root** directory unless specified:

- **Setup:** `npm install` (installs all workspace dependencies).
- **Development:**
  - `npm run dev` (starts both API and Web).
  - `npm run dev:api` (starts only API).
  - `npm run dev:web` (starts only Web).
- **Database (Prisma):**
  - `npm run db:migrate` (runs migrations).
  - `npm run db:generate` (generates Prisma client).
  - `npm run db:studio` (opens Prisma Studio).
- **Testing:**
  - `npm run test` (runs tests for all packages).
  - `npm run test -w apps/api` (runs API tests).
- **Type Check:** `npm run type-check` (runs tsc across workspaces).

## 🧩 Patterns & Conventions

- **Validation:**
  - Use **Zod** for all validation.
  - Define schemas in `packages/shared/src/validators` to share between API and Web.
  - Import shared schemas as `import { ... } from '@openpanel/shared'`.

- **API Structure (`apps/api`):**
  - **Routes:** Defined in `src/routes/*.ts`. Each file exports a Hono app/router.
  - **Middlewares:** Located in `src/middlewares/`. Order matters: Logger -> PrettyJSON -> RateLimit -> Auth.
  - **Services:** Business logic in `src/services/`. Use Singleton pattern (e.g., `BackupService.getInstance()`).
  - **Env Vars:** Validated in `src/lib/env.ts`. **Never** use `process.env` directly; use the exported `env` object.

- **Frontend Structure (`apps/web`):**
  - **Components:** Functional components in `src/components/`.
  - **Pages:** Route components in `src/pages/`.
  - **API Integration:** Use services in `src/services/api.ts`.

## 🔌 Integrations & External Services

- **Docker:** The API controls local Docker containers. Ensure `dockerode` logic handles socket permissions.
- **Traefik:** Used as the reverse proxy. Configs in `config/traefik/`.
- **AI/LLM:** Optional integration. Check for keys (`OPENAI_API_KEY`, etc.) before enabling AI features.

## ⚠️ Critical Rules

- **Secrets:** NEVER commit secrets. Use `.env.example` as a template.
- **JWT:** Secrets must be at least 32 chars (enforced by `env.ts`).
- **Types:** Do not duplicate types between apps. Move them to `packages/shared`.
- **Error Handling:** Use `HTTPException` in Hono routes for consistent error responses.
