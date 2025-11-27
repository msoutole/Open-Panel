# Domain: Containers & Deployments

> **Single-File Context**: Docker container management, builds, deployment pipeline e orquestração completa.

---

## 1. Overview

**O que é?** Orquestração de containers Docker, builds de imagens, deployment pipeline e gerenciamento de ciclo de vida.

**Componentes**:
- **Containers**: Instâncias Docker rodando
- **Builds**: Processo de build de imagens
- **Deployments**: Histórico de deploys

**Relacionamentos**:
- Depende de: Projects (owner), Docker daemon
- Usado por: Networking (domains), Monitoring (logs)

---

## 2. Data Models

`prisma
enum ContainerStatus {
  RUNNING
  STOPPED
  RESTARTING
  PAUSED
  EXITED
  DEAD
}

enum DeploymentStatus {
  PENDING    // Na fila
  BUILDING   // Buildando imagem
  DEPLOYING  // Deploy em andamento
  SUCCESS    // Deploy concluído
  FAILED     // Deploy falhou
}

model Container {
  id          String          @id @default(cuid())
  name        String          @unique
  dockerId    String?         @unique  // Container ID do Docker
  image       String          // ex: "node:20-alpine"
  tag         String          @default("latest")
  status      ContainerStatus @default(STOPPED)

  // Resource limits
  cpuLimit    Float?          // CPUs (ex: 0.5)
  memoryLimit Int?            // MB (ex: 512)

  // Network
  ports       Json?           // [{"host": 3000, "container": 3000}]
  networks    String[]

  // Volume mounts
  volumes     Json?           // [{"host": "/data", "container": "/app/data"}]

  // Project relation
  projectId   String
  project     Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Metadata
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  startedAt   DateTime?
  stoppedAt   DateTime?

  @@index([projectId])
  @@index([dockerId])
  @@map("containers")
}

model Deployment {
  id          String           @id @default(cuid())
  version     String           // ex: "v1.2.3" ou git SHA
  status      DeploymentStatus @default(PENDING)
  buildLogs   String?          @db.Text
  errorMsg    String?

  // Git info
  commitSha   String?
  commitMsg   String?
  branch      String?

  // Build duration
  startedAt   DateTime?
  completedAt DateTime?

  // Project relation
  projectId   String
  project     Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Triggered by
  userId      String?
  user        User?            @relation(fields: [userId], references: [id])

  createdAt   DateTime         @default(now())

  @@index([projectId])
  @@index([status])
  @@map("deployments")
}
`

---

## 3. Business Rules

### BR-CONT-001: One Active Container per Project
- Projeto pode ter apenas 1 container RUNNING por vez
- Deploy novo para (gracefully) container antigo

### BR-CONT-002: Resource Limits
- Default: 1 CPU, 512MB RAM
- Limites configuráveis por projeto
- Swap > Memory (regra Docker)

### BR-CONT-003: Port Binding
- Porta host deve ser única no servidor
- Validation antes de criar container

### BR-CONT-004: Auto-restart on Failure
- Container com restart policy `unless-stopped`
- Máximo 3 restarts em 1 minuto

---

## 4. API Endpoints

### GET /api/containers
Lista containers do usuário

### POST /api/containers
Cria novo container

**Request**:
`json
{
  "projectId": "clx...",
  "image": "node:20",
  "tag": "alpine",
  "ports": [{"host": 3000, "container": 3000}],
  "envVars": {"PORT": "3000"},
  "cpuLimit": 1,
  "memoryLimit": 512
}
`

### POST /api/containers/:id/start
Inicia container parado

### POST /api/containers/:id/stop
Para container rodando

### POST /api/containers/:id/restart
Reinicia container

### DELETE /api/containers/:id
Remove container

### GET /api/containers/:id/logs
Stream de logs do container (WebSocket)

### POST /api/builds
Triggera novo build

**Request**:
`json
{
  "projectId": "clx...",
  "branch": "main",
  "commitSha": "abc123"
}
`

### GET /api/deployments
Lista histórico de deployments

### GET /api/deployments/:id
Detalhes de deployment específico

---

## 5. Implementation

### Container Service (`apps/api/src/services/docker.service.ts`)

