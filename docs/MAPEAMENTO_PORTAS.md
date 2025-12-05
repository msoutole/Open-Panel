# 🔌 Mapeamento de Portas - OpenPanel

**Última atualização:** 2025-12-05

Este documento lista todas as portas utilizadas pela aplicação OpenPanel e seus serviços.

---

## 📋 Resumo das Portas

| Serviço | Porta Host | Porta Container | Protocolo | Ambiente | Status |
|---------|-----------|-----------------|-----------|----------|--------|
| **Traefik HTTP** | 80 | 80 | HTTP | Todos | ✅ |
| **Traefik HTTPS** | 443 | 443 | HTTPS | Todos | ✅ |
| **Traefik Dashboard** | 8080 | 8080 | HTTP | Todos | ✅ |
| **PostgreSQL** | 5432 | 5432 | TCP | Compartilhado | ✅ |
| **Redis** | 6379 | 6379 | TCP | Compartilhado | ✅ |
| **Web Dev** | Via Traefik | 3000 | HTTP | Dev | ✅ |
| **API Dev** | 3001 | 3001 | HTTP | Dev | ✅ |
| **API Pre** | 3002 | 3001 | HTTP | Pre | ✅ |
| **Web Pre** | 3003 | 80 | HTTP | Pre | ✅ |
| **API Prod** | 3004 | 3001 | HTTP | Prod | ✅ |
| **Web Prod** | 3005 | 80 | HTTP | Prod | ✅ |
| **Ollama** | 11434 | 11434 | HTTP | Opcional | ✅ |
| **MongoDB** | 27018 | 27017 | TCP | Opcional | ✅ |
| **AI Service** | 8000 | 8000 | HTTP | Opcional | ✅ |
| **MCP Server** | 3006 | 3005 | HTTP | Opcional | ✅ |
| **AdGuard DNS** | 53 | 53 | TCP/UDP | Opcional | ✅ |
| **AdGuard Admin** | 3030 | 3000 (host) | HTTP | Opcional | ✅ |
| **AdGuard DoH** | 853 | 853 | TCP | Opcional | ✅ |
| **AdGuard DoQ** | 784 | 784 | UDP | Opcional | ✅ |

---

## 🏗️ Infraestrutura Compartilhada

### Traefik (Proxy Reverso)
- **HTTP:** `80:80`
- **HTTPS:** `443:443`
- **Dashboard:** `8080:8080`
- **Descrição:** Proxy reverso e gerenciador de SSL/TLS
- **Acesso:** http://localhost:8080 (dashboard)

### PostgreSQL
- **Porta:** `5432:5432`
- **Variável:** `POSTGRES_PORT`
- **Descrição:** Banco de dados principal
- **Conexão:** `postgresql://openpanel:PASSWORD@localhost:5432/openpanel`

### Redis
- **Porta:** `6379:6379`
- **Variável:** `REDIS_PORT`
- **Descrição:** Cache e sistema de filas
- **Conexão:** `redis://:PASSWORD@localhost:6379/0`

---

## 🚀 Ambiente DEV (Desenvolvimento)

### API Dev
- **Porta Host:** `3001`
- **Porta Container:** `3001`
- **Variável:** `API_PORT` (padrão: 3001)
- **URL:** http://localhost:3001
- **Container:** `openpanel-api-dev`
- **Profile:** `dev`

### Web Dev
- **Porta Host:** `3000`
- **Porta Container:** `3000`
- **Variável:** `APP_PORT` (padrão: 3000)
- **URL:** http://localhost:3000
- **Container:** `openpanel-web-dev`
- **Profile:** `dev`

---

## 🔄 Ambiente PRE (Staging/Preview)

### API Pre
- **Porta Host:** `3002`
- **Porta Container:** `3001`
- **URL:** http://localhost:3002
- **Container:** `openpanel-api-pre`
- **Profile:** `pre`
- **Nota:** Container usa porta 3001 internamente, mapeada para 3002 no host

### Web Pre
- **Porta Host:** `3003`
- **Porta Container:** `80`
- **URL:** http://localhost:3003
- **Container:** `openpanel-web-pre`
- **Profile:** `pre`
- **Nota:** Container usa porta 80 (nginx), mapeada para 3003 no host

---

## 🎯 Ambiente PROD (Produção)

### API Prod
- **Porta Host:** `3004`
- **Porta Container:** `3001`
- **URL:** http://localhost:3004 (ou via Traefik com SSL)
- **Container:** `openpanel-api-prod`
- **Profile:** `prod`
- **Nota:** Container usa porta 3001 internamente, mapeada para 3004 no host

