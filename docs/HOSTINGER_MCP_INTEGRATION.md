# Integração Hostinger-MCP no Open-Panel

## 📋 Visão Geral

A integração Hostinger-MCP fornece uma camada de abstração para operações de domínios, DNS e VPS através das ferramentas Model Context Protocol (MCP) do Hostinger, integrada diretamente no backend Open-Panel.

**Status**: ✅ Implementação MCP concluída com suporte a todas as operações

## 🏗️ Arquitetura

### Camadas de Implementação

```text
Open-Panel Routes (Hono)
        ↓
HostingerMCPService (hostinger-mcp.service.ts)
        ↓
Ferramentas Hostinger-MCP
        ↓
Hostinger API (https://api.hostinger.com/v1)
```

### Arquivo Principal

**`apps/api/src/services/hostinger-mcp.service.ts`** - Serviço principal com:

- 25+ métodos para operações com Hostinger
- Padrão singleton para evitar múltiplas instâncias
- Type-safe com TypeScript
- Logging estruturado com Winston
- Tratamento robusto de erros

### Rotas REST

**`apps/api/src/routes/hostinger/index.ts`** - 12 endpoints REST:

- 4 endpoints de domínios
- 5 endpoints de DNS (CRUD + UPSERT)
- 1 endpoint de DDNS (atualização de IP)
- 2 endpoints de VPS
- 1 health check

## 🔑 Autenticação Hostinger-MCP

### Opção 1: API Token (Recomendado)

