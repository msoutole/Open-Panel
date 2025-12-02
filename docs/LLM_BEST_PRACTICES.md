# Boas Práticas para Otimização de Código para LLMs

## 🎯 Princípios Fundamentais

### 1. **Contexto é Rei**
- ✅ Arquivos menores (<300 linhas)
- ✅ Responsabilidade única por arquivo
- ✅ Boundaries claros entre módulos

### 2. **Documentação é Essencial**
- ✅ JSDoc em todas as funções públicas
- ✅ Comentários explicam "por quê", não "o quê"
- ✅ Exemplos de uso quando necessário

### 3. **Tipos São Documentação**
- ✅ Evitar `any` sempre que possível
- ✅ Interfaces bem nomeadas e documentadas
- ✅ Tipos compartilhados em `packages/shared`

### 4. **Nomes Descritivos**
- ✅ Variáveis e funções com nomes claros
- ✅ Evitar abreviações desnecessárias
- ✅ Consistência na nomenclatura

## 📋 Checklist por Arquivo

### Antes de Criar/Modificar um Arquivo

- [ ] **Tamanho**: Arquivo terá menos de 300 linhas?
- [ ] **Responsabilidade**: Arquivo tem uma única responsabilidade?
- [ ] **Documentação**: Funções públicas têm JSDoc?
- [ ] **Tipos**: Todos os tipos estão definidos (sem `any`)?
- [ ] **Nomes**: Variáveis e funções têm nomes descritivos?
- [ ] **Exemplos**: Há exemplos de uso quando necessário?

### Estrutura de Arquivo Recomendada

```typescript
/**
 * Módulo: [Nome do Módulo]
 * 
 * Descrição breve do que este módulo faz.
 * 
 * @module [nome-do-modulo]
 */

// ============================================
// IMPORTS
// ============================================
import { ... } from '...'

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * [Descrição do tipo]
 */
interface ExampleType {
  /** [Descrição do campo] */
  field: string;
}

// ============================================
// CONSTANTS
// ============================================

const CONSTANT_NAME = 'value';

// ============================================
// FUNCTIONS
// ============================================

/**
 * [Descrição da função]
 * 
 * @param param - [Descrição do parâmetro]
 * @returns [Descrição do retorno]
 * 
 * @example
 * ```typescript
 * const result = exampleFunction('value');
 * ```
 */
export function exampleFunction(param: string): string {
  // Implementação
}

// ============================================
// EXPORTS
// ============================================
export { ... }
```

## 🔧 Padrões de Código

### Funções Bem Documentadas

#### ❌ Ruim
```typescript
function proc(d: any) {
  // faz algo
  return x;
}
```

#### ✅ Bom
```typescript
/**
 * Processa dados de projeto e retorna resultado formatado.
 * 
 * @param projectData - Dados do projeto a serem processados
 * @param projectData.name - Nome do projeto (obrigatório)
 * @param projectData.type - Tipo do projeto (WEB, API, etc.)
 * 
 * @returns Dados processados com ID e timestamps
 * 
 * @throws {ValidationError} Se dados forem inválidos
 * 
 * @example
 * ```typescript
 * const result = processProjectData({
 *   name: 'my-app',
 *   type: 'WEB'
 * });
 * ```
 */
function processProjectData(
  projectData: { name: string; type: ProjectType }
): ProcessedProject {
  // Implementação...
}
```

### Tipos Bem Definidos

#### ❌ Ruim
```typescript
function createProject(data: any) {
  // ...
}
```

#### ✅ Bom
```typescript
/**
 * Dados necessários para criar um projeto
 */
interface CreateProjectData {
  /** Nome do projeto (3-50 caracteres, único por usuário) */
  name: string;
  /** Tipo do projeto */
  type: ProjectType;
  /** Descrição opcional */
  description?: string;
  /** Configurações adicionais */
  settings?: ProjectSettings;
}

function createProject(data: CreateProjectData): Promise<Project> {
  // ...
}
```

### Comentários Estratégicos

#### ❌ Ruim
```typescript
// Incrementa contador
counter++;
```

#### ✅ Bom
```typescript
// CRÍTICO: Incrementar contador antes de processar para evitar
// race condition quando múltiplos workers processam simultaneamente
counter++;
```

### Separação de Concerns

#### ❌ Ruim (Tudo em um arquivo)
```typescript
// routes/projects.ts (500 linhas)
// - Validação
// - Lógica de negócio
// - Acesso a dados
// - Formatação de resposta
```

#### ✅ Bom (Separado por responsabilidade)
```
routes/projects/
├── index.ts          # Apenas registra rotas
├── create.ts         # Handler de criação
├── validators.ts     # Validações Zod
└── types.ts          # Tipos específicos

services/
└── project.service.ts # Lógica de negócio

repositories/
└── project.repository.ts # Acesso a dados
```

## 📚 Estrutura de Documentação

### Arquivo CONTEXT.md por Módulo

Criar `CONTEXT.md` em cada módulo principal:

