# 📚 Documentação do OpenPanel

Bem-vindo à documentação completa do OpenPanel! Aqui você encontrará tudo o que precisa para usar, desenvolver e contribuir com o projeto.

---

## 🚀 Início Rápido

- **[Installation Guide](./installation.md)** - Como instalar o OpenPanel
- **[Getting Started](../README.md#-instalação)** - Primeiros passos após instalação

---

## 📖 Documentação Principal

### Visão Geral

- **[README Principal](../README.md)** - Visão geral do projeto, features e quick start
- **[KNOWLEDGE Base](./KNOWLEDGE.md)** - 📚 Documentação completa de conhecimento do projeto
- **[Roadmap](./roadmap.md)** - Timeline de desenvolvimento (Jan-Jul 2025)
- **[Comparison](./comparison.md)** - OpenPanel vs EasyPanel, Coolify, CapRover

### Arquitetura

- **[Architecture](./architecture.md)** - Arquitetura do sistema, componentes e fluxos
- **[Architecture Documentation](./architecture/)** - Documentação detalhada da arquitetura
  - [Architecture Overview](./architecture/ARCHITECTURE_OVERVIEW.md)
  - [Architecture Index](./architecture/ARCHITECTURE_INDEX.md)
  - [Architecture Diagram](./architecture/ARCHITECTURE_DIAGRAM.md)
- **[Deployment System](./deployment-system.md)** - Sistema de build e deploy (Dockerfile, Nixpacks, etc.)
- **[Networking & SSL](./networking-ssl.md)** - Traefik, domínios customizados e SSL automático
- **[Database Management](./database-management.md)** - PostgreSQL, MySQL, MongoDB, Redis + backups

### Features

- **[AI Features](./ai_features.md)** - Assistente IA integrado (Gemini, Groq, Ollama)
- **[Agno Framework](./agno/)** - Framework de agentes autônomos
  - [Agno README](./agno/AGNO_README.md) - Visão geral do Agno
  - [Agno Quick Start](./agno/AGNO_QUICK_START.md) - Início rápido
  - [Agno Integration Guide](./agno/AGNO_INTEGRATION_GUIDE.md) - Guia de integração
  - [Agno Dashboard Setup](./agno/AGNO_DASHBOARD_SETUP.md) - Configuração do dashboard
  - [Agno Scripts](./agno/AGNO_SCRIPTS.md) - Scripts e comandos
  - [Agno Summary](./agno/AGNO_SUMMARY.md) - Resumo completo
- **[CrewAI Integration](./crewai/)** - Integração com CrewAI Dashboard
  - [Integration Guide](./crewai/integration-guide.md) - Guia completo de integração
  - [CrewAI Integration Real](./crewai/CREWAI_INTEGRATION_REAL.md) - Integração real
  - [CrewAI Token Setup](./crewai/CREWAI_TOKEN_SETUP.md) - Configuração de tokens
- **[Monitoring & Observability](./monitoring-observability.md)** - Prometheus, Grafana, Loki *(em breve)*
- **[Security](./security.md)** - Práticas de segurança e compliance *(em breve)*

### Desenvolvimento

- **[Contributing](./contributing.md)** - Como contribuir com o projeto
- **[API Reference](./api-reference.md)** - Documentação da API REST *(em breve)*
- **[Installation](./installation.md)** - Guia completo de instalação

---

## 📋 Índice Completo

### 1. Introdução

#### 1.1 Visão Geral
- [O que é OpenPanel?](../README.md#-visão-geral)
- [Por que OpenPanel?](../README.md#-o-que-torna-o-openpanel-diferente)
- [Comparação com Alternativas](./comparison.md)

#### 1.2 Getting Started
- [Requisitos do Sistema](./installation.md#-requisitos-do-sistema)
- [Instalação via Docker](./installation.md#-instalação-via-docker-recomendado)
- [Instalação Manual](./installation.md#-instalação-manual-development)
- [Primeiro Deploy](../README.md#-instalação)

### 2. Features

#### 2.1 Core Features
- [Gerenciamento de Containers](../README.md#-gerenciamento-de-containers--deploy)
- [Deploy System](./deployment-system.md)
  - Docker Image
  - Dockerfile
  - Nixpacks
  - Paketo Buildpacks
  - Heroku Buildpacks
  - Git Integration
- [Networking & Domains](./networking-ssl.md)
  - Custom Domains
  - Subdomains
  - SSL/TLS Automático
  - DNS Management
- [Databases](./database-management.md)
  - PostgreSQL
  - MySQL/MariaDB
  - MongoDB
  - Redis
  - Backups & Recovery

#### 2.2 AI Features ⭐
- [AI Assistant Overview](./ai_features.md)
- [Multi-Provider Support](./ai_features.md#providers-suportados-inicial)
  - Gemini (Google)
  - Groq (Ultra-rápido)
  - Ollama (Local/Privado)
- [Capacidades](./ai_features.md#-capacidades-principais)
  - Log Analysis
  - Troubleshooting
  - Code Generation
  - Security Scanning
  - Performance Optimization

#### 2.3 Monitoring & Observability
- Prometheus Metrics *(Sprint 11)*
- Grafana Dashboards *(Sprint 11)*
- Centralized Logging (Loki) *(Sprint 11)*
- Alerting System *(Sprint 11)*

#### 2.4 Security
- JWT Authentication *(Sprint 2)*
- RBAC (Role-Based Access Control) *(Sprint 12)*
- Backup Encryption *(Sprint 8)*
- Audit Logs *(Sprint 12)*
- Security Scanning (Trivy) *(Sprint 10)*

### 3. Arquitetura

#### 3.1 System Design
- [Overview](./architecture.md#visão-geral-em-camadas)
- [Components](./architecture.md#componentes-principais)
- [Data Flow](./architecture.md#fluxos-críticos)

#### 3.2 Tech Stack
- [Backend](../README.md#backend) - Bun, Hono, Prisma, PostgreSQL, Redis
- [Frontend](../README.md#frontend) - React 18, Vite, TailwindCSS, shadcn/ui
- [Infrastructure](../README.md#infraestrutura) - Docker, Traefik, Prometheus

#### 3.3 Deployment Architecture
- [Build System](./deployment-system.md#11-arquitetura-técnica)
- [Container Orchestration](./architecture.md#docker-engine)
- [Reverse Proxy](./networking-ssl.md#1-traefik-integration)

### 4. Deployment

#### 4.1 Build Methods
- [Docker Image Deploy](./deployment-system.md#1-deploy-via-docker-image)
- [Dockerfile Deploy](./deployment-system.md#2-deploy-via-dockerfile)
- [Nixpacks](./deployment-system.md#3-deploy-via-nixpacks)
- [Paketo Buildpacks](./deployment-system.md#4-deploy-via-paketo-buildpacks)
- [Heroku Buildpacks](./deployment-system.md#5-deploy-via-heroku-buildpacks)

#### 4.2 Git Integration
- [GitHub](./deployment-system.md#6-deploy-via-git-webhook-automático)
- [GitLab](./deployment-system.md#providers-suportados)
- [Bitbucket](./deployment-system.md#providers-suportados)
- [Webhooks](./deployment-system.md#3-push-trigger)

#### 4.3 Configuration
- [Environment Variables](./deployment-system.md#8-gerenciamento-de-variáveis-de-ambiente)
- [Magic Variables](./deployment-system.md#magic-variables)
- [Build Args](./deployment-system.md#build-args)

### 5. Networking

#### 5.1 Domains
- [Custom Domains](./networking-ssl.md#2-domínios-customizados)
- [Subdomains](./networking-ssl.md#3-subdomínios)
- [Wildcard Domains](./networking-ssl.md#wildcard-subdomain-support)

#### 5.2 SSL/TLS
- [Let's Encrypt](./networking-ssl.md#4-ssltls-automático)
- [Wildcard Certificates](./networking-ssl.md#certificados-wildcard)
- [Custom Certificates](./networking-ssl.md#custom-ssl-certificates)
- [Force HTTPS](./networking-ssl.md#force-https)

#### 5.3 DNS Management
- [Cloudflare](./networking-ssl.md#cloudflare)
- [Route53 (AWS)](./networking-ssl.md#route53-aws)
- [DigitalOcean](./networking-ssl.md#digitalocean-dns)
- [Manual Configuration](./networking-ssl.md#manual-dns-configuration)

#### 5.4 Advanced
- [Load Balancing](./networking-ssl.md#6-load-balancing)
- [Middlewares](./networking-ssl.md#7-middlewares)
- [WebSocket Support](./networking-ssl.md#9-websocket-support)

### 6. Databases

#### 6.1 Supported Databases
- [PostgreSQL](./database-management.md#1-postgresql)
- [MySQL/MariaDB](./database-management.md#2-mysqlmariadb)
- [MongoDB](./database-management.md#3-mongodb)
- [Redis](./database-management.md#4-redis)

#### 6.2 Management
- [Web Consoles](./database-management.md#web-console-pgadmin)
- [Connection Strings](./database-management.md#6-connection-strings-management)
- [Resource Configuration](./database-management.md#5-configuração-e-resources)

#### 6.3 Backups
- [Manual Backups](./database-management.md#7-backups)
- [Scheduled Backups](./database-management.md#scheduled-backups)
- [Backup Encryption](./database-management.md#backup-encryption)
- [S3 Integration](./database-management.md#backup-providers)
- [Restore & Recovery](./database-management.md#8-restore--recovery)

#### 6.4 Advanced
- [Database Cloning](./database-management.md#9-database-cloning)
- [Monitoring](./database-management.md#10-monitoring--observability)
- [Security](./database-management.md#11-security-best-practices)

### 7. AI Assistant

#### 7.1 Setup
- [Providers Configuration](./ai_features.md#-como-configurar-providers)
- [Gemini Setup](./ai_features.md#exemplo-env-resumo)
- [Groq Setup](./ai_features.md#exemplo-env-resumo)
- [Ollama Setup](./ai_features.md#exemplo-env-resumo)

#### 7.2 Capabilities
- [Chat Interface](./ai_features.md#1--chat-assistente)
- [Log Analysis](./ai_features.md#2--análise-de-logs)
- [Code Generation](./ai_features.md#3--geração-de-código-e-configs)
- [Security Scanning](./ai_features.md#4--scanning-de-segurança)
- [Performance Tips](./ai_features.md#5--otimização-de-performance)
- [Troubleshooting](./ai_features.md#6--troubleshooting-automático)

#### 7.3 Use Cases
- [Dockerfile Generation](./ai_features.md#-exemplos-rápidos)
- [Error Diagnosis](./ai_features.md#-exemplos-rápidos)
- [Security Audit](./ai_features.md#-exemplos-rápidos)

### 8. Development

#### 8.1 Contributing
- [How to Contribute](./contributing.md#-como-contribuir)
- [Code of Conduct](./contributing.md#-código-de-conduta)
- [Development Setup](./contributing.md#️-setup-de-desenvolvimento)
- [Code Standards](./contributing.md#-padrões-de-código)
- [Pull Request Process](./contributing.md#-processo-de-pull-request)

#### 8.2 Testing
- [Running Tests](./contributing.md#-testes)
- [Writing Tests](./contributing.md#backend-tests-bun-test)
- [Coverage Requirements](./contributing.md#cobertura-mínima)

#### 8.3 Documentation
- [Contributing to Docs](./contributing.md#-documentação)
- [Writing Guidelines](./contributing.md#padrão-markdown)

### 9. Deployment & Operations

#### 9.1 Installation
- [System Requirements](./installation.md#-requisitos-do-sistema)
- [Docker Installation](./installation.md#-instalação-via-docker-recomendado)
- [Manual Installation](./installation.md#-instalação-manual-development)

#### 9.2 Cloud Providers
- [DigitalOcean](./installation.md#digitalocean-droplet)
- [AWS EC2](./installation.md#aws-ec2)
- [Hetzner](./installation.md#hetzner-cloud)
- [Linode](./installation.md#linode)

#### 9.3 Configuration
- [Environment Variables](./installation.md#4-configurar-variáveis-de-ambiente)
- [Security Hardening](./installation.md#-hardening-de-segurança)
- [Advanced Configuration](./installation.md#-configurações-avançadas)

#### 9.4 Operations
- [Updates](./installation.md#-atualizações)
- [Backups](./installation.md#backup-automático)
- [Monitoring](./installation.md#monitoring-prometheus--grafana)
- [Troubleshooting](./installation.md#-troubleshooting)

### 10. Roadmap & Planning

#### 10.1 Timeline
- [Overview](./roadmap.md#-visão-geral-da-timeline)
- [Phase 1: Foundation](./roadmap.md#️-fase-1-fundação-sprints-1-2---jan-2025) (Jan 2025)
- [Phase 2: Docker Integration](./roadmap.md#️-fase-2-integração-docker-sprints-3-4---fev-2025) (Fev 2025)
- [Phase 3: Networking & SSL](./roadmap.md#-fase-3-networking--ssl-sprints-5-6---mar-2025) (Mar 2025)
- [Phase 4: Databases](./roadmap.md#️-fase-4-databases-sprints-7-8---abr-2025) (Abr 2025)
- [Phase 5: AI Assistant](./roadmap.md#-fase-5-assistente-ia-sprints-9-10---mai-2025-) (Mai 2025) ⭐
- [Phase 6: Advanced Features](./roadmap.md#-fase-6-funcionalidades-avançadas-sprints-11-12---jun-2025) (Jun 2025)

#### 10.2 Milestones
- [v1.0.0 Goals](./roadmap.md#-lançamento-julho-2025) (Jul 2025)
- [Post v1.0](./roadmap.md#-pós-v10-futuro)
- [Success Metrics](./roadmap.md#-métricas-de-sucesso)

#### 10.3 Comparison
- [vs EasyPanel](./comparison.md#1-openpanel-vs-easypanel)
- [vs Coolify](./comparison.md#2-openpanel-vs-coolify)
- [vs CapRover](./comparison.md#3-openpanel-vs-caprover)
- [Decision Matrix](./comparison.md#-matriz-de-decisão)

### 11. API Reference

*(Em breve - Sprint 12)*

- Authentication
- Services CRUD
- Containers Management
- Deployments
- Domains
- Databases
- Environment Variables
- Backups
- Webhooks

---

## 🎯 Documentos por Audience

### Para Usuários

1. [Installation Guide](./installation.md) - Como instalar
2. [Getting Started](../README.md#-instalação) - Primeiros passos
3. [Deploy Your First App](./deployment-system.md) - Primeiro deploy
4. [Configure Domains](./networking-ssl.md) - Domínios e SSL
5. [Database Setup](./database-management.md) - Configurar databases
6. [AI Assistant Guide](./ai_features.md) - Usar o assistente IA

### Para Desenvolvedores

1. [Contributing Guide](./contributing.md) - Como contribuir
2. [Architecture](./architecture.md) - Arquitetura do sistema
3. [Development Setup](./contributing.md#️-setup-de-desenvolvimento) - Setup local
4. [Code Standards](./contributing.md#-padrões-de-código) - Padrões de código
5. [Testing](./contributing.md#-testes) - Como testar
6. [API Reference](./api-reference.md) *(em breve)*

### Para DevOps/SysAdmins

1. [Installation on VPS](./installation.md#-instalação-via-docker-recomendado)
2. [Cloud Deployment](./installation.md#️-deploy-em-cloud-providers)
3. [Security Hardening](./installation.md#-hardening-de-segurança)
4. [Monitoring Setup](./installation.md#monitoring-prometheus--grafana)
5. [Backup Configuration](./installation.md#backup-automático)
6. [Troubleshooting](./installation.md#-troubleshooting)

### Para Tomadores de Decisão

1. [Project Overview](../README.md) - O que é OpenPanel
2. [Comparison](./comparison.md) - vs Concorrentes
3. [Roadmap](./roadmap.md) - Timeline de desenvolvimento
4. [Success Metrics](./roadmap.md#-métricas-de-sucesso) - Metas do projeto

---

## 🔗 Links Úteis

- **GitHub**: https://github.com/msoutole/openpanel
- **Discussions**: https://github.com/msoutole/openpanel/discussions
- **Issues**: https://github.com/msoutole/openpanel/issues
- **Website**: *(em breve)*
- **Discord**: *(em breve)*

---

## 📝 Contribuindo com a Documentação

Encontrou um erro? Quer melhorar a docs?

1. Fork o repositório
2. Edite os arquivos em `docs/`
3. Abra um Pull Request

Veja o [Contributing Guide](./contributing.md#-documentação) para mais detalhes.

---

## 📅 Última Atualização

**Data**: 23 de Novembro de 2025
**Versão**: v0.1.0 (Pré-Alpha)

---

**Feito com ❤️ pela comunidade OpenPanel**
