# 🪟 Guia de Setup - Windows

Guia completo e detalhado para instalação do Open-Panel em Windows.

## ✅ Pré-requisitos

### Sistema
- **Windows 10** (build 19041+) ou **Windows 11** recomendado
- **RAM**: 8GB+ (4GB mínimo)
- **Disco**: 10GB+ espaço livre
- **Admin access**: Necessário para instalar software

### Software Necessário
- **PowerShell**: 7.0+ (já incluído em Windows 11)
- **Git**: Para clonar o repositório
- **Node.js**: v18.0.0+ (instalado automaticamente pelo script)
- **Docker Desktop**: Para Windows (instalado automaticamente pelo script)

---

## 🚀 Instalação Rápida

### Passo 1: Preparação

1. **Abrir PowerShell como Administrador**
   - Clique em Start
   - Digite "PowerShell"
   - Clique direito e selecione "Executar como Administrador"

2. **Verificar versão do PowerShell**
   ```powershell
   $PSVersionTable.PSVersion
   # Deve mostrar 5.1 ou superior (7.0+ ideal)
   ```

3. **Permitir execução de scripts (se necessário)**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # Confirme digitando 'Y' quando solicitado
   ```

### Passo 2: Clone do Repositório

`powershell

# Escolha uma localização (exemplo: C:\dev)
cd C:\dev

# Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel
`

### Passo 3: Executar Setup

`powershell

# Executar o script de setup
.\scripts\setup\setup.ps1

# O script vai fazer tudo automaticamente!

# Aguarde cerca de 5-10 minutos
`

**O que o script faz:**
- ✅ Verifica/instala Node.js (via winget)
- ✅ Verifica/instala Docker Desktop (via winget)
- ✅ Cria `.env` com secrets seguros
- ✅ Instala dependências npm
- ✅ Inicia containers Docker
- ✅ Configura banco de dados
- ✅ Valida tudo

### Passo 4: Verificar Instalação

`powershell

# Verificar status
npm run status

# Abrir no navegador

# Web: http://localhost:3000

# API: http://localhost:3001
`

---

## 📋 Instalação Passo a Passo

Se preferir controle total, aqui está a instalação manual:

### 1. Instalar Node.js

#### Opção A: Via Script (Recomendado)
`powershell
winget install OpenJS.NodeJS
`

#### Opção B: Manual
1. Baixar de https://nodejs.org/ (LTS recomendado)
2. Executar instalador `.msi`
3. Seguir wizard padrão
4. **Reinicie o PowerShell** para aplicar PATH

#### Verificar instalação
`powershell
node --version      # v18.0.0 ou superior
npm --version       # 9.0.0 ou superior
`

### 2. Instalar Docker Desktop

#### Opção A: Via Script
`powershell
winget install Docker.DockerDesktop
`

#### Opção B: Manual
1. Baixar de https://www.docker.com/products/docker-desktop
2. Executar instalador `.exe`
3. Seguir wizard (selecionar Windows Subsystem for Linux 2 se pedido)
4. **Reiniciar o computador**

#### Verificar instalação
`powershell
docker --version        # Docker version 20.10.0 ou superior
docker-compose version  # Docker Compose version 2.0.0 ou superior

# Testar Docker
docker run hello-world
`

### 3. Clone do Repositório

`powershell
cd C:\dev
git clone https://github.com/msoutole/openpanel.git
cd openpanel
`

### 4. Criar `.env`

`powershell

# Copiar template
Copy-Item .env.example -Destination .env

# Editar .env se necessário
notepad .env
`

### 5. Instalar Dependências npm

`powershell
npm install --prefer-offline

# Pode levar 2-5 minutos
`

### 6. Iniciar Docker Services

`powershell
docker-compose up -d

# Aguardar containers ficarem saudáveis

# Cerca de 1-2 minutos
`

### 7. Configurar Banco de Dados

`powershell
npm run db:generate
npm run db:push
`

### 8. Iniciar Aplicação

`powershell

# Modo desenvolvimento
npm run dev

# Ou em uma janela separada
npm run dev:api
npm run dev:web
`

---

## 🎯 Opções de Setup Script

O script `setup.ps1` suporta várias opções:

`powershell

# Ver ajuda
.\scripts\setup\setup.ps1 -Help

# Executar sem prompts (útil para automação)
.\scripts\setup\setup.ps1 -Silent

# Sobrescrever .env existente
.\scripts\setup\setup.ps1 -Force

