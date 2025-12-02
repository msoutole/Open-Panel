# Proposta de Arquitetura em Microserviços

## 📋 Visão Geral

Este documento analisa a viabilidade de migrar o OpenPanel de uma arquitetura monorepo monolítica para uma arquitetura de microserviços, considerando especialmente a manutenabilidade para LLMs e desenvolvimento.

## 🎯 Situação Atual

### Estrutura Monorepo Atual

```
Open-Panel/
├── apps/
│   ├── api/              # Backend monolítico (Hono)
│   │   ├── routes/      # 18 rotas HTTP
│   │   ├── services/    # 10 serviços de negócio
│   │   ├── websocket/   # 3 gateways WebSocket
│   │   └── queues/      # 1 fila de auditoria
│   └── web/             # Frontend React SPA
└── packages/
    └── shared/          # Tipos e validadores compartilhados
```

### Domínios Identificados

1. **Authentication & Authorization** (auth, users, teams, rbac)
2. **Projects & Containers** (projects, containers, deployments)
3. **Infrastructure** (domains, ssl, traefik, networking)
4. **Monitoring & Observability** (metrics, logs, health, stats)
5. **Backup & Recovery** (backups, scheduler)
6. **Build & Deploy** (builds, git, docker)
7. **Audit & Security** (audit logs, security events)
8. **Settings & Configuration** (settings, onboarding)

## ✅ Vantagens de Microserviços

### 1. **Manutenabilidade para LLMs**

**Problema Atual**: LLMs têm dificuldade em entender contextos grandes e monolíticos.

**Solução com Microserviços**:
- ✅ **Contexto isolado**: Cada serviço tem responsabilidade única e bem definida
- ✅ **Documentação focada**: Cada serviço pode ter sua própria documentação específica
- ✅ **Código menor**: Arquivos menores são mais fáceis de analisar
- ✅ **Boundaries claros**: Interfaces bem definidas facilitam compreensão

**Exemplo**:
```
# Atual: Um arquivo com múltiplas responsabilidades
apps/api/src/routes/projects.ts  # 500+ linhas, múltiplos endpoints

# Microserviço: Responsabilidade única
services/projects-service/
├── src/
│   ├── routes/
│   │   └── projects.ts        # Apenas endpoints de projetos
│   ├── services/
│   │   └── project.service.ts  # Lógica específica de projetos
│   └── README.md              # Documentação focada
```

### 2. **Escalabilidade Independente**

- Cada serviço pode escalar independentemente
- Recursos intensivos (builds, backups) não afetam APIs leves (auth, health)

### 3. **Deploy Independente**

- Deploy de features sem afetar outros serviços
- Rollback granular por serviço
- Testes isolados mais rápidos

### 4. **Tecnologias Específicas**

- Cada serviço pode usar a melhor stack para seu domínio
- Exemplo: Build service pode usar Go/Rust para performance

### 5. **Equipes Independentes**

- Equipes podem trabalhar em serviços diferentes sem conflitos
- Onboarding mais fácil (menos código para entender)

## ⚠️ Desvantagens e Desafios

### 1. **Complexidade Operacional**

- **Atual**: 1 aplicação para gerenciar
- **Microserviços**: N serviços para gerenciar, monitorar, fazer deploy

**Mitigação**: 
- Docker Compose para desenvolvimento local
- Kubernetes para produção
- Observabilidade centralizada (Prometheus, Grafana)

### 2. **Comunicação Entre Serviços**

- **Atual**: Chamadas de função síncronas
- **Microserviços**: Chamadas HTTP/gRPC com latência de rede

**Mitigação**:
- API Gateway para roteamento
- Service Mesh (Istio/Linkerd) para comunicação segura
- Cache distribuído (Redis) para reduzir chamadas

### 3. **Consistência de Dados**

- **Atual**: Transações ACID no PostgreSQL
- **Microserviços**: Saga pattern ou Event Sourcing

**Mitigação**:
- Event-driven architecture
- Database per service (com sincronização quando necessário)

### 4. **Overhead de Infraestrutura**

- Mais containers, mais recursos
- Mais complexidade de rede

