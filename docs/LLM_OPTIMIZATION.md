# Otimização do Projeto para LLMs

## 🎯 Objetivo

Este documento descreve estratégias práticas para melhorar a manutenabilidade do código para LLMs (Large Language Models), facilitando a compreensão, análise e modificação do projeto por assistentes de IA.

## 📊 Análise da Situação Atual

### Pontos Fortes ✅

1. **Monorepo bem estruturado** com separação clara entre `apps/` e `packages/`
2. **TypeScript** com tipos bem definidos
3. **Separação de responsabilidades**: routes, services, middlewares
4. **Documentação existente** em `docs/`

### Pontos de Melhoria ⚠️

1. **Arquivos grandes** (algumas rotas têm 500+ linhas)
2. **Falta de documentação inline** em funções complexas
3. **Contexto misturado** (múltiplas responsabilidades em um arquivo)
4. **Falta de exemplos** de uso em documentação
5. **Nomes de variáveis** nem sempre descritivos
6. **Falta de JSDoc** em funções públicas

## 🎯 Estratégias de Otimização

### 1. Modularização Inteligente

#### Problema Atual
```typescript
// apps/api/src/routes/projects.ts (500+ linhas)
// Contém: CRUD completo, validações, lógica de negócio, integrações
```

#### Solução: Dividir por Responsabilidade

```
apps/api/src/routes/projects/
├── index.ts              # Exporta todas as rotas
├── create.ts             # POST /projects
├── read.ts               # GET /projects/:id
├── update.ts             # PUT /projects/:id
├── delete.ts             # DELETE /projects/:id
├── list.ts               # GET /projects
└── types.ts              # Tipos específicos desta rota
```

**Benefícios para LLMs**:
- ✅ Contexto menor por arquivo
- ✅ Responsabilidade única e clara
- ✅ Mais fácil de encontrar código específico
- ✅ Menos tokens para processar

### 2. Documentação Inline com JSDoc

#### Antes
```typescript
async function createProject(data: ProjectData) {
  // valida dados
  // cria projeto
  // retorna projeto
}
```

#### Depois
```typescript
/**
 * Cria um novo projeto no sistema.
 * 
 * @param data - Dados do projeto a ser criado
 * @param data.name - Nome do projeto (obrigatório, 3-50 caracteres)
 * @param data.type - Tipo do projeto (WEB, API, DATABASE, etc.)
 * @param data.description - Descrição opcional do projeto
 * 
 * @returns Projeto criado com ID e timestamps
 * 
 * @throws {ValidationError} Se os dados forem inválidos
 * @throws {ConflictError} Se já existir projeto com mesmo nome
 * 
 * @example
 * ```typescript
 * const project = await createProject({
 *   name: 'My App',
 *   type: 'WEB',
 *   description: 'Minha aplicação web'
 * });
 * ```
 */
async function createProject(data: ProjectData): Promise<Project> {
  // Implementação...
}
```

**Benefícios para LLMs**:
- ✅ Compreensão imediata da função
- ✅ Exemplos de uso claros
- ✅ Tipos e validações documentados
- ✅ Menos necessidade de ler código

### 3. Arquivos de Contexto por Domínio

Criar arquivos `CONTEXT.md` em cada domínio:

```
apps/api/src/routes/projects/
├── CONTEXT.md            # Documentação completa do domínio
├── index.ts
└── ...
```

**Conteúdo do CONTEXT.md**:
```markdown
# Projects Domain

## Visão Geral
Gerencia projetos (aplicações containerizadas) no sistema.

## Entidades Principais
- **Project**: Agrupador lógico de containers
- **Service**: Container Docker dentro de um projeto
- **Deployment**: Histórico de deploys

## Fluxos Principais
1. Criar projeto → Criar containers → Deploy
2. Atualizar projeto → Atualizar containers
3. Deletar projeto → Deletar containers relacionados

## Dependências
- Docker Service (cria containers)
- Traefik Service (configura roteamento)
- Database (Prisma)

## Regras de Negócio
- Projeto deve ter nome único por usuário
- Deletar projeto deleta todos os containers
- Projeto pode ter múltiplos serviços
```

### 4. Tipos e Interfaces Bem Definidos

#### Antes
```typescript
function processData(data: any) {
  // ...
}
```

#### Depois
```typescript
/**
 * Dados necessários para processar um projeto
 */
interface ProjectProcessData {
  /** ID do projeto a ser processado */
  projectId: string;
  /** Ação a ser executada */
  action: 'deploy' | 'restart' | 'stop';
  /** Opções adicionais */
  options?: {
    /** Forçar rebuild mesmo sem mudanças */
    forceRebuild?: boolean;
    /** Variáveis de ambiente adicionais */
    envVars?: Record<string, string>;
  };
}

function processData(data: ProjectProcessData) {
  // ...
}
```

**Benefícios para LLMs**:
- ✅ Tipos claros facilitam compreensão
- ✅ Documentação inline com tipos
- ✅ Menos erros de inferência

### 5. Separação de Concerns

#### Estrutura Atual (Melhorada)

