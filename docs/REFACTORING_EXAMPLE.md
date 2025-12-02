# Exemplo Prático de Refatoração para LLMs

Este documento mostra um exemplo concreto de como refatorar um arquivo grande para melhorar a manutenabilidade para LLMs.

## 📄 Arquivo Original: `routes/projects.ts`

### Problemas Identificados
- ❌ Arquivo com 441 linhas
- ❌ Múltiplas responsabilidades (CRUD completo)
- ❌ Falta de JSDoc detalhado
- ❌ Lógica de negócio misturada com roteamento
- ❌ Difícil para LLMs entenderem contexto completo

## 🔄 Refatoração Proposta

### Nova Estrutura

```
apps/api/src/routes/projects/
├── README.md              # Visão geral do módulo
├── CONTEXT.md             # Contexto completo para LLMs
├── index.ts               # Exporta e registra todas as rotas
├── handlers/
│   ├── list.ts           # GET /projects
│   ├── create.ts         # POST /projects
│   ├── read.ts           # GET /projects/:id
│   ├── update.ts         # PUT /projects/:id
│   ├── delete.ts         # DELETE /projects/:id
│   └── env-vars.ts       # Gerenciamento de variáveis de ambiente
├── types.ts              # Tipos específicos deste módulo
├── validators.ts         # Validações Zod
└── examples/
    └── usage.example.ts  # Exemplos de uso
```

## 📝 Exemplo: Handler de Criação

### Antes (Parte do arquivo grande)

```typescript
// routes/projects.ts (linhas 50-150)
projects.post('/', zValidator('json', createProjectSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  try {
    // Verificar se nome já existe
    const existing = await prisma.project.findFirst({
      where: {
        name: body.name,
        ownerId: user.userId
      }
    })

    if (existing) {
      throw new HTTPException(409, { message: 'Project name already exists' })
    }

    // Criar projeto
    const project = await prisma.project.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: body.description,
        type: body.type,
        ownerId: user.userId
      }
    })

    return c.json({ project }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to create project' })
  }
})
```

### Depois (Arquivo dedicado com documentação)

