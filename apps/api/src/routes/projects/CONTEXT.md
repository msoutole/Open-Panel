# Projects Module - Context for LLMs

## Visão Geral

Este módulo gerencia projetos (aplicações containerizadas) no sistema OpenPanel.
Um projeto é um agrupador lógico que contém múltiplos containers (serviços), domínios, variáveis de ambiente e deployments.

## Entidades Principais

### Project
- **ID**: CUID único gerado pelo Prisma
- **Nome**: Nome descritivo do projeto (obrigatório)
- **Slug**: Identificador único URL-friendly (obrigatório, único no sistema)
- **Tipo**: ProjectType (WEB, API, DATABASE, WORKER, CRON, etc.)
- **Status**: ProjectStatus (ACTIVE, PAUSED, ERROR, DEPLOYING, STOPPED)
- **Owner**: Usuário que criou o projeto
- **Team**: Team opcional que possui o projeto (para colaboração)

### Relacionamentos
- Project → Containers (1:N) - Um projeto pode ter múltiplos containers
- Project → Domains (1:N) - Um projeto pode ter múltiplos domínios
- Project → EnvVars (1:N) - Um projeto tem múltiplas variáveis de ambiente
- Project → Deployments (1:N) - Um projeto tem histórico de deployments
- Project → User (N:1) - Projeto pertence a um usuário (owner)
- Project → Team (N:1) - Projeto pode pertencer a um team (opcional)

## Fluxos Principais

### 1. Criar Projeto

```
POST /api/projects
  ↓
Validar dados (Zod schema)
  ↓
Verificar slug único
  ↓
Se teamId fornecido: verificar permissões (OWNER/ADMIN)
  ↓
Criar registro no banco
  ↓
Retornar projeto criado (201)
```

**Regras de Negócio**:
- Slug deve ser único no sistema
- Se teamId fornecido, usuário deve ser OWNER ou ADMIN do team
- Projeto é criado com status ACTIVE por padrão

### 2. Listar Projetos

```
GET /api/projects
  ↓
Buscar projetos onde:
  - Usuário é owner, OU
  - Usuário é membro do team que possui o projeto
  ↓
Incluir contadores de recursos relacionados
  ↓
Retornar lista ordenada por data de criação (desc)
```

### 3. Ler Projeto

```
GET /api/projects/:projectId
  ↓
Buscar projeto com recursos relacionados
  ↓
Verificar acesso do usuário
  ↓
Retornar projeto completo com:
  - Variáveis de ambiente
  - Domínios
  - Deployments recentes (últimos 10)
  - Contadores
```

### 4. Atualizar Projeto

```
PUT /api/projects/:projectId
  ↓
Validar dados (Zod schema)
  ↓
Verificar se projeto existe
  ↓
Verificar se usuário é owner
  ↓
Se slug mudou: verificar unicidade
  ↓
Atualizar projeto
  ↓
Retornar projeto atualizado
```

**Regras de Negócio**:
- Apenas o owner pode atualizar
- Se slug mudou, novo slug deve ser único

### 5. Deletar Projeto

```
DELETE /api/projects/:projectId
  ↓
Verificar se projeto existe
  ↓
Verificar se usuário é owner
  ↓
Deletar projeto (cascade delete remove recursos relacionados)
  ↓
Retornar sucesso (200)
```

**Efeitos Colaterais**:
- Deleta todas as variáveis de ambiente relacionadas
- Deleta todos os domínios relacionados
- Deleta todos os deployments relacionados
- Deleta todos os containers relacionados (se houver)

**ATENÇÃO**: Operação irreversível!

### 6. Gerenciar Variáveis de Ambiente

```
GET /api/projects/:projectId/env-vars
  → Lista todas as variáveis de ambiente

POST /api/projects/:projectId/env-vars
  → Cria nova variável de ambiente
  → Valida: chave única por projeto

PUT /api/projects/:projectId/env-vars/:envVarId
  → Atualiza variável existente

DELETE /api/projects/:projectId/env-vars/:envVarId
  → Deleta variável
```

## Dependências

