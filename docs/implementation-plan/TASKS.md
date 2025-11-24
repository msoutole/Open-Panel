# OpenPanel Development Tasks

Lista estruturada de tarefas de desenvolvimento, organizadas por prioridade e status.

## 📋 Formato das Tarefas

Cada tarefa segue este formato:

```markdown
### Task ID: [NOME DA TAREFA]

**ID**: TASK-XXX
**Status**: [Não Iniciada | Em Progresso | Code Review | Concluída | Bloqueada]
**Prioridade**: [Crítica | Alta | Média | Baixa]
**Estimativa**: [2h | 4h | 1d | 3d | 5d]
**Atribuído a**: [Developer Name]
**Related User Stories**: [US-XXX-001]
**Related Features**: [Feature Name]

### Descrição

Descrição clara do que precisa ser feito.

### Critérios de Aceitação

- [ ] Requisito 1
- [ ] Requisito 2
- [ ] Teste implementado

### Arquivos Afetados

- `src/path/to/file.ts`
- `tests/path/to/file.test.ts`

### Notas Técnicas

Considerações importantes para implementação.

### Pull Request

Link do PR (quando em progresso/code review)
```

---

## 🔴 CRÍTICAS (Bloqueadores)

Tarefas críticas que bloqueiam outras.

### TASK-001: Corrigir Memory Leak em WebSocket Gateway

**ID**: TASK-001
**Status**: 🔄 Em Progresso
**Prioridade**: Crítica
**Estimativa**: 2d
**Atribuído a**: @msoutole

**Descrição**

O WebSocket gateway está vazando memória em conexões de longa duração, causando 500MB+ em produção.

**Critérios de Aceitação**

- [ ] Identificar causa do leak
- [ ] Implementar fix
- [ ] Adicionar testes de memória
- [ ] Validar redução de memória
- [ ] Deploy em staging

**Arquivos Afetados**

- `apps/api/src/websocket/gateway.ts`
- `apps/api/src/websocket/handlers.ts`

**Relacionados**

- US-CONT-005: Ver logs
- Feature: Container Logging

---

### TASK-002: Implementar Circuit Breaker para Docker API

**ID**: TASK-002
**Status**: 🔄 Em Progresso
**Prioridade**: Crítica
**Estimativa**: 1d
**Atribuído a**: @msoutole

**Descrição**

Adicionar circuit breaker para proteger contra falhas do Docker daemon.

**Tarefas Técnicas**

- [ ] Implementar pattern circuit breaker
- [ ] Falhar fast em Docker unavailable
- [ ] Retornar erro apropriado ao frontend
- [ ] Adicionar retry logic com exponential backoff
- [ ] Testes com Docker daemon down

**Arquivos Afetados**

- `apps/api/src/lib/docker.ts`
- `apps/api/src/services/docker.service.ts`

- `apps/api/src/services/docker.service.ts`

---

### TASK-011: Fix ServiceDetailView Errors and Integrate APIs

**ID**: TASK-011
**Status**: 🔄 Em Progresso
**Prioridade**: Crítica
**Estimativa**: 1d
**Atribuído a**: @msoutole

**Descrição**

Corrigir erros de TypeScript e JSX no componente `ServiceDetailView.tsx` e integrar todas as ações do frontend com a API backend.

**Critérios de Aceitação**

- [x] Resolver todos os erros de TypeScript (missing names, JSX tags)
- [x] Integrar EnvironmentTab (CRUD env vars)
- [x] Integrar NetworkingTab (Domains, Redirects)
- [x] Integrar ResourcesTab (CPU/Memory limits)
- [x] Integrar BackupsTab (Create, Restore, Delete)
- [x] Integrar AdvancedTab (Update image/command, Delete service)
- [x] Integrar SourceTab (Update source config)
- [x] Implementar exposedPort save (database services)
- [x] Testar startup completo (Docker + Backend + Frontend)
- [ ] Resolver problemas de autenticação Redis
- [ ] Configurar Docker socket para Windows

**Arquivos Afetados**

- `apps/web/components/ServiceDetailView.tsx`
- `apps/web/services/api.ts`

---

## 🟠 ALTA PRIORIDADE

### TASK-003: Aumentar Cobertura de Testes para 80%

**ID**: TASK-003
**Status**: 🔄 Em Progresso
**Prioridade**: Alta
**Estimativa**: 5d
**Atribuído a**: @team

**Descrição**

Aumentar cobertura de testes unitários e integração de 40% para 80%.

**Tarefas Técnicas**

- [ ] Adicionar unit tests para services/
- [ ] Adicionar integration tests para rotas da API
- [ ] E2E tests para fluxos críticos
- [ ] Setup código coverage reporting
- [ ] CI/CD com falha se coverage < 80%

**Breakdown por Componente**

- [ ] Auth service tests (TASK-003-A)
- [ ] Project service tests (TASK-003-B)
- [ ] Container service tests (TASK-003-C)
- [ ] Deployment service tests (TASK-003-D)
- [ ] Domain service tests (TASK-003-E)

---

### TASK-004: Implementar Database Query Optimization

**ID**: TASK-004
**Status**: Não Iniciada
**Prioridade**: Alta
**Estimativa**: 3d
**Atribuído a**: @TBD

**Descrição**

Otimizar queries lentas no banco de dados usando indexes e query optimization.

**Tarefas Técnicas**

- [ ] Profile queries lentas com explain analyze
- [ ] Adicionar indexes faltantes
- [ ] Otimizar Prisma queries
- [ ] Implementar query result caching
- [ ] Performance benchmarks

**Queries Identificadas**

