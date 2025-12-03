# Terminal no Navegador

## Visão Geral

O OpenPanel fornece acesso a terminal interativo diretamente no navegador, permitindo executar comandos shell em containers Docker em tempo real.

## Funcionalidades

- ✅ Terminal interativo via WebSocket
- ✅ Suporte a múltiplas sessões simultâneas
- ✅ Autenticação obrigatória
- ✅ Verificação de permissões por container
- ✅ Rate limiting para segurança
- ✅ Suporte a resize de terminal

## Uso via WebSocket

### Conexão

```javascript
const ws = new WebSocket('ws://localhost:3001/ws/terminal')
```

### Autenticação

Primeiro, envie mensagem de autenticação:

```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta**:
```json
{
  "type": "auth_success",
  "message": "Authentication successful"
}
```

### Abrir Terminal

```json
{
  "type": "open_terminal",
  "containerId": "abc123def456",
  "shell": "/bin/sh"
}
```

**Resposta**:
```json
{
  "type": "terminal_opened",
  "message": "Terminal session opened",
  "shell": "/bin/sh"
}
```

### Enviar Input

```json
{
  "type": "input",
  "data": "ls -la\n"
}
```

### Receber Output

```json
{
  "type": "output",
  "data": "total 16\ndrwxr-xr-x 2 root root 4096 Jan 27 12:00 .\n..."
}
```

### Redimensionar Terminal

```json
{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

### Fechar Terminal

```json
{
  "type": "close_terminal"
}
```

## Segurança

- Autenticação JWT obrigatória
- Verificação de permissões (usuário deve ser owner ou team member)
- Rate limiting (máximo 10 mensagens por segundo)
- Timeout de autenticação (30 segundos)
- Heartbeat para detectar conexões mortas

## Permissões

O usuário precisa ter acesso ao container através de:
- Ser owner do projeto
- Ser membro do team que possui o projeto

## Exemplo Completo

```javascript
const ws = new WebSocket('ws://localhost:3001/ws/terminal')

ws.onopen = () => {
  // Autenticar
  ws.send(JSON.stringify({
    type: 'auth',
    token: localStorage.getItem('accessToken')
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  switch (message.type) {
    case 'auth_success':
      // Abrir terminal
      ws.send(JSON.stringify({
        type: 'open_terminal',
        containerId: 'abc123def456',
        shell: '/bin/sh'
      }))
      break
      
    case 'terminal_opened':
      console.log('Terminal ready')
      break
      
    case 'output':
      // Exibir output no terminal
      terminal.write(message.data)
      break
      
    case 'error':
      console.error('Error:', message.message)
      break
  }
}

// Enviar comando
function sendCommand(cmd) {
  ws.send(JSON.stringify({
    type: 'input',
    data: cmd + '\n'
  }))
}
```

## Limitações

- Apenas um terminal por container por cliente WebSocket
- Shell padrão: `/bin/sh` (pode variar por imagem)
- Não suporta operações que requerem TTY especial ainda

## Próximas Melhorias

- [ ] Suporte a múltiplos terminais simultâneos
- [ ] Histórico de comandos
- [ ] Upload/download de arquivos
- [ ] Suporte a diferentes shells (bash, zsh, etc.)

