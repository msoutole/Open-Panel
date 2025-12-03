import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Variables } from '../types'
import { prisma } from '../lib/prisma'
import { logError } from '../lib/logger'
import { HTTPException } from 'hono/http-exception'
import type { Prisma } from '@prisma/client'
import type { AuditAction } from '@prisma/client'

const audit = new Hono<{ Variables: Variables }>()

// Query schema for filtering audit logs
const auditQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILURE']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().default('1').transform((v) => parseInt(v) || 1),
  limit: z.string().optional().default('20').transform((v) => parseInt(v) || 20),
})

/**
 * GET /api/audit
 * List audit logs with pagination and filters
 */
audit.get('/', zValidator('query', auditQuerySchema), async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page,
      limit,
    } = c.req.valid('query')

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {}

    if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = action as AuditAction
    }

    if (resourceType) {
      where.resourceType = resourceType
    }

    if (resourceId) {
      where.resourceId = resourceId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Get total count
    const total = await prisma.auditLog.count({ where })

    // Get paginated results
    const skip = (page - 1) * limit
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Map to response format
    const logs = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userEmail: log.user?.email || 'Unknown',
      userName: log.user?.name || 'Unknown',
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      timestamp: log.createdAt.toISOString(),
      status: (log.metadata as { status?: string } | null)?.status === 'FAILURE' ? 'Failure' : 'Success',
    }))

    return c.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    logError('Failed to get audit logs', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get audit logs: ${message}` })
  }
})

/**
 * GET /api/audit/:id
 * Get details of a specific audit log
 */
audit.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!auditLog) {
      throw new HTTPException(404, { message: 'Audit log not found' })
    }

    return c.json({
      log: {
        id: auditLog.id,
        action: auditLog.action,
        userId: auditLog.userId,
        userEmail: auditLog.user?.email || 'Unknown',
        userName: auditLog.user?.name || 'Unknown',
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata,
        timestamp: auditLog.createdAt.toISOString(),
        status: (auditLog.metadata as { status?: string } | null)?.status === 'FAILURE' ? 'Failure' : 'Success',
      },
    })
  } catch (error: unknown) {
    logError('Failed to get audit log', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get audit log: ${message}` })
  }
})

/**
 * GET /api/audit/stats
 * Get statistics about audit logs
 */
audit.get('/stats', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    // Get total count
    const total = await prisma.auditLog.count()

    // Get counts by action
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Get counts by resource type
    const resourceTypeCounts = await prisma.auditLog.groupBy({
      by: ['resourceType'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Get recent activity (last 24 hours)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const recentCount = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    })

    // Get failed actions count (check metadata for status field)
    const allLogs = await prisma.auditLog.findMany({
      select: {
        metadata: true,
      },
    })

    const failedCount = allLogs.filter((log) => {
      const metadata = log.metadata as { status?: string } | null
      return metadata?.status === 'FAILURE'
    }).length

    return c.json({
      stats: {
        total,
        recent24h: recentCount,
        failed: failedCount,
        successful: total - failedCount,
        byAction: actionCounts.map((item) => ({
          action: item.action,
          count: item._count.id,
        })),
        byResourceType: resourceTypeCounts.map((item) => ({
          resourceType: item.resourceType,
          count: item._count.id,
        })),
      },
    })
  } catch (error: unknown) {
    logError('Failed to get audit log stats', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get audit log stats: ${message}` })
  }
})

export default audit