- Projects listing (N+1 problem com envVars)
- Containers stats com histórico
- Deployments com logs

---

### TASK-005: Implementar Error Boundary no Frontend

**ID**: TASK-005
**Status**: Não Iniciada
**Prioridade**: Alta
**Estimativa**: 1d
**Atribuído a**: @TBD

**Descrição**

Adicionar Error Boundary component para capturar erros não-tratados no React.

**Tarefas Técnicas**

- [ ] Criar ErrorBoundary.tsx
- [ ] Implementar error logging
- [ ] Mostrar fallback UI amigável
- [ ] Adicionar retry mechanism
- [ ] Testes de error scenarios

---

## 🟡 MÉDIA PRIORIDADE

### TASK-006: Implementar Redis Caching para Projetos

**ID**: TASK-006
**Status**: Não Iniciada
**Prioridade**: Média
**Estimativa**: 2d
**Atribuído a**: @TBD

**Descrição**

Adicionar caching em Redis para reduce load no banco de dados.

**Features**

- Cache de lista de projetos (5 min TTL)
- Cache de detalhes do projeto (10 min TTL)
- Invalidação ao fazer updates
- Cache stats/dashboard (1 min TTL)

---

### TASK-007: Melhorar Frontend Performance

**ID**: TASK-007
**Status**: Não Iniciada
**Prioridade**: Média
**Estimativa**: 3d
**Atribuído a**: @TBD

**Tarefas Técnicas**

- [ ] Code splitting por página
- [ ] Lazy load de componentes pesados
- [ ] Bundle size analysis
- [ ] Implementar virtual scrolling para listas
- [ ] Comprimir imagens

---

### TASK-008: Completar IA Chat Interface

**ID**: TASK-008
**Status**: 🔄 Em Progresso
**Prioridade**: Média
**Estimativa**: 3d
**Atribuído a**: @msoutole

**Descrição**

Completar interface do chat com IA, incluindo histórico e streaming.

**Tarefas Técnicas**

- [ ] Streaming de respostas da IA
- [ ] Histórico de conversa persistente
- [ ] Markdown rendering para respostas
- [ ] Code highlighting
- [ ] Copy to clipboard para code blocks

---

## 🟢 BAIXA PRIORIDADE

### TASK-009: Adicionar Documentação de Componentes

**ID**: TASK-009
**Status**: Não Iniciada
**Prioridade**: Baixa
**Estimativa**: 2d
**Atribuído a**: @TBD

**Descrição**

Adicionar Storybook para documentar componentes React.

---

### TASK-010: Implementar 2FA

**ID**: TASK-010
**Status**: Não Iniciada
**Prioridade**: Baixa
**Estimativa**: 5d
**Atribuído a**: @TBD

**Descrição**

Adicionar Two-Factor Authentication usando TOTP.

---

## 📊 Board de Tarefas

### Por Status

#### 🔄 Em Progresso (3 tasks)
#### 🔄 Em Progresso (5 tasks)

| ID       | Nome                    | Atribuído | ETA        |
| -------- | ----------------------- | --------- | ---------- |
| TASK-001 | Memory Leak WebSocket   | @msoutole | 2024-11-28 |
| TASK-002 | Circuit Breaker         | @msoutole | 2024-11-26 |
| TASK-003 | Testes 80% Coverage     | @team     | 2024-12-08 |
| TASK-008 | IA Chat Interface       | @msoutole | 2024-11-30 |
| TASK-011 | ServiceDetailView Fixes | @msoutole | 2024-11-25 |

#### Não Iniciada (7 tasks)

| ID       | Nome                 | Prioridade | Estimativa |
| -------- | -------------------- | ---------- | ---------- |
| TASK-005 | Error Boundary       | Alta       | 1d         |
| TASK-006 | Redis Cache          | Média      | 2d         |
| TASK-007 | Frontend Performance | Média      | 3d         |
| TASK-009 | Storybook Docs       | Baixa      | 2d         |
| TASK-010 | 2FA                  | Baixa      | 5d         |

### Por Sprint

#### Sprint Atual (Nov 24 - Dec 08)

- TASK-001: Memory Leak WebSocket
- TASK-002: Circuit Breaker
- TASK-003: Tests 80% Coverage
- TASK-008: IA Chat Interface

**Capacidade**: 11d de 10d planejados (110%)

#### Sprint 2 (Dec 09 - Dec 22)

Planejado:
- TASK-004: DB Query Optimization
- TASK-005: Error Boundary
- TASK-006: Redis Cache
- TASK-007: Frontend Performance

**Capacidade**: 9d

---

## 🚀 Workflow de Tarefas

### Quando criar tarefa

1. User story aprovada
2. Estimativa realista
3. Critérios de aceitação claros
4. Não é blocking de ninguém

### Ciclo de vida

```
Não Iniciada
    ↓
Em Progresso (Pull Request criado)
    ↓
Code Review (PR aberto para review)
    ↓
Concluída (PR merged)
    ↓
Validação (QA testing)
```

### Antes de marcar Concluída

- [ ] Código escrito e testado
- [ ] PR revisado e aprovado
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Merged em main/develop

---

## 🔗 Links Importantes

- [ROADMAP.md](./ROADMAP.md) - Visão geral do roadmap
- [User Stories](../user-stories/) - Histórias de usuário
- [Features](../features/) - Documentação de features
- [GitHub Issues](https://github.com/msoutole/openpanel/issues) - Task tracking

---

**Versão**: 0.1.0
**Última atualização**: 2024-11-24
**Próxima revisão**: 2024-11-28 (weekly sync)
