# Architecture: System Architecture

Visão geral da arquitetura completa do OpenPanel.

## 🏗️ Arquitetura de Alto Nível

```
┌────────────────────────────────────────────────────────────────┐
│                        Navegador Web                            │
│                    (React SPA - Port 3000)                     │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                ┌──────────▼───────────┐
                │    CORS + Auth       │
                │   (JWT + Refresh)    │
                └──────────┬───────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐ ┌──────────────┐ ┌──────────────┐
    │  REST API  │ │  WebSocket   │ │  Webhooks    │
    │ (Port 8000)│ │  Gateway     │ │  Ingress     │
    │   (Hono)   │ │  (Logs/Logs) │ │  (Git)       │
    └──────┬─────┘ └──────┬───────┘ └──────┬───────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                ┌──────────▼───────────┐
                │  Middleware Stack    │
                │  - Auth              │
                │  - RBAC              │
                │  - Rate Limit        │
                │  - Logging           │
                │  - Error Handling    │
                └──────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Services│     │ Queues   │     │ External │
    │ - Auth   │     │ (BullMQ) │     │ Integrations│
    │ - Project│     │ - Backup │     │ - Docker │
    │ - Docker │     │ - Email  │     │ - Git    │
    │ - Deploy │     │ - Deploy │     │ - Traefik│
    │ - Domain │     │ - Health │     │ - Certbot│
    │ - Backup │     └──────────┘     │ - IA APIs│
    └──────┬───┘                       └──────────┘
           │
           ▼
    ┌────────────────────────────────────────┐
    │       PostgreSQL (Port 5432)           │
    │     - Prisma ORM + pgvector            │
    │     - Main Data Store                  │
    └────────────────────────────────────────┘
           ▲
           │
    ┌──────┴───────────────────────────────┐
    │     Redis (Port 6379)                 │
    │  - Cache                              │
    │  - Sessions                           │
    │  - Job Queue (BullMQ)                 │
    │  - Rate Limit Store                   │
    └──────────────────────────────────────┘

    ┌────────────────────────────────────────┐
    │   Docker Engine (Unix Socket)          │
    │  - Container Management                │
    │  - Image Building                      │
    │  - Log Streaming                       │
    └────────────────────────────────────────┘

    ┌────────────────────────────────────────┐
    │   Traefik (Ports 80/443/8080)          │
    │  - Reverse Proxy                       │
    │  - SSL/TLS Termination                 │
    │  - Service Discovery                   │
    └────────────────────────────────────────┘
```

## 🎯 Componentes Principais

### 1. Frontend (React SPA)

**Localização**: `apps/web`

```
apps/web/
├── pages/              # Rotas e views
│   ├── Login.tsx
│   ├── DashboardView.tsx
│   ├── ProjectDetails.tsx
│   ├── SettingsView.tsx
│   └── ...
├── components/         # Componentes React
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── CreateProjectModal.tsx
│   └── ...
├── services/          # API client
│   ├── api.ts
│   └── mockService.ts
├── types/             # Tipos TypeScript
│   └── index.ts
└── vite.config.ts    # Configuração Vite
```

**Stack Tecnológico**:
- React 19.2.0
- TypeScript
- Vite (build tool)
- TailwindCSS (UI)
- lucide-react (icons)
- recharts (gráficos)
- xterm.js (terminal web)

**Key Features**:
- SPA com lazy loading
- Real-time WebSocket connection
- localStorage persistence
- Error boundaries
- Responsive design

### 2. Backend API (Hono)

**Localização**: `apps/api`

```
apps/api/
├── routes/             # HTTP endpoints
│   ├── auth.ts
│   ├── projects.ts
│   ├── containers.ts
│   ├── deployments.ts
│   ├── domains.ts
│   ├── teams.ts
│   ├── users.ts
│   └── ...
├── services/          # Business logic
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── docker.service.ts
│   ├── deploy.service.ts
│   ├── domain.service.ts
│   ├── backup.service.ts
│   └── ...
├── middlewares/       # HTTP middleware
│   ├── auth.ts
│   ├── rbac.ts
│   ├── rate-limit.ts
│   ├── logging.ts
│   ├── error-handler.ts
│   └── ...
├── websocket/        # WebSocket handlers
│   ├── gateway.ts
│   └── handlers.ts
├── queues/           # Background jobs (BullMQ)
│   ├── backup.queue.ts
│   ├── deploy.queue.ts
│   └── ...
├── lib/              # Utilities
│   ├── logger.ts
│   ├── env.ts
│   ├── docker.ts
│   └── ...
├── db.ts             # Prisma client
└── index.ts          # App entry point
```

**Stack Tecnológico**:
- Hono (HTTP framework)
- Node.js with tsx (hot reload)
- Prisma (ORM)
- PostgreSQL
- Redis
- BullMQ (job queue)
- Zod (validation)
- JWT (authentication)
- bcryptjs (password hashing)
- Dockerode (Docker API)
- Winston (logging)

**Key Features**:
- RESTful API with 50+ endpoints
- WebSocket for real-time logs
- Job queue for background tasks
- Role-based access control (RBAC)
- Rate limiting
- Comprehensive logging
- Error handling with specificity
- API key authentication

### 3. Shared Package (TypeScript)

**Localização**: `packages/shared`

```
packages/shared/
├── src/
│   ├── types/         # Shared types
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── container.ts
│   │   └── ...
│   ├── validators/    # Zod schemas
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   └── ...
│   └── utils/        # Utilities
│       ├── index.ts
│       └── ...
├── package.json
└── tsconfig.json
```

