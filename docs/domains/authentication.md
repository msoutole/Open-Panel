# Domain: Authentication & User Management

> **Single-File Context**: Este arquivo contém TUDO que você precisa saber sobre autenticação e gerenciamento de usuários no OpenPanel - desde contexto de negócio até implementação técnica. Leia este arquivo uma vez e tenha 100% do contexto necessário.

---

## 📋 Índice
1. [Overview](#1-overview)
2. [Business Context](#2-business-context)
3. [User Stories](#3-user-stories)
4. [Business Rules](#4-business-rules)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Models](#6-data-models)
7. [API Endpoints](#7-api-endpoints)
8. [Implementation Details](#8-implementation-details)
9. [Testing](#9-testing)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Overview

### O que é?
Sistema completo de autenticação JWT com refresh tokens, gerenciamento de usuários, API keys, e controle de acesso baseado em roles (RBAC).

### Por que existe?
Protege recursos do sistema, identifica usuários, controla permissões e fornece autenticação programática para integr ações via API.

### Relacionamentos
- **Depende de**: Nenhum (domínio fundamental)
- **Usado por**: Todos os outros domínios (Teams, Projects, Containers, etc.)
- **Integra com**: Redis (rate limiting), Audit Log (segurança)

---

## 2. Business Context

### Problema
- **Segurança**: Acesso não autorizado a recursos críticos
- **UX**: Usuários não querem fazer login a cada ação (15min session)
- **Automação**: Sistemas precisam acessar API sem intervenção manual
- **Compliance**: Necessidade de auditoria de acessos

### Solução
- **JWT com Refresh Tokens**: Access token curto (15min) + Refresh token longo (7 dias)
- **API Keys**: Autenticação de longa duração para scripts/integrações
- **RBAC**: 4 níveis de permissão (OWNER, ADMIN, MEMBER, VIEWER)
- **Rate Limiting**: Proteção contra brute force
- **Audit Log**: Rastreamento de login/registro/mudanças críticas

### Stakeholders
- **Usuários Finais**: Desenvolvedores e DevOps que usam o painel
- **Administradores**: Gerenciam usuários e permissões
- **Sistemas Externos**: CI/CD, scripts de automação (via API keys)

---

## 3. User Stories

### US-AUTH-001: Registrar Novo Usuário
**Como** visitante do OpenPanel
**Quero** criar uma conta com email e senha
**Para que** possa acessar o sistema

**Critérios de Aceitação:**
- [ ] Email deve ser único no sistema
- [ ] Senha deve ter mínimo 8 caracteres
- [ ] Senha é hashada com bcrypt (10 salt rounds)
- [ ] Retorna access token + refresh token automaticamente
- [ ] Rate limit: 5 tentativas por hora por IP
- [ ] Log de auditoria registra criação

**Prioridade**: Alta
**Status**: ✅ Implementado

---

### US-AUTH-002: Fazer Login
**Como** usuário registrado
**Quero** fazer login com email e senha
**Para que** obtenha tokens de acesso

**Critérios de Aceitação:**
- [ ] Valida credenciais contra banco de dados
- [ ] Retorna access token (15min) + refresh token (7 dias)
- [ ] Atualiza campo `lastLoginAt`
- [ ] Proteção contra brute force (rate limit)
- [ ] Log síncrono de auditoria (evento crítico de segurança)
- [ ] Mensagem genérica em caso de erro ("Invalid credentials")

**Prioridade**: Alta
**Status**: ✅ Implementado

---

### US-AUTH-003: Renovar Access Token
**Como** usuário autenticado com token expirado
**Quero** renovar meu access token usando refresh token
**Para que** não precise fazer login novamente

**Critérios de Aceitação:**
- [ ] Aceita refresh token válido
- [ ] Retorna novo par de tokens (rotation)
- [ ] Invalida refresh token antigo (segurança)
- [ ] Retorna 401 se refresh token inválido/expirado

**Prioridade**: Alta
**Status**: ✅ Implementado

---

### US-AUTH-004: Obter Perfil do Usuário
**Como** usuário autenticado
**Quero** consultar meus dados de perfil
**Para que** possa exibi-los na UI

**Critérios de Aceitação:**
- [ ] Requer Bearer token válido
- [ ] Retorna dados sem campo `password`
- [ ] Inclui: id, name, email, avatar, status, timestamps

**Prioridade**: Média
**Status**: ✅ Implementado

---

### US-AUTH-005: Atualizar Perfil
**Como** usuário autenticado
**Quero** atualizar meu nome, email ou avatar
**Para que** mantenha meus dados atualizados

**Critérios de Aceitação:**
- [ ] Usuário só pode editar próprio perfil
- [ ] Validação: email único se alterado
- [ ] Validação Zod em todos os campos
- [ ] Retorna perfil atualizado

**Prioridade**: Média
**Status**: ✅ Implementado

---

### US-AUTH-006: Trocar Senha
**Como** usuário autenticado
**Quero** trocar minha senha fornecendo senha atual
**Para que** mantenha minha conta segura

**Critérios de Aceitação:**
- [ ] Requer senha atual correta
- [ ] Nova senha diferente da atual
- [ ] Nova senha mínimo 8 caracteres
- [ ] Hash bcrypt da nova senha
- [ ] Log de auditoria

**Prioridade**: Alta
**Status**: ✅ Implementado

---

### US-AUTH-007: Gerar API Key
**Como** desenvolvedor
**Quero** gerar uma API key de longa duração
**Para que** possa autenticar scripts/CI-CD

**Critérios de Aceitação:**
- [ ] Requer autenticação Bearer
- [ ] Gera token criptograficamente seguro
- [ ] Permite definir data de expiração (opcional)
- [ ] Permite nomear a key (ex: "CI/CD Production")
- [ ] Armazena hash da key, não plain-text

**Prioridade**: Alta
**Status**: 📋 Planejado (modelo existe no schema)

---

### US-AUTH-008: Revogar API Key
**Como** usuário
**Quero** revogar API keys comprometidas
**Para que** bloqueie acesso não autorizado

**Critérios de Aceitação:**
- [ ] Lista todas as keys do usuário
- [ ] Permite deletar individualmente
- [ ] Log de auditoria

**Prioridade**: Alta
**Status**: 📋 Planejado

---

### US-AUTH-009: Autenticação 2FA (TOTP)
**Como** usuário preocupado com segurança
**Quero** habilitar 2FA com Google Authenticator
**Para que** adicione camada extra de proteção

**Critérios de Aceitação:**
- [ ] Geração de secret TOTP
- [ ] QR code para scan
- [ ] Validação de código 6 dígitos
- [ ] Backup codes

**Prioridade**: Média
**Status**: 📋 Planejado

---

## 4. Business Rules

### BR-AUTH-001: Unicidade de Email
**Descrição**: Cada email pode ter apenas uma conta no sistema.

**Condições**:
- Email em formato válido (validação Zod)
- Case-insensitive comparison

**Consequências**:
- Registro falha com erro 400 se email existir
- Update falha se novo email já em uso

**Exceções**: Nenhuma

---

### BR-AUTH-002: Força de Senha
**Descrição**: Senhas devem seguir requisitos mínimos de segurança.

**Condições**:
- Mínimo 8 caracteres
- (Futuro: 1 maiúscula, 1 minúscula, 1 número, 1 especial)

**Consequências**:
- Validação Zod rejeita senhas fracas (400)

**Exceções**: Nenhuma

---

### BR-AUTH-003: Expiração de Tokens
**Descrição**: Tokens JWT têm tempo de vida limitado.

**Condições**:
- Access token: 15 minutos (`JWT_ACCESS_EXPIRES_IN`)
- Refresh token: 7 dias (`JWT_REFRESH_EXPIRES_IN`)

**Consequências**:
- Access token expirado → 401 → Frontend usa refresh
- Refresh token expirado → 401 → Usuário redireciona para login

**Exceções**: API Keys não expiram (ou têm expiração definida manualmente)

---

### BR-AUTH-004: Rate Limiting em Autenticação
**Descrição**: Limita tentativas de login/registro para prevenir brute force.

**Condições**:
- Endpoint: `/auth/register`, `/auth/login`, `/auth/refresh`
- Limite: 5 requisições por 15 minutos por IP

**Consequências**:
- Requisição bloqueada com 429 (Too Many Requests)
- Header `Retry-After` indica quando tentar novamente

**Exceções**: IPs whitelistados (configuração futura)

---

### BR-AUTH-005: Isolamento de Usuário
**Descrição**: Usuários só podem modificar próprios dados.

**Condições**:
- Operações PUT/PATCH/DELETE em `/users/:userId`
- `currentUser.userId === :userId`

**Consequências**:
- Retorna 403 Forbidden se tentar editar outro usuário
- Exceção: ADMIN/OWNER podem editar qualquer usuário

**Exceções**: Admins (implementação futura de middleware RBAC)

---

### BR-AUTH-006: Soft Delete vs Hard Delete
**Descrição**: Usuários podem ser desativados (soft) ou deletados permanentemente (hard).

**Condições**:
- Soft: `status = SUSPENDED/INACTIVE`
- Hard: `DELETE FROM users WHERE id = ?`

**Consequências**:
- Soft delete: Preserva dados para auditoria
- Hard delete: Cascata remove projetos, logs, etc.

**Exceções**: Não se pode deletar própria conta logada

---

## 5. Technical Architecture

### Componentes

#### Backend (`apps/api`)
```
src/
├── routes/
│   ├── auth.ts              # Rotas de autenticação (register, login, refresh, me)
│   └── users.ts             # CRUD de usuários (list, get, update, delete)
├── lib/
│   ├── jwt.ts               # Geração e verificação de JWT
│   ├── hash.ts              # Bcrypt para senhas
│   └── crypto.ts            # Criptografia de API keys (futuro)
├── middlewares/
│   ├── auth.ts              # Middleware de autenticação (Bearer + ApiKey)
│   ├── rate-limit.ts        # Rate limiting específico
│   └── audit.ts             # Logging de eventos críticos
└── validators/
    └── auth.ts (shared)     # Schemas Zod compartilhados
```

#### Frontend (`apps/web`)
```
src/
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Profile.tsx
├── services/
│   └── auth.service.ts      # API client + token refresh interceptor
└── hooks/
    └── useAuth.ts           # React hook para auth state
```

### Fluxo de Dados

#### Fluxo de Login
```
1. User submits email + password
   ↓
2. Frontend → POST /api/auth/login
   ↓
3. API: authRateLimiter middleware
   ↓
4. API: Zod validation (loginSchema)
   ↓
5. API: Query user from database
   ↓
6. API: Compare password (bcrypt)
   ↓
7. API: Generate JWT access + refresh tokens
   ↓
8. API: Update lastLoginAt
   ↓
9. API: Log audit event (sync)
   ↓
10. API → Returns { user, accessToken, refreshToken }
   ↓
11. Frontend: Store tokens in localStorage
   ↓
12. Frontend: Redirect to dashboard
```

#### Fluxo de Requisição Autenticada
```
1. Frontend → GET /api/projects (with Authorization: Bearer <token>)
   ↓
2. API: authMiddleware extracts token
   ↓
3. API: verifyToken() validates JWT
   ↓
4. API: Sets c.set('user', payload)
   ↓
5. Route handler: const user = c.get('user')
   ↓
6. Business logic uses user.userId
```

#### Fluxo de Refresh Token
```
1. Access token expires (15min)
   ↓
2. Frontend intercepts 401 response
   ↓
3. Frontend → POST /api/auth/refresh { refreshToken }
   ↓
4. API: Verifies refresh token
   ↓
5. API: Generates NEW access + refresh tokens
   ↓
6. API → Returns new tokens
   ↓
7. Frontend: Updates stored tokens
   ↓
8. Frontend: Retries original request with new access token
```

### Integrações
- **PostgreSQL**: Armazena User, ApiKey, AuditLog
- **Redis**: Rate limiting (via `hono-rate-limiter`)
- **JWT**: `jsonwebtoken` library
- **Bcrypt**: `bcryptjs` para hashing de senhas

---

## 6. Data Models

### Prisma Schema

```prisma
// Enums
enum UserRole {
  OWNER      // Criador do servidor, todos os poderes
  ADMIN      // Pode gerenciar usuários e configurações
  MEMBER     // Pode criar projetos e gerenciar próprios recursos
  VIEWER     // Apenas visualização
}

enum UserStatus {
  ACTIVE     // Usuário ativo
  INACTIVE   // Conta desativada temporariamente
  SUSPENDED  // Bloqueado por violação
}

// Main User Model
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String
  password      String      // bcrypt hash
  avatar        String?
  status        UserStatus  @default(ACTIVE)
  emailVerified DateTime?

  // Metadata
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastLoginAt   DateTime?

  // Relations
  teams         TeamMember[]
  projects      Project[]    @relation("ProjectOwner")
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]
  notifications Notification[]

  @@index([email])
  @@map("users")
}

// API Keys for programmatic access
model ApiKey {
  id        String   @id @default(cuid())
  name      String   // "CI/CD Production", "Backup Script"
  key       String   @unique  // Hashed API key
  expiresAt DateTime?

  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Metadata
  createdAt DateTime @default(now())
  lastUsedAt DateTime?

  @@index([key])
  @@index([userId])
  @@map("api_keys")
}
```

### Relacionamentos
- **User → ApiKey**: 1:N (um usuário pode ter múltiplas keys)
- **User → TeamMember**: 1:N (participa de múltiplos teams)
- **User → Project**: 1:N (owns multiple projects)
- **User → AuditLog**: 1:N (histórico de ações)

### Índices
- `email`: Busca rápida por email (login)
- `apiKeys.key`: Validação de API key
- `apiKeys.userId`: Listar keys de um usuário

---

## 7. API Endpoints

### POST /api/auth/register
**Descrição**: Registra novo usuário no sistema

**Auth**: Pública (com rate limiting)

**Request Body**:
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Validation** (Zod):
```typescript
const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8)
})
```

**Response 201**:
```json
{
  "user": {
    "id": "clx123...",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "eyJhbGciOiJIUzI1Ni..."
}
```

**Errors**:
- `400`: User already exists / Validation error
- `429`: Too many requests (rate limit)
- `500`: Internal server error

---

### POST /api/auth/login
**Descrição**: Autentica usuário e retorna tokens JWT

**Auth**: Pública (com rate limiting)

**Request Body**:
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Validation**:
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})
```

**Response 200**:
```json
{
  "user": {
    "id": "clx123...",
    "name": "João Silva",
    "email": "joao@example.com",
    "avatar": null,
    "status": "ACTIVE"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errors**:
- `401`: Invalid credentials
- `429`: Too many requests
- `500`: Internal error

---

### POST /api/auth/refresh
**Descrição**: Renova access token usando refresh token

**Auth**: Pública (requer refresh token válido)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1Ni..."
}
```

**Response 200**:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."  // Rotacionado (novo token)
}
```

**Errors**:
- `400`: Refresh token required
- `401`: Invalid or expired refresh token
- `500`: Internal error

---

### GET /api/auth/me
**Descrição**: Retorna dados do usuário autenticado

**Auth**: Bearer token (middleware `authMiddleware`)

**Response 200**:
```json
{
  "user": {
    "id": "clx123...",
    "name": "João Silva",
    "email": "joao@example.com",
    "avatar": "https://...",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-10T10:00:00Z"
  }
}
```

**Errors**:
- `401`: Unauthorized (token inválido/expirado)
- `404`: User not found
- `500`: Internal error

---

### GET /api/users
**Descrição**: Lista todos os usuários (admin only - futuramente)

**Auth**: Bearer token

**Query Params**: (futuro)
- `page` (number): Página atual
- `limit` (number): Items por página
- `status` (enum): Filtro por status

**Response 200**:
```json
{
  "users": [
    {
      "id": "clx123...",
      "name": "João Silva",
      "email": "joao@example.com",
      "avatar": null,
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Forbidden (não é admin)
- `500`: Internal error

---

### GET /api/users/:userId
**Descrição**: Retorna dados de usuário específico

**Auth**: Bearer token

**Response 200**:
```json
{
  "user": {
    "id": "clx123...",
    "name": "João Silva",
    "email": "joao@example.com",
    "avatar": null,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-10T10:00:00Z"
  }
}
```

**Errors**:
- `401`: Unauthorized
- `404`: User not found
- `500`: Internal error

---

### PUT /api/users/:userId
**Descrição**: Atualiza perfil de usuário

**Auth**: Bearer token (usuário só pode editar próprio perfil)

**Request Body**:
```json
{
  "name": "João Pedro Silva",
  "email": "joao.pedro@example.com",
  "avatar": "https://avatar.url",
  "status": "ACTIVE"
}
```

**Validation**:
```typescript
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
})
```

**Response 200**:
```json
{
  "user": {
    "id": "clx123...",
    "name": "João Pedro Silva",
    "email": "joao.pedro@example.com",
    "avatar": "https://avatar.url",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-10T10:00:00Z"
  }
}
```

**Errors**:
- `400`: Email already in use / Validation error
- `401`: Unauthorized
- `403`: Forbidden (tentando editar outro usuário)
- `500`: Internal error

---

### POST /api/users/:userId/change-password
**Descrição**: Altera senha do usuário

**Auth**: Bearer token (usuário só pode mudar própria senha)

**Request Body**:
```json
{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

**Validation**:
```typescript
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
})
```

**Response 200**:
```json
{
  "message": "Password changed successfully"
}
```

**Errors**:
- `400`: Validation error
- `401`: Current password is incorrect / Unauthorized
- `403`: Forbidden
- `404`: User not found
- `500`: Internal error

---

### DELETE /api/users/:userId
**Descrição**: Deleta usuário permanentemente (admin only)

**Auth**: Bearer token (admin)

**Response 200**:
```json
{
  "message": "User deleted successfully"
}
```

**Errors**:
- `400`: Cannot delete your own account
- `401`: Unauthorized
- `403`: Forbidden (não é admin)
- `404`: User not found
- `500`: Internal error

---

## 8. Implementation Details

### Key Files

#### Route Handler (`apps/api/src/routes/auth.ts`)
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../lib/hash'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt'
import { registerSchema, loginSchema } from '@openpanel/shared'
import { authRateLimiter } from '../middlewares/rate-limit'
import { logAudit, AuditActions } from '../middlewares/audit'

const auth = new Hono()

// POST /register - Com rate limiting rigoroso
auth.post('/register', authRateLimiter, zValidator('json', registerSchema), async (c) => {
  const { name, email, password } = c.req.valid('json')

  // Verifica email único
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400)
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Cria usuário
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, createdAt: true }
  })

  // Gera tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email })
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email })

  // Audit log assíncrono
  await logAudit(c, {
    userId: user.id,
    action: AuditActions.REGISTER,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { email: user.email, name: user.name }
  })

  return c.json({ user, accessToken, refreshToken }, 201)
})