```typescript
/**
 * @fileoverview Handler para criação de projetos
 * 
 * Este módulo contém a lógica de criação de novos projetos no sistema.
 * Valida dados, verifica unicidade do nome e cria o registro no banco.
 * 
 * @module routes/projects/handlers/create
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../../../lib/prisma';
import { createProjectSchema } from '@openpanel/shared';
import type { Variables } from '../../../types';
import { ProjectService } from '../../../services/project.service';

/**
 * Cria um novo projeto no sistema.
 * 
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Verifica se nome já existe para o usuário (case-insensitive)
 * 3. Gera slug automaticamente se não fornecido
 * 4. Cria registro no banco de dados
 * 5. Inicializa configurações padrão
 * 6. Retorna projeto criado com status 201
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Role: MEMBER ou superior (validado pelo RBAC)
 * 
 * **Validações**:
 * - Nome: 3-50 caracteres, alfanumérico e hífens
 * - Slug: Gerado automaticamente se não fornecido
 * - Tipo: Deve ser um ProjectType válido
 * 
 * **Eventos Emitidos**:
 * - `project.created` (via event bus)
 * 
 * @param c - Context do Hono com usuário autenticado em `c.get('user')`
 * 
 * @returns Resposta JSON com projeto criado e status 201
 * 
 * @throws {HTTPException} 400 - Dados inválidos (validação Zod falhou)
 * @throws {HTTPException} 409 - Nome de projeto já existe para este usuário
 * @throws {HTTPException} 500 - Erro interno do servidor
 * 
 * @example
 * ```typescript
 * // Criar projeto básico
 * POST /api/projects
 * {
 *   "name": "my-app",
 *   "type": "WEB",
 *   "description": "Minha aplicação web"
 * }
 * 
 * // Resposta
 * {
 *   "project": {
 *     "id": "clx123...",
 *     "name": "my-app",
 *     "slug": "my-app",
 *     "type": "WEB",
 *     "status": "ACTIVE",
 *     "createdAt": "2024-01-01T00:00:00Z"
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Criar projeto com slug customizado
 * POST /api/projects
 * {
 *   "name": "My Awesome App",
 *   "slug": "awesome-app",
 *   "type": "API",
 *   "description": "API REST para minha aplicação"
 * }
 * ```
 * 
 * @see {@link ProjectService} Para lógica de negócio
 * @see {@link createProjectSchema} Para validação de dados
 */
export const createProjectHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  try {
    // Usar service para lógica de negócio
    const project = await ProjectService.create({
      ...body,
      ownerId: user.userId
    });

    return c.json({ project }, 201);
  } catch (error) {
    // Re-throw HTTPExceptions
    if (error instanceof HTTPException) {
      throw error;
    }

    // Log erro inesperado
    console.error('Failed to create project:', error);
    
    throw new HTTPException(500, {
      message: 'Failed to create project',
      cause: error
    });
  }
};

/**
 * Rota POST /projects com validação Zod
 * 
 * Esta é a rota registrada no router principal.
 * Aplica validação Zod antes de chamar o handler.
 */
export const createRoute = {
  method: 'POST' as const,
  path: '/',
  handler: zValidator('json', createProjectSchema, createProjectHandler)
};
```

## 📝 Exemplo: Service Layer

### Novo arquivo: `services/project.service.ts`

```typescript
/**
 * @fileoverview Service para lógica de negócio de projetos
 * 
 * Este módulo contém toda a lógica de negócio relacionada a projetos,
 * separada da camada de roteamento HTTP.
 * 
 * @module services/project.service
 */

import { prisma } from '../lib/prisma';
import { HTTPException } from 'hono/http-exception';
import type { Project, ProjectType } from '@prisma/client';

/**
 * Dados necessários para criar um projeto
 */
export interface CreateProjectData {
  /** Nome do projeto (3-50 caracteres, único por usuário) */
  name: string;
  /** Slug do projeto (opcional, gerado automaticamente se não fornecido) */
  slug?: string;
  /** Descrição do projeto (opcional) */
  description?: string;
  /** Tipo do projeto */
  type: ProjectType;
  /** ID do usuário proprietário */
  ownerId: string;
}

/**
 * Service para operações relacionadas a projetos
 */
export class ProjectService {
  /**
   * Cria um novo projeto no sistema.
   * 
   * **Regras de Negócio**:
   * - Nome deve ser único por usuário (case-insensitive)
   * - Slug é gerado automaticamente se não fornecido
   * - Projeto é criado com status ACTIVE por padrão
   * 
   * @param data - Dados do projeto a ser criado
   * @returns Projeto criado com ID e timestamps
   * 
   * @throws {HTTPException} 409 - Se nome já existe para este usuário
   * 
   * @example
   * ```typescript
   * const project = await ProjectService.create({
   *   name: 'my-app',
   *   type: 'WEB',
   *   ownerId: 'user-123'
   * });
   * ```
   */
  static async create(data: CreateProjectData): Promise<Project> {
    // Verificar unicidade do nome
    const existing = await prisma.project.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        ownerId: data.ownerId
      }
    });

    if (existing) {
      throw new HTTPException(409, {
        message: `Project name "${data.name}" already exists`
      });
    }

    // Gerar slug se não fornecido
    const slug = data.slug || 
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Criar projeto
    const project = await prisma.project.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        type: data.type,
        ownerId: data.ownerId,
        status: 'ACTIVE' // Status padrão
      }
    });

    // TODO: Emitir evento 'project.created' via event bus
    // eventBus.emit('project.created', { projectId: project.id });

    return project;
  }

  /**
   * Busca projeto por ID, verificando permissões.
   * 
   * @param projectId - ID do projeto
   * @param userId - ID do usuário solicitante
   * @returns Projeto se encontrado e acessível
   * 
   * @throws {HTTPException} 404 - Projeto não encontrado ou sem acesso
   */
  static async findById(
    projectId: string,
    userId: string
  ): Promise<Project> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            team: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new HTTPException(404, {
        message: 'Project not found or access denied'
      });
    }

    return project;
  }

  // ... outros métodos
}
```

## 📝 Exemplo: Arquivo Index Simplificado

### Novo arquivo: `routes/projects/index.ts`

```typescript
/**
 * @fileoverview Rotas de projetos
 * 
 * Este módulo registra todas as rotas relacionadas a projetos.
 * Cada handler está em seu próprio arquivo para melhor organização.
 * 
 * @module routes/projects
 */

import { Hono } from 'hono';
import type { Variables } from '../../types';
import { createRoute } from './handlers/create';
import { listRoute } from './handlers/list';
import { readRoute } from './handlers/read';
import { updateRoute } from './handlers/update';
import { deleteRoute } from './handlers/delete';
import { envVarsRoutes } from './handlers/env-vars';

const projects = new Hono<{ Variables: Variables }>();

// Registrar rotas
projects[createRoute.method](createRoute.path, createRoute.handler);
projects[listRoute.method](listRoute.path, listRoute.handler);
projects[readRoute.method](readRoute.path, readRoute.handler);
projects[updateRoute.method](updateRoute.path, updateRoute.handler);
projects[deleteRoute.method](deleteRoute.path, deleteRoute.handler);

// Rotas de variáveis de ambiente
projects.route('/:id/env-vars', envVarsRoutes);

export default projects;
```

## 📝 Exemplo: Arquivo CONTEXT.md

### Novo arquivo: `routes/projects/CONTEXT.md`

```markdown
# Projects Module - Context for LLMs

## Visão Geral

Este módulo gerencia projetos (aplicações containerizadas) no sistema OpenPanel.
Um projeto é um agrupador lógico que contém múltiplos containers (serviços).

## Entidades Principais

### Project
- **ID**: CUID único
- **Nome**: Único por usuário (case-insensitive)
- **Slug**: URL-friendly (gerado automaticamente)
- **Tipo**: WEB, API, DATABASE, WORKER, etc.
- **Status**: ACTIVE, PAUSED, ERROR, DEPLOYING, STOPPED
- **Owner**: Usuário ou Team que possui o projeto

### Relacionamentos
- Project → Containers (1:N)
- Project → Domains (1:N)
- Project → Deployments (1:N)
- Project → EnvVars (1:N)
- Project → Backups (1:N)

## Fluxos Principais

### 1. Criar Projeto
```
POST /api/projects
  ↓
Validar dados (Zod)
  ↓
Verificar nome único
  ↓
Gerar slug (se não fornecido)
  ↓
Criar registro no banco
  ↓
Inicializar configurações padrão
  ↓
Emitir evento 'project.created'
  ↓
Retornar projeto criado (201)
```

### 2. Deletar Projeto
```
DELETE /api/projects/:id
  ↓
Validar permissões (RBAC)
  ↓
Buscar projeto e containers relacionados
  ↓
Parar todos os containers ativos
  ↓
Remover containers do Docker
  ↓
Remover configurações do Traefik
  ↓
Deletar registros do banco (cascade)
  ↓
Emitir evento 'project.deleted'
  ↓
Retornar sucesso (200)
```

## Dependências

### Serviços Utilizados
- **DockerService**: Para criar/gerenciar containers
- **TraefikService**: Para configurar roteamento
- **Prisma**: Para acesso a dados

### Middlewares Aplicados
- **authMiddleware**: Valida token JWT
- **rbacMiddleware**: Valida permissões do usuário

## Regras de Negócio

1. **Unicidade de Nome**: Nome deve ser único por usuário (case-insensitive)
2. **Slug Automático**: Se não fornecido, slug é gerado do nome
3. **Cascade Delete**: Deletar projeto deleta todos os containers relacionados
4. **Permissões**: Apenas owner ou admin do team pode deletar
5. **Status Padrão**: Novos projetos são criados com status ACTIVE

## Endpoints

### GET /api/projects
Lista todos os projetos acessíveis pelo usuário.

**Query Params**:
- `type`: Filtrar por tipo (WEB, API, etc.)
- `status`: Filtrar por status (ACTIVE, PAUSED, etc.)
- `search`: Buscar por nome

**Response**:
```json
{
  "projects": [
    {
      "id": "clx123...",
      "name": "my-app",
      "type": "WEB",
      "status": "ACTIVE",
      "_count": {
        "containers": 2,
        "domains": 1
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
  "name": "my-app",
  "type": "WEB",
  "description": "Minha aplicação web"
}
```

**Response** (201):
```json
{
  "project": {
    "id": "clx123...",
    "name": "my-app",
    "slug": "my-app",
    "type": "WEB",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Exemplos de Uso

Ver `examples/usage.example.ts` para exemplos completos de código.

## Arquivos Relacionados

- `services/project.service.ts`: Lógica de negócio
- `services/docker.service.ts`: Integração com Docker
- `services/traefik.service.ts`: Configuração de roteamento
- `packages/shared/validators/project.ts`: Schemas Zod
```

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Linhas por arquivo** | 441 linhas | ~80 linhas por arquivo |
| **Responsabilidades** | Múltiplas (CRUD + validação + lógica) | Uma por arquivo |
| **JSDoc** | Mínimo | Completo em todas as funções |
| **Contexto para LLMs** | Grande (441 linhas) | Pequeno (~80 linhas) |
| **Facilidade de encontrar código** | Difícil | Fácil (arquivo específico) |
| **Testabilidade** | Difícil (tudo junto) | Fácil (isolado) |
| **Manutenabilidade** | Baixa | Alta |

## 🎯 Benefícios para LLMs

1. **Contexto Menor**: Cada arquivo tem ~80 linhas vs 441 linhas
2. **Responsabilidade Clara**: Cada arquivo tem um propósito único
3. **Documentação Completa**: JSDoc em todas as funções
4. **Exemplos Incluídos**: Exemplos mostram uso correto
5. **Tipos Bem Definidos**: Interfaces documentadas facilitam compreensão

## 🚀 Próximos Passos

1. Aplicar este padrão em `routes/containers.ts`
2. Aplicar este padrão em `routes/builds.ts`
3. Criar `CONTEXT.md` para cada módulo
4. Adicionar exemplos de uso
5. Revisar e melhorar JSDoc existente

