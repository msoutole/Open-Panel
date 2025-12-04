# Guia de Configuração de Home Lab

Este guia fornece instruções completas para configurar um Home Lab com Open Panel, incluindo IP estático, AdGuard Home e domínio externo.

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração de IP Estático](#configuração-de-ip-estático)
4. [Instalação do AdGuard Home](#instalação-do-adguard-home)
5. [Configuração de Domínio Externo](#configuração-de-domínio-externo)
6. [Integração com Traefik](#integração-com-traefik)
7. [Troubleshooting](#troubleshooting)

## Visão Geral

O Home Lab permite:

- **IP Estático**: Garantir que o servidor sempre tenha o mesmo endereço IP na rede local
- **AdGuard Home**: Servidor DNS local com bloqueio de anúncios e rastreamento
- **Domínio Externo**: Acessar o servidor de qualquer lugar usando um domínio personalizado

## Pré-requisitos

- Servidor Ubuntu/Debian com acesso root ou sudo
- Docker e Docker Compose instalados
- Roteador com acesso administrativo (para port forwarding)
- Domínio registrado (opcional, para acesso externo)

## Configuração de IP Estático

### Por que usar IP Estático?

Um IP estático garante que o servidor sempre tenha o mesmo endereço na rede local, facilitando:
- Configuração de port forwarding no roteador
- Acesso consistente via domínio local
- Integração com outros serviços

### Passo a Passo

1. **Verificar configuração atual**:
   ```bash
   ./scripts/setup/check-network.sh
   ```

2. **Configurar IP estático**:
   ```bash
   sudo ./scripts/setup/configure-static-ip.sh
   ```

3. **O script irá**:
   - Detectar a interface de rede ativa
   - Mostrar a configuração atual
   - Solicitar IP, gateway, subnet e DNS desejados
   - Criar configuração Netplan
   - Aplicar as mudanças

4. **Verificar configuração**:
   ```bash
   ip addr show
   ping -c 3 <gateway>
   ```

### Notas Importantes

- ⚠️ **Backup automático**: O script cria backup da configuração antes de modificar
- ⚠️ **Teste de conectividade**: Após aplicar, verifique se a conexão ainda funciona
- ⚠️ **Reverter mudanças**: Se perder conexão, restaure o backup:
  ```bash
  sudo cp /etc/netplan/01-static-ip.yaml.backup.* /etc/netplan/01-static-ip.yaml
  sudo netplan apply
  ```

## Instalação do AdGuard Home

### O que é AdGuard Home?

AdGuard Home é um servidor DNS local que:
- Bloqueia anúncios e rastreamento
- Fornece estatísticas de DNS
- Permite configuração de filtros personalizados
- Funciona como DNS para toda a rede

### Passo a Passo

1. **Instalar AdGuard Home**:
   ```bash
   sudo ./scripts/setup/install-adguard.sh
   ```

2. **O script irá**:
   - Verificar se systemd-resolved está ativo
   - Oferecer desabilitar systemd-resolved (necessário para usar porta 53)
   - Iniciar AdGuard via Docker Compose
   - Configurar domínio local

3. **Configuração inicial**:
   - Acesse: `http://adguard.openpanel.local`
   - Complete o setup inicial no painel web
   - Configure usuário e senha do administrador

4. **Configurar DNS na rede**:
   - **Roteador**: Configure o DNS do roteador para apontar para o IP do servidor
   - **Dispositivos individuais**: Configure DNS manualmente para usar o IP do servidor

### Gerenciamento

- **Iniciar**: `./scripts/server/start-adguard.sh`
- **Parar**: `./scripts/server/stop-adguard.sh`
- **Status**: Verifique via `docker ps | grep adguard`

### Integração com Traefik

O AdGuard Home está configurado para ser acessível via Traefik em:
- `http://adguard.openpanel.local` (local)
- `http://adguard.<seu-dominio>` (externo, se configurado)

## Configuração de Domínio Externo

### Visão Geral

Para acessar o servidor de qualquer lugar, você precisa:
1. **No-IP DUC**: Atualizar dinamicamente o IP público (se tiver IP dinâmico)
2. **Hostinger DNS**: Configurar registros DNS apontando para o servidor
3. **Port Forwarding**: Redirecionar portas no roteador

### Passo a Passo

1. **Configurar domínio**:
   ```bash
   ./scripts/setup/configure-domain.sh
   ```

2. **O script irá solicitar**:
   - Domínio principal
   - Provedor de DNS (Hostinger ou manual)
   - Credenciais No-IP (se usar IP dinâmico)
   - API Key da Hostinger (para configuração automática)

3. **Instalar No-IP DUC** (se necessário):
   ```bash
   sudo ./scripts/setup/install-noip-duc.sh <username> <password> <hostname>
   ```

4. **Configurar DNS na Hostinger**:
   ```bash
   ./scripts/setup/configure-hostinger-dns.sh <domain> <api_key> <noip_hostname>
   ```

### Port Forwarding no Roteador

Configure as seguintes portas no seu roteador:

- **Porta 80 (HTTP)** → IP do servidor:80
- **Porta 443 (HTTPS)** → IP do servidor:443

⚠️ **IMPORTANTE**: NÃO exponha a porta 53 (DNS) para a internet!

### Verificação de CGNAT

Se você estiver em CGNAT (Carrier-Grade NAT), o port forwarding não funcionará. Verifique:

```bash
# Obter IP público
curl ifconfig.me

# Comparar com IP do roteador
# Se forem diferentes, você está em CGNAT
```

**Alternativas para CGNAT**:
- **Cloudflare Tunnel**: Túnel seguro sem port forwarding
- **Tailscale**: VPN mesh para acesso remoto
- **Solicitar IP público**: Contate seu provedor de internet

## Integração com Traefik

O Traefik está configurado para rotear automaticamente os serviços:

### Domínios Locais
- `dev.openpanel.local` → Ambiente de desenvolvimento
- `pre.openpanel.local` → Ambiente de staging
- `openpanel.local` → Ambiente de produção
- `adguard.openpanel.local` → AdGuard Home
- `traefik.openpanel.local` → Dashboard do Traefik

### Domínios Externos (se configurado)
- `<seu-dominio>` → Ambiente de produção
- `adguard.<seu-dominio>` → AdGuard Home
- `traefik.<seu-dominio>` → Dashboard do Traefik

### SSL Automático

O Traefik está configurado para obter certificados SSL automaticamente via Let's Encrypt para domínios externos.

## Troubleshooting

### Problema: Perdi a conexão após configurar IP estático

**Solução**:
```bash
# Restaurar backup
sudo cp /etc/netplan/01-static-ip.yaml.backup.* /etc/netplan/01-static-ip.yaml
sudo netplan apply
```

### Problema: AdGuard não inicia (porta 53 em uso)

**Solução**:
```bash
# Verificar o que está usando a porta 53
sudo lsof -i :53

# Desabilitar systemd-resolved
sudo ./scripts/setup/disable-systemd-resolved.sh
```

### Problema: Domínio não resolve

**Soluções**:
1. Aguardar propagação DNS (pode levar até 48h)
2. Verificar registros DNS: `dig <seu-dominio>`
3. Verificar port forwarding no roteador
4. Verificar se está em CGNAT

### Problema: Não consigo acessar externamente

**Verificações**:
1. IP público está correto? `curl ifconfig.me`
2. Port forwarding configurado no roteador?
3. Firewall do servidor permite portas 80/443?
4. Está em CGNAT? (use alternativas como Tailscale)

## Próximos Passos

- Configure filtros personalizados no AdGuard Home
- Configure backups automáticos
- Configure monitoramento e alertas
- Documente suas configurações personalizadas

## Referências

- [Documentação do AdGuard Home](https://github.com/AdguardTeam/AdGuardHome)
- [Documentação do Traefik](https://doc.traefik.io/traefik/)
- [Guia de No-IP DUC](https://www.noip.com/support/knowledgebase/install-the-linux-dynamic-update-client/)
- [Documentação do Netplan](https://netplan.io/)

