# 🚀 Guia Completo de Setup - Open-Panel

Bem-vindo ao Open-Panel! Este guia cobre a instalação e configuração completa do projeto em qualquer plataforma.

## 📋 Índice

- [Requisitos Mínimos](#requisitos-mínimos)
- [Instalação Rápida (Recomendado)](#instalação-rápida-recomendado)
- [Instalação em Cada Plataforma](#instalação-em-cada-plataforma)
- [Troubleshooting](#troubleshooting)
- [Próximos Passos](#próximos-passos)

---

## 📦 Requisitos Mínimos

### Hardware
- **CPU**: Mínimo 2 cores (4+ recomendado)
- **RAM**: Mínimo 4GB (8GB+ recomendado)
- **Disco**: Mínimo 5GB de espaço livre
- **Internet**: Conexão ativa para download de dependências

### Software
- **Node.js**: v18.0.0 ou superior (v20+ recomendado)
- **Docker**: v20.10.0 ou superior
- **Docker Compose**: v2.0.0 ou superior
- **Git**: Qualquer versão recente
- **npm**: Incluído com Node.js

### Navegadores Suportados
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## ⚡ Instalação Rápida (Recomendado)

A forma mais rápida é usar os scripts de setup automatizados que cuidam de tudo para você.

### Linux/macOS

```bash
# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Execute o script de setup (escolha o seu SO)
./scripts/setup/setup.sh

# O script vai:
# ✓ Verificar/instalar Node.js
# ✓ Verificar/instalar Docker
# ✓ Criar .env com secrets seguros
# ✓ Instalar dependências npm
# ✓ Iniciar containers Docker
# ✓ Configurar banco de dados
# ✓ Validar tudo pós-instalação
```

### Windows (PowerShell)

```powershell
# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Execute o script de setup
.\scripts\setup\setup.ps1

# O script vai fazer o mesmo da versão Linux/macOS
# Nativo em PowerShell (sem WSL necessário)
```

### Opções de Setup

Ambos os scripts suportam flags úteis:

**Linux/macOS:**
```bash
./scripts/setup/setup.sh --help                  # Exibe ajuda
./scripts/setup/setup.sh --silent               # Sem prompts interativos
./scripts/setup/setup.sh --force                # Sobrescrever .env existente
./scripts/setup/setup.sh --debug                # Ativa logs DEBUG
```

**Windows:**
```powershell
.\scripts\setup\setup.ps1 -Help                 # Exibe ajuda
.\scripts\setup\setup.ps1 -Silent               # Sem prompts
.\scripts\setup\setup.ps1 -Force                # Sobrescrever .env
.\scripts\setup\setup.ps1 -Debug                # Logs DEBUG
```

---

## 📦 Instalação em Cada Plataforma

### 🐧 Linux

#### Ubuntu/Debian

```bash
# 1. Atualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# 2. Instalar dependências
sudo apt-get install -y git curl build-essential

# 3. O script de setup vai instalar Node.js e Docker automaticamente
./scripts/setup/setup.sh
```

#### Fedora/CentOS/RHEL

```bash
# 1. Instalar dependências
sudo dnf install -y git curl build-essential

# 2. Execute o script
./scripts/setup/setup.sh
```

#### Arch Linux

```bash
# 1. Instalar dependências
sudo pacman -S git curl base-devel

# 2. Execute o script
./scripts/setup/setup.sh
```

### 🍎 macOS

#### Com Homebrew (Recomendado)

```bash
# 1. Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar dependências
brew install git

# 3. O script vai instalar Node.js e Docker Desktop automaticamente
./scripts/setup/setup.sh
```

#### Pontos Importantes para macOS:
- Docker Desktop precisa estar instalado (4GB de RAM disponível)
- Para M1/M2: Certifique-se de que Docker suporta ARM64
- O script detecta automaticamente e ajusta

### 🪟 Windows

#### Opção 1: PowerShell Script (Recomendado)

```powershell
# 1. Abrir PowerShell como Administrador
# (Clique direito em PowerShell → "Executar como Administrador")

# 2. Permitir execução de scripts (se necessário)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Execute o script
cd C:\seu\caminho\openpanel
.\scripts\setup\setup.ps1
```

#### Opção 2: Instalação Manual

```powershell
# 1. Instalar Node.js
# Baixar de https://nodejs.org/ ou usar winget
winget install OpenJS.NodeJS

# 2. Instalar Docker Desktop
# Baixar de https://www.docker.com/products/docker-desktop

# 3. Abrir PowerShell e navegar para o projeto
cd C:\seu\caminho\openpanel

# 4. Executar o script de setup
.\scripts\setup\setup.ps1
```

#### ⚠️ Importante para Windows:
- **Não use WSL** - os scripts são nativos em PowerShell
- Docker Desktop precisa estar rodando (verificará automaticamente)
- Execute PowerShell como Administrador
- A porta Docker é via `npipe://` em Windows (configurada automaticamente)

### 🐳 Docker (Alternativa Completa)

Se você quiser rodar tudo em containers:

```bash
# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Buildar imagem Docker
docker build -t openpanel:latest .

# 3. Rodar container
docker run -it \
  -p 3000:3000 \
  -p 3001:3001 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  openpanel:latest
```

---

## ✅ Verificar Instalação

Após completar o setup, verifique se tudo está funcionando:

```bash
# Verificar status dos serviços
npm run status

# Ou acesse os endpoints diretamente
curl http://localhost:3001/api/health

# Abra no navegador
# Web: http://localhost:3000
# API: http://localhost:3001
# Traefik: http://localhost:8080
```

---

## 🔧 Arquivos Importantes

### `.env` - Variáveis de Ambiente

O arquivo `.env` é criado automaticamente com valores aleatórios seguros:

```bash
# Se precisar regenerá-lo
rm .env
./scripts/setup/setup.sh --force
```

**Variáveis Críticas:**
- `DATABASE_URL`: Conexão PostgreSQL
- `REDIS_URL`: Conexão Redis
- `JWT_SECRET`: Chave de assinatura JWT (gerada com 64 chars aleatórios)
- `NODE_ENV`: development ou production

### Backup Automático

Cada vez que um novo setup é executado, o `.env` anterior é automaticamente
com backup em `.env.backup.TIMESTAMP`.

Para restaurar um backup anterior:
```bash
cp .env.backup.20240115-143025 .env
docker-compose restart
```

---

## 📝 Logs

Os scripts salvam logs detalhados em `.logs/`:

```bash
# Listar últimos logs
ls -la .logs/

# Visualizar último log
cat .logs/setup-*.log | tail -50

# Com detalhes completos
./scripts/setup/setup.sh --debug
```

---

## 🐛 Troubleshooting

### Docker não inicia
```bash
# Linux: Iniciar Docker daemon
sudo systemctl start docker

# macOS: Iniciar Docker Desktop
open -a Docker

# Windows: Abrir Docker Desktop manualmente
```

### PostgreSQL falha no health check
```bash
# Ver logs do container
docker logs openpanel-postgres

# Ou resetar tudo
docker-compose down -v
./scripts/setup/setup.sh --force
```

### Porta já em uso
```bash
# Verificar qual processo está usando a porta
# Linux/macOS:
lsof -i :3000
lsof -i :3001

# Windows (PowerShell):
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Matar o processo ou alterar portas em .env
```

### npm install falha
```bash
# Limpar cache
npm cache clean --force

# Tentar novamente
npm install

# Ou reexecutar setup
./scripts/setup/setup.sh --force
```

### Erro de permissão no Linux
```bash
# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar novo grupo (sem fazer login novamente)
newgrp docker

# Ou usar sudo
sudo ./scripts/setup/setup.sh
```

---

## 🚀 Próximos Passos

Após a instalação bem-sucedida:

### 1. Acessar a Aplicação
- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **Traefik Dashboard**: http://localhost:8080

### 2. Criar Usuário Inicial
```bash
# O usuário admin é criado automaticamente
# Email: admin@openpanel.dev
# Senha: admin123 (mude na primeira login!)
```

### 3. Comandos Úteis

```bash
# Modo desenvolvimento (API + Web)
npm run dev

# Desenvolvimento isolado
npm run dev:api
npm run dev:web

# Build para produção
npm run build

# Verificação de tipos
npm run type-check

# Status dos serviços
npm run status

# Prisma Studio (GUI do banco)
npm run db:studio

# Logs em tempo real
docker-compose logs -f

# Parar tudo
docker-compose down
```

### 4. Customizações Comuns

**Alterar portas:**
```bash
# Editar .env
PORT_WEB=3000          # Web
API_PORT=3001          # API
TRAEFIK_PORT=8080      # Traefik
```

**Habilitar Ollama (LLM local):**
```bash
# Em .env
SETUP_OLLAMA=true
OLLAMA_HOST=http://localhost:11434
```

**Usar provedor de IA específico:**
```bash
# Escolher um
AI_PROVIDER=ollama          # Rodando localmente
AI_PROVIDER=openai          # OpenAI API
AI_PROVIDER=anthropic       # Anthropic Claude API
AI_PROVIDER=google          # Google Gemini
```

### 5. Produção

Para deployment em produção, veja [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🆘 Precisa de Ajuda?

- **GitHub Issues**: https://github.com/msoutole/openpanel/issues
- **Documentação**: Veja pasta `/docs/`
- **Community**: [Discord/Slack link aqui]

---

## 📝 Notas de Versão

- **v1.0.0**: Setup automatizado completo, suporte multi-plataforma, secrets seguros

---

**Última atualização**: 2024-11-27
**Compatível com**: Node.js 18+, Docker 20.10+, Docker Compose 2.0+
