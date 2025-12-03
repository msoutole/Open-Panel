import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../../middlewares/auth'
import { buildService } from '../../services/build'
import { gitService } from '../../services/git'
import { dockerService } from '../../services/docker'
import * as jwt from '../../lib/jwt'

// Mock dependencies
vi.mock('../../lib/jwt')
vi.mock('../../services/build')
vi.mock('../../services/git')
vi.mock('../../services/docker')
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    deployment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    container: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../../lib/prisma'

describe('Deployment Integration Tests', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()

    // Mock JWT verification
    vi.mocked(jwt.verifyToken).mockReturnValue({
      userId: 'user-1',
      email: 'test@test.com',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete deployment flow', () => {
    it('should deploy a project from Git repository', async () => {
      // Setup mocks
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        slug: 'test-project',
        ownerId: 'user-1',
        gitUrl: 'https://github.com/test/repo.git',
        gitBranch: 'main',
        envVars: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'PORT', value: '3000' },
        ],
      }

      const mockDeployment = {
        id: 'deployment-1',
        projectId: 'project-1',
        version: 'v1234567890',
        status: 'PENDING',
        createdAt: new Date(),
      }

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeployment as any)

      vi.mocked(gitService.clone).mockResolvedValue('/tmp/repo-123')
      vi.mocked(gitService.getCommitInfo).mockResolvedValue({
        hash: 'abc123',
        message: 'feat: add feature',
        author: 'John Doe',
        date: '2024-01-01',
      })

      vi.mocked(buildService.build).mockResolvedValue({
        success: true,
        imageId: 'sha256:abc123',
        imageTag: 'test-project:latest',
        logs: 'Build successful',
        duration: 30000,
      })

      vi.mocked(dockerService.createContainer).mockResolvedValue({
        id: 'container-1',
        dockerId: 'docker-123',
        name: 'test-project-123',
      } as any)

      vi.mocked(dockerService.startContainer).mockResolvedValue(undefined)

      // Setup route
      app.use('*', authMiddleware)
      app.post('/projects/:id/deploy', async (c) => {
        const projectId = c.req.param('id')
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { envVars: true },
        })

        if (!project) {
          return c.json({ error: 'Project not found' }, 404)
        }

        // Create deployment
        const deployment = await prisma.deployment.create({
          data: {
            projectId: project.id,
            version: `v${Date.now()}`,
            status: 'PENDING',
          },
        })

        // Clone repository
        const repoPath = await gitService.clone({
          url: project.gitUrl,
          branch: project.gitBranch || 'main',
        })

        const commitInfo = await gitService.getCommitInfo(repoPath)

        // Build image
        const buildResult = await buildService.build({
          projectId: project.id,
          source: 'dockerfile',
          context: repoPath,
          gitCommitHash: commitInfo.hash,
        })

        if (!buildResult.success) {
          return c.json({ error: 'Build failed', logs: buildResult.logs }, 500)
        }

        // Create and start container
        const imageTag = buildResult.imageTag ?? `${project.slug}:latest`
        const container = await dockerService.createContainer({
          name: `${project.slug}-${Date.now()}`,
          image: imageTag,
          tag: 'latest',
          projectId: project.id,
          env: project.envVars.reduce(
            (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
            {}
          ),
        })

        await dockerService.startContainer(container.dockerId)

        await prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: 'SUCCESS' },
        })

        return c.json({
          deployment: {
            ...deployment,
            status: 'SUCCESS',
          },
          container,
        })
      })

      // Execute request
      const res = await app.request('/projects/project-1/deploy', {
        method: 'POST',
        headers: { Authorization: 'Bearer validtoken' },
      })

      // Assertions
      expect(res.status).toBe(200)

      const json = (await res.json()) as {
        deployment: { status: string }
        container: unknown
      }
      expect(json.deployment.status).toBe('SUCCESS')
      expect(json.container).toBeDefined()

      // Verify service calls
      expect(gitService.clone).toHaveBeenCalled()
      expect(gitService.getCommitInfo).toHaveBeenCalled()
      expect(buildService.build).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'dockerfile',
          projectId: 'project-1',
        })
      )
      expect(dockerService.createContainer).toHaveBeenCalled()
      expect(dockerService.startContainer).toHaveBeenCalled()
    })

    it('should handle build failures gracefully', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        slug: 'test-project',
        ownerId: 'user-1',
        gitUrl: 'https://github.com/test/repo.git',
        gitBranch: 'main',
        envVars: [],
      }

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)
      vi.mocked(prisma.deployment.create).mockResolvedValue({
        id: 'deployment-1',
        projectId: 'project-1',
        version: 'v123',
        status: 'PENDING',
      } as any)

      vi.mocked(gitService.clone).mockResolvedValue('/tmp/repo-123')
      vi.mocked(gitService.getCommitInfo).mockResolvedValue({
        hash: 'abc123',
        message: 'test',
        author: 'John',
        date: '2024-01-01',
      })

      // Simulate build failure
      vi.mocked(buildService.build).mockResolvedValue({
        success: false,
        logs: 'Error: Dockerfile not found',
        duration: 1000,
        error: 'Dockerfile not found',
      })

      app.use('*', authMiddleware)
      app.post('/projects/:id/deploy', async (c) => {
        const projectId = c.req.param('id')
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { envVars: true },
        })

        if (!project) {
          return c.json({ error: 'Project not found' }, 404)
        }

        await prisma.deployment.create({
          data: {
            projectId: project.id,
            version: `v${Date.now()}`,
            status: 'PENDING',
          },
        })

        const repoPath = await gitService.clone({
          url: project.gitUrl,
          branch: project.gitBranch || 'main',
        })

        const commitInfo = await gitService.getCommitInfo(repoPath)

        const buildResult = await buildService.build({
          projectId: project.id,
          source: 'dockerfile',
          context: repoPath,
          gitCommitHash: commitInfo.hash,
        })

        if (!buildResult.success) {
          return c.json({ error: 'Build failed', logs: buildResult.logs }, 500)
        }

        return c.json({ success: true })
      })

      const res = await app.request('/projects/project-1/deploy', {
        method: 'POST',
        headers: { Authorization: 'Bearer validtoken' },
      })

      expect(res.status).toBe(500)

      const json = (await res.json()) as { error: string; logs: string }
      expect(json.error).toBe('Build failed')
      expect(json.logs).toContain('Dockerfile not found')
    })

    it('should rollback deployment to previous version', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        ownerId: 'user-1',
      }

      const mockDeployments = [
        {
          id: 'deployment-2',
          projectId: 'project-1',
          version: 'v2',
          status: 'SUCCESS',
          imageTag: 'test-project:v2',
        },
        {
          id: 'deployment-1',
          projectId: 'project-1',
          version: 'v1',
          status: 'SUCCESS',
          imageTag: 'test-project:v1',
        },
      ]

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)
      vi.mocked(prisma.deployment.findMany).mockResolvedValue(mockDeployments as any)
      vi.mocked(prisma.deployment.create).mockResolvedValue({
        id: 'deployment-rollback',
        version: 'v1-rollback',
        status: 'SUCCESS',
      } as any)

      vi.mocked(prisma.container.findMany).mockResolvedValue([
        {
          id: 'container-old',
          dockerId: 'docker-old',
          projectId: 'project-1',
        },
      ] as any)

      vi.mocked(dockerService.stopContainer).mockResolvedValue(undefined)
      vi.mocked(dockerService.removeContainer).mockResolvedValue(undefined)
      vi.mocked(dockerService.createContainer).mockResolvedValue({
        id: 'container-rollback',
        dockerId: 'docker-rollback',
      } as any)
      vi.mocked(dockerService.startContainer).mockResolvedValue(undefined)

      app.use('*', authMiddleware)
      app.post('/projects/:id/rollback', async (c) => {
        const projectId = c.req.param('id')

        const project = await prisma.project.findUnique({
          where: { id: projectId },
        })

        if (!project) {
          return c.json({ error: 'Project not found' }, 404)
        }

        // Get previous successful deployment
        const deployments = await prisma.deployment.findMany({
          where: { projectId, status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 2,
        })

        const previousDeployment = deployments[1]
        if (!previousDeployment) {
          return c.json({ error: 'No previous deployment found' }, 404)
        }

        if (!previousDeployment) {
          return c.json({ error: 'No previous deployment found' }, 404)
        }

        // Stop current containers
        const currentContainers = await prisma.container.findMany({
          where: { projectId },
        })

        for (const container of currentContainers) {
          await dockerService.stopContainer(container.dockerId)
          await dockerService.removeContainer(container.dockerId)
        }

        // Start container with previous image
        const imageTag = previousDeployment.imageTag ?? 'latest'
        const container = await dockerService.createContainer({
          name: `${projectId}-rollback`,
          image: imageTag,
          tag: 'latest',
          projectId,
        })

        await dockerService.startContainer(container.dockerId)

        const rollbackDeployment = await prisma.deployment.create({
          data: {
            projectId,
            version: `${previousDeployment.version}-rollback`,
            status: 'SUCCESS',
          },
        })

        return c.json({
          deployment: rollbackDeployment,
          rolledBackTo: previousDeployment.version,
        })
      })

      const res = await app.request('/projects/project-1/rollback', {
        method: 'POST',
        headers: { Authorization: 'Bearer validtoken' },
      })

      expect(res.status).toBe(200)

      const json = (await res.json()) as { rolledBackTo: string }
      expect(json.rolledBackTo).toBe('v1')
      expect(dockerService.stopContainer).toHaveBeenCalled()
      expect(dockerService.createContainer).toHaveBeenCalled()
    })
  })

  describe('Webhook-triggered deployment', () => {
    it('should trigger deployment on GitHub webhook', async () => {
      const webhookPayload = {
        ref: 'refs/heads/main',
        repository: {
          clone_url: 'https://github.com/test/repo.git',
          full_name: 'test/repo',
        },
        commits: [
          {
            id: 'abc123',
            message: 'feat: new feature',
            author: { name: 'John', email: 'john@example.com' },
            timestamp: '2024-01-01T12:00:00Z',
          },
        ],
        pusher: { name: 'John', email: 'john@example.com' },
      }

      const mockProjects = [
        {
          id: 'project-1',
          gitUrl: 'https://github.com/test/repo.git',
          gitBranch: 'main',
          gitAutoDeployEnabled: true,
        },
      ]

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as any)
      vi.mocked(prisma.deployment.create).mockResolvedValue({
        id: 'deployment-webhook',
        projectId: 'project-1',
        version: 'v123',
        status: 'PENDING',
      } as any)

      app.post('/webhooks/github', async (c) => {
        const payload = await c.req.json()

        const parsedPayload = gitService.parseGitHubWebhook(payload)

        if (!parsedPayload) {
          return c.json({ error: 'Invalid webhook payload' }, 400)
        }

        const result = await gitService.handleWebhookEvent(parsedPayload)

        return c.json(result)
      })

      vi.mocked(gitService.parseGitHubWebhook).mockReturnValue({
        repository: {
          url: 'https://github.com/test/repo.git',
          fullName: 'test/repo',
        },
        ref: 'refs/heads/main',
        commits: webhookPayload.commits,
        pusher: webhookPayload.pusher,
      })

      vi.mocked(gitService.handleWebhookEvent).mockResolvedValue({
        triggered: 1,
        deployments: [{ id: 'deployment-webhook' }],
      })

      const res = await app.request('/webhooks/github', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      })

      expect(res.status).toBe(200)

      const json = (await res.json()) as { triggered: number }
      expect(json.triggered).toBe(1)
      expect(gitService.handleWebhookEvent).toHaveBeenCalled()
    })
  })
})
