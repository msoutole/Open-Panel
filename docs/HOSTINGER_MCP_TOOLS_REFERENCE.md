# Referência Rápida - Ferramentas Hostinger-MCP

## 🎯 Lista Completa de Ferramentas MCP Disponíveis

### Categorias Principais

| Categoria             | Quantidade | Descrição                           |
| --------------------- | ---------- | ----------------------------------- |
| DNS                   | 6          | Gerenciamento de registros DNS      |
| Domínios              | 3          | Operações com domínios              |
| VPS/Máquinas Virtuais | 6          | Gerenciamento de servidores         |
| Hosting               | 3          | Operações de hosting e websites     |
| Billing               | 4          | Operações de cobrança e subscrições |
| Snapshots DNS         | 2          | Backup e restauração de DNS         |

## 📋 Ferramentas DNS

### `mcp_hostinger-mcp_DNS_getDNSRecordsV1`

Obtém lista de registros DNS para um domínio.

```typescript
// Assinatura
async function getDNSRecords(domain: string): Promise<DNSRecord[]>

// Uso
const records = await service.listDNSRecords('soullabs.com.br');
// Retorna: [{ id, type: 'A', name: '@', value: '192.0.2.1', ttl: 3600 }, ...]
```

### `mcp_hostinger-mcp_DNS_createRecordV1`

Cria um novo registro DNS.

```typescript
// Assinatura
async function createRecord(
  domain: string,
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV',
  name: string,
  value: string,
  ttl?: number,
  priority?: number
): Promise<DNSRecord>

// Uso
const record = await service.createDNSRecord('soullabs.com.br', {
  type: 'A',
  name: 'api',
  value: '192.0.2.100',
  ttl: 3600
});
```

### `mcp_hostinger-mcp_DNS_updateRecordV1`

Atualiza um registro DNS existente.

```typescript
// Assinatura
async function updateRecord(
  domain: string,
  recordId: string,
  updates: Partial<DNSRecord>
): Promise<DNSRecord>

// Uso
const updated = await service.updateDNSRecord('soullabs.com.br', 'record-123', {
  value: '192.0.2.101'
});
```

### `mcp_hostinger-mcp_DNS_deleteRecordV1`

Deleta um registro DNS.

```typescript
// Assinatura
async function deleteRecord(domain: string, recordId: string): Promise<void>

// Uso
await service.deleteDNSRecord('soullabs.com.br', 'record-123');
```

### `mcp_hostinger-mcp_DNS_updateDNSRecordsV1`

Atualiza múltiplos registros DNS em uma operação.

```typescript
// Assinatura
async function updateDNSRecords(
  domain: string,
  records: DNSRecord[]
): Promise<DNSRecord[]>

// Uso
const updated = await service.updateDNSRecords('soullabs.com.br', [
  { type: 'A', name: 'www', value: '192.0.2.1' },
  { type: 'A', name: 'mail', value: '192.0.2.2' }
]);
```

### `mcp_hostinger-mcp_DNS_restoreDNSSnapshotV1`

Restaura DNS a partir de um snapshot anterior.

```typescript
// Assinatura
async function restoreDNSSnapshot(domain: string, snapshotId: number): Promise<void>

// Uso
await restoreDNSSnapshot('soullabs.com.br', 12345);
```

## 🌐 Ferramentas de Domínios

### `mcp_hostinger-mcp_domains_getDomainListV1`

Lista todos os domínios da conta.

```typescript
// Assinatura
async function getDomainList(): Promise<HostingerDomain[]>

// Uso
const domains = await service.listDomains();
// Retorna: [{ id, name: 'soullabs.com.br', status: 'active', expirationDate, ... }, ...]
```

### `mcp_hostinger-mcp_domains_getDomainDetailsV1`

Obtém detalhes de um domínio específico.

```typescript
// Assinatura
async function getDomainDetails(domain: string): Promise<HostingerDomain>

// Uso
const details = await service.getDomain('soullabs.com.br');
// Retorna: { id, name, status, expirationDate, registrationDate, ... }
```

### `mcp_hostinger-mcp_domains_purchaseNewDomainV1`

Registra um novo domínio.

```typescript
// Assinatura
async function purchaseNewDomain(
  domain: string,
  itemId: string,
  paymentMethodId?: number,
  coupons?: string[],
  additionalDetails?: object,
  domainContacts?: object
): Promise<OrderResponse>

// Uso
const order = await service.purchaseDomain('example.com', 'item-id-123');
```

