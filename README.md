# OpenPanel

Modern self-hosted server control panel with AI-powered assistance.

## 🚀 Quick Start

### ⚡ Automated Installation (Recommended)

OpenPanel provides **100% automated installation** for all platforms:

#### Linux / macOS
```bash
chmod +x install.sh
./install.sh
```

#### Windows (PowerShell as Administrator)
```powershell
.\install.ps1
```

#### Cross-Platform (Python 3.7+)
```bash
python install.py
```

**Features:**
- ✅ Auto-installs all dependencies (Node.js, Docker, etc.)
- ✅ Configures environment automatically
- ✅ Sets up database and services
- ✅ Verifies installation

**Options:**
```bash
# Update existing installation
./install.sh --update        # Linux/macOS
.\install.ps1 -Update        # Windows
python install.py --update   # Cross-platform

# Development mode
./install.sh --dev           # Skip production configs
```

📖 **Full installation guide:** See [INSTALL.md](INSTALL.md) for detailed instructions.

## Overview

OpenPanel is a privacy-first, AI-powered server control panel for managing Docker containers, deployments, and infrastructure. Built as a modern monorepo with TypeScript, it offers an intuitive interface for DevOps and server management.

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

## 📖 Manual Installation

If you prefer manual installation or want more control:

### Prerequisites
- Node.js >= 18.0.0
- npm >= 10.0.0
- Docker >= 20.10.0

### Quick Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Setup environment
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start Docker services
docker compose up -d

# 5. Setup database
npm run db:generate && npm run db:push

# 6. Start application
npm run dev
```

**Access:**
- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`

📖 **For detailed manual installation:** See [INSTALL.md](INSTALL.md#-manual-installation)

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

# Build
npm run build            # Build all packages
npm run build:api        # Build backend only
npm run build:web        # Build frontend only

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

- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide
- [Architecture](./docs/architecture/) - System architecture documentation
- [Features](./docs/features/) - Feature documentation

## Contributing

This is currently a personal project by Matheus Souto Leal. Contributions, issues, and feature requests are welcome!

## License

MIT License - see LICENSE file for details

## Author

**Matheus Souto Leal**
- Email: msoutole@hotmail.com
- GitHub: [@msoutole](https://github.com/msoutole)

## Acknowledgments

Built with modern open-source technologies and inspired by the need for a privacy-first, AI-enhanced server control panel.
