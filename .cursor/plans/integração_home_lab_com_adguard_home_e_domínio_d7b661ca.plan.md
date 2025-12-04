---
name: Integração Home Lab com AdGuard Home e Domínio
overview: Integrar configuração completa de Home Lab incluindo IP estático, AdGuard Home (opcional), integração com Traefik, configuração de domínio via Hostinger/No-IP, e scripts automatizados para setup completo.
todos:
  - id: docker-compose-multi-env
    content: Criar docker-compose.yml com profiles para dev, pre e prod, permitindo rodar múltiplos ambientes simultaneamente
    status: completed
  - id: env-configs
    content: Criar arquivos .env.dev, .env.pre e .env.prod com configurações específicas para cada ambiente
    status: completed
  - id: install-server-script
    content: Criar script install-server.sh que configura todos os ambientes e infraestrutura compartilhada
    status: completed
  - id: server-management-scripts
    content: Criar scripts de gerenciamento por ambiente (start-dev.sh, start-pre.sh, start-prod.sh, etc.)
    status: completed
    dependencies:
      - docker-compose-multi-env
  - id: dev-hot-reload
    content: Configurar hot reload para desenvolvimento usando volumes e nodemon/tsx watch
    status: completed
  - id: traefik-multi-env
    content: Configurar Traefik com roteamento para múltiplos ambientes (dev.openpanel.local, pre.openpanel.local, openpanel.local)
    status: completed
  - id: shared-infrastructure
    content: Configurar infraestrutura compartilhada (PostgreSQL, Redis) com bancos separados por ambiente
    status: completed
  - id: server-installation-docs
    content: Criar documentação completa de instalação multi-ambiente (docs/INSTALACAO_SERVIDOR.md)
    status: completed
    dependencies:
      - install-server-script
  - id: remote-development-docs
    content: Criar guia de desenvolvimento remoto com workflow multi-ambiente (docs/DESENVOLVIMENTO_REMOTO.md)
    status: completed
  - id: deployment-workflow
    content: Documentar workflow de deploy entre ambientes (dev → pre → prod)
    status: completed
---

# Integração Home Lab com AdGuard Home e Domínio

## Objetivo

Adaptar as instruções de configuração de Home Lab para integrar ao Open Panel, incluindo IP estático, AdGuard Home opcional, integração com Traefik existente, e configuração de domínio via Hostinger/No-IP.

## Arquivos a Criar/Modificar

### 1. Scripts de Configuração de Rede

**`scripts/setup/configure-static-ip.sh`**

- Script para configurar IP estático via Netplan
- Detecta interface de rede automaticamente
- Pergunta IP desejado, gateway, subnet
- Cria/atualiza arquivo Netplan
- Aplica configuração

**`scripts/setup/check-network.sh`**

- Verifica configuração de rede atual
- Detecta se está usando DHCP ou IP estático
- Mostra informações de interface, gateway, DNS

### 2. AdGuard Home (Opcional)

**`docker-compose.yml`** - Adicionar serviço AdGuard Home:

```yaml
adguard:
  profiles: ["adguard"]
  image: adguard/adguardhome:latest
  container_name: openpanel-adguard
  restart: unless-stopped
  ports:
 - "53:53/tcp"
 - "53:53/udp"
 - "3000:3000/tcp"  # Painel admin (ou outra porta se conflitar)
 - "853:853/tcp"     # DNS-over-HTTPS
 - "784:784/udp"     # DNS-over-QUIC
  volumes:
 - adguard-work:/opt/adguardhome/work
 - adguard-conf:/opt/adguardhome/conf
  networks:
 - openpanel
  labels:
 - "traefik.enable=true"
 - "traefik.http.routers.adguard.rule=Host(`adguard.${DOMAIN:-localhost}`)"
 - "traefik.http.routers.adguard.entrypoints=web"
 - "traefik.http.services.adguard.loadbalancer.server.port=3000"
```

**`scripts/setup/install-adguard.sh`**

- Verifica se systemd-resolved está ativo
- Oferece desabilitar systemd-resolved (com aviso)
- Inicia AdGuard via docker-compose
- Configura DNS local para apontar para AdGuard

**`scripts/setup/disable-systemd-resolved.sh`**

- Script auxiliar para desabilitar systemd-resolved
- Backup da configuração antes de modificar
- Cria resolv.conf estático

### 3. Configuração de Domínio (Hostinger + No-IP)

**`scripts/setup/configure-domain.sh`**

- Script interativo para configurar domínio
- Integra com Hostinger-MCP para criar registros DNS
- Configura No-IP DUC (Dynamic Update Client)
- Cria registros CNAME na Hostinger apontando para No-IP
- Configura subdomínios (adguard, traefik, etc.)

