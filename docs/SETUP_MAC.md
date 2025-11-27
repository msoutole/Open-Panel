# 🍎 Guia de Setup - macOS

Guia completo para instalação do Open-Panel em macOS (Intel e Apple Silicon).

## ✅ Pré-requisitos

### Sistema
- **macOS**: 11 (Big Sur) ou superior
- **RAM**: 8GB+ recomendado (4GB mínimo)
- **Disco**: 10GB+ espaço livre
- **Processor**: Intel x86_64 ou Apple Silicon (M1/M2/M3+)

### Software Necessário
- **Homebrew**: Gerenciador de pacotes (será instalado automaticamente)
- **Git**: Para clonar o repositório
- **Node.js**: v18.0.0+ (instalado automaticamente)
- **Docker Desktop**: Para macOS (instalado automaticamente)

---

## 🚀 Instalação Rápida (Script Automático)

A forma mais rápida:

```bash
# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Dar permissão ao script
chmod +x scripts/setup/setup.sh

# 3. Executar setup
./scripts/setup/setup.sh

# Pronto! Aguarde 5-10 minutos
```

**O script vai:**
- ✅ Instalar Homebrew (se necessário)
- ✅ Instalar Node.js
- ✅ Instalar Docker Desktop
- ✅ Criar .env com secrets seguros
- ✅ Instalar dependências npm
- ✅ Iniciar containers Docker
- ✅ Configurar banco de dados
- ✅ Validar tudo

---

## 📋 Instalação Passo a Passo

### 1. Instalar Xcode Command Line Tools

```bash
# Instalar ferramentas necessárias
xcode-select --install

# Seguir o wizard na tela
# Depois verificar:
xcode-select -p
# Deve retornar: /Applications/Xcode.app/Contents/Developer
```

### 2. Instalar Homebrew

```bash
# Instalar Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Para Apple Silicon (M1/M2), adicionar ao PATH
# Adicione ao final do ~/.zprofile ou ~/.bash_profile:
# export PATH="/opt/homebrew/bin:$PATH"

# Verificar instalação
brew --version
```

### 3. Instalar Node.js

```bash
# Via Homebrew (Recomendado)
brew install node

# Ou via script de setup (automático)
./scripts/setup/setup.sh

# Verificar instalação
node --version      # v18.0.0 ou superior
npm --version       # 9.0.0 ou superior
```

### 4. Instalar Docker Desktop

#### Opção A: Via Homebrew
```bash
brew install docker
brew install docker-compose

# Ou via Docker Desktop:
brew install --cask docker
```

#### Opção B: Manual
1. Baixar Docker Desktop de https://www.docker.com/products/docker-desktop
2. Abrir o arquivo `.dmg`
3. Arrastar o ícone Docker para Applications
4. Abrir Docker Desktop (Cmd+Space → "Docker")
5. Conceder permissões se solicitado

#### Verificar Instalação
```bash
docker --version        # Docker version 20.10.0+
docker-compose version  # Docker Compose version 2.0.0+

# Iniciar Docker daemon
open -a Docker

# Aguardar aparecer na menu bar (ícone de baleia)

# Testar
docker run hello-world
```

### 5. Clone do Repositório

```bash
# Escolha um local
cd ~/Development

# Clone
git clone https://github.com/msoutole/openpanel.git
cd openpanel
```

### 6. Executar Setup

```bash
# Dar permissão ao script
chmod +x scripts/setup/setup.sh

# Executar (será solicitada senha no início para docker)
./scripts/setup/setup.sh

# Aguarde 5-10 minutos
```

---

## 🎯 Opções de Setup Script

```bash
# Ver ajuda
./scripts/setup/setup.sh --help

# Modo silencioso (sem prompts)
./scripts/setup/setup.sh --silent

# Sobrescrever .env
./scripts/setup/setup.sh --force

# Ativar logs DEBUG
./scripts/setup/setup.sh --debug

# Combinar
./scripts/setup/setup.sh --silent --force --debug
```

---

## 🍎 Intel vs Apple Silicon

### Para Intel Macs
- Instalação padrão funciona perfeitamente
- Sem configurações adicionais necessárias

### Para Apple Silicon (M1/M2/M3)

O script detecta automaticamente, mas alguns detalhes:

```bash
# Verificar arquitetura
arch
# Deve retornar: arm64 (Apple Silicon) ou i386 (Intel)

# Homebrew em Apple Silicon se instala em /opt/homebrew
# Verifique seu PATH se tiver problemas:
echo $PATH

# Devem estar em /opt/homebrew/bin para M1/M2
```

**Possíveis problemas com M1/M2:**
- Docker Desktop precisa estar versão M1 nativa
- Alguns containers podem não ter suporte ARM64
- Solução: Usar `docker run --platform linux/amd64` se necessário

---

