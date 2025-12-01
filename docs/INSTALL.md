# 📦 OpenPanel - Guia de Instalação

## 🚀 Instalação Ultra-Simplificada (Recomendado)

### ⚡ Um Único Comando para Tudo

OpenPanel agora tem uma instalação **100% automatizada** que funciona em todas as plataformas:

```bash
npm start
```

**Isso é tudo!** O script `start.js` faz automaticamente:

1. ✅ Verifica pré-requisitos (Node.js 18+, Docker)
2. ✅ Cria arquivo `.env` com valores seguros gerados automaticamente
3. ✅ Instala dependências npm
4. ✅ Inicia containers Docker (PostgreSQL, Redis, Traefik)
5. ✅ Aguarda serviços ficarem prontos
6. ✅ Configura banco de dados (Prisma)
7. ✅ Cria usuário administrador padrão
8. ✅ Inicia API e Web em modo desenvolvimento

**Funciona em:**
- ✅ Linux (todas as distribuições)
- ✅ macOS
- ✅ Windows (com Docker Desktop)
- ✅ WSL2

**Sem necessidade de:**
- ❌ Scripts específicos por plataforma
- ❌ Configuração manual de variáveis de ambiente
- ❌ Múltiplos comandos
- ❌ Conhecimento técnico avançado

---

## 📋 System Requirements

### Minimum Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | >= 18.0.0 | LTS version recommended (20.11.0+) |
| **npm** | >= 10.0.0 | Included with Node.js |
| **Docker** | >= 20.10.0 | Docker Desktop on Windows/macOS |
| **Docker Compose** | >= 2.0.0 | Usually included with Docker |
| **RAM** | 4 GB | 8 GB recommended |
| **Disk Space** | 10 GB | 20 GB recommended |

### Recommended Requirements

- **Node.js**: 20.11.0 (LTS)
- **npm**: 10.4.0+
- **Docker**: 24.0.0+
- **RAM**: 8 GB
- **CPU**: 2+ cores
- **Disk**: SSD with 20+ GB free

---

## 🎯 Por Que Esta Abordagem?

**Antes**: Múltiplos scripts (install.sh, install.ps1, install.py, setup.js) causavam confusão

**Agora**: Um único comando `npm start` que funciona em todas as plataformas

**Benefícios:**
- ✅ **Simplicidade**: Um comando, zero configuração
- ✅ **Cross-platform**: Funciona em Linux, macOS e Windows
- ✅ **Segurança**: Senhas geradas automaticamente
- ✅ **Transparência**: Você vê cada passo do processo
- ✅ **Idempotente**: Pode executar múltiplas vezes sem problemas

---

## 📋 Pré-requisitos

Antes de executar `npm start`, certifique-se de ter:

### Requisitos Mínimos

| Componente | Versão | Notas |
|-----------|--------|-------|
| **Node.js** | >= 18.0.0 | LTS recomendado (20.11.0+) |
| **npm** | >= 10.0.0 | Incluído com Node.js |
| **Docker** | >= 20.10.0 | Docker Desktop no Windows/macOS |
| **Docker Compose** | >= 2.0.0 | Geralmente incluído com Docker |
| **RAM** | 4 GB | 8 GB recomendado |
| **Espaço em Disco** | 10 GB | 20 GB recomendado |

### Instalar Pré-requisitos

#### Linux (Ubuntu/Debian)
```bash
# Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### macOS
```bash
# Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js
brew install node@20

# Docker Desktop
brew install --cask docker
```

#### Windows
1. Baixe e instale [Node.js LTS](https://nodejs.org/)
2. Baixe e instale [Docker Desktop](https://www.docker.com/products/docker-desktop)
3. Certifique-se de que o Docker Desktop está rodando

## 🔧 Instalação Manual (Avançado)

Se preferir controle manual ou o script automático falhar:

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/msoutole/openpanel.git
cd openpanel
```

### Passo 2: Instale Dependências

```bash
npm install
```

### Passo 3: Configure Ambiente

O script `npm start` cria automaticamente o `.env`. Se preferir manual:

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### Passo 4: Inicie Serviços Docker

```bash
docker-compose up -d
```

### Passo 5: Configure Banco de Dados

```bash
npm run db:generate
npm run db:push
```

### Passo 6: Crie Usuário Admin

```bash
npm run create:admin
```

### Passo 7: Inicie Aplicação

```bash
npm run dev
```

---

## ✅ Verificação

Após `npm start` completar, verifique se tudo está funcionando:

### Verificação Automática

O script `npm start` já verifica automaticamente:
- ✅ Node.js e Docker instalados
- ✅ Containers Docker rodando
- ✅ Banco de dados configurado
- ✅ API respondendo

### Verificação Manual

```bash
# Verificar Node.js
node -v  # Deve mostrar v18.0.0 ou superior

# Verificar Docker
docker --version
docker ps  # Deve mostrar containers rodando

# Verificar API
curl http://localhost:3001/health

# Verificar Frontend (no navegador)
# Abra http://localhost:3000
```

