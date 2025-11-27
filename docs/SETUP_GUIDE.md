# OpenPanel Setup Guide

Instruções de setup para diferentes plataformas.

## 📋 Requisitos

- **Node.js**: v20.0.0 ou superior
- **Docker**: v29.0.0 ou superior (com Docker Compose v2)
- **npm**: v10.0.0 ou superior

## 🪟 Windows (PowerShell)

### Pré-requisitos

1. **Docker Desktop for Windows** (com WSL2 backend recomendado)
   - Download: https://www.docker.com/products/docker-desktop
   - Certifique-se de que Docker está rodando

2. **Node.js**
   - Download: https://nodejs.org/ (LTS recomendado)

### Setup

`powershell

# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Execute o script de setup
.\scripts\setup.ps1

# 3. Após conclusão, acesse

# Web: http://localhost:3000

# API: http://localhost:3001
`

### Troubleshooting

Se houver erros de permissão ao executar o PowerShell:

`powershell

# Execute como Administrator e digite:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
`

---

## 🐧 Linux / WSL2

### Pré-requisitos

1. **Docker**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose

   # Adicionar seu usuário ao grupo docker
   sudo usermod -aG docker $USER
   ```

2. **Node.js**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

### Setup

`bash

# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Execute o script de setup
bash scripts/setup.sh

# 3. Após conclusão, acesse

# Web: http://localhost:3000

# API: http://localhost:3001
`

### Permissões

Se houver erro ao executar scripts:

`bash

# Tornar scripts executáveis
chmod +x scripts/*.sh scripts/*.ps1
`

---

## 🍎 macOS

### Pré-requisitos

1. **Homebrew** (se não instalado)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Docker Desktop for Mac**
   ```bash
   brew install --cask docker
   ```

3. **Node.js**
   ```bash
   brew install node@20
   ```

### Setup

`bash

# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Execute o script de setup
bash scripts/setup.sh

# 3. Após conclusão, acesse

# Web: http://localhost:3000

# API: http://localhost:3001
`

---

## 🔧 Configuração Manual

Se preferir não usar os scripts de setup:

`bash

# 1. Criar arquivo .env
cp .env.example .env

# 2. Instalar dependências
npm install

# 3. Iniciar containers Docker
docker-compose up -d

# 4. Aguardar serviços ficarem saudáveis

# Postgres e Redis devem mostrar "healthy"
docker ps

# 5. Configurar banco de dados
npm run db:generate
npm run db:push

# 6. Iniciar desenvolvimento
npm run dev
`

---

## 🚀 Desenvolvimento

### Iniciar em modo desenvolvimento

`bash

# Windows
.\scripts\setup.ps1    # Se nunca rodou setup

npm run dev            # Inicia API + Web em paralelo
`

`bash

# Linux/macOS
bash scripts/setup.sh  # Se nunca rodou setup

npm run dev            # Inicia API + Web em paralelo
`

### Comandos úteis

`bash

# Desenvolvimento isolado
npm run dev:api         # Apenas API
npm run dev:web         # Apenas Web

# Build para produção
npm run build
npm run build:api
npm run build:web

# Database
npm run db:generate     # Gera Prisma Client
npm run db:push         # Sincroniza schema
npm run db:studio       # GUI do Prisma

# Type checking
npm run type-check

# Preview production build
npm run preview
`

### Docker

`bash

# Ver logs de um container
docker logs openpanel-api -f        # API (follow mode)
docker logs openpanel-web -f        # Web

# Parar todos os containers
docker-compose down

# Reconstruir containers
docker-compose up -d --build

# Status dos containers
docker ps

# Health check
docker inspect openpanel-postgres --format='{{.State.Health.Status}}'
`

---

## 📍 Acessar Serviços

| Serviço | URL | Credenciais |
|---------|-----|------------|
| **Web Interface** | http://localhost:3000 | Configurado durante setup |
| **API** | http://localhost:3001 | Token JWT necessário |
| **Traefik Dashboard** | http://localhost:8080 | N/A (desenvolvimento) |
| **PostgreSQL** | localhost:5432 | openpanel / changeme |
| **Redis** | localhost:6379 | changeme |

---

## 🔍 Solução de Problemas

### Docker não está rodando (Windows)

`powershell

# Iniciar Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker.exe"
`

### Permissão negada ao acessar socket Docker (Linux/WSL)

`bash

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar novo grupo
newgrp docker

# Ou fazer logout e login novamente
`

### Porta em uso

`bash

# Encontrar processo usando porta 3000

# Windows
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :3000

# Mudar porta no .env
API_PORT=3002
APP_PORT=3001
`

### Container não inicia

`bash

# Ver logs detalhados
docker-compose logs -f openpanel-api

# Reiniciar container
docker-compose restart openpanel-api

# Limpar tudo e começar do zero
docker-compose down -v
docker-compose up -d
`

---

## 📝 Variáveis de Ambiente

Arquivo `.env` principal:

`env

# Core
NODE_ENV=development
APP_URL=http://localhost:3000
APP_PORT=3000
API_PORT=3001

# Database
DATABASE_URL=postgresql://openpanel:changeme@localhost:5432/openpanel
POSTGRES_USER=openpanel
POSTGRES_PASSWORD=changeme
POSTGRES_DB=openpanel

# Redis
REDIS_URL=redis://:changeme@localhost:6379

# JWT
JWT_SECRET=seu-secret-aqui-minimo-32-caracteres

# Docker
DOCKER_SOCK=/var/run/docker.sock  # Linux/macOS

# DOCKER_SOCK=//./pipe/docker_engine  # Windows
`

---

## ✅ Verificação de Setup

Após completar o setup, verifique:

`bash

# 1. Containers rodando
docker ps

# 2. API respondendo
curl http://localhost:3001/api/health

# 3. Web carregando
curl http://localhost:3000

# 4. Banco de dados conectado
npm run db:studio
`

---

## 🆘 Suporte

Para problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique .env está correto
3. Certifique-se Docker está rodando
4. Tente `docker-compose down && docker-compose up -d`
5. Abra issue no GitHub: https://github.com/msoutole/openpanel/issue