// POST /login - Com rate limiting rigoroso
auth.post('/login', authRateLimiter, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  // Busca usuário
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Valida senha
  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Atualiza lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  // Gera tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email })
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email })

  // Audit log SÍNCRONO (evento crítico de segurança)
  await logAudit(c, {
    userId: user.id,
    action: AuditActions.LOGIN,
    resourceType: 'user',
    resourceId: user.id,
    sync: true
  })

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status
    },
    accessToken,
    refreshToken
  })
})

// POST /refresh - Renova access token
auth.post('/refresh', authRateLimiter, async (c) => {
  const body = await c.req.json()
  const { refreshToken } = body

  if (!refreshToken) {
    return c.json({ error: 'Refresh token is required' }, 400)
  }

  // Verifica refresh token
  const payload = verifyToken(refreshToken)

  // Gera NOVOS tokens (rotation)
  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email
  })
  const newRefreshToken = generateRefreshToken({
    userId: payload.userId,
    email: payload.email
  })

  return c.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  })
})

// GET /me - Retorna usuário atual
auth.get('/me', async (c) => {
  const user = c.get('user')  // Injetado pelo authMiddleware

  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      status: true,
      createdAt: true,
      lastLoginAt: true
    }
  })

  if (!userData) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user: userData })
})

export default auth
```

#### JWT Library (`apps/api/src/lib/jwt.ts`)
```typescript
import jwt from 'jsonwebtoken'
import { env } from './env'

