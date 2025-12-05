# 🏗️ OpenPanel - Guia de Infraestrutura e Instalação

Este documento consolida todas as instruções para instalação, configuração de rede, serviços de infraestrutura (AdGuard, Tailscale) e resolução de problemas.

---

## 📑 Índice

1. [Instalação do Servidor](#1-instalação-do-servidor)
   - [Requisitos](#requisitos)
   - [Instalação Automática](#instalação-automática)
   - [Variáveis de Ambiente](#variáveis-de-ambiente)
2. [Configuração Homelab](#2-configuração-homelab)
   - [IP Estático](#ip-estático)
   - [DNS Local](#dns-local)
3. [Acesso Remoto e Redes](#3-acesso-remoto-e-redes)
   - [Tailscale (VPN)](#tailscale-vpn)
   - [Domínio Externo e SSL](#domínio-externo-e-ssl)
   - [No-IP e CGNAT](#no-ip-e-cgnat)
4. [Serviços Integrados](#4-serviços-integrados)
   - [AdGuard Home](#adguard-home)
   - [Traefik](#traefik)
5. [Troubleshooting e Manutenção](#5-troubleshooting-e-manutenção)

---

## 1. Instalação do Servidor

### Requisitos
- **OS**: Ubuntu Server 20.04+ ou Debian 11+
- **Hardware**: Mínimo 2GB RAM, 20GB Disco
- **Rede**: Acesso à internet e IP (preferencialmente estático)

### Instalação Automática

O script `install-server.sh` foi totalmente reescrito para ser **robusto, idempotente e à prova de falhas**. Ele gerencia dependências (Docker, Node.js LTS), firewall (UFW), banco de dados e configurações iniciais com auto-recuperação.

```bash
# 1. Clonar repositório
cd /opt
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Executar instalação (como root/sudo)
chmod +x scripts/install-server.sh
sudo ./scripts/install-server.sh
```

**Opções de Instalação (Variáveis de Ambiente):**

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `HEADLESS_MODE` | Instalação sem interação humana (ideal para automação) | `false` |
| `SKIP_TAILSCALE` | Pula a configuração da VPN Tailscale | `false` |
| `STRICT_CHECK` | Falha se requisitos de hardware não forem atendidos (vs aviso) | `false` |
| `MIN_RAM_MB` | Define mínimo de RAM exigido em MB | `2048` |
| `MIN_DISK_GB` | Define mínimo de disco exigido em GB | `10` |
| `TAILSCALE_AUTHKEY` | Chave de autenticação para setup automático do Tailscale | - |

Exemplos:
- **Automação total:** `sudo HEADLESS_MODE=true TAILSCALE_AUTHKEY=tskey-xxx ./scripts/install-server.sh`
- **Hardware modesto:** `sudo MIN_RAM_MB=1024 ./scripts/install-server.sh`
- **Validação rigorosa:** `sudo STRICT_CHECK=true ./scripts/install-server.sh`

### Características do Instalador
- **Idempotente:** Pode ser executado múltiplas vezes sem quebrar a instalação existente.
- **Auto-Recuperação:** Tenta corrigir travamentos do `apt` e serviços parados automaticamente.
- **Logs Detalhados:** Tudo é registrado em `install-server.log`.
- **Health Checks:** Aguarda ativamente o banco de dados e Docker estarem saudáveis antes de concluir.

### Variáveis de Ambiente
O instalador cria um `.env` na raiz. **Configure imediatamente:**
- `POSTGRES_PASSWORD` / `REDIS_PASSWORD`: Senhas do banco.
- `JWT_SECRET`: Gere com `openssl rand -hex 64`.
- `APP_URL`: URL final (ex: `https://painel.seudominio.com`).

---

## 2. Configuração Homelab

### IP Estático
Para servidores caseiros, um IP estático evita perda de acesso.

```bash
# Executar assistente de IP estático
sudo ./scripts/setup/configure-static-ip.sh
```
*O script detecta a interface, cria backup do Netplan e aplica a nova configuração com validação automática.*

---

## 3. Acesso Remoto e Redes

### Tailscale (VPN)
Acesso seguro sem abrir portas no roteador.

**Configuração Rápida:**
1. Gere uma Auth Key em [login.tailscale.com](https://login.tailscale.com/admin/settings/keys).
2. Execute:
   ```bash
   ./scripts/setup-tailscale.sh tskey-auth-SUA-CHAVE-AQUI
   ```
3. Acesse via IP da VPN: `http://100.x.x.x:3000`

### Domínio Externo e SSL

**Cenário 1: IP Público Estático (VPS)**
Aponte o registro `A` do seu domínio para o IP do servidor. O Traefik gerará SSL automaticamente.

**Cenário 2: IP Dinâmico (Casa)**
Use **No-IP** + **Hostinger DNS** (Recomendado).

1. **Instalar No-IP DUC**:
   ```bash
   sudo ./scripts/setup/install-noip-duc.sh <user> <pass> <hostname>
   ```
2. **Configurar CNAMEs na Hostinger**:
   Aponte `painel.seudominio.com` (CNAME) para `seu-ddns.no-ip.net`.
   *Veja o guia específico de Hostinger para detalhes de automação.*

### No-IP e CGNAT
Se o IP da WAN do roteador for diferente do IP público (`curl ifconfig.me`), você está em CGNAT.
- **Solução**: Use **Tailscale** ou **Cloudflare Tunnel**. Port forwarding não funcionará.

---

## 4. Serviços Integrados

### AdGuard Home
DNS local com bloqueio de anúncios.

**Instalação:**
```bash
sudo ./scripts/setup/install-adguard.sh
```
*Nota: O script resolve conflitos com `systemd-resolved` na porta 53 automaticamente.*

**Acesso:** `http://adguard.openpanel.local` (Porta 3000 interna, mapeada via Traefik).

**Filtros Recomendados:** AdGuard Base, Tracking Protection, EasyList Português.

---

## 5. Troubleshooting e Manutenção

### Problemas Comuns

#### 🔴 Porta 3000/53 em uso
**Erro**: `bind: address already in use`.
**Solução**:
1. Identifique o processo: `sudo lsof -i :3000`
2. Se for `systemd-resolved` na porta 53:
   ```bash
   sudo ./scripts/setup/disable-systemd-resolved.sh
   ```

#### 🔴 Erro no Netplan (Perda de Conexão)
O script de IP estático cria backups. Para restaurar fisicamente:
```bash
sudo cp /etc/netplan/01-static-ip.yaml.backup.* /etc/netplan/01-static-ip.yaml
sudo netplan apply
```

#### 🟡 Containers não iniciam
1. Verifique logs: `docker compose logs -f`
2. Reinicie a stack:
   ```bash
   docker compose down
   npm start
   ```

### Comandos Úteis

- **Status Geral**: `./scripts/server/status.sh`
- **Logs (Produção)**: `./scripts/server/logs-prod.sh`
- **Backup Banco**: `~/backup-openpanel.sh` (se configurado no cron)
