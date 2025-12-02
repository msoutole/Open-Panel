/**
 * @fileoverview Handler para ações em containers (start, stop, restart, pause, unpause)
 * 
 * @module routes/containers/handlers/actions
 */

import { Hono, Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
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
actions.post('/stop', zValidator('json', containerActionSchema), async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const { timeout } = c.req.valid('json')
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
actions.post('/restart', zValidator('json', containerActionSchema), async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const { timeout } = c.req.valid('json')
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

