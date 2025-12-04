# Configuração de Domínio Externo

Guia completo para configurar acesso externo ao Open Panel usando domínio personalizado.

## Índice

1. [Visão Geral](#visão-geral)
2. [Setup Hostinger + No-IP](#setup-hostinger--no-ip)
3. [Configuração de Subdomínios](#configuração-de-subdomínios)
4. [Port Forwarding no Roteador](#port-forwarding-no-roteador)
5. [Verificação de CGNAT](#verificação-de-cgnat)
6. [Alternativas](#alternativas)
7. [Troubleshooting](#troubleshooting)

## Visão Geral

Para acessar o Open Panel de qualquer lugar, você precisa:

1. **Domínio registrado** (ex: meusite.com)
2. **DNS dinâmico** (se tiver IP dinâmico) - No-IP DUC
3. **Registros DNS** - Configurar na Hostinger
4. **Port Forwarding** - Redirecionar portas no roteador
5. **Verificar CGNAT** - Se estiver em CGNAT, use alternativas

## Setup Hostinger + No-IP

### Por que Hostinger + No-IP?

- **Hostinger**: Gerencia os registros DNS do domínio
- **No-IP**: Atualiza dinamicamente o IP público (se você tiver IP dinâmico)

### Passo a Passo

1. **Registrar domínio na Hostinger** (se ainda não tiver)

2. **Criar conta No-IP** (se tiver IP dinâmico):
   - Acesse: https://www.noip.com/
   - Crie uma conta gratuita
   - Crie um hostname (ex: meusite.ddns.net)

3. **Configurar via script**:
   ```bash
   ./scripts/setup/configure-domain.sh
   ```

4. **O script irá**:
   - Solicitar domínio principal
   - Perguntar sobre No-IP
   - Instalar No-IP DUC (se necessário)
   - Configurar DNS na Hostinger
   - Atualizar arquivos .env

### Instalação Manual do No-IP DUC

Se preferir instalar manualmente:

```bash
sudo ./scripts/setup/install-noip-duc.sh <username> <password> <hostname>
```

O script irá:
- Baixar e compilar o cliente No-IP
- Configurar autenticação
- Criar serviço systemd
- Iniciar atualização automática

### Verificar No-IP DUC

```bash
# Status
systemctl status noip2

# Logs
journalctl -u noip2 -f

# Informações
/usr/local/bin/noip2 -S
```

## Configuração de Subdomínios

### Subdomínios Padrão

O Open Panel está configurado para os seguintes subdomínios:

- `www.<seu-dominio>` → Site principal
- `adguard.<seu-dominio>` → AdGuard Home
- `traefik.<seu-dominio>` → Dashboard do Traefik
- `dev.<seu-dominio>` → Ambiente de desenvolvimento (se configurado)
- `pre.<seu-dominio>` → Ambiente de staging (se configurado)

### Configuração na Hostinger

#### Via Script (Recomendado)

```bash
./scripts/setup/configure-hostinger-dns.sh <domain> <api_key> <noip_hostname>
```

#### Manual

1. Acesse: https://hpanel.hostinger.com/dns
2. Configure os seguintes registros:

**Se usar No-IP (IP dinâmico)**:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | www | meusite.ddns.net | 3600 |
| CNAME | adguard | meusite.ddns.net | 3600 |
| CNAME | traefik | meusite.ddns.net | 3600 |

**Se usar IP estático**:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | SEU_IP_PUBLICO | 3600 |
| A | www | SEU_IP_PUBLICO | 3600 |
| A | adguard | SEU_IP_PUBLICO | 3600 |
| A | traefik | SEU_IP_PUBLICO | 3600 |

### Verificar Configuração DNS

```bash
# Verificar resolução
dig www.<seu-dominio>
dig adguard.<seu-dominio>

# Verificar propagação
nslookup www.<seu-dominio>
```

⚠️ **Nota**: A propagação DNS pode levar até 48 horas.

## Port Forwarding no Roteador

### Portas Necessárias

Configure as seguintes portas no seu roteador:

| Porta | Protocolo | Destino | Descrição |
|-------|-----------|---------|-----------|
| 80 | TCP | Servidor:80 | HTTP |
| 443 | TCP | Servidor:443 | HTTPS |

### ⚠️ IMPORTANTE: NÃO Expor Porta 53

**NÃO configure port forwarding para a porta 53 (DNS)**. Esta porta deve ser usada apenas na rede local.

### Passo a Passo

1. **Acesse o painel do roteador**:
   - Geralmente: `http://192.168.1.1` ou `http://192.168.0.1`
   - Consulte o manual do roteador

2. **Encontre Port Forwarding**:
   - Pode estar em: **Firewall**, **NAT**, **Port Forwarding**, **Virtual Server**

3. **Configure as regras**:
   - **Nome**: OpenPanel HTTP
   - **Porta Externa**: 80
   - **Porta Interna**: 80
   - **Protocolo**: TCP
   - **IP Interno**: IP do servidor na rede local
   - **Status**: Habilitado

   - **Nome**: OpenPanel HTTPS
   - **Porta Externa**: 443
   - **Porta Interna**: 443
   - **Protocolo**: TCP
   - **IP Interno**: IP do servidor na rede local
   - **Status**: Habilitado

4. **Salve e aplique**

### Verificar Port Forwarding

```bash
# Testar se porta está aberta
nc -zv <seu-ip-publico> 80
nc -zv <seu-ip-publico> 443

# Ou use ferramentas online:
# https://www.yougetsignal.com/tools/open-ports/
```

## Verificação de CGNAT

### O que é CGNAT?

CGNAT (Carrier-Grade NAT) é quando seu provedor de internet compartilha um IP público entre múltiplos clientes. Neste caso, port forwarding não funciona.

### Como Verificar

```bash
# Obter IP público
curl ifconfig.me

# Obter IP do roteador (via interface web)
# Se forem diferentes, você está em CGNAT
```

### Sintomas de CGNAT

- Port forwarding configurado mas não funciona
- IP público diferente do IP do roteador
- Não consegue acessar serviços externamente

## Alternativas

### 1. Cloudflare Tunnel (Recomendado)

Cloudflare Tunnel cria um túnel seguro sem precisar de port forwarding:

1. **Instalar cloudflared**:
   ```bash
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   sudo chmod +x /usr/local/bin/cloudflared
   ```

2. **Autenticar**:
   ```bash
   cloudflared tunnel login
   ```

3. **Criar túnel**:
   ```bash
   cloudflared tunnel create openpanel
   ```

4. **Configurar roteamento**:
   ```bash
   cloudflared tunnel route dns openpanel <seu-dominio>
   ```

5. **Iniciar túnel**:
   ```bash
   cloudflared tunnel run openpanel
   ```

### 2. Tailscale (VPN Mesh)

Tailscale cria uma VPN mesh para acesso remoto:

1. **Instalar Tailscale** (já incluído no Open Panel)
2. **Configurar TAILSCALE_AUTHKEY** no .env
3. **Acessar via IP Tailscale**: `http://<tailscale-ip>:3000`

### 3. Solicitar IP Público

Contate seu provedor de internet e solicite um IP público estático. Pode haver custo adicional.

## Troubleshooting

### Problema: Domínio não resolve

**Verificações**:
1. Aguardou propagação DNS? (pode levar até 48h)
2. Registros DNS estão corretos? `dig <seu-dominio>`
3. Domínio está apontando para IP correto?

**Solução**:
```bash
# Verificar DNS
dig <seu-dominio> @8.8.8.8

# Limpar cache DNS local
sudo systemd-resolve --flush-caches
```

### Problema: Não consigo acessar externamente

**Verificações**:
1. Port forwarding configurado?
2. Firewall do servidor permite portas 80/443?
3. Está em CGNAT?
4. IP público está correto?

**Soluções**:
```bash
# Verificar firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar se porta está aberta
sudo netstat -tuln | grep -E ':(80|443)'

# Testar localmente
curl http://localhost
```

### Problema: SSL não funciona

**Verificações**:
1. Let's Encrypt configurado? `SSL_EMAIL` no .env
2. Domínio está resolvendo corretamente?
3. Porta 80 está acessível? (necessária para validação)

**Solução**:
```bash
# Verificar logs do Traefik
docker logs openpanel-traefik

# Verificar certificados
ls -la ./traefik-data/
```

### Problema: No-IP não atualiza

**Verificações**:
1. No-IP DUC está rodando? `systemctl status noip2`
2. Credenciais estão corretas?
3. Hostname está ativo na conta No-IP?

**Solução**:
```bash
# Verificar logs
journalctl -u noip2 -f

# Reiniciar serviço
sudo systemctl restart noip2

# Testar manualmente
/usr/local/bin/noip2 -S
```

## Referências

- [Documentação do No-IP](https://www.noip.com/support/knowledgebase/)
- [Documentação do Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Guia de Port Forwarding](https://portforward.com/)

