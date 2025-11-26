# OpenPanel

Modern self-hosted server control panel with AI-powered assistance.

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

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 10.0.0
- Docker (for infrastructure services)

### Installation

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
   # Edit .env with your configuration (DATABASE_URL, JWT_SECRET, etc.)
   ```

4. **Start infrastructure (PostgreSQL, Redis, Ollama, Traefik)**
   ```bash
   docker-compose up -d
   ```

5. **Setup database**
   ```bash
   npm run db:push
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:8000` and the Web UI at `http://localhost:3000`.

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
