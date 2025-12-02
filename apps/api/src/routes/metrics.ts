import { Hono } from 'hono'
import type { Variables } from '../types'
import { MetricsService } from '../services/metrics'
import { logError } from '../lib/logger'
import { HTTPException } from 'hono/http-exception'

const metrics = new Hono<{ Variables: Variables }>()

/**
 * GET /api/metrics/system
 * Get system-wide metrics (CPU, Memory, Disk, Network)
 */
metrics.get('/system', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const systemMetrics = await MetricsService.getSystemMetrics()

    return c.json({
      metrics: systemMetrics,
    })
  } catch (error: unknown) {
    logError('Failed to get system metrics', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get system metrics: ${message}` })
  }
})

/**
 * GET /api/metrics/containers
 * Get metrics for all containers
 */
metrics.get('/containers', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const containersMetrics = await MetricsService.getAllContainersMetrics()

    return c.json({
      metrics: containersMetrics,
      total: containersMetrics.length,
    })
  } catch (error: unknown) {
    logError('Failed to get containers metrics', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: `Failed to get containers metrics: ${message}` })
  }
})

/**
 * GET /api/metrics/containers/:id
 * Get metrics for a specific container
 */
metrics.get('/containers/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()

    const containerMetrics = await MetricsService.getContainerMetrics(id)

    return c.json({
      metrics: containerMetrics,
    })
  } catch (error: unknown) {
    logError('Failed to get container metrics', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof HTTPException) throw error
    if (message.includes('not found')) {
      throw new HTTPException(404, { message })
    }
    throw new HTTPException(500, { message: `Failed to get container metrics: ${message}` })
  }
})

export default metrics

