# 🏛 Arquitetura do OpenPanel

Este documento descreve os componentes, fluxos e decisões arquiteturais do OpenPanel.

---

## Visão Geral em camadas

1. Interface (Frontend)
2. API (Backend)
3. Orquestração de Containers (Docker Engine)
4. Infraestrutura de apoio (DB, Cache, Queue)
5. Reverse Proxy / SSL (Traefik)
6. Serviços externos (AI Providers, DNS providers, S3 backups)

---

## Diagrama (ASCII)

`
[Usuário/Browser]
       │ HTTPS
       ▼
   [Traefik Proxy]  <--- (SSL Termination, Routing)
       │
       ├──────────────┐
       │              │
       ▼              ▼
[OpenPanel Frontend]  [OpenPanel API (Bun + Hono)]
       │                     │
       │ WebSocket / REST    │ REST / Jobs
       │                     ▼
       │              [Worker Queue (BullMQ/Redis)]
       │                     │
       │                     ▼
       │              [Docker Engine (dockerode)]
       │              /   |    \
       │         containers volumes networks
       │
       ▼
[Databases: PostgreSQL]  [Redis]  [Object Storage: S3/MinIO]
`

---

## Componentes Principais

### Frontend

- React + Vite
- Comunica com API via REST/GraphQL + WebSockets para logs/updates em tempo real
- Componentes: Dashboard, Projects, Containers, Databases, AI Chat

### Backend (API)

- Bun + Hono
- Responsável por: autenticação, autorização, orquestração de builds, chamadas para Docker API, orquestração da IA
- Persistência: PostgreSQL (Prisma)
- Cache e fila: Redis (session, caching, BullMQ for jobs)

### Workers

- Processos assíncronos para builds, scans, backups
- Leem da fila e executam jobs via Docker/Traefik/AI

### Docker Engine

- Execução local de containers (single-node)
- Opções futuras: suporte a Swarm/Kubernetes

### Reverse Proxy (Traefik)

- Roteamento dinâmico com provider Docker
- Integração ACME para Let's Encrypt
- Dashboard para debug de roteamento

### AI Orchestrator

- Camada que normaliza chamadas a Gemini / Groq / Ollama
- Gestão de contexto, tokens, fallback e limites de taxa
- Responsável por segurança: não enviar dados sensíveis sem consentimento

---

## Fluxos Críticos

### Deploy via Git

1. Webhook de push recebe notificação
2. API cria job na fila (build)
3. Worker puxa código, executa build (Buildpacks ou Dockerfile)
4. Imagem é criada e um container é iniciado
5. Traefik atualiza roteamento automaticamente

### Geração de Dockerfile por IA

1. Usuário solicita via chat
2. Orquestrador monta prompt (contexto do projeto)
3. Provider responde com Dockerfile
4. Exibir para revisão e opção de aplicar (criar arquivo e disparar build)

### Backup

- Jobs agendados fazem dump do DB e enviam para S3/MinIO
- Retenção configurável
- Backups criptografados se configurado

---

## Segurança

- Autenticação: JWT + 2FA (optativo)
- Autorização: RBAC (planejado)
- Secrets: armazenados criptografados (KMS/ano futuro)
- Rede: recomenda-se firewall e reinvidicação de portas explícitas
- Scanning: Trivy para imagens, auditoria de ações do assistente IA

---

## Escalabilidade e operações

- Design otimizado para single-node self-hosted.
- Workers desacoplados permitem escalar processamento (mais containers worker).
- Futuro: suporte multi-node e Kubernetes para alta disponibilidade.

---

## Observabilidade

- Métricas: Prometheus exporters (api, workers, docker)
- Dashboards: Grafana
- Logs: Centralizado (Loki ou solução similar)
- Tracing: OpenTelemetry (planejado)

---

## Considerações finais

- Priorizar DX (developer experience) e segurança
- IA como camada de auxílio, não como execução automática sem checagem humana
- Modularidade para permitir substituição de componentes (ex.: trocar Traefik por Nginx ou adicionar Kubernetes)
