import { Hono } from 'hono'
import type { Variables } from '../types'
import { HealthService } from '../services/health'
import { logError } from '../lib/logger'

const health = new Hono<{ Variables: Variables }>()

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