interface TokenPayload {
  userId: string
  email: string
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m'
  })
}

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d'
  })
}

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw error
  }
}
```

#### Auth Middleware (`apps/api/src/middlewares/auth.ts`)
```typescript
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../lib/jwt'
import type { Variables } from '../types'

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
      throw new HTTPException(401, { message: 'Authorization header missing' })
    }

    // Suporte a Bearer Token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      try {
        const payload = verifyToken(token)
        c.set('user', payload)
        await next()
        return
      } catch (error) {
        throw new HTTPException(401, {
          message: error instanceof Error ? error.message : 'Invalid token'
        })
      }
    }

    // Suporte a ApiKey (futuro)
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7)
      // TODO: Validar API key no banco
      throw new HTTPException(501, { message: 'API Key auth not implemented' })
    }

    throw new HTTPException(401, { message: 'Invalid authorization format' })
  }
)
```

#### Password Hashing (`apps/api/src/lib/hash.ts`)
```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}
```

#### Rate Limiter (`apps/api/src/middlewares/rate-limit.ts`)
```typescript
import { rateLimiter } from 'hono-rate-limiter'
import { redis } from '../lib/redis'

export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 requisições
  store: redis,               // Armazena no Redis
  standardHeaders: true,      // Adiciona RateLimit-* headers
  message: 'Too many requests, please try again later'
})
```

### Frontend Service (`apps/web/src/services/auth.service.ts`)
```typescript
const API_URL = import.meta.env.VITE_API_URL

