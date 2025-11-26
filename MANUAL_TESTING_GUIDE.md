# 🧪 GUIA RÁPIDO DE TESTES MANUAIS - OPEN-PANEL

**Versão**: 1.0
**Data**: 2025-11-26
**Tempo Estimado**: 30-45 minutos

---

## 📋 PRÉ-REQUISITOS

### Softwares Necessários
- ✅ Node.js 18+ (`node --version`)
- ✅ npm 10+ (`npm --version`)
- ✅ Docker (`docker --version`)
- ✅ Docker Compose (`docker compose version`)
- ✅ Git

### Portas Disponíveis
- 3000 (Frontend)
- 3001 (API Backend)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 8080 (Traefik Dashboard)
- 11434 (Ollama)

---

## 🚀 SETUP RÁPIDO (5 min)

```bash
# 1. Navegar para o projeto
cd /home/user/Open-Panel

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com editor preferido:
nano .env  # ou vim, code, etc.

# Configurações OBRIGATÓRIAS:
# DATABASE_URL=postgresql://openpanel:changeme@localhost:5432/openpanel
# REDIS_URL=redis://:changeme@localhost:6379
# JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# 4. Iniciar infraestrutura Docker
docker compose up -d

# 5. Aguardar containers (60s)
sleep 60
docker compose ps  # Verificar todos estão "Up"

# 6. Aplicar schema do banco
npm run db:push

# 7. Verificar type-check (deve falhar se @types/node ausente)
npm run type-check
```

**⚠️ Se type-check falhar**:
```bash
cd apps/api
npm install --save-dev @types/node
cd ../..
npm run type-check  # Agora deve passar
```

---

## 🌐 INICIAR APLICAÇÃO

### Terminal 1 - Backend API
```bash
cd /home/user/Open-Panel
npm run dev:api

# Aguardar: "Server running at http://localhost:3001"
```

### Terminal 2 - Frontend Web
```bash
cd /home/user/Open-Panel
npm run dev:web

# Aguardar: "Local: http://localhost:3000"
```

---

## ✅ TESTES FUNCIONAIS

### 1. HEALTH CHECK (30s)

**1.1. API Health**
```bash
curl http://localhost:3001/health
```
✅ **Esperado**: `{"status":"ok","timestamp":"...","version":"0.1.0"}`

**1.2. Infraestrutura Docker**
```bash
docker compose ps
```
✅ **Esperado**: Todos os serviços "Up (healthy)"

**1.3. PostgreSQL**
```bash
docker compose exec postgres psql -U openpanel -d openpanel -c "SELECT version();"
```
✅ **Esperado**: Versão do PostgreSQL exibida

**1.4. Redis**
```bash
docker compose exec redis redis-cli -a changeme PING
```
✅ **Esperado**: `PONG`

---

### 2. AUTENTICAÇÃO (2 min)

**2.1. Registro de Novo Usuário**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@openpanel.dev",
    "password": "Admin123!@#"
  }' | jq
