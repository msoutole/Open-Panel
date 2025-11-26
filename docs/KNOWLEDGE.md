# 📚 OpenPanel - Knowledge Base

> **Versão**: 0.2.0 (Alpha)  
> **Última Atualização**: 2025-11-25  
> **Objetivo**: Documentação completa do conhecimento do projeto OpenPanel

---

## 🎯 Visão Geral do Projeto

### O que é o OpenPanel?

OpenPanel é um **painel de controle moderno self-hosted** para gerenciamento de aplicações com **assistente IA integrado**. Construído para a comunidade open-source, combina a simplicidade de plataformas como EasyPanel com automação inteligente alimentada por IA.

### Diferenciais Únicos

1. **100% Open Source** (MIT License) - Incluindo o core completo
2. **Assistente IA Integrado** - Multi-provider (Gemini, Groq, Ollama)
3. **Privacy-First** - Suporte para IA local (Ollama) 
4. **Stack Moderna** - Bun + Hono + React 18 + TypeScript

### Status Atual

- 📅 **Iniciado**: Janeiro 2025
- 🎯 **Meta de Lançamento**: v1.0 - Julho 2025
- 📈 **Progresso**: ~35% (Fase 1: 85%, Fase 2: 40%, Fase 5: 30%)
- 📝 **Linhas de Código**: ~15.000+ TypeScript
- 🧪 **Cobertura de Testes**: 20% (meta: 70%+)

---

## 🏗️ Arquitetura do Sistema

### Estrutura do Projeto (Monorepo)

```
openpanel/
├── apps/
│   ├── api/              # Backend API (Hono + Bun)
│   │   ├── prisma/       # Database schema e migrations
│   │   ├── src/
│   │   │   ├── routes/   # 14 rotas de API
│   │   │   ├── services/ # 10 serviços de negócio
│   │   │   ├── middlewares/ # 7 middlewares
│   │   │   ├── queues/   # Sistema de filas (BullMQ)
│   │   │   └── websocket/ # WebSocket para logs
│   │   └── __tests__/    # Testes unitários
│   │
│   └── web/              # Frontend (React 18 + Vite)
│       └── src/
│           ├── pages/    # 14+ páginas
│           ├── components/ # Componentes reutilizáveis
│           ├── store/    # Zustand state management
│           └── api/      # Cliente de API
│
├── packages/
│   └── shared/           # Código compartilhado
│       ├── types/        # TypeScript types
│       ├── utils/        # Funções utilitárias
│       └── constants/    # Constantes globais
│
├── docs/                 # Documentação (40+ arquivos)
├── scripts/              # Scripts de automação
└── docker-compose.yml    # Infraestrutura local
```

### Padrão de Arquitetura

**Backend**: Clean Architecture adaptada
- **Routes**: Definição de endpoints e validação
- **Services**: Lógica de negócio
- **Repositories**: Acesso a dados (Prisma)
- **Middlewares**: Autenticação, autorização, validação
- **Queues**: Processamento assíncrono

**Frontend**: Feature-based Architecture
- **Pages**: Componentes de página
- **Components**: Componentes reutilizáveis
- **Store**: Estado global (Zustand)
- **API**: Cliente HTTP com TanStack Query

---

## 🗄️ Modelo de Dados (Database Schema)

### Entidades Principais (25+ modelos)

#### 1. **Autenticação e Usuários**

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String
  password      String
  avatar        String?
  status        UserStatus  @default(ACTIVE)
  emailVerified DateTime?
  
  // Relations
  teams         TeamMember[]
  projects      Project[]
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]
  notifications Notification[]
}

enum UserRole { OWNER, ADMIN, MEMBER, VIEWER }
enum UserStatus { ACTIVE, INACTIVE, SUSPENDED }
```

**Funcionalidades**:
- ✅ Autenticação JWT
- ✅ RBAC com 4 níveis (Owner, Admin, Member, Viewer)
- 🚧 2FA (estrutura pronta, não implementada)
- ✅ API Keys com expiração

#### 2. **Teams & Colaboração**

```prisma
model Team {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  description String?
  avatar      String?
  
  // Relations
  members     TeamMember[]
  projects    Project[]
  invites     TeamInvite[]
}