### Serviços Utilizados
- **ProjectService** (`services/project.service.ts`): Lógica de negócio de projetos
- **Prisma**: Acesso a dados (banco de dados)

### Middlewares Aplicados
- **authMiddleware**: Valida token JWT e autentica usuário
- **zValidator**: Valida dados de entrada usando schemas Zod

## Regras de Negócio

1. **Unicidade de Slug**: Slug deve ser único no sistema inteiro
2. **Permissões de Criação**: Se teamId fornecido, usuário deve ser OWNER ou ADMIN do team
3. **Permissões de Atualização**: Apenas o owner pode atualizar um projeto
4. **Permissões de Exclusão**: Apenas o owner pode deletar um projeto
5. **Acesso a Projetos**: Usuário tem acesso se é owner OU membro do team que possui o projeto
6. **Cascade Delete**: Deletar projeto deleta todos os recursos relacionados automaticamente
7. **Variáveis de Ambiente**: Chave deve ser única por projeto

## Endpoints

### GET /api/projects
Lista todos os projetos acessíveis pelo usuário.

**Query Params**: Nenhum

**Response**:
```json
{
  "projects": [
    {
      "id": "clx123...",
      "name": "my-app",
      "slug": "my-app",
      "type": "WEB",
      "status": "ACTIVE",
      "_count": {
        "envVars": 5,
        "domains": 2,
        "deployments": 10
      }
    }
  ]
}
```

### POST /api/projects
Cria um novo projeto.

**Body**:
```json
{
  "name": "My App",
  "slug": "my-app",
  "type": "WEB",
  "description": "Minha aplicação web",
  "teamId": "optional-team-id"
}
```

**Response** (201):
```json
{
  "project": {
    "id": "clx123...",
    "name": "My App",
    "slug": "my-app",
    "type": "WEB",
    "status": "ACTIVE",
    "_count": {
      "envVars": 0,
      "domains": 0,
      "deployments": 0
    }
  }
}
```

### GET /api/projects/:projectId
Obtém detalhes completos de um projeto.

**Response**:
```json
{
  "project": {
    "id": "clx123...",
    "name": "my-app",
    "envVars": [...],
    "domains": [...],
    "deployments": [...],
    "_count": {...}
  }
}
```

### PUT /api/projects/:projectId
Atualiza um projeto existente.

**Body**: Campos opcionais a atualizar

### DELETE /api/projects/:projectId
Deleta um projeto (irreversível).

**Response** (200):
```json
{
  "message": "Project deleted successfully"
}
```

## Estrutura de Arquivos

```
routes/projects/
├── CONTEXT.md              # Este arquivo
├── index.ts                # Registra todas as rotas
├── types.ts                # Tipos TypeScript específicos
└── handlers/
    ├── list.ts            # GET /projects
    ├── create.ts          # POST /projects
    ├── read.ts            # GET /projects/:id
    ├── update.ts          # PUT /projects/:id
    ├── delete.ts          # DELETE /projects/:id
    └── env-vars.ts        # CRUD de variáveis de ambiente
```

## Serviços Relacionados

- **ProjectService** (`services/project.service.ts`): Contém toda a lógica de negócio
  - `listAccessibleProjects()`: Lista projetos acessíveis
  - `findById()`: Busca projeto com verificação de acesso
  - `create()`: Cria novo projeto
  - `update()`: Atualiza projeto existente
  - `delete()`: Deleta projeto
  - `hasAccess()`: Verifica acesso do usuário
  - `slugExists()`: Verifica unicidade de slug
  - `isTeamOwnerOrAdmin()`: Verifica permissões no team

## Exemplos de Uso

Ver `docs/REFACTORING_EXAMPLE.md` para exemplos completos de código e uso dos handlers.

## Notas de Implementação

- Todos os handlers usam `ProjectService` para lógica de negócio
- Validações são feitas usando schemas Zod do `@openpanel/shared`
- Erros são tratados de forma consistente usando `HTTPException`
- Handlers são pequenos e focados apenas em roteamento HTTP
- Lógica de negócio está separada em `ProjectService`

