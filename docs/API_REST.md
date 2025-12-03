# API REST - Documentação Completa

**Última atualização**: 2025-12-03  
**Versão da API**: 1.3.0  
**Base URL**: `http://localhost:3001` (desenvolvimento) ou `https://api.openpanel.local` (produção)

Esta documentação descreve todos os endpoints REST disponíveis no OpenPanel.

---

## Índice

- [Autenticação](#autenticação)
- [Usuários](#usuários)
- [Projetos](#projetos)
- [Containers](#containers)
- [Builds e Deployments](#builds-e-deployments)
- [Templates](#templates)
- [Databases](#databases)
- [Métricas](#métricas)
- [Health Checks](#health-checks)
- [Configurações](#configurações)
- [Webhooks](#webhooks)
- [SSL](#ssl)
- [Backups](#backups)
- [Audit](#audit)
- [Estatísticas](#estatísticas)

---

## Autenticação

A API usa autenticação JWT (JSON Web Tokens). A maioria dos endpoints requer um token de acesso no header `Authorization`.

### Formato do Header

```
Authorization: Bearer <access_token>
```

### Endpoints de Autenticação

#### Registrar Usuário

```http
POST /api/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Resposta (201):**
```json
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2025-12-03T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validações:**
- `name`: mínimo 2 caracteres
- `email`: formato de email válido
- `password`: mínimo 8 caracteres, deve conter pelo menos uma letra maiúscula, uma minúscula e um número

#### Login

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"  // Opcional, requerido se 2FA estiver habilitado
}
```

**Resposta (200):**
```json
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta quando 2FA é necessário (401):**
```json
{
  "error": "2FA code required",
  "requires2FA": true,
  "status": 401
}
```

#### Refresh Token

```http
POST /api/auth/refresh
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Configurar 2FA

```http
POST /api/auth/2fa/setup
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backupCodes": ["backup-code-1", "backup-code-2", ...]
}
```

#### Verificar 2FA

```http
POST /api/auth/2fa/verify
Authorization: Bearer <token>
```

**Body:**
```json
{
  "code": "123456"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

---

## Usuários

### Listar Usuários

```http
GET /api/users
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "users": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "user@example.com",
      "avatar": null,
      "status": "ACTIVE",
      "createdAt": "2025-12-03T10:00:00Z",
      "lastLoginAt": "2025-12-03T10:00:00Z"
    }
  ]
}
```

### Obter Usuário por ID

```http
GET /api/users/:userId
Authorization: Bearer <token>
```

### Atualizar Usuário

```http
PUT /api/users/:userId
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "John Updated",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Alterar Senha

```http
POST /api/users/:userId/change-password
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123"
}
```

---

## Projetos

### Listar Projetos

```http
GET /api/projects
Authorization: Bearer <token>
```

**Query Parameters:**
- `teamId` (opcional): Filtrar por time

**Resposta (200):**
```json
{
  "projects": [
    {
      "id": "project-123",
      "name": "My App",
      "slug": "my-app",
      "description": "My awesome application",
      "type": "WEB",
      "dockerImage": "nginx:latest",
      "dockerTag": "latest",
      "gitUrl": "https://github.com/user/repo",
      "gitBranch": "main",
      "replicas": 1,
      "cpuLimit": "1000m",
      "memoryLimit": "512Mi",
      "createdAt": "2025-12-03T10:00:00Z",
      "updatedAt": "2025-12-03T10:00:00Z"
    }
  ]
}
```

### Criar Projeto

```http
POST /api/projects
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "My App",
  "slug": "my-app",
  "description": "My awesome application",
  "type": "WEB",
  "dockerImage": "nginx:latest",
  "dockerTag": "latest",
  "gitUrl": "https://github.com/user/repo",
  "gitBranch": "main",
  "replicas": 1,
  "cpuLimit": "1000m",
  "memoryLimit": "512Mi",
  "teamId": "team-123"
}
```

**Tipos de Projeto:**
- `WEB`: Aplicação web
- `API`: API REST
- `WORKER`: Worker/processamento em background
- `CRON`: Tarefa agendada
- `DATABASE`: Banco de dados
- `REDIS`: Cache Redis
- `MONGODB`: Banco MongoDB

**Validações:**
- `slug`: apenas letras minúsculas, números e hífens (`^[a-z0-9-]+$`)
- `replicas`: entre 0 e 10

### Obter Projeto

```http
GET /api/projects/:projectId
Authorization: Bearer <token>
```

### Atualizar Projeto

```http
PUT /api/projects/:projectId
Authorization: Bearer <token>
```

**Body:** (todos os campos são opcionais)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "replicas": 2,
  "cpuLimit": "2000m",
  "memoryLimit": "1Gi"
}
```

### Deletar Projeto

```http
DELETE /api/projects/:projectId
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Variáveis de Ambiente

#### Listar Variáveis de Ambiente

```http
GET /api/projects/:projectId/env-vars
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "envVars": [
    {
      "id": "env-123",
      "key": "DATABASE_URL",
      "value": "postgresql://...",
      "isSecret": true,
      "createdAt": "2025-12-03T10:00:00Z"
    }
  ]
}
```

#### Criar Variável de Ambiente

```http
POST /api/projects/:projectId/env-vars
Authorization: Bearer <token>
```

**Body:**
```json
{
  "key": "DATABASE_URL",
  "value": "postgresql://user:pass@host:5432/db",
  "isSecret": true
}
```

**Validações:**
- `key`: deve começar com letra maiúscula ou underscore, apenas letras maiúsculas, números e underscores (`^[A-Z_][A-Z0-9_]*$`)

#### Atualizar Variável de Ambiente

```http
PUT /api/projects/:projectId/env-vars/:envVarId
Authorization: Bearer <token>
```

**Body:**
```json
{
  "value": "new-value",
  "isSecret": false
}
```

#### Deletar Variável de Ambiente

```http
DELETE /api/projects/:projectId/env-vars/:envVarId
Authorization: Bearer <token>
```

---

## Containers

### Listar Containers

```http
GET /api/containers
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` (opcional): Filtrar por projeto
- `status` (opcional): Filtrar por status (`RUNNING`, `STOPPED`, `RESTARTING`, `PAUSED`, `EXITED`)

**Resposta (200):**
```json
{
  "containers": [
    {
      "id": "container-123",
      "name": "my-app-container",
      "status": "RUNNING",
      "image": "nginx:latest",
      "createdAt": "2025-12-03T10:00:00Z",
      "projectId": "project-123"
    }
  ]
}
```

### Criar Container

```http
POST /api/containers
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectId": "project-123",
  "name": "my-container",
  "image": "nginx:latest",
  "tag": "latest",
  "ports": [{"host": 8080, "container": 80}],
  "env": {"KEY": "value"},
  "volumes": [{"host": "/data", "container": "/app/data"}]
}
```

### Obter Container

```http
GET /api/containers/:id
Authorization: Bearer <token>
```

### Deletar Container

```http
DELETE /api/containers/:id
Authorization: Bearer <token>
```

### Ações em Containers

#### Iniciar Container

```http
POST /api/containers/:id/start
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Container started successfully"
}
```

#### Parar Container

```http
POST /api/containers/:id/stop
Authorization: Bearer <token>
```

#### Reiniciar Container

```http
POST /api/containers/:id/restart
Authorization: Bearer <token>
```

#### Pausar Container

```http
POST /api/containers/:id/pause
Authorization: Bearer <token>
```

#### Despausar Container

```http
POST /api/containers/:id/unpause
Authorization: Bearer <token>
```

### Logs do Container

```http
GET /api/containers/:id/logs
Authorization: Bearer <token>
```

**Query Parameters:**
- `tail` (opcional): Número de linhas (padrão: 100)
- `follow` (opcional): Seguir logs em tempo real (padrão: false)
- `since` (opcional): Timestamp ISO para começar a partir de

**Resposta (200):**
```json
{
  "logs": [
    {
      "timestamp": "2025-12-03T10:00:00Z",
      "stream": "stdout",
      "data": "Application started"
    }
  ]
}
```

### Estatísticas do Container

```http
GET /api/containers/:id/stats
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "id": "container-123",
  "stats": {
    "cpu": {
      "usage": 45.2,
      "percent": 45.2
    },
    "memory": {
      "usage": 524288000,
      "limit": 1073741824,
      "percent": 48.8
    },
    "network": {
      "rx_bytes": 1024000,
      "tx_bytes": 2048000
    }
  },
  "timestamp": "2025-12-03T10:00:00Z"
}
```

### Sincronizar Containers

```http
GET /api/containers/sync
Authorization: Bearer <token>
```

Sincroniza containers do Docker com o banco de dados.

---

## Builds e Deployments

### Listar Deployments

```http
GET /api/builds/project/:projectId
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "deployments": [
    {
      "id": "deployment-123",
      "projectId": "project-123",
      "status": "SUCCESS",
      "image": "my-app:latest",
      "createdAt": "2025-12-03T10:00:00Z"
    }
  ]
}
```

### Criar Build/Deployment

```http
POST /api/builds
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectId": "project-123",
  "image": "my-app:latest",
  "tag": "v1.0.0",
  "strategy": "blue-green"
}
```

### Obter Deployment

```http
GET /api/builds/:id
Authorization: Bearer <token>
```

### Detectar Tipo de Projeto

```http
POST /api/builds/detect
Authorization: Bearer <token>
```

**Body:**
```json
{
  "gitUrl": "https://github.com/user/repo",
  "gitBranch": "main"
}
```

**Resposta (200):**
```json
{
  "type": "NODE",
  "buildpack": "nodejs",
  "detected": true
}
```

### Blue-Green Deployment

```http
POST /api/builds/blue-green
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectId": "project-123",
  "image": "my-app:v2.0.0",
  "healthCheck": {
    "path": "/health",
    "interval": 5000
  }
}
```

### Rollback

```http
POST /api/builds/rollback
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectId": "project-123"
}
```

---

## Templates

### Listar Templates

```http
GET /api/templates
Authorization: Bearer <token>
```

**Query Parameters:**
- `category` (opcional): Filtrar por categoria
- `language` (opcional): Filtrar por linguagem
- `search` (opcional): Buscar por nome ou descrição

**Resposta (200):**
```json
{
  "templates": [
    {
      "id": "template-123",
      "name": "Node.js Express",
      "description": "Express.js application template",
      "category": "WEB",
      "language": "javascript",
      "icon": "nodejs",
      "tags": ["node", "express", "api"]
    }
  ]
}
```

### Obter Template

```http
GET /api/templates/:id
Authorization: Bearer <token>
```

### Deploy Template

```http
POST /api/templates/:id/deploy
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectName": "My App",
  "projectSlug": "my-app",
  "environmentVariables": {
    "DATABASE_URL": "postgresql://..."
  }
}
```

**Resposta (201):**
```json
{
  "project": {
    "id": "project-123",
    "name": "My App",
    "slug": "my-app"
  },
  "deployment": {
    "id": "deployment-123",
    "status": "PENDING"
  }
}
```

---

## Databases

### Listar Templates de Banco

```http
GET /api/databases/templates
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "templates": [
    {
      "type": "postgresql",
      "name": "PostgreSQL",
      "description": "PostgreSQL database",
      "image": "postgres:15",
      "defaultPort": 5432
    }
  ],
  "total": 4
}
```

### Executar Query

```http
POST /api/databases/query
Authorization: Bearer <token>
```

**Body:**
```json
{
  "containerId": "container-123",
  "type": "postgresql",
  "query": "SELECT * FROM users LIMIT 10"
}
```

**Resposta (200):**
```json
{
  "results": [
    {"id": 1, "name": "John"},
    {"id": 2, "name": "Jane"}
  ],
  "columns": ["id", "name"],
  "rowCount": 2
}
```

---

## Métricas

### Métricas do Sistema

```http
GET /api/metrics/system
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "metrics": {
    "cpu": {
      "usage": 25.5,
      "cores": 4
    },
    "memory": {
      "total": 8589934592,
      "used": 4294967296,
      "free": 4294967296,
      "percent": 50.0
    },
    "disk": {
      "total": 107374182400,
      "used": 53687091200,
      "free": 53687091200,
      "percent": 50.0
    },
    "network": {
      "rx_bytes": 1048576000,
      "tx_bytes": 2097152000
    }
  }
}
```

### Métricas de Containers

```http
GET /api/metrics/containers
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "containers": [
    {
      "id": "container-123",
      "name": "my-app",
      "cpu": 45.2,
      "memory": 524288000
    }
  ]
}
```

---

## Health Checks

### Health Check Básico

```http
GET /health
```

**Resposta (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T10:00:00Z",
  "uptime": 3600
}
```

