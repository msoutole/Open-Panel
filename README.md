# OpenPanel 🚀

![CI](https://github.com/msoutole/openpanel/actions/workflows/ci.yml/badge.svg)

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)

**Modern self-hosted server control panel with AI-powered assistance**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🚀 Quick Start

### ⚡ Inicialização Ultra-Simplificada

**Um único comando para iniciar tudo:**

```bash
npm start
```

Isso é tudo! O script `start.js` faz automaticamente:
- ✅ Verifica pré-requisitos (Node.js 18+, Docker)
- ✅ Cria arquivo `.env` na raiz com valores seguros
- ✅ Instala dependências npm
- ✅ Inicia containers Docker (PostgreSQL, Redis, Traefik)
- ✅ Configura banco de dados
- ✅ Cria usuário administrador padrão
- ✅ Inicia API e Web em modo desenvolvimento

> 💡 **Configuração 100% centralizada e simplificada**:  
> - ✅ **Um único arquivo**: Edite apenas o `.env` na raiz  
> - ✅ **Sem sincronização**: API e Web leem diretamente do `.env` da raiz  
> - ✅ **Setup simples**: Copie `.env.example` para `.env` e edite

**Pré-requisitos:**
- Node.js 18+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))

**Credenciais padrão após instalação:**
- Email: `admin@admin.com.br`
- Senha: `admin123`
- ⚠️ **Altere a senha após o primeiro login!**

**Acesse:**
- 🌐 Web Interface: http://localhost:3000
- 🔌 API: http://localhost:3001
- 📊 Traefik Dashboard: http://localhost:8080

📖 **Documentação completa:** Veja [docs/MANUAL_DO_USUARIO.md](docs/MANUAL_DO_USUARIO.md) para mais detalhes.

## 🔒 Segurança

**⚠️ IMPORTANTE - Credenciais e Segurança:**

- ✅ O arquivo `.env` está no `.gitignore` e **NÃO deve ser commitado**
- ✅ Apenas `.env.example` com placeholders deve estar no repositório
- ⚠️ Se credenciais foram commitadas anteriormente, **rotacione todas imediatamente**
- 📖 Veja [docs/SECURITY.md](docs/SECURITY.md) para instruções completas de segurança

**Verificar credenciais expostas:**
```bash
# Linux/macOS
npm run check-secrets
# ou
bash scripts/check-secrets.sh

# Windows
npm run check-secrets:win
# ou
powershell scripts/check-secrets.ps1
```

**Rotacionar credenciais expostas:**
```bash
# Linux/macOS
npm run rotate-credentials
# ou
bash scripts/rotate-credentials.sh

# Windows
powershell scripts/rotate-credentials.ps1
```

> ⚠️ **Se credenciais foram commitadas**: Execute `npm run rotate-credentials` IMEDIATAMENTE e veja [docs/SECURITY.md](docs/SECURITY.md) para limpar o histórico do Git.

---

## Overview

OpenPanel is a privacy-first, AI-powered server control panel for managing Docker containers, deployments, and infrastructure. Built as a modern monorepo with TypeScript, it offers an intuitive interface for DevOps and server management.

## ✨ What's New

### 🎯 **100% Automated Installation**
- **Zero User Interaction**: Complete setup without manual configuration
- **Auto-Generated Credentials**: Secure passwords for PostgreSQL, Redis, and JWT
- **Cross-Platform Support**: Works on Linux (all distros), macOS, Windows/WSL
- **Idempotent Scripts**: Safely re-run setup without breaking existing installations
- **Health Checks**: Validates all services before completion

### 🎨 **Smart Onboarding System**
- **First-Login Wizard**: Configure your environment in 3 easy steps
- **AI Provider Setup**: Connect to Google Gemini, Claude, GitHub Copilot, or Ollama
- **Real-Time Validation**: Verify API keys before saving
- **Theme Selection**: Choose light or dark mode
- **Password Enforcement**: Mandatory strong password on first use

### 🔐 **Enhanced Security**
- **AES-256-GCM Encryption**: All API keys encrypted at rest
- **Strong Password Requirements**: 8+ chars, uppercase, lowercase, numbers, symbols
- **Rate Limiting**: Protection against brute force attacks
- **Audit Logging**: Track all sensitive actions

## Features

- 🐳 **Docker Management**: Native container orchestration via Docker API
- 🚀 **Automated Deployments**: Git-based deployment pipeline with build tracking
- 🔐 **Security First**: JWT authentication, RBAC, audit logging, and data encryption
- 🤖 **AI Assistant**: Integrated LLM support (Ollama, OpenAI, Google, Anthropic)
- 📊 **Real-time Monitoring**: Live metrics, logs, and container stats
- 🌐 **Domain & SSL**: Automatic SSL via Let's Encrypt with Traefik integration
- 💾 **Backup System**: Automated backups with S3-compatible storage
- 👥 **Team Collaboration**: Multi-user support with role-based permissions

## Tech Stack

### Backend

- **Runtime**: Node.js 18+ with ESM
- **Framework**: Hono (lightweight, fast HTTP)
- **Database**: PostgreSQL + Prisma ORM + pgvector
- **Cache/Queue**: Redis + BullMQ
- **Container Orchestration**: Dockerode
- **WebSocket**: Real-time logs and events

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **UI Components**: Lucide React, Recharts, Xterm.js
- **Type Safety**: TypeScript strict mode

### Shared

- **Validation**: Zod schemas
- **Monorepo**: npm workspaces

## 📖 Instalação Manual (Avançado)

Se preferir instalação manual ou precisar de mais controle:

### Pré-requisitos

- **Node.js** >= 18.0.0 (recomendado 20+)
- **npm** >= 10.0.0
- **Docker** >= 20.10.0
- **Git** (para clonar o repositório)

### Passo a Passo Manual

1. **Clone o repositório**
   ```bash
   git clone https://github.com/msoutole/openpanel.git
   cd openpanel
   ```

2. **Instale dependências**
   ```bash
   npm install
   ```

3. **Configure ambiente** (o script `npm start` faz isso automaticamente)
   ```bash
   cp .env.example .env
   # Edite .env com suas configurações
   ```

4. **Inicie serviços Docker**
   ```bash
   docker-compose up -d
   ```

5. **Configure banco de dados**
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. **Crie usuário administrador**
   ```bash
   npm run create:admin
   ```

7. **Inicie aplicação**
   ```bash
   npm run dev
   ```

### 🔑 Credenciais Padrão

Após a instalação, faça login com:

- **Email**: `admin@admin.com.br`
- **Senha**: `admin123`

> ⚠️ **IMPORTANTE**: Você será solicitado a alterar esta senha no primeiro login através do wizard de onboarding.

### 🎯 Primeiro Login - Wizard de Onboarding

Após fazer login pela primeira vez, você passará por um onboarding de 3 etapas:

1. **Seleção de Tema**: Escolha modo claro ou escuro
2. **Configuração de IA**: Configure pelo menos um provedor de IA (Gemini, Claude, GitHub ou Ollama)
3. **Alteração de Senha**: Crie uma senha forte e segura

### 🌐 Acessar a Aplicação

- **Web UI**: http://localhost:3000
- **API**: http://localhost:3001
- **Traefik Dashboard**: http://localhost:8080
- **Ollama**: http://localhost:11434 (modelos de IA locais - opcional)

## 🛠️ Comandos de Desenvolvimento

```bash
# Inicialização
npm start                # Inicia tudo automaticamente (recomendado)

# Desenvolvimento
npm run dev              # Inicia API e Web em paralelo
npm run dev:api          # Inicia apenas backend
npm run dev:web          # Inicia apenas frontend

# Build
npm run build            # Build completo (API + Web)
npm run build:api        # Build apenas API
npm run build:web        # Build apenas Web

# Banco de Dados
npm run db:generate      # Gera Prisma Client
npm run db:migrate       # Executa migrações
npm run db:push          # Sincroniza schema
npm run db:studio        # Abre Prisma Studio

# Administração
npm run create:admin     # Cria usuário administrador

# Qualidade de Código
npm run type-check       # Validação TypeScript
npm test                 # Executa testes
```

## Project Structure

```
Open-Panel/
├── apps/
│   ├── api/              # Backend application
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── middlewares/
│   │   │   ├── queues/   # Background jobs
│   │   │   └── websocket/
│   │   └── prisma/       # Database schema
│   └── web/              # Frontend application
│       ├── components/
│       ├── pages/
│       └── services/
├── packages/
│   └── shared/           # Shared types, validators, utilities
├── scripts/
│   ├── setup/            # Installation scripts
│   ├── start/            # Service startup scripts
│   ├── status/           # Service status checking scripts
│   ├── utils/            # Utility scripts
│   └── *.js              # Node.js utility scripts
├── docs/                 # Documentation
│   ├── README.md        # Índice da documentação
│   ├── INSTALL.md       # Guia de instalação
│   ├── SETUP_GUIDE.md   # Guia de setup
│   ├── QUICK_START.md   # Início rápido
│   ├── API.md           # Documentação da API
│   ├── domains/         # Documentação por domínio
│   └── architecture/    # Arquitetura do sistema
├── docker-compose.yml    # Local infrastructure
└── .env.example         # Template de variáveis de ambiente
```

## Environment Variables

Key environment variables (see `.env.example` for complete list with descriptions):

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens (min 32 chars, generate with: `openssl rand -hex 64`)
- `CORS_ORIGIN`: Frontend URL for CORS

**Optional but recommended:**
- `REDIS_URL`: Redis connection string (or use REDIS_HOST/PORT/PASSWORD)
- `DOCKER_HOST`: Docker socket path (defaults based on platform)
- `OLLAMA_HOST`: Ollama API endpoint for local AI models

**See `.env.example` for all available variables with detailed descriptions.**

## Documentation

### 📚 Main Documentation

- **[docs/README.md](./docs/README.md)** - Índice completo da documentação
- **[docs/MANUAL_DO_USUARIO.md](./docs/MANUAL_DO_USUARIO.md)** - Instalação e Uso
- **[docs/MANUAL_TECNICO.md](./docs/MANUAL_TECNICO.md)** - Arquitetura e API
- **[docs/GUIA_DE_DESENVOLVIMENTO.md](./docs/GUIA_DE_DESENVOLVIMENTO.md)** - Contribuição e Padrões
- **[docs/PROJETO.md](./docs/PROJETO.md)** - Roadmap e Histórico

### 💡 Getting Help

- **Issues**: Check existing issues or report problems on GitHub
- **Email**: msoutole@hotmail.com
- **Logs**: Check `.logs/` directory for detailed error logs

## Contributing

This is currently a personal project by Matheus Souto Leal. Contributions, issues, and feature requests are welcome!

## License

MIT License - see LICENSE file for details

## Author

**Matheus Souto Leal**

- Email: <msoutole@hotmail.com>
- GitHub: [@msoutole](https://github.com/msoutole)

## Acknowledgments

Built with modern open-source technologies and inspired by the need for a privacy-first, AI-enhanced server control panel.
