# 🐧 Guia de Setup - Linux

Guia completo para instalação do Open-Panel em diversas distribuições Linux.

## ✅ Pré-requisitos

### Sistema
- **Linux Kernel**: 4.0+ com suporte a Docker
- **RAM**: 8GB+ recomendado (4GB mínimo)
- **Disco**: 10GB+ espaço livre
- **Acesso Root/Sudo**: Necessário para instalar software

### Distribuições Suportadas
- Ubuntu 20.04 LTS+ ✅
- Debian 10+ ✅
- Fedora 35+ ✅
- CentOS 8+ ✅
- RHEL 8+ ✅
- Arch Linux ✅
- Rocky Linux 8+ ✅

---

## 🚀 Instalação Rápida (Script Automático)

A forma mais rápida é usar o script de setup automatizado:

`bash

# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Dar permissão de execução ao script
chmod +x scripts/setup/setup.sh

# 3. Executar o script
./scripts/setup/setup.sh

# O script detecta sua distribuição e faz tudo automaticamente!
`

**O script vai:**
- ✅ Verificar/instalar Node.js
- ✅ Verificar/instalar Docker
- ✅ Criar .env com secrets seguros
- ✅ Instalar dependências npm
- ✅ Iniciar containers Docker
- ✅ Configurar banco de dados
- ✅ Validar tudo

---

## 📋 Instalação por Distribuição

### 📦 Ubuntu/Debian

#### Instalação Automática (Recomendado)

`bash

# 1. Atualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# 2. Instalar dependências básicas
sudo apt-get install -y curl wget git build-essential

# 3. Clonar repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel
chmod +x scripts/setup/setup.sh

# 4. Executar setup (será solicitado sudo para instalar dependências)
./scripts/setup/setup.sh
`

#### Instalação Manual

`bash

# 1. Instalar Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Ou via snap:
sudo snap install node --classic

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# 5. Seguir resto da instalação
cd openpanel
npm install
./scripts/setup/setup.sh
`

### 📦 Fedora/CentOS/RHEL

#### Instalação Automática

`bash

# 1. Instalar dependências
sudo dnf install -y curl wget git

# 2. Clonar e executar
git clone https://github.com/msoutole/openpanel.git
cd openpanel
chmod +x scripts/setup/setup.sh
./scripts/setup/setup.sh
`

#### Instalação Manual

`bash

# 1. Instalar Node.js
sudo dnf module install nodejs:18/default

# 2. Instalar Docker
sudo dnf install -y docker

# 3. Iniciar Docker daemon
sudo systemctl start docker
sudo systemctl enable docker

# 4. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# 6. Clonar e instalar
git clone https://github.com/msoutole/openpanel.git
cd openpanel
npm install
./scripts/setup/setup.sh
`

### 📦 Arch Linux

#### Instalação Automática

`bash

# 1. Instalar base-devel
sudo pacman -S base-devel

# 2. Clonar e executar
git clone https://github.com/msoutole/openpanel.git
cd openpanel
chmod +x scripts/setup/setup.sh
./scripts/setup/setup.sh
`

#### Instalação Manual

`bash

# 1. Instalar Node.js e npm
sudo pacman -S nodejs npm

# 2. Instalar Docker
sudo pacman -S docker docker-compose

# 3. Iniciar Docker daemon
sudo systemctl start docker
sudo systemctl enable docker

# 4. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# 5. Instalar projeto
git clone https://github.com/msoutole/openpanel.git
cd openpanel
npm install
./scripts/setup/setup.sh
`

---

## 🎯 Opções de Setup Script

O script `setup.sh` suporta várias opções:

`bash

# Ver ajuda
./scripts/setup/setup.sh --help

# Executar sem prompts (útil para automação CI/CD)
./scripts/setup/setup.sh --silent

# Sobrescrever .env existente
./scripts/setup/setup.sh --force

# Ativar logs DEBUG
./scripts/setup/setup.sh --debug

# Combinar opções
./scripts/setup/setup.sh --silent --force --debug
`

---

## 🔐 Permissões e Sudo

### Configurar Sudo sem Senha (Opcional)

Se você quiser que o Docker funcione sem sudo:

`bash

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar novo grupo (sem fazer logout)
newgrp docker

# Testar
docker ps  # Deve funcionar sem sudo
`

### Se preferir sempre usar sudo:

`bash

# Usar sudo
sudo ./scripts/setup/setup.sh

# Você será solicitado a senha
`

---

## 🔍 Verificações Pós-Setup

