# API WebSocket - Documentação de Protocolos

**Última atualização**: 2025-12-03  
**Versão da API**: 1.3.0

Este documento descreve os protocolos WebSocket disponíveis no OpenPanel para comunicação em tempo real.

---

## Visão Geral

O OpenPanel oferece 4 gateways WebSocket para diferentes funcionalidades:

| Gateway | Endpoint | Descrição |
|---------|----------|-----------|
| **Container** | `ws://host/ws/containers` | Logs e estatísticas de containers Docker |
| **Logs** | `ws://host/ws/logs` | Eventos Docker e logs do sistema |
| **Metrics** | `ws://host/ws/metrics` | Métricas do sistema em tempo real |
| **Terminal** | `ws://host/ws/terminal` | Terminal interativo via Docker exec |

---

## Autenticação

Todos os gateways WebSocket requerem autenticação JWT. O fluxo de autenticação é o mesmo para todos:

### 1. Conexão

Conecte-se ao endpoint WebSocket desejado:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws/containers')
```

### 2. Mensagem de Boas-vindas

Após conectar, você receberá uma mensagem de boas-vindas:

```json
{
  "type": "connected",
  "clientId": "client-12345",
  "timestamp": "2025-12-03T10:00:00Z",
  "message": "Please authenticate within 30 seconds"
}
```

### 3. Autenticação (Obrigatória)

Você deve autenticar dentro de 30 segundos após a conexão:

**Mensagem de Autenticação:**
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de Sucesso:**
```json
{
  "type": "authenticated",
  "clientId": "client-12345",
  "userId": "user-123",
  "timestamp": "2025-12-03T10:00:00Z"
}
```

**Resposta de Erro:**
```json
{
  "type": "error",
  "message": "Invalid token"
}
```

Se a autenticação falhar ou não ocorrer dentro de 30 segundos, a conexão será fechada.

---

## Gateway: Container (`/ws/containers`)

Gerencia logs e estatísticas em tempo real de containers Docker.

### Mensagens de Entrada

#### `subscribe_logs`
Inscreve-se para receber logs de um container específico.

```json
{
  "type": "subscribe_logs",
  "containerId": "container-123"
}
```

#### `unsubscribe_logs`
Cancela a inscrição de logs de um container.

```json
{
  "type": "unsubscribe_logs",
  "containerId": "container-123"
}
```

#### `subscribe_stats`
Inscreve-se para receber estatísticas de um container.

```json
{
  "type": "subscribe_stats",
  "containerId": "container-123",
  "interval": 2000
}
```

**Parâmetros:**
- `containerId` (obrigatório): ID do container Docker
- `interval` (opcional): Intervalo em milissegundos entre atualizações (padrão: 2000ms)

#### `unsubscribe_stats`
Cancela a inscrição de estatísticas.

```json
{
  "type": "unsubscribe_stats",
  "containerId": "container-123"
}
```

### Mensagens de Saída

#### `log`
Log de container recebido.

```json
{
  "type": "log",
  "containerId": "container-123",
  "timestamp": "2025-12-03T10:00:00Z",
  "stream": "stdout",
  "data": "Application started successfully"
}
```

#### `stats`
Estatísticas do container.

```json
{
  "type": "stats",
  "containerId": "container-123",
  "timestamp": "2025-12-03T10:00:00Z",
  "stats": {
    "cpu": {
      "usage": 45.2,
      "percent": 45.2
    },
    "memory": {
      "usage": 524288000,
      "limit": 1073741824,
      "percent": 48.8
    },
    "network": {
      "rx_bytes": 1024000,
      "tx_bytes": 2048000
    }
  }
}
```

#### `error`
Mensagem de erro.

```json
{
  "type": "error",
  "message": "Container not found",
  "containerId": "container-123"
}
```

---

## Gateway: Logs (`/ws/logs`)

Recebe eventos Docker e logs do sistema em tempo real.

### Mensagens de Entrada

Este gateway não requer mensagens específicas além da autenticação. Após autenticar, você receberá automaticamente:

- Eventos Docker (container criado, iniciado, parado, etc.)
- Logs do sistema

### Mensagens de Saída

#### `docker_event`
Evento Docker recebido.

```json
{
  "type": "docker_event",
  "timestamp": "2025-12-03T10:00:00Z",
  "event": {
    "Type": "container",
    "Action": "start",
    "Actor": {
      "ID": "container-123",
      "Attributes": {
        "name": "my-app"
      }
    }
  }
}
```

#### `system_log`
Log do sistema.

```json
{
  "type": "system_log",
  "timestamp": "2025-12-03T10:00:00Z",
  "level": "info",
  "message": "Container started successfully",
  "source": "docker"
}
```

---

## Gateway: Metrics (`/ws/metrics`)

Recebe métricas do sistema em tempo real.

### Mensagens de Entrada

#### `subscribe`
Inscreve-se para receber métricas do sistema.

```json
{
  "type": "subscribe",
  "interval": 2000
}
```

**Parâmetros:**
- `interval` (opcional): Intervalo em milissegundos entre atualizações (padrão: 2000ms)

#### `unsubscribe`
Cancela a inscrição de métricas.

```json
{
  "type": "unsubscribe"
}
```

### Mensagens de Saída

#### `metrics`
Métricas do sistema.

```json
{
  "type": "metrics",
  "timestamp": "2025-12-03T10:00:00Z",
  "system": {
    "cpu": {
      "usage": 25.5,
      "cores": 4
    },
    "memory": {
      "total": 8589934592,
      "used": 4294967296,
      "free": 4294967296,
      "percent": 50.0
    },
    "disk": {
      "total": 107374182400,
      "used": 53687091200,
      "free": 53687091200,
      "percent": 50.0
    },
    "network": {
      "rx_bytes": 1048576000,
      "tx_bytes": 2097152000
    }
  }
}
```

---

## Gateway: Terminal (`/ws/terminal`)

Fornece acesso a terminal interativo via Docker exec.

### Mensagens de Entrada

#### `open_terminal`
Abre uma sessão de terminal em um container.

```json
{
  "type": "open_terminal",
  "containerId": "container-123",
  "shell": "/bin/bash"
}
```

**Parâmetros:**
- `containerId` (obrigatório): ID do container Docker
- `shell` (opcional): Shell a usar (padrão: `/bin/sh`)

**Resposta de Sucesso:**
```json
{
  "type": "terminal_opened",
  "containerId": "container-123",
  "sessionId": "session-12345"
}
```

#### `input`
Envia entrada para o terminal.

```json
{
  "type": "input",
  "data": "ls -la\n"
}
```

**Nota:** Inclua o caractere de nova linha (`\n`) para executar comandos.

#### `resize`
Redimensiona o terminal.

```json
{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

**Parâmetros:**
- `cols` (obrigatório): Número de colunas
- `rows` (obrigatório): Número de linhas

#### `close_terminal`
Fecha a sessão de terminal.

```json
{
  "type": "close_terminal"
}
```

### Mensagens de Saída

#### `terminal_output`
Saída do terminal.

```json
{
  "type": "terminal_output",
  "data": "total 24\ndrwxr-xr-x 3 root root 4096 Dec  3 10:00 .\n"
}
```

#### `terminal_error`
Erro do terminal.

```json
{
  "type": "terminal_error",
  "message": "Container not found or not running"
}
```

#### `terminal_closed`
Terminal fechado.

```json
{
  "type": "terminal_closed",
  "reason": "User closed"
}
```

---

## Tratamento de Erros

Todos os gateways retornam mensagens de erro no seguinte formato:

```json
{
  "type": "error",
  "message": "Descrição do erro",
  "code": "ERROR_CODE"
}
```

### Códigos de Erro Comuns

| Código | Descrição |
|--------|-----------|
| `AUTH_REQUIRED` | Autenticação necessária |
| `AUTH_FAILED` | Falha na autenticação |
| `AUTH_TIMEOUT` | Timeout de autenticação |
| `RATE_LIMIT` | Limite de taxa excedido |
| `CONTAINER_NOT_FOUND` | Container não encontrado |
| `PERMISSION_DENIED` | Permissão negada |
| `INVALID_MESSAGE` | Formato de mensagem inválido |

---

## Rate Limiting

Todos os gateways implementam rate limiting:

- **Container Gateway**: Máximo 10 mensagens por segundo por cliente
- **Logs Gateway**: Máximo 100 mensagens por minuto por cliente
- **Metrics Gateway**: Máximo 100 mensagens por minuto por cliente
- **Terminal Gateway**: Máximo 10 mensagens por segundo por cliente

Se o limite for excedido, você receberá:

```json
{
  "type": "error",
  "message": "Rate limit exceeded. Please slow down."
}
```

---

## Heartbeat

Todos os gateways implementam heartbeat para detectar conexões mortas:

- O servidor envia `ping` a cada 30 segundos
- O cliente deve responder com `pong` automaticamente
- Se o cliente não responder, a conexão será fechada

### Mensagem Ping

```json
{
  "type": "ping",
  "timestamp": "2025-12-03T10:00:00Z"
}
```

### Mensagem Pong

```json
{
  "type": "pong",
  "timestamp": "2025-12-03T10:00:00Z"
}
```

---

## Reconexão

Recomenda-se implementar reconexão automática em caso de desconexão:

1. Aguarde alguns segundos antes de reconectar
2. Implemente backoff exponencial
3. Reautentique após reconectar
4. Restaure subscrições anteriores

### Exemplo de Reconexão (JavaScript)

```javascript
let reconnectAttempts = 0
const maxReconnectAttempts = 5

function connect() {
  const ws = new WebSocket('ws://localhost:3001/ws/containers')
  
  ws.onopen = () => {
    reconnectAttempts = 0
    // Autenticar
    ws.send(JSON.stringify({
      type: 'auth',
      token: 'your-jwt-token'
    }))
  }
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      setTimeout(connect, delay)
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

connect()
```

---

## Exemplos de Código

### JavaScript/TypeScript

```typescript
// Conectar ao gateway de containers
const ws = new WebSocket('ws://localhost:3001/ws/containers')

ws.onopen = () => {
  // Autenticar
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  switch (message.type) {
    case 'authenticated':
      // Inscrever-se em logs
      ws.send(JSON.stringify({
        type: 'subscribe_logs',
        containerId: 'container-123'
      }))
      break
      
    case 'log':
      console.log('Log:', message.data)
      break
      
    case 'stats':
      console.log('Stats:', message.stats)
      break
      
    case 'error':
      console.error('Error:', message.message)
      break
  }
}
```

### Python

```python
import asyncio
import websockets
import json

async def connect_container_gateway():
    uri = "ws://localhost:3001/ws/containers"
    
    async with websockets.connect(uri) as websocket:
        # Autenticar
        await websocket.send(json.dumps({
            "type": "auth",
            "token": "your-jwt-token"
        }))
        
        # Aguardar autenticação
        response = await websocket.recv()
        auth_result = json.loads(response)
        
        if auth_result["type"] == "authenticated":
            # Inscrever-se em logs
            await websocket.send(json.dumps({
                "type": "subscribe_logs",
                "containerId": "container-123"
            }))
            
            # Receber mensagens
            async for message in websocket:
                data = json.loads(message)
                if data["type"] == "log":
                    print(f"Log: {data['data']}")

asyncio.run(connect_container_gateway())
```

---

## Referências

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Docker API Documentation](https://docs.docker.com/engine/api/)
- [OpenPanel REST API](./API_REST.md)

---

**Nota**: Esta documentação está sujeita a mudanças. Consulte sempre a versão mais recente da API.

