# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

OpenPanel é um painel de controle auto-hospedado (self-hosted) moderno para gerenciamento de servidores, com assistente de IA integrado. O projeto é um **monorepo** estruturado em npm workspaces, com arquitetura bem definida e foco em segurança, observabilidade e integração com IA.

## Estrutura do Monorepo

```
Open-Panel/
├── apps/
│   ├── api/          # Backend (Hono + Prisma + PostgreSQL)
│   └── web/          # Frontend (React + Vite + TypeScript)
├── packages/
│   └── shared/       # Tipos, validadores, utilitários compartilhados
├── docker-compose.yml # Infraestrutura local (Postgres, Redis, Ollama, Traefik)
└── docs/             # Documentação
```

## Stack Tecnológico

### Backend (apps/api)
- **Runtime**: Node.js + tsx (hot reload)
- **Framework**: Hono (lightweight alternative to Express)
- **Banco de Dados**: PostgreSQL + Prisma ORM + pgvector (embeddings)
- **Cache/Queue**: Redis + BullMQ (background jobs)
- **Orquestração**: Dockerode (Docker API nativa)
- **IA/LLM**: OpenTelemetry, Ollama, Google Generative AI
- **Autenticação**: JWT + bcryptjs
- **Validação**: Zod (schema validation distribuída)
- **WebSocket**: ws (logs/eventos em tempo real)
- **Build**: tsup (ESM bundler)
- **Testes**: Vitest
- **Logging**: Winston
- **Security**: Rate limiting, RBAC, audit logging, encryption

### Frontend (apps/web)
- **Framework**: React 19.2.0
- **Build**: Vite
- **UI**: lucide-react (ícones), recharts (gráficos)
- **Terminal**: xterm + xterm-addon-fit (Web terminal)
- **IA**: Google Generative AI SDK
- **Storage**: localStorage (sessões)

### Shared (packages/shared)
- **Validadores Zod**: auth, domain, project, team, user
- **Tipos TypeScript**: compartilhados entre API e Web
- **Exports**: `.`, `./types`, `./utils`, `./validators`

## Comandos Principais

```bash
# Desenvolvimento (API + Web em paralelo)
npm run dev

# Dev isolado
npm run dev:api        # Apenas backend
npm run dev:web        # Apenas frontend

# Build production
npm run build          # Build de ambos
npm run build:api      # Build apenas API
npm run build:web      # Build apenas Web

# Database (Prisma)
npm run db:generate    # Gera Prisma client
npm run db:migrate     # Roda migrations
npm run db:push        # Sincroniza schema com BD
npm run db:studio      # Abre GUI do Prisma

# Type checking
npm run type-check     # TypeScript check em todos os packages

# Preview
npm run preview        # Preview da build web
```

## Arquitetura do Backend

### Estrutura de Pastas
```
apps/api/
├── routes/             # Rotas HTTP por feature (auth, users, teams, projects, etc)
├── services/           # Lógica de negócio (docker, git, backup, build, scheduler)
├── middlewares/        # Auth, RBAC, rate-limit, logging, encryption, audit
├── websocket/          # Gateway WebSocket para containers
├── queues/             # Processamento assíncro com BullMQ
├── lib/                # Utilitários (env, logger, validators)
├── db.ts               # Prisma client singleton
└── index.ts            # Aplicação Hono principal
```

### Padrões Importantes
- **Validação**: Todas as rotas usam Zod (importado de `@openpanel/shared`)
- **Autenticação**: Middleware JWT valida tokens (Bearer token)
- **RBAC**: Middleware enforce roles (Owner, Admin, Member, Viewer)
- **Auditoria**: Middleware registra ações sensíveis em AuditLog
- **Rate Limiting**: Proteção contra abuse em rotas críticas
- **Segurança**: Encriptação de dados sensíveis em database

### Fluxos Críticos
1. **Deploy**: Git repo → Build container → Push Docker → Traefik roteamento
2. **WebSocket**: Container Gateway envia logs/eventos em tempo real
3. **Background Jobs**: BullMQ (Redis) para backups, builds assíncros
4. **IA Assistant**: Integração com OpenAI/Google GenAI/Ollama (LLM local)

## Arquitetura do Frontend