```markdown
# Projects Module

## Visão Geral
Gerencia projetos (aplicações containerizadas) no sistema.

## Entidades Principais
- **Project**: Agrupador lógico de containers
- **Service**: Container Docker dentro de um projeto

## Fluxos Principais

### Criar Projeto
1. Validar dados de entrada
2. Verificar nome único
3. Criar registro no banco
4. Inicializar configurações padrão
5. Retornar projeto criado

### Deletar Projeto
1. Validar permissões
2. Parar todos os containers
3. Remover containers do Docker
4. Remover configurações do Traefik
5. Deletar registros do banco

## Dependências
- DockerService: Para criar/gerenciar containers
- TraefikService: Para configurar roteamento
- Prisma: Para acesso a dados

## Regras de Negócio
- Nome deve ser único por usuário
- Deletar projeto deleta todos os containers
- Projeto pode ter múltiplos serviços

## Endpoints

### POST /api/projects
Cria um novo projeto.

**Body**:
```json
{
  "name": "my-app",
  "type": "WEB",
  "description": "Minha aplicação"
}
```

**Response**:
```json
{
  "id": "clx...",
  "name": "my-app",
  "type": "WEB",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Exemplos de Uso

Ver `examples/` para exemplos completos.
```

## 🎨 Convenções de Nomenclatura

### Arquivos
- **Rotas**: `kebab-case.ts` (ex: `create-project.ts`)
- **Serviços**: `camelCase.service.ts` (ex: `project.service.ts`)
- **Tipos**: `camelCase.types.ts` (ex: `project.types.ts`)
- **Testes**: `camelCase.test.ts` (ex: `project.test.ts`)

### Funções
- **Verbos de ação**: `createProject`, `updateProject`, `deleteProject`
- **Getters**: `getProject`, `getProjects`
- **Checkers**: `isProjectActive`, `hasPermission`

### Variáveis
- **Camel case**: `projectName`, `userEmail`
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_PROJECT_NAME_LENGTH`)

### Tipos/Interfaces
- **Pascal case**: `Project`, `CreateProjectData`
- **Sufixos**: `Data` (input), `Response` (output), `Config` (configuração)

## 📝 Template de Função Completo

```typescript
/**
 * [Título descritivo da função]
 * 
 * [Descrição detalhada do que a função faz, incluindo contexto e propósito]
 * 
 * **Fluxo de Execução**:
 * 1. [Passo 1]
 * 2. [Passo 2]
 * 3. [Passo 3]
 * 
 * **Permissões Requeridas**:
 * - [Permissão 1]
 * - [Permissão 2]
 * 
 * **Eventos Emitidos**:
 * - `event.name` (via event bus)
 * 
 * @param param1 - [Descrição detalhada do parâmetro]
 * @param param1.field - [Descrição de campo específico]
 * @param param2 - [Descrição do segundo parâmetro]
 * 
 * @returns [Descrição detalhada do retorno]
 * 
 * @throws {ErrorType} [Código] - [Quando este erro ocorre]
 * @throws {ErrorType} [Código] - [Quando este erro ocorre]
 * 
 * @example
 * ```typescript
 * // Exemplo básico
 * const result = functionName({ field: 'value' });
 * 
 * // Exemplo avançado
 * const result = functionName({
 *   field: 'value',
 *   options: { advanced: true }
 * });
 * ```
 * 
 * @see [Link para documentação relacionada]
 * @since [Versão] - [Data]
 */
export async function functionName(
  param1: Param1Type,
  param2?: Param2Type
): Promise<ReturnType> {
  // Implementação...
}
```

## 🔍 Exemplo de Refatoração

### Antes (Arquivo Grande)

```typescript
// routes/projects.ts (441 linhas)
const projects = new Hono();

projects.get('/', async (c) => {
  // 50 linhas de código
});

projects.post('/', async (c) => {
  // 80 linhas de código
});

projects.put('/:id', async (c) => {
  // 100 linhas de código
});

projects.delete('/:id', async (c) => {
  // 90 linhas de código
});

// ... mais código
```

### Depois (Modularizado)

```
routes/projects/
├── README.md
├── CONTEXT.md
├── index.ts              # 30 linhas - apenas registra rotas
├── list.ts               # 60 linhas - GET /projects
├── create.ts             # 80 linhas - POST /projects
├── read.ts               # 50 linhas - GET /projects/:id
├── update.ts             # 90 linhas - PUT /projects/:id
├── delete.ts             # 70 linhas - DELETE /projects/:id
├── types.ts              # 40 linhas - tipos específicos
└── validators.ts         # 30 linhas - validações Zod
```

**Benefícios**:
- ✅ Cada arquivo < 100 linhas
- ✅ Responsabilidade única
- ✅ Fácil de encontrar código específico
- ✅ LLMs processam contexto menor

## 🚀 Implementação Gradual

### Prioridade 1: Arquivos Críticos
1. `routes/projects.ts` (mais usado)
2. `routes/containers.ts` (complexo)
3. `routes/builds.ts` (importante)

### Prioridade 2: Serviços
1. `services/docker.ts`
2. `services/build.ts`
3. `services/backup.ts`

### Prioridade 3: Documentação
1. Criar `CONTEXT.md` em cada módulo
2. Adicionar JSDoc em funções públicas
3. Criar exemplos de uso

## 📊 Métricas de Sucesso

### Antes da Otimização
- Arquivo médio: 300+ linhas
- Funções sem JSDoc: 70%
- Uso de `any`: 30%
- Documentação: Básica

### Depois da Otimização (Meta)
- Arquivo médio: <150 linhas
- Funções com JSDoc: 100%
- Uso de `any`: <5%
- Documentação: Completa com exemplos

## 💡 Dicas Finais

1. **Refatore Incrementalmente**: Um módulo por vez
2. **Documente Enquanto Codifica**: Não deixe para depois
3. **Use Ferramentas**: ESLint com regras de JSDoc
4. **Revise Regularmente**: Documentação desatualizada é pior que nenhuma
5. **Pense em LLMs**: Como um LLM entenderia este código sem contexto?

## 🔗 Ferramentas Úteis

- **ESLint**: `eslint-plugin-jsdoc` para validar JSDoc
- **TypeScript**: `strict: true` para tipos rigorosos
- **Prettier**: Formatação consistente
- **TSDoc**: Gerador de documentação a partir de JSDoc

