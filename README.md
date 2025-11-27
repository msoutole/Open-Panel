# OpenPanel 🚀

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)

**Modern self-hosted server control panel with AI-powered assistance**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

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

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0 (recommended 20+)
- **npm** >= 10.0.0
- **Docker** >= 20.10.0 (for infrastructure services)
- **Git** (for cloning the repository)

### ⚡ Automated Installation (Recommended)

The easiest way to get started is using our automated setup script that handles everything for you:

#### Linux / macOS

```bash
git clone https://github.com/msoutole/openpanel.git
cd openpanel
chmod +x scripts/setup/setup.sh
./scripts/setup/setup.sh
```

#### Windows (PowerShell)

```powershell
git clone https://github.com/msoutole/openpanel.git
cd openpanel
./scripts/setup/setup.ps1
```

#### What the script does:
✅ Installs all dependencies (Node.js, Docker, etc.)
✅ Generates secure random passwords
✅ Creates `.env` file with proper configuration
✅ Starts Docker services (PostgreSQL, Redis, Ollama, Traefik)
✅ Runs database migrations
✅ Creates admin user automatically
✅ Validates all services are healthy

### 🔑 Default Admin Credentials

After installation, login with:

- **Email**: `admin@admin.com.br`
- **Password**: `admin123`

> ⚠️ **IMPORTANT**: You will be prompted to change this password on first login through the onboarding wizard.

### 🎯 First Login - Onboarding Wizard

After logging in for the first time, you'll go through a 3-step onboarding:

1. **Theme Selection**: Choose light or dark mode
2. **AI Provider Setup**: Configure at least one AI provider (Gemini, Claude, GitHub, or Ollama)
3. **Password Change**: Create a strong, secure password

### 🔍 Check Installation Status

After installation, verify all services are running:

```bash
npm run status
# or
./scripts/status/check-status.sh  # Linux/macOS
./scripts/status/check-status.ps1 # Windows
```

### 🌐 Access the Application

- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000
- **Traefik Dashboard**: http://localhost:8080 (Docker proxy)
- **Ollama**: http://localhost:11434 (Local AI models)

---

### 🛠️ Manual Installation (Advanced)

If you prefer manual setup or need more control:

1. **Clone the repository**

   ```bash
   git clone https://github.com/msoutole/openpanel.git
   cd openpanel
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # REQUIRED: Set strong JWT_SECRET (min 32 chars)
   # REQUIRED: Configure DATABASE_URL
   # REQUIRED: Configure REDIS_URL
   ```

4. **Start infrastructure**

   ```bash
   docker-compose up -d
   ```

5. **Setup database**

   ```bash
   npm run db:push
   ```

6. **Create admin user**

   ```bash
   npm run create:admin
   ```

7. **Start development servers**

   ```bash
   npm run dev
   ```

## Development Commands

```bash
# Development
npm run dev              # Start both API and Web
npm run dev:api          # Start only backend
npm run dev:web          # Start only frontend

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio

# Setup and Status
npm run setup            # Run complete setup (install deps, start services, configure DB)
npm run start            # Start all services with admin user creation
npm run start:all        # Setup and start all services
npm run status           # Check status of all services

# Additional Scripts
./scripts/setup/setup.sh        # Run setup script (Linux/macOS)
./scripts/setup/setup.ps1       # Run setup script (Windows)
./scripts/start/start-all.sh    # Start all services (Linux/macOS)
./scripts/start/start-all.ps1   # Start all services (Windows)
./scripts/status/check-status.sh    # Check status (Linux/macOS)
./scripts/status/check-status.ps1   # Check status (Windows)

# Utility Scripts
./scripts/utils/show-structure.ps1  # Show organized script structure
./scripts/utils/validate-scripts.ps1 # Validate all scripts

# Type checking
npm run type-check       # TypeScript validation across all packages

# Testing
npm test                 # Run all tests
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
├── docker-compose.yml    # Local infrastructure
└── CLAUDE.md            # Development guidelines
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens (min 32 chars)
- `CORS_ORIGIN`: Frontend URL for CORS
- `DOCKER_HOST`: Docker socket path
- `AI_PROVIDER`: AI provider (ollama, openai, anthropic, google)

## Documentation

### 📚 Main Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide for contributors
- **[DEPLOYMENT_PLAN.md](./docs/DEPLOYMENT_PLAN.md)** - Complete deployment and automation strategy
- **[NEXT_STEPS.md](./docs/NEXT_STEPS.md)** - Roadmap and improvement suggestions
- **[API.md](./docs/API.md)** - API endpoints documentation and examples
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

### 🔧 Technical Documentation

- [Architecture](./docs/architecture/) - System architecture documentation (if available)
- [Features](./docs/features/) - Feature documentation (if available)

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
