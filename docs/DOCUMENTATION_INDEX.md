Documentação técnica de cada feature:
- **[Authentication System](./features/01-authentication.md)** - Sistema de autenticação
- **[Project Management](./features/02-project-management.md)** - Gerenciamento de projetos
- **[Docker Integration](./features/03-docker-integration.md)** - Integração com Docker
- **[Deployment Pipeline](./features/04-deployment-pipeline.md)** - Pipeline de deploy
- **[Domain Management](./features/05-domain-management.md)** - Gerenciamento de domínios
- **[SSL/TLS Management](./features/06-ssl-management.md)** - SSL e certificados
- **[Backup System](./features/07-backup-system.md)** - Sistema de backup
- **[RBAC & Security](./features/08-rbac-security.md)** - Controle de acesso e segurança
- **[AI Assistant](./features/09-ai-assistant.md)** - Assistente com IA
- **[Health & Monitoring](./features/10-monitoring.md)** - Monitoramento

### 5. [Architecture](./architecture/)
Documentação de arquitetura:
- **[System Architecture](./architecture/01-system-architecture.md)** - Arquitetura geral
- **[Backend Architecture](./architecture/02-backend-architecture.md)** - Backend (API)
- **[Frontend Architecture](./architecture/03-frontend-architecture.md)** - Frontend (React)
- **[Database Design](./architecture/04-database-design.md)** - Design do banco de dados
- **[API Design](./architecture/05-api-design.md)** - Design das APIs
- **[Security Architecture](./architecture/06-security-architecture.md)** - Arquitetura de segurança
- **[Deployment Architecture](./architecture/07-deployment-architecture.md)** - Arquitetura de deploy

### 6. [API Reference](./api-reference/)
Referência das APIs:
- **[Authentication Endpoints](./api-reference/01-authentication.md)** - Endpoints de autenticação
- **[Projects API](./api-reference/02-projects.md)** - API de projetos
- **[Containers API](./api-reference/03-containers.md)** - API de containers
- **[Deployments API](./api-reference/04-deployments.md)** - API de deployments
- **[Domains API](./api-reference/05-domains.md)** - API de domínios
- **[Teams API](./api-reference/06-teams.md)** - API de times
- **[Users API](./api-reference/07-users.md)** - API de usuários
- **[Backups API](./api-reference/08-backups.md)** - API de backups

## 🎯 Como Usar Esta Documentação

### Para Novos Desenvolvedores

### Para Debugging e Troubleshooting
1. Consulte [Monitoring & Health](./features/10-monitoring.md)
2. Verifique os logs nas rotas de health check
3. Use a [Architecture](./architecture/) para entender fluxos

## 📋 Formato da Documentação

Toda a documentação é formatada em Markdown compatível com modelos de IA, facilitando:
- Leitura por LLMs (Claude, GPT, etc.)
- Análise de features e arquitetura
- Geração automática de código
- Compreensão de contexto

## 🔄 Fluxo de Desenvolvimento

```
User Story → Implementation Plan → Feature Documentation → Code → PR
     ↓              ↓                      ↓                ↓      ↓
Requisitos   Design Técnico         Implementação    Review  Merge
```

## 📊 Status das Features

Veja o status de cada feature no [ROADMAP.md](./implementation-plan/ROADMAP.md)

## 🤝 Contribuindo

Ao adicionar novas features:
1. Crie a User Story em [user-stories/](./user-stories/)
2. Documente a feature em [features/](./features/)
3. Atualize o [ROADMAP.md](./implementation-plan/ROADMAP.md)
4. Adicione endpoints em [api-reference/](./api-reference/)
5. Atualize a [Architecture](./architecture/) se necessário

---

**Última atualização**: 2024-11-24
**Versão OpenPanel**: 0.1.0
