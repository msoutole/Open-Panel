<!-- 02cfe346-513d-4408-8900-4220a23d304b 2c573d46-a8d7-4ed4-ad5a-b616f4d1c8d0 -->
# Otimização de Manutenabilidade no Monorepo

## Objetivo

Refatorar os arquivos grandes de rotas em módulos menores, adicionar documentação JSDoc completa e criar arquivos CONTEXT.md para melhorar a manutenabilidade e facilitar o trabalho de LLMs.

## Estratégias de Otimização

### 1. Modularização

Dividir arquivos grandes (>300 linhas) em módulos menores com responsabilidade única:

- Cada handler em arquivo separado
- Separação clara entre rotas, handlers, services e tipos
- Arquivos menores facilitam compreensão por LLMs

### 2. Documentação Inline

JSDoc completo em todas as funções públicas:

- Descrição detalhada do que a função faz
- Parâmetros documentados com tipos e descrições
- Retornos documentados
- Exemplos de uso quando necessário
- Erros possíveis documentados

### 3. Tipos Bem Definidos

Eliminar uso de `any` e criar interfaces documentadas:

- Tipos específicos para cada domínio
- Interfaces bem nomeadas e documentadas
- Tipos compartilhados em `packages/shared`
- Comentários em campos de interfaces quando necessário

### 4. Arquivos de Contexto

Criar CONTEXT.md em cada módulo principal:

- Visão geral do domínio
- Entidades principais e relacionamentos
- Fluxos principais documentados
- Dependências (services, middlewares)
- Regras de negócio
- Endpoints documentados com exemplos

## Documentação de Referência

Os seguintes documentos foram criados como guia para esta refatoração:

- **`docs/LLM_OPTIMIZATION.md`** - Guia completo com estratégias práticas de otimização
- **`docs/LLM_BEST_PRACTICES.md`** - Padrões e convenções de código para LLMs
- **`docs/REFACTORING_EXAMPLE.md`** - Exemplo prático mostrando refatoração de `projects.ts`
- **`docs/LLM_OPTIMIZATION_SUMMARY.md`** - Resumo executivo e recomendações

Estes documentos devem ser consultados durante a implementação para garantir consistência e seguir as melhores práticas estabelecidas.

## Arquivos Identificados para Refatoração

### Prioridade Alta (Arquivos > 400 linhas)

1. `apps/api/src/routes/projects.ts` (440 linhas)
2. `apps/api/src/routes/containers.ts` (500 linhas)
3. `apps/api/src/routes/builds.ts` (466 linhas)

## Estrutura Proposta

### Para cada rota grande, criar estrutura modular:

```
apps/api/src/routes/{domain}/
├── CONTEXT.md              # Documentação completa do domínio
├── index.ts                # Exporta e registra todas as rotas (~30 linhas)
├── handlers/
│   ├── list.ts            # GET /{domain}
│   ├── create.ts          # POST /{domain}
│   ├── read.ts            # GET /{domain}/:id
│   ├── update.ts          # PUT /{domain}/:id
│   ├── delete.ts          # DELETE /{domain}/:id
│   └── [sub-resources].ts # Handlers de sub-recursos
├── types.ts               # Tipos específicos deste módulo
└── validators.ts          # Validações Zod (se necessário)
```

## Fase 1: Refatorar `projects.ts`

### 1.1 Criar estrutura de diretórios

- Criar `apps/api/src/routes/projects/`
- Criar subdiretório `handlers/`

### 1.2 Extrair handlers individuais

- `handlers/list.ts`: GET /projects (listar projetos)
- `handlers/create.ts`: POST /projects (criar projeto)
- `handlers/read.ts`: GET /projects/:projectId (ler projeto)
- `handlers/update.ts`: PUT /projects/:projectId (atualizar projeto)
- `handlers/delete.ts`: DELETE /projects/:projectId (deletar projeto)
- `handlers/env-vars.ts`: CRUD de variáveis de ambiente (GET, POST, PUT, DELETE)

### 1.3 Criar arquivo index.ts

- Registrar todas as rotas usando os handlers
- Manter compatibilidade com importação atual

### 1.4 Adicionar JSDoc completo

- Documentar todas as funções handlers
- Incluir descrição, parâmetros, retornos, exemplos, erros
- Documentar tipos em `types.ts`

### 1.5 Criar CONTEXT.md

- Visão geral do domínio Projects
- Entidades principais e relacionamentos
- Fluxos principais (criar, atualizar, deletar)
- Dependências (services, middlewares)
- Regras de negócio
- Endpoints documentados

### 1.6 Criar ProjectService (se necessário)

- Extrair lógica de negócio para `apps/api/src/services/project.service.ts`
- Handlers devem apenas chamar o service

## Fase 2: Refatorar `containers.ts`

### 2.1 Criar estrutura modular

- `apps/api/src/routes/containers/`
- Handlers: list, create, read, update, delete, logs, metrics, actions (start/stop/restart)

