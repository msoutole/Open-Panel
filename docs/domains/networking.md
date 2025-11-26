# Domain: Networking (Domains & SSL)

> **Single-File Context**: Gerenciamento de domínios, certificados SSL/TLS e integração com Traefik reverse proxy.

---

## 1. Overview

**O que é?** Sistema de DNS, roteamento e certificados SSL automáticos via Let's Encrypt.

**Componentes**:
- **Domains**: Configuração de domínios/subdomínios
- **SSL Certificates**: Emissão e renovação automática
- **Traefik Integration**: Dynamic routing configuration

**Relacionamentos**:
- Depende de: Projects, Containers
- Integra com: Traefik (reverse proxy), Let's Encrypt (ACME)

---

## 2. Data Models

```prisma
model Domain {
  id          String   @id @default(cuid())
  hostname    String   @unique  // "api.example.com"
  verified    Boolean  @default(false)
  dnsProvider String?  // "cloudflare", "aws", "manual"

  // SSL/TLS
  sslEnabled  Boolean  @default(true)
  sslCert     String?  // Certificate ID from Traefik
  sslExpiry   DateTime?

  // Project relation
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([hostname])
  @@map("domains")
}

model SslCertificate {
  id          String   @id @default(cuid())
  domain      String   @unique
  provider    String   @default("letsencrypt")
  issuedAt    DateTime
  expiresAt   DateTime
  autoRenew   Boolean  @default(true)
  certData    String?  @db.Text  // Encrypted cert
  keyData     String?  @db.Text  // Encrypted private key

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([domain])
  @@index([expiresAt])
  @@map("ssl_certificates")
}
```

---

## 3. Business Rules

### BR-NET-001: Unique Hostname
- Hostname globalmente único no sistema
- Validação DNS antes de aceitar

### BR-NET-002: Auto SSL
- SSL automático para todos os domínios por padrão
- Let's Encrypt HTTP-01 challenge

### BR-NET-003: SSL Renewal
- Renovação automática 30 dias antes do vencimento
- Cronjob verifica diariamente

### BR-NET-004: Traefik Dynamic Config
- Atualização automática de rotas no Traefik
- Sem necessidade de reload manual

---

## 4. API Endpoints

### POST /api/domains
Adiciona domínio ao projeto

**Request**:
```json
{
  "projectId": "clx...",
  "hostname": "api.myapp.com",
  "sslEnabled": true
}
```

**Response 201**:
```json
{
  "domain": {
    "id": "clx...",
    "hostname": "api.myapp.com",
    "verified": false,
    "sslEnabled": true,
    "project": { "id": "...", "name": "My API" }
  },
  "dnsInstructions": {
    "type": "A",
    "name": "api",
    "value": "192.168.1.100",
    "ttl": 300
  }
}
```

### GET /api/domains/:id/verify
Verifica DNS propagation

### POST /api/domains/:id/ssl/issue
Força emissão de certificado SSL

### POST /api/domains/:id/ssl/renew
Força renovação do certificado

### DELETE /api/domains/:id
Remove domínio

---

## 5. Implementation

### Domain Service (`apps/api/src/services/domain.service.ts`)