**Mitigação**:
- Começar com poucos serviços críticos
- Usar Docker Compose para desenvolvimento

### 5. **Debugging Mais Complexo**

- Logs distribuídos
- Traces entre serviços

**Mitigação**:
- Distributed tracing (OpenTelemetry, Jaeger)
- Log aggregation (ELK Stack, Loki)

## 🏗️ Proposta de Arquitetura

### Estrutura Proposta

```
Open-Panel/
├── services/
│   ├── api-gateway/          # Roteamento e autenticação
│   ├── auth-service/         # Autenticação e autorização
│   ├── projects-service/      # Gerenciamento de projetos
│   ├── containers-service/    # Orquestração Docker
│   ├── build-service/         # Builds e deployments
│   ├── infrastructure-service/ # Domains, SSL, Traefik
│   ├── monitoring-service/    # Métricas, logs, health
│   ├── backup-service/        # Backups e restauração
│   └── audit-service/         # Logs de auditoria
├── apps/
│   └── web/                   # Frontend React
├── packages/
│   ├── shared/                # Tipos e validadores
│   ├── events/                # Eventos compartilhados
│   └── sdk/                   # SDK para comunicação
└── infrastructure/
    ├── docker-compose.yml     # Desenvolvimento local
    ├── kubernetes/            # Manifests K8s
    └── monitoring/            # Prometheus, Grafana
```

### Serviços Detalhados

#### 1. **API Gateway** (`api-gateway`)
**Responsabilidade**: Roteamento, autenticação, rate limiting, CORS

**Stack**: Hono + Envoy Proxy (opcional)

**Endpoints**:
- `/api/*` → Roteia para serviços apropriados
- `/auth/*` → auth-service
- `/projects/*` → projects-service
- etc.

#### 2. **Auth Service** (`auth-service`)
**Responsabilidade**: Autenticação, autorização, RBAC, tokens JWT

**Stack**: Hono + Prisma + PostgreSQL

