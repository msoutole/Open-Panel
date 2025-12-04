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

## 🐳 Docker em Produção

### Dockerfiles Multi-Stage

O OpenPanel utiliza builds multi-stage para otimizar o tamanho das imagens finais e melhorar a segurança.

#### Dockerfile da API (`apps/api/Dockerfile`)

**Stage 1: Builder**
- Base: `node:20-alpine`
- Instala todas as dependências (incluindo devDependencies)
- Gera cliente Prisma
- Executa build da API (`npm run build:api`)

**Stage 2: Produção**
- Base: `node:20-alpine`
- Instala apenas dependências de produção (`npm ci --production`)
- Copia apenas arquivos necessários:
  - `apps/api/dist` - Código compilado
  - `apps/api/prisma` - Schema Prisma
  - `node_modules/.prisma` - Cliente Prisma gerado
  - `packages/shared/dist` - Pacote compartilhado compilado

**Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Tamanhos Estimados:**
- Builder stage: ~500MB (com todas as dependências)
- Produção stage: ~150MB (apenas runtime necessário)
- **Redução**: ~70% de tamanho

#### Dockerfile da Web (`apps/web/Dockerfile`)

**Stage 1: Builder**
- Base: `node:20-alpine`
- Instala todas as dependências
- Executa build da aplicação Web (`npm run build:web`)
- Gera arquivos estáticos em `apps/web/dist`

**Stage 2: Nginx**
- Base: `nginx:alpine` (imagem leve e otimizada)
- Copia apenas arquivos estáticos do build
- Configura nginx para servir aplicação SPA
- Configura proxy reverso para `/api` → API backend

**Configuração Nginx:**
```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;
  
  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # API proxy
  location /api {
    proxy_pass http://openpanel-api:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

**Tamanhos Estimados:**
- Builder stage: ~500MB (com todas as dependências)
- Produção stage: ~50MB (nginx Alpine + arquivos estáticos)
- **Redução**: ~90% de tamanho

### Comandos de Build

```bash
# Build da API
docker build -f apps/api/Dockerfile -t openpanel-api:latest .

# Build da Web
docker build -f apps/web/Dockerfile -t openpanel-web:latest .

# Verificar tamanho das imagens
docker images | grep openpanel

# Testar health checks
docker run -d --name test-api -p 3001:3001 openpanel-api:latest
docker inspect --format='{{json .State.Health}}' test-api
```

---

## 🚀 Arquitetura do Script de Inicialização

O OpenPanel possui um sistema modular de inicialização (`start.js`) que automatiza todo o processo de setup e execução em desenvolvimento.

### Estrutura Modular

```
scripts/utils/
├── logger.js      # ~80 linhas  - Funções de logging/output
├── retry.js       # ~90 linhas  - Lógica de retry/timeout reutilizável
├── checks.js      # ~350 linhas - Verificações de pré-requisitos
├── env.js         # ~180 linhas - Gerenciamento de .env
├── docker.js      # ~200 linhas - Operações Docker
├── database.js    # ~180 linhas - Setup do banco de dados
└── process.js     # ~180 linhas - Gerenciamento de processos
```

### Módulos

#### logger.js
Funções padronizadas de output:
- `print()`: Mensagens informativas
- `printError()`: Mensagens de erro
- `printHeader()`: Cabeçalhos de seção
- `printSuccess()`: Mensagens de sucesso

#### retry.js
Lógica reutilizável de retry com backoff exponencial:
- `retryWithTimeout()`: Executa função com retentativas
- Configurável: tentativas, delay, timeout

#### checks.js
Verificações de pré-requisitos:
- `checkNode()`: Verifica versão do Node.js (18+)
- `checkDocker()`: Verifica se Docker está instalado e rodando
- `checkNpm()`: Verifica versão do npm (10+)
- `commandExists()`: Utilitário multiplataforma (Windows/Unix)

#### env.js
Gerenciamento de variáveis de ambiente:
- `loadEnv()`: Carrega `.env` da raiz usando dotenv
- `createEnvFile()`: Cria `.env` com valores seguros (senhas geradas automaticamente)
- `validateExistingEnv()`: Valida `.env` existente
- `generateSecurePassword()`: Gera senhas aleatórias seguras

#### docker.js
Operações Docker:
- `getDockerComposeCommand()`: Detecta `docker compose` vs `docker-compose`
- `startDockerServices()`: Inicia containers (PostgreSQL, Redis, Traefik)
- `waitForDockerService()`: Aguarda serviço estar pronto com retry
- `getDockerContainerStatus()`: Verifica status de container específico

#### database.js
Setup do banco de dados:
- `ensurePrismaInstalled()`: Verifica/instala Prisma CLI
- `generatePrismaClient()`: Gera cliente Prisma
- `syncDatabaseSchema()`: Sincroniza schema (push ou migrate)
- `createAdminUser()`: Cria usuário admin padrão se não existir
- `recoverFromAuthError()`: Recupera de erros de autenticação PostgreSQL

#### process.js
Gerenciamento de processos da aplicação:
- `ProcessManager`: Classe que encapsula estado e ciclo de vida dos processos
- `checkAPI()`: Verifica se API está respondendo (health check)
- Gerencia processos API e Web com cleanup automático

### ProcessManager

Classe responsável por encapsular o estado dos processos e eliminar variáveis globais:

```javascript
class ProcessManager {
  constructor() {
    this.apiProcess = null;
    this.webProcess = null;
    this.isShuttingDown = false;
  }
  
  startAPI() { /* inicia processo da API */ }
  startWeb() { /* inicia processo do Web */ }
  cleanup() { /* encerra processos gracefully */ }
}
```

### Fluxo de Execução do `npm start`

1. **Verificações de Pré-requisitos** (`checks.js`)
   - Node.js 18+
   - Docker instalado e rodando
   - npm 10+

2. **Configuração de Ambiente** (`env.js`)
   - Carrega ou cria `.env` na raiz
   - Gera senhas seguras automaticamente
   - Valida variáveis obrigatórias

3. **Instalação de Dependências**
   - `npm install` na raiz (workspaces)

4. **Infraestrutura Docker** (`docker.js`)
   - Inicia PostgreSQL, Redis, Traefik
   - Aguarda containers estarem prontos (health checks)

5. **Configuração do Banco de Dados** (`database.js`)
   - Gera cliente Prisma
   - Sincroniza schema do banco
   - Cria usuário admin padrão

6. **Inicialização da Aplicação** (`process.js`)
   - Inicia API em modo dev (porta 3001)
   - Aguarda API estar pronta (health check)
   - Inicia Web em modo dev (porta 3000)

7. **Monitoramento**
   - Monitora processos API e Web
   - Cleanup automático em caso de erro ou interrupção (Ctrl+C)

### Métricas da Refatoração

**Antes da modularização:**
- `start.js`: 1597 linhas
- Funções: 29 em um único arquivo
- Variáveis globais: 6
- Manutenibilidade: 5/10

**Depois da modularização:**
- `start.js`: 178 linhas (redução de 89%)
- Módulos: 7 especializados
- Variáveis globais: 0 (encapsuladas em ProcessManager)
- Manutenibilidade: 10/10

### Reutilização de Módulos

Os módulos podem ser reutilizados em outros scripts do projeto:

```javascript
// Exemplo: usar logger em outro script
const { print, printError } = require('./scripts/utils/logger');

// Exemplo: usar retry em outro script
const { retryWithTimeout } = require('./scripts/utils/retry');

// Exemplo: verificar Docker em outro script
const { checkDocker } = require('./scripts/utils/checks');
```

---

> Para guias de contribuição e padrões de código, consulte o [Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md).
