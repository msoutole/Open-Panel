# 🚀 OpenPanel - Guia de Configuração e Teste Manual

## ✅ Status do Projeto

### O que já está configurado:
- ✅ Dependências instaladas (`npm install`)
- ✅ Arquivo `.env` criado no root
- ✅ Arquivo `.env.local` criado em `apps/web/`
- ✅ Frontend **compilado com sucesso** (`npm run build:web`)
- ✅ Estrutura do projeto validada

### ⚠️ O que precisa ser configurado manualmente:

#### 1. **Docker** (Obrigatório)
O projeto depende de serviços Docker que não estão disponíveis neste ambiente. Você precisa:

- Instalar Docker e Docker Compose
- Iniciar os serviços com `docker-compose up -d`

#### 2. **Prisma Client** (Obrigatório para API)
Devido a restrições de rede, o Prisma Client não foi gerado automaticamente. Após iniciar o Docker, execute:

```bash
npm run db:generate
npm run db:push
```

---

## 📋 Instruções de Setup Completo

### Passo 1: Verificar Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** >= 18.0.0 (recomendado 20+)
- **npm** >= 10.0.0
- **Docker** e **Docker Compose**

```bash
# Verificar versões
node -v
npm -v
docker -v
docker-compose -v
```

---

### Passo 2: Iniciar Serviços Docker

Os seguintes serviços serão iniciados:
- **PostgreSQL** (porta 5432) - Banco de dados principal com pgvector
- **Redis** (porta 6379) - Cache e filas de jobs
- **Ollama** (porta 11434) - LLM local para IA
- **Traefik** (portas 80/443/8080) - Reverse proxy

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar se os serviços estão rodando
docker ps

# Verificar logs se necessário
docker logs openpanel-postgres
docker logs openpanel-redis
docker logs openpanel-ollama
docker logs openpanel-traefik
```

---

### Passo 3: Aguardar PostgreSQL Ficar Pronto

Aguarde o PostgreSQL inicializar (pode levar 30-60 segundos):

```bash
# Verificar status de saúde do PostgreSQL
docker inspect --format='{{.State.Health.Status}}' openpanel-postgres

# Deve retornar "healthy" quando estiver pronto
```

---

### Passo 4: Configurar Banco de Dados

Com o PostgreSQL rodando, gere o Prisma Client e sincronize o schema:

```bash
# Gerar Prisma Client
npm run db:generate

# Sincronizar schema com o banco (cria as tabelas)
npm run db:push

# Opcional: Abrir Prisma Studio para visualizar o banco
npm run db:studio
```

---

### Passo 5: Iniciar os Serviços

#### Opção 1: Iniciar tudo de uma vez (API + Frontend)

```bash
npm run dev
```

#### Opção 2: Iniciar separadamente (recomendado para debugging)

**Terminal 1 - API:**
```bash
npm run dev:api
# API estará disponível em http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev:web
# Frontend estará disponível em http://localhost:3000
```

---

### Passo 6: Verificar Serviços

Após iniciar, verifique se os serviços estão respondendo:

1. **Frontend:** http://localhost:3000
2. **API Health Check:** http://localhost:3001/health
3. **Traefik Dashboard:** http://localhost:8080 (se TRAEFIK_DASHBOARD=true)
4. **Ollama:** http://localhost:11434/api/tags

```bash
# Testar health da API
curl http://localhost:3001/health

# Deve retornar algo como:
# {"status":"ok","timestamp":"2025-11-26T...","version":"0.1.0"}
```

---

## 🔧 Configurações Importantes

### Variáveis de Ambiente

#### Backend (`.env` no root):
- ✅ `DATABASE_URL` - Configurado para `localhost:5432`
- ✅ `REDIS_URL` - Configurado para `localhost:6379`
- ✅ `JWT_SECRET` - Configurado (trocar em produção!)
- ✅ `API_PORT=3001`
- ⚠️ `CORS_ORIGIN=http://localhost:3000` - Permite frontend acessar API

#### Frontend (`apps/web/.env.local`):
- ✅ `VITE_API_URL=http://localhost:3001`
- ✅ Feature flags habilitadas

---

## 🧪 Testes Manuais Sugeridos

