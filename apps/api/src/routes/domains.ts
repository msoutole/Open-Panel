import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../lib/prisma'
import { createDomainSchema, updateDomainSchema } from '@openpanel/shared'
import { traefikService } from '../services/traefik'
import type { Variables } from '../types'

const domains = new Hono<{ Variables: Variables }>()

// Get all domains for a project
domains.get('/project/:projectId', async (c) => {
  const { projectId } = c.req.param()
  const user = c.get('user')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check access
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    const domains = await prisma.domain.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({ domains })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch domains' })
  }
})

// Create new domain
domains.post('/', zValidator('json', createDomainSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Check if domain already exists
    const existingDomain = await prisma.domain.findUnique({
      where: { name: data.name },
    })

    if (existingDomain) {
      throw new HTTPException(400, { message: 'Domain already exists' })
    }

    const newDomain = await prisma.domain.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        sslEnabled: data.sslEnabled,
        sslAutoRenew: data.sslAutoRenew,
        dnsProvider: data.dnsProvider,
        status: 'PENDING',
      },
    })

    return c.json({ domain: newDomain }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to create domain' })
  }
})

// Get single domain
domains.get('/:domainId', async (c) => {
  const { domainId } = c.req.param()
  const user = c.get('user')

  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
      },
    })

    if (!domain) {
      throw new HTTPException(404, { message: 'Domain not found' })
    }

    // Check access
    if (domain.project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    return c.json({ domain })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch domain' })
  }
})

// Update domain
domains.put('/:domainId', zValidator('json', updateDomainSchema), async (c) => {
  const { domainId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
      },
    })

    if (!domain) {
      throw new HTTPException(404, { message: 'Domain not found' })
    }

    // Check access
    if (domain.project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Check if new name is unique
    if (data.name && data.name !== domain.name) {
      const existing = await prisma.domain.findUnique({
        where: { name: data.name },
      })
      if (existing) {
        throw new HTTPException(400, { message: 'Domain name already exists' })
      }
    }

    const updatedDomain = await prisma.domain.update({
      where: { id: domainId },
      data: {
        name: data.name,
        sslEnabled: data.sslEnabled,
        sslAutoRenew: data.sslAutoRenew,
        dnsProvider: data.dnsProvider,
      },
    })

    return c.json({ domain: updatedDomain })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to update domain' })
  }
})

// Delete domain
domains.delete('/:domainId', async (c) => {
  const { domainId } = c.req.param()
  const user = c.get('user')

  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
      },
    })

    if (!domain) {
      throw new HTTPException(404, { message: 'Domain not found' })
    }

    // Check access
    if (domain.project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    await prisma.domain.delete({
      where: { id: domainId },
    })

    return c.json({ message: 'Domain deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to delete domain' })
  }
})

// Verify domain ownership (trigger DNS verification)
domains.post('/:domainId/verify', async (c) => {
  const { domainId } = c.req.param()
  const user = c.get('user')

  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
      },
    })

    if (!domain) {
      throw new HTTPException(404, { message: 'Domain not found' })
    }

    // Check access
    if (domain.project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // In production, this would trigger actual DNS verification
    // For now, we'll update status to VERIFYING
    const updated = await prisma.domain.update({
      where: { id: domainId },
      data: {
        status: 'VERIFYING',
      },
    })

    return c.json({ domain: updated, message: 'Domain verification in progress' })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to verify domain' })
  }
})

// Get SSL certificate status
domains.get('/:domainId/ssl-status', async (c) => {
  const { domainId } = c.req.param()
  const user = c.get('user')

  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
      },
    })

    if (!domain) {
      throw new HTTPException(404, { message: 'Domain not found' })
    }

    // Check access
    if (domain.project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    const sslStatus = {
      enabled: domain.sslEnabled,
      autoRenew: domain.sslAutoRenew,
      expiresAt: domain.sslExpiresAt,
      verifiedAt: domain.verifiedAt,
      status: domain.status,
    }

    return c.json({ sslStatus })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch SSL status' })
  }
})

// Activate domain (configure Traefik and SSL)
domains.post('/:domainId/activate', async (c) => {
  const { domainId } = c.req.param()
  const user = c.get('user')

  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: true,
      },
    })

    if (!domain) {
      throw new HTTPException(404, { message: 'Domain not found' })
    }

    // Check access
    if (domain.project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Configure Traefik
    await traefikService.updateDomain(domainId)

    return c.json({
      message: 'Domain activated successfully',
      domain
    })
  } catch (error: any) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: error.message || 'Failed to activate domain' })
  }
})

// Sync all domains with Traefik
domains.post('/sync', async (c) => {
  const user = c.get('user')

  try {
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const synced = await traefikService.syncAllDomains()

    return c.json({
      message: `Synced ${synced} domain(s)`,
      synced
    })
  } catch (error: any) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: error.message || 'Failed to sync domains' })
  }
})

// Get Traefik status
domains.get('/traefik/status', async (c) => {
  try {
    const isRunning = await traefikService.isRunning()
    const routers = isRunning ? await traefikService.getRouters() : []
    const services = isRunning ? await traefikService.getServices() : []

    return c.json({
      running: isRunning,
      routers: routers.length || 0,
      services: services.length || 0,
    })
  } catch (error: any) {
    throw new HTTPException(500, { message: error.message || 'Failed to get Traefik status' })
  }
})

export default domains