```
apps/api/src/
├── routes/              # Apenas roteamento HTTP
│   └── projects/
│       ├── index.ts     # Registra rotas
│       ├── create.ts    # Handler de criação
│       └── ...
├── services/            # Lógica de negócio pura
│   └── project.service.ts
├── repositories/        # Acesso a dados (NOVO)
│   └── project.repository.ts
├── validators/          # Validações (NOVO)
│   └── project.validator.ts
└── types/              # Tipos compartilhados
    └── project.types.ts
```

**Benefícios**:
- ✅ Cada camada tem responsabilidade única
- ✅ Fácil de testar isoladamente
- ✅ LLMs entendem melhor o propósito de cada arquivo

### 6. Comentários Estratégicos

#### Adicionar Comentários em Pontos Críticos

```typescript
/**
 * CRÍTICO: Esta função deleta TODOS os containers relacionados ao projeto.
 * Não há rollback automático. Use com cuidado.
 * 
 * Fluxo:
 * 1. Valida permissões do usuário
 * 2. Para todos os containers ativos
 * 3. Remove containers do Docker
 * 4. Remove configurações do Traefik
 * 5. Deleta registros do banco de dados
 */
async function deleteProject(projectId: string): Promise<void> {
  // Implementação...
}
```

### 7. Arquivos de Exemplo

Criar arquivos `examples/` com casos de uso:

```
apps/api/src/routes/projects/
├── examples/
│   ├── create-project.example.ts
│   ├── deploy-project.example.ts
│   └── delete-project.example.ts
```

**Conteúdo**:
```typescript
/**
 * Exemplo: Criar projeto e fazer deploy
 * 
 * Este exemplo mostra o fluxo completo de criação de projeto
 * e deploy inicial.
 */
import { createProject } from '../services/project.service';
import { createContainer } from '../services/docker.service';

async function exemploCriarEDeploy() {
  // 1. Criar projeto
  const project = await createProject({
    name: 'minha-app',
    type: 'WEB',
    description: 'Aplicação web exemplo'
  });

  // 2. Criar container
  const container = await createContainer({
    projectId: project.id,
    image: 'node:18',
    // ...
  });

  // 3. Deploy
  await deployContainer(container.id);
}
```

### 8. Nomes Descritivos e Consistentes

#### Antes
```typescript
function proc(d: any) { }
const x = getData();
```

#### Depois
```typescript
function processProjectDeployment(projectData: ProjectData) { }
const projectMetrics = getProjectMetrics();
```

### 9. Arquivos de Configuração Documentados

Criar `CONFIG.md` explicando configurações:

```markdown
# Configuração do Projeto

## Variáveis de Ambiente

### DATABASE_URL
- **Tipo**: String (PostgreSQL connection string)
- **Exemplo**: `postgresql://user:pass@localhost:5432/openpanel`
- **Obrigatório**: Sim
- **Uso**: Conexão com banco de dados principal

### JWT_SECRET
- **Tipo**: String (mínimo 32 caracteres)
- **Como gerar**: `openssl rand -hex 64`
- **Obrigatório**: Sim
- **Uso**: Assinatura de tokens JWT
```

### 10. Testes como Documentação

Testes bem escritos servem como documentação:

```typescript
describe('createProject', () => {
  it('deve criar projeto com dados válidos', async () => {
    // Arrange
    const projectData = {
      name: 'test-project',
      type: 'WEB' as const,
      description: 'Projeto de teste'
    };

    // Act
    const project = await createProject(projectData);

    // Assert
    expect(project).toMatchObject({
      name: 'test-project',
      type: 'WEB',
      status: 'ACTIVE'
    });
  });

  it('deve rejeitar projeto com nome duplicado', async () => {
    // Arrange
    await createProject({ name: 'duplicado', type: 'WEB' });

    // Act & Assert
    await expect(
      createProject({ name: 'duplicado', type: 'WEB' })
    ).rejects.toThrow('Project name already exists');
  });
});
```

## 📁 Estrutura Recomendada por Módulo

### Template Padrão

```
apps/api/src/routes/{domain}/
├── README.md              # Visão geral do módulo
├── CONTEXT.md             # Contexto completo para LLMs
├── index.ts               # Exporta rotas
├── create.ts              # Handler de criação
├── read.ts                # Handler de leitura
├── update.ts              # Handler de atualização
├── delete.ts              # Handler de exclusão
├── list.ts                # Handler de listagem
├── types.ts               # Tipos específicos
├── validators.ts           # Validações Zod
└── examples/              # Exemplos de uso
    ├── basic-usage.example.ts
    └── advanced-usage.example.ts
