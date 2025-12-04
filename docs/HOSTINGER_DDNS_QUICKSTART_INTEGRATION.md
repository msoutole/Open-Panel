# Hostinger DDNS Setup - Guia Rápido

## 📋 O que foi criado?

Você agora tem uma **solução completa** para configurar DDNS nativo da Hostinger (ddnskey.com) + integração com o backend Open-Panel via Hostinger-MCP.

### 📦 Arquivos Criados

- `scripts/server/setup-ddns-hostinger.sh` - Script de instalação automatizado
- `docs/HOSTINGER_DDNS_SETUP.md` - Guia completo (manual + script)
- `docs/HOSTINGER_MCP_INTEGRATION.md` - Integração Hostinger-MCP
- `apps/api/src/services/hostinger.service.ts` - Serviço backend
- `apps/api/src/routes/hostinger/index.ts` - Rotas de API

---

## 🚀 Passo 1 - Executar no Ubuntu Server

Copie este comando no seu servidor Ubuntu:

```bash
wget -O /tmp/setup-ddns.sh https://raw.githubusercontent.com/seu-usuario/open-panel/feature/home-lab-integration/scripts/server/setup-ddns-hostinger.sh
sudo bash /tmp/setup-ddns.sh
```

O script vai:

- Instalar `ddclient`
- Pedir suas credenciais com segurança
- Configurar `/etc/ddclient.conf`
- Iniciar o serviço automaticamente
- Ativar boot automático

---

## 🔧 Passo 2 - Criar Registro DNS na Hostinger

Depois que o script terminar, você precisa criar o registro DNS:

1. Acesse **hPanel** → **Domínios** → **soullabs.com.br** → **DNS Zone**
2. Clique em **+ Add Record**
3. Preencha:
   - **Type**: `A`
   - **Name**: `home` (ou deixe vazio para root)
   - **Value**: `1.1.1.1` (será atualizado automaticamente)
   - **TTL**: `3600`
4. Salve

O `ddclient` detectará em até 5 minutos e atualizará automaticamente.

---

## ✅ Passo 3 - Verificar (Opcional)

No servidor Ubuntu:

```bash
sudo journalctl -u ddclient -f
```

Você deve ver algo como:

```log
ddclient[12345]: SUCCESS: home.soullabs.com.br - Updated Successfully to 189.xxx.xxx.xxx
```

Teste de conectividade:

```bash
nslookup home.soullabs.com.br
```

Deve resolver para seu IP externo.

---

## 🎯 Passo 4 - Integração com Open-Panel (API)

Se você quiser **monitorar e atualizar via API**, configure:

No `.env` (raiz do projeto):

```bash
HOSTINGER_API_TOKEN=your_api_token_here
HOSTINGER_API_URL=https://api.hostinger.com/v1

DDNS_DOMAIN=soullabs.com.br
DDNS_SUBDOMAIN=home
DDNS_CHECK_INTERVAL=300000
```

Use via API:

```bash
curl -X POST http://localhost:3000/api/hostinger/ddns/update \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "soullabs.com.br",
    "subdomain": "home",
    "ip": "189.xxx.xxx.xxx"
  }'
```

Listar domínios:

```bash
curl http://localhost:3000/api/hostinger/domains
```

Listar registros DNS:

```bash
curl http://localhost:3000/api/hostinger/domains/soullabs.com.br/dns
```

---

## 📚 Documentação Completa

- **Setup Manual/Automático**: [HOSTINGER_DDNS_SETUP.md](./HOSTINGER_DDNS_SETUP.md)
- **Integração com MCP**: [HOSTINGER_MCP_INTEGRATION.md](./HOSTINGER_MCP_INTEGRATION.md)
- **Troubleshooting**: Ver seção de problemas comuns em [HOSTINGER_DDNS_SETUP.md](./HOSTINGER_DDNS_SETUP.md)

---

## 🔐 Dados Sensíveis

⚠️ Lembre-se:

- O arquivo `/etc/ddclient.conf` contém sua senha em PLAIN TEXT
- Ele tem permissões `600` (somente root pode ler)
- **Nunca** faça commit disso no Git
- Considere usar uma senha específica para DDNS (diferente do painel principal)

---

## 🆘 Problemas

Se algo não funcionar:

No servidor Ubuntu:

```bash
sudo systemctl stop ddclient
sudo ddclient -daemon=0 -debug -verbose -noquiet
```

Ver logs:

```bash
sudo tail -f /var/log/syslog | grep ddclient
```

Possíveis causas:

- Domínio não foi criado na Hostinger (veja Passo 2)
- Usuário/senha incorretos
- Firewall bloqueando conexão com `all.ddnskey.com`
- Arquivo de config corrompido

Ver documentação completa para solução detalhada.

---

## 📊 Fluxo Completo

`
Ubuntu Server (ddclient)
  → Detecta IP externo a cada 5 min
  → Envia para Hostinger DDNS

Hostinger DDNS (all.ddnskey.com)
  → Atualiza registro A
  → home.soullabs.com.br → Seu IP

Seu Domínio (soullabs.com.br)
  → Aponta home → seu IP dinâmico
  → CNAMEs apontam para home

Nginx Proxy Manager
  → Recebe requisições
  → Roteia para aplicações locais
`

---

## 🎉 Próximos Passos

1. **Criar CNAMEs na Hostinger** para serviços:
   - `adguard.soullabs.com.br` → CNAME → `home.soullabs.com.br`
   - `openpanel.soullabs.com.br` → CNAME → `home.soullabs.com.br`

2. **Configurar Nginx Proxy Manager** com esses domínios

3. **Opcional**: Usar API de Open-Panel para monitorar atualizações DDNS

---

**Última atualização**: 4 de dezembro de 2025
