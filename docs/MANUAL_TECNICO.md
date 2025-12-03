# 🛠️ OpenPanel - Manual Técnico

Este documento detalha a arquitetura, design e especificações técnicas do OpenPanel.

---

## 🏗️ Arquitetura do Sistema

### Visão Geral
O OpenPanel utiliza uma arquitetura moderna baseada em serviços, facilitando a escalabilidade e manutenção.

**Stack Tecnológico:**
- **Backend**: Node.js 18+, Hono (API), Prisma (ORM)
- **Frontend**: React 19, Vite, TailwindCSS
- **Banco de Dados**: PostgreSQL + pgvector
- **Cache/Filas**: Redis + BullMQ
- **Proxy/Load Balancer**: Traefik
- **Containerização**: Docker & Docker Compose

### Estrutura Monorepo
O projeto segue uma estrutura monorepo para facilitar o compartilhamento de código:

```
Open-Panel/
├── apps/
│   ├── api/              # Backend (REST + WebSocket)
│   │   ├── src/
│   │   │   ├── routes/   # Endpoints da API
│   │   │   ├── services/ # Lógica de negócios
│   │   │   ├── websocket/# Gateways WebSocket
│   │   │   └── lib/      # Utilitários (env, prisma, logger)
│   │   └── prisma/       # Schema do banco
│   └── web/              # Frontend (SPA)
│       ├── components/   # Componentes React
│       ├── pages/        # Páginas da aplicação
│       ├── hooks/        # Hooks customizados
│       └── services/     # Serviços de API
├── packages/
│   └── shared/          # Tipos e validadores Zod compartilhados
└── docker-compose.yml   # Orquestração de serviços
```

---

## 🔌 API Reference

A API é construída com **Hono**, oferecendo alta performance e suporte a Edge Computing.

### Documentação Completa