```

## 🔧 Implementação Prática

### Fase 1: Refatorar Rotas Grandes (Prioridade Alta)

**Arquivos candidatos**:
- `apps/api/src/routes/projects.ts` (provavelmente grande)
- `apps/api/src/routes/containers.ts`
- `apps/api/src/routes/builds.ts`

**Ação**:
1. Dividir em arquivos menores por operação
2. Adicionar JSDoc em todas as funções
3. Criar arquivo `CONTEXT.md`

### Fase 2: Adicionar Documentação Inline

**Ação**:
1. Adicionar JSDoc em todas as funções públicas
2. Documentar tipos complexos
3. Adicionar exemplos de uso

### Fase 3: Criar Arquivos de Contexto

**Ação**:
1. Criar `CONTEXT.md` em cada domínio principal
2. Documentar fluxos principais
3. Documentar dependências

### Fase 4: Melhorar Tipos

**Ação**:
1. Substituir `any` por tipos específicos
2. Adicionar comentários em interfaces
3. Criar tipos compartilhados em `packages/shared`

## 📝 Checklist de Otimização

Para cada módulo/arquivo:

- [ ] Arquivo tem menos de 300 linhas?
- [ ] Funções têm JSDoc completo?
- [ ] Tipos estão bem definidos (sem `any`)?
- [ ] Nomes são descritivos?
- [ ] Há exemplos de uso?
- [ ] Há arquivo `CONTEXT.md`?
- [ ] Comentários explicam "por quê", não "o quê"?
- [ ] Testes servem como documentação?

## 🎯 Benefícios Esperados

### Para LLMs

1. **Contexto Menor**: Arquivos menores = menos tokens = análise mais rápida
2. **Compreensão Rápida**: JSDoc fornece contexto imediato
3. **Menos Erros**: Tipos bem definidos reduzem inferências incorretas
4. **Exemplos Claros**: Exemplos mostram uso correto

### Para Desenvolvedores

1. **Onboarding Mais Rápido**: Documentação clara facilita aprendizado
2. **Manutenção Mais Fácil**: Código organizado é mais fácil de modificar
3. **Menos Bugs**: Tipos e validações reduzem erros
4. **Colaboração Melhor**: Código auto-documentado facilita trabalho em equipe

## 📚 Exemplos Práticos

### Exemplo 1: Refatorar Rota Grande

**Antes** (`projects.ts` - 500 linhas):
```typescript
// Tudo em um arquivo: CRUD, validações, lógica de negócio
```

**Depois**:
```
projects/
├── index.ts          # 50 linhas - apenas registra rotas
├── create.ts         # 80 linhas - criação com JSDoc completo
├── read.ts           # 60 linhas - leitura
├── update.ts         # 90 linhas - atualização
├── delete.ts         # 70 linhas - exclusão
├── list.ts           # 100 linhas - listagem com filtros
├── types.ts          # 50 linhas - tipos compartilhados
└── CONTEXT.md        # Documentação completa
```

### Exemplo 2: JSDoc Completo

```typescript
/**
 * Cria um novo projeto no sistema.
 * 
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod
 * 2. Verifica se nome já existe (case-insensitive)
 * 3. Cria registro no banco de dados
 * 4. Inicializa configurações padrão
 * 5. Retorna projeto criado
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado
 * - Role: MEMBER ou superior
 * 
 * **Eventos Emitidos**:
 * - `project.created` (via event bus)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @param body - Dados do projeto a ser criado
 * @returns Projeto criado com ID e timestamps
 * 
 * @throws {HTTPException} 400 - Dados inválidos
 * @throws {HTTPException} 409 - Nome já existe
 * @throws {HTTPException} 500 - Erro interno
 * 
 * @example
 * ```typescript
 * // Criar projeto básico
 * const project = await createProject(c, {
 *   name: 'my-app',
 *   type: 'WEB',
 *   description: 'Minha aplicação'
 * });
 * 
 * // Criar projeto com configurações avançadas
 * const project = await createProject(c, {
 *   name: 'api-service',
 *   type: 'API',
 *   description: 'API REST',
 *   settings: {
 *     autoDeploy: true,
 *     healthCheck: '/health'
 *   }
 * });
 * ```
 */
export async function createProject(
  c: Context,
  body: CreateProjectBody
): Promise<Project> {
  // Implementação...
}
```

## 🚀 Plano de Ação Imediato

### Semana 1: Preparação
1. ✅ Criar este documento
2. ✅ Identificar arquivos grandes (>300 linhas)
3. ✅ Criar template de estrutura modular

### Semana 2: Refatoração Crítica
1. Refatorar `projects.ts` (mais usado)
2. Adicionar JSDoc em funções principais
3. Criar `CONTEXT.md` para projects

### Semana 3: Expansão
1. Refatorar `containers.ts`
2. Refatorar `builds.ts`
3. Adicionar exemplos de uso

### Semana 4: Consolidação
1. Revisar documentação
2. Adicionar testes como documentação
3. Atualizar guias de desenvolvimento

## 💡 Dicas Finais

1. **Comece Pequeno**: Refatore um módulo por vez
2. **Mantenha Consistência**: Use o mesmo padrão em todos os módulos
3. **Documente Enquanto Codifica**: Não deixe para depois
4. **Use Ferramentas**: ESLint com regras de JSDoc
5. **Revise Regularmente**: Documentação desatualizada é pior que nenhuma

## 🔗 Referências

- [JSDoc Guidelines](https://jsdoc.app/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
- [Documentation-Driven Development](https://www.writethedocs.org/guide/writing/doc-driven-development/)

