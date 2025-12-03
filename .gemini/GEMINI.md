# OpenPanel - Contexto e Instruções para Agentes IA

Este arquivo contém informações essenciais sobre o projeto OpenPanel para orientar interações de desenvolvimento.

## 📋 Visão Geral do Projeto

**OpenPanel** é um painel de controle de servidor self-hosted, focado em privacidade e assistido por IA. Ele gerencia containers Docker, deploys e infraestrutura.

- **Arquitetura:** Monorepo (npm workspaces).
- **Idioma Principal (Docs/Commits):** Português Brasileiro (pt-BR).
- **Nomes de Código (Variáveis/Funções):** Inglês (`kebab-case` para arquivos, `camelCase` para variáveis/funções).

### Estrutura do Monorepo

`
Open-Panel/
├── apps/
│   ├── api/              # Backend (Hono, Node.js, Prisma)
│   └── web/              # Frontend (React, Vite)
├── packages/
│   └── shared/           # Tipos e utilitários compartilhados
├── scripts/              # Scripts de automação e setup
├── docs/                 # Documentação completa
└── docker-compose.yml    # Infraestrutura local
`

## 🛠️ Stack Tecnológico

### Backend (`apps/api`)

- **Runtime:** Node.js 18+ (ESM)
- **Framework:** Hono
- **Banco de Dados:** PostgreSQL + Prisma ORM
- **Fila/Cache:** Redis + BullMQ
- **Orquestração:** Dockerode (Docker API)
- **Testes:** Vitest

### Frontend (`apps/web`)

- **Framework:** React 19
- **Build:** Vite
- **Estilização:** TailwindCSS (convenção), Lucide React (ícones)
- **Terminal:** Xterm.js
- **Gráficos:** Recharts

## 🚀 Comandos Principais

| Ação | Comando | Descrição |
|------|---------|-----------|
| **Iniciar Tudo** | `npm start` | Setup completo + inicia serviços e dev server |
| **Dev (Geral)** | `npm run dev` | Inicia API e Web simultaneamente |
| **Dev (API)** | `npm run dev:api` | Inicia apenas o backend |
| **Dev (Web)** | `npm run dev:web` | Inicia apenas o frontend |
| **Build** | `npm run build` | Compila todos os pacotes |
| **Prisma Studio** | `npm run db:studio` | Interface visual para o banco de dados |
| **Segurança** | `npm run check-secrets` | Verifica credenciais expostas |

## 📝 Convenções de Desenvolvimento

### Padrões de Código

1. **Backend:**
    - Validação estrita com **Zod**.
    - Use `HTTPException` do Hono para erros.
    - Lógica de negócios em `src/services/`, não em controllers.
    - `env.ts` para variáveis de ambiente tipadas.

2. **Frontend:**
    - Componentes funcionais com Hooks.
    - Uso de **React Query** para dados assíncronos.
    - Tratamento de erros via Toasts visualmente amigáveis.

### Padrões de Commit

Utilize **Semantic Commits**:

- `feat: ...` para novas funcionalidades.
- `fix: ...` para correções de bugs.
- `docs: ...` para alterações na documentação.
- `refactor: ...` para melhorias de código sem alteração de comportamento.

### Segurança

- **NUNCA** commitar arquivos `.env`.
- Execute `npm run check-secrets` regularmente.
- Se credenciais vazarem, use `npm run rotate-credentials` imediatamente.

## 🤖 Diretrizes para Agentes

1. **Contexto:** Sempre verifique `README.md` e `docs/GUIA_DE_DESENVOLVIMENTO.md` antes de grandes mudanças.
2. **Verificação:** Após alterações no backend, sugira rodar testes ou verificar endpoints. No frontend, garanta que não houve quebra de layout.
3. **Estilo:** Mantenha a consistência com o código existente (ex: se o projeto usa `const` e `arrow functions`, não mude para `function` declarations sem motivo).
4. **Respeito ao Usuário:** Siga estritamente as instruções de segurança e privacidade.

---
*Gerado automaticamente pelo Gemini CLI em 03/12/2025.*
