import { Hono } from 'hono'
import type { Variables } from '../types'
import { prisma } from '../lib/prisma'
import { MetricsService } from '../services/metrics'
import { logError } from '../lib/logger'
import { HTTPException } from 'hono/http-exception'

const stats = new Hono<{ Variables: Variables }>()

/**
 * GET /api/stats/dashboard
 * Get aggregated statistics for dashboard
 */
stats.get('/dashboard', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    // Get system metrics
    const systemMetrics = await MetricsService.getSystemMetrics()

    // Get project counts
    const projectCounts = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const totalProjects = await prisma.project.count()
    const activeProjects = projectCounts.find((p) => p.status === 'ACTIVE')?._count.id || 0

    // Get container counts
    const containerCounts = await prisma.container.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const totalContainers = await prisma.container.count()
    const runningContainers =
      containerCounts.find((c) => c.status === 'RUNNING')?._count.id || 0

    // Get user counts
    const totalUsers = await prisma.user.count()

    // Get recent activity (last 24 hours)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const recentDeployments = await prisma.deployment.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    })

    const recentAuditLogs = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    })

    return c.json({
      stats: {
        system: {
          cpu: {
            usage: systemMetrics.cpu.usage,
            cores: systemMetrics.cpu.cores,
          },
          memory: {
            usage: systemMetrics.memory.usage,
            total: systemMetrics.memory.total,
            used: systemMetrics.memory.used,
          },
          disk: {
            usage: systemMetrics.disk.usage,
            total: systemMetrics.disk.total,
            used: systemMetrics.disk.used,
          },
          network: {
            rx: systemMetrics.network.rx,
            tx: systemMetrics.network.tx,
            rxRate: systemMetrics.network.rxRate,
            txRate: systemMetrics.network.txRate,
          },
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          paused: projectCounts.find((p) => p.status === 'PAUSED')?._count.id || 0,
        },
        containers: {
          total: totalContainers,
          running: runningContainers,
          stopped: containerCounts.find((c) => c.status === 'EXITED')?._count.id || 0,
        },
        users: {
          total: totalUsers,
        },
        activity: {
          deployments24h: recentDeployments,
          auditLogs24h: recentAuditLogs,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    logError('Failed to get dashboard stats', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get dashboard stats: ${message}` })
  }
})

/**
 * GET /api/stats/projects
 * Get statistics about projects
 */
stats.get('/projects', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const total = await prisma.project.count()

    const byStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const byType = await prisma.project.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    })

    return c.json({
      stats: {
        total,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        byType: byType.map((item) => ({
          type: item.type,
          count: item._count.id,
        })),
      },
    })
  } catch (error: unknown) {
    logError('Failed to get project stats', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get project stats: ${message}` })
  }
})

/**
 * GET /api/stats/containers
 * Get statistics about containers
 */
stats.get('/containers', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const total = await prisma.container.count()

    const byStatus = await prisma.container.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Get average CPU and memory usage
    const containers = await prisma.container.findMany({
      where: {
        status: 'RUNNING',
      },
      select: {
        cpuUsage: true,
        memoryUsage: true,
      },
    })

    const avgCpu =
      containers.length > 0
        ? containers.reduce((sum, c) => sum + (c.cpuUsage || 0), 0) / containers.length
        : 0

    const avgMemory =
      containers.length > 0
        ? containers.reduce((sum, c) => sum + Number(c.memoryUsage || 0), 0) / containers.length
        : 0

    return c.json({
      stats: {
        total,
        running: byStatus.find((s) => s.status === 'RUNNING')?._count.id || 0,
        stopped: byStatus.find((s) => s.status === 'EXITED')?._count.id || 0,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        averages: {
          cpu: Math.round(avgCpu * 100) / 100,
          memory: Math.round(avgMemory),
        },
      },
    })
  } catch (error: unknown) {
    logError('Failed to get container stats', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get container stats: ${message}` })
  }
})

export default stats

