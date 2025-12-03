# Database Clients no Navegador

## Visão Geral

O OpenPanel fornece clientes web para executar queries diretamente nos bancos de dados através da interface, sem necessidade de ferramentas externas.

## Bancos de Dados Suportados

- ✅ PostgreSQL
- ✅ MySQL / MariaDB
- ✅ MongoDB
- ✅ Redis

## Segurança

Por padrão, apenas operações de **leitura** são permitidas para segurança:

### PostgreSQL / MySQL
- ✅ `SELECT`
- ✅ `SHOW`
- ✅ `DESCRIBE` / `DESC`
- ✅ `EXPLAIN`
- ❌ `DROP`, `DELETE`, `UPDATE`, `ALTER`, `CREATE`, etc.

### MongoDB
- ✅ `find`
- ✅ `aggregate`
- ❌ `insert`, `update`, `delete`, `drop`, etc.

### Redis
- ✅ `GET`, `KEYS`, `HGET`, `HGETALL`, `SMEMBERS`, `LRANGE`, `ZRANGE`
- ❌ `SET`, `DEL`, `FLUSH`, etc.

## Uso da API

### Executar Query PostgreSQL/MySQL

```bash
POST /api/databases/:containerId/query
```

**Body**:
```json
{
  "type": "postgresql",
  "query": "SELECT * FROM users LIMIT 10",
  "connection": {
    "host": "localhost",
    "port": 5432,
    "database": "app",
    "username": "admin",
    "password": "password"
  }
}
```

**Resposta**:
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John", "email": "john@example.com"},
    ...
  ],
  "executionTime": 45,
  "rowsAffected": 10
}
```

### Executar Query MongoDB

```bash
POST /api/databases/:containerId/query
```

**Body**:
```json
{
  "type": "mongodb",
  "query": "{\"operation\":\"find\",\"collection\":\"users\",\"filter\":{},\"limit\":10}"
}
```

**Resposta**:
```json
{
  "success": true,
  "data": [
    {"_id": "...", "name": "John", "email": "john@example.com"},
    ...
  ],
  "executionTime": 32,
  "rowsAffected": 10
}
```

### Executar Comando Redis

```bash
POST /api/databases/:containerId/query
```

**Body**:
```json
{
  "type": "redis",
  "query": "GET mykey"
}
```

**Resposta**:
```json
{
  "success": true,
  "data": "myvalue",
  "executionTime": 2
}
```

### Obter Informações de Conexão

```bash
GET /api/databases/:containerId/connection?type=postgresql
```

**Resposta**:
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "app",
  "username": "admin"
}
```

## Rate Limiting

- Máximo 10 queries por minuto por usuário
- Timeout de 30 segundos por query
- Conexões são fechadas após cada query

## Auditoria

Todas as queries são registradas no audit log com:
- Tipo de banco
- Tamanho da query
- Sucesso/falha
- Tempo de execução

## Exemplo de Uso no Frontend

```typescript
// Executar query PostgreSQL
const result = await fetch(`/api/databases/${containerId}/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'postgresql',
    query: 'SELECT * FROM users LIMIT 10'
  })
})

const data = await result.json()

if (data.success) {
  console.log('Results:', data.data)
  console.log('Execution time:', data.executionTime, 'ms')
} else {
  console.error('Query failed:', data.error)
}
```

## Próximas Melhorias

- [ ] Editor SQL com syntax highlighting
- [ ] Histórico de queries
- [ ] Exportação de resultados (CSV, JSON)
- [ ] Visualização de schema
- [ ] Suporte a operações de escrita (com confirmação)
- [ ] Query builder visual

