# Containers Module - Context for LLMs

## Visão Geral

Este módulo gerencia containers Docker no sistema OpenPanel.
Containers são instâncias de imagens Docker em execução, gerenciadas através da API do Docker daemon.

## Entidades Principais

### Container
- **ID**: CUID único gerado pelo Prisma (banco de dados)
- **Docker ID**: ID único do container no Docker daemon
- **Nome**: Nome do container
- **Imagem**: Imagem Docker usada
- **Tag**: Tag da imagem (padrão: 'latest')
- **Status**: ContainerStatus (RUNNING, STOPPED, PAUSED, RESTARTING, etc.)
- **Project**: Projeto relacionado (opcional)

### Relacionamentos
- Container → Project (N:1) - Container pode pertencer a um projeto
- Container → Docker Daemon (1:1) - Cada container tem um ID no Docker

## Fluxos Principais

### 1. Listar Containers

```
GET /api/containers
  ↓
Buscar containers do banco de dados
  ↓
Incluir informações do projeto relacionado
  ↓
Retornar lista ordenada por data de criação
```

### 2. Criar Container

```
POST /api/containers
  ↓
Validar dados (Zod schema)
  ↓
Criar container no Docker usando DockerService
  ↓
Container é sincronizado automaticamente no banco
  ↓
Retornar container criado (201)
```

### 3. Sincronizar Containers

```
GET /api/containers/sync
  ↓
Listar containers do Docker daemon
  ↓
Comparar com banco de dados
  ↓
Criar/atualizar registros no banco
  ↓
Retornar número de containers sincronizados
```

### 4. Ações em Containers

#### Iniciar Container
```
POST /api/containers/:id/start
  ↓
Buscar container no banco
  ↓
Iniciar container no Docker
  ↓
Atualizar status no banco
```

#### Parar Container
```
POST /api/containers/:id/stop
  ↓
Validar timeout (opcional)
  ↓
Parar container no Docker
  ↓
Atualizar status no banco
```

#### Reiniciar Container
```
POST /api/containers/:id/restart
  ↓
Validar timeout (opcional)
  ↓
Reiniciar container no Docker
  ↓
Atualizar status no banco
```

#### Pausar/Despausar Container
```
POST /api/containers/:id/pause
POST /api/containers/:id/unpause
  ↓
Pausar/despausar container no Docker
  ↓
Atualizar status no banco
```

### 5. Obter Logs

```
GET /api/containers/:id/logs
  ↓
Validar query parameters
  ↓
Buscar logs do container no Docker
  ↓
Retornar logs formatados
```

**Query Params**:
- `stdout`: Incluir stdout (padrão: true)
- `stderr`: Incluir stderr (padrão: true)
- `tail`: Número de linhas finais
- `since`: Timestamp de início (Unix)
- `until`: Timestamp de fim (Unix)
- `timestamps`: Incluir timestamps (padrão: true)

### 6. Obter Estatísticas

```
GET /api/containers/:id/stats
  ↓
Buscar estatísticas do container no Docker
  ↓
Retornar métricas (CPU, memória, rede, etc.)
```

### 7. Remover Container

```
DELETE /api/containers/:id?force=true
  ↓
Buscar container no banco
  ↓
Remover container do Docker
  ↓
Container é removido do banco automaticamente (via sync)
```

**Query Params**:
- `force`: Se 'true', força remoção mesmo se estiver rodando

## Dependências

### Serviços Utilizados
- **ContainerService** (`services/container.service.ts`): Lógica de negócio de containers
- **DockerService** (`services/docker.ts`): Integração com Docker daemon
- **Prisma**: Acesso a dados (banco de dados)

### Middlewares Aplicados
- **authMiddleware**: Valida token JWT e autentica usuário (exceto health check)
- **zValidator**: Valida dados de entrada usando schemas Zod

## Regras de Negócio

