<!-- d7ed198b-6433-4029-b913-08c33d85e63d 028114ba-21ac-40d8-99e0-bc086dd117d4 -->
# Plano de Execução - Correções e Melhorias OpenPanel

Este plano executa as correções urgentes e melhorias identificadas na auditoria completa, seguindo as prioridades definidas em `docs/AUDITORIA-COMPLETA.md` e `docs/PLANO-CORRECOES.md`.

## Fase 1: Correções Urgentes (Bloqueadores)

### 1.1 Corrigir Erros TypeScript (115+ erros)

**Arquivos prioritários identificados:**

- `apps/api/src/__tests__/integration/auth.integration.test.ts` - Tipos `unknown` em respostas JSON
- `apps/api/src/__tests__/integration/deployment.integration.test.ts` - Tipos `undefined`, `null`, propriedades inexistentes
- `apps/api/src/__tests__/middlewares/audit.test.ts` - Tipos de contexto Hono
- `apps/api/src/routes/projects/handlers/*.ts` - Tipos de contexto incompatíveis
- `apps/api/src/services/*.ts` - Propriedades possivelmente undefined
- `apps/api/src/websocket/*.ts` - Propriedades inexistentes em includes Prisma

**Ações:**

1. Criar tipos compartilhados para respostas de API em `apps/api/src/types/responses.ts`
2. Corrigir testes de integração adicionando type guards e validação Zod
3. Corrigir handlers de rotas tipando corretamente Context do Hono
4. Corrigir services usando optional chaining e nullish coalescing
5. Corrigir WebSocket gateways ajustando includes do Prisma

### 1.2 Atualizar CI/CD Pipeline

**Arquivo:** `.github/workflows/ci.yml`

**Ações:**

1. Atualizar GitHub Actions de @v3 para @v4
2. Adicionar step de build
3. Melhorar mensagens de erro
4. Adicionar cache de dependências
5. Adicionar job de lint (quando ESLint estiver configurado)

### 1.3 Verificar Validação de Ambiente

**Status:** ✅ Já implementado em `apps/api/src/lib/env.ts` com validação de JWT_SECRET (min 32 chars)

**Ação:** Apenas verificar se está sendo usado corretamente em `apps/api/src/index.ts`

## Fase 2: Melhorias de Segurança (Importantes)

### 2.1 Implementar Health Checks

**Arquivo:** `apps/api/src/routes/health.ts` (verificar se já existe)

**Ações:**

1. Criar/atualizar rotas de health check (`/health`, `/health/detailed`, `/health/ready`, `/health/live`)
2. Verificar conectividade com PostgreSQL e Redis
3. Registrar rotas em `apps/api/src/index.ts`

### 2.2 Melhorar Rate Limiting

**Arquivo:** `apps/api/src/middlewares/rate-limit.ts` (verificar implementação atual)

**Ações:**

1. Verificar se rate limiting global já está implementado
2. Adicionar rate limiting específico para autenticação se necessário
3. Verificar uso de Redis para rate limiting distribuído

### 2.3 Adicionar Security Headers

**Arquivo:** `apps/api/src/middlewares/security.ts` (criar se não existir)

**Ações:**

1. Implementar security headers usando `hono/secure-headers`
2. Configurar CSP, X-Frame-Options, etc.
3. Aplicar middleware globalmente

## Fase 3: Melhorias de Código (Importantes)

### 3.1 Adicionar ESLint e Prettier

**Arquivos:** `.eslintrc.json`, `.prettierrc.json`, `.prettierignore`

**Ações:**

1. Instalar dependências: ESLint, Prettier, plugins TypeScript
2. Configurar ESLint com regras TypeScript
3. Configurar Prettier com padrões do projeto
4. Adicionar scripts no `package.json` raiz

### 3.2 Configurar Pre-commit Hooks

**Arquivos:** `.husky/pre-commit`, atualizar `package.json`

**Ações:**

1. Instalar Husky e lint-staged
2. Configurar pre-commit para rodar lint e format
3. Adicionar script `prepare` no package.json

## Fase 4: Documentação (Desejável)

### 4.1 Atualizar Documentação de Correções

**Arquivo:** `docs/AUDITORIA-COMPLETA.md`

**Ações:**

1. Marcar itens concluídos na auditoria
2. Atualizar status das correções aplicadas
3. Documentar melhorias implementadas

## Ordem de Execução

1. **Primeiro:** Corrigir erros TypeScript críticos (bloqueadores)
2. **Segundo:** Atualizar CI/CD (prevenção de regressões)
3. **Terceiro:** Implementar health checks (infraestrutura básica)
4. **Quarto:** Melhorias de segurança (rate limiting, headers)
5. **Quinto:** Ferramentas de qualidade (ESLint, Prettier, Husky)
6. **Sexto:** Atualizar documentação

## Arquivos Principais a Modificar

- `apps/api/src/__tests__/**/*.test.ts` - Correções de tipos
- `apps/api/src/routes/**/*.ts` - Tipagem de handlers
- `apps/api/src/services/**/*.ts` - Optional chaining
- `apps/api/src/websocket/**/*.ts` - Includes Prisma
- `.github/workflows/ci.yml` - Atualização CI/CD
- `apps/api/src/routes/health.ts` - Health checks
- `.eslintrc.json`, `.prettierrc.json` - Ferramentas de qualidade
- `package.json` (raiz) - Scripts e dependências
- `docs/AUDITORIA-COMPLETA.md` - Atualização de status

### To-dos

- [ ] Corrigir erros TypeScript em testes de integração (auth.integration.test.ts, deployment.integration.test.ts, audit.test.ts)
- [ ] Corrigir erros TypeScript em handlers de rotas (projects/handlers/*.ts)
- [ ] Corrigir erros TypeScript em services usando optional chaining e nullish coalescing
- [ ] Corrigir erros TypeScript em WebSocket gateways ajustando includes do Prisma
- [ ] Criar tipos compartilhados para respostas de API em apps/api/src/types/responses.ts
- [ ] Atualizar .github/workflows/ci.yml: GitHub Actions v3→v4, adicionar build step, melhorar cache
- [ ] Criar/atualizar rotas de health check (/health, /health/detailed, /health/ready, /health/live)
- [ ] Verificar e melhorar rate limiting global e específico para autenticação
- [ ] Implementar security headers middleware usando hono/secure-headers
- [ ] Configurar ESLint e Prettier: instalar dependências, criar arquivos de configuração, adicionar scripts
- [ ] Configurar Husky e lint-staged para pre-commit hooks
- [ ] Atualizar docs/AUDITORIA-COMPLETA.md marcando itens concluídos e atualizando status