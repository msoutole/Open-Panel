# OpenPanel - Arquitetura e Especificações Técnicas

## Contexto do Projeto

- **Papel**: Senior Cloud Architect & Full-Stack Engineer
- **Projeto**: OPEN PANEL (Painel de Controle de Hospedagem)
- **Objetivo**: Arquitetura lógica, modelo de dados e regras de negócio para substituir EasyPanel V2.3.0
- **Visão**: Privacy-first e AI-powered com orquestração robusta de containers

> 📚 **Knowledge Base Completa**: Para documentação abrangente do projeto, consulte [KNOWLEDGE.md](./KNOWLEDGE.md)

---

## I. Arquitetura Lógica e Requisitos de API (Backend)

Framework base: **Hono/Bun**

### 1. Módulo de Autenticação e Segurança

#### 1.1 Gestão de Credenciais (USER)

- Endpoint para alterar credenciais
- Validação obrigatória: Email, Senha Antiga, Nova Senha

#### 1.2 Autenticação de Dois Fatores (2FA)

- Configuração de 2FA (funcionalidade ausente no OpenPanel atual)
- Campo no schema: `twoFactorSecret: String?`

#### 1.3 Gestão de Chaves API

- Geração de API Keys para usuários
- CRUD completo do modelo `ApiKey`
- Rastreamento de `expiresAt`

### 2. Módulo de Orquestração de Containers

#### 2.1 Hierarquia de Projetos

- Estrutura: **Projeto > Serviços**
- Exemplo: Chatwoot com serviços (chatwoot-db, chatwoot-redis, chatwoot-sidekiq)

#### 2.2 Serviços de Database Integrados

Tipos suportados:

- MySQL
- PostgreSQL
- MariaDB
- MongoDB
- Redis
- Aplicativo, Caixa, Compose (BETA), WordPress (ALFA)

#### 2.3 Configurações de Projeto

**Membros do Projeto**

- Gerenciamento de membros com roles
- Toggles de ativação/desativação
- Distinção: administradores vs. outros usuários

**Variáveis de Ambiente**

- CRUD robusto para Env Vars
- Interface com edição em texto simples/JSON

**Esquema do Projeto**

- Visualização do esquema em formato estruturado (JSON/YAML)
- Funcionalidade de cópia

**Zona de Perigo**

- Destruição de projeto
- Cascata: todos os serviços vinculados também são destruídos

### 3. Módulo de Deploy e Configuração de Builders

#### 3.1 Construtores Docker Customizados

- Criação de Docker Builders com alocação de recursos
- Parâmetros:
  - **Memória** (MB)
  - **Swap de Memória** (MB)
  - **CPUs** (núcleos)

**Regra de Negócio**: Swap > Memória

#### 3.2 Limpeza do Docker

- Ações programadas ou manuais
- Sub-ações:
  - Limpar Imagens
  - Limpar Construtor
  - Limpeza do Sistema

#### 3.3 Transferência de Serviços (Experimental)

- Exportar Serviço
- Importar Serviço
- Migrar Serviço
  - Requer: URL Remota + Token API Remoto

### 4. Módulo de Monitoring e Observabilidade

#### 4.1 Visualização de Métricas em Tempo Real

- Dashboard principal com:
  - CPU %
  - Memória %
  - Disco %
- Atualização a cada 2-5 segundos (polling Docker Engine)

#### 4.2 Monitoramento de Serviços

- Detalhe por container/serviço:
  - CPU %
  - MEMÓRIA %
  - ENTRADA de Rede (IN)
  - SAÍDA de Rede (OUT)

#### 4.3 Rastreamento de Eventos Docker

- Registro de eventos de containers
- Campos: Tipo, Ação, Tempo, Detalhes
- Exemplos: exec_die, exec_start, exec_create

#### 4.4 Gerenciamento de Armazenamento

- SIZE e CAMINHO por serviço/database
- Exemplo: `/etc/openpanel/projects/...`

### 5. Módulo de Networking e SSL

#### 5.1 Middlewares do Traefik

Tipos suportados:

- AddPrefix
- BasicAuth
- Compress
- DigestAuth
- Errors
- ForwardAuth
- InFlightReq
- IpAllowList
- RateLimit
- RedirectRegex
- RedirectScheme
- ReplacePathRegex
- StripPrefixRegex

#### 5.2 Gerenciamento de Domínios

- CRUD de domínios
- Múltiplos domínios/subdomínios por serviço
- Ações: edição, cópia

#### 5.3 Certificados SSL

- Listagem de certificados ativos
- Suporte a subdomínios e services (ex: demo.openpanel.io, mautic-mautic)
- Ação: Remover

### 6. Módulo de Configurações Avançadas (SERVER)

#### 6.1 Configurações Gerais

- Gerenciamento do Domínio Padrão
- Configuração de Domínio Personalizado do painel
- Email do Let's Encrypt
- Toggle: Servir no endereço IP
- Ações do servidor:
  - Logs
  - Reiniciar
  - Atualizar IP
  - Verificar Atualizações
  - Console
  - Disk Usage

#### 6.2 Provedores de Armazenamento

Tipos:

- **Local Disk** (implementação inicial)
  - Requer: Nome, Caminho (ex: `/etc/openpanel/backups`)
- S3 (futuro)
- B2 (futuro)

#### 6.3 Integração Github

- Configuração do Token do Github
- Instrução: marcar escopo `repo`

#### 6.4 Integração Analítica

- Google Analytics via ID de Medição

#### 6.5 Cluster e Workers

- Visualização de Nós (Nodes)
- Atributos por nó:
  - Estado (ready)
  - Disponibilidade (active)
  - Status do Gerente
  - Versão do Engine
- Botão: Adicionar Worker (design implementado, funcionalidade em desenvolvimento)

#### 6.6 Túnel Cloudflare (Experimental)

- Configuração do Túnel Cloudflare
- Campos:
  - Token da API
  - ID da Conta
  - ID do Túnel
- Ação: Iniciar Túnel

### 7. Módulo de Marca e Branding

#### 7.1 Configurações Básicas de Servidor

- Nome do Servidor
- Cor do Servidor
- Toggle: Ocultar IP
- Toggle: Ocultar Notas do Serviço

#### 7.2 Gestão de Logos

- Upload Logo Claro
- Upload Logo Escuro
- Formatos suportados: SVG, HTML

#### 7.3 Personalização de Código

- Inserção de Código Personalizado
- Tipos: tags HTML, `<script>`, `<style>`
- **Segurança**: Higienizar para prevenir XSS

#### 7.4 Links e Documentação

- Toggle: Ocultar Documentação
- Toggle: Ocultar Discord
- Toggle: Ocultar Feedback
- Toggle: Ocultar Histórico de Alterações

#### 7.5 Página de Erro

- CSS Personalizado
- Toggle: Ocultar Logo
- Toggle: Ocultar Links

---

## II. Modelo de Dados (Prisma Schema)

### Entidades Principais

| Entidade              | Propósito                       | Campos Chave                                                                                                                                                   |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**              | Credenciais, 2FA, API Keys      | `twoFactorSecret: String?`<br>`apiKeys: ApiKey[]`                                                                                                              |
| **ApiKey**            | Gestão de chaves API            | `expiresAt: DateTime`                                                                                                                                          |
| **ServerSettings**    | Configurações globais do painel | `defaultDomain: String`<br>`customDomain: String?`<br>`letsEncryptEmail: String`<br>`googleAnalyticsId: String?`<br>`hideIp: Boolean`<br>`serverColor: String` |
| **StorageProvider**   | Backup e armazenamento          | `name: String`<br>`type: StorageType (LOCAL, S3, B2)`<br>`path: String?`                                                                                       |
| **DockerBuilder**     | Pool de construção              | `name: String`<br>`memoryLimitMB: Int`<br>`swapLimitMB: Int`<br>`cpuLimitCores: Float`                                                                         |
| **ServerActionLog**   | Logs de gerenciamento           | `actorId: String`<br>`action: String`<br>`ipAddress: String`<br>`duration: String`                                                                             |
| **ProjectMember**     | Colaboração em projetos         | `userId: String`<br>`projectId: String`<br>`role: Role`                                                                                                        |
| **Certificate**       | Gerenciamento de SSL            | `domain: String`<br>`expiresAt: DateTime`<br>`autoRenew: Boolean`                                                                                              |
| **TraefikMiddleware** | Configurações de Traefik        | `name: String`<br>`type: MiddlewareType`<br>`config: Json`                                                                                                     |
| **CloudflareTunnel**  | Tunelamento Cloudflare          | `apiToken: String`<br>`accountId: String`<br>`tunnelId: String`                                                                                                |
| **DockerEvent**       | Logs de eventos Docker          | `type: String`<br>`action: String`<br>`timestamp: DateTime`<br>`details: String`                                                                               |
| **Node**              | Gerenciamento de Cluster        | `hostName: String`<br>`status: String`<br>`engineVersion: String`                                                                                              |

