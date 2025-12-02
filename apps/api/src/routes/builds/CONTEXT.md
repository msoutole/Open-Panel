# Builds Module - Context for LLMs

## Visão Geral

Este módulo gerencia builds e deployments de projetos no sistema OpenPanel.
Deployments são processos de construção e implantação de aplicações usando diferentes buildpacks (Dockerfile, Nixpacks, Paketo).

## Entidades Principais

### Deployment
- **ID**: CUID único gerado pelo Prisma
- **Project**: Projeto relacionado
- **Version**: Versão do deployment
- **Status**: DeploymentStatus (PENDING, BUILDING, DEPLOYING, SUCCESS, FAILED)
- **Source**: Fonte do build (dockerfile, nixpacks, paketo, heroku, image)
- **Git Info**: Commit hash, branch, mensagem
- **Build Logs**: Logs do processo de build

### Relacionamentos
- Deployment → Project (N:1) - Deployment pertence a um projeto
- Deployment → Container (1:N) - Deployment pode criar múltiplos containers

## Fluxos Principais

### 1. Criar Build/Deployment

```
POST /api/builds
  ↓
Validar dados (Zod schema)
  ↓
Verificar acesso ao projeto
  ↓
Se Git URL fornecido: clonar repositório
  ↓
Criar deployment usando BuildService
  ↓
Retornar deployment criado (201)
```

**Regras de Negócio**:
- Context ou Git URL é obrigatório
- Usuário deve ser owner do projeto
- Se Git URL fornecido, repositório é clonado automaticamente

### 2. Listar Deployments

```
GET /api/builds/project/:projectId
  ↓
Verificar acesso ao projeto
  ↓
Buscar deployments ordenados por data (desc)
  ↓
Retornar lista com limite configurável
```

**Query Params**:
- `limit`: Número máximo de resultados (padrão: 50)

### 3. Ler Deployment

```
GET /api/builds/:id
  ↓
Buscar deployment no banco
  ↓
Verificar acesso ao projeto
  ↓
Retornar deployment com informações do projeto
```

### 4. Detectar Tipo de Projeto

```
POST /api/builds/detect
  ↓
Validar contexto fornecido
  ↓
Detectar tipo usando BuildService
  ↓
Retornar tipo e buildpack recomendado
```

## Dependências

### Serviços Utilizados
- **BuildService** (`services/build.ts`): Lógica de build e deployment
- **GitService** (`services/git.ts`): Clonagem de repositórios Git
- **DockerService** (`services/docker.ts`): Criação de containers
- **Prisma**: Acesso a dados (banco de dados)

### Middlewares Aplicados
- **authMiddleware**: Valida token JWT e autentica usuário
- **zValidator**: Valida dados de entrada usando schemas Zod

## Regras de Negócio

1. **Acesso**: Apenas owner do projeto pode criar/listar deployments
2. **Context**: Context ou Git URL é obrigatório para criar build
3. **Git Clone**: Se Git URL fornecido sem context, repositório é clonado automaticamente
4. **Buildpacks**: Sistema suporta Dockerfile, Nixpacks e Paketo

## Endpoints

### POST /api/builds
Cria um novo build/deployment.

**Body**:
```json
{
  "projectId": "clx123...",
  "source": "dockerfile",
  "context": "/path/to/project",
  "gitUrl": "https://github.com/user/repo",
  "gitBranch": "main"
}
```

**Response** (201):
```json
{
  "message": "Build started",
  "deployment": {
    "id": "...",
    "status": "BUILDING",
    ...
  }
}
```

### GET /api/builds/:id
Obtém detalhes de um deployment.

### GET /api/builds/project/:projectId
Lista deployments de um projeto.

**Query Params**: `limit` (opcional, padrão: 50)

### POST /api/builds/detect
Detecta tipo de projeto automaticamente.

**Body**:
```json
{
  "context": "/path/to/project"
}
```

**Response**:
```json
{
  "type": "nodejs",
  "buildpack": "nixpacks",
  "recommendations": {
    "dockerfile": false,
    "nixpacks": true,
    "paketo": false
  }
}
```

## Estrutura de Arquivos

```
routes/builds/
├── CONTEXT.md              # Este arquivo
├── index.ts                # Registra todas as rotas
├── validators.ts           # Schemas Zod de validação
└── handlers/
    ├── create.ts          # POST /builds
    ├── read.ts            # GET /builds/:id
    ├── list.ts            # GET /builds/project/:projectId
    └── detect.ts          # POST /builds/detect
```

## Serviços Relacionados

- **BuildService** (`services/build.ts`): Contém lógica de build
  - `createDeployment()`: Cria novo deployment
  - `detectProjectType()`: Detecta tipo de projeto

- **GitService** (`services/git.ts`): Gerencia repositórios Git
  - `clone()`: Clona repositório Git

## Notas de Implementação

- Handlers usam `BuildService` e `GitService` para lógica de negócio
- Validações são feitas usando schemas Zod em `validators.ts`
- Erros são tratados de forma consistente usando `HTTPException`
- Handlers são pequenos e focados apenas em roteamento HTTP
- Lógica de negócio está separada em services

## Funcionalidades Futuras

- Rollback para deployment anterior
- Webhooks do GitHub, GitLab e Bitbucket
- Cancelamento de builds em andamento
- Logs em tempo real de builds

