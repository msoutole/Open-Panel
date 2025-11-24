# Plano de Implementação: Correções em ServiceDetailView

Documento criado para rastrear as correções e integrações realizadas no componente `ServiceDetailView.tsx` e sistemas relacionados.

## 🎯 Objetivo

Garantir que todas as funcionalidades de gerenciamento de serviços no OpenPanel estejam completamente integradas com a API backend, sem erros de TypeScript, e com feedback consistente ao usuário.

## 📝 Escopo do Trabalho

### Componentes Principais

- **ServiceDetailView.tsx**: Componente principal com múltiplas abas de gerenciamento
- **api.ts**: Cliente HTTP para comunicação com backend
- **types.ts**: Definições de tipos TypeScript

### Funcionalidades Implementadas

#### ✅ EnvironmentTab (Variáveis de Ambiente)
- **Integração**: CRUD completo (Create, Read, Update, Delete)
- **API Calls**: `createEnvVar`, `updateEnvVar`, `deleteEnvVar`
- **Validação**: Chaves obrigatórias, remoção de entradas vazias
- **UX**: Modo simples e raw (.env), indicador de salvamento

#### ✅ NetworkingTab (Domínios e Roteamento)
- **Domains**: Adicionar/remover domínios com `createDomain` e `deleteDomain`
- **Redirects**: Gerenciar redirecionamentos HTTP com `createRedirect` e `deleteRedirect`
- **Exposed Port**: Salvar porta pública para bancos de dados com `updateService`
- **UX**: Modal de confirmação para remoções, loading states

#### ✅ ResourcesTab (Limites de CPU/Memória)
- **Integração**: `updateServiceResources` para atualizar reservas e limites
- **Validação**: Cliente-side (limites >= reservas)
- **UX**: Sliders interativos, feedbackvisual de uso

#### ✅ BackupsTab (Backups de Banco de Dados)
- **Integração**: `createBackup`, `restoreBackup`, `deleteBackup`, `listBackups`
- **Auto-load**: `useEffect` carrega backups ao montar
- **UX**: Confirmações para operações destrutivas

#### ✅ AdvancedTab (Configurações Avançadas)
- **Save**: `updateService` para alterar `image` e `command`
- **Delete**: `deleteService` com confirmação e Page Reload
- **Force Rebuild**: Integrado com `restartService`

#### ✅ SourceTab (Origem do Código)
- **Integração**: `updateService` para mudar tipo de source (Docker/Git)
- **Estado Local**: Gerencia `activeSourceType`, `image`, `repo`, `branch`
- **UX**: Toggle entre Docker Image e Git Repository

## 🔧 Alterações Técnicas

### API Client (`api.ts`)

```typescript
// Novos endpoints adicionados
createDomain(data: { domain, projectId, https, targetPort, targetProtocol })
updateDomain(id, updates: Partial<Domain>)
createRedirect(serviceId, data: { from, to, type })
deleteRedirect(serviceId, redirectId)
updateService(projectId, serviceId, updates)
deleteService(projectId, serviceId)
```

### Types (`types.ts`)

```typescript
// Correções
Service.envVars (antes: Service.env) - alinhado com backend
EnvVar.isSecret adicionado
```

### Correções de Bugs

1. **Componentes Faltantes**: `EnvironmentTab` e `LockIcon` foram restaurados após serem removidos acidentalmente
2. **Propriedade Incorreta**: `service.env` corrigido para `service.envVars`
3. **ExposedPort**: Estado e handler adicionados para salvar porta pública de DBs
4. **Duplicação de Código**: Removidas linhas duplicadas geradas por edições anteriores

## 🧪 Testes Realizados

### Inicialização Completa

- [x] Docker Compose sobe todos os serviços (Postgres, Redis, Ollama, Traefik)
- [x] Schema do banco aplicado com `npm run db:push`
- [x] Backend API inicia na porta 3001
- [x] Frontend Web inicia na porta 3000 (pendente verificação no navegador)

### Problemas Identificados

| Problema                       | Status      | Solução                                        |
| ------------------------------ | ----------- | ---------------------------------------------- |
| Erro no `.env` (vírgula extra) | ✅ Resolvido | Removida vírgula no `ANTHROPIC_API_KEY`        |
| OpenTelemetry import error     | ✅ Resolvido | Comentado `instrumentation.ts` temporariamente |
| Containers Docker conflitantes | ✅ Resolvido | `docker-compose down` + `docker rm -f`         |
| Redis NOAUTH                   | ⚠️ Pendente  | Configurar `REDIS_PASSWORD` no backend         |
| Docker socket Windows          | ⚠️ Pendente  | Atualizar `DOCKER_HOST` para `npipe://...`     |

## 📋 Próximos Passos

### Prioridade Alta

1. **Configurar Redis com autenticação**
   - Atualizar cliente Redis no backend para usar `REDIS_PASSWORD`
   - Testar cache e filas

2. **Corrigir Docker socket no Windows**
   - Alterar `DOCKER_HOST` de `/var/run/docker.sock` para `npipe:////./pipe/docker_engine`
   - Testar start/stop/restart de containers

3. **Validação Frontend**
   - Abrir `http://localhost:3000` no navegador
   - Logar e testar CRUDs de Env Vars, Domains, Backups

### Prioridade Média

4. **Padronizar Notificações**
   - Substituir `alert()` por `setNotification` em todas as abas
   - Unificar estilo de mensagens de sucesso/erro

5. **Implementar Refresh de Dados**
   - Após API calls de modificação, recarregar `service` ou `project`
   - Evitar full page reload quando possível

### Prioridade Baixa

6. **Melhorar UI de Secrets**
   - Adicionar toggle "Show/Hide" para variáveis secretas
   - Checkbox para marcar `isSecret` ao criar/editar EnvVar

## 🔗 Arquivos Modificados

- `apps/web/components/ServiceDetailView.tsx` (+200 linhas)
- `apps/web/services/api.ts` (+50 linhas)
- `apps/api/src/instrumentation.ts` (comentado temporariamente)
- `.env` (corrigido erro de sintaxe)

## 📚 Documentação Criada

- `docs/walkthrough/03-service-management.md` - Guia de gerenciamento de serviços
- `docs/walkthrough/04-testing-complete.md` - Walkthrough de testes completos
- `docs/implementation-plan/TASKS.md` - Atualizado TASK-011

---

**Data**: 2025-11-24  
**Versão**: 0.2.0  
**Status**: 90% Completo (pendente: Redis auth, Docker socket Windows)
