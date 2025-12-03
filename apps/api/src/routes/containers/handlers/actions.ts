/**
 * @fileoverview Handler para ações em containers (start, stop, restart, pause, unpause)
 * 
 * @module routes/containers/handlers/actions
 */

import { Hono, Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'
import { containerActionSchema } from '../validators'

const actions = new Hono<{ Variables: Variables }>()

/**
 * Inicia um container.
 * 
 * POST /containers/:id/start
 */
actions.post('/start', async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const result = await ContainerService.startContainer(id)

    return c.json({
      message: 'Container started successfully',
      container: result
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to start container' })
  }
})

/**
 * Para um container.
 *
 * POST /containers/:id/stop
 */
actions.post('/stop', async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()

    // Validação manual do body
    const body = await c.req.json()
    const validated = containerActionSchema.parse(body)
    const { timeout } = validated

    const result = await ContainerService.stopContainer(id, timeout)

    return c.json({
      message: 'Container stopped successfully',
      container: result
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to stop container' })
  }
})

/**
 * Reinicia um container.
 *
 * POST /containers/:id/restart
 */
actions.post('/restart', async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()

    // Validação manual do body
    const body = await c.req.json()
    const validated = containerActionSchema.parse(body)
    const { timeout } = validated

    const result = await ContainerService.restartContainer(id, timeout)

    return c.json({
      message: 'Container restarted successfully',
      container: result
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to restart container' })
  }
})

/**
 * Pausa um container.
 * 
 * POST /containers/:id/pause
 */
actions.post('/pause', async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const result = await ContainerService.pauseContainer(id)

    return c.json({
      message: 'Container paused successfully',
      container: result
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to pause container' })
  }
})

/**
 * Despausa um container.
 * 
 * POST /containers/:id/unpause
 */
actions.post('/unpause', async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const result = await ContainerService.unpauseContainer(id)

    return c.json({
      message: 'Container unpaused successfully',
      container: result
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to unpause container' })
  }
})

export default actions