model TeamMember {
  userId    String
  teamId    String
  role      UserRole    @default(MEMBER)
  joinedAt  DateTime    @default(now())
}

model TeamInvite {
  email     String
  role      UserRole    @default(MEMBER)
  token     String      @unique
  expiresAt DateTime
  teamId    String
}
```

**Funcionalidades**:
- ✅ Criação e gerenciamento de times
- ✅ Sistema de convites com tokens únicos
- ✅ Roles por membro
- ✅ Multi-projeto por time

#### 3. **Projetos e Aplicações**

```prisma
model Project {
  id          String        @id @default(cuid())
  name        String
  slug        String
  description String?
  type        ProjectType   @default(WEB)
  status      ProjectStatus @default(STOPPED)
  
  // Docker config
  dockerImage String?
  dockerTag   String?       @default("latest")
  dockerfile  String?
  buildContext String?      @default(".")
  
  // Git config
  gitProvider String?       // github, gitlab, bitbucket
  gitUrl      String?
  gitBranch   String?       @default("main")
  gitAutoDeployEnabled Boolean @default(false)
  
  // Deployment config
  replicas    Int           @default(1)
  cpuLimit    String?       @default("1000m")
  memoryLimit String?       @default("512Mi")
  
  // Relations
  ownerId     String
  teamId      String?
  envVars     EnvVar[]
  domains     Domain[]
  deployments Deployment[]
  logs        Log[]
  backups     Backup[]
  containers  Container[]
}

enum ProjectType { WEB, API, WORKER, CRON, DATABASE, REDIS, MONGODB }
enum ProjectStatus { ACTIVE, PAUSED, ERROR, DEPLOYING, STOPPED }
```

**Funcionalidades**:
- ✅ 7 tipos de projetos
- ✅ Configuração Docker completa
- ✅ Integração Git (GitHub, GitLab, Bitbucket)
- ✅ Deploy automático via webhook
- ✅ Gerenciamento de recursos (CPU, RAM)
- ✅ Variáveis de ambiente por projeto

#### 4. **Containers & Docker**

```prisma
model Container {
  id              String          @id @default(cuid())
  dockerId        String          @unique
  name            String
  image           String
  imageTag        String          @default("latest")
  status          ContainerStatus @default(CREATED)
  
  // Resources
  cpuLimit        String?         @default("1000m")
  memoryLimit     String?         @default("512Mi")
  
  // Networking
  ports           Json?
  networkMode     String?         @default("bridge")
  hostname        String?
  
  // Volumes
  volumes         Json?
  
  // Statistics (cached)
  cpuUsage        Float?
  memoryUsage     BigInt?
  networkRx       BigInt?
  networkTx       BigInt?
  
  // State
  startedAt       DateTime?
  finishedAt      DateTime?
  exitCode        Int?
  
  // Relations
  projectId       String?
  project         Project?
}

enum ContainerStatus {
  CREATED, RUNNING, PAUSED, RESTARTING, 
  REMOVING, EXITED, DEAD
}
```

**Funcionalidades**:
- ✅ Rastreamento de containers Docker
- ✅ Métricas em tempo real (CPU, RAM, Network)
- ✅ Gerenciamento de portas e volumes
- ✅ Logs via WebSocket
- 🚧 Integração dockerode completa (em andamento)

#### 5. **Domínios & SSL**

```prisma
model Domain {
  id              String       @id @default(cuid())
  name            String       @unique
  status          DomainStatus @default(PENDING)
  
  // SSL Configuration
  sslEnabled      Boolean      @default(true)
  sslAutoRenew    Boolean      @default(true)
  sslExpiresAt    DateTime?
  
  // DNS Configuration
  dnsProvider     String?      // cloudflare, route53, digitalocean
  dnsZoneId       String?
  dnsRecordId     String?
  
  // Relations
  projectId       String
  project         Project
}