### 1. Testar Frontend (Login/Registro)
1. Acesse http://localhost:3000
2. Tente criar uma conta
3. Faça login
4. Navegue pelas páginas (Dashboard, Projects, etc)

### 2. Testar API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Registro de usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

### 3. Testar WebSocket (Logs de Containers)
1. Crie um projeto no frontend
2. Inicie um container
3. Abra a página de logs
4. Verifique se os logs aparecem em tempo real via WebSocket

### 4. Testar Integração Docker
1. Crie um projeto do tipo "WEB" ou "API"
2. Configure Git URL ou Docker image
3. Faça deploy
4. Verifique se o container foi criado: `docker ps`

---

## 🐛 Troubleshooting

### API não inicia - Erro Prisma Client

**Problema:** `Error: @prisma/client did not initialize yet`

**Solução:**
```bash
cd apps/api
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

### PostgreSQL não fica "healthy"

**Problema:** `docker inspect` mostra "unhealthy" ou "starting"

**Solução:**
```bash
# Verificar logs
docker logs openpanel-postgres

# Reiniciar container
docker-compose restart postgres

# Se persistir, remover e recriar
docker-compose down
docker volume rm openpanel_postgres-data
docker-compose up -d
```

### Redis "Connection refused"

**Problema:** API não consegue conectar ao Redis

**Solução:**
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Testar conexão
docker exec -it openpanel-redis redis-cli -a changeme ping
# Deve retornar "PONG"
```

### Porta já em uso

**Problema:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solução:**
```bash
# Descobrir processo usando a porta
lsof -i :3000
# ou
netstat -tulpn | grep 3000

# Matar processo
kill -9 <PID>

# Ou mudar porta em .env
# API_PORT=3002
```

### CORS Error no Frontend

**Problema:** `Access-Control-Allow-Origin` error no browser

**Solução:** Verificar `.env`:
```bash
CORS_ORIGIN=http://localhost:3000
```

E reiniciar a API.

---

## 📊 Verificar Status dos Serviços

```bash
# Verificar todos os containers
docker-compose ps

# Verificar logs da API (terminal separado)
docker-compose logs -f

# Verificar uso de recursos
docker stats

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados!)
docker-compose down -v
```

---

## 🔐 Segurança - IMPORTANTE!

Antes de colocar em produção:

1. **Trocar senhas padrão:**
   - `POSTGRES_PASSWORD=changeme` ❌
   - `REDIS_PASSWORD=changeme` ❌
   - `JWT_SECRET` (usar >= 32 chars aleatórios) ❌

2. **Gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. **Configurar CORS adequadamente:**
   - Trocar `http://localhost:3000` pelo domínio real

---

## 📚 Recursos Adicionais

- **Documentação Prisma:** https://www.prisma.io/docs/
- **Hono Framework:** https://hono.dev/
- **Docker Compose:** https://docs.docker.com/compose/
- **React + Vite:** https://vitejs.dev/

---

## ✅ Checklist Final

Antes de considerar o setup completo, verifique:

- [ ] Docker está instalado e rodando
- [ ] `docker-compose up -d` executado com sucesso
- [ ] PostgreSQL está "healthy" (`docker inspect openpanel-postgres`)
- [ ] Redis está rodando (`docker ps | grep redis`)
- [ ] Prisma Client gerado (`npm run db:generate`)
- [ ] Schema sincronizado (`npm run db:push`)
- [ ] API inicia sem erros (`npm run dev:api`)
- [ ] Frontend inicia sem erros (`npm run dev:web`)
- [ ] Health check responde: `curl http://localhost:3001/health`
- [ ] Frontend carrega no browser: http://localhost:3000
- [ ] Consegue fazer registro/login

---

## 🎉 Pronto para Desenvolvimento!

Após completar o setup, você pode:
- Criar usuários e equipes
- Criar projetos e fazer deploys
- Gerenciar containers Docker
- Configurar domínios e SSL
- Usar o assistente de IA (Ollama)
- Agendar backups automáticos

**Comandos úteis para desenvolvimento:**
```bash
# Type checking
npm run type-check

# Build production
npm run build

# Database studio (GUI)
npm run db:studio

# Logs em tempo real
docker-compose logs -f api
```

---

**Desenvolvido por:** Matheus Souto Leal
**Licença:** MIT
**Repositório:** https://github.com/msoutole/openpanel