---

## III. Regras de Negócio e Fluxos Críticos

### 1. Regras de Monitoramento

**Agregação de Dados**

- Polling de métricas Docker Engine a cada **2-5 segundos**
- Atualização do dashboard principal e visualização de serviços

**Consistência de Logs**

- WebSocket para logs de containers (tempo real)
- Visualização persistente de logs do servidor (Ações)
- Visualização persistente de eventos Docker

### 2. Regras de Migração e Exportação (Experimental)

**Requisito de Token**

- Migração remota exige Token API Remoto válido
- Autenticação obrigatória contra instância OpenPanel de origem

**Validação de Nome**

- Nome do Serviço não pode estar em uso
- Validação necessária durante importação

### 3. Regras de Cluster (Adicionar Worker)

**Estado Inicial**

- Cluster deve refletir capacidade multi-nó
- Mesmo em single-nó: Estado `ready`, Disponibilidade `active`

**Orquestração Futura**

- Design para integração com Docker Swarm ou Kubernetes
- Planejado para OpenPanel V1.1+

### 4. Regras de Branding e Personalização

**Branding Override**

- Código Personalizado > Configurações de Marca > Padrões
- Usuários podem configurar completamente a experiência visual

**Segurança de Código**

- Todo Código Personalizado (HTML, script, style) deve ser higienizado
- Isolamento para prevenir ataques XSS
- Especial atenção em páginas de erro

### 5. Regras de Segurança (Server/User)

**Logging e Auditoria**

- Registrar todas as ações de configuração (Github, Cloudflare)
- Registrar alterações de credenciais
- **Nunca registrar segredos** em AuditLogs
- Seguir melhores práticas de segurança

**Backup Encryption**

- Aplicar por padrão a todos os Provedores de Armazenamento
- Algoritmo: **AES-256**
- Aplicável antes do upload para serviços externos (S3, B2)

---

## IV. Prioridades de Implementação

### P0 (CRÍTICO - BLOQUEADOR)

- Aumentar cobertura de testes (atual: 20%, meta: 70%+)
- Resolver Error Handling Inexistente
- Crítico para estabilidade de produção

### P1 (ALTA PRIORIDADE)

- UI de gerenciamento de containers
- Dashboard de Métricas (Recharts)
- Terminal Web (xterm.js)
- Monitoring e Observabilidade
- Storage Providers
- Docker Builders
- Métricas em tempo real

### P2 (MÉDIA PRIORIDADE)

- Roteamento dinâmico automático
- SSL Let's Encrypt para domínios OpenPanel
- Replicação automática de domínios (padrão e personalizados)
- Cluster multi-nó

### P3 (EXPANSÃO)

- Interface de chat completa (IA Assistant)
- Streaming de respostas
- Diferencial competitivo do projeto

---

## V. Notas de Implementação

### Tecnologias

- **Backend**: Hono/Bun
- **ORM**: Prisma
- **Frontend**: React (inferido do projeto)
- **Dashboard**: Recharts (para métricas)
- **Terminal**: xterm.js (para console web)
- **Orquestração**: Docker Engine

### Padrões de Segurança

- Higienização de entrada para Código Personalizado
- AES-256 para encriptação de backups
- Nunca armazenar segredos em logs
- Validação rigorosa em endpoints de token/credenciais

### Padrões de Performance

- Polling a cada 2-5 segundos (não mais frequente)
- WebSocket para logs em tempo real
- Agregação de métricas antes da visualização