## 🔍 Verificações Pós-Setup

```bash
# 1. Verificar containers rodando
docker ps

# Saída esperada:
# CONTAINER ID   IMAGE        STATUS
# xxx            postgres     Up 5 minutes (healthy)
# xxx            redis        Up 5 minutes (healthy)

# 2. Testar endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/

# 3. Ver logs
docker logs openpanel-postgres
docker logs openpanel-redis

# 4. Abrir no navegador
open http://localhost:3000
```

---

## 🐛 Troubleshooting

### Docker Desktop não inicia

```bash
# 1. Abrir manualmente
open -a Docker

# 2. Se não aparecer aplicação, verificar:
ls -la /Applications/Docker.app

# 3. Se não tiver instalado:
brew install --cask docker
# Ou baixar de https://www.docker.com/products/docker-desktop

# 4. Se ainda não funcionar, resetar:
# Preferences → Reset Docker Desktop
```

### Erro "Cannot connect to Docker daemon"

```bash
# 1. Verificar se Docker Desktop está rodando
pgrep -l docker

# 2. Iniciar Docker
open -a Docker

# 3. Aguardar ícone de baleia aparecer na menu bar
# (Pode levar 1-2 minutos)

# 4. Depois testar
docker ps
```

### PostgreSQL não conecta

```bash
# Ver logs detalhados
docker logs openpanel-postgres

# Reiniciar container
docker restart openpanel-postgres

# Se persistir, resetar:
docker-compose down -v
./scripts/setup/setup.sh --force
```

### Porta já em uso

```bash
# Encontrar processo usando porta (ex: 3001)
lsof -i :3001

# Matar o processo
kill -9 <PID>

# Ou mudar portas em .env
nano .env
# Alterar PORT_API=3001 para outra porta
```

### npm install falha

```bash
# Limpar cache
npm cache clean --force

# Tentar novamente
npm install

# Se falhar novamente:
rm -rf node_modules package-lock.json
npm install
```

### Erro com Homebrew em Apple Silicon

```bash
# Se encontrar erro de arch mismatch:
# Abrir Terminal em Native (não em Rosetta)

# Checar:
arch  # Deve retornar: arm64

# Reinstalar Homebrew para Apple Silicon
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Adicionar ao PATH (~/.zprofile):
export PATH="/opt/homebrew/bin:$PATH"
```

---

## 💾 Backup e Restauração

### Backup de Configurações

```bash
# .env é automaticamente backed up
ls -la .env.backup.*

# Restaurar um backup
cp .env.backup.20240115-143025 .env
docker-compose restart
```

### Backup do Banco de Dados

```bash
# Fazer dump PostgreSQL
docker exec openpanel-postgres pg_dump -U openpanel -d openpanel > backup.sql

# Restaurar
docker exec -i openpanel-postgres psql -U openpanel -d openpanel < backup.sql

# Com compressão
docker exec openpanel-postgres pg_dump -U openpanel -d openpanel | gzip > backup.sql.gz
```

---

## 📚 Comandos Úteis

```bash
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
```

---

## 🔒 Segurança

### Senhas Iniciais
- `.env` criado com senhas aleatórias (32+ caracteres)
- **NUNCA** commite `.env` no Git
- `.gitignore` já previne acidentais

### Primeiro Login
```
Email: admin@openpanel.dev
Senha: admin123 (mude imediatamente!)
```

### Permissões de Arquivo
```bash
# Restringir permissões de .env
chmod 600 .env
```

---

## 🚀 Próximos Passos

1. **Acessar**: Abra http://localhost:3000 no navegador
2. **Criar Usuário**: Registre novo usuário (não use padrão)
3. **Explorar**: Veja documentação em `/docs/`
4. **Desenvolver**: Comece a trabalhar no código
5. **Deploy**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🆘 Precisa de Ajuda?

- **Logs**: `cat .logs/setup-*.log`
- **Documentação Geral**: [SETUP.md](./SETUP.md)
- **Issues**: https://github.com/msoutole/openpanel/issues

---

## 📝 Dicas para macOS

### Melhorar Performance
```bash
# Aumentar limite de arquivos abertos
ulimit -n 65536

# Adicionar ao ~/.zprofile para permanente:
echo 'ulimit -n 65536' >> ~/.zprofile
```

### Terminal Recomendado
- **Padrão**: Terminal.app (OK)
- **Melhor**: iTerm2 (brew install iterm2)
- **Shell**: zsh (padrão em Big Sur+)

### Atalhos Úteis
```bash
# Abrir projeto em VSCode
code .

# Abrir Finder neste diretório
open .

# Abrir URL no navegador
open http://localhost:3000
```

---

**Última atualização**: 2024-11-27
**macOS Compatível**: 11 (Big Sur)+, Intel & Apple Silicon (M1/M2/M3+)