**Purpose**:
- Shared TypeScript types
- Zod validation schemas
- Common utilities
- Exports for `/types`, `/utils`, `/validators`

**Imports**:
```typescript
// Types
import type { User, Project } from '@openpanel/shared'

// Validators
import { registerSchema, loginSchema } from '@openpanel/shared/validators'

// Utils
import { formatBytes, getEnvOrThrow } from '@openpanel/shared/utils'
```

### 4. Database (PostgreSQL + Prisma)

**Localização**: `apps/api/prisma/schema.prisma`

**Principais Modelos**:
- User - Autenticação e perfil
- Team - Colaboração
- Project - Aplicações containerizadas
- Container - Instâncias Docker
- Deployment - Build/deploy history
- Domain - Gerenciamento de domínios
- Backup - Sistema de backup
- AuditLog - Rastreamento de segurança
- ApiKey - Acesso programático

**Features**:
- Relações complexas
- Enums para status/papéis
- Timestamps (createdAt, updatedAt)
- Indexes para performance
- Cascade deletes

### 5. Infrastructure (Docker Compose)

**Localização**: `docker-compose.yml`

**Serviços**:
```yaml
postgres:
  image: ankane/pgvector
  ports: 5432
  purpose: Main database + IA embeddings

redis:
  image: redis:7-alpine
  ports: 6379
  purpose: Cache, sessions, job queue

ollama:
  image: ollama/ollama
  ports: 11434
  purpose: Local LLM for AI features

traefik:
  image: traefik:v3.0
  ports: 80, 443, 8080
  purpose: Reverse proxy, SSL, service discovery
```

---

## 🔄 Fluxos Críticos

### 1. Fluxo de Autenticação

```
User Login
  ↓
POST /api/auth/login
  ↓
Validate credentials (Zod)
  ↓
Compare password (bcryptjs)
  ↓
Generate JWT tokens
  ↓
Store in localStorage
  ↓
Redirect to Dashboard
```

### 2. Fluxo de Deploy

```
User clicks "Deploy"
  ↓
POST /api/builds
  ↓
Clone git repo
  ↓
Build Docker image
  ↓
Push to Docker daemon
  ↓
Create container
  ↓
Register with Traefik
  ↓
Send logs via WebSocket
  ↓
Update deployment status
```

### 3. Fluxo de Monitoramento

```
Container running
  ↓
Periodically (2-5s):
  - Get container stats
  - Check health
  - Store in Redis
  ↓
Frontend polls /api/containers/stats
  ↓
Display metrics in real-time charts
```

---

## 🔐 Segurança em Camadas

```
┌─────────────────────────────────────┐
│     Network Level                   │
│  - HTTPS/TLS (Traefik)              │
│  - Firewall rules                   │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│     Application Level               │
│  - CORS validation                  │
│  - Rate limiting                    │
│  - Request validation (Zod)         │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│     Authentication Level            │
│  - JWT tokens                       │
│  - Refresh token rotation           │
│  - API key validation               │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│     Authorization Level             │
│  - RBAC (Role-Based Access)         │
│  - Resource-level permissions       │
│  - Team isolation                   │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│     Data Level                      │
│  - Password hashing (bcryptjs)      │
│  - Sensitive data encryption        │
│  - SQL injection prevention         │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│     Audit & Monitoring              │
│  - Audit logs                       │
│  - Security monitoring              │
│  - Incident response                │
└─────────────────────────────────────┘
```

---

## 📊 Escalabilidade

### Horizontal Scaling

```
Multiple API instances
  ↓
Load balancer (Traefik)
  ↓
Shared database (PostgreSQL)
  ↓
Shared cache (Redis)
  ↓
Shared Docker daemon (or cluster)
```

### Caching Strategy

- **Redis Cache**: Projetos, containers, configurações
- **Frontend Cache**: localStorage para sessão
- **Database Indexes**: Performance queries

### Job Queue Architecture

- BullMQ + Redis
- Background tasks: backups, emails, deployments
- Retries com exponential backoff
- Worker pool configurável

---

## 🧪 Testabilidade

### Unit Tests (Vitest)

```
services/
  ├── auth.service.test.ts
  ├── project.service.test.ts
  └── ...

lib/
  ├── docker.test.ts
  └── ...
```

### Integration Tests

```
routes/
  ├── auth.integration.test.ts
  ├── projects.integration.test.ts
  └── ...
```

### E2E Tests

```
e2e/
  ├── auth.flow.test.ts
  ├── project.creation.test.ts
  └── ...
```

---

## 🚀 Deployment

### Development

```bash
npm run dev        # Frontend + Backend local
docker-compose up  # Infrastructure
```

### Production

```bash
Docker Compose (single node)
  or
Kubernetes (multi-node)
  with
  - Nginx Ingress
  - StatefulSet for DB
  - Sealed Secrets for API keys
```

---

## 📈 Performance Targets

| Métrica | Target | Current |
|---------|--------|---------|
| API Response Time | <100ms | ~80ms |
| Page Load | <2s | ~1.5s |
| DB Query | <50ms | ~30ms |
| WebSocket Latency | <100ms | ~50ms |
| Uptime | 99.9% | ~99.8% |

---

## 🔗 Relacionados

- [Backend Architecture](./02-backend-architecture.md)
- [Frontend Architecture](./03-frontend-architecture.md)
- [Database Design](./04-database-design.md)
- [API Design](./05-api-design.md)
- [Security Architecture](./06-security-architecture.md)

---

**Versão**: 0.1.0
**Última atualização**: 2024-11-24