```typescript
import { prisma } from '../lib/prisma'
import { TraefikService } from './traefik.service'
import dns from 'dns/promises'

export class DomainService {
  private traefik = new TraefikService()

  async addDomain(projectId: string, hostname: string) {
    // Validate hostname format
    if (!this.isValidHostname(hostname)) {
      throw new Error('Invalid hostname format')
    }

    // Check if already exists
    const existing = await prisma.domain.findUnique({
      where: { hostname }
    })

    if (existing) {
      throw new Error('Domain already in use')
    }

    // Create domain
    const domain = await prisma.domain.create({
      data: {
        hostname,
        projectId,
        sslEnabled: true,
        verified: false
      }
    })

    // Configure Traefik route
    await this.traefik.addRoute({
      domain: hostname,
      projectId,
      containerId: /* get from project */
    })

    return domain
  }

  async verifyDomain(domainId: string): Promise<boolean> {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId }
    })

    try {
      // Check DNS A record
      const records = await dns.resolve4(domain.hostname)
      const serverIP = await this.getServerPublicIP()

      const isValid = records.includes(serverIP)

      if (isValid) {
        await prisma.domain.update({
          where: { id: domainId },
          data: { verified: true }
        })
      }

      return isValid
    } catch (error) {
      return false
    }
  }

  async issueSSL(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId }
    })

    if (!domain.verified) {
      throw new Error('Domain must be verified before issuing SSL')
    }

    // Traefik handles Let's Encrypt automatically
    // Just need to configure the TLS resolver
    await this.traefik.enableSSL(domain.hostname)

    // Poll for certificate
    const certId = await this.waitForCertificate(domain.hostname)

    await prisma.domain.update({
      where: { id: domainId },
      data: {
        sslCert: certId,
        sslExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    })
  }

  private isValidHostname(hostname: string): boolean {
    const pattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/
    return pattern.test(hostname)
  }
}
```

### Traefik Service (`apps/api/src/services/traefik.service.ts`)

```typescript
import fs from 'fs/promises'
import path from 'path'

export class TraefikService {
  private configPath = '/etc/traefik/dynamic'

  async addRoute(options: { domain: string; projectId: string; containerId: string }) {
    const { domain, projectId, containerId } = options

    const config = {
      http: {
        routers: {
          [`router-${projectId}`]: {
            rule: `Host(\`${domain}\`)`,
            service: `service-${projectId}`,
            entryPoints: ['web', 'websecure'],
            tls: {
              certResolver: 'letsencrypt'
            }
          }
        },
        services: {
          [`service-${projectId}`]: {
            loadBalancer: {
              servers: [
                { url: `http://${containerId}:3000` }
              ]
            }
          }
        }
      }
    }

    const filePath = path.join(this.configPath, `${projectId}.yml`)
    await fs.writeFile(filePath, JSON.stringify(config, null, 2))
  }

  async removeRoute(projectId: string) {
    const filePath = path.join(this.configPath, `${projectId}.yml`)
    await fs.unlink(filePath)
  }

  async enableSSL(domain: string) {
    // Traefik auto-handles Let's Encrypt via ACME
    // Configuration is done in traefik.yml static config
    return true
  }
}
```

### SSL Renewal Cron (`apps/api/src/jobs/ssl-renewal.ts`)

```typescript
import { CronJob } from 'cron'
import { prisma } from '../lib/prisma'
import { DomainService } from '../services/domain.service'

// Run daily at 2 AM
export const sslRenewalJob = new CronJob('0 2 * * *', async () => {
  const domainService = new DomainService()

  // Find certificates expiring in 30 days
  const expiringDomains = await prisma.domain.findMany({
    where: {
      sslEnabled: true,
      sslExpiry: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  })

  for (const domain of expiringDomains) {
    try {
      await domainService.issueSSL(domain.id)
      console.log(`✅ Renewed SSL for ${domain.hostname}`)
    } catch (error) {
      console.error(`❌ Failed to renew SSL for ${domain.hostname}:`, error)
    }
  }
})

sslRenewalJob.start()
```

---

## 6. Traefik Configuration

### Static Config (`/etc/traefik/traefik.yml`)
```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https

  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
    network: openpanel-network

  file:
    directory: /etc/traefik/dynamic
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@openpanel.dev
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

---

## 7. Future Enhancements

- [ ] Wildcard SSL support (DNS-01 challenge)
- [ ] Custom SSL certificate upload
- [ ] Multiple domains per project
- [ ] CDN integration (Cloudflare)
- [ ] HTTPS redirect configurável
- [ ] Custom HTTP headers
- [ ] Rate limiting per domain

---

**Última Atualização**: 2025-11-26
**Status**: ✅ Implementado (80%)