enum DomainStatus { PENDING, ACTIVE, ERROR, VERIFYING }
```

**Funcionalidades**:
- ✅ CRUD de domínios
- ✅ 3 DNS providers (Cloudflare, Route53, DigitalOcean)
- ✅ Estrutura SSL (Let's Encrypt planejado)
- ✅ Auto-renovação de certificados

#### 6. **Deployments & Logs**

```prisma
model Deployment {
  id              String           @id @default(cuid())
  version         String
  status          DeploymentStatus @default(PENDING)
  
  // Build info
  buildLogs       String?          @db.Text
  buildDuration   Int?
  
  // Deploy info
  deployLogs      String?          @db.Text
  deployDuration  Int?
  
  // Git info
  gitCommitHash   String?
  gitCommitMessage String?
  gitAuthor       String?
  
  // Relations
  projectId       String
  project         Project
}

enum DeploymentStatus {
  PENDING, BUILDING, DEPLOYING, 
  SUCCESS, FAILED, CANCELLED
}

model Log {
  id        String   @id @default(cuid())
  level     LogLevel @default(INFO)
  message   String   @db.Text
  metadata  Json?
  projectId String
  timestamp DateTime @default(now())
}

enum LogLevel { DEBUG, INFO, WARN, ERROR, FATAL }
```

**Funcionalidades**:
- ✅ Histórico completo de deploys
- ✅ Logs de build e deploy
- ✅ Rastreamento de commits Git
- ✅ Streaming de logs em tempo real (WebSocket)
- ✅ Níveis de log estruturados

#### 7. **Backups & Recovery**

```prisma
model Backup {
  id          String       @id @default(cuid())
  filename    String
  size        BigInt
  status      BackupStatus @default(PENDING)
  
  // S3 info
  s3Key       String?
  s3Bucket    String?
  
  // Metadata
  createdAt   DateTime     @default(now())
  completedAt DateTime?
  expiresAt   DateTime?
  
  projectId   String
}

enum BackupStatus {
  PENDING, IN_PROGRESS, COMPLETED, FAILED
}
```

**Funcionalidades**:
- ✅ Estrutura de backups
- ✅ Suporte S3-compatible storage
- 🚧 Criptografia AES-256 (planejado)
- 🚧 Backups agendados (planejado)

#### 8. **Auditoria & Notificações**

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  resourceId  String?
  resourceType String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  userId      String
  createdAt   DateTime    @default(now())
}

enum AuditAction {
  USER_LOGIN, USER_LOGOUT, USER_CREATED, USER_UPDATED, USER_DELETED,
  PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED, PROJECT_DEPLOYED,
  DOMAIN_ADDED, DOMAIN_REMOVED,
  TEAM_CREATED, TEAM_UPDATED, TEAM_MEMBER_ADDED, TEAM_MEMBER_REMOVED,
  BACKUP_CREATED, BACKUP_RESTORED
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType @default(INFO)
  title     String
  message   String           @db.Text
  read      Boolean          @default(false)
  metadata  Json?
  userId    String
  createdAt DateTime         @default(now())
  readAt    DateTime?
}

enum NotificationType { INFO, SUCCESS, WARNING, ERROR }
```

**Funcionalidades**:
- ✅ 20+ tipos de ações rastreadas
- ✅ Rastreamento de IP e User Agent
- ✅ Sistema de notificações
- ✅ Metadata JSON flexível

---

## 🛠️ Stack Tecnológica

### Backend

