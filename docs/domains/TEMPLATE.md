# Domain: [DOMAIN_NAME]

> **Single-File Context**: Este arquivo contém TUDO que você precisa saber sobre o domínio [DOMAIN_NAME] - desde contexto de negócio até implementação técnica. Leia este arquivo uma vez e tenha 100% do contexto necessário.

---

## 📋 Índice
1. [Overview](#overview)
2. [Business Context](#business-context)
3. [User Stories](#user-stories)
4. [Business Rules](#business-rules)
5. [Technical Architecture](#technical-architecture)
6. [Data Models](#data-models)
7. [API Endpoints](#api-endpoints)
8. [Implementation Details](#implementation-details)
9. [Testing](#testing)
10. [Future Enhancements](#future-enhancements)

---

## 1. Overview

### O que é?
[Breve descrição do domínio em 1-2 frases]

### Por que existe?
[Problema que resolve, valor que entrega]

### Relacionamentos
- **Depende de**: [Lista de domínios dos quais este depende]
- **Usado por**: [Lista de domínios que usam este]

---

## 2. Business Context

### Problema
[Descrição detalhada do problema de negócio]

### Solução
[Como este domínio resolve o problema]

### Stakeholders
- **Usuários Finais**: [Quem usa diretamente]
- **Administradores**: [Quem gerencia]
- **Sistemas**: [Sistemas integrados]

---

## 3. User Stories

### US-[DOMAIN]-001: [Título da História]
**Como** [tipo de usuário]
**Quero** [ação/funcionalidade]
**Para que** [benefício/objetivo]

**Critérios de Aceitação:**
- [ ] [Critério 1]
- [ ] [Critério 2]
- [ ] [Critério 3]

**Prioridade**: Alta/Média/Baixa
**Estimativa**: [Story Points ou tempo]

### US-[DOMAIN]-002: [Título da História]
[Repetir estrutura acima]

---

## 4. Business Rules

### BR-[DOMAIN]-001: [Nome da Regra]
**Descrição**: [Descrição clara da regra de negócio]

**Condições**:
- [Condição 1]
- [Condição 2]

**Consequências**:
- [O que acontece quando a regra é aplicada]

**Exceções**:
- [Casos especiais, se houver]

### BR-[DOMAIN]-002: [Nome da Regra]
[Repetir estrutura acima]

---

## 5. Technical Architecture

### Componentes

#### Backend (`apps/api`)
```
src/
├── routes/
│   └── [domain].ts          # Rotas HTTP do domínio
├── services/
│   └── [domain].service.ts  # Lógica de negócio
├── middlewares/
│   └── [specific].ts        # Middlewares específicos
└── queues/
    └── [domain].queue.ts    # Jobs assíncronos
```

#### Frontend (`apps/web`)
```
src/
├── pages/
│   └── [Domain]/            # Views do domínio
├── components/
│   └── [Domain]/            # Componentes específicos
└── services/
    └── [domain].service.ts  # API client
```

### Fluxo de Dados
```
User → Frontend → API Route → Middleware → Service → Database
                                    ↓
                                 Queue (se assíncrono)
```

### Integrações
- **Banco de Dados**: PostgreSQL via Prisma
- **Cache**: Redis (se aplicável)
- **Queue**: BullMQ (se aplicável)
- **External APIs**: [Lista de APIs externas]

---

## 6. Data Models

### Prisma Schema

```prisma
// Enums
enum [DomainStatus] {
  ACTIVE
  INACTIVE
}

// Main Model
model [DomainEntity] {
  id          String   @id @default(cuid())
  name        String
  status      [DomainStatus] @default(ACTIVE)

  // Relations
  relatedId   String
  related     [RelatedModel] @relation(fields: [relatedId], references: [id])

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@map("[table_name]")
}
```

### Relacionamentos
- **1:N**: [Entity] → [Related Entity]
- **N:M**: [Entity] ↔ [Related Entity]

### Índices
- `[field_name]`: [Razão para o índice]

---

## 7. API Endpoints

### GET /api/[domain]
**Descrição**: Lista todos os recursos do domínio

**Auth**: Requerido (JWT)

**Query Params**:
- `page` (number, opcional): Página atual
- `limit` (number, opcional): Items por página
- `status` (enum, opcional): Filtro por status

**Response 200**:
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Example",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Forbidden
- `500`: Internal Server Error

---

### POST /api/[domain]
**Descrição**: Cria novo recurso

**Auth**: Requerido (JWT)

**Request Body**:
```json
{
  "name": "Example",
  "status": "ACTIVE"
}
```

**Validation** (Zod):
```typescript
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
})
```

**Response 201**:
```json
{
  "id": "clx...",
  "name": "Example",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Errors**:
- `400`: Validation Error
- `401`: Unauthorized
- `409`: Conflict (já existe)
- `500`: Internal Server Error

---

### PUT /api/[domain]/:id
**Descrição**: Atualiza recurso existente

[Seguir estrutura similar]

---

### DELETE /api/[domain]/:id
**Descrição**: Remove recurso

[Seguir estrutura similar]

---

## 8. Implementation Details

### Key Files

#### Route Handler (`apps/api/src/routes/[domain].ts`)
```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import { [DomainService] } from '../services/[domain].service'

const app = new Hono()

app.get('/', async (c) => {
  const service = [DomainService].getInstance()
  const data = await service.list()
  return c.json({ data })
})

// ... outros endpoints

export default app
```

#### Service (`apps/api/src/services/[domain].service.ts`)
```typescript
import { prisma } from '../lib/prisma'

export class [DomainService] {
  private static instance: [DomainService]

  static getInstance() {
    if (!this.instance) {
      this.instance = new [DomainService]()
    }
    return this.instance
  }

  async list() {
    return prisma.[domainEntity].findMany()
  }

  async create(data: CreateData) {
    return prisma.[domainEntity].create({ data })
  }

  // ... outros métodos
}
```

#### Frontend Service (`apps/web/src/services/[domain].service.ts`)
```typescript
const API_URL = import.meta.env.VITE_API_URL

export const [DomainService] = {
  async list() {
    const res = await fetch(`${API_URL}/api/[domain]`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return res.json()
  },

  async create(data: CreateData) {
    const res = await fetch(`${API_URL}/api/[domain]`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  }
}
```

### Middlewares Específicos

```typescript
// Exemplo: validação de permissões
export const require[Domain]Access = async (c, next) => {
  const user = c.get('user')
  const [domain]Id = c.req.param('id')

  // Lógica de validação
  const hasAccess = await check[Domain]Access(user.id, [domain]Id)

  if (!hasAccess) {
    return c.json({ error: 'Access denied' }, 403)
  }

  await next()
}
```

### Background Jobs

```typescript
// apps/api/src/queues/[domain].queue.ts
import { Queue, Worker } from 'bullmq'
import { redis } from '../lib/redis'

const queue = new Queue('[domain]-jobs', { connection: redis })

const worker = new Worker('[domain]-jobs', async (job) => {
  const { type, data } = job.data

  switch (type) {
    case 'process':
      await process[Domain](data)
      break
    default:
      throw new Error(`Unknown job type: ${type}`)
  }
}, { connection: redis })

export { queue, worker }
```

### Security Considerations

- **Autenticação**: JWT obrigatório em todos os endpoints (exceto públicos)
- **Autorização**: RBAC baseado em UserRole
- **Validação**: Zod schemas em todas as entradas
- **Rate Limiting**: [Limites específicos se aplicável]
- **Audit Log**: [Ações que devem ser auditadas]
- **Encryption**: [Dados que devem ser encriptados]

---

## 9. Testing

### Unit Tests

```typescript
// apps/api/src/__tests__/unit/services/[domain].test.ts
import { describe, it, expect } from 'vitest'
import { [DomainService] } from '../../../services/[domain].service'

describe('[DomainService]', () => {
  describe('create', () => {
    it('should create a new [entity]', async () => {
      const service = [DomainService].getInstance()
      const data = { name: 'Test' }

      const result = await service.create(data)

      expect(result).toHaveProperty('id')
      expect(result.name).toBe('Test')
    })

    it('should throw error on duplicate', async () => {
      // ...
    })
  })
})
```

### Integration Tests

```typescript
// apps/api/src/__tests__/integration/[domain].test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { testClient } from '../helpers/test-client'

describe('POST /api/[domain]', () => {
  let authToken: string

  beforeAll(async () => {
    // Setup
    authToken = await getTestToken()
  })

  it('should create [entity] with valid data', async () => {
    const res = await testClient.post('/api/[domain]', {
      headers: { Authorization: `Bearer ${authToken}` },
      body: { name: 'Test' }
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })

  it('should return 400 on invalid data', async () => {
    // ...
  })
})
```

### Manual Testing Checklist

- [ ] Criar [entity] via API
- [ ] Listar [entities] com paginação
- [ ] Atualizar [entity] existente
- [ ] Deletar [entity]
- [ ] Testar permissões (diferentes roles)
- [ ] Testar casos de erro (validação, conflitos)
- [ ] Verificar audit logs
- [ ] Testar performance com muitos registros

---

## 10. Future Enhancements

### Curto Prazo (1-3 meses)
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Médio Prazo (3-6 meses)
- [ ] [Enhancement 3]
- [ ] [Enhancement 4]

### Longo Prazo (6+ meses)
- [ ] [Enhancement 5]
- [ ] [Enhancement 6]

### Debt Técnico
- [ ] [Technical debt item 1]
- [ ] [Technical debt item 2]

---

## 📚 Related Documentation

- [System Architecture](../architecture/01-system-architecture.md)
- [Other Domain 1](./[other-domain].md)
- [Other Domain 2](./[other-domain].md)

---

**Última Atualização**: [DATA]
**Mantido por**: [EQUIPE/PESSOA]
**Status**: ✅ Implementado | 🔄 Em Desenvolvimento | 📋 Planejado