### Web Prod
- **Porta Host:** `3005`
- **Porta Container:** `80`
- **URL:** http://localhost:3005 (ou via Traefik com SSL)
- **Container:** `openpanel-web-prod`
- **Profile:** `prod`
- **Nota:** Container usa porta 80 (nginx), mapeada para 3005 no host

---

## 🤖 Serviços Opcionais

### Ollama (IA Local)
- **Porta:** `11434:11434`
- **Variável:** `OLLAMA_PORT` (padrão: 11434)
- **URL:** http://localhost:11434
- **Container:** `openpanel-ollama`
- **Profile:** `ollama`
- **Descrição:** Serviço para modelos de IA locais

### MongoDB
- **Porta Host:** `27018`
- **Porta Container:** `27017`
- **Variável:** `MONGO_PORT` (padrão: 27018)
- **Conexão:** `mongodb://admin:PASSWORD@localhost:27018`
- **Container:** `openpanel-mongo`
- **Descrição:** Banco de dados para serviço de IA/MCP
- **Nota:** Porta 27018 no host evita conflito com MongoDB do RocketChat (27017)

### AI Service (FastAPI)
- **Porta:** `8000:8000`
- **Variável:** `PORT` (padrão: 8000)
- **URL:** http://localhost:8000
- **Container:** `openpanel-ai-service`
- **Descrição:** Serviço de lógica de negócios em Python

### MCP Server
- **Porta Host:** `3006`
- **Porta Container:** `3005`
- **Variável:** `PORT` (padrão: 3005 no container)
- **URL:** http://localhost:3006
- **Container:** `openpanel-mcp-server`
- **Descrição:** Servidor MCP (Node.js/Express)

### AdGuard Home
- **DNS TCP/UDP:** `53` (host)
- **Admin Panel:** `3030` (host)
- **DNS-over-HTTPS:** `853` (host)
- **DNS-over-QUIC:** `784` (host)
- **Variáveis:** 
  - `ADGUARD_DNS_PORT` (padrão: 53)
  - `ADGUARD_ADMIN_PORT` (padrão: 3030)
- **Container:** `openpanel-adguard`
- **Profile:** `adguard`
- **Network Mode:** `host` (necessário para portas privilegiadas)
- **Nota:** Usa `network_mode: host` para funcionar com portas privilegiadas (53, 853, 784)

---

## ⚙️ Variáveis de Ambiente

As portas podem ser configuradas no arquivo `.env`:

```bash
# Infraestrutura
POSTGRES_PORT=5432
REDIS_PORT=6379

# Aplicação
API_PORT=3001
APP_PORT=3000

# Serviços Opcionais
OLLAMA_PORT=11434
MONGO_PORT=27018  # Porta 27018 para evitar conflito com MongoDB do RocketChat
ADGUARD_DNS_PORT=53
ADGUARD_ADMIN_PORT=3030
```

---

## 🔍 Verificação de Portas

### Listar todas as portas em uso
```bash
sudo netstat -tulpn | grep LISTEN
# ou
sudo ss -tulpn | grep LISTEN
```

### Verificar portas dos containers
```bash
sudo docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Testar conexão em uma porta
```bash
curl http://localhost:PORT
# ou
telnet localhost PORT
```

---

## ⚠️ Conflitos Resolvidos

### Anteriormente
- ❌ Web Pre usava porta 3001 (conflito com API Dev)
- ❌ Web Prod usava porta 3002 (conflito com API Pre)
- ❌ AdGuard usava porta 3000 (conflito com Web Dev)
- ❌ MCP Server usava porta 3005 (conflito com Web Prod)

### Corrigido para
- ✅ Web Pre: 3003
- ✅ API Prod: 3004
- ✅ Web Prod: 3005
- ✅ AdGuard Admin: 3030
- ✅ MCP Server Host: 3006

---

## 📚 Referências

- [docker-compose.yml](../docker-compose.yml) - Configuração completa
- [GUIA_ACESSO_SERVICOS.md](./GUIA_ACESSO_SERVICOS.md) - Guia de acesso aos serviços
- [.env.example](../.env.example) - Exemplo de variáveis de ambiente

---

**Nota:** As portas padrão podem ser alteradas via variáveis de ambiente no arquivo `.env`. Certifique-se de atualizar todas as referências quando alterar portas padrão.

