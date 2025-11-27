# Domain: Projects & Teams

> **Single-File Context**: Este arquivo contém TUDO sobre gerenciamento de projetos e colaboração em times no OpenPanel.

---

## 1. Overview

### O que é?
Sistema de gerenciamento de projetos (aplicações containerizadas) com suporte a colaboração via times/equipes com controle de permissões.

### Por que existe?
Permite organizar aplicações em projetos isolados, compartilhar acesso entre membros de equipes, e gerenciar permissões granulares.

### Relacionamentos
- **Depende de**: Authentication (users), Containers (deployment)
- **Usado por**: Containers, Domains, Backups
- **Integra com**: Docker (orquestração), Git (source code)

---

## 2. Business Context

### Problema
- **Organização**: Múltiplas aplicações precisam ser agrupadas logicamente
- **Colaboração**: Times precisam trabalhar juntos em projetos
- **Isolamento**: Recursos de um projeto não devem ser acessíveis a outros
- **Permissões**: Diferentes níveis de acesso (owner, admin, member, viewer)

### Solução
- **Projects**: Agrupador lógico de containers, domains, backups
- **Teams**: Grupos de usuários com acesso compartilhado
- **TeamMembers**: Associação user↔team com role específico
- **Project Ownership**: Projeto pertence a user OU team

---

## 3. Data Models

`prisma
enum ProjectStatus {
  ACTIVE      // Projeto rodando
  PAUSED      // Temporariamente pausado
  ERROR       // Erro na última implantação
  DEPLOYING   // Deploy em andamento
  STOPPED     // Parado manualmente
}

enum ProjectType {
  WEB         // Aplicação web (HTTP)
  API         // API backend
  WORKER      // Worker/background jobs
  CRON        // Cronjobs agendados
  DATABASE    // Banco de dados
  REDIS       // Redis cache
  MONGODB     // MongoDB
}

model Project {
  id          String        @id @default(cuid())
  name        String
  slug        String        // URL-friendly name
  description String?
  type        ProjectType   @default(WEB)
  status      ProjectStatus @default(STOPPED)

  // Docker configuration
  dockerImage String?       // ex: "node:20-alpine"
  dockerTag   String?       @default("latest")
  buildPath   String?       // Path no repo para Dockerfile
  command     String?       // Override do CMD
  envVars     Json?         // Environment variables { "PORT": "3000" }

  // Git source
  repoUrl     String?       // GitHub repo URL
  branch      String?       @default("main")
  autoDepl oy Boolean       @default(false)  // Auto-deploy on git push

  // Ownership (OR exclusivo)
  ownerId     String?
  owner       User?         @relation("ProjectOwner", fields: [ownerId], references: [id])
  teamId      String?
  team        Team?         @relation(fields: [teamId], references: [id])

  // Relations
  containers  Container[]
  deployments Deployment[]
  domains     Domain[]
  backups     Backup[]

  // Metadata
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([slug, ownerId])
  @@unique([slug, teamId])
  @@index([ownerId])
  @@index([teamId])
  @@map("projects")
}

model Team {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  description String?
  avatar      String?

  // Relations
  members     TeamMember[]
  projects    Project[]
  invites     TeamInvite[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([slug])
  @@map("teams")
}

model TeamMember {
  id        String      @id @default(cuid())
  role      UserRole    @default(MEMBER)

  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  teamId    String
  team      Team        @relation(fields: [teamId], references: [id], onDelete: Cascade)

  joinedAt  DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@unique([userId, teamId])
  @@index([userId])
  @@index([teamId])
  @@map("team_members")
}

model TeamInvite {
  id        String   @id @default(cuid())
  email     String
  role      UserRole @default(MEMBER)
  token     String   @unique
  expiresAt DateTime

  teamId    String
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
  @@map("team_invites")
}
`

---

## 4. Business Rules

### BR-PROJ-001: Unique Slug per Owner/Team
- Slug deve ser único dentro do contexto do owner OU team
- Permite "my-app" em diferentes teams sem conflito

### BR-PROJ-002: Ownership Exclusivity
- Projeto pertence a User XOR Team (não ambos)
- `ownerId` OU `teamId` preenchido, nunca os dois

