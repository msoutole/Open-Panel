## 🔌 API WebSocket (Resumo)

Gateways em tempo real com autenticação JWT (mesmo token da API REST).  
Envie a mensagem `{ "type": "auth", "token": "<JWT>" }` imediatamente após conectar; conexões não autenticadas são encerradas.

### Endpoints disponíveis
- `ws://host/ws/containers` — logs e estatísticas de containers.
- `ws://host/ws/logs` — eventos de logs agregados.
- `ws://host/ws/metrics` — métricas em tempo real.
- `ws://host/ws/terminal` — terminal interativo (exec).

### Contratos básicos
- Mensagens seguem `{ "type": string, ...payload }`.
- Respostas de erro: `{ "type": "error", "message": string }`.
- Para todos os canais, inclua IDs ou filtros necessários no payload.

#### Exemplo: containers
- Assinar logs: `{ "type": "subscribe_logs", "containerId": "<id>" }`
- Parar logs: `{ "type": "unsubscribe_logs", "containerId": "<id>" }`
- Assinar stats: `{ "type": "subscribe_stats", "containerId": "<id>", "interval": 2000 }`

#### Exemplo: terminal
- Abrir sessão: `{ "type": "open", "containerId": "<id>" }`
- Enviar comando: `{ "type": "input", "data": "ls -la\n" }`
- Encerrar: `{ "type": "close" }`

### Boas práticas
- Use wss:// em produção.
- Feche assinaturas não usadas para reduzir carga.
- Reautentique-se ao renovar tokens ou receber erros de autorização.
- Padronize reconexões exponenciais em clientes para estabilidade.