export const AuthService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Registration failed')
    }

    const result = await res.json()

    // Armazena tokens
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    localStorage.setItem('user', JSON.stringify(result.user))

    return result
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      throw new Error('Invalid credentials')
    }

    const result = await res.json()

    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    localStorage.setItem('user', JSON.stringify(result.user))

    return result
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken')

    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!res.ok) {
      // Refresh falhou, usuário precisa fazer login novamente
      this.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }

    const result = await res.json()

    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)

    return result.accessToken
  },

  async getMe() {
    const token = localStorage.getItem('accessToken')

    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    // Se 401, tenta refresh
    if (res.status === 401) {
      const newToken = await this.refreshToken()

      // Retry com novo token
      const retryRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      })

      return retryRes.json()
    }

    return res.json()
  },

  logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }
}
```

### Security Considerations

- **JWT Secret**: Mínimo 32 caracteres, armazenado em `.env` (nunca commitar)
- **Password Hashing**: Bcrypt com 10 salt rounds
- **Rate Limiting**: 5 tentativas por 15 minutos em endpoints de auth
- **Token Rotation**: Refresh tokens são rotacionados a cada uso
- **HTTPS Only**: Em produção, forçar HTTPS
- **Audit Logging**: Login e register são logados sincronamente
- **Sensitive Data**: Nunca retornar campo `password` nas respostas

---

## 9. Testing

### Unit Tests

```typescript
// apps/api/src/__tests__/unit/lib/jwt.test.ts
import { describe, it, expect } from 'vitest'
import { generateAccessToken, verifyToken } from '../../../lib/jwt'