Resposta esperada do health check:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T...",
  "version": "0.1.0"
}
```

### 🔑 Credenciais Padrão

Após a instalação, use estas credenciais:

- **Email**: `admin@admin.com.br`
- **Senha**: `admin123`

> ⚠️ **IMPORTANTE**: Você será solicitado a alterar a senha no primeiro login!

---

## 🔄 Updating OpenPanel

### Automated Update

```bash
# Linux/macOS
./scripts/install/install.sh --update

# Windows
.\scripts\install\install.ps1 -Update

# Python
python scripts/install/install.py --update
```

### Manual Update

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Update Docker images
docker compose pull

# Restart services
docker compose up -d

# Update database schema
npm run db:push

# Rebuild application
npm run build
```

---

## 🐛 Troubleshooting

### Prisma Client Issues

**Error:** `Failed to fetch sha256 checksum`

```bash
# Set environment variable and regenerate
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run db:generate
```

### Docker Not Running

**Error:** `Cannot connect to Docker daemon`

```bash
# Linux
sudo systemctl start docker

# macOS
open -a Docker

# Windows
# Start Docker Desktop from Start Menu
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

```bash
# Find process using port (Linux/macOS)
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
echo "API_PORT=3002" >> .env
```

### PostgreSQL Not Healthy

```bash
# Check logs
docker logs openpanel-postgres

# Restart container
docker compose restart postgres

# If persistent, recreate
docker compose down
docker volume rm openpanel_postgres-data
docker compose up -d
```

### Permission Denied (Linux)

```bash
# Make scripts executable
chmod +x scripts/install/install.sh scripts/setup/setup.sh scripts/utils/check-services.sh

# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.config
sudo chown -R $USER:$(id -gn $USER) ~/.npm
```

---

## 📚 Next Steps

After successful installation:

1. **Create an account:**
   - Open http://localhost:3000
   - Click "Register"
   - Create your admin account

2. **Explore the dashboard:**
   - View system status
   - Check Docker containers
   - Configure settings

3. **Create your first project:**
   - Click "New Project"
   - Configure deployment
   - Deploy your application

4. **Read the documentation:**
   - [Quick Start Guide](./QUICK_START.md)
   - [Full Setup Guide](./SETUP_GUIDE.md)
   - [Architecture Overview](ARCHITECTURE.md)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs:**
   ```bash
   # Installation log
   cat install.log

   # API logs
   docker compose logs api

   # All service logs
   docker compose logs
   ```

2. **Run diagnostics:**
   ```bash
   ./scripts/utils/check-services.sh  # Linux/macOS
   .\scripts\utils\check-services.ps1  # Windows
   ```

3. **Check documentation:**
   - [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed troubleshooting
   - [QUICK_START.md](./QUICK_START.md) - Common issues

4. **Get support:**
   - GitHub Issues: https://github.com/msoutole/openpanel/issues
   - Discussions: https://github.com/msoutole/openpanel/discussions

---

## 🔐 Security Notes

### Before Production Deployment

⚠️ **IMPORTANT:** The default configuration uses insecure passwords. Before deploying to production:

1. **Generate secure JWT secret:**
   ```bash
   # Linux/macOS
   openssl rand -hex 64

   # Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Update `.env`:
   ```bash
   JWT_SECRET=<your-generated-secret>
   ```

2. **Change database password:**
   ```bash
   # In .env, replace:
   POSTGRES_PASSWORD=<strong-password>
   DATABASE_URL=postgresql://openpanel:<strong-password>@localhost:5432/openpanel
   ```

3. **Change Redis password:**
   ```bash
   # In .env, replace:
   REDIS_PASSWORD=<strong-password>
   REDIS_URL=redis://:<strong-password>@localhost:6379
   ```

4. **Configure CORS properly:**
   ```bash
   # In .env, set your production domain:
   CORS_ORIGIN=https://yourdomain.com
   ```

5. **Enable HTTPS:**
   - Configure SSL certificates
   - Use Let's Encrypt with Traefik
   - Update frontend URL to HTTPS

---

## 📦 Installation Scripts Summary

| Script | Platform | Command | Use Case |
|--------|----------|---------|----------|
| `scripts/install/install.sh` | Linux/macOS | `./scripts/install/install.sh` | **Recommended** for Unix systems |
| `scripts/install/install.ps1` | Windows | `.\scripts\install\install.ps1` | **Recommended** for Windows |
| `scripts/install/install.py` | Cross-platform | `python scripts/install/install.py` | Alternative for all platforms |
| `scripts/setup/setup.sh` | Linux/macOS | `./scripts/setup/setup.sh` | Quick setup (Docker required) |
| `scripts/utils/check-services.sh` | Linux/macOS | `./scripts/utils/check-services.sh` | Verify services status |

---

## 🎉 Success!

If you see the OpenPanel dashboard at http://localhost:3000, congratulations! Your installation is complete.

**What's next?**
- Deploy your first application
- Explore container management
- Set up automated backups
- Configure AI assistant (Ollama)
- Add custom domains

Happy deploying! 🚀
