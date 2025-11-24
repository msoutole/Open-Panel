# User Stories: Authentication & Security

Histórias de usuário para sistema de autenticação e segurança.

## US-AUTH-001: Registrar Novo Usuário

**ID**: US-AUTH-001
**Status**: ✅ Implementada
**Prioridade**: Alta
**Implementado em**: Sprint 1

### Descrição

Como um novo usuário,
Eu quero me registrar na plataforma com email e senha,
Para que eu possa acessar a aplicação.

### Critérios de Aceitação

- [ ] Usuário pode acessar página de registro
- [ ] Validação de email (formato válido, não duplicado)
- [ ] Validação de senha (mínimo 8 caracteres, complexidade)
- [ ] Hash seguro de senha (bcryptjs)
- [ ] Retorno de erro se email já existe
- [ ] Criação bem-sucedida com dados persistidos
- [ ] Redirecionar para login após sucesso
- [ ] Rate limiting em endpoint (máx 5 tentativas/hora)

### Tarefas Técnicas

- [x] Criar endpoint POST /api/auth/register
- [x] Implementar validação Zod (registerSchema)
- [x] Hash de senha com bcryptjs
- [x] Verificar duplicação de email
- [x] Criar usuário no banco
- [x] Retornar erro apropriado
- [x] Implementar rate limiting
- [x] Criar teste unitário

### Endpoints Relacionados

- `POST /api/auth/register`
  ```json
  Request:
  {
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "password": "SenhaForte123!"
  }

  Response (201):
  {
    "message": "Usuário registrado com sucesso",
    "user": {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário"
    }
  }
  ```

### Componentes Frontend

- `Login.tsx` - Página de login com link para registro
- `RegisterForm.tsx` - Formulário de registro

### Modelos de Dados

- `User` - email (único), name, password (hash)

### Validadores

- `registerSchema` (Zod) - Validação de entrada

---

## US-AUTH-002: Fazer Login

**ID**: US-AUTH-002
**Status**: ✅ Implementada
**Prioridade**: Alta
**Implementado em**: Sprint 1

### Descrição

Como um usuário registrado,
Eu quero fazer login com email e senha,
Para que eu possa acessar minhas aplicações.

### Critérios de Aceitação

- [ ] Usuário pode acessar página de login
- [ ] Validação de credenciais (email e senha corretos)
- [ ] Comparação segura de senha (bcryptjs)
- [ ] Geração de JWT access token (15 minutos)
- [ ] Geração de refresh token (7 dias)
- [ ] Tokens armazenados no client (localStorage)
- [ ] Redirecionamento para dashboard
- [ ] Rate limiting (máx 5 tentativas erradas/15min)
- [ ] Mensagem de erro para credenciais inválidas

### Tarefas Técnicas

- [x] Criar endpoint POST /api/auth/login
- [x] Implementar validação Zod (loginSchema)
- [x] Comparar password com hash
- [x] Gerar JWT tokens
- [x] Implementar refresh token logic
- [x] Rate limiting por IP
- [x] Auditoria de login
- [x] Criar teste unitário

### Endpoints Relacionados

- `POST /api/auth/login`
  ```json
  Request:
  {
    "email": "usuario@exemplo.com",
    "password": "SenhaForte123!"
  }

  Response (200):
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
  ```

### Componentes Frontend

- `Login.tsx` - Formulário de login
- `LoginForm.tsx` - Componente de entrada

---

## US-AUTH-003: Refresh Token

**ID**: US-AUTH-003
**Status**: ✅ Implementada
**Prioridade**: Alta
**Implementado em**: Sprint 1

### Descrição

Como um usuário autenticado,
Eu quero renovar meu access token expirado,
Para que eu possa continuar usando a aplicação sem fazer login novamente.

### Critérios de Aceitação

- [ ] Endpoint valida refresh token válido
- [ ] Gera novo access token
- [ ] Refresh token não é renovado
- [ ] Retorna erro se refresh token expirado
- [ ] Logout se refresh token inválido
- [ ] Auditoria de refresh

### Tarefas Técnicas

- [x] Criar endpoint POST /api/auth/refresh
- [x] Validar refresh token
- [x] Gerar novo access token
- [x] Armazenar auditoria
- [x] Criar teste

### Endpoints Relacionados

- `POST /api/auth/refresh`
  ```json
  Request:
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }

  Response (200):
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
  ```

---

## US-AUTH-004: Obter Perfil Autenticado