### BR-PROJ-003: Team Member Permissions
- **OWNER**: Pode deletar team, adicionar/remover membros
- **ADMIN**: Pode criar projetos, editar configurações
- **MEMBER**: Pode deployar, ver logs
- **VIEWER**: Apenas visualização

### BR-PROJ-004: Project Deletion Cascade
- Deletar projeto remove: containers, deployments, domains, backups
- Usuário deve confirmar ação (danger zone)

---

## 5. API Endpoints

### GET /api/projects
Lista projetos do usuário (owned + teams)

**Response**:
`json
{
  "projects": [
    {
      "id": "clx...",
      "name": "My API",
      "slug": "my-api",
      "type": "API",
      "status": "ACTIVE",
      "team": { "id": "...", "name": "Acme Inc" },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
`

### POST /api/projects
Cria novo projeto

**Request**:
`json
{
  "name": "My App",
  "slug": "my-app",
  "type": "WEB",
  "dockerImage": "node:20",
  "teamId": "clx..." // Opcional (se omitido, ownerId = current user)
}
`

### PUT /api/projects/:projectId
Atualiza configuração do projeto

### DELETE /api/projects/:projectId
Deleta projeto (danger zone)

### GET /api/teams
Lista times do usuário

### POST /api/teams
Cria novo time

### POST /api/teams/:teamId/members
Adiciona membro ao time

### POST /api/teams/:teamId/invite
Envia convite por email

### POST /api/teams/accept-invite/:token
Aceita convite de time

---

## 6. Implementation

### Key Routes

**`apps/api/src/routes/projects.ts`**
`typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma'
import { createProjectSchema, updateProjectSchema } from '@openpanel/shared'

const projects = new Hono()

// GET / - Lista projetos do usuário (owned + teams)
projects.get('/', async (c) => {
  const user = c.get('user')

  const [ownedProjects, teamProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.userId },
      include: { team: true }
    }),
    prisma.project.findMany({
      where: {
        team: {
          members: {
            some: { userId: user.userId }
          }
        }
      },
      include: { team: true }
    })
  ])

  return c.json({
    projects: [...ownedProjects, ...teamProjects]
  })
})

// POST / - Criar projeto
projects.post('/', zValidator('json', createProjectSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  const project = await prisma.project.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type,
      dockerImage: data.dockerImage,
      ownerId: data.teamId ? undefined : user.userId,
      teamId: data.teamId
    }
  })

  return c.json({ project }, 201)
})

export default projects
`

**`apps/api/src/routes/teams.ts`**
`typescript
import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { createTeamSchema } from '@openpanel/shared'

const teams = new Hono()

// GET / - Lista times do usuário
teams.get('/', async (c) => {
  const user = c.get('user')

  const userTeams = await prisma.team.findMany({
    where: {
      members: {
        some: { userId: user.userId }
      }
    },
    include: {
      members: {
        include: { user: true }
      },
      projects: true
    }
  })

  return c.json({ teams: userTeams })
})

// POST / - Criar time
teams.post('/', zValidator('json', createTeamSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  const team = await prisma.team.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      members: {
        create: {
          userId: user.userId,
          role: 'OWNER'  // Criador é sempre OWNER
        }
      }
    }
  })

  return c.json({ team }, 201)
})

// POST /:teamId/members - Adicionar membro
teams.post('/:teamId/members', async (c) => {
  const { teamId } = c.req.param()
  const { userId, role } = await c.req.json()

  // TODO: Validar se current user é OWNER/ADMIN do team

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId,
      role
    }
  })

  return c.json({ member }, 201)
})

export default teams
`

---

## 7. Future Enhancements

### Curto Prazo
- [ ] Project templates (boilerplates rápidos)
- [ ] Transfer project ownership
- [ ] Duplicate project

### Médio Prazo
- [ ] Team billing (usage por team)
- [ ] Team-wide environment variables
- [ ] Project groups/folders

### Longo Prazo
- [ ] Cross-team project sharing
- [ ] Marketplace de templates

---

**Última Atualização**: 2025-11-26
**Status**: ✅ Implementado (85% - faltam invites e RBAC)