**`scripts/setup/install-noip-duc.sh`**

- Instala cliente No-IP DUC
- Configura autenticação
- Cria serviço systemd para atualização automática
- Configura hostname a ser atualizado

**`scripts/setup/configure-hostinger-dns.sh`**

- Usa Hostinger-MCP para criar registros DNS
- Cria CNAME para www e subdomínios
- Configura TTL apropriado
- Valida configuração

### 4. Integração com Script de Instalação

**`scripts/install-server.sh`** - Adicionar seções:

- Perguntar se deseja configurar IP estático
- Perguntar se deseja instalar AdGuard Home
- Perguntar se deseja configurar domínio (Hostinger/No-IP)
- Chamar scripts apropriados baseado nas respostas

### 5. Documentação

**`docs/HOME_LAB_SETUP.md`**

- Guia completo de configuração de Home Lab
- Passo a passo para IP estático
- Instalação e configuração do AdGuard Home
- Configuração de domínio via Hostinger/No-IP
- Integração com Traefik
- Troubleshooting (CGNAT, port forwarding, etc.)

**`docs/ADGUARD_HOME.md`**

- Documentação específica do AdGuard Home
- Como configurar filtros
- Como usar como DNS local
- Integração com Traefik
- Acesso remoto seguro

**`docs/DOMINIO_EXTERNO.md`**

- Guia de configuração de domínio externo
- Setup Hostinger + No-IP
- Configuração de subdomínios
- Port forwarding no roteador
- Verificação de CGNAT
- Alternativas (Cloudflare Tunnel, Tailscale)

### 6. Variáveis de Ambiente

**`.env.example`** - Adicionar:

```bash
# Home Lab / Network
STATIC_IP=
NETWORK_INTERFACE=
GATEWAY_IP=
SUBNET=

# AdGuard Home
ADGUARD_ENABLED=false
ADGUARD_ADMIN_PORT=3000
ADGUARD_DNS_PORT=53

# Domain Configuration
DOMAIN=
DOMAIN_PROVIDER=hostinger
NOIP_USERNAME=
NOIP_PASSWORD=
NOIP_HOSTNAME=
HOSTINGER_API_KEY=
```

### 7. Scripts de Gerenciamento

**`scripts/server/start-adguard.sh`**

- Inicia AdGuard Home
- Verifica se systemd-resolved está desabilitado
- Configura DNS local

**`scripts/server/stop-adguard.sh`**

- Para AdGuard Home
- Restaura DNS se necessário

**`scripts/server/status-network.sh`**

- Mostra status da rede
- IP estático/dinâmico
- Gateway, DNS
- Status do AdGuard
- Status do No-IP DUC

## Fluxo de Instalação

1. **Instalação Base** (já existe)

            - Docker, Node.js, dependências

2. **Configuração de Rede** (novo - opcional)

            - Pergunta se deseja IP estático
            - Se sim, executa `configure-static-ip.sh`

3. **AdGuard Home** (novo - opcional)

            - Pergunta se deseja instalar AdGuard
            - Se sim, verifica systemd-resolved
            - Oferece desabilitar systemd-resolved
            - Inicia AdGuard via docker-compose
            - Configura rota no Traefik

4. **Configuração de Domínio** (novo - opcional)

            - Pergunta se deseja configurar domínio externo
            - Se sim, pergunta provedor (Hostinger)
            - Coleta informações (domínio, No-IP credentials)
            - Instala No-IP DUC
            - Configura DNS na Hostinger via MCP
            - Cria subdomínios no Traefik

5. **Finalização**

            - Mostra resumo da configuração
            - Instruções de port forwarding
            - URLs de acesso

## Considerações Técnicas

- **Conflito de Portas**: AdGuard precisa da porta 53, que pode estar ocupada por systemd-resolved
- **Traefik Integration**: AdGuard será acessível via Traefik em `adguard.{DOMAIN}`
- **DNS Local**: Após instalar AdGuard, servidores DNS locais devem apontar para ele
- **CGNAT Detection**: Script para detectar se está em CGNAT e sugerir alternativas
- **Port Forwarding**: Documentar quais portas abrir no roteador (80, 443, 53 apenas interno)

## Integração com Hostinger-MCP

Usar `mcp_hostinger-mcp_hosting_*` tools para:

- Criar registros DNS (CNAME)
- Gerenciar subdomínios
- Verificar status de DNS

## Segurança

- Não expor porta 53 (DNS) para internet
- Usar Traefik para acesso ao painel do AdGuard
- SSL automático via Let's Encrypt
- Documentar riscos de CGNAT e alternativas