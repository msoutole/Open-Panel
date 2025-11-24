# Feature: Authentication System

Documentação técnica completa do sistema de autenticação do OpenPanel.

## 📌 Visão Geral

O OpenPanel implementa um sistema robusto de autenticação baseado em JWT com suporte a:
- Registro de usuários
- Login seguro com bcrypt
- Tokens JWT com auto-refresh
- API Keys para acesso programático
- Rate limiting em endpoints críticos
- Auditoria de segurança

## 🏗️ Arquitetura

### Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────┐
│                    Cliente (Web/API)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │    POST /auth/register │  (1) Registro
        │    POST /auth/login    │  (2) Login
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Validação Zod Schema      │
        │  - Email válido            │
        │  - Senha forte             │
        │  - Email único             │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Hash/Compare Password    │
        │   (bcryptjs)               │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Gerar JWT Tokens         │
        │   - AccessToken (15m)      │
        │   - RefreshToken (7d)      │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Armazenar no DB          │
        │   - User record            │
        │   - Audit log              │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Retornar para Cliente     │
        │  - Tokens JWT              │
        │  - Dados do usuário        │
        └────────────────────────────┘
```

### Componentes Principais

1. **Authentication Middleware**
   - Validação de JWT
   - Extração de claims
   - Handling de expiração

2. **Password Hashing**
   - bcryptjs com salt rounds = 10
   - Comparação segura

3. **Token Generation**
   - JWT com HS256
   - Payload: { userId, email, role }
   - Expiration claims

4. **Rate Limiting**
   - Proteção contra brute force
   - Limiting por IP
   - Limiting por usuário

## 🔐 Segurança

### Senhas

```typescript
// Hash de senha seguro
const hashedPassword = await bcryptjs.hash(password, 10);

// Comparação segura
const isValid = await bcryptjs.compare(password, hashedPassword);
```

**Requisitos de Senha:**
- Mínimo 8 caracteres
- Máximo 128 caracteres
- Recomendado: Maiúsculas + minúsculas + números + caracteres especiais

### Tokens JWT

```typescript
// Access Token (15 minutos)
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token (7 dias)
{
  "sub": "user-id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234999990
}
```

**Boas Práticas:**
- JWT secret mínimo 32 caracteres
- Rotate secrets periodicamente
- Usar HTTPS sempre
- Armazenar tokens securely no client (HttpOnly cookies em produção)

### Rate Limiting

```
Auth endpoints:
  - POST /auth/register: 5 tentativas / hora
  - POST /auth/login: 5 tentativas erradas / 15 min
  - POST /auth/refresh: 10 / hora

Limite geral: Por IP + Por User ID
Retorno: 429 Too Many Requests
```

## 📡 Endpoints

### POST /api/auth/register

Registrar novo usuário.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Validações:**
- Email deve ser válido e único
- Nome entre 3-100 caracteres
- Senha entre 8-128 caracteres

---

### POST /api/auth/login

Fazer login e obter tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### POST /api/auth/refresh

Renovar access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Response (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### GET /api/auth/me

Obter dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "status": "ACTIVE",
  "createdAt": "2024-11-24T10:00:00Z"
}
```

---

### POST /api/auth/logout

Fazer logout (limpar no client).

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /api/users/api-keys

Criar nova API key.

**Request:**
```json
{
  "name": "Production Deploy Key",
  "expiresIn": 86400
}
```

**Response (201):**
```json
{
  "key": "sk_1234567890abcdef",
  "name": "Production Deploy Key",
  "expiresAt": "2024-11-25T10:00:00Z",
  "createdAt": "2024-11-24T10:00:00Z"
}
```

**Nota:** A key é retornada apenas uma vez. Salve em local seguro.

---

### GET /api/users/api-keys

Listar API keys do usuário.

**Response (200):**
```json
{
  "keys": [
    {
      "id": "uuid",
      "name": "Production Deploy Key",
      "lastUsed": "2024-11-24T09:00:00Z",
      "expiresAt": "2024-11-25T10:00:00Z",
      "createdAt": "2024-11-24T10:00:00Z"
    }
  ]
}
```

---

### DELETE /api/users/api-keys/:id

Revogar API key.

**Response (200):**
```json
{
  "message": "API key revoked successfully"
}
```

---

## 🛠️ Implementação

### Backend (Hono)

