# 🛠️ OpenPanel - Manual Técnico

Este documento detalha a arquitetura, design e especificações técnicas do OpenPanel.

---

## 🏗️ Arquitetura do Sistema

### Visão Geral
O OpenPanel utiliza uma arquitetura moderna baseada em serviços, facilitando a escalabilidade e manutenção.

**Stack Tecnológico:**
- **Backend**: Node.js, Hono (API), Prisma (ORM)
- **Frontend**: React, Next.js (ou Vite), TailwindCSS
- **Banco de Dados**: PostgreSQL
- **Cache/Filas**: Redis
- **Proxy/Load Balancer**: Traefik
- **Containerização**: Docker & Docker Compose

### Estrutura Monorepo
O projeto segue uma estrutura monorepo para facilitar o compartilhamento de código:

```
Open-Panel/
├── apps/
│   ├── api/              # Backend (REST + WebSocket)
│   └── web/              # Frontend (SPA)
├── packages/
│   └── shared/          # Tipos e utilitários compartilhados
└── docker-compose.yml   # Orquestração de serviços
```

### Proposta de Microserviços
Estamos em transição para uma arquitetura de microserviços para melhorar a modularidade, especialmente para manutenção por Agentes de IA (LLMs).

**Domínios Identificados:**
1. **Authentication**: Gestão de usuários, times e RBAC.
2. **Projects**: Gestão de containers e deployments.
3. **Infrastructure**: Networking, SSL, Traefik.
4. **Monitoring**: Métricas, logs e saúde do sistema.

---

## 🔌 API Reference

A API é construída com **Hono**, oferecendo alta performance e suporte a Edge Computing.

### Endpoints Principais

| Método | Endpoint      | Descrição                |
| ------ | ------------- | ------------------------ |
| `POST` | `/auth/login` | Autenticação de usuários |
| `GET`  | `/projects`   | Listar projetos          |
| `POST` | `/projects`   | Criar novo projeto       |
| `GET`  | `/metrics`    | Métricas do sistema      |

### WebSockets
Utilizamos WebSockets para comunicação em tempo real (logs, terminal, status).

**Protocolo do Terminal:**
- Endpoint: `ws://host/ws/terminal`
- Autenticação: Token JWT na primeira mensagem.
- Comandos: `auth`, `open_terminal`, `input`, `resize`.

---

## 💾 Banco de Dados

Utilizamos **Prisma ORM** com PostgreSQL.

### Clients Otimizados
Para evitar conexões excessivas em ambientes Serverless/Edge, utilizamos um padrão de Singleton para o cliente Prisma.

```typescript
// Exemplo de uso
import { db } from '@/lib/db';

const users = await db.user.findMany();
```

---

## 🎨 Design System

Seguimos diretrizes estritas de design para garantir consistência e acessibilidade.

### Cores Principais
- **Primária**: `#4A7BA7` (Azul Dessaturado)
- **Secundária**: `#6B9B6E` (Verde Dessaturado)
- **Fundo**: `#F8FAFC` (Claro) / `#0f172a` (Escuro)

### Responsividade
O layout é Mobile-First, utilizando breakpoints padrão do TailwindCSS (`sm`, `md`, `lg`, `xl`).

---

## ⚡ Performance & Otimização

### Otimização para LLMs
O código foi estruturado para ser facilmente compreendido por IAs:
- Funções pequenas e puras.
- Tipagem estrita (TypeScript).
- Documentação inline (JSDoc).
- Arquivos com responsabilidade única.

### Frontend Performance
- **Debounce**: Em inputs de busca.
- **Memoização**: `useMemo` e `useCallback` para cálculos pesados.
- **Lazy Loading**: Carregamento de componentes sob demanda.

---

## 🔒 Segurança

- **JWT**: Tokens de acesso com curta duração (15min) e Refresh Tokens.
- **RBAC**: Controle de acesso baseado em funções (Owner, Admin, Member).
- **Sanitização**: Todos os inputs são validados com Zod.
- **Rate Limiting**: Proteção contra abuso na API e WebSockets.

---

> Para guias de contribuição e padrões de código, consulte o [Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md).