- **[API REST - Documentação Completa](./API_REST.md)**: Referência completa de todos os endpoints REST
- **[API WebSocket - Protocolos](./API_WEBSOCKET.md)**: Documentação dos protocolos WebSocket
- **[Swagger UI](http://localhost:3001/api/docs)**: Interface interativa para explorar a API (disponível quando o servidor estiver rodando)

### Endpoints Principais

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| `POST` | `/api/auth/login` | Autenticação de usuários |
| `POST` | `/api/auth/2fa/verify` | Verificação de código 2FA |
| `GET` | `/api/projects` | Listar projetos |
| `POST` | `/api/projects` | Criar novo projeto |
| `GET` | `/api/containers` | Listar containers |
| `POST` | `/api/containers/:id/start` | Iniciar container |
| `GET` | `/api/templates` | Listar templates disponíveis |
| `POST` | `/api/templates/:id/deploy` | Deploy de template |
| `POST` | `/api/databases/:id/query` | Executar query no banco |
| `GET` | `/api/metrics` | Métricas do sistema |
| `GET` | `/api/health` | Health check da API |

### WebSockets

Utilizamos WebSockets para comunicação em tempo real.

**Gateways Disponíveis:**

| Endpoint | Descrição |
| -------- | --------- |
| `ws://host/ws/containers` | Status e logs de containers |
| `ws://host/ws/logs` | Streaming de logs em tempo real |
| `ws://host/ws/metrics` | Métricas em tempo real |
| `ws://host/ws/terminal` | Terminal interativo |

Para detalhes completos sobre os protocolos WebSocket, consulte a [documentação WebSocket](./API_WEBSOCKET.md).

---

## 💾 Banco de Dados

Utilizamos **Prisma ORM** com PostgreSQL.

### Singleton do Prisma
Para evitar conexões excessivas em ambientes Serverless/Edge:

```typescript
// apps/api/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Database Clients
Suportamos conexão direta a bancos de dados dos containers:

- **PostgreSQL**: Queries SQL via `pg` driver
- **MySQL**: Queries SQL via `mysql2` driver
- **MongoDB**: Comandos via `mongodb` driver
- **Redis**: Comandos via `ioredis`

---

## 🔒 Segurança

### Autenticação
- **JWT**: Access tokens (15min) + Refresh tokens (7 dias)
- **2FA**: TOTP via `otpauth` com QR Code
- **Backup Codes**: 10 códigos de uso único

### Autorização (RBAC)
| Role | Permissões |
| ---- | ---------- |
| OWNER | Tudo + deletar time |
| ADMIN | Gerenciar projetos e membros |
| MEMBER | Visualizar e operar containers |

### Proteções
- **Rate Limiting**: 100 req/min (API), 10 req/min (Auth)
- **CORS**: Origens permitidas via `CORS_ORIGIN`
- **Sanitização**: Todos os inputs validados com Zod
- **Headers**: HSTS, X-Content-Type-Options, X-Frame-Options

---

## 🎨 Design System

### Cores Principais
- **Primária**: `#4A7BA7` (Azul Dessaturado)
- **Secundária**: `#6B9B6E` (Verde Dessaturado)
- **Fundo Claro**: `#F8FAFC`
- **Fundo Escuro**: `#0f172a`

### Responsividade
Layout Mobile-First com breakpoints TailwindCSS:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

---

## ⚡ Performance

### Backend
- **Singleton Prisma**: Reutilização de conexões
- **Redis Cache**: TTL curto para dados voláteis
- **Streaming**: Logs e métricas via WebSocket
- **Build Otimizado**: Minificação com esbuild, tree-shaking habilitado
- **Source Maps**: Desabilitados em produção para reduzir tamanho

### Frontend
- **Code Splitting**: Lazy loading de componentes pesados (DashboardView, ProjectDetails, SettingsView, etc.)
- **Vendor Chunking**: Separação de dependências em chunks específicos:
  - `vendor-react`: React e React DOM (~240KB)
  - `vendor-terminal`: xterm e addons (~290KB)
  - `vendor-charts`: recharts (~168KB)
  - `vendor-ai`: @google/genai (~218KB)
  - `vendor`: Outras dependências (~136KB)
- **Component Chunking**: Componentes pesados em chunks próprios:
  - `terminal`: WebTerminal
  - `database-consoles`: Consoles de banco de dados
  - `marketplace`: Template Marketplace
- **Memoização**: `useMemo`/`useCallback` para cálculos pesados
- **Debounce**: Em inputs de busca (300ms)
- **Virtual Lists**: Para listas longas de logs
- **Suspense**: Loading states durante lazy loading
- **Bundle Analysis**: Script `npm run build:analyze` para análise de tamanho

### Otimizações de Build

#### Frontend (Vite)
- **Target**: `esnext` para melhor tree-shaking
- **Minificação**: esbuild (mais rápido que Terser)
- **CSS Code Splitting**: CSS separado por chunk
- **Chunk Size Warning**: Limite de 500KB por chunk
- **Compressed Size Reporting**: Relatório de tamanho gzip

#### Backend (tsup)
- **Minificação**: Habilitada em produção
- **Tree-shaking**: Automático
- **Source Maps**: Desabilitados em produção
- **Target**: ES2022 para compatibilidade moderna

### Análise de Bundle
Para analisar o tamanho dos bundles:
```bash
npm run build:analyze -w apps/web
```
Isso gera um relatório HTML em `apps/web/dist/stats.html` com visualização interativa dos chunks.

---

## 🧪 Testes

### Estrutura
```
apps/api/src/__tests__/
├── integration/     # Testes de integração
├── middlewares/     # Testes de middlewares
└── helpers/         # Utilitários de teste
```

### Comandos
```bash
npm run test -w apps/api        # Rodar testes
npm run test:watch -w apps/api  # Watch mode
npm run type-check              # Verificar tipos
```

---

> Para guias de contribuição e padrões de código, consulte o [Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md).
