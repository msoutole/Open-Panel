# Módulo: Projetos e Aplicações

> **Status**: ✅ Estável
> **Versão**: 1.0
> **Última Atualização**: 2025-11-25

## 1. Contexto

Projetos são a unidade central de organização no OpenPanel. Um projeto representa uma aplicação (Web, API, Worker, Database) e contém todas as configurações necessárias para build, deploy e execução.

### Tipos de Projeto
- **WEB**: Aplicações frontend (React, Vue, Next.js).
- **API**: Backends (Node, Go, Python).
- **WORKER**: Processos em background.
- **DATABASE**: Bancos de dados gerenciados (Postgres, Redis, Mongo).

## 2. Modelo de Dados

```prisma
model Project {
  id          String        @id @default(cuid())
  name        String
  slug        String
  description String?
  type        ProjectType   @default(WEB)
  status      ProjectStatus @default(STOPPED)
  
  // Docker config
  dockerImage String?
  dockerTag   String?       @default("latest")
  dockerfile  String?
  buildContext String?      @default(".")
  
  // Git config
  gitProvider String?       // github, gitlab, bitbucket
  gitUrl      String?
  gitBranch   String?       @default("main")
  gitAutoDeployEnabled Boolean @default(false)
  
  // Resources
  replicas    Int           @default(1)
  cpuLimit    String?       @default("1000m")
  memoryLimit String?       @default("512Mi")

  // Relations
  ownerId     String
  teamId      String?
  envVars     EnvVar[]
  domains     Domain[]
  deployments Deployment[]
}
```

## 3. Funcionalidades (User Stories)

| ID              | História          | Status   | Descrição                                                 |
| --------------- | ----------------- | -------- | --------------------------------------------------------- |
| **US-PROJ-001** | **Criar Projeto** | ✅ Pronto | Criar projeto definindo nome, tipo e origem (Git/Docker). |
| **US-PROJ-002** | **Env Vars**      | ✅ Pronto | Gerenciar variáveis de ambiente (com suporte a secrets).  |
| **US-PROJ-003** | **Deploy**        | ✅ Pronto | Disparar deploy manual ou automático via Git Webhook.     |
| **US-PROJ-004** | **Recursos**      | ✅ Pronto | Definir limites de CPU e RAM.                             |
| **US-PROJ-005** | **Domínios**      | ✅ Pronto | Associar domínios customizados com SSL automático.        |

## 4. Implementação Técnica

### Serviços
- `ProjectService`: Gerencia CRUD e configurações.
- `DeployService`: Orquestra o build e deploy.

### Endpoints
- `GET /api/projects`: Listar projetos.
- `POST /api/projects`: Criar projeto.
- `GET /api/projects/:id`: Detalhes.
- `PATCH /api/projects/:id`: Atualizar configurações.
- `POST /api/projects/:id/deploy`: Forçar deploy.

### Integração Docker
Cada projeto resulta em um ou mais containers Docker. O OpenPanel gerencia o ciclo de vida desses containers, incluindo redes e volumes.