**Endpoints**:
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /users/*`
- `GET /teams/*`

**Database**: `auth_db` (PostgreSQL)

#### 3. **Projects Service** (`projects-service`)
**Responsabilidade**: CRUD de projetos, associação com containers

**Stack**: Hono + Prisma + PostgreSQL

**Endpoints**:
- `GET /projects`
- `POST /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`

**Database**: `projects_db` (PostgreSQL)

**Eventos**:
- `project.created`
- `project.updated`
- `project.deleted`

#### 4. **Containers Service** (`containers-service`)
**Responsabilidade**: Orquestração Docker, lifecycle de containers

**Stack**: Hono + Dockerode + Redis

**Endpoints**:
- `GET /containers`
- `POST /containers`
- `PUT /containers/:id`
- `DELETE /containers/:id`
- `POST /containers/:id/start`
- `POST /containers/:id/stop`
- `POST /containers/:id/restart`

**WebSocket**:
- `ws://containers-service/logs/:id`
- `ws://containers-service/metrics/:id`

**Eventos**:
- `container.started`
- `container.stopped`
- `container.health_changed`

#### 5. **Build Service** (`build-service`)
**Responsabilidade**: Builds, deployments, Git integration

**Stack**: Hono + Dockerode + Redis Queue

**Endpoints**:
- `POST /builds`
- `GET /builds/:id`
- `GET /builds/:id/logs`

**Queue**: Redis + BullMQ para jobs de build

**Eventos**:
- `build.started`
- `build.completed`
- `build.failed`

#### 6. **Infrastructure Service** (`infrastructure-service`)
**Responsabilidade**: Domains, SSL, Traefik configuration

**Stack**: Hono + Prisma + PostgreSQL

**Endpoints**:
- `GET /domains`
- `POST /domains`
- `POST /domains/:id/ssl`
- `GET /traefik/config`

**Database**: `infrastructure_db` (PostgreSQL)

#### 7. **Monitoring Service** (`monitoring-service`)
**Responsabilidade**: Métricas, logs, health checks, stats

**Stack**: Hono + Prometheus + InfluxDB (opcional)

**Endpoints**:
- `GET /metrics`
- `GET /health`
- `GET /stats`
- `GET /logs`

**WebSocket**:
- `ws://monitoring-service/events`

#### 8. **Backup Service** (`backup-service`)
**Responsabilidade**: Backups, restauração, agendamento

**Stack**: Hono + Prisma + PostgreSQL + S3 Client

**Endpoints**:
- `POST /backups`
- `GET /backups`
- `POST /backups/:id/restore`
- `DELETE /backups/:id`

**Queue**: Redis + BullMQ para jobs de backup

**Eventos**:
- `backup.created`
- `backup.completed`
- `backup.failed`

#### 9. **Audit Service** (`audit-service`)
**Responsabilidade**: Logs de auditoria, eventos de segurança

**Stack**: Hono + Prisma + PostgreSQL + Elasticsearch (opcional)

**Endpoints**:
- `GET /audit/logs`
- `POST /audit/logs` (recebe eventos de outros serviços)
- `GET /audit/stats`

**Database**: `audit_db` (PostgreSQL) + Elasticsearch para busca

**Eventos Consumidos**:
- Todos os eventos de outros serviços

## 🔄 Comunicação Entre Serviços

### Padrões de Comunicação

#### 1. **Síncrona (HTTP/gRPC)**
Para operações que precisam de resposta imediata:
- Auth Service → Projects Service (validar permissões)
- Projects Service → Containers Service (criar container)

#### 2. **Assíncrona (Event Bus)**
Para operações que podem ser processadas depois:
- Container criado → Notificar Monitoring Service
- Project deletado → Limpar backups relacionados

**Stack**: Redis Pub/Sub ou RabbitMQ ou Apache Kafka

#### 3. **Event Sourcing** (Opcional)
Para auditoria completa e replay:
- Todos os eventos importantes são persistidos
- Permite reconstruir estado histórico

## 📦 Estrutura de Cada Serviço

### Template Padrão

```
services/{service-name}/
├── src/
│   ├── index.ts              # Entry point
│   ├── routes/               # HTTP endpoints
│   ├── services/             # Business logic
│   ├── events/               # Event handlers
│   ├── types/                # Tipos específicos
│   └── config/               # Configuração
├── prisma/                   # Schema (se usar Prisma)
│   └── schema.prisma
├── tests/                    # Testes
├── Dockerfile
├── docker-compose.yml        # Para desenvolvimento isolado
├── package.json
├── README.md                 # Documentação específica
└── .env.example
```

### Exemplo: Projects Service

```typescript
// services/projects-service/src/index.ts
import { Hono } from 'hono';
import { projectsRoutes } from './routes/projects';
import { eventBus } from '@openpanel/events';

const app = new Hono();

// Middleware de autenticação (valida token via Auth Service)
app.use('/*', async (c, next) => {
  const token = c.req.header('Authorization');
  const user = await validateToken(token); // Chama auth-service
  c.set('user', user);
  await next();
});

app.route('/projects', projectsRoutes);

// Event handlers
eventBus.on('container.created', async (event) => {
  // Atualizar projeto com novo container
});

app.listen(3002);
```

## 🚀 Estratégia de Migração

### Fase 1: Preparação (Semana 1-2)
1. ✅ Criar estrutura de serviços
2. ✅ Configurar API Gateway básico
3. ✅ Configurar Event Bus (Redis Pub/Sub)
4. ✅ Criar SDK compartilhado para comunicação

### Fase 2: Extrair Serviços Críticos (Semana 3-6)
1. **Auth Service** (mais isolado, fácil de extrair)
2. **Projects Service** (core do negócio)
3. **Containers Service** (mais complexo, mas importante)

### Fase 3: Serviços de Suporte (Semana 7-10)
1. **Monitoring Service**
2. **Backup Service**
3. **Build Service**

### Fase 4: Serviços Restantes (Semana 11-12)
1. **Infrastructure Service**
2. **Audit Service**

### Fase 5: Otimização (Semana 13+)
1. Performance tuning
2. Observabilidade completa
3. Documentação final

## 🛠️ Ferramentas Recomendadas

### Desenvolvimento Local
- **Docker Compose**: Orquestração de todos os serviços
- **Tilt** ou **Skaffold**: Hot reload em múltiplos serviços

### Produção
- **Kubernetes**: Orquestração de containers
- **Helm**: Gerenciamento de charts K8s
- **Istio/Linkerd**: Service mesh

### Observabilidade
- **Prometheus**: Métricas
- **Grafana**: Dashboards
- **Jaeger**: Distributed tracing
- **Loki**: Log aggregation

### Comunicação
- **Redis Pub/Sub**: Event bus simples
- **RabbitMQ**: Message broker robusto
- **Apache Kafka**: Event streaming (para escala)

## 📊 Comparação: Monorepo vs Microserviços

| Aspecto | Monorepo Atual | Microserviços |
|---------|----------------|---------------|
| **Complexidade** | Baixa | Alta |
| **Deploy** | Um único deploy | Múltiplos deploys |
| **Escalabilidade** | Escala tudo junto | Escala por serviço |
| **Manutenabilidade (LLMs)** | Difícil (contexto grande) | Fácil (contexto isolado) |
| **Debugging** | Simples | Complexo (distribuído) |
| **Testes** | Integração fácil | Testes isolados |
| **Performance** | Sem latência de rede | Latência entre serviços |
| **Consistência** | ACID transactions | Eventual consistency |
| **Onboarding** | Curva de aprendizado alta | Curva menor por serviço |

## 💡 Recomendações

### ✅ **SIM, migrar para microserviços se:**

1. **Prioridade em manutenabilidade para LLMs**
   - Contextos menores facilitam análise por IA
   - Documentação focada por serviço
   - Código mais organizado

2. **Planejamento de crescimento**
   - Múltiplas equipes trabalhando
   - Necessidade de escalar partes específicas
   - Diferentes stacks por domínio

3. **Recursos disponíveis**
   - Equipe com experiência em microserviços
   - Infraestrutura adequada (K8s, monitoring)
   - Tempo para migração gradual

### ⚠️ **NÃO migrar se:**

1. **Equipe pequena**
   - Overhead operacional muito alto
   - Complexidade desnecessária

2. **Aplicação simples**
   - Monorepo atende bem
   - Sem necessidade de escalar independentemente

3. **Prazo apertado**
   - Migração leva tempo
   - Risco de introduzir bugs

## 🎯 Recomendação Final

### **Abordagem Híbrida Recomendada**

1. **Manter monorepo** para desenvolvimento e organização de código
2. **Extrair serviços críticos** para containers separados:
   - Auth Service (isolado por segurança)
   - Build Service (recursos intensivos)
   - Monitoring Service (alta frequência de dados)

3. **Manter serviços relacionados juntos**:
   - Projects + Containers (fortemente acoplados)
   - Infrastructure (domains, SSL, traefik)

4. **Usar Docker Compose** para desenvolvimento local
5. **Preparar para Kubernetes** quando necessário

### Estrutura Híbrida Proposta

```
Open-Panel/
├── services/
│   ├── api-gateway/          # Novo: Roteamento
│   ├── auth-service/         # Extraído: Segurança isolada
│   ├── build-service/        # Extraído: Recursos intensivos
│   └── monitoring-service/   # Extraído: Alta frequência
├── apps/
│   ├── api/                  # Mantido: Core services
│   │   ├── projects/        # Projects + Containers
│   │   ├── infrastructure/  # Domains + SSL
│   │   └── backup/          # Backup + Scheduler
│   └── web/                  # Frontend
└── packages/
    ├── shared/               # Tipos compartilhados
    └── events/               # Event bus
```

## 📝 Próximos Passos

1. **Criar POC** com Auth Service extraído
2. **Avaliar complexidade** operacional
3. **Documentar** padrões de comunicação
4. **Migrar gradualmente** serviços críticos
5. **Monitorar** performance e complexidade

## 🔗 Referências

- [Microservices Patterns](https://microservices.io/patterns/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Service Mesh](https://istio.io/latest/docs/concepts/what-is-istio/)

