# 🔌 Mapeamento Completo de Portas do Servidor

**Data:** 2025-12-05  
**Servidor:** soullabs  
**Status:** ✅ Verificado e Documentado

---

## 📊 Portas em Uso no Servidor

### Verificação Real (netstat/ss)

| Porta | Protocolo | Processo | Serviço | Status |
|-------|-----------|----------|---------|--------|
| **80** | TCP | docker-proxy | Traefik HTTP | ✅ Ativo |
| **443** | TCP | docker-proxy | Traefik HTTPS | ✅ Ativo |
| **8080** | TCP | docker-proxy | Traefik Dashboard | ✅ Ativo |
| **3000** | TCP | RocketChat | RocketChat Server (snap) | ⚠️ Outro serviço |
| **3001** | TCP | docker-proxy | API Dev | ✅ Ativo |
| **5432** | TCP | docker-proxy | PostgreSQL | ✅ Ativo |
| **6379** | TCP | docker-proxy | Redis | ✅ Ativo |
| **27017** | TCP | mongod | MongoDB (Host/RocketChat?) | ⚠️ Outro serviço |

---

## 🐳 Containers Docker em Execução

### Containers Ativos

| Container | Porta Host | Porta Container | Serviço | Status |
|-----------|-----------|-----------------|---------|--------|
| `openpanel-traefik` | 80, 443, 8080 | 80, 443, 8080 | Traefik | ✅ Running |
| `openpanel-api-dev` | 3001 | 3001 | API Dev | ✅ Running |
| `openpanel-postgres` | 5432 | 5432 | PostgreSQL | ✅ Running |
| `openpanel-redis` | 6379 | 6379 | Redis | ✅ Running |
| `openpanel-tailscale` | - | - | Tailscale VPN | ✅ Running |
| `openpanel-adguard` | - | - | AdGuard | ✅ Running (sem portas expostas) |

---

## 📋 Mapeamento Completo por Ambiente

### 🌐 Infraestrutura Compartilhada

| Serviço | Porta Host | Porta Container | Variável Env | Status |
|---------|-----------|-----------------|--------------|--------|
| **Traefik HTTP** | 80 | 80 | - | ✅ Configurado |
| **Traefik HTTPS** | 443 | 443 | - | ✅ Configurado |
| **Traefik Dashboard** | 8080 | 8080 | - | ✅ Configurado |
| **PostgreSQL** | 5432 | 5432 | `POSTGRES_PORT` | ✅ Configurado |
| **Redis** | 6379 | 6379 | `REDIS_PORT` | ✅ Configurado |

### 🔧 Ambiente DEV

| Serviço | Porta Host | Porta Container | Variável Env | Status |
|---------|-----------|-----------------|--------------|--------|
| **Web Dev** | 3000 | 3000 | `APP_PORT` | ⚠️ Rodando no host |
| **API Dev** | 3001 | 3001 | `API_PORT` | ✅ Rodando no Docker |

### 🔄 Ambiente PRE (Staging)

| Serviço | Porta Host | Porta Container | Variável Env | Status |
|---------|-----------|-----------------|--------------|--------|
| **API Pre** | 3002 | 3001 | `API_PORT` | ⏸️ Não iniciado |
| **Web Pre** | 3003 | 80 | - | ⏸️ Não iniciado |

### 🎯 Ambiente PROD (Produção)

| Serviço | Porta Host | Porta Container | Variável Env | Status |
|---------|-----------|-----------------|--------------|--------|
| **API Prod** | 3004 | 3001 | `API_PORT` | ⏸️ Não iniciado |
| **Web Prod** | 3005 | 80 | - | ⏸️ Não iniciado |

### 🤖 Serviços Opcionais

| Serviço | Porta Host | Porta Container | Variável Env | Status |
|---------|-----------|-----------------|--------------|--------|
| **Ollama** | 11434 | 11434 | `OLLAMA_PORT` | ⏸️ Não iniciado |
| **MongoDB** | 27017 | 27017 | `MONGO_PORT` | ⚠️ Rodando no host |
| **AI Service** | 8000 | 8000 | `PORT` | ⏸️ Não iniciado |
| **MCP Server** | 3006 | 3005 | `MCP_SERVER_PORT` | ⏸️ Não iniciado |
| **AdGuard DNS** | 53 | 53 | `ADGUARD_DNS_PORT` | ⚠️ Container sem portas expostas |
| **AdGuard Admin** | 3030 | 3000 | `ADGUARD_ADMIN_PORT` | ⚠️ Container sem portas expostas |
| **AdGuard DoH** | 853 | 853 | - | ⏸️ Não iniciado |
| **AdGuard DoQ** | 784 | 784 | - | ⏸️ Não iniciado |

---

## ⚠️ Observações e Inconsistências