| Tecnologia      | Versão | Propósito                       |
| --------------- | ------ | ------------------------------- |
| **Bun**         | 1.0+   | Runtime JavaScript ultra-rápido |
| **Hono**        | 4.10+  | Framework web minimalista       |
| **TypeScript**  | 5.7+   | Type safety                     |
| **Prisma**      | Latest | ORM e migrations                |
| **PostgreSQL**  | 16     | Database principal              |
| **Redis**       | 7      | Cache e sessões                 |
| **BullMQ**      | Latest | Sistema de filas                |
| **dockerode**   | Latest | Cliente Docker API              |
| **acme-client** | Latest | Let's Encrypt (SSL)             |
| **Zod**         | Latest | Validação de schemas            |

### Frontend

| Tecnologia          | Versão | Propósito                |
| ------------------- | ------ | ------------------------ |
| **React**           | 19.2+  | UI library               |
| **TypeScript**      | 5.7+   | Type safety              |
| **Vite**            | 6.0+   | Build tool e dev server  |
| **TailwindCSS**     | 4.1+   | Styling framework        |
| **shadcn/ui**       | Latest | Component library        |
| **Radix UI**        | Latest | Primitives acessíveis    |
| **Zustand**         | Latest | State management         |
| **TanStack Query**  | 5.90+  | Data fetching            |
| **React Hook Form** | Latest | Formulários              |
| **Zod**             | Latest | Validação de formulários |
| **xterm.js**        | Latest | Terminal web             |
| **Recharts**        | Latest | Gráficos e métricas      |
| **Framer Motion**   | 12.23+ | Animações                |

### IA & Multi-Provider

| Tecnologia | Propósito               |
| ---------- | ----------------------- |
| **Gemini** | IA Generativa do Google |
| **Groq**   | Inferência ultra-rápida |
| **Ollama** | Modelos locais/privados |

### Infraestrutura

| Tecnologia         | Propósito              |
| ------------------ | ---------------------- |
| **Docker**         | Containerização        |
| **Docker Compose** | Orquestração local     |
| **Traefik**        | Reverse proxy v3       |
| **GitHub Actions** | CI/CD                  |
| **Prometheus**     | Métricas (planejado)   |
| **Grafana**        | Dashboards (planejado) |

---

## 🔌 API REST

### Rotas Implementadas (14 rotas)

#### Autenticação
```typescript
POST   /api/auth/register      // Registro de usuário
POST   /api/auth/login         // Login
POST   /api/auth/logout        // Logout
GET    /api/auth/me            // Usuário atual
```

#### Usuários
```typescript
GET    /api/users              // Listar usuários
GET    /api/users/:id          // Obter usuário
PATCH  /api/users/:id          // Atualizar usuário
DELETE /api/users/:id          // Deletar usuário
```

#### Teams
```typescript
GET    /api/teams              // Listar times
POST   /api/teams              // Criar time
GET    /api/teams/:id          // Obter time
PATCH  /api/teams/:id          // Atualizar time
DELETE /api/teams/:id          // Deletar time
POST   /api/teams/:id/members  // Adicionar membro
DELETE /api/teams/:id/members/:userId  // Remover membro
POST   /api/teams/:id/invites  // Criar convite
GET    /api/teams/invites/:token  // Aceitar convite
```

#### Projetos
```typescript
GET    /api/projects           // Listar projetos
POST   /api/projects           // Criar projeto
GET    /api/projects/:id       // Obter projeto
PATCH  /api/projects/:id       // Atualizar projeto
DELETE /api/projects/:id       // Deletar projeto
POST   /api/projects/:id/deploy  // Deploy projeto
GET    /api/projects/:id/logs  // Logs do projeto
```

#### Containers
```typescript
GET    /api/containers         // Listar containers
GET    /api/containers/:id     // Obter container
POST   /api/containers/:id/start    // Iniciar
POST   /api/containers/:id/stop     // Parar
POST   /api/containers/:id/restart  // Reiniciar
DELETE /api/containers/:id     // Deletar
GET    /api/containers/:id/logs     // Logs (WebSocket)
GET    /api/containers/:id/stats    // Métricas
```