## 🖥️ Ferramentas de VPS

### `mcp_hostinger-mcp_VPS_getVirtualMachinesV1`

Lista todas as máquinas virtuais.

```typescript
// Assinatura
async function getVirtualMachines(): Promise<HostingerVPS[]>

// Uso
const vms = await service.listVirtualMachines();
// Retorna: [{ id: '1', hostname: 'home-server', ipv4: '192.0.2.100', status: 'running' }, ...]
```

### `mcp_hostinger-mcp_VPS_getVirtualMachineDetailsV1`

Obtém detalhes de uma VPS específica.

```typescript
// Assinatura
async function getVirtualMachineDetails(vmId: string): Promise<HostingerVPS>

// Uso
const vm = await service.getVirtualMachine('vm-123');
// Retorna: { id, hostname, ipv4, status, cpu, memory, ... }
```

### `mcp_hostinger-mcp_VPS_setHostnameV1`

Define o hostname de uma VPS.

```typescript
// Assinatura
async function setHostname(virtualMachineId: string, hostname: string): Promise<void>

// Uso
await service.setVirtualMachineHostname('vm-123', 'home-server');
```

### `mcp_hostinger-mcp_VPS_createPublicKeyV1`

Adiciona uma chave SSH pública à conta.

```typescript
// Assinatura
async function createPublicKey(name: string, key: string): Promise<void>

// Uso
await service.addPublicKey('my-key', 'ssh-rsa AAAAB3NzaC1...');
```

### `mcp_hostinger-mcp_VPS_installMonarxV1`

Instala proteção contra malware (Monarx) em uma VPS.

```typescript
// Assinatura
async function installMonarx(virtualMachineId: string): Promise<void>

// Uso
await service.installMonarxProtection('vm-123');
```

### `mcp_hostinger-mcp_VPS_purchaseNewVirtualMachineV1`

Compra e provisiona uma nova VPS.

```typescript
// Assinatura
async function purchaseNewVirtualMachine(
  itemId: string,
  setup: string,
  paymentMethodId?: number,
  coupons?: string[]
): Promise<OrderResponse>

// Uso
const order = await service.purchaseVPS('vps-plan-123', 'ubuntu-20.04');
```

## 🏠 Ferramentas de Hosting

### `mcp_hostinger-mcp_hosting_createWebsiteV1`

Cria um novo website em um domínio.

```typescript
// Assinatura
async function createWebsite(
  domain: string,
  orderId: number,
  datacenterCode?: string
): Promise<void>

// Uso
await service.createWebsite('soullabs.com.br', 12345, 'us-east-1');
```

### `mcp_hostinger-mcp_hosting_generateAFreeSubdomainV1`

Gera um subdomínio gratuito para testes.

```typescript
// Assinatura
async function generateFreeSubdomain(): Promise<string>

// Uso
const subdomain = await service.generateFreeSubdomain();
// Retorna: 'myapp-abc123.hpanel.hostinger.com'
```

### `mcp_hostinger-mcp_hosting_listAvailableDatacentersV1`

Lista datacenters disponíveis para um plano.

```typescript
// Assinatura
async function listAvailableDatacenters(orderId: number): Promise<Datacenter[]>

// Uso
const dcs = await listAvailableDatacenters(12345);
// Retorna: [{ code: 'us-east-1', name: 'United States (East)', ... }, ...]
```

## 💳 Ferramentas de Billing

### `mcp_hostinger-mcp_billing_cancelSubscriptionV1`

Cancela uma subscrição.

```typescript
// Assinatura
async function cancelSubscription(subscriptionId: number): Promise<void>

// Uso
await cancelSubscription(67890);
```

### Outras Operações de Billing

- Listar métodos de pagamento
- Obter informações de cobrança
- Definir método de pagamento padrão
- Deletar métodos de pagamento
- Renovação automática de serviços

## 📸 Ferramentas de Snapshots DNS

### `mcp_hostinger-mcp_DNS_listDNSSnapshotsV1`

Lista snapshots disponíveis para restauração.

```typescript
async function listDNSSnapshots(domain: string): Promise<DNSSnapshot[]>
```

## mcp_hostinger-mcp_DNS_restoreDNSSnapshotV1

Restaura DNS a partir de um snapshot.

```typescript
async function restoreDNSSnapshot(domain: string, snapshotId: number): Promise<void>
```

