import { Hono } from 'hono'
import type { Variables } from '../types'
import { HealthService } from '../services/health'
import { logError } from '../lib/logger'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'

const health = new Hono<{ Variables: Variables }>()

/**
 * Basic health check
 * GET /health
 */
health.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

/**
 * Detailed health check with database and Redis connectivity
 * GET /health/detailed
 */
health.get('/detailed', async (c) => {
  const checks = {
    api: true,
    database: false,
    redis: false,
  }

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    logError('Database health check failed', error)
  }

  // Check Redis
  try {
    await redis.ping()
    checks.redis = true
  } catch (error) {
    logError('Redis health check failed', error)
  }

  const allHealthy = Object.values(checks).every(Boolean)

  return c.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    allHealthy ? 200 : 503
  )
})

/**
 * Readiness probe (for Kubernetes)
 * GET /health/ready
 */
health.get('/ready', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return c.json({ ready: true })
  } catch (error) {
    logError('Readiness check failed', error)
    return c.json({ ready: false }, 503)
  }
})

/**
 * Liveness probe (for Kubernetes)
 * GET /health/live
 */
health.get('/live', (c) => {
  return c.json({ alive: true })
})

/**
 * Get system health status
 * GET /health/system
 */
health.get('/system', async (c) => {
  try {
    const systemHealth = await HealthService.getSystemHealth()

    const statusCode = systemHealth.status === 'healthy' ? 200 : systemHealth.status === 'degraded' ? 200 : 503

    return c.json(systemHealth, statusCode)
  } catch (error: unknown) {
    logError('Failed to get system health', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json(
      {
        status: 'unhealthy',
        error: message,
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
})

/**
 * Get health status for a specific container
 * GET /health/containers/:id
 */
health.get('/containers/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const containerHealth = await HealthService.getContainerHealth(id)

    return c.json(containerHealth)
  } catch (error: unknown) {
    logError('Failed to get container health', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get health status for all containers
 * GET /health/containers
 */
health.get('/containers', async (c) => {
  try {
    const containersHealth = await HealthService.getAllContainersHealth()

    const unhealthyCount = containersHealth.filter((c) => c.status === 'unhealthy').length

    return c.json({
      containers: containersHealth,
      total: containersHealth.length,
      unhealthy: unhealthyCount,
      healthy: containersHealth.length - unhealthyCount,
    })
  } catch (error: unknown) {
    logError('Failed to get containers health', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get only unhealthy containers
 * GET /health/containers/unhealthy
 */
health.get('/containers/unhealthy', async (c) => {
  try {
    const unhealthyContainers = await HealthService.getUnhealthyContainers()

    return c.json({
      containers: unhealthyContainers,
      count: unhealthyContainers.length,
    })
  } catch (error: unknown) {
    logError('Failed to get unhealthy containers', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Trigger manual health check
 * POST /health/check
 */
health.post('/check', async (c) => {
  try {
    // Run periodic health check manually
    await HealthService.runPeriodicHealthCheck()

    return c.json({
      message: 'Health check triggered successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    logError('Failed to trigger health check', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default health