1. **Sincronização**: Containers são sincronizados entre Docker e banco de dados
2. **Status**: Status do container é atualizado automaticamente após ações
3. **Permissões**: Apenas usuários autenticados podem gerenciar containers
4. **Health Check**: Endpoint de health check não requer autenticação
5. **Remoção**: Remover container do Docker remove do banco automaticamente

## Endpoints

### GET /api/containers
Lista todos os containers do banco de dados.

**Response**:
```json
{
  "containers": [...],
  "total": 10
}
```

### GET /api/containers/sync
Sincroniza containers do Docker com o banco de dados.

**Response**:
```json
{
  "message": "Containers synced successfully",
  "synced": 5
}
```

### GET /api/containers/:id
Obtém detalhes completos de um container (banco + Docker).

**Response**:
```json
{
  "container": {
    "id": "...",
    "dockerId": "...",
    "name": "my-container",
    "docker": { ... }
  }
}
```

### POST /api/containers
Cria um novo container.

**Body**:
```json
{
  "name": "my-container",
  "image": "nginx",
  "tag": "latest",
  "ports": [{"host": 8080, "container": 80}],
  "env": {"KEY": "value"}
}
```

### POST /api/containers/:id/start
Inicia um container.

### POST /api/containers/:id/stop
Para um container.

**Body** (opcional):
```json
{
  "timeout": 10
}
```

### POST /api/containers/:id/restart
Reinicia um container.

### POST /api/containers/:id/pause
Pausa um container.

### POST /api/containers/:id/unpause
Despausa um container.

### DELETE /api/containers/:id
Remove um container.

**Query Params**: `force=true` (opcional)

### GET /api/containers/:id/logs
Obtém logs de um container.

**Query Params**: `stdout`, `stderr`, `tail`, `since`, `until`, `timestamps`

### GET /api/containers/:id/stats
Obtém estatísticas de um container.

### GET /api/containers/health/docker
Health check do Docker daemon (sem autenticação).

### GET /api/containers/info/docker
Informações do sistema Docker.

## Estrutura de Arquivos

```
routes/containers/
├── CONTEXT.md              # Este arquivo
├── index.ts                # Registra todas as rotas
├── validators.ts           # Schemas Zod de validação
└── handlers/
    ├── list.ts            # GET /containers
    ├── sync.ts            # GET /containers/sync
    ├── read.ts            # GET /containers/:id
    ├── create.ts          # POST /containers
    ├── actions.ts         # Ações (start, stop, restart, pause, unpause)
    ├── delete.ts          # DELETE /containers/:id
    ├── logs.ts            # GET /containers/:id/logs
    ├── stats.ts           # GET /containers/:id/stats
    ├── health.ts          # GET /containers/health/docker
    └── info.ts            # GET /containers/info/docker
```

## Serviços Relacionados

- **ContainerService** (`services/container.service.ts`): Contém toda a lógica de negócio
  - `listContainers()`: Lista containers do banco
  - `syncContainers()`: Sincroniza com Docker
  - `findById()`: Busca container com dados do Docker
  - `createContainer()`: Cria novo container
  - `startContainer()`: Inicia container
  - `stopContainer()`: Para container
  - `restartContainer()`: Reinicia container
  - `pauseContainer()`: Pausa container
  - `unpauseContainer()`: Despausa container
  - `removeContainer()`: Remove container
  - `getContainerLogs()`: Obtém logs
  - `getContainerStats()`: Obtém estatísticas
  - `checkDockerHealth()`: Verifica saúde do Docker
  - `getDockerInfo()`: Obtém informações do Docker

- **DockerService** (`services/docker.ts`): Integração direta com Docker daemon

## Notas de Implementação

- Todos os handlers usam `ContainerService` para lógica de negócio
- Validações são feitas usando schemas Zod em `validators.ts`
- Erros são tratados de forma consistente usando `HTTPException`
- Handlers são pequenos e focados apenas em roteamento HTTP
- Lógica de negócio está separada em `ContainerService`
- Integração com Docker é feita através de `DockerService`

