# Quick Start - Hostinger-MCP Integration

## 5 Passos para Começar

### 1️⃣ Configurar Token Hostinger

```bash
# Abra .env na raiz do projeto
cd d:\Open-Panel

# Adicione seu token (obtém em hPanel → Settings → API Tokens)
HOSTINGER_API_TOKEN=seu_bearer_token_aqui
```

### 2️⃣ Iniciar Ambiente

```bash
# Inicia API, Web e Infraestrutura
npm start

# Ou para modo dev
npm run dev
```

### 3️⃣ Verificar Conectividade

```bash
# Health check
curl http://localhost:3001/api/hostinger/health

# Resposta esperada:
# {"success":true,"service":"hostinger-mcp","status":"connected"}
```

### 4️⃣ Testar Operações Básicas

```bash
# Listar domínios
curl -H "Authorization: Bearer SEUS_TOKEN" \
  http://localhost:3001/api/hostinger/domains

# Listar registros DNS
curl -H "Authorization: Bearer SEUS_TOKEN" \
  http://localhost:3001/api/hostinger/domains/soullabs.com.br/dns
```

### 5️⃣ Configurar DDNS (Ubuntu Server)

```bash
# SSH para seu servidor Ubuntu
ssh usuario@seu_servidor

# Execute script de instalação
sudo bash -c 'curl -fsSL https://raw.githubusercontent.com/.../setup-ddns-hostinger.sh | bash'

# Ou manualmente:
sudo apt-get install ddclient

# Configure:
sudo nano /etc/ddclient.conf

# Adicione:
daemon=300
ssl=yes
protocol=dyndns2
server=all.ddnskey.com
login=71zkxtb
password=6BLEeUqYJWGn
soullabs.com.br
```

## 🎯 Operações Principais

### Atualizar DDNS Manualmente

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "soullabs.com.br",
    "subdomain": "home",
    "ip": "203.0.113.42"
  }' \
  http://localhost:3001/api/hostinger/ddns/update
```

### Criar Registro DNS

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "A",
    "name": "api",
    "value": "192.0.2.100",
    "ttl": 3600
  }' \
  http://localhost:3001/api/hostinger/domains/soullabs.com.br/dns
```

### Atualizar Registro DNS

```bash
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "192.0.2.101"
  }' \
  http://localhost:3001/api/hostinger/domains/soullabs.com.br/dns/record-id-123
```

### Listar VPS

```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/hostinger/vms
```

### Definir Hostname VPS

```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"hostname": "home-server"}' \
  http://localhost:3001/api/hostinger/vms/vm-123/hostname
```

## 📋 Checklist

- [ ] Token Hostinger configurado em `.env`
- [ ] API iniciada: `npm start`
- [ ] Health check respondendo
- [ ] Domínios listando corretamente
- [ ] Registros DNS visíveis
- [ ] ddclient instalado e rodando (se usando DDNS)
- [ ] Teste de atualização DDNS bem-sucedido

## 🐛 Troubleshooting

| Problema                              | Solução                                                |
| ------------------------------------- | ------------------------------------------------------ |
| "HOSTINGER_API_TOKEN não configurado" | Adicione token ao `.env`                               |
| "Hostinger MCP não disponível"        | Verifique se token é válido                            |
| Erro 401                              | Token expirado ou sem permissões                       |
| Registros DNS vazios                  | Domínio inativo na Hostinger                           |
| DDNS não atualiza                     | Verifique ddclient logs: `sudo journalctl -u ddclient` |

## 📚 Documentação Completa

- **Setup Inicial**: `docs/HOSTINGER_DDNS_SETUP.md`
- **Referência de Ferramentas**: `docs/HOSTINGER_MCP_TOOLS_REFERENCE.md`
- **Integração Técnica**: `docs/HOSTINGER_MCP_INTEGRATION.md`
- **Sumário**: `docs/HOSTINGER_MCP_IMPLEMENTATION_SUMMARY.md`

## 🚀 Próximas Operações

### Automação Diária

1. ddclient roda a cada 5 minutos
2. Detecta mudanças de IP
3. Atualiza DNS via endpoint `/api/hostinger/ddns/update`
4. Logs registrados em `apps/api/logs/`

### Monitoramento

```bash
# Ver logs em tempo real
npm run logs:api

# Filtrar por Hostinger
npm run logs:api | grep -i hostinger
```

### Dashboard

Adicione à sua aplicação frontend para:

- Visualizar status DDNS
- Monitorar registros DNS
- Listar VPS disponíveis
- Histórico de mudanças

## 💡 Dicas

1. **Primeiro teste**: Use `/api/hostinger/health` antes de operações
2. **Registros DNS**: Liste registros antes de atualizar
3. **DDNS**: Configure DDNS_DOMAIN em `.env` para configuração padrão
4. **VPS**: Hostname padrão pode ser recuperado com `GET /api/hostinger/vms/:vmId`
5. **Logs**: Sempre verificar logs para troubleshooting

## 🎓 Exemplos de Código

### TypeScript/Node.js

```typescript
// Usar o serviço diretamente
import { getHostingerMCPService } from './services/hostinger-mcp.service';

const service = getHostingerMCPService();

// Listar domínios
const domains = await service.listDomains();
console.log(domains);

// Atualizar DDNS
const result = await service.updateDDNSIP('soullabs.com.br', 'home', '203.0.113.42');
console.log(result);
```

### cURL Rápido

```bash
# Teste all endpoints com uma função bash
test-hostinger() {
  TOKEN="seu_token"
  BASE="http://localhost:3001/api/hostinger"
  
  echo "1. Health Check"
  curl -s $BASE/health | jq .
  
  echo "2. Listar Domínios"
  curl -s -H "Authorization: Bearer $TOKEN" $BASE/domains | jq .
  
  echo "3. Listar VPS"
  curl -s -H "Authorization: Bearer $TOKEN" $BASE/vms | jq .
}

test-hostinger
```

## 🔒 Segurança

⚠️ **NUNCA** commitar token em repositório  
✅ Use `.env` local (adicionado em `.gitignore`)  
✅ Recupere token do secure vault em CI/CD  
✅ Rotacione token regularmente  

## 📊 Histórico de Mudanças

### v1.0.0 (15/01/2025)

- ✅ Implementação completa de HostingerMCPService
- ✅ 12 endpoints REST funcionais
- ✅ Documentação técnica completa
- ✅ Type-safe com TypeScript
- ✅ Integração com middlewares de autenticação

---

**Pronto para usar!** 🚀

Próximo passo: Configure seu token e teste o health check.
