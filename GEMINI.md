# OpenPanel (SOU+TECH by SOULLABS)

## Project Overview
OpenPanel is a modern, self-hosted server control panel designed for managing Docker containers, deployments, and infrastructure. It features AI-powered assistance, automated deployments, and a privacy-first approach.

**Key Technologies:**
*   **Frontend:** React 19, Vite, TypeScript, Lucide React, TailwindCSS.
*   **Backend:** Node.js (v18+), Hono, Prisma ORM, PostgreSQL (with pgvector), Redis, BullMQ, Dockerode.
*   **AI Service:** Python (FastAPI), MongoDB, Motor.
*   **Infrastructure:** Docker Compose (Profiles: dev, pre, prod), Traefik (Reverse Proxy & SSL), Tailscale (VPN).

## Architecture
The project is structured as a **monorepo** using npm workspaces.

*   `apps/api`: The core REST API and WebSocket server. Handles business logic, database interactions, and Docker management.
*   `apps/web`: The React-based Single Page Application (SPA) frontend.
*   `apps/ai-service`: A Python service handling AI logic and interactions.
*   `apps/mcp-server`: Model Context Protocol server.
*   `packages/shared`: Shared TypeScript types, validators (Zod), and utilities used by both API and Web.

## Getting Started

### Quick Start (Automated)
The easiest way to start the entire stack is using the automation script:
```bash
npm start
```
This script checks prerequisites, sets up the `.env` file, installs dependencies, starts Docker containers, and initializes the database.

### Manual Development Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Setup:**
    Copy `.env.example` to `.env` and configure:
    ```bash
    cp .env.example .env
    ```
3.  **Start Infrastructure:**
    Start the required databases and services (Postgres, Redis, Traefik, etc.):
    ```bash
    docker compose up -d
    ```
    *Use `--profile dev` for development specific containers if needed.*
4.  **Database Setup:**
    ```bash
    npm run db:generate  # Generate Prisma Client
    npm run db:push      # Push schema to DB
    npm run create:admin # Create default admin user
    ```
5.  **Start Dev Servers:**
    ```bash
    npm run dev
    # Or individually:
    # npm run dev:api
    # npm run dev:web
    ```

## Development Workflow

### Key Commands
*   `npm run dev`: Starts both API and Web in development mode.
*   `npm run build`: Builds both API and Web for production.
*   `npm run db:generate`: Generates Prisma Client based on `schema.prisma`.
*   `npm run db:migrate`: Creates and runs database migrations.
*   `npm run db:studio`: Opens Prisma Studio to visualize data.
*   `npm run type-check`: Runs TypeScript validation across the monorepo.
*   `npm run lint`: Runs ESLint.
*   `npm test`: Runs tests using Vitest.

### Database Management
*   The database schema is located in `apps/api/prisma/schema.prisma`.
*   After modifying the schema, always run `npm run db:generate` and `npm run db:migrate` (or `db:push` for prototyping).

### Testing
*   **Framework:** Vitest
*   **Location:** Tests are co-located or found in `tests/` directories within apps.
*   **Command:** `npm test`

## Conventions

*   **Code Style:** Strict TypeScript, ESLint, and Prettier are enforced.
*   **Security:**
    *   **NEVER** commit `.env` files.
    *   Use `scripts/check-secrets.sh` to detect exposed credentials.
    *   Use `scripts/rotate-credentials.sh` if a leak occurs.
*   **Commits:** Follow conventional commits (e.g., `feat:`, `fix:`, `chore:`).
*   **Ports:**
    *   Web: 3000 (Dev), 80/443 (Prod/Traefik)
    *   API: 3001
    *   Traefik Dashboard: 8080
    *   AI Service: 8000
    *   MCP Server: 3005

## Key Files & Directories

*   `package.json`: Root configuration, scripts, and workspaces.
*   `docker-compose.yml`: Defines the containerized infrastructure and profiles.
*   `apps/api/src/index.ts`: Entry point for the backend.
*   `apps/web/src/App.tsx`: Main component for the frontend.
*   `apps/api/prisma/schema.prisma`: Database definition.
*   `docs/`: Comprehensive documentation (User Manual, Technical Manual, API definitions).