1. Acesse [hPanel](https://hpanel.hostinger.com/)
2. Navegue para **Settings** → **API Tokens**
3. Crie um novo token com permissões:
   - `domains:read`, `domains:write`
   - `dns:read`, `dns:write`
   - `vps:read`, `vps:write`
   - `billing:read`

4. Copie o token e salve em `.env.local`:

```bash
HOSTINGER_API_TOKEN=your_api_token_here
```

### Opção 2: OAuth2 (Para aplicações web)

Se precisar integrar em uma aplicação web, configure OAuth2 no painel Hostinger.

---

## 🎯 Casos de Uso Comuns

### 1. Criar um Registro DNS Automaticamente

Após criar a chave DDNS na Hostinger, você pode atualizar o registro DNS via MCP:

```typescript
// apps/api/src/services/hostinger.service.ts
import { createDNSRecord } from '@openpanel/hostinger-mcp';

export class HostingerService {
  async setupDDNS(domain: string, subdomain: string, ip: string) {
    // Criar registro A para DDNS
    const record = await createDNSRecord({
      domain,
      type: 'A',
      name: subdomain,
      value: ip,
      ttl: 3600
    });
    
    return record;
  }
}
```

### 2. Verificar e Listar Domínios

```typescript
export class HostingerService {
  async listDomains() {
    const domains = await this.hostinger.domains.list();
    return domains.filter(d => d.status === 'active');
  }

  async checkDomainDNS(domain: string) {
    const records = await this.hostinger.dns.list(domain);
    return records;
  }
}
```

### 3. Criar VPS Automaticamente

```typescript
export class HostingerService {
  async createVPS(config: {
    planId: string;
    datacenter: string;
    hostname: string;
  }) {
    const vps = await this.hostinger.vps.create({
      item_id: config.planId,
      setup: config.datacenter
    });
    
    // Definir hostname
    await this.hostinger.vps.setHostname(vps.id, config.hostname);
    
    return vps;
  }
}
```

### 4. Comprar Domínio

```typescript
export class HostingerService {
  async purchaseDomain(domain: string, itemId: string) {
    const purchase = await this.hostinger.domains.purchase({
      domain,
      item_id: itemId
    });
    
    return purchase;
  }
}
```

---

## 🛠️ Script de Automação: DDNS + DNS

Aqui está um exemplo prático que combina `ddclient` + Hostinger-MCP:

### apps/api/src/services/ddns-sync.service.ts

```typescript
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../lib/logger';
import axios from 'axios';

const logger = createLogger('DDNSSync');
const prisma = new PrismaClient();

interface DDNSConfig {
  domain: string;
  subdomain: string;
  checkInterval: number; // em segundos
}

export class DDNSSyncService {
  private lastIP: string = '';
  private configs: DDNSConfig[] = [];

  /**
   * Inicia o sincronizador DDNS
   * Verifica o IP a cada intervalo e atualiza na Hostinger se mudou
   */
  async startDDNSSync(configs: DDNSConfig[]) {
    this.configs = configs;
    logger.info(`Iniciando sincronização DDNS para ${configs.length} domínios`);

    setInterval(() => this.syncDDNS(), configs[0]?.checkInterval || 300000);
  }

  /**
   * Obtém o IP externo atual
   */
  private async getPublicIP(): Promise<string> {
    try {
      const response = await axios.get('https://checkip.dyndns.com/', {
        timeout: 5000
      });
      const ip = response.data
        .match(/\d+\.\d+\.\d+\.\d+/)[0];
      return ip;
    } catch (error) {
      logger.error('Erro ao obter IP externo', error);
      return this.lastIP;
    }
  }

  /**
   * Sincroniza o IP com a Hostinger
   */
  private async syncDDNS() {
    try {
      const currentIP = await this.getPublicIP();

      if (currentIP === this.lastIP) {
        logger.debug(`IP não mudou: ${currentIP}`);
        return;
      }

      logger.info(`IP mudou de ${this.lastIP} para ${currentIP}`);
      this.lastIP = currentIP;

      for (const config of this.configs) {
        await this.updateDNSRecord(config, currentIP);
      }
    } catch (error) {
      logger.error('Erro ao sincronizar DDNS', error);
    }
  }

  /**
   * Atualiza o registro DNS na Hostinger
   */
  private async updateDNSRecord(
    config: DDNSConfig,
    ip: string
  ): Promise<void> {
    try {
      const token = process.env.HOSTINGER_API_TOKEN;
      if (!token) {
        logger.error('HOSTINGER_API_TOKEN não configurado');
        return;
      }

      // Buscar registro existente
      const recordName = config.subdomain
        ? `${config.subdomain}.${config.domain}`
        : config.domain;

      const response = await axios.patch(
        `https://api.hostinger.com/v1/domains/${config.domain}/dns-records`,
        {
          domain: config.domain,
          name: config.subdomain || '@',
          type: 'A',
          value: ip,
          ttl: 3600
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(
        `DNS atualizado: ${recordName} → ${ip}`,
        response.status
      );

      // Registrar no banco
      await prisma.ddnsUpdate.create({
        data: {
          domain: recordName,
          ip,
          status: 'success',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error(
        `Erro ao atualizar DNS para ${config.domain}`,
        error
      );

      await prisma.ddnsUpdate.create({
        data: {
          domain: config.domain,
          ip,
          status: 'failed',
          error: String(error),
          updatedAt: new Date()
        }
      });
    }
  }
}
```

### apps/api/src/routes/hostinger/index.ts

```typescript
import { Hono } from 'hono';
import { HostingerService } from '../../services/hostinger.service';

const hostinger = new Hono();
const service = new HostingerService();

// Listar domínios
hostinger.get('/domains', async (c) => {
  try {
    const domains = await service.listDomains();
    return c.json({ success: true, domains });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Verificar DNS de um domínio
hostinger.get('/domains/:domain/dns', async (c) => {
  try {
    const domain = c.req.param('domain');
    const records = await service.checkDomainDNS(domain);
    return c.json({ success: true, records });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Criar registro DNS
hostinger.post('/dns/records', async (c) => {
  try {
    const body = await c.req.json();
    const record = await service.createDNSRecord(body);
    return c.json({ success: true, record }, 201);
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Comprar VPS
hostinger.post('/vps/purchase', async (c) => {
  try {
    const body = await c.req.json();
    const vps = await service.createVPS(body);
    return c.json({ success: true, vps }, 201);
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default hostinger;
```

---

## 📊 Schema Prisma para Registrar Atualizações DDNS

Adicione ao `apps/api/prisma/schema.prisma`:

```prisma
model DDNSUpdate {
  id        String   @id @default(cuid())
  domain    String
  ip        String
  status    String   // "success" | "failed"
  error     String?
  updatedAt DateTime @default(now())

  @@index([domain])
  @@index([updatedAt])
}
```

Depois rode:

```bash
npm run db:generate -w apps/api
npm run db:push -w apps/api
```

---

## 🔄 Fluxo Completo: Novo Servidor Home Lab

### 1. Comprar VPS na Hostinger

```bash
curl -X POST http://localhost:3000/api/hostinger/vps/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "vps_starter",
    "datacenter": "us-east",
    "hostname": "home-lab.soullabs.com.br"
  }'
```

### 2. Criar DNS DDNS

```bash
curl -X POST http://localhost:3000/api/hostinger/dns/records \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "soullabs.com.br",
    "type": "A",
    "name": "home",
    "value": "1.1.1.1",
    "ttl": 3600
  }'
```

### 3. Instalar ddclient no Servidor

```bash
# No servidor Ubuntu
wget -O /tmp/setup-ddns.sh https://seu-repo/scripts/server/setup-ddns-hostinger.sh
sudo bash /tmp/setup-ddns.sh
```

### 4. Monitorar Sincronização

```bash
# Frontend: Dashboard que mostra histórico de atualizações
curl http://localhost:3000/api/hostinger/ddns/history
```

---

## 🚨 Variáveis de Ambiente

Adicione ao `.env` (raiz):

```bash
# Hostinger API
HOSTINGER_API_TOKEN=your_token_here
HOSTINGER_API_URL=https://api.hostinger.com/v1

# DDNS Config
DDNS_DOMAIN=soullabs.com.br
DDNS_SUBDOMAIN=home
DDNS_CHECK_INTERVAL=300000  # 5 minutos em ms

# Segurança
HOSTINGER_API_TIMEOUT=10000
```

---

## 📚 Links Úteis

- [Documentação Hostinger-MCP](./HOSTINGER_MCP_USAGE.md)
- [Setup DDNS com ddclient](./HOSTINGER_DDNS_SETUP.md)
- [API REST Hostinger](https://support.hostinger.com/en/articles/5892857-hostinger-api-documentation)

---

**Última atualização**: 4 de dezembro de 2025