#### Domínios
```typescript
GET    /api/domains            // Listar domínios
POST   /api/domains            // Criar domínio
GET    /api/domains/:id        // Obter domínio
PATCH  /api/domains/:id        // Atualizar domínio
DELETE /api/domains/:id        // Deletar domínio
POST   /api/domains/:id/verify // Verificar DNS
```

#### Deploys
```typescript
GET    /api/deployments        // Listar deploys
GET    /api/deployments/:id    // Obter deploy
POST   /api/deployments/:id/cancel  // Cancelar deploy
```

#### Audit Logs
```typescript
GET    /api/audit-logs         // Listar logs de auditoria
GET    /api/audit-logs/:id     // Obter log
```

#### API Keys
```typescript
GET    /api/api-keys           // Listar API keys
POST   /api/api-keys           // Criar API key
DELETE /api/api-keys/:id       // Deletar API key
```

### Padrões de API

**Autenticação**: JWT Bearer Token
```
Authorization: Bearer <token>
```

**Validação**: Zod schemas em todas as rotas

**Paginação**: Query params
```
?page=1&limit=20&sort=createdAt:desc
```

**Filtros**: Query params
```
?status=ACTIVE&type=WEB&search=myapp
```

**Erro Handling**: Formato padronizado
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

---

## 🎨 Frontend (Interface)

### Páginas Implementadas (14+ páginas)

```
/                        # Landing page
/login                   # Login
/register                # Registro
/dashboard               # Dashboard principal
/projects                # Lista de projetos
/projects/:id            # Detalhes do projeto
/projects/:id/deploy     # Deploy do projeto
/projects/:id/logs       # Logs do projeto
/projects/:id/settings   # Configurações do projeto
/containers              # Lista de containers
/containers/:id          # Detalhes do container
/teams                   # Lista de times
/teams/:id               # Detalhes do time
/domains                 # Lista de domínios
/settings                # Configurações do usuário
/settings/api-keys       # API Keys
```

### Componentes Principais

**Layout**:
- `AppLayout` - Layout principal com sidebar
- `AuthLayout` - Layout para páginas de autenticação
- `DashboardLayout` - Layout do dashboard

**Navegação**:
- `Sidebar` - Menu lateral com navegação
- `Header` - Cabeçalho com usuário e notificações
- `Breadcrumbs` - Navegação contextual

**Projeto**:
- `ProjectCard` - Card de projeto
- `ProjectList` - Lista de projetos
- `ProjectForm` - Formulário de criação/edição
- `ProjectMetrics` - Métricas do projeto
- `DeployButton` - Botão de deploy
- `LogViewer` - Visualizador de logs

**Container**:
- `ContainerCard` - Card de container
- `ContainerList` - Lista de containers
- `ContainerStats` - Estatísticas em tempo real
- `ContainerActions` - Ações (start, stop, restart)
- `Terminal` - Terminal web (xterm.js)

**Domínios**:
- `DomainCard` - Card de domínio
- `DomainForm` - Formulário de domínio
- `SSLStatus` - Status do certificado SSL

**UI Compartilhados** (shadcn/ui):
- `Button`, `Input`, `Select`, `Textarea`
- `Card`, `Dialog`, `Dropdown`, `Tabs`
- `Toast`, `Tooltip`, `Avatar`
- `Table`, `Badge`, `Separator`

### Estado Global (Zustand)