**ID**: US-AUTH-004
**Status**: ✅ Implementada
**Prioridade**: Alta
**Implementado em**: Sprint 1

### Descrição

Como um usuário autenticado,
Eu quero obter meus dados de perfil,
Para que eu possa verificar meus dados pessoais.

### Critérios de Aceitação

- [ ] Endpoint retorna dados do usuário autenticado
- [ ] Requer token JWT válido
- [ ] Não retorna senha/hash
- [ ] Retorna status 401 se não autenticado

### Tarefas Técnicas

- [x] Criar endpoint GET /api/auth/me
- [x] Validar JWT
- [x] Retornar dados do usuário
- [x] Middleware de autenticação

### Endpoints Relacionados

- `GET /api/auth/me`
  ```json
  Response (200):
  {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "avatar": "url-da-imagem",
    "status": "ACTIVE",
    "createdAt": "2024-11-24T10:00:00Z"
  }
  ```

---

## US-AUTH-005: Fazer Logout

**ID**: US-AUTH-005
**Status**: ✅ Implementada
**Prioridade**: Alta
**Implementado em**: Sprint 1

### Descrição

Como um usuário autenticado,
Eu quero fazer logout da aplicação,
Para que eu possa encerrar minha sessão de forma segura.

### Critérios de Aceitação

- [ ] Limpar tokens do client
- [ ] Invalidar sessão no server
- [ ] Redirecionar para página de login
- [ ] Auditoria de logout

### Tarefas Técnicas

- [x] Implementar logout no frontend
- [x] Limpar localStorage
- [x] Registrar logout em auditoria
- [x] Redirecionar para login

---

## US-AUTH-006: Gerenciar API Keys

**ID**: US-AUTH-006
**Status**: ✅ Implementada
**Prioridade**: Média
**Implementado em**: Sprint 3

### Descrição

Como um desenvolvedor,
Eu quero gerar e gerenciar chaves de API,
Para que eu possa acessar a API via scripts/automações.

### Critérios de Aceitação

- [ ] Usuário pode gerar nova API key
- [ ] API key é única e aleatória
- [ ] API key expira após período configurável
- [ ] Usuário pode revogar API key
- [ ] Usuário pode listar suas API keys
- [ ] API key não pode ser recuperada após criação
- [ ] Suportar múltiplas keys por usuário

### Tarefas Técnicas

- [x] Criar modelo ApiKey no Prisma
- [x] Endpoint POST /api/users/api-keys (gerar)
- [x] Endpoint GET /api/users/api-keys (listar)
- [x] Endpoint DELETE /api/users/api-keys/:id (revogar)
- [x] Middleware de autenticação via API key
- [x] Auditoria de criação/revogação

### Endpoints Relacionados

- `POST /api/users/api-keys` - Criar nova key
- `GET /api/users/api-keys` - Listar keys
- `DELETE /api/users/api-keys/:id` - Revogar key

### Headers para API Key

```
Authorization: ApiKey sk-xxxxxxxxxxxxxxxxxxxxx
```

---

## US-AUTH-007: Rate Limiting (FUTURE)

**ID**: US-AUTH-007
**Status**: 📋 Planejada
**Prioridade**: Média

### Descrição

Como o administrador do sistema,
Eu quero limitar requisições por IP/usuário,
Para que eu possa proteger a API contra abuso.

### Implementação Planejada

- Rate limiting em endpoints críticos
- Diferentes limites por tipo de endpoint
- Retorno de headers informativos (X-RateLimit-*)
- Whitelist de IPs

---

## US-AUTH-008: Two-Factor Authentication (FUTURE)

**ID**: US-AUTH-008
**Status**: 📋 Planejada
**Prioridade**: Baixa

### Descrição

Como um usuário preocupado com segurança,
Eu quero ativar autenticação de dois fatores,
Para que eu proteja minha conta com camada adicional de segurança.

### Implementação Planejada

- TOTP (Time-based One-Time Password)
- Backup codes
- SMS (opcional)

---

## 📊 Matriz de Dependências

```
User Registration (US-AUTH-001)
    ↓
User Login (US-AUTH-002)
    ├─→ Get Profile (US-AUTH-004)
    ├─→ Refresh Token (US-AUTH-003)
    └─→ Logout (US-AUTH-005)

API Keys (US-AUTH-006)
    └─→ Requer login

Rate Limiting (US-AUTH-007)
    └─→ Proteção geral

2FA (US-AUTH-008)
    └─→ Opcional após login
```

---

**Última atualização**: 2024-11-24
**Versão**: 0.1.0
