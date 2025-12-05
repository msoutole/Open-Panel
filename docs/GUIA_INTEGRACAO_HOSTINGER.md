# 🌐 OpenPanel - Guia de Integração Hostinger

Este documento centraliza toda a documentação referente à integração do OpenPanel com a Hostinger, cobrindo DDNS (Dynamic DNS), gestão de DNS via MCP (Model Context Protocol) e automação de VPS.

---

## 📑 Índice

1. [Visão Geral da Integração](#1-visão-geral-da-integração)
2. [Setup de DDNS (IP Dinâmico)](#2-setup-de-ddns-ip-dinâmico)
   - [Instalação Automática](#instalação-automática)
   - [Configuração DNS](#configuração-dns)
   - [Integração com API](#integração-com-api)
3. [Hostinger-MCP (API e Automação)](#3-hostinger-mcp-api-e-automação)
   - [Configuração](#configuração)
   - [Ferramentas Disponíveis](#ferramentas-disponíveis)
   - [Exemplos de Uso](#exemplos-de-uso)
4. [Gerenciamento de DNS](#4-gerenciamento-de-dns)
5. [Referência Técnica](#5-referência-técnica)

---

## 1. Visão Geral da Integração

O OpenPanel se integra à Hostinger de duas formas principais:
1.  **DDNS Nativo**: Para servidores em Home Lab com IP dinâmico, usando `ddclient` para atualizar o registro na Hostinger.
2.  **Hostinger-MCP**: Um serviço interno da API (`HostingerMCPService`) que permite controlar Domínios, DNS e VPS programaticamente.

---

## 2. Setup de DDNS (IP Dinâmico)

Ideal para quem roda o OpenPanel em casa e precisa que o domínio `home.seudominio.com` aponte sempre para o IP correto.

### Instalação Automática

No servidor Ubuntu, execute o script que instala e configura o `ddclient`:

```bash
wget -O /tmp/setup-ddns.sh https://raw.githubusercontent.com/msoutole/openpanel/main/scripts/server/setup-ddns-hostinger.sh
sudo bash /tmp/setup-ddns.sh
```

**O script solicitará:**
- Host DDNS: `all.ddnskey.com` (Padrão Hostinger)
- Usuário/Senha: Obtidos no painel da Hostinger (DNS Zone)
- Domínio: ex. `home.soullabs.com.br`

### Configuração DNS

Após configurar o cliente, crie o registro na Hostinger (hPanel):
- **Tipo**: `A`
- **Nome**: `home`
- **Valor**: `1.1.1.1` (será atualizado automaticamente em ~5min)
- **TTL**: 3600

### Integração com API (Opcional)

Para monitorar atualizações via painel OpenPanel, adicione ao `.env`:
```env
DDNS_DOMAIN=seudominio.com.br
DDNS_SUBDOMAIN=home
DDNS_CHECK_INTERVAL=300000
```

---

## 3. Hostinger-MCP (API e Automação)

O **Hostinger-MCP** abstrai a API da Hostinger para uso interno.

### Configuração

1.  Obtenha um API Token no hPanel com permissões de `domains`, `dns` e `vps`.
2.  Configure no `.env`:
    ```env
    HOSTINGER_API_TOKEN=seu_token_aqui
    HOSTINGER_API_URL=https://api.hostinger.com/v1
    ```

### Ferramentas Disponíveis

A integração oferece ferramentas categorizadas:

*   **DNS**: `getDNSRecords`, `createRecord`, `updateRecord`, `deleteRecord`.
*   **Domínios**: `getDomainList`, `getDomainDetails`, `purchaseNewDomain`.
*   **VPS**: `getVirtualMachines`, `setHostname`, `installMonarx`.
*   **Billing**: `cancelSubscription`.

### Exemplos de Uso

**Listar Domínios via API:**
```bash
curl -H "Authorization: Bearer SEU_JWT" http://localhost:3001/api/hostinger/domains
```

**Atualizar IP via DDNS Endpoint:**
```bash
curl -X POST http://localhost:3001/api/hostinger/ddns/update \
  -d '{"domain":"site.com", "subdomain":"home", "ip":"200.200.200.200"}'
```

---

## 4. Gerenciamento de DNS

Para expor serviços (AdGuard, Traefik, App), use **CNAMEs** apontando para seu domínio DDNS.

| Serviço | Tipo | Nome | Valor (Aponta para) |
| :--- | :--- | :--- | :--- |
| Base (DDNS) | A | `home` | *IP Dinâmico (Atualizado pelo ddclient)* |
| Painel | CNAME | `panel` | `home.seudominio.com` |
| AdGuard | CNAME | `adguard` | `home.seudominio.com` |
| Traefik | CNAME | `traefik` | `home.seudominio.com` |

> **Script Auxiliar**: Use `./scripts/setup/configure-hostinger-dns.sh` para gerar instruções passo-a-passo baseadas no seu domínio.

---

## 5. Referência Técnica

### Estrutura de Código
- **Service**: `apps/api/src/services/hostinger-mcp.service.ts` (Singleton)
- **Rotas**: `apps/api/src/routes/hostinger/index.ts`
- **Scripts**: `scripts/server/setup-ddns-hostinger.sh`

### Troubleshooting

*   **DDNS não atualiza**: Verifique `sudo journalctl -u ddclient -f`.
*   **Erro 401 na API**: Verifique se o Token Hostinger expirou ou tem permissões insuficientes.
*   **Domínio não resolve**: Use `nslookup` ou `dig` para verificar a propagação (pode levar até 48h, mas geralmente é rápido).
*   **Conexão Recusada**: Verifique se o firewall permite conexão com `api.hostinger.com` e `all.ddnskey.com`.