`bash

# 1. Verificar containers rodando
docker ps

# Saída esperada:

# CONTAINER ID   IMAGE        STATUS

# xxx            postgres     Up 5 minutes (healthy)

# xxx            redis        Up 5 minutes (healthy)

# 2. Verificar se as portas estão escutando
netstat -tlnp | grep -E '3000|3001|8080'

# Ou com ss (mais moderno)
ss -tlnp | grep -E '3000|3001|8080'

# 3. Testar endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/

# 4. Verificar logs
docker logs openpanel-postgres
docker logs openpanel-redis
`

---

## 🐛 Troubleshooting

### Docker não inicia

`bash

# Iniciar Docker daemon
sudo systemctl start docker

# Habilitar no boot
sudo systemctl enable docker

# Ver status
sudo systemctl status docker

# Ver logs se tiver erro
sudo journalctl -u docker -n 20
`

### Erro "permission denied" ao executar docker

`bash

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar novo grupo sem logout
newgrp docker

# Testar
docker ps
`

### PostgreSQL não conecta

`bash

# Ver logs
docker logs openpanel-postgres

# Reiniciar container
docker restart openpanel-postgres

# Ou resetar completamente
docker-compose down -v
./scripts/setup/setup.sh --force
`

### Porta já em uso

`bash

# Encontrar processo usando a porta (ex: 3001)
sudo lsof -i :3001

# Ou com netstat
sudo netstat -tlnp | grep 3001

# Matar o processo
sudo kill -9 <PID>

# Ou mudar as portas em .env
nano .env  # ou vim/gedit

# Alterar PORT_API=3001 para outra porta
`

### npm install falha

`bash

# Limpar cache
npm cache clean --force

# Tentar novamente
npm install

# Se ainda falhar, com verbose
npm install --verbose

# Última opção: limpar tudo
rm -rf node_modules package-lock.json
npm install
`

### Erro de EACCES ao instalar pacotes globalmente

`bash

# Não instale npm packages globalmente com sudo

# Em vez disso, configure npm para um diretório local

mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Adicionar ao seu .bashrc ou .zshrc
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
`

---

## 💾 Backup e Restauração

### Fazer Backup de Configurações

`bash

# .env é automaticamente backed up
ls -la .env.backup.*

# Restaurar um backup
cp .env.backup.20240115-143025 .env
docker-compose restart
`

### Backup do Banco de Dados

`bash

# Fazer dump do PostgreSQL
docker exec openpanel-postgres pg_dump -U openpanel -d openpanel > backup.sql

# Restaurar
docker exec -i openpanel-postgres psql -U openpanel -d openpanel < backup.sql

# Backup com compressão
docker exec openpanel-postgres pg_dump -U openpanel -d openpanel | gzip > backup.sql.gz
`

---

## 📚 Comandos Úteis

`bash

# Desenvolvimento
npm run dev              # API + Web
npm run dev:api          # Apenas API
npm run dev:web          # Apenas Web

# Build
npm run build            # Build tudo
npm run build:api        # Build API
npm run build:web        # Build Web

# Database
npm run db:studio        # Prisma GUI
npm run db:push          # Sincronizar schema
npm run db:generate      # Gerar Prisma client

# Testing
npm run type-check       # TypeScript check

# Utilities
npm run status           # Status dos serviços

# Docker
docker-compose up -d     # Iniciar containers
docker-compose down      # Parar containers
docker-compose logs -f   # Logs em tempo real
docker ps                # Lista containers
docker exec -it <container> bash  # SSH em container
`

---

## 🔒 Segurança

### Senhas Iniciais
- `.env` criado com senhas aleatórias de 32+ caracteres
- **NUNCA** commite `.env` no Git (`.gitignore` previne)
- Altere as senhas em produção

### Firewall
`bash

# Se usar ufw (Ubuntu/Debian)
sudo ufw allow 3000   # Web
sudo ufw allow 3001   # API
sudo ufw allow 8080   # Traefik (opcional)
sudo ufw enable
`

### Permissões de Arquivo
`bash

# Restringir permissões de .env
chmod 600 .env

# Apenas root pode ler
chmod 600 .env.backup.*
`

---

## 🚀 Próximos Passos

1. **Acessar Aplicação**: http://localhost:3000
2. **Criar Usuário**: Registre novo usuário (não use padrão)
3. **Explorar**: Veja documentação em `/docs/`
4. **Desenvolver**: Comece a trabalhar no código
5. **Deploy**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para produção

---

## 🆘 Precisa de Ajuda?

- **Logs Detalhados**: `cat .logs/setup-*.log`
- **Documentação Geral**: [SETUP.md](./SETUP.md)
- **Issues**: https://github.com/msoutole/openpanel/issues

---

**Última atualização**: 2024-11-27
**Distribuições Linux Suportadas**: Ubuntu 20.04+, Debian 10+, Fedora 35+, CentOS 8+, RHEL 8+, Arch

