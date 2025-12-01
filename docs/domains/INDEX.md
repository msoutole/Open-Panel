# Domain-Driven Documentation Index

Este diretório contém documentação **Domain-Driven**, onde cada arquivo representa um domínio completo do sistema com TUDO que você precisa saber - desde contexto de negócio até implementação técnica.

## 🎯 Como Usar (Para LLMs)

**Princípio**: Leitura única fornece 100% do contexto necessário para trabalhar no domínio.

### Vantagens

✅ **Menos Alucinação**: Regras de negócio e código lado a lado
✅ **Maior Eficiência**: Um único `view_file` carrega todo o contexto
✅ **Menor Fragmentação**: Não precisa saltar entre múltiplos arquivos

### Estrutura de Cada Domínio

Cada arquivo `<domain>.md` contém:

1. **Overview**: O que é, por que existe, relacionamentos
2. **Business Context**: Problema, solução, stakeholders
3. **User Stories**: Casos de uso completos
4. **Business Rules**: Regras de negócio com identificadores
5. **Technical Architecture**: Componentes, fluxos, integrações
6. **Data Models**: Prisma schema completo
7. **API Endpoints**: Rotas HTTP com exemplos
8. **Implementation Details**: Código-chave comentado
9. **Testing**: Unit, integration e manual tests
10. **Future Enhancements**: Roadmap e debt técnico

---

## 📂 Domínios Disponíveis

### 🔐 Core Domains

#### [authentication.md](./authentication.md) - **Authentication & User Management**
**Escopo**: Login, registro, JWT, API keys, perfil de usuário
**Rotas**: `/api/auth/*`, `/api/users/*`
**Modelos**: User, ApiKey, AuditLog
**Status**: ✅ 95% Implementado

---

#### [projects-teams.md](./projects-teams.md) - **Projects & Teams**
**Escopo**: Gerenciamento de projetos, times, colaboração
**Rotas**: `/api/projects/*`, `/api/teams/*`
**Modelos**: Project, Team, TeamMember, TeamInvite
**Status**: ✅ 85% Implementado

---

### 🐳 Infrastructure Domains

#### [containers.md](./containers.md) - **Containers & Deployments**
**Escopo**: Docker containers, builds, deployment pipeline
**Rotas**: `/api/containers/*`, `/api/builds/*`, `/api/deployments/*`
**Modelos**: Container, Deployment, Build
**Serviços**: DockerService, BuildQueue
**Status**: ✅ 90% Implementado

---

#### [networking.md](./networking.md) - **Networking (Domains & SSL)**
**Escopo**: DNS, domínios, certificados SSL, Traefik
**Rotas**: `/api/domains/*`, `/api/ssl/*`
**Modelos**: Domain, SslCertificate
**Serviços**: DomainService, TraefikService
**Status**: ✅ 80% Implementado

---

#### [storage.md](./storage.md) - **Storage & Backups**
**Escopo**: Backups automáticos, databases managed, S3
**Rotas**: `/api/backups/*`, `/api/databases/*`
**Modelos**: Backup, Database
**Serviços**: BackupService
**Status**: ✅ 75% Implementado

---

### 📊 Supporting Domains

#### [monitoring.md](./monitoring.md) - **Monitoring & Observability**
**Escopo**: Métricas, logs, health checks, alertas
**Rotas**: `/api/health`, `/api/metrics/*`
**Serviços**: MetricsService, LogAggregator
**Status**: 📋 Planejado (50%)

---

#### [ai-assistant.md](./ai-assistant.md) - **AI Assistant**
**Escopo**: Integração LLM (Ollama, OpenAI, Google, Anthropic)
**Rotas**: `/api/ai/*`
**Serviços**: AIService, LLMProvider
**Status**: 📋 Planejado (30%)

---

#### [webhooks.md](./webhooks.md) - **Webhooks & Integrations**
**Escopo**: Webhooks de eventos, integrações externas
**Rotas**: `/api/webhooks/*`
**Modelos**: Webhook, WebhookEvent
**Status**: ✅ 70% Implementado

---

#### [settings.md](./settings.md) - **Server Settings**
**Escopo**: Configurações globais do painel
**Rotas**: `/api/settings/*`
**Modelos**: ServerSettings
**Status**: ✅ 60% Implementado

---

## 🔗 Cross-Domain Dependencies

`
Authentication (base)
  ↓
Projects & Teams
  ↓
Containers ← Networking
  ↓         ↓
Storage   Monitoring
  ↓
Webhooks
`

---

## 📘 Como Criar Novo Domínio

Use o template:

`bash
cp TEMPLATE.md <new-domain>.md

# Preencher todas as seções
`

**Checklist**:
- [ ] Overview completo
- [ ] Business rules com IDs (BR-XXX-001)
- [ ] User stories com critérios de aceitação
- [ ] Prisma schema
- [ ] API endpoints com exemplos
- [ ] Código de implementação (mínimo 3 snippets)
- [ ] Testes (unit + integration)
- [ ] Future enhancements

---

**Princípio Fundamental**: Se você abrir um arquivo de domínio e ainda precisar abrir outro arquivo para entender o contexto, a documentação está incompleta.

**Última Atualização**: 2025-01-27

