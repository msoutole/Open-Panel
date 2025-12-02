# 🔗 Integração Frontend-Backend

Este documento descreve a arquitetura de integração completa entre o frontend e backend do Open Panel.

## Visão Geral

O Open Panel utiliza uma arquitetura RESTful com WebSockets para comunicação em tempo real. Todos os dados mockados foram removidos e substituídos por integrações reais com a API.

## Arquitetura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │◄───────►│  API Backend │◄───────►│   Database   │
│   (React)   │  REST   │   (Hono)     │  Prisma │  (PostgreSQL)│
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │
       │                        │
       └──────── WebSocket ─────┘
              (Real-time)
```

## Fluxo de Dados

### 1. Autenticação

1. Usuário faz login via `POST /api/auth/login`
2. Recebe `accessToken` e `refreshToken`
3. Tokens são armazenados em `localStorage`
4. Todas as requisições subsequentes incluem `Authorization: Bearer <token>`

### 2. Requisições REST

**Padrão de Requisição:**
```typescript
const response = await fetch(`${getApiBaseUrl()}/api/endpoint`, {
  headers: getAuthHeaders(), // Inclui token JWT
});
const data = await handleResponse(response);
```

**Tratamento de Erros:**
- 401: Token expirado → Refresh token
- 403: Sem permissão → Redirecionar para login
- 404: Recurso não encontrado → Mostrar erro amigável
- 500: Erro do servidor → Log e mensagem genérica

### 3. WebSockets

**Conexão:**
```typescript
const ws = new WebSocket('ws://localhost:3001/ws/logs');
```

**Autenticação:**
```typescript
ws.send(JSON.stringify({
  type: 'auth',
  token: localStorage.getItem('openpanel_access_token')
}));
```

**Subscrição:**
```typescript
ws.send(JSON.stringify({
  type: 'subscribe_logs',
  containerId: 'container_id'
}));
```

## Componentes e Integrações

### DashboardView

**APIs Utilizadas:**
- `GET /api/stats/dashboard` - Estatísticas agregadas
- `GET /api/metrics/system` - Métricas do sistema
- `ws://localhost:3001/ws/metrics` - Métricas em tempo real

**Hooks:**
- `useMetrics()` - Hook para métricas em tempo real

**Dados Removidos:**
- ❌ `CPU_DATA`
- ❌ `NETWORK_DATA`
- ✅ Substituído por dados reais da API

### SettingsView

**APIs Utilizadas:**
- `GET /api/users` - Listar usuários
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

**Dados Removidos:**
- ❌ `USERS_MOCK`
- ✅ Substituído por dados reais da API

### SecurityView

**APIs Utilizadas:**
- `GET /api/audit` - Listar audit logs
- `GET /api/audit/stats` - Estatísticas de audit logs
- `ws://localhost:3001/ws/logs` - Eventos Docker em tempo real

**Hooks:**
- `useLogs()` - Hook para logs em tempo real

**Dados Removidos:**
- ❌ `AUDIT_LOGS`
- ❌ `INITIAL_LOGS`
- ✅ Substituído por dados reais da API e WebSocket

### GeminiChat

**APIs Utilizadas:**
- `GET /api/metrics/system` - Métricas do sistema
- `GET /api/containers` - Listar serviços
- `POST /api/containers/:id/restart` - Reiniciar serviço

**Ferramentas Implementadas:**
- ✅ `get_system_metrics` - Métricas reais do sistema
- ✅ `list_services` - Lista real de containers
- ✅ `restart_service` - Reinicia containers reais
- ❌ `execute_shell_command` - Removido (segurança)
- ❌ `read_file` - Removido (segurança)
- ❌ `delete_resource` - Removido (usa endpoints específicos)

### ServiceDetailView

**APIs Utilizadas:**
- `GET /api/containers/:id` - Detalhes do container
- `GET /api/containers/:id/logs` - Logs do container
- `ws://localhost:3001/ws/containers` - Logs e métricas em tempo real

**Hooks:**
- `useLogs({ containerId })` - Logs em tempo real
- `useMetrics({ containerId })` - Métricas em tempo real

