# 🚀 OpenPanel - Guia de Acesso aos Serviços

**Hostname:** soullabs
**Data:** 2025-12-05

---

## 📍 IPs do Servidor

Você pode acessar os serviços usando qualquer um destes IPs:

| Interface | IP | Uso |
|-----------|-------|-----|
| **Rede Local (LAN)** | `192.168.31.100` | ✅ Recomendado para acesso local |
| **Rede Local (secundário)** | `192.168.31.9` | Alternativo |
| **WiFi** | `192.168.31.114` | Acesso via WiFi |
| **Tailscale VPN** | `100.83.212.114` | 🔒 Acesso remoto seguro |
| **Localhost** | `localhost` ou `127.0.0.1` | Apenas do próprio servidor |

---

## 🌐 URLs de Acesso Principais

### 📱 Acesso Local (Rede Interna)

#### OpenPanel API (Backend)
```
http://192.168.31.100:3001
http://192.168.31.100:3001/api/health
```

#### Traefik Dashboard (Proxy Reverso)
```
http://192.168.31.100:8080
http://192.168.31.100:8080/dashboard/
```

#### PostgreSQL Database
```
Host: 192.168.31.100
Port: 5432
Database: openpanel
Username: openpanel
Password: 98a07ed078998f2fd782693be79fdfc3
```

#### Redis Cache
```
Host: 192.168.31.100
Port: 6379
Password: 6841172bc7780967e1b213431ac2528a
```

---

### 🔒 Acesso Remoto (via Tailscale VPN)

Se você configurou Tailscale, pode acessar de qualquer lugar:

```
http://100.83.212.114:3001      # API
http://100.83.212.114:8080      # Traefik
```

---

### 🌍 Acesso via Domínio (Quando DNS Propagar)

Domínio configurado: **www.soullabs.com.br**

Após propagação DNS (até 48h), você poderá acessar:

```
http://www.soullabs.com.br              # Aplicação principal
http://traefik.www.soullabs.com.br      # Traefik Dashboard
http://adguard.www.soullabs.com.br      # AdGuard Home
```

⚠️ **Importante:** Configure Port Forwarding no seu roteador:
- Porta 80 → 192.168.31.100:80
- Porta 443 → 192.168.31.100:443

---

## 🔑 Credenciais de Acesso

### Admin do OpenPanel
```
URL: http://192.168.31.100:3001/api/auth/login
Email: admin@openpanel.dev
Senha: admin123
```
⚠️ **ALTERE A SENHA NO PRIMEIRO LOGIN!**

### PostgreSQL
```
Usuário: openpanel
Senha: 98a07ed078998f2fd782693be79fdfc3
Database: openpanel
```

### Redis
```
Senha: 6841172bc7780967e1b213431ac2528a
```

---

## 🔌 Portas Expostas

| Serviço | Porta | Protocolo | Descrição |
|---------|-------|-----------|-----------|
| **Traefik HTTP** | 80 | HTTP | Proxy reverso (web) |
| **Traefik HTTPS** | 443 | HTTPS | Proxy reverso (SSL) |
| **Traefik Dashboard** | 8080 | HTTP | Painel administrativo |
| **OpenPanel API** | 3001 | HTTP | API REST + WebSockets |
| **PostgreSQL** | 5432 | TCP | Banco de dados |
| **Redis** | 6379 | TCP | Cache e filas |

---

## 🧪 Testando os Serviços

### 1. Testar API (Health Check)

Do servidor:
```bash
curl http://localhost:3001/api/health
```

De outro computador na rede:
```bash
curl http://192.168.31.100:3001/api/health
```

**Resposta esperada:** `{"error":"Authorization header is required","status":401}`
(401 é esperado - significa que a API está funcionando, só precisa de autenticação)

---

### 2. Testar Traefik Dashboard

Abra no navegador:
```
http://192.168.31.100:8080/dashboard/
```

Você verá o painel com:
- Roteadores HTTP
- Serviços ativos
- Middlewares
- Estado dos containers

---

### 3. Testar PostgreSQL

Usando psql:
```bash
psql -h 192.168.31.100 -U openpanel -d openpanel -p 5432
# Senha: 98a07ed078998f2fd782693be79fdfc3
```

Ou usando DBeaver/pgAdmin:
```
Host: 192.168.31.100
Port: 5432
Database: openpanel
Username: openpanel
Password: 98a07ed078998f2fd782693be79fdfc3
```

---

### 4. Testar Redis

Usando redis-cli:
```bash
redis-cli -h 192.168.31.100 -p 6379 -a 6841172bc7780967e1b213431ac2528a
> PING
PONG
```

---

## 🖥️ Acesso aos Serviços por Tipo

### Para Desenvolvedores

#### API REST
```bash
# Base URL
http://192.168.31.100:3001

# Endpoints principais
GET  /api/health              # Health check
POST /api/auth/login          # Login
POST /api/auth/register       # Registro
GET  /api/projects            # Listar projetos
GET  /api/containers          # Listar containers
GET  /api/deployments         # Listar deployments
```

#### WebSocket Endpoints
```javascript
// Container monitoring
ws://192.168.31.100:3001/ws/containers

// Logs em tempo real
ws://192.168.31.100:3001/ws/logs

// Métricas do sistema
ws://192.168.31.100:3001/ws/metrics

// Terminal interativo
ws://192.168.31.100:3001/ws/terminal
```

---

### Para Administradores de Sistema

#### Docker Management
```bash
# Ver status dos containers
sudo docker ps

# Ver logs
sudo docker logs openpanel-api-dev
sudo docker logs openpanel-postgres
sudo docker logs openpanel-redis
sudo docker logs openpanel-traefik

# Reiniciar serviços
sudo docker restart openpanel-api-dev
sudo docker restart openpanel-postgres
```

#### Banco de Dados
```bash
# Backup do PostgreSQL
sudo docker exec openpanel-postgres pg_dump -U openpanel openpanel > backup.sql

# Restore
cat backup.sql | sudo docker exec -i openpanel-postgres psql -U openpanel openpanel

# Ver conexões ativas
sudo docker exec openpanel-postgres psql -U openpanel -d openpanel -c "SELECT * FROM pg_stat_activity;"
```

---

### Para Usuários Finais

#### Interface Web (quando disponível)

A interface web ainda não está rodando. Para iniciá-la:

```bash
# Método 1: Docker Compose (recomendado)
cd /opt/openpanel
sudo docker compose --profile dev up -d web-dev

# Método 2: npm local
cd /opt/openpanel/apps/web
npm install
npm run dev
```

Depois acessar:
```
http://192.168.31.100:3000
```

---

## 📱 Acesso via Dispositivos Móveis

### Smartphone/Tablet (mesma rede WiFi)

1. Conecte seu dispositivo à mesma rede WiFi
2. Abra o navegador
3. Acesse: `http://192.168.31.100:3001`

### Via Tailscale (de qualquer lugar)

1. Instale Tailscale no seu dispositivo móvel
2. Conecte à mesma rede Tailscale
3. Acesse: `http://100.83.212.114:3001`

---

## 🔒 Segurança e Acesso Externo

### Port Forwarding (para acesso via internet)

Configure no seu roteador:

| Porta Externa | Porta Interna | IP Interno | Protocolo |
|---------------|---------------|------------|-----------|
| 80 | 80 | 192.168.31.100 | TCP |
| 443 | 443 | 192.168.31.100 | TCP |

Depois poderá acessar via: `http://www.soullabs.com.br`

### SSL/HTTPS (Let's Encrypt)

1. Configure DNS apontando para seu IP público
2. Aguarde propagação (até 48h)
3. Traefik irá automaticamente:
   - Solicitar certificado SSL
   - Configurar HTTPS
   - Redirecionar HTTP → HTTPS