describe('JWT Library', () => {
  it('should generate and verify access token', () => {
    const payload = { userId: 'test123', email: 'test@example.com' }
    const token = generateAccessToken(payload)

    const verified = verifyToken(token)
    expect(verified.userId).toBe('test123')
    expect(verified.email).toBe('test@example.com')
  })

  it('should throw on expired token', () => {
    // Mock token expirado
    const expiredToken = 'eyJ...' // token com exp no passado
    expect(() => verifyToken(expiredToken)).toThrow('Token expired')
  })
})
```

```typescript
// apps/api/src/__tests__/unit/lib/hash.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '../../../lib/hash'

describe('Password Hashing', () => {
  it('should hash and compare password', async () => {
    const password = 'mySecurePassword123'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)

    const isValid = await comparePassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const password = 'correct'
    const hash = await hashPassword(password)

    const isValid = await comparePassword('wrong', hash)
    expect(isValid).toBe(false)
  })
})
```

### Integration Tests

```typescript
// apps/api/src/__tests__/integration/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from '../helpers/test-client'
import { prisma } from '../../lib/prisma'

describe('Authentication Flow', () => {
  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } }
    })
  })

  it('should register new user', async () => {
    const res = await testClient.post('/api/auth/register', {
      body: {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123'
      }
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('user')
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
    expect(res.body.user.email).toBe('test@test.com')
  })

  it('should reject duplicate email', async () => {
    await testClient.post('/api/auth/register', {
      body: {
        name: 'User 1',
        email: 'duplicate@test.com',
        password: 'password123'
      }
    })

    const res = await testClient.post('/api/auth/register', {
      body: {
        name: 'User 2',
        email: 'duplicate@test.com',
        password: 'password456'
      }
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('already exists')
  })

  it('should login with valid credentials', async () => {
    // Primeiro registra
    await testClient.post('/api/auth/register', {
      body: {
        name: 'Login Test',
        email: 'login@test.com',
        password: 'password123'
      }
    })

    // Depois loga
    const res = await testClient.post('/api/auth/login', {
      body: {
        email: 'login@test.com',
        password: 'password123'
      }
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body.user.email).toBe('login@test.com')
  })

  it('should reject invalid credentials', async () => {
    const res = await testClient.post('/api/auth/login', {
      body: {
        email: 'wrong@test.com',
        password: 'wrongpassword'
      }
    })

    expect(res.status).toBe(401)
  })

  it('should access protected route with valid token', async () => {
    // Registra e pega token
    const authRes = await testClient.post('/api/auth/register', {
      body: {
        name: 'Protected Test',
        email: 'protected@test.com',
        password: 'password123'
      }
    })

    const token = authRes.body.accessToken

    // Acessa /me
    const res = await testClient.get('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('protected@test.com')
  })

  it('should refresh access token', async () => {
    const authRes = await testClient.post('/api/auth/register', {
      body: {
        name: 'Refresh Test',
        email: 'refresh@test.com',
        password: 'password123'
      }
    })

    const refreshToken = authRes.body.refreshToken

    const res = await testClient.post('/api/auth/refresh', {
      body: { refreshToken }
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
  })
})
```

### Manual Testing Checklist

#### Happy Path
- [ ] Registrar novo usuário com email único
- [ ] Fazer login com credenciais corretas
- [ ] Acessar `/auth/me` com token válido
- [ ] Atualizar perfil do usuário
- [ ] Trocar senha fornecendo senha atual correta
- [ ] Renovar access token com refresh token válido

#### Error Cases
- [ ] Tentar registrar com email duplicado → 400
- [ ] Tentar login com senha errada → 401
- [ ] Tentar login com email inexistente → 401
- [ ] Acessar rota protegida sem token → 401
- [ ] Acessar rota protegida com token inválido → 401
- [ ] Tentar editar perfil de outro usuário → 403
- [ ] Trocar senha fornecendo senha atual errada → 401
- [ ] Exceder rate limit de login (5 em 15min) → 429

#### Security
- [ ] Senha retornada no hash (não plaintext)
- [ ] Token JWT tem expiração correta (15min)
- [ ] Refresh token funciona após access expirar
- [ ] Logs de auditoria registram login/register
- [ ] Rate limit bloqueia após 5 tentativas

---

## 10. Future Enhancements

### Curto Prazo (1-3 meses)
- [ ] **API Keys Completas**: Implementar CRUD completo de API keys
- [ ] **RBAC Middleware**: Middleware para validar permissões por role
- [ ] **Email Verification**: Confirmação de email após registro
- [ ] **Password Reset**: Esqueci minha senha via email

### Médio Prazo (3-6 meses)
- [ ] **2FA com TOTP**: Google Authenticator integration
- [ ] **OAuth Providers**: Login com GitHub, Google, etc.
- [ ] **Session Management**: Listar e revogar sessões ativas
- [ ] **Account Lockout**: Bloqueio temporário após N tentativas falhas

### Longo Prazo (6+ meses)
- [ ] **SSO/SAML**: Single Sign-On para empresas
- [ ] **WebAuthn**: Autenticação biométrica/hardware keys
- [ ] **Audit Dashboard**: UI para visualizar logs de segurança

### Debt Técnico
- [ ] Migrar de localStorage para HttpOnly cookies (mais seguro)
- [ ] Implementar token blacklist para logout forçado
- [ ] Adicionar testes E2E com Playwright
- [ ] Documentação OpenAPI/Swagger

---

## 📚 Related Documentation

- [System Architecture](../architecture/01-system-architecture.md)
- [Teams Domain](./teams.md)
- [RBAC & Security](./rbac-security.md)

---

**Última Atualização**: 2025-11-26
**Mantido por**: OpenPanel Core Team
**Status**: ✅ Implementado (95% - faltam API Keys e 2FA)