```

✅ **Esperado**:
```json
{
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@openpanel.dev"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**2.2. Login**
```bash
# Salvar token em variável
export TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@openpanel.dev",
    "password": "Admin123!@#"
  }' | jq -r '.accessToken')

echo "Token: $TOKEN"
```

✅ **Esperado**: Token JWT longo começando com `eyJ`

**2.3. Obter Perfil**
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

✅ **Esperado**: Dados do usuário logado

---

### 3. CRUD DE PROJETOS (3 min)

**3.1. Criar Projeto**
```bash
export PROJECT_ID=$(curl -s -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Application",
    "slug": "test-app",
    "description": "Aplicação de teste",
    "type": "WEB",
    "dockerImage": "nginx",
    "dockerTag": "alpine",
    "replicas": 1,
    "cpuLimit": "500m",
    "memoryLimit": "256Mi"
  }' | jq -r '.project.id')

echo "Project ID: $PROJECT_ID"
```

✅ **Esperado**: ID do projeto criado

**3.2. Listar Projetos**
```bash
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.projects | length'
```

✅ **Esperado**: `1` (ou mais se já existirem projetos)

**3.3. Obter Detalhes do Projeto**
```bash
curl http://localhost:3001/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.project.name'
```

✅ **Esperado**: `"Test Application"`

**3.4. Adicionar Variável de Ambiente**
```bash
curl -X POST http://localhost:3001/api/projects/$PROJECT_ID/envs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NODE_ENV",
    "value": "production",
    "isSecret": false
  }' | jq
```

✅ **Esperado**: Variável criada com sucesso

**3.5. Listar Env Vars**
```bash
curl http://localhost:3001/api/projects/$PROJECT_ID/envs \
  -H "Authorization: Bearer $TOKEN" | jq '.envVars | length'
```

✅ **Esperado**: `1`

---

### 4. CONTAINERS (5 min)

**4.1. Criar Container**
```bash
export CONTAINER_ID=$(curl -s -X POST http://localhost:3001/api/containers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-nginx-container",
    "image": "nginx:alpine",
    "ports": [{"host": 8090, "container": 80, "protocol": "tcp"}],
    "envVars": {"NGINX_PORT": "80"},
    "cpuLimit": "500m",
    "memoryLimit": "256Mi",
    "projectId": "'$PROJECT_ID'"
  }' | jq -r '.container.id')

echo "Container ID: $CONTAINER_ID"
```

✅ **Esperado**: ID do container

**4.2. Listar Containers**
```bash
curl http://localhost:3001/api/containers \
  -H "Authorization: Bearer $TOKEN" | jq '.containers | length'
```

✅ **Esperado**: Pelo menos `1`

**4.3. Iniciar Container**
```bash
curl -X POST http://localhost:3001/api/containers/$CONTAINER_ID/start \
  -H "Authorization: Bearer $TOKEN" | jq
```

✅ **Esperado**: `{"message":"Container started successfully"}`

**4.4. Verificar Container no Docker**
```bash
docker ps | grep test-nginx-container
```

✅ **Esperado**: Container aparece rodando

**4.5. Testar Acesso ao Container**
```bash
curl http://localhost:8090
```

✅ **Esperado**: HTML do Nginx (Welcome to nginx!)

**4.6. Ver Logs**
```bash
curl "http://localhost:3001/api/containers/$CONTAINER_ID/logs?tail=50" \
  -H "Authorization: Bearer $TOKEN" | jq '.logs'
```

✅ **Esperado**: Logs de inicialização do Nginx

**4.7. Obter Métricas**
```bash
curl http://localhost:3001/api/containers/$CONTAINER_ID/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

✅ **Esperado**: CPU, memória, rede (valores reais)

**4.8. Parar Container**
```bash
curl -X POST http://localhost:3001/api/containers/$CONTAINER_ID/stop \
  -H "Authorization: Bearer $TOKEN" | jq
```

✅ **Esperado**: Container parado com sucesso

---

### 5. DOMÍNIOS E SSL (3 min)

**5.1. Criar Domínio**
```bash
export DOMAIN_ID=$(curl -s -X POST http://localhost:3001/api/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-app.local.dev",
    "projectId": "'$PROJECT_ID'",
    "sslEnabled": true,
    "sslAutoRenew": true
  }' | jq -r '.domain.id')

echo "Domain ID: $DOMAIN_ID"
```

✅ **Esperado**: ID do domínio

**5.2. Listar Domínios do Projeto**
```bash
curl http://localhost:3001/api/domains/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.domains | length'
```

✅ **Esperado**: `1`

**5.3. Verificar Status SSL**
```bash
curl http://localhost:3001/api/ssl/$DOMAIN_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

✅ **Esperado**: Status do certificado (pode estar pendente em dev)

---

### 6. BACKUPS (2 min)

**6.1. Criar Backup**
```bash
export BACKUP_ID=$(curl -s -X POST http://localhost:3001/api/backups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "backup-teste-manual"
  }' | jq -r '.backup.id')

echo "Backup ID: $BACKUP_ID"
```

✅ **Esperado**: ID do backup

**6.2. Listar Backups**
```bash
curl http://localhost:3001/api/backups \
  -H "Authorization: Bearer $TOKEN" | jq '.backups | length'
```

✅ **Esperado**: Pelo menos `1`

---

### 7. SYSTEM HEALTH (1 min)

**7.1. Health Check Completo**
```bash
curl http://localhost:3001/api/health \
  -H "Authorization: Bearer $TOKEN" | jq
```

✅ **Esperado**:
```json
{
  "status": "healthy",
  "checks": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"},
    "docker": {"status": "healthy"},
    "disk": {"status": "healthy"}
  }
}
```

---

### 8. FRONTEND - TESTES VISUAIS (10 min)

#### 8.1. Login
1. Abrir: http://localhost:3000
2. ✅ **Verificar**: Página de login aparece
3. ✅ **Fazer login**: `admin@openpanel.dev` / `Admin123!@#`
4. ✅ **Verificar**: Redirecionamento para dashboard

#### 8.2. Dashboard
1. ✅ **Verificar**: Cards de projetos aparecem
2. ✅ **Verificar**: Gráficos de CPU/Network renderizam
3. ✅ **Clicar**: "Create Project" button
4. ✅ **Preencher**: Nome, slug, tipo
5. ✅ **Verificar**: Projeto criado aparece na lista

#### 8.3. Detalhes do Projeto
1. ✅ **Clicar**: No card do projeto "Test Application"
2. ✅ **Verificar**: Lista de serviços aparece
3. ✅ **Verificar**: Botões de ação disponíveis

#### 8.4. Detalhes do Serviço
1. ✅ **Clicar**: No serviço (nginx container)
2. ✅ **Verificar**: 8 abas aparecem
   - Overview
   - Resources
   - Logs
   - Environment
   - Domains
   - Deployments
   - Backups
   - Settings
3. ✅ **Testar**: Cada aba renderiza conteúdo
4. ✅ **Clicar**: "Start" button
5. ✅ **Verificar**: Container inicia

#### 8.5. Terminal Web
1. ✅ **Abrir**: Aba "Logs" ou componente WebTerminal
2. ✅ **Verificar**: Terminal xterm renderiza
3. ✅ **Verificar**: Logs aparecem em tempo real

#### 8.6. IA Assistant (Gemini Chat)
1. ✅ **Abrir**: Chat icon ou sidebar
2. ✅ **Digitar**: "list services"
3. ✅ **Verificar**: IA responde com lista de serviços
4. ✅ **Testar**: Comando "get system metrics"
5. ✅ **Verificar**: MCP tools executam

#### 8.7. Settings
1. ✅ **Navegar**: Settings page
2. ✅ **Verificar**: Configurações carregam
3. ✅ **Testar**: Tabs de Docker, Git, Users, Backups

#### 8.8. Security View
1. ✅ **Navegar**: Security page
2. ✅ **Verificar**: Audit logs aparecem
3. ✅ **Testar**: Filtros funcionam
4. ✅ **Clicar**: "Export CSV"
5. ✅ **Verificar**: CSV baixa com dados sanitizados

---

## 🧹 CLEANUP (OPCIONAL)

### Parar Containers de Teste
```bash
docker stop test-nginx-container
docker rm test-nginx-container
```

### Limpar Dados de Teste
```bash
# Via API (deletar recursos criados)
curl -X DELETE http://localhost:3001/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Parar Infraestrutura
```bash
docker compose down
```

### Parar Aplicação
```bash
# Ctrl+C nos terminais do dev:api e dev:web
```

---

## ❌ TROUBLESHOOTING

### Problema: Type Check Falha
**Erro**: `Cannot find type definition file for 'node'`
**Solução**:
```bash
cd apps/api
npm install --save-dev @types/node
```

### Problema: Docker Compose Falha
**Erro**: `docker-compose: command not found`
**Solução**: Usar `docker compose` (sem hífen) ou instalar Docker Compose v2

### Problema: Porta em Uso
**Erro**: `Port 3000 already in use`
**Solução**:
```bash
# Encontrar processo
lsof -i :3000
# Matar processo
kill -9 <PID>
```

### Problema: Database Connection Failed
**Erro**: `Can't reach database server`
**Solução**:
```bash
# Verificar PostgreSQL rodando
docker compose ps postgres
# Verificar logs
docker compose logs postgres
# Reiniciar
docker compose restart postgres
```

### Problema: Redis Connection Failed
**Solução**:
```bash
docker compose restart redis
```

### Problema: JWT Secret Muito Curto
**Erro**: `JWT_SECRET must be at least 32 characters`
**Solução**: Editar `.env` e usar secret mais longo

---

## 📊 CHECKLIST FINAL

### Infraestrutura
- [ ] PostgreSQL rodando e acessível
- [ ] Redis rodando e acessível
- [ ] Traefik rodando (opcional)
- [ ] Ollama rodando (opcional, para IA local)

### Backend
- [ ] API iniciada em http://localhost:3001
- [ ] Health check responde
- [ ] Migrations aplicadas
- [ ] Type check passou

### Frontend
- [ ] Web iniciado em http://localhost:3000
- [ ] Login funcional
- [ ] Dashboard renderiza
- [ ] API client conectando ao backend

### Funcionalidades
- [ ] Autenticação (register, login, me)
- [ ] Projetos (create, list, get, env vars)
- [ ] Containers (create, start, stop, logs, stats)
- [ ] Domínios (create, list)
- [ ] Backups (create, list)
- [ ] System health check

### Frontend Visual
- [ ] Login page
- [ ] Dashboard com projetos
- [ ] Detalhes de projeto
- [ ] Detalhes de serviço (8 abas)
- [ ] Terminal web
- [ ] IA Chat (Gemini)
- [ ] Settings
- [ ] Security/Audit logs

---

## ✅ PRÓXIMOS PASSOS

Após completar todos os testes:
1. Revisar relatório completo: `PROJECT_STATUS_REPORT.md`
2. Corrigir gaps identificados (seção "Gaps e Problemas")
3. Executar testes automatizados: `npm run test`
4. Preparar para deploy em staging

---

**Tempo Total Estimado**: 30-45 minutos
**Última Atualização**: 2025-11-26
**Versão**: 1.0