### 2.2 Adicionar JSDoc completo

- Documentar todos os handlers
- Documentar schemas de validação

### 2.3 Criar CONTEXT.md

- Documentar domínio de containers
- Integração com Docker
- Fluxos de lifecycle

## Fase 3: Refatorar `builds.ts`

### 3.1 Criar estrutura modular

- `apps/api/src/routes/builds/`
- Handlers: create, read, list, status, logs, cancel

### 3.2 Adicionar JSDoc completo

- Documentar processo de build
- Documentar integração com Git e Docker

### 3.3 Criar CONTEXT.md

- Documentar domínio de builds
- Fluxos de build (Dockerfile, Nixpacks, Paketo)
- Integração com Git

## Fase 4: Melhorar Services Existentes

### 4.1 Adicionar JSDoc em serviços principais

- `apps/api/src/services/docker.ts`
- `apps/api/src/services/build.ts`
- `apps/api/src/services/git.ts`
- `apps/api/src/services/backup.ts`
- `apps/api/src/services/traefik.ts`

### 4.2 Melhorar tipos

- Eliminar uso de `any` onde possível
- Criar interfaces documentadas

## Fase 5: Atualizar Imports

### 5.1 Atualizar `apps/api/src/index.ts`

- Manter compatibilidade com imports existentes
- Verificar que todas as rotas funcionam

### 5.2 Testar integração

- Verificar que não há quebras
- Testar endpoints principais

## Padrões de Código

### JSDoc Template para Handlers

````typescript
/**
 * [Título descritivo]
 * 
 * [Descrição detalhada do que o handler faz]
 * 
 * **Fluxo de Execução**:
 * 1. [Passo 1]
 * 2. [Passo 2]
 * 
 * **Permissões Requeridas**:
 * - [Permissão]
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON
 * 
 * @throws {HTTPException} 400 - [Quando ocorre]
 * @throws {HTTPException} 404 - [Quando ocorre]
 * 
 * @example
 * ```typescript
 * GET /api/projects
 * ```
 */
````

### Estrutura de Handler

```typescript
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '../../types';

export const listProjectsHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  // Implementação
};
```

## Arquivos a Modificar/Criar

### Novos Arquivos (Projects)

- `apps/api/src/routes/projects/CONTEXT.md`
- `apps/api/src/routes/projects/index.ts`
- `apps/api/src/routes/projects/handlers/list.ts`
- `apps/api/src/routes/projects/handlers/create.ts`
- `apps/api/src/routes/projects/handlers/read.ts`
- `apps/api/src/routes/projects/handlers/update.ts`
- `apps/api/src/routes/projects/handlers/delete.ts`
- `apps/api/src/routes/projects/handlers/env-vars.ts`
- `apps/api/src/routes/projects/types.ts`

### Novos Arquivos (Containers)

- `apps/api/src/routes/containers/CONTEXT.md`
- `apps/api/src/routes/containers/index.ts`
- `apps/api/src/routes/containers/handlers/*.ts` (múltiplos handlers)

### Novos Arquivos (Builds)

- `apps/api/src/routes/builds/CONTEXT.md`
- `apps/api/src/routes/builds/index.ts`
- `apps/api/src/routes/builds/handlers/*.ts` (múltiplos handlers)

### Arquivos a Modificar

- `apps/api/src/index.ts` (manter compatibilidade de imports)
- `apps/api/src/services/*.ts` (adicionar JSDoc)

### Arquivos a Remover (após migração)

- `apps/api/src/routes/projects.ts` (substituído por módulo)
- `apps/api/src/routes/containers.ts` (substituído por módulo)
- `apps/api/src/routes/builds.ts` (substituído por módulo)

## Critérios de Sucesso

1. Cada arquivo handler tem menos de 150 linhas
2. Todos os handlers têm JSDoc completo
3. Arquivo CONTEXT.md criado para cada módulo
4. Imports mantêm compatibilidade
5. Nenhuma funcionalidade quebrada
6. Tipos bem definidos (sem `any` desnecessário)

## Ordem de Implementação

1. **Fase 1**: Projects (mais usado, serve como template)
2. **Fase 2**: Containers (complexo, valida padrão)
3. **Fase 3**: Builds (completa refatoração)
4. **Fase 4**: Melhorar services (documentação)
5. **Fase 5**: Validar e testar tudo

### To-dos

- [ ] Melhorar visualização do dropdown de perfil no Header com melhor espaçamento, avatar e separadores visuais
- [ ] Melhorar visualização do dropdown de notificações com scroll suave e indicadores visuais aprimorados
- [ ] Implementar sidebar retrátil com estados expandido/retraído, animações e botão toggle
- [ ] Adicionar gerenciamento de estado da sidebar no App.tsx e ajustar layout do conteúdo principal
- [ ] Tornar Header, Sidebar e DashboardView totalmente responsivos para mobile, tablet e desktop
- [ ] Atualizar documentação em docs/ com as melhorias implementadas