# 👨‍💻 OpenPanel - Manual de Desenvolvimento

Este manual unifica todas as diretrizes para desenvolvimento, incluindo configuração de ambiente remoto, workflow de deploy, padrões de código e boas práticas.

---

## 📑 Índice

1. [Visão Geral e Agentes IA](#1-visão-geral-e-agentes-ia)
2. [Ambiente de Desenvolvimento](#2-ambiente-de-desenvolvimento)
   - [Setup Local](#setup-local)
   - [Desenvolvimento Remoto (SSH)](#desenvolvimento-remoto-ssh)
3. [Workflow Multi-Ambiente](#3-workflow-multi-ambiente)
   - [DEV (Hot Reload)](#dev-desenvolvimento)
   - [PRE (Staging)](#pre-staging)
   - [PROD (Produção)](#prod-produção)
4. [Padrões de Código e UI](#4-padrões-de-código-e-ui)
   - [Backend (Hono)](#backend)
   - [Frontend (React)](#frontend)
   - [Feedback Assíncrono](#feedback-assíncrono)
5. [Testes e Qualidade](#5-testes-e-qualidade)

---

## 1. Visão Geral e Agentes IA

O OpenPanel adota uma abordagem "AI-First".

**Papéis de Agentes:**
- **Orquestrador**: Gerente de tarefas e contexto global.
- **Backend Specialist**: Hono, Prisma, Docker.
- **Frontend Specialist**: React, Tailwind, UX.
- **QA/Security**: Testes e auditoria.

**Convenções:**
- Idioma: **Português (BR)**.
- Commits: Semantic Commits (`feat:`, `fix:`, `chore:`).
- Casings: `kebab-case` (arquivos), `PascalCase` (componentes/classes).

---

## 2. Ambiente de Desenvolvimento

### Setup Local
```bash
# Iniciar tudo (Infra + Apps com Hot Reload)
npm start

# Comandos específicos
npm run dev:api   # Só API
npm run dev:web   # Só Frontend
npm run db:studio # Prisma Studio
```

### Desenvolvimento Remoto (SSH)
Desenvolva diretamente no servidor usando VS Code Remote SSH.

1.  **Conectar**: Use a extensão "Remote - SSH" do VS Code para conectar ao servidor.
2.  **Extensions**: Instale ESLint, Prettier e Docker no contexto remoto.
3.  **Hot Reload**: Ao editar arquivos em `/opt/openpanel`, o `tsx watch` (API) e Vite (Web) atualizam automaticamente.
4.  **Debug**:
    - API expõe porta `9229` para inspector.
    - Configure `.vscode/launch.json` para "Attach to Remote".

---

## 3. Workflow Multi-Ambiente

O ciclo de vida segue: **DEV → PRE → PROD**.

### DEV (Desenvolvimento)
- **Foco**: Rapidez, logs verbosos, hot reload.
- **URL**: `http://dev.openpanel.local`
- **Comando**: `./scripts/server/start-dev.sh`

### PRE (Staging)
- **Foco**: Validação de build e integração.
- **Característica**: Build otimizado, dados persistentes de teste.
- **Deploy**: `./scripts/server/deploy-pre.sh` (Copia de DEV → Build → Restart).

### PROD (Produção)
- **Foco**: Estabilidade, Performance, Segurança (SSL).
- **Deploy**: `./scripts/server/deploy-prod.sh` (Backup → Build → Deploy com Rollback automático).
- **Logs**: `./scripts/server/logs-prod.sh` (Apenas Warn/Error).

---

## 4. Padrões de Código e UI

### Backend
- Use **Hono** para rotas leve e tipadas.
- **Validação Zod** obrigatória em entradas.
- **Tratamento de Erros**: Use `HTTPException`.
- **Env**: Sempre use `import { env } from '@/lib/env'` para type-safety.

### Frontend
- **Componentes Funcionais** com TypeScript.
- **Hooks**: Prefira hooks customizados para lógica complexa.

### Feedback Assíncrono
Para operações longas (deploys, backups), use os componentes padronizados:

1.  **`ProgressBar`**: Para operações > 2s com estimativa.
2.  **`WebSocketIndicator`**: Para status de conexão em tempo real.
3.  **`RetryButton`**: Para falhas transitórias.

**Exemplo de UX:**
- Curta duração: Spinner no botão.
- Média duração: Toast notification.
- Longa duração: Modal com ProgressBar e status via WebSocket.

---

## 5. Testes e Qualidade

Antes de submeter PRs:

```bash
# 1. Type Check (Monorepo)
npm run type-check

# 2. Lint
npm run lint

# 3. Testes Unitários
npm run test -w apps/api
```

**Checklist Rápido:**
- [ ] Rotas retornam status HTTP corretos?
- [ ] Zod valida inputs inválidos?
- [ ] Responsividade mobile testada?
- [ ] Feedback visual de erro implementado?
