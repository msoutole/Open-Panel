# Hostinger DDNS - Referência Rápida

## 🎯 Visão Geral

**O que**: Configurar DDNS automático via Hostinger (ddnskey.com) para seu servidor home lab
**Como**: `ddclient` em Ubuntu + API Hostinger-MCP no Open-Panel
**Por quê**: IP externo dinâmico? O ddclient detecta mudanças e atualiza automaticamente na Hostinger

---

## 📦 Arquivos Entregues

| Arquivo                                         | Propósito                             |
| ----------------------------------------------- | ------------------------------------- |
| `scripts/server/setup-ddns-hostinger.sh`        | Script bash automatizado para Ubuntu  |
| `docs/HOSTINGER_DDNS_SETUP.md`                  | Documentação completa (manual + auto) |
| `docs/HOSTINGER_MCP_INTEGRATION.md`             | Integração com backend                |
| `docs/HOSTINGER_DDNS_QUICKSTART_INTEGRATION.md` | Guia de início rápido                 |
| `apps/api/src/services/hostinger.service.ts`    | Serviço backend Hostinger             |
| `apps/api/src/routes/hostinger/index.ts`        | Rotas de API REST                     |

---

## ⚡ Início Rápido (5 minutos)

### 1. No Ubuntu Server

```bash
wget -O /tmp/setup-ddns.sh https://raw.githubusercontent.com/seu-usuario/open-panel/feature/home-lab-integration/scripts/server/setup-ddns-hostinger.sh
sudo bash /tmp/setup-ddns.sh
```

Será pedido:

- Host DDNS: `all.ddnskey.com`
- Usuário: `71zkxtb`
- Senha: `6BLEeUqYJWGn`
- Domínio: `home.soullabs.com.br`

### 2. Na Hostinger

hPanel → DNS Zone → **+ Add Record**

| Campo | Valor   |
| ----- | ------- |
| Type  | A       |
| Name  | home    |
| Value | 1.1.1.1 |
| TTL   | 3600    |

✅ Pronto! Em até 5 minutos o IP será atualizado automaticamente.

---

## 🔧 Verificação

```bash
# Ver logs em tempo real
sudo journalctl -u ddclient -f

# Testar resolução
nslookup home.soullabs.com.br
```

---

## 🌐 API (Opcional)

Se quiser usar via backend Open-Panel:

### `.env` (raiz)

```bash
HOSTINGER_API_TOKEN=seu_token_aqui
DDNS_DOMAIN=soullabs.com.br
DDNS_SUBDOMAIN=home
```

### Endpoints

```bash
# Atualizar IP manualmente
POST /api/hostinger/ddns/update
{
  "domain": "soullabs.com.br",
  "subdomain": "home",
  "ip": "189.xxx.xxx.xxx"
}

# Listar domínios
GET /api/hostinger/domains

# Listar DNS
GET /api/hostinger/domains/soullabs.com.br/dns
```

---

## ⚠️ Segurança

- `/etc/ddclient.conf` contém senha em PLAIN TEXT
- Permissões: `600` (somente root)
- **Não commitar** no Git
- Considere senha específica para DDNS

---

## 🚨 Troubleshooting

```bash
# Debug detalhado
sudo systemctl stop ddclient
sudo ddclient -daemon=0 -debug -verbose -noquiet
```

| Erro                   | Causa              | Solução                        |
| ---------------------- | ------------------ | ------------------------------ |
| Invalid hostname       | Domínio não existe | Criar registro A na Hostinger  |
| Invalid authentication | Usuário/senha      | Verificar credenciais          |
| Cannot connect         | Firewall/DNS       | Testar: `ping all.ddnskey.com` |

---

## 📚 Referências

- Setup detalhado: `docs/HOSTINGER_DDNS_SETUP.md`
- Integração API: `docs/HOSTINGER_MCP_INTEGRATION.md`
- Guia completo: `docs/HOSTINGER_DDNS_QUICKSTART_INTEGRATION.md`

---

**Criado**: 4 de dezembro de 2025