# Ativar logs DEBUG
.\scripts\setup\setup.ps1 -Debug

# Combinar opções
.\scripts\setup\setup.ps1 -Silent -Force -Debug
`

---

## 🔍 Verificações Pós-Setup

### Verifique se tudo está rodando

`powershell

# 1. Verificar containers Docker
docker ps

# Saída esperada:

# CONTAINER ID   IMAGE                    STATUS

# xxx            postgres:latest          Up X minutes (healthy)

# xxx            redis:latest             Up X minutes (healthy)

# ...

# 2. Verificar se as portas estão escutando

# PowerShell:
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 3000,3001,8080}

# 3. Testar endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/

# 4. Verificar logs
docker logs openpanel-postgres
docker logs openpanel-redis
`

### Acessar a Aplicação

Abra seu navegador em:
- **Web UI**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Traefik**: http://localhost:8080

---

## 🐛 Troubleshooting

### Docker Desktop não inicia

`powershell

# 1. Verificar se WSL 2 está instalado
wsl --list --verbose

# 2. Se não tiver, instalar WSL 2
wsl --install --distribution Ubuntu

# 3. Reiniciar computador

# 4. Abrir Docker Desktop novamente
`

### Porta já em uso

`powershell

# Encontrar processo usando a porta (ex: 3001)
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Matar o processo (substituir PID)
Stop-Process -ID <PID> -Force

# Ou mudar as portas em .env:
notepad .env

# Alterar PORT_API=3001 para outra porta
`

### npm install falha

`powershell

# Limpar cache npm
npm cache clean --force

# Tentar novamente
npm install

# Ou com verbose para ver erros
npm install --verbose
`

### PostgreSQL não conecta

`powershell

# Verificar se container está rodando
docker ps | findstr postgres

# Ver logs
docker logs openpanel-postgres

# Reiniciar container
docker restart openpanel-postgres

# Se persistir, resetar tudo
docker-compose down -v
.\scripts\setup\setup.ps1 -Force
`

### Script de setup não é reconhecido

`powershell

# Pode ser problema de encoding. Converter para UTF-8:
$file = ".\scripts\setup\setup.ps1"
$content = Get-Content -Path $file -Encoding UTF8
Set-Content -Path $file -Value $content -Encoding UTF8

# Ou tentar com caminho completo
powershell -ExecutionPolicy Bypass -File "$PWD\scripts\setup\setup.ps1"
`

### Permissão negada

`powershell

# Executar PowerShell como Admin

# Clique direito → "Executar como Administrador"

# Se ainda tiver problema, permitir scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
`

---

## 💾 Backup e Restauração

### Fazer backup de configurações

`powershell

# .env é automaticamente backed up em .env.backup.TIMESTAMP

# Visualizar backups
Get-ChildItem .env.backup.*

# Restaurar um backup
Copy-Item .env.backup.20240115-143025 -Destination .env
docker-compose restart
`

### Backup do Banco de Dados

`powershell

# Fazer dump do PostgreSQL
docker exec openpanel-postgres pg_dump -U openpanel -d openpanel > backup.sql

# Restaurar
docker exec -i openpanel-postgres psql -U openpanel -d openpanel < backup.sql
`

---

## 📚 Comandos Úteis

`powershell

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
npm test                 # Rodar testes

# Utilities
npm run status           # Status dos serviços
npm run logs             # Ver logs

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
- O `.env` é criado com senhas aleatórias de 32 caracteres
- **NUNCA** commite `.env` no Git
- Arquivo `.gitignore` já previne isso

### JWT Secret
- Gerado com 64 caracteres aleatórios
- Alterado a cada novo setup
- **Guarde em local seguro** em produção

### Primeiro Login
1. Abra http://localhost:3000
2. Clique em "Registrar"
3. Crie novo usuário (não use o padrão)
4. Configure senha forte

---

## 🚀 Próximos Passos

1. **Explorar Documentação**: Veja pasta `/docs/`
2. **Customizar**: Editar `.env` conforme necessário
3. **Desenvolver**: Começar a trabalhar no código
4. **Deploy**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para produção

---

## 🆘 Precisa de Ajuda?

- **Documentação Geral**: [SETUP.md](./SETUP.md)
- **Issues**: https://github.com/msoutole/openpanel/issues
- **Logs**: Verificar em `.logs/setup-*.log`

---

**Última atualização**: 2024-11-27
**Windows 10/11 Compatível**