```typescript
// useAuthStore
{
  user: User | null
  token: string | null
  login: (email, password) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

// useProjectStore
{
  projects: Project[]
  currentProject: Project | null
  fetchProjects: () => Promise<void>
  createProject: (data) => Promise<void>
  updateProject: (id, data) => Promise<void>
  deleteProject: (id) => Promise<void>
}

// useContainerStore
{
  containers: Container[]
  fetchContainers: () => Promise<void>
  startContainer: (id) => Promise<void>
  stopContainer: (id) => Promise<void>
  restartContainer: (id) => Promise<void>
- Access Token: 15 minutos
- Refresh Token: 7 dias
- Armazenamento: httpOnly cookies

**RBAC (Role-Based Access Control)**:
```typescript
enum UserRole {
  OWNER    // Full access
  ADMIN    // Manage projects, members
  MEMBER   // View and edit own projects
  VIEWER   // Read-only access
}
```

**API Keys**:
- Geração segura com crypto
- Expiração configurável
- Rastreamento de uso (lastUsedAt)

### Boas Práticas

1. **Password Hashing**: bcrypt com salt rounds = 10
2. **Input Validation**: Zod schemas em todas as rotas
3. **SQL Injection**: Prisma ORM (parametrized queries)
4. **XSS Prevention**: Sanitização de inputs
5. **CORS**: Configurado para domínios permitidos
6. **Rate Limiting**: Implementado em endpoints sensíveis
7. **Audit Logging**: 20+ ações rastreadas
8. **Secrets**: Nunca logar ou expor em APIs

### Criptografia

**Backups**: AES-256 (planejado)
**Env Vars secretas**: Marcadas com `isSecret: true`
**SSL/TLS**: Let's Encrypt automático (planejado)

---

## 📊 Funcionalidades Implementadas

### ✅ Completamente Implementado

1. **Autenticação**
   - ✅ Registro e login
   - ✅ JWT tokens
   - ✅ RBAC com 4 roles
   - ✅ API Keys

2. **Gerenciamento de Projetos**
   - ✅ CRUD completo
   - ✅ 7 tipos de projetos
   - ✅ Variáveis de ambiente
   - ✅ Configuração Docker
   - ✅ Configuração Git

3. **Teams & Colaboração**
   - ✅ Criação de times
   - ✅ Sistema de convites
   - ✅ Gerenciamento de membros
   - ✅ Roles por membro

4. **Containers**
   - ✅ Listagem de containers
   - ✅ Start/Stop/Restart
   - ✅ Métricas em tempo real

5. **Domínios**
   - ✅ CRUD de domínios
   - ✅ 3 DNS providers
   - ✅ Estrutura SSL

6. **Logs**
   - ✅ Streaming em tempo real (WebSocket)
   - ✅ 5 níveis de log
   - ✅ Filtros e busca

7. **Agentes**
   - ✅ 6 tipos de agentes
   - ✅ Sistema de crews
   - ✅ Mensagens entre agentes
   - ✅ Rastreamento de execuções

8. **Auditoria**
   - ✅ 20+ tipos de ações
   - ✅ Rastreamento de IP
   - ✅ Metadata JSON

### 🚧 Parcialmente Implementado

1. **Deploy via Git**
   - ✅ Estrutura pronta
   - ✅ Configuração Git no projeto
   - 🚧 Clone automático
   - 🚧 Webhooks

2. **Integração Docker**
   - ✅ Estrutura completa
   - ✅ Models e tipos
   - 🚧 dockerode completo
   - 🚧 Build systems ativos

3. **Interface IA**
   - ✅ Backend pronto
   - ✅ Estrutura de agentes
   - 🚧 Frontend de chat
   - 🚧 Análise de logs

4. **Traefik**
   - ✅ Configuração estática
   - ✅ Docker Compose setup
   - 🚧 Roteamento dinâmico
   - 🚧 SSL automático

### 🔜 Planejado (Roadmap)

**Fase 4: Databases (Sprints 7-8)**
- [ ] Templates PostgreSQL, MySQL, MongoDB, Redis
- [ ] Consoles de gerenciamento
- [ ] Backups automáticos
- [ ] Restore de backups

**Fase 5: Assistente IA (Sprints 9-10)**
- [ ] Interface de chat completa
- [ ] Análise de logs & troubleshooting
- [ ] Geração de código (Dockerfiles, configs)
- [ ] Scanning de segurança

**Fase 6: Features Avançadas (Sprints 11-12)**
- [ ] Prometheus + Grafana
- [ ] Marketplace de templates
- [ ] API webhooks
- [ ] Cluster multi-nó

---

## 🧪 Testes

### Cobertura Atual: 20%

**Meta**: 70%+ de cobertura

### Estrutura de Testes

```
apps/api/src/__tests__/
├── auth.test.ts         # Testes de autenticação
├── projects.test.ts     # Testes de projetos
├── teams.test.ts        # Testes de times
├── containers.test.ts   # Testes de containers
└── agents.test.ts       # Testes de agentes
```

### Comandos

```bash
# Executar todos os testes
pnpm test