**Dados Removidos:**
- ❌ `INITIAL_LOGS`
- ✅ Substituído por WebSocket de logs

## Hooks Customizados

### useWebSocket

Hook genérico para conexões WebSocket.

```typescript
const { send, close, isConnected, lastMessage } = useWebSocket({
  url: 'ws://localhost:3001/ws/logs',
  onMessage: (message) => {
    console.log('Received:', message);
  },
  reconnect: true,
});
```

### useLogs

Hook específico para logs em tempo real.

```typescript
const { logs, isConnected, clearLogs } = useLogs({
  containerId: 'container_id',
  autoConnect: true,
  maxLogs: 1000,
});
```

### useMetrics

Hook específico para métricas em tempo real.

```typescript
const { metrics, history, isConnected } = useMetrics({
  containerId: 'container_id', // Opcional para métricas de container
  autoConnect: true,
  interval: 2000,
  maxHistory: 100,
});
```

## Serviços de API

### api.ts

Arquivo centralizado com todas as funções de API.

**Categorias:**
- **Projetos**: `getProjects()`, `createProject()`, etc.
- **Containers**: `getContainers()`, `restartService()`, etc.
- **Métricas**: `getSystemMetrics()`, `getContainerMetrics()`, etc.
- **Audit Logs**: `getAuditLogs()`, `getAuditLogStats()`, etc.
- **Estatísticas**: `getDashboardStats()`, `getProjectStats()`, etc.
- **Usuários**: `getUsers()`, `updateUser()`, etc.

**Padrão de Função:**
```typescript
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch(`${getApiBaseUrl()}/api/metrics/system`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ metrics: SystemMetrics }>(response);
  return data.metrics;
};
```

## Tratamento de Erros

### Níveis de Erro

1. **Erro de Rede**: Retry automático com backoff exponencial
2. **Erro de Autenticação**: Refresh token ou redirecionar para login
3. **Erro de Validação**: Mostrar mensagens específicas do campo
4. **Erro do Servidor**: Log e mensagem genérica ao usuário

### Estados de Loading

- Skeleton loaders durante carregamento inicial
- Indicadores de loading para ações assíncronas
- Estados vazios quando não há dados

## Performance

### Otimizações Implementadas

1. **Cache de Métricas**: Histórico limitado (últimos 100 pontos)
2. **Debounce**: WebSocket não envia mais de 1 mensagem por segundo
3. **Paginação**: Audit logs paginados (20 por página)
4. **Lazy Loading**: Componentes carregam dados apenas quando necessário

### Limites

- **Logs**: Máximo de 1000 logs em memória
- **Métricas**: Máximo de 100 pontos de histórico
- **Paginação**: 20 itens por página (configurável)

## Segurança

### Autenticação

- JWT tokens com expiração
- Refresh tokens para renovação automática
- Tokens armazenados em `localStorage` (considerar `httpOnly` cookies em produção)

### WebSockets

- Autenticação obrigatória em todos os gateways
- Rate limiting (100 mensagens por minuto)
- Timeout de autenticação (30 segundos)

### Validação

- Validação de entrada no backend (Zod)
- Sanitização de dados antes de exibir
- Prevenção de CSV injection em exports

## Monitoramento

### Métricas Coletadas

- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Container stats

### Logs Coletados

- Audit logs (todas as ações)
- Docker events (tempo real)
- Container logs (tempo real)

## Troubleshooting

### WebSocket não conecta

1. Verificar se o token JWT é válido
2. Verificar se o servidor WebSocket está rodando
3. Verificar CORS e firewall

### Dados não aparecem

1. Verificar console do navegador para erros
2. Verificar Network tab para requisições falhadas
3. Verificar se o backend está respondendo

### Performance lenta

1. Verificar número de logs em memória
2. Verificar intervalo de atualização de métricas
3. Verificar tamanho das respostas da API

## Próximos Passos

- [ ] Implementar cache persistente (IndexedDB)
- [ ] Adicionar retry automático para requisições falhadas
- [ ] Implementar offline mode
- [ ] Adicionar testes de integração
- [ ] Implementar rate limiting no frontend