```typescript
// routes/auth.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { registerSchema, loginSchema } from '@openpanel/shared'

const auth = new Hono()

// Register
auth.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    const { email, name, password } = c.req.valid('json')

    // Verificar se email já existe
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return c.json({ error: 'Email already exists' }, 400)
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Criar usuário
    const user = await db.user.create({
      data: { email, name, password: hashedPassword }
    })

    // Auditoria
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        ipAddress: c.req.header('x-forwarded-for'),
        userAgent: c.req.header('user-agent')
      }
    })

    return c.json({ message: 'User registered', user }, 201)
  }
)

// Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)

  const isValid = await bcryptjs.compare(password, user.password)
  if (!isValid) return c.json({ error: 'Invalid credentials' }, 401)

  // Gerar tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  // Auditoria
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipAddress: c.req.header('x-forwarded-for'),
      userAgent: c.req.header('user-agent')
    }
  })

  return c.json({ accessToken, refreshToken, expiresIn: 900, user }, 200)
})

export default auth
```

### Frontend (React)

```typescript
// services/auth.ts
const api = axios.create({ baseURL: 'http://localhost:8000' })

export const authService = {
  async register(email: string, name: string, password: string) {
    const res = await api.post('/api/auth/register', { email, name, password })
    return res.data
  },

  async login(email: string, password: string) {
    const res = await api.post('/api/auth/login', { email, password })

    // Armazenar tokens
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(res.data.user))

    // Configurar header padrão
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`

    return res.data
  },

  logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  },

  async getProfile() {
    const res = await api.get('/api/auth/me')
    return res.data
  }
}
```

---

## 🔍 Tipos de Dados

### User Model (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hash
  avatar    String?
  role      UserRole @default(USER)
  status    UserStatus @default(ACTIVE)

  teams     Team[]
  projects  Project[]
  apiKeys   ApiKey[]
  auditLogs AuditLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### ApiKey Model

```prisma
model ApiKey {
  id    String @id @default(cuid())

  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  key       String @unique
  lastUsed  DateTime?
  expiresAt DateTime?

  createdAt DateTime @default(now())
}
```

### AuditLog Model

```prisma
model AuditLog {
  id     String @id @default(cuid())

  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  action    String // LOGIN, LOGOUT, REGISTER, CREATE_PROJECT, etc
  resource  String?
  ipAddress String?
  userAgent String?
  metadata  Json?

  createdAt DateTime @default(now())
}
```

---

## 🧪 Testes

### Unit Tests (Vitest)

```typescript
// auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { registerUser, loginUser } from '../auth.service'

describe('Authentication Service', () => {
  describe('registerUser', () => {
    it('should create user with hashed password', async () => {
      const result = await registerUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePassword123!'
      })

      expect(result.user.id).toBeDefined()
      expect(result.user.email).toBe('test@example.com')
    })

    it('should reject duplicate email', async () => {
      await registerUser({ ... })

      expect(() => registerUser({ email: 'test@example.com', ... }))
        .rejects.toThrow('Email already exists')
    })

    it('should hash password securely', async () => {
      const password = 'SecurePassword123!'
      const result = await registerUser({ password, ... })

      expect(result.user.password).not.toBe(password)
      expect(result.user.password.length).toBeGreaterThan(50) // bcrypt hash
    })
  })

  describe('loginUser', () => {
    it('should return tokens on valid credentials', async () => {
      const result = await loginUser('test@example.com', 'SecurePassword123!')

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })

    it('should reject invalid password', async () => {
      expect(() => loginUser('test@example.com', 'WrongPassword'))
        .rejects.toThrow('Invalid credentials')
    })
  })
})
```

---

## 📊 Monitoramento

### Métricas Importantes

```yaml
Authentication Events:
  - Total registrations (daily/monthly)
  - Total logins (daily/monthly)
  - Failed login attempts
  - API key creations
  - Password changes

Performance:
  - Login response time (<100ms)
  - Token generation time (<50ms)
  - Password hash time (<500ms)

Security:
  - Rate limit violations
  - Suspicious login patterns
  - Failed brute force attempts
  - Token expiration mismatches
```

---

## 🔗 Relacionados

- [User Stories: Authentication](../user-stories/authentication.md)
- [API Reference: Auth](../api-reference/01-authentication.md)
- [Security Architecture](./06-security-architecture.md)

---

**Versão**: 0.1.0
**Última atualização**: 2024-11-24
