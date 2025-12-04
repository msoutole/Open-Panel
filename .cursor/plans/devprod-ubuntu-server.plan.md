---
name: Instalação Open Panel Ubuntu Server
overview: Preparar o Open Panel para instalação completa em servidor Ubuntu Server com tudo em containers Docker, incluindo configuração para desenvolvimento remoto via SSH.
todos:
  - id: docker-compose-prod
    content: Criar docker-compose.prod.yml completo com API, Web e infraestrutura em containers
    status: pending
  - id: install-server-script
    content: Criar script install-server.sh para instalação automatizada em servidor Ubuntu
    status: pending
  - id: server-management-scripts
    content: Criar scripts de gerenciamento (start, stop, restart, status, logs, update) na pasta scripts/server/
    status: pending
    dependencies:
      - docker-compose-prod
  - id: server-installation-docs
    content: Criar documentação completa de instalação em servidor (docs/INSTALACAO_SERVIDOR.md)
    status: pending
    dependencies:
      - install-server-script
  - id: remote-development-docs
    content: Criar guia de desenvolvimento remoto (docs/DESENVOLVIMENTO_REMOTO.md)
    status: pending
  - id: update-env-example
    content: Atualizar .env.example com configurações específicas para produção
    status: pending
---

# Instalação do Open Panel em Ubuntu Server

## Objetivo

Configurar o Open Panel para funcionar como "cérebro" do servidor Ubuntu, com instalação completa em containers Docker e suporte para desenvolvimento remoto.

## Análise do Estado Atual

### O que já existe:

- ✅ Script de instalação Linux (`scripts/install.sh`) que detecta Ubuntu
- ✅ Dockerfiles de produção para API e Web
- ✅ `docker-compose.yml` com infraestrutura (PostgreSQL, Redis, Traefik)
- ✅ Variáveis de ambiente centralizadas (`.env.example`)

### O que falta:

- ❌ `docker-compose.yml` completo para produção (API + Web como containers)
- ❌ Script de instalação específico para servidor Ubuntu
- ❌ Documentação de instalação em servidor
- ❌ Configuração de desenvolvimento remoto
- ❌ Scripts de gerenciamento para produção

## Implementação

### 1. Criar docker-compose.prod.yml

**Arquivo**: `docker-compose.prod.yml`

Criar arquivo Docker Compose completo para produção que inclui:

- Serviços de infraestrutura (PostgreSQL, Redis, Traefik) - já existentes
- Serviço `api` usando `apps/api/Dockerfile`
- Serviço `web` usando `apps/web/Dockerfile`
- Configuração de rede e volumes
- Health checks e restart policies
- Labels Traefik para roteamento automático

**Configurações importantes**:

- API exposta na porta 3001 (interna) e via Traefik
- Web servida via Nginx na porta 80 (interna) e via Traefik
- Variáveis de ambiente lidas do `.env`
- Volumes para dados persistentes

### 2. Criar script de instalação para servidor

**Arquivo**: `scripts/install-server.sh`

Script específico para instalação em servidor Ubuntu que:

- Detecta se está rodando em servidor (sem GUI)
- Instala dependências (Node.js, Docker, Docker Compose)
- Configura firewall (UFW) para portas necessárias
- Cria usuário dedicado (opcional)
- Configura `.env` para produção
- Gera senhas seguras automaticamente
- Inicia serviços via `docker-compose.prod.yml`
- Cria usuário administrador inicial

### 3. Criar scripts de gerenciamento

**Arquivos**:

- `scripts/server/start.sh` - Iniciar todos os serviços
- `scripts/server/stop.sh` - Parar todos os serviços
- `scripts/server/restart.sh` - Reiniciar serviços
- `scripts/server/status.sh` - Verificar status
- `scripts/server/logs.sh` - Ver logs
- `scripts/server/update.sh` - Atualizar aplicação

### 4. Criar documentação de instalação

**Arquivo**: `docs/INSTALACAO_SERVIDOR.md`

Documentação completa incluindo:

- Pré-requisitos do servidor Ubuntu
- Passo a passo de instalação
- Configuração de domínio e SSL (Let's Encrypt via Traefik)
- Configuração de firewall
- Desenvolvimento remoto via SSH
- Troubleshooting comum
- Backup e restore

### 5. Atualizar .env.example para produção

**Arquivo**: `.env.example`

Adicionar seção específica para produção com:

- Comentários sobre configuração de domínio
- Variáveis para SSL/HTTPS
- Configurações de segurança recomendadas
- Exemplos de URLs para produção

### 6. Criar guia de desenvolvimento remoto

**Arquivo**: `docs/DESENVOLVIMENTO_REMOTO.md`

Guia para desenvolvimento no servidor incluindo:

- Configuração de SSH
- Uso do VS Code Remote SSH (opcional)
- Workflow de desenvolvimento
- Hot reload em containers
- Acesso a logs e debug

### 7. Melhorar scripts existentes

**Arquivo**: `scripts/install.sh`

Adaptar para detectar ambiente de servidor e sugerir uso de `install-server.sh` quando apropriado.

## Estrutura de Arquivos

```
Open-Panel/
├── docker-compose.prod.yml          # ← NOVO: Compose completo para produção
├── scripts/
│   ├── install-server.sh            # ← NOVO: Instalação em servidor
│   └── server/                      # ← NOVO: Scripts de gerenciamento
│       ├── start.sh
│       ├── stop.sh
│       ├── restart.sh
│       ├── status.sh
│       ├── logs.sh
│       └── update.sh
└── docs/
    ├── INSTALACAO_SERVIDOR.md       # ← NOVO: Guia de instalação
    └── DESENVOLVIMENTO_REMOTO.md   # ← NOVO: Guia de desenvolvimento
```

## Configurações de Produção

### Variáveis de Ambiente Importantes:

- `NODE_ENV=production`
- `APP_URL=https://seu-dominio.com` (domínio real)
- `CORS_ORIGIN=https://seu-dominio.com`
- `DATABASE_URL` usando nome do serviço Docker
- `REDIS_URL` usando nome do serviço Docker
- Senhas fortes geradas automaticamente

### Portas Expostas:

- `80` e `443`: Traefik (proxy reverso)
- `8080`: Traefik Dashboard (opcional, protegido)
- `3001`: API (apenas interna, via Traefik)
- `5432`: PostgreSQL (apenas interna)
- `6379`: Redis (apenas interna)

### Segurança:

- Firewall configurado (UFW)
- SSL automático via Let's Encrypt
- Senhas geradas automaticamente
- Containers isolados em rede Docker

## Próximos Passos Após Instalação

1. Configurar domínio e DNS
2. Configurar SSL via Traefik
3. Criar usuário administrador
4. Configurar backups automáticos
5. Configurar monitoramento (opcional)

## Notas Importantes

- O script `install-server.sh` será idempotente (pode rodar múltiplas vezes)
- Todos os dados persistentes ficam em volumes Docker
- Logs ficam disponíveis via `docker-compose logs`
- Atualizações podem ser feitas via `scripts/server/update.sh`