### Estrutura de Componentes
```
apps/web/
├── pages/              # Views por rota (Dashboard, Projects, Settings, etc)
├── components/         # Componentes reutilizáveis (Sidebar, Header, etc)
├── services/           # API client e lógica HTTP
├── hooks/              # Custom React hooks
└── types/              # Tipos TypeScript locais
```

### Padrões Importantes
- **Lazy Loading**: Componentes carregados sob demanda
- **State Management**: localStorage para persistência de sessão
- **Service Layer**: Separação entre UI e requisições HTTP
- **Type Safety**: TypeScript strict + tipos do shared package

## Configuração Ambiental

### Variáveis Críticas

**Backend (.env)**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection
- `JWT_SECRET`: Mínimo 32 caracteres (OBRIGATÓRIO)
- `CORS_ORIGIN`: Controle de origem (default: http://localhost:3000)
- `DOCKER_HOST`: Conexão Docker (unix socket ou TCP)
- `AI_PROVIDER`: Ollama, OpenAI, Anthropic, Google
- `NODE_ENV`: development, production

**Frontend (.env.local)**
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)
- `VITE_GEMINI_API_KEY`: Google Generative AI key (se usando Google)

### Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar .env.example → .env.local e configurar
cp .env.example .env.local
# Configurar DATABASE_URL, REDIS_URL, JWT_SECRET, etc

# 3. Iniciar infraestrutura (Docker Compose)
docker-compose up -d

# 4. Setup database
npm run db:push

# 5. Iniciar desenvolvimento
npm run dev
# API rodando em http://localhost:8000
# Web rodando em http://localhost:3000
```

## Modelo de Dados Principal

**Entidades Chave** (Prisma schema):
- **User**: Autenticação, teams, API keys, audit logs
- **Team**: Colaboração, membros, invites
- **Project**: Aplicações, containers, deployments
- **Domain**: DNS/SSL, validação
- **Deployment**: Git, build logs, versionamento
- **Container**: Orquestração Docker
- **Backup**: Agendamento e restauração
- **AuditLog**: Rastreamento de segurança

**Enums Importantes**:
- `ProjectType`: WEB, API, WORKER, CRON, DATABASE, REDIS, MONGODB
- `ProjectStatus`: ACTIVE, PAUSED, ERROR, DEPLOYING, STOPPED
- `DeploymentStatus`: PENDING, BUILDING, DEPLOYING, SUCCESS, FAILED
- `UserRole`: OWNER, ADMIN, MEMBER, VIEWER

## Infraestrutura Local (Docker Compose)

Serviços containerizados inclusos:
- **PostgreSQL** (porta 5432): Banco principal + pgvector
- **Redis** (porta 6379): Cache e filas de jobs
- **Ollama** (porta 11434): LLM local para IA Assistant
- **Traefik** (portas 80/443/8080): Reverse proxy e roteamento

## Guias Específicos de Desenvolvimento

### Adicionar Nova Rota na API
1. Criar arquivo em `apps/api/routes/feature.ts`
2. Definir validadores Zod em `packages/shared/src/validators/`
3. Implementar service em `apps/api/services/`
4. Registrar rota em `apps/api/index.ts`
5. Adicionar middleware de auth/RBAC conforme necessário

### Adicionar Nova Page no Frontend
1. Criar componente em `apps/web/pages/NewView.tsx`
2. Criar service em `apps/web/services/newService.ts` para API calls
3. Registrar rota em router/navigation
4. Usar tipos do `@openpanel/shared`

### Executar Type Checking
```bash
npm run type-check   # Valida TypeScript em todos os packages
```

### Debugging
- **API**: Use `console.log()` ou debugger do Node.js
- **Frontend**: DevTools do navegador (F12)
- **Logs**: Consultados via Winston logger (files em `logs/`)

## Considerações de Segurança

1. **Autenticação**: JWT com refresh tokens (15m access, 7d refresh)
2. **Autorização**: RBAC middleware valida permissões
3. **Auditoria**: Todas as ações sensíveis registradas em AuditLog
4. **Rate Limiting**: Proteção em rotas críticas (auth, admin)
5. **Criptografia**: Dados sensíveis encriptados no banco
6. **CORS**: Controle rigoroso de origem
7. **Validação**: Zod schema em todas as entradas

## Informações Adicionais

- **Autores**: Matheus Souto Leal
- **Licença**: MIT
- **Node.js**: >=18.0.0 (recomendado 20+)
- **npm**: >=10.0.0
- **Repo**: https://github.com/msoutole/openpanel