### Health Check Detalhado

```http
GET /health/detailed
```

**Resposta (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T10:00:00Z",
  "checks": {
    "api": true,
    "database": true,
    "redis": true
  }
}
```

### Health Check do Sistema

```http
GET /api/health/system
Authorization: Bearer <token>
```

### Health Check de Containers

```http
GET /api/health/containers
Authorization: Bearer <token>
```

---

## Configurações

### Obter Configurações

```http
GET /api/settings
Authorization: Bearer <token>
```

### Atualizar Configurações

```http
PUT /api/settings
Authorization: Bearer <token>
```

**Body:**
```json
{
  "dockerHost": "unix:///var/run/docker.sock",
  "traefikEnabled": true,
  "backupEnabled": true
}
```

---

## Webhooks

### Criar Webhook

```http
POST /api/webhooks
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectId": "project-123",
  "url": "https://example.com/webhook",
  "events": ["deployment.success", "deployment.failure"],
  "secret": "webhook-secret"
}
```

### Listar Webhooks

```http
GET /api/webhooks/project/:projectId
Authorization: Bearer <token>
```

### Deletar Webhook

```http
DELETE /api/webhooks/:id
Authorization: Bearer <token>
```

---

## SSL

### Obter Certificados SSL

```http
GET /api/ssl
Authorization: Bearer <token>
```

### Criar Certificado SSL

```http
POST /api/ssl
Authorization: Bearer <token>
```

**Body:**
```json
{
  "domain": "example.com",
  "email": "admin@example.com",
  "provider": "letsencrypt"
}
```

---

## Backups

### Listar Backups

```http
GET /api/backups
Authorization: Bearer <token>
```

### Criar Backup

```http
POST /api/backups
Authorization: Bearer <token>
```

**Body:**
```json
{
  "projectId": "project-123",
  "type": "full"
}
```

### Restaurar Backup

```http
POST /api/backups/:id/restore
Authorization: Bearer <token>
```

---

## Audit

### Listar Logs de Auditoria

```http
GET /api/audit
Authorization: Bearer <token>
```

**Query Parameters:**
- `userId` (opcional): Filtrar por usuário
- `action` (opcional): Filtrar por ação
- `resourceType` (opcional): Filtrar por tipo de recurso
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação

---

## Estatísticas

### Estatísticas Gerais

```http
GET /api/stats
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "projects": {
    "total": 10,
    "active": 8
  },
  "containers": {
    "total": 25,
    "running": 20
  },
  "users": {
    "total": 5
  }
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: usuário já existe) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro interno do servidor |
| 503 | Service Unavailable - Serviço indisponível |

---

## Rate Limiting

A API implementa rate limiting para proteger contra abuso:

- **Endpoints de autenticação**: 5 requisições por minuto por IP
- **Endpoints gerais**: 100 requisições por minuto por usuário autenticado

Quando o limite é excedido, você receberá:

```json
{
  "error": "Too many requests",
  "status": 429,
  "retryAfter": 60
}
```

---

## Exemplos de Uso

### cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Listar projetos
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer <token>"

# Criar projeto
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "slug": "my-app",
    "type": "WEB"
  }'
```

### JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3001'

// Login
const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const { accessToken } = await loginResponse.json()

// Listar projetos
const projectsResponse = await fetch(`${API_BASE}/api/projects`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

const { projects } = await projectsResponse.json()
```

---

## Swagger UI

A documentação interativa está disponível em:

```
http://localhost:3001/api/docs
```

---

## Referências

- [Documentação WebSocket](./API_WEBSOCKET.md)
- [Manual Técnico](./MANUAL_TECNICO.md)
- [OpenAPI Schema JSON](/api/openapi.json)

---

**Nota**: Esta documentação está sujeita a mudanças. Consulte sempre a versão mais recente da API.

