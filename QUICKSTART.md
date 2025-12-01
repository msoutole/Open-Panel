# ⚡ OpenPanel - Quick Start

## 🚀 Início Rápido (5 minutos)

### Pré-requisitos
- Node.js >= 18
- Docker e Docker Compose

### Setup Automático

```bash
# 1. Execute o script de setup (recomendado)
./setup.sh
```

**Ou manualmente:**

```bash
# 2. Copiar variáveis de ambiente (se ainda não fez)
cp .env.example .env

# 3. Instalar dependências (se ainda não fez)
npm install

# 4. Iniciar serviços Docker
docker-compose up -d

# 5. Aguardar PostgreSQL ficar pronto (30-60 segundos)
# Verificar com:
docker inspect --format='{{.State.Health.Status}}' openpanel-postgres

# 6. Configurar banco de dados
npm run db:generate
npm run db:push

# 7. Iniciar aplicação
npm run dev
```

### Acessar Aplicação

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **API Health:** http://localhost:3001/health
- **Traefik Dashboard:** http://localhost:8080

---

## 🔍 Verificar Status

```bash
# Script de verificação rápida
./check-services.sh

# Ou manualmente
docker ps                           # Ver containers rodando
curl http://localhost:3001/health   # Testar API
curl http://localhost:3000          # Testar Frontend
```

---

## 🎯 Primeiro Uso

1. Acesse http://localhost:3000
2. Clique em "Registrar"
3. Crie uma conta (exemplo: test@example.com / Test123456!)
4. Faça login
5. Crie seu primeiro projeto!

---

## 🛑 Parar Serviços

```bash
# Parar aplicação (Ctrl+C no terminal)
# Parar Docker
docker-compose down

# Parar e remover dados (⚠️ CUIDADO!)
docker-compose down -v
```

---

## 🐛 Problemas?

### API não inicia
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Regenerar Prisma Client
npm run db:generate
```

### Porta em uso
```bash
# Descobrir o que está usando a porta
lsof -i :3000    # Frontend
lsof -i :3001    # API

# Mudar porta em .env se necessário
```

### PostgreSQL não fica "healthy"
```bash
# Ver logs
docker logs openpanel-postgres

# Reiniciar
docker-compose restart postgres
```

---

## 📚 Próximos Passos

- Ver [SETUP_GUIDE.md](./SETUP_GUIDE.md) para guia completo
- Ver [CLAUDE.md](./CLAUDE.md) para arquitetura do projeto
- Ver [README.md](./README.md) para documentação geral

---

## 🔐 Segurança

**ANTES DE PRODUÇÃO, trocar:**
- `JWT_SECRET` (gerar 64+ caracteres aleatórios)
- `POSTGRES_PASSWORD` (trocar "changeme")
- `REDIS_PASSWORD` (trocar "changeme")
- `CORS_ORIGIN` (domínio real)

---

**Dúvidas?** Consulte a documentação completa ou abra uma issue no GitHub.
