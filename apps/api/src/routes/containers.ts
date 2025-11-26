import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { dockerService } from '../services/docker'
import { prisma } from '../lib/prisma'
import type { Variables } from '../types'

const containers = new Hono<{ Variables: Variables }>()

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createContainerSchema = z.object({
  name: z.string().min(1).max(255),
  image: z.string().min(1),
  tag: z.string().optional().default('latest'),
  cmd: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  ports: z
    .array(
      z.object({
        host: z.number().int().min(1).max(65535),
        container: z.number().int().min(1).max(65535),
        protocol: z.enum(['tcp', 'udp']).optional().default('tcp'),
      })
    )
    .optional(),
  volumes: z
    .array(
      z.object({
        source: z.string().min(1),
        target: z.string().min(1),
        mode: z.enum(['rw', 'ro']).optional().default('rw'),
      })
    )
    .optional(),
  cpuLimit: z.string().optional(),
  memoryLimit: z.string().optional(),
  projectId: z.string().optional(),
})

const containerActionSchema = z.object({
  timeout: z.number().int().min(1).max(300).optional().default(10),
})

const logsQuerySchema = z.object({
  stdout: z.string().default('true').transform((v) => v === 'true'),
  stderr: z.string().default('true').transform((v) => v === 'true'),
  tail: z.string().transform((v) => parseInt(v)).optional(),
  since: z.string().transform((v) => parseInt(v)).optional(),
  until: z.string().transform((v) => parseInt(v)).optional(),
  timestamps: z.string().default('true').transform((v) => v === 'true'),
})

// ============================================
// ROUTES
// ============================================

/**
 * GET /containers
 * List all containers
 */
containers.get('/', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get containers from database
    const dbContainers = await prisma.container.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({
      containers: dbContainers,
      total: dbContainers.length,
    })
  } catch (error: any) {
    console.error('Error listing containers:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /containers/sync
 * Sync containers from Docker daemon to database
 */
containers.get('/sync', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const result = await dockerService.syncContainers()

    return c.json({
      message: 'Containers synced successfully',
      synced: result.synced,
    })
  } catch (error: any) {
    console.error('Error syncing containers:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /containers/:id
 * Get container details
 */
containers.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    // Get from database
    const dbContainer = await prisma.container.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    // Get live data from Docker
    const dockerContainer = await dockerService.getContainer(dbContainer.dockerId)

    return c.json({
      container: {
        ...dbContainer,
        docker: dockerContainer,
      },
    })
  } catch (error: any) {
    console.error('Error getting container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /containers
 * Create a new container
 */
containers.post('/', zValidator('json', createContainerSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const data = c.req.valid('json')

    const container = await dockerService.createContainer(data)

    return c.json(
      {
        message: 'Container created successfully',
        container,
      },
      201
    )
  } catch (error: any) {
    console.error('Error creating container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /containers/:id/start
 * Start a container
 */
containers.post('/:id/start', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const result = await dockerService.startContainer(dbContainer.dockerId)

    return c.json({
      message: 'Container started successfully',
      container: result,
    })
  } catch (error: any) {
    console.error('Error starting container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /containers/:id/stop
 * Stop a container
 */
containers.post('/:id/stop', zValidator('json', containerActionSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()
    const { timeout } = c.req.valid('json')

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const result = await dockerService.stopContainer(dbContainer.dockerId, timeout)

    return c.json({
      message: 'Container stopped successfully',
      container: result,
    })
  } catch (error: any) {
    console.error('Error stopping container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /containers/:id/restart
 * Restart a container
 */
containers.post('/:id/restart', zValidator('json', containerActionSchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()
    const { timeout } = c.req.valid('json')

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const result = await dockerService.restartContainer(dbContainer.dockerId, timeout)

    return c.json({
      message: 'Container restarted successfully',
      container: result,
    })
  } catch (error: any) {
    console.error('Error restarting container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /containers/:id/pause
 * Pause a container
 */
containers.post('/:id/pause', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const result = await dockerService.pauseContainer(dbContainer.dockerId)

    return c.json({
      message: 'Container paused successfully',
      container: result,
    })
  } catch (error: any) {
    console.error('Error pausing container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /containers/:id/unpause
 * Unpause a container
 */
containers.post('/:id/unpause', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const result = await dockerService.unpauseContainer(dbContainer.dockerId)

    return c.json({
      message: 'Container unpaused successfully',
      container: result,
    })
  } catch (error: any) {
    console.error('Error unpausing container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * DELETE /containers/:id
 * Remove a container
 */
containers.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()
    const force = c.req.query('force') === 'true'

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    await dockerService.removeContainer(dbContainer.dockerId, force)

    return c.json({
      message: 'Container removed successfully',
    })
  } catch (error: any) {
    console.error('Error removing container:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /containers/:id/logs
 * Get container logs
 */
containers.get('/:id/logs', zValidator('query', logsQuerySchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()
    const options = c.req.valid('query')

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const logs = await dockerService.getContainerLogs(dbContainer.dockerId, {
      stdout: options.stdout,
      stderr: options.stderr,
      tail: options.tail,
      since: options.since,
      until: options.until,
      timestamps: options.timestamps,
    })

    return c.json({
      logs,
    })
  } catch (error: any) {
    console.error('Error getting container logs:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /containers/:id/stats
 * Get container statistics
 */
containers.get('/:id/stats', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { id } = c.req.param()

    const dbContainer = await prisma.container.findUnique({
      where: { id },
    })

    if (!dbContainer) {
      return c.json({ error: 'Container not found' }, 404)
    }

    const stats = await dockerService.getContainerStats(dbContainer.dockerId)

    return c.json({
      stats,
    })
  } catch (error: any) {
    console.error('Error getting container stats:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /health/docker
 * Check Docker daemon health
 */
containers.get('/health/docker', async (c) => {
  try {
    const healthy = await dockerService.healthCheck()

    return c.json({
      status: healthy ? 'ok' : 'error',
      docker: healthy,
    })
  } catch (error: any) {
    console.error('Error checking Docker health:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /info/docker
 * Get Docker system info
 */
containers.get('/info/docker', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const info = await dockerService.getSystemInfo()

    return c.json({
      info,
    })
  } catch (error: any) {
    console.error('Error getting Docker info:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default containers