# Testes em watch mode
pnpm test:watch

# Cobertura
pnpm test:coverage

# Testes da API
pnpm --filter @openpanel/api test

# Testes do frontend
pnpm --filter @openpanel/web test
```

### Framework de Testes

- **Vitest**: Test runner
- **Testing Library**: React component testing
- **Supertest**: API endpoint testing (planejado)
- **Mock Service Worker**: API mocking (planejado)

---

## 🚀 Deploy & Instalação

### Instalação Automática (Recomendada)

```bash
git clone https://github.com/msoutole/openpanel.git
cd openpanel
./setup.sh
```

O script instala automaticamente:
- ✅ Docker e Docker Compose
- ✅ Node.js 18+ via nvm
- ✅ pnpm
- ✅ Dependências do sistema
- ✅ Cria .env com secrets seguros
- ✅ Inicia serviços Docker
- ✅ Configura banco de dados
- ✅ Cria usuário admin
- ✅ Inicia servidor de desenvolvimento

### Serviços Docker

```yaml
services:
  postgres:    # PostgreSQL 16
  redis:       # Redis 7
  ollama:      # Ollama (IA local)
  traefik:     # Traefik v3 (reverse proxy)
```

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/openpanel"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="random_secret_here"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# IA Providers
GEMINI_API_KEY="your_key"
GROQ_API_KEY="your_key"
OLLAMA_BASE_URL="http://localhost:11434"

# App
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
```

### Comandos de Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Desenvolvimento (API + Web)
pnpm dev

# Apenas API
pnpm dev:api

# Apenas Web
pnpm dev:web

# Build
pnpm build

# Lint
pnpm lint

# Format
pnpm format

# Database
pnpm db:generate   # Gerar Prisma Client
pnpm db:push       # Push schema para DB
pnpm db:migrate    # Criar migration
pnpm db:studio     # Prisma Studio

# Docker
pnpm docker:up     # Iniciar serviços
pnpm docker:down   # Parar serviços
pnpm docker:logs   # Ver logs

# Agentes
pnpm agents              # CLI de agentes
pnpm agents:example      # Exemplo básico
pnpm agents:crewai       # Exemplo CrewAI
pnpm agents:agno         # Exemplo Agno
```

---

## 📖 Documentação Adicional

### Arquivos de Documentação (40+)

```
docs/
├── README.md                 # Índice da documentação
├── KNOWLEDGE.md             # Este arquivo
├── instruction.md           # Especificações técnicas
├── architecture.md          # Arquitetura do sistema
├── roadmap.md              # Roadmap do projeto
├── DESIGN_SYSTEM.md        # Sistema de design
└── exemplo/                # Exemplos e referências
    └── (19 arquivos de exemplo)