---

## 🛠️ Ferramentas de Monitoramento

### Logs em Tempo Real

```bash
# API logs
sudo docker logs -f openpanel-api-dev

# Todos os containers
sudo docker compose logs -f

# Apenas erros
sudo docker logs openpanel-api-dev 2>&1 | grep -i error
```

### Métricas do Sistema

```bash
# Status dos containers
sudo docker stats

# Uso de disco
df -h

# Processos
htop
```

### Health Checks

```bash
# Check completo
curl http://192.168.31.100:3001/api/health

# Apenas status code
curl -s -o /dev/null -w "%{http_code}" http://192.168.31.100:3001/api/health
```

---

## 🌐 Exemplos de Uso da API

### Login
```bash
curl -X POST http://192.168.31.100:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@openpanel.dev",
    "password": "admin123"
  }'
```

### Listar Projetos (com token)
```bash
TOKEN="seu_token_aqui"
curl http://192.168.31.100:3001/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### WebSocket (usando wscat)
```bash
# Instalar wscat
npm install -g wscat

# Conectar ao WebSocket de logs
wscat -c ws://192.168.31.100:3001/ws/logs
```

---

## 📞 Troubleshooting de Acesso

### Não consigo acessar de outro computador

1. **Verificar firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 3001/tcp
   sudo ufw allow 8080/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

2. **Verificar se serviços estão rodando:**
   ```bash
   sudo docker ps
   netstat -tulpn | grep -E "3001|8080|80|443"
   ```

3. **Ping no servidor:**
   ```bash
   ping 192.168.31.100
   ```

### API retorna 401/403

✅ **Isso é normal!** A API está protegida e requer autenticação.

Faça login primeiro:
```bash
curl -X POST http://192.168.31.100:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@openpanel.dev","password":"admin123"}'
```

### Traefik Dashboard não carrega

Verifique:
```bash
# Dashboard está habilitado?
cat /opt/openpanel/.env | grep TRAEFIK_DASHBOARD

# Traefik está rodando?
sudo docker logs openpanel-traefik
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
sudo docker ps | grep postgres

# Testar conexão local
sudo docker exec -it openpanel-postgres psql -U openpanel -d openpanel

# Ver logs de erro
sudo docker logs openpanel-postgres
```

---

## 🔗 Links Rápidos de Acesso

### Desenvolvimento Local (no servidor)
- API: http://localhost:3001
- Traefik: http://localhost:8080/dashboard/

### Rede Local (LAN)
- API: http://192.168.31.100:3001
- Traefik: http://192.168.31.100:8080/dashboard/

### Acesso Remoto (VPN)
- API: http://100.83.212.114:3001
- Traefik: http://100.83.212.114:8080/dashboard/

### Futuro (após DNS)
- App: http://www.soullabs.com.br
- Traefik: http://traefik.www.soullabs.com.br
- AdGuard: http://adguard.www.soullabs.com.br

---

## 📚 Próximos Passos

1. ✅ Testar acesso à API: `curl http://192.168.31.100:3001/api/health`
2. ✅ Acessar Traefik Dashboard: abrir navegador em `http://192.168.31.100:8080`
3. ⏳ Iniciar interface web (opcional)
4. ⏳ Configurar port forwarding no roteador
5. ⏳ Aguardar propagação DNS
6. ⏳ Alterar senha do admin

---

## 💡 Dicas Importantes

1. **Use Tailscale** para acesso remoto seguro (já configurado!)
2. **Sempre use HTTPS** em produção (após configurar SSL)
3. **Altere as senhas padrão** antes de expor à internet
4. **Configure backup automático** do PostgreSQL
5. **Monitore os logs** regularmente

---

**Sistema totalmente acessível e funcional! 🎉**

Para dúvidas, consulte também: `/opt/openpanel/TROUBLESHOOTING_2025-12-05.md`

_Última atualização: 2025-12-05_