## 🔐 Configuração e Autenticação

### Variáveis de Ambiente Necessárias

```env
# Token de autenticação Hostinger (obrigatório)
HOSTINGER_API_TOKEN=bearer_token_aqui

# URL da API (padrão: https://api.hostinger.com/v1)
HOSTINGER_API_URL=https://api.hostinger.com/v1

# Timeout das requisições em ms (padrão: 10000)
HOSTINGER_API_TIMEOUT=10000

# Configuração DDNS
DDNS_DOMAIN=soullabs.com.br
DDNS_SUBDOMAIN=home
DDNS_CHECK_INTERVAL=300000
```

### Como Obter API Token

1. Acesse [hPanel Hostinger](https://hpanel.hostinger.com/)
2. Vá para **Configurações** → **API Tokens**
3. Crie novo token com permissões:
   - `domains:read`, `domains:write`
   - `dns:read`, `dns:write`
   - `vps:read`, `vps:write`
   - `billing:read`
4. Copie o token e salve em `.env` da raiz

## 📡 Exemplos de Integração

### Cenário 1: Atualizar DDNS Automaticamente

```typescript
// ddclient (Ubuntu) faz POST para:
POST /api/hostinger/ddns/update
{
  "domain": "soullabs.com.br",
  "subdomain": "home",
  "ip": "203.0.113.42"
}

// Backend:
// 1. Recebe requisição
// 2. Chama service.updateDDNSIP()
// 3. MCP encontra registro A existente
// 4. MCP atualiza valor do registro
// 5. Retorna sucesso
```

### Cenário 2: Criar Registros DNS em Batch

```typescript
const records = [
  { type: 'A', name: '@', value: '192.0.2.1' },
  { type: 'A', name: 'www', value: '192.0.2.1' },
  { type: 'A', name: 'api', value: '192.0.2.2' },
  { type: 'MX', name: '@', value: 'mail.soullabs.com.br', priority: 10 }
];

for (const record of records) {
  await service.upsertDNSRecord('soullabs.com.br', record);
}
```

### Cenário 3: Provisionar Nova VPS

```typescript
// 1. Comprar VPS
const vmOrder = await service.purchaseVPS('vps-plan-123', 'ubuntu-22.04');

// 2. Aguardar provisionamento
await delay(30000);

// 3. Obter detalhes
const vm = await service.getVirtualMachine('vm-123');

// 4. Definir hostname
await service.setVirtualMachineHostname('vm-123', 'new-server');

// 5. Adicionar chave SSH
await service.addPublicKey('admin', 'ssh-rsa AAAAB3NzaC1...');

// 6. Instalar proteção
await service.installMonarxProtection('vm-123');
```

## ✅ Checklist de Integração

- [ ] Configurar `HOSTINGER_API_TOKEN` em `.env`
- [ ] Verificar token com health check: `GET /api/hostinger/health`
- [ ] Testar listagem de domínios: `GET /api/hostinger/domains`
- [ ] Testar listagem de DNS: `GET /api/hostinger/domains/:domain/dns`
- [ ] Testar criação de registro DNS
- [ ] Testar DDNS: `POST /api/hostinger/ddns/update`
- [ ] Testar listagem de VPS: `GET /api/hostinger/vms`
- [ ] Configurar ddclient no Ubuntu Server
- [ ] Verificar logs de atualização DDNS

## 🆘 Resolução de Problemas

| Problema                       | Solução                                             |
| ------------------------------ | --------------------------------------------------- |
| "Hostinger MCP não disponível" | Verificar se `HOSTINGER_API_TOKEN` está configurado |
| Erro 401/403                   | Token inválido ou sem permissões necessárias        |
| Timeout nas requisições        | Aumentar `HOSTINGER_API_TIMEOUT`                    |
| DDNS não atualiza              | Verificar se ddclient está rodando no servidor      |
| Registros DNS vazios           | Verificar se domínio está ativo na Hostinger        |

## 📚 Links Úteis

- [Documentação API Hostinger](https://api.hostinger.com)
- [hPanel Hostinger](https://hpanel.hostinger.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Open-Panel DDNS Setup](./HOSTINGER_DDNS_SETUP.md)
- [Open-Panel Arquitetura](./PROJETO.md)

---

**Última atualização**: 2025-01-15  
**Versão**: 1.0.0  
**Mantido por**: Open-Panel Team