```

### Links Úteis

- [README Principal](../README.md)
- [Arquitetura](./architecture.md)
- [Especificações Técnicas](./instruction.md)
- [Roadmap](./roadmap.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Como Contribuir](../contributing.md)

---

## 🎯 Metas e Próximos Passos

### Prioridades Atuais (P0-P1)

1. **Aumentar cobertura de testes**: 20% → 70%+
2. **Completar integração dockerode**: Gerenciamento real de containers
3. **Implementar deploy via Git**: Clone, build e deploy automático
4. **Traefik dinâmico**: Roteamento automático de domínios
5. **SSL Let's Encrypt**: Certificados automáticos

### Metas de Curto Prazo (1-2 meses)

- [ ] Fase 2 completa (Docker & Deploy): 100%
- [ ] Fase 3 completa (Networking & SSL): 100%
- [ ] Cobertura de testes: 50%+
- [ ] Documentação de API completa

### Metas de Médio Prazo (3-4 meses)

- [ ] Fase 4 completa (Databases): 100%
- [ ] Fase 5 completa (Assistente IA): 100%
- [ ] Interface IA completa com chat
- [ ] Marketplace de templates (beta)

### Meta de Lançamento v1.0 (Julho 2025)

- [ ] Todas as 6 fases completas
- [ ] Cobertura de testes: 70%+
- [ ] Documentação completa
- [ ] 100+ templates disponíveis
- [ ] Cluster multi-nó (beta)
- [ ] Interface IA completa

---

## 🤝 Contribuindo

### Como Contribuir

1. **Reportar Bugs**: [GitHub Issues](https://github.com/msoutole/openpanel/issues)
2. **Sugerir Features**: [GitHub Discussions](https://github.com/msoutole/openpanel/discussions)
3. **Contribuir Código**: Fork + Pull Request
4. **Melhorar Docs**: Editar arquivos .md
5. **Traduções**: Adicionar i18n
6. **Testes**: Aumentar cobertura

### Áreas que Precisam de Ajuda

- 🧪 **Testes**: Aumentar cobertura de 20% para 70%+
- 📚 **Documentação**: Melhorar e expandir docs
- 🐛 **Bugs**: Resolver issues abertas
- ✨ **Features**: Implementar itens do roadmap
- 🎨 **Design**: Melhorar UI/UX
- 🌍 **i18n**: Traduzir para outros idiomas

---

## 📝 Changelog

### v0.1.0 (Janeiro 2025) - Pré-Alpha

**Fase 1: Fundação** (85% completa)
- ✅ Setup do monorepo (Turbo + pnpm)
- ✅ Backend API com Hono/Bun
- ✅ Autenticação JWT + RBAC
- ✅ Frontend com React 18 + Vite
- ✅ 25+ modelos de dados (Prisma)
- ✅ 14+ páginas frontend
- ✅ Sistema de agentes (CrewAI + Agno)
- ✅ Documentação técnica (40+ arquivos)

**Fase 2: Docker & Deploy** (40% completa)
- ✅ Estrutura de containers
- ✅ 4 build systems
- ✅ WebSocket para logs
- ✅ Variáveis de ambiente (UI)
- 🚧 Integração dockerode (em andamento)

**Fase 3: Networking & SSL** (20% completa)
- ✅ Estrutura Traefik
- ✅ 3 DNS providers
- 🚧 Roteamento dinâmico
- 🚧 SSL automático

**Fase 5: Assistente IA** (30% completa)
- ✅ Multi-provider (Gemini, Groq, Ollama)
- ✅ Framework de agentes
- ✅ Mensagens entre agentes
- 🚧 Interface de chat

---

## 📞 Contato

- **Autor**: Matheus Souto Leal ([@msoutole](https://github.com/msoutole))
- **Email**: msoutole@hotmail.com
- **GitHub**: [msoutole/openpanel](https://github.com/msoutole/openpanel)
- **Issues**: [GitHub Issues](https://github.com/msoutole/openpanel/issues)
- **Discussões**: [GitHub Discussions](https://github.com/msoutole/openpanel/discussions)

---

## 📄 Licença

OpenPanel é licenciado sob **MIT License** - 100% open source.

```
MIT License - Copyright (c) 2025 Matheus Souto Leal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

[Ver licença completa](../LICENSE)

---

**Feito com 🚀 pela comunidade OpenPanel**

*Última atualização: 2025-11-23*
