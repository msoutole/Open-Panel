# Templates de Aplicações

## Visão Geral

O OpenPanel suporta mais de 20 templates de aplicações pré-configurados, compatíveis com EasyPanel, permitindo deploy rápido de aplicações populares.

## Templates Disponíveis

### Node.js

#### Express.js
- **ID**: `nodejs-express`
- **Buildpack**: Nixpacks
- **Porta**: 3000
- **Descrição**: Framework web Express.js para Node.js

#### Next.js
- **ID**: `nodejs-nextjs`
- **Buildpack**: Nixpacks
- **Porta**: 3000
- **Descrição**: Framework React com server-side rendering

#### NestJS
- **ID**: `nodejs-nestjs`
- **Buildpack**: Nixpacks
- **Porta**: 3000
- **Dependências**: PostgreSQL
- **Descrição**: Framework progressivo para Node.js

### Python

#### Django
- **ID**: `python-django`
- **Buildpack**: Nixpacks
- **Porta**: 8000
- **Dependências**: PostgreSQL
- **Descrição**: Framework web de alto nível para Python

#### Flask
- **ID**: `python-flask`
- **Buildpack**: Nixpacks
- **Porta**: 5000
- **Descrição**: Framework web leve para Python

#### FastAPI
- **ID**: `python-fastapi`
- **Buildpack**: Nixpacks
- **Porta**: 8000
- **Descrição**: Framework moderno e rápido para APIs Python

### PHP

#### Laravel
- **ID**: `php-laravel`
- **Buildpack**: Nixpacks
- **Porta**: 8000
- **Dependências**: MySQL
- **Descrição**: Framework PHP com sintaxe elegante

#### WordPress
- **ID**: `php-wordpress`
- **Buildpack**: Nixpacks
- **Porta**: 80
- **Dependências**: MySQL
- **Descrição**: Sistema de gerenciamento de conteúdo popular

#### Drupal
- **ID**: `php-drupal`
- **Buildpack**: Nixpacks
- **Porta**: 80
- **Dependências**: MySQL
- **Descrição**: Framework de gerenciamento de conteúdo open-source

### Ruby

#### Ruby on Rails
- **ID**: `ruby-rails`
- **Buildpack**: Nixpacks
- **Porta**: 3000
- **Dependências**: PostgreSQL
- **Descrição**: Framework web escrito em Ruby

#### Sinatra
- **ID**: `ruby-sinatra`
- **Buildpack**: Nixpacks
- **Porta**: 4567
- **Descrição**: Framework web leve para Ruby

### Go

#### Gin
- **ID**: `go-gin`
- **Buildpack**: Nixpacks
- **Porta**: 8080
- **Descrição**: Framework HTTP web escrito em Go

#### Echo
- **ID**: `go-echo`
- **Buildpack**: Nixpacks
- **Porta**: 1323
- **Descrição**: Framework web de alta performance para Go

#### Fiber
- **ID**: `go-fiber`
- **Buildpack**: Nixpacks
- **Porta**: 3000
- **Descrição**: Framework inspirado no Express, construído sobre Fasthttp

### Java

#### Spring Boot
- **ID**: `java-springboot`
- **Buildpack**: Paketo
- **Porta**: 8080
- **Dependências**: PostgreSQL
- **Descrição**: Framework baseado em Java para microserviços

#### Quarkus
- **ID**: `java-quarkus`
- **Buildpack**: Paketo
- **Porta**: 8080
- **Descrição**: Framework Java nativo para Kubernetes

### Static Sites

#### React (Static)
- **ID**: `static-react`
- **Buildpack**: Dockerfile
- **Porta**: 80
- **Descrição**: Aplicação React estática

#### Vue.js (Static)
- **ID**: `static-vue`
- **Buildpack**: Dockerfile
- **Porta**: 80
- **Descrição**: Aplicação Vue.js estática

#### Angular (Static)
- **ID**: `static-angular`
- **Buildpack**: Dockerfile
- **Porta**: 80
- **Descrição**: Aplicação Angular estática

## Uso da API

### Listar Templates

```bash
GET /api/templates
```

**Query Parameters**:
- `category`: Filtrar por categoria (framework, cms, static, database)
- `language`: Filtrar por linguagem (nodejs, python, php, etc.)
- `search`: Buscar por nome ou descrição

**Resposta**:
```json
{
  "templates": [
    {
      "id": "nodejs-express",
      "name": "Node.js Express",
      "description": "Express.js web application framework",
      "category": "framework",
      "language": "nodejs",
      "buildpack": "nixpacks",
      "icon": "🟢",
      "tags": ["nodejs", "express", "javascript"],
      "minCpu": "500m",
      "minMemory": "256Mi",
      "ports": [{"container": 3000, "protocol": "HTTP"}]
    }
  ],
  "total": 20
}
```

### Obter Template Específico

```bash
GET /api/templates/:id
```

### Deploy de Template

```bash
POST /api/templates/:id/deploy
```

**Body**:
```json
{
  "projectName": "my-express-app",
  "gitUrl": "https://github.com/user/repo.git",
  "gitBranch": "main",
  "customEnv": {
    "NODE_ENV": "production"
  },
  "customPort": 3000,
  "cpuLimit": "1000m",
  "memoryLimit": "512Mi"
}
```

**Resposta**:
```json
{
  "message": "Project created successfully from template",
  "project": {
    "id": "proj_123",
    "name": "my-express-app",
    "slug": "my-express-app",
    "status": "STOPPED"
  },
  "template": {
    "id": "nodejs-express",
    "name": "Node.js Express",
    "buildpack": "nixpacks"
  },
  "port": 3000,
  "nextSteps": {
    "message": "Project created. Build will be triggered automatically on git push.",
    "buildUrl": "/api/builds?projectId=proj_123"
  }
}
```

## Compatibilidade com EasyPanel

Todos os templates são compatíveis com EasyPanel, permitindo migração fácil de projetos existentes.

## Adicionando Novos Templates

Para adicionar um novo template, edite `apps/api/src/services/application-templates.ts` e adicione uma entrada em `APPLICATION_TEMPLATES`.

**Estrutura de Template**:
```typescript
{
  id: 'unique-id',
  name: 'Template Name',
  description: 'Description',
  category: 'framework' | 'cms' | 'static' | 'database',
  language: 'nodejs',
  buildpack: 'nixpacks' | 'paketo' | 'dockerfile',
  envVars: { PORT: '3000' },
  ports: [{ container: 3000, protocol: 'HTTP' }],
  healthCheck: {
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
    interval: 30000,
    timeout: 10000,
    retries: 3
  }
}
```

