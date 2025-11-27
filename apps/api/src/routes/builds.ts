import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { buildService } from '../services/build'
import { gitService } from '../services/git'
import { dockerService } from '../services/docker'
import { prisma } from '../lib/prisma'
import { logger, logError, logInfo, logWarn } from '../lib/logger'
import type { Variables } from '../types'

const builds = new Hono<{ Variables: Variables }>()

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createBuildSchema = z.object({
  projectId: z.string().min(1),
  source: z.enum(['dockerfile', 'nixpacks', 'paketo', 'heroku', 'image']),
  context: z.string().optional(),
  dockerfile: z.string().optional().default('Dockerfile'),
  image: z.string().optional(),
  tag: z.string().optional(),
  buildArgs: z.record(z.string(), z.string()).optional(),
  envVars: z.record(z.string(), z.string()).optional(),
  gitUrl: z.string().optional(),
  gitBranch: z.string().optional(),
  gitCommitHash: z.string().optional(),
})

const detectProjectTypeSchema = z.object({
  context: z.string().min(1),
})

// ============================================
// BUILD ROUTES
// ============================================

/**
 * POST /builds
 * Create a new build/deployment
 */
builds.post('/', zValidator('json', createBuildSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const data = c.req.valid('json')

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        ownerId: (user as any).id,
      },
    })

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // If Git URL is provided, clone repo first
    let buildContext = data.context
    if (data.gitUrl && !buildContext) {
      logInfo('Cloning repository', { gitUrl: data.gitUrl, userId: (user as any).id })
      buildContext = await gitService.clone({
        url: data.gitUrl,
        branch: data.gitBranch || 'main',
        depth: 1,
      })
    }

    if (!buildContext) {
      return c.json({ error: 'Build context or Git URL is required' }, 400)
    }

    // Create deployment
    const deployment = await buildService.createDeployment({
      ...data,
      context: buildContext,
    })

    return c.json(
      {
        message: 'Build started',
        deployment,
      },
      201
    )
  } catch (error: any) {
    logError('Error creating build', error, { userId: c.get('user')?.id })
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /builds/:id
 * Get build/deployment details
 */
builds.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    const deployment = await prisma.deployment.findFirst({
      where: {
        id,
        project: {
          ownerId: (user as any).id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!deployment) {
      return c.json({ error: 'Deployment not found' }, 404)
    }

    return c.json({ deployment })
  } catch (error: any) {
    logError('Error getting deployment', error, { deploymentId: c.req.param('id'), userId: c.get('user')?.id })
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /builds/project/:projectId
 * List all builds/deployments for a project
 */
builds.get('/project/:projectId', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { projectId } = c.req.param()
    const limit = parseInt(c.req.query('limit') || '50')

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: (user as any).id,
      },
    })

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    const deployments = await prisma.deployment.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return c.json({
      deployments,
      total: deployments.length,
    })
  } catch (error: any) {
    logError('Error listing deployments', error, { projectId: c.req.param('projectId'), userId: c.get('user')?.id })
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /builds/:id/rollback
 * Rollback to a previous deployment
 */
builds.post('/:id/rollback', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    const deployment = await prisma.deployment.findFirst({
      where: {
        id,
        project: {
          ownerId: (user as any).id,
        },
      },
      include: {
        project: {
          include: {
            envVars: true,
          },
        },
      },
    })

    if (!deployment) {
      return c.json({ error: 'Deployment not found' }, 404)
    }

    if (deployment.status !== 'SUCCESS') {
      return c.json({ error: 'Can only rollback to successful deployments' }, 400)
    }

    // Implement rollback logic
    logInfo('Initiating rollback', { deploymentId: deployment.id, projectId: deployment.projectId, userId: (user as any).id })

    // Create new deployment with rollback flag
    const newDeployment = await prisma.deployment.create({
      data: {
        projectId: deployment.projectId,
        version: `rollback-${deployment.version}`,
        gitCommitHash: deployment.gitCommitHash,
        gitCommitMessage: `[ROLLBACK] ${deployment.gitCommitMessage}`,
        status: 'BUILDING',
      },
    })

    // Trigger rebuild using buildService
    try {
      // Stop current containers
      const currentContainers = await prisma.container.findMany({
        where: { projectId: deployment.projectId },
      })

      for (const container of currentContainers) {
        try {
          await dockerService.stopContainer(container.dockerId, 30)
          await dockerService.removeContainer(container.dockerId, true)
        } catch (error: any) {
          logWarn('Failed to remove container during rollback', { containerId: container.dockerId, error: error.message })
        }
      }

      // Redeploy using the same image/configuration from the successful deployment
      // This assumes the Docker image is still available
      const imageName = `${deployment.project.slug}`
      const imageTag = deployment.version

      const containerName = `${deployment.project.slug}-${Date.now()}`

      const envVars = deployment.project.envVars.reduce((acc: Record<string, string>, curr: typeof deployment.project.envVars[0]) => ({
        ...acc,
        [curr.key]: curr.value
      }), {} as Record<string, string>)

      const newContainer = await dockerService.createContainer({
        name: containerName,
        image: imageName,
        tag: imageTag,
        projectId: deployment.projectId,
        env: envVars,
      })

      await dockerService.startContainer(newContainer.dockerId)

      // Update deployment as successful
      await prisma.deployment.update({
        where: { id: newDeployment.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
        },
      })

      logInfo('Rollback completed successfully', { deploymentId: deployment.id, newDeploymentId: newDeployment.id })

      return c.json({
        message: 'Rollback completed successfully',
        deployment: newDeployment,
      })
    } catch (error: any) {
      // Mark rollback deployment as failed
      await prisma.deployment.update({
        where: { id: newDeployment.id },
        data: {
          status: 'FAILED',
          buildLogs: `Rollback failed: ${error.message}`,
          completedAt: new Date(),
        },
      })

      throw error
    }
  } catch (error: any) {
    logError('Error rolling back deployment', error, { deploymentId: c.req.param('id'), userId: c.get('user')?.id })
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /builds/detect
 * Auto-detect project type from context
 */
builds.post('/detect', zValidator('json', detectProjectTypeSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { context } = c.req.valid('json')

    const detection = await buildService.detectProjectType(context)

    return c.json({
      type: detection.type,
      buildpack: detection.buildpack,
      recommendations: {
        dockerfile: detection.buildpack === 'dockerfile',
        nixpacks: detection.buildpack === 'nixpacks',
        paketo: detection.buildpack === 'paketo',
      },
    })
  } catch (error: any) {
    logError('Error detecting project type', error, { userId: c.get('user')?.id })
    return c.json({ error: error.message }, 500)
  }
})

// ============================================
// WEBHOOK ROUTES
// ============================================

/**
 * POST /webhooks/github
 * Handle GitHub push webhooks
 */
builds.post('/webhooks/github', async (c) => {
  try {
    const signature = c.req.header('X-Hub-Signature-256') || ''
    const event = c.req.header('X-GitHub-Event')

    // Only handle push events
    if (event !== 'push') {
      return c.json({ message: 'Event type not supported' }, 200)
    }

    const payload = await c.req.json()

    // Verify signature (optional but recommended)
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (secret) {
      const body = JSON.stringify(payload)
      const isValid = gitService.verifyGitHubSignature(body, signature, secret)
      if (!isValid) {
        return c.json({ error: 'Invalid signature' }, 401)
      }
    }

    // Parse webhook
    const webhookData = gitService.parseGitHubWebhook(payload)
    if (!webhookData) {
      return c.json({ error: 'Invalid webhook payload' }, 400)
    }

    // Handle webhook and trigger deployments
    const result = await gitService.handleWebhookEvent(webhookData)

    return c.json({
      message: `Triggered ${result.triggered} deployment(s)`,
      ...result,
    })
  } catch (error: any) {
    logError('Error handling GitHub webhook', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /webhooks/gitlab
 * Handle GitLab push webhooks
 */
builds.post('/webhooks/gitlab', async (c) => {
  try {
    const token = c.req.header('X-Gitlab-Token') || ''
    const event = c.req.header('X-Gitlab-Event')

    // Only handle push events
    if (event !== 'Push Hook') {
      return c.json({ message: 'Event type not supported' }, 200)
    }

    const payload = await c.req.json()

    // Verify token (optional but recommended)
    const secret = process.env.GITLAB_WEBHOOK_SECRET
    if (secret) {
      const isValid = gitService.verifyGitLabSignature(token, secret)
      if (!isValid) {
        return c.json({ error: 'Invalid token' }, 401)
      }
    }

    // Parse webhook
    const webhookData = gitService.parseGitLabWebhook(payload)
    if (!webhookData) {
      return c.json({ error: 'Invalid webhook payload' }, 400)
    }

    // Handle webhook and trigger deployments
    const result = await gitService.handleWebhookEvent(webhookData)

    return c.json({
      message: `Triggered ${result.triggered} deployment(s)`,
      ...result,
    })
  } catch (error: any) {
    logError('Error handling GitLab webhook', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /webhooks/bitbucket
 * Handle Bitbucket push webhooks
 */
builds.post('/webhooks/bitbucket', async (c) => {
  try {
    const event = c.req.header('X-Event-Key')

    // Only handle push events
    if (event !== 'repo:push') {
      return c.json({ message: 'Event type not supported' }, 200)
    }

    const payload = await c.req.json()

    // Parse webhook
    const webhookData = gitService.parseBitbucketWebhook(payload)
    if (!webhookData) {
      return c.json({ error: 'Invalid webhook payload' }, 400)
    }

    // Handle webhook and trigger deployments
    const result = await gitService.handleWebhookEvent(webhookData)

    return c.json({
      message: `Triggered ${result.triggered} deployment(s)`,
      ...result,
    })
  } catch (error: any) {
    logError('Error handling Bitbucket webhook', error)
    return c.json({ error: error.message }, 500)
  }
})

export default builds
