<!-- markdownlint-disable MD025 MD024 MD036 -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Responder sempre em portugues brasileiro

## Visão Geral

OpenPanel é um painel de controle auto-hospedado (self-hosted) moderno para gerenciamento de servidores, com assistente de IA integrado. O projeto é um **monorepo** estruturado em npm workspaces, com arquitetura bem definida e foco em segurança, observabilidade e integração com IA.

## Estrutura do Monorepo

`
Open-Panel/
├── apps/
│   ├── api/          # Backend (Hono + Prisma + PostgreSQL)
│   └── web/          # Frontend (React + Vite + TypeScript)
├── packages/
│   └── shared/       # Tipos, validadores, utilitários compartilhados
├── docker-compose.yml # Infraestrutura local (Postgres, Redis, Ollama, Traefik)
└── docs/             # Documentação
`

## Stack Tecnológico

### Backend (apps/api)


### Frontend (apps/web)


### Shared (packages/shared)


## Comandos Principais

`bash

## Desenvolvimento (API + Web em paralelo)

npm run dev

## Dev isolado

npm run dev:api        # Apenas backend
npm run dev:web        # Apenas frontend

## Build production

npm run build          # Build de ambos
npm run build:api      # Build apenas API
npm run build:web      # Build apenas Web

## Database (Prisma)

npm run db:generate    # Gera Prisma client
npm run db:migrate     # Roda migrations
npm run db:push        # Sincroniza schema com BD
npm run db:studio      # Abre GUI do Prisma

## Type checking

npm run type-check     # TypeScript check em todos os packages

## Preview

npm run preview        # Preview da build web
`

## Arquitetura do Backend

### Estrutura de Pastas

`
apps/api/
├── routes/             # Rotas HTTP por feature (auth, users, teams, projects, etc)
├── services/           # Lógica de negócio (docker, git, backup, build, scheduler)
├── middlewares/        # Auth, RBAC, rate-limit, logging, encryption, audit
├── websocket/          # Gateway WebSocket para containers
├── queues/             # Processamento assíncro com BullMQ
├── lib/                # Utilitários (env, logger, validators)
├── db.ts               # Prisma client singleton
└── index.ts            # Aplicação Hono principal
`

### Padrões Importantes do Frontend


### Fluxos Críticos

1. **Deploy**: Git repo → Build container → Push Docker → Traefik roteamento
2. **WebSocket**: Container Gateway envia logs/eventos em tempo real
3. **Background Jobs**: BullMQ (Redis) para backups, builds assíncros
4. **IA Assistant**: Integração com OpenAI/Google GenAI/Ollama (LLM local)

## Arquitetura do Frontend

### Estrutura de Componentes

`
apps/web/
├── pages/              # Views por rota (Dashboard, Projects, Settings, etc)
├── components/         # Componentes reutilizáveis (Sidebar, Header, etc)
├── services/           # API client e lógica HTTP
├── hooks/              # Custom React hooks
└── types/              # Tipos TypeScript locais
`

### Padrões Importantes


## Configuração Ambiental

### Variáveis Críticas

### Backend (.env)


### Frontend (.env.local)


### Desenvolvimento Local

`bash

### 1. Instalar dependências

npm install

### 2. Copiar .env.example → .env.local e configurar

cp .env.example .env.local

### Configurar DATABASE_URL, REDIS_URL, JWT_SECRET, etc

### 3. Iniciar infraestrutura (Docker Compose)

docker-compose up -d

### 4. Setup database

npm run db:push

### 5. Iniciar desenvolvimento

npm run dev

### API rodando em <http://localhost:8000>

### Web rodando em <http://localhost:3000>

`

## Modelo de Dados Principal

**Entidades Chave** (Prisma schema):


**Enums Importantes**:


## Infraestrutura Local (Docker Compose)

Serviços containerizados inclusos:


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

`bash
npm run type-check   # Valida TypeScript em todos os packages
`

### Debugging


## Considerações de Segurança

1. **Autenticação**: JWT com refresh tokens (15m access, 7d refresh)
2. **Autorização**: RBAC middleware valida permissões
3. **Auditoria**: Todas as ações sensíveis registradas em AuditLog
4. **Rate Limiting**: Proteção em rotas críticas (auth, admin)
5. **Criptografia**: Dados sensíveis encriptados no banco
6. **CORS**: Controle rigoroso de origem
7. **Validação**: Zod schema em todas as entradas

## Informações Adicionais

