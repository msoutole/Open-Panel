# AdGuard Home - Documentação

Guia completo de uso e configuração do AdGuard Home no Open Panel.

## Índice

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Configuração Inicial](#configuração-inicial)
4. [Configuração de Filtros](#configuração-de-filtros)
5. [Uso como DNS Local](#uso-como-dns-local)
6. [Integração com Traefik](#integração-com-traefik)
7. [Acesso Remoto Seguro](#acesso-remoto-seguro)
8. [Troubleshooting](#troubleshooting)

## Visão Geral

AdGuard Home é um servidor DNS local que oferece:

- **Bloqueio de anúncios**: Remove anúncios em toda a rede
- **Proteção de privacidade**: Bloqueia rastreamento e telemetria
- **Controle parental**: Filtragem de conteúdo
- **Estatísticas**: Análise de tráfego DNS
- **Filtros personalizados**: Crie seus próprios filtros

## Instalação

### Instalação Automática

`bash
sudo ./scripts/setup/install-adguard.sh
`

O script irá:

1. Verificar se systemd-resolved está ativo
2. Oferecer desabilitar systemd-resolved (necessário)
3. Iniciar AdGuard via Docker Compose
4. Configurar domínio local

### Instalação Manual

`bash

# Iniciar AdGuard

docker compose --profile adguard up -d adguard

# Verificar status

docker ps | grep adguard
`

## Configuração Inicial

### Primeiro Acesso

1. Acesse o painel: `http://adguard.openpanel.local`
2. Complete o setup inicial:
   - Configure usuário e senha do administrador
   - Escolha porta para interface web (padrão: 3000)
   - Configure DNS upstream (recomendado: Cloudflare ou Quad9)

### Configurações Recomendadas

#### DNS Upstream

Recomendamos usar DNS criptografados:

- **Cloudflare**: `https://1.1.1.1/dns-query`, `https://1.0.0.1/dns-query`
- **Quad9**: `https://9.9.9.9/dns-query`, `https://149.112.112.112/dns-query`
- **Google**: `https://8.8.8.8/dns-query`, `https://8.8.4.4/dns-query`

#### Bootstrap DNS

Configure servidores DNS para resolver nomes dos servidores upstream:

`
1.1.1.1
8.8.8.8
`

## Configuração de Filtros

### Filtros Recomendados

Adicione os seguintes filtros em **Filtros → Bloqueio de anúncios**:

1. **AdGuard Base Filter**: Bloqueio básico de anúncios
2. **AdGuard Tracking Protection**: Proteção contra rastreamento
3. **AdGuard Social Media**: Bloqueio de widgets de redes sociais
4. **AdGuard Annoyances**: Bloqueio de pop-ups e avisos
5. **EasyList**: Lista adicional de anúncios
6. **EasyPrivacy**: Proteção adicional de privacidade

### Filtros em Português

- **AdGuard Portuguese Filter**: Anúncios em português
- **Lista BR**: Lista brasileira de bloqueio

### Filtros Personalizados

Você pode criar filtros personalizados em **Filtros → Filtros personalizados**:

`

# Exemplo: Bloquear domínio específico

||exemplo.com^
`

## Uso como DNS Local

### Configuração no Roteador (Recomendado)

Configure o DNS do roteador para apontar para o IP do servidor:

1. Acesse o painel do roteador
2. Vá em **Configurações de Rede** ou **DNS**
3. Configure DNS primário: `<IP_DO_SERVIDOR>`
4. Salve e reinicie o roteador

Todos os dispositivos na rede usarão automaticamente o AdGuard Home.

### Configuração por Dispositivo

#### Windows

1. Abra **Configurações de Rede**
2. Vá em **Adaptador de Rede**
3. Propriedades → **Protocolo IPv4**
4. Configure DNS manual: `<IP_DO_SERVIDOR>`

#### Linux

Edite `/etc/resolv.conf`:

`
nameserver <IP_DO_SERVIDOR>
`

#### macOS

1. **Preferências do Sistema** → **Rede**
2. Avançado → **DNS**
3. Adicione: `<IP_DO_SERVIDOR>`

#### Android

1. **Configurações** → **Wi-Fi**
2. Toque longo na rede conectada
3. Modificar rede → **Opções avançadas**
4. DNS: `<IP_DO_SERVIDOR>`

## Integração com Traefik

O AdGuard Home está configurado para ser acessível via Traefik:

### Acesso Local

- `http://adguard.openpanel.local`

### Acesso Externo (se domínio configurado)

- `http://adguard.<seu-dominio>`
- `https://adguard.<seu-dominio>` (SSL automático via Let's Encrypt)

### Configuração no docker-compose.yml

`yaml
adguard:
  profiles: [ "adguard" ]

# ... configuração

  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.adguard.rule=Host(`adguard.${DOMAIN:-localhost}`)"
    - "traefik.http.routers.adguard.entrypoints=web"
    - "traefik.http.services.adguard.loadbalancer.server.port=3000"
`

## Acesso Remoto Seguro

### ⚠️ Segurança Importante

**NÃO exponha a porta 53 (DNS) para a internet!**

O AdGuard Home deve ser usado apenas na rede local. Para acesso remoto ao painel:

### Opção 1: Via Traefik (Recomendado)

Use o Traefik com SSL automático:

- `https://adguard.<seu-dominio>`

### Opção 2: Via Tailscale

1. Configure Tailscale no servidor
2. Acesse via IP Tailscale: `http://<tailscale-ip>:3000`

### Opção 3: VPN

Configure uma VPN (OpenVPN, WireGuard) e acesse via IP local.

## Troubleshooting

### Problema: AdGuard não inicia

**Verificar logs**:

`bash
docker logs openpanel-adguard
`

**Verificar porta 53**:

`bash
sudo lsof -i :53
`

**Solução**: Desabilitar systemd-resolved

`bash
sudo ./scripts/setup/disable-systemd-resolved.sh
`

### Problema: Dispositivos não usam AdGuard

**Verificações**:

1. DNS configurado corretamente no roteador/dispositivo?
2. Firewall bloqueando porta 53?
3. AdGuard está rodando? `docker ps | grep adguard`

### Problema: Muitos sites bloqueados incorretamente

**Solução**:

1. Desative filtros muito agressivos
2. Adicione exceções em **Filtros → Whitelist**
3. Verifique logs em **Consulta Log** para identificar falsos positivos

### Problema: Performance lenta

**Soluções**:

1. Use DNS upstream mais rápido (Cloudflare, Quad9)
2. Reduza número de filtros ativos
3. Configure cache DNS maior
4. Verifique recursos do servidor

## Comandos Úteis

### Gerenciamento

`bash

# Iniciar

./scripts/server/start-adguard.sh

# Parar

./scripts/server/stop-adguard.sh

# Status

docker ps | grep adguard

# Logs

docker logs -f openpanel-adguard

# Reiniciar

docker compose --profile adguard restart adguard
`

### Backup

`bash

# Backup de configuração

docker exec openpanel-adguard tar czf /opt/adguardhome/conf/backup.tar.gz /opt/adguardhome/conf

# Restaurar backup

docker exec openpanel-adguard tar xzf /opt/adguardhome/conf/backup.tar.gz -C /
`

## Referências

- [Documentação Oficial do AdGuard Home](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [Lista de Filtros](https://filterlists.com/)
- [Guia de Filtros Personalizados](https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters)
