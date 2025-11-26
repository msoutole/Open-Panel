# Módulo: Autenticação e Segurança

> **Status**: ✅ Estável / Em Produção
> **Versão**: 1.0
> **Última Atualização**: 2025-11-25

## 1. Contexto e Arquitetura

O sistema de autenticação do OpenPanel é baseado em **JWT (JSON Web Tokens)** com estratégia de **Refresh Tokens** para garantir segurança e experiência do usuário. Ele suporta múltiplos níveis de permissão (RBAC) e acesso programático via API Keys.

### Fluxo de Autenticação
1. **Login**: Usuário envia credenciais -> Backend valida -> Retorna `accessToken` (15min) e `refreshToken` (7 dias).
2. **Uso**: Frontend envia `accessToken` no header `Authorization: Bearer ...`.
3. **Renovação**: Quando `accessToken` expira (401), Frontend usa `refreshToken` para obter novo par de tokens.
4. **Segurança**: Senhas são hashadas com `bcryptjs` (salt rounds=10).

### Modelo de Dados (Prisma)

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String
  password      String      // bcrypt hash
  role          UserRole    @default(MEMBER)
  status        UserStatus  @default(ACTIVE)
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]
}

enum UserRole { OWNER, ADMIN, MEMBER, VIEWER }
```

## 2. User Stories e Requisitos

| ID              | História              | Status      | Critérios de Aceitação                                                             |
| --------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------- |
| **US-AUTH-001** | **Registrar Usuário** | ✅ Pronto    | • Validação de email único<br>• Senha forte (min 8 chars)<br>• Rate limit (5/hora) |
| **US-AUTH-002** | **Fazer Login**       | ✅ Pronto    | • Retornar JWT Access + Refresh<br>• Bloqueio após 5 tentativas falhas             |
| **US-AUTH-003** | **Refresh Token**     | ✅ Pronto    | • Renovar access token sem login<br>• Invalidar refresh token usado/inválido       |
| **US-AUTH-004** | **Perfil**            | ✅ Pronto    | • Retornar dados do usuário logado (sem senha)                                     |
| **US-AUTH-005** | **Logout**            | ✅ Pronto    | • Invalidar tokens no cliente e servidor                                           |
| **US-AUTH-006** | **API Keys**          | ✅ Pronto    | • Gerar/Revogar chaves<br>• Autenticação via header `Authorization: ApiKey ...`    |
| **US-AUTH-007** | **Rate Limiting**     | 📋 Planejado | • Limites configuráveis por IP/User                                                |
| **US-AUTH-008** | **2FA**               | 📋 Planejado | • Suporte a TOTP (Google Authenticator)                                            |

## 3. Implementação Técnica

### Stack
- **Backend**: Hono + Zod Validator
- **Auth Libs**: `jsonwebtoken`, `bcryptjs`
- **Frontend**: Axios Interceptors (para auto-refresh)

### Estrutura de Código
- **Rotas**: `apps/api/src/routes/auth.ts`
- **Serviço**: `apps/api/src/services/auth.service.ts`
- **Middleware**: `apps/api/src/middlewares/auth.ts`
- **Frontend Service**: `apps/web/services/auth.ts`

### Snippets Chave

**Middleware de Auth (Hono):**
```typescript
export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  // Suporte a Bearer Token e ApiKey
  if (authHeader?.startsWith('Bearer ')) { ... }
  if (authHeader?.startsWith('ApiKey ')) { ... }
  await next();
}
```

## 4. Referência da API

### Endpoints Principais

| Método | Endpoint              | Descrição              | Auth       |
| ------ | --------------------- | ---------------------- | ---------- |
| `POST` | `/api/auth/register`  | Registrar novo usuário | Pública    |
| `POST` | `/api/auth/login`     | Login (retorna tokens) | Pública    |
| `POST` | `/api/auth/refresh`   | Renovar access token   | Pública    |
| `GET`  | `/api/auth/me`        | Dados do usuário atual | **Bearer** |
| `POST` | `/api/users/api-keys` | Gerar API Key          | **Bearer** |

### Exemplo de Response (Login)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "eyJhbGciOiJIUzI1Ni...",
  "expiresIn": 900,
  "user": { "id": "...", "email": "user@example.com", "role": "OWNER" }
}
```

## 5. Verificação e Testes

- [x] **Unitários**: `apps/api/src/__tests__/auth.test.ts` (Cobertura: 90%)
- [x] **Integração**: Testar fluxo completo Register -> Login -> Me -> Refresh -> Logout.
- [x] **Segurança**: Tentar acessar rota protegida sem token (deve retornar 401).