### 1. Porta 3000 - RocketChat
- **Status:** ⚠️ RocketChat Server rodando no host (snap)
- **Processo:** `/snap/rocketchat-server/1767/main.js`
- **Problema:** Conflito potencial com Web Dev (porta 3000)
- **Observação:** OpenPanel Web Dev está configurado para usar porta 3000, mas RocketChat já está usando
- **Solução:** Se precisar rodar Web Dev, considerar usar outra porta ou parar RocketChat temporariamente

### 2. Porta 27017 - MongoDB
- **Status:** ⚠️ MongoDB rodando diretamente no host (processo mongod)
- **Container:** `openpanel-mongo` não está iniciado
- **Problema:** MongoDB configurado para Docker mas já existe instância no host
- **Observação:** Pode ser usado pelo RocketChat ou outro serviço
- **Solução:** Verificar qual serviço usa e decidir se MongoDB deve rodar no host ou no Docker

### 3. AdGuard - Sem Portas Expostas
- **Status:** ⚠️ Container rodando mas portas não expostas
- **Problema:** Container pode não ter iniciado corretamente ou portas não estão mapeadas
- **Solução:** Verificar logs do container e configuração de portas

---

## 🔍 Comandos para Verificação

### Verificar Portas em Uso
```bash
sudo netstat -tulpn | grep LISTEN | grep -E ":(300[0-9]|5432|6379|8000|8080|27017|11434|3030|53|443|80)"
```

### Verificar Containers e Portas
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Verificar Processos Node.js
```bash
ps aux | grep node | grep -v grep
```

### Verificar MongoDB
```bash
sudo systemctl status mongod
# ou
ps aux | grep mongod
```

---

## 📝 Configuração no docker-compose.yml

### Portas Configuradas (Resumo)

```yaml
# Infraestrutura
traefik:     80, 443, 8080
postgres:    ${POSTGRES_PORT:-5432}
redis:       ${REDIS_PORT:-6379}

# Dev
api-dev:     3001:3001
web-dev:     3000:3000

# Pre
api-pre:     3002:3001
web-pre:     3003:80

# Prod
api-prod:    3004:3001
web-prod:    3005:80

# Opcionais
ollama:      ${OLLAMA_PORT:-11434}:11434
mongo:       ${MONGO_PORT:-27017}:27017
ai-service:  8000:8000
mcp-server:  ${MCP_SERVER_PORT:-3006}:3005
adguard:     
  - ${ADGUARD_DNS_PORT:-53}:53/tcp
  - ${ADGUARD_DNS_PORT:-53}:53/udp
  - ${ADGUARD_ADMIN_PORT:-3030}:3000/tcp
  - 853:853/tcp
  - 784:784/udp
```

---

## ✅ Equalização (Ajustes Necessários)

### 1. Verificar Web Dev
```bash
# Verificar se há processo Node.js rodando
ps aux | grep "node.*3000" | grep -v grep

# Se houver, parar e iniciar container
pkill -f "node.*3000"
docker compose --profile dev up -d --build --force-recreate web-dev
```

### 2. Verificar MongoDB
```bash
# Opção A: Parar MongoDB do host e usar Docker
sudo systemctl stop mongod
sudo systemctl disable mongod
docker compose up -d mongo

# Opção B: Manter MongoDB no host (atualizar docker-compose.yml)
# Remover serviço mongo ou ajustar MONGO_PORT
```

### 3. Verificar AdGuard
```bash
# Verificar logs
docker logs openpanel-adguard

# Recriar container com portas
docker compose --profile adguard down
docker compose --profile adguard up -d --build --force-recreate adguard

# Verificar portas
docker port openpanel-adguard
```

---

## 📊 Tabela de Conflitos Potenciais

| Porta | Uso Atual | Uso Esperado | Conflito |
|-------|-----------|--------------|----------|
| 3000 | Node.js (host) | Web Dev (Docker) | ⚠️ SIM |
| 27017 | MongoDB (host) | MongoDB (Docker) | ⚠️ SIM |
| 53 | - | AdGuard DNS | ❌ Nenhum |
| 3030 | - | AdGuard Admin | ❌ Nenhum |
| 3002-3006 | - | Pre/Prod/MCP | ❌ Nenhum |

---

## 🎯 Recomendações

### Imediatas
1. ✅ Portas 80, 443, 8080, 3001, 5432, 6379 estão corretas
2. ⚠️ Investigar por que Web Dev está rodando no host
3. ⚠️ Decidir sobre MongoDB (host vs Docker)
4. ⚠️ Verificar configuração do AdGuard

### Futuras
1. Documentar processo de migração MongoDB para Docker
2. Criar script para verificar conflitos de portas
3. Adicionar validação de portas nos scripts de start

---

## 📚 Referências

- [MAPEAMENTO_PORTAS.md](./MAPEAMENTO_PORTAS.md) - Mapeamento teórico
- [CORRECAO_PORTAS_2025-12-05.md](./CORRECAO_PORTAS_2025-12-05.md) - Correções anteriores
- [docker-compose.yml](../docker-compose.yml) - Configuração atual

---

_Documento criado em 2025-12-05 após verificação real do servidor_