`typescript
import Docker from 'dockerode'
import { prisma } from '../lib/prisma'

export class DockerService {
  private docker: Docker

  constructor() {
    this.docker = new Docker({
      socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock'
    })
  }

  async createContainer(options: CreateContainerOptions) {
    const { projectId, image, tag, ports, envVars } = options

    // Create Docker container
    const container = await this.docker.createContainer({
      Image: `${image}:${tag}`,
      name: `openpanel-${projectId}`,
      Env: Object.entries(envVars || {}).map(([k, v]) => `${k}=${v}`),
      HostConfig: {
        PortBindings: this.buildPortBindings(ports),
        RestartPolicy: { Name: 'unless-stopped', MaximumRetryCount: 3 }
      }
    })

    // Save to database
    const dbContainer = await prisma.container.create({
      data: {
        name: `openpanel-${projectId}`,
        dockerId: container.id,
        image,
        tag,
        status: 'STOPPED',
        ports,
        projectId
      }
    })

    return { container, dbContainer }
  }

  async startContainer(containerId: string) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer?.dockerId) {
      throw new Error('Container not found')
    }

    const container = this.docker.getContainer(dbContainer.dockerId)
    await container.start()

    await prisma.container.update({
      where: { id: containerId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    })
  }

  async stopContainer(containerId: string) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    const container = this.docker.getContainer(dbContainer.dockerId)
    await container.stop()

    await prisma.container.update({
      where: { id: containerId },
      data: {
        status: 'STOPPED',
        stoppedAt: new Date()
      }
    })
  }

  async getLogs(containerId: string, stream = false) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    const container = this.docker.getContainer(dbContainer.dockerId)

    if (stream) {
      return container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 100
      })
    }

    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 1000
    })

    return logs.toString()
  }

  private buildPortBindings(ports: Array<{ host: number; container: number }>) {
    const bindings = {}
    ports?.forEach(({ host, container }) => {
      bindings[`${container}/tcp`] = [{ HostPort: String(host) }]
    })
    return bindings
  }
}
`

### Build Queue (`apps/api/src/queues/build.queue.ts`)

`typescript
import { Queue, Worker } from 'bullmq'
import { redis } from '../lib/redis'
import { DockerService } from '../services/docker.service'
import { prisma } from '../lib/prisma'

const buildQueue = new Queue('builds', { connection: redis })

const buildWorker = new Worker('builds', async (job) => {
  const { deploymentId, projectId, repoUrl, branch } = job.data
  const docker = new DockerService()

  try {
    // Update deployment status
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'BUILDING',
        startedAt: new Date()
      }
    })

    // Clone repo
    const repoPath = `/tmp/builds/${deploymentId}`
    await exec(`git clone ${repoUrl} ${repoPath}`)
    await exec(`cd ${repoPath} && git checkout ${branch}`)

    // Build Docker image
    const imageName = `openpanel/${projectId}:${deploymentId}`
    await docker.buildImage({
      context: repoPath,
      src: ['Dockerfile'],
      t: imageName
    })

    // Update deployment
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'DEPLOYING'
      }
    })

    // Create and start container
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    await docker.createContainer({
      projectId,
      image: imageName,
      tag: 'latest',
      ports: project.ports,
      envVars: project.envVars
    })

    await docker.startContainer(/* ... */)

    // Success!
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'SUCCESS',
        completedAt: new Date()
      }
    })
  } catch (error) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'FAILED',
        errorMsg: error.message,
        completedAt: new Date()
      }
    })
  }
}, { connection: redis })

export { buildQueue, buildWorker }
`

### WebSocket Logs Gateway (`apps/api/src/websocket/container-logs.ts`)

`typescript
import { WebSocketServer } from 'ws'
import { verifyToken } from '../lib/jwt'
import { DockerService } from '../services/docker.service'

const wss = new WebSocketServer({ port: 8001 })
const docker = new DockerService()

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, 'ws://localhost')
  const token = url.searchParams.get('token')
  const containerId = url.searchParams.get('containerId')

  try {
    // Authenticate
    const user = verifyToken(token)

    // Get log stream
    const logStream = await docker.getLogs(containerId, true)

    logStream.on('data', (chunk) => {
      ws.send(chunk.toString())
    })

    ws.on('close', () => {
      logStream.destroy()
    })
  } catch (error) {
    ws.send(JSON.stringify({ error: error.message }))
    ws.close()
  }
})
`

---

## 6. Future Enhancements

- [ ] Multi-container deploys (Docker Compose support)
- [ ] Blue-green deployments
- [ ] Rollback automático on failure
- [ ] Container health checks
- [ ] Resource usage metrics
- [ ] Auto-scaling baseado em carga

---

**Última Atualização**: 2025-11-26
**Status**: ✅ Implementado (90%)

