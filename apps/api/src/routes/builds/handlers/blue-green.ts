import { Context } from 'hono'
import {
  DeploymentStrategyService,
} from '../../../services/deployment-strategy'
import { logInfo, logError } from '../../../lib/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logAudit, AuditActions } from '../../../middlewares/audit'

const blueGreenDeploySchema = z.object({
  projectId: z.string(),
  newImage: z.string(),
  newTag: z.string(),
  envVars: z.record(z.string(), z.string()).optional(),
  ports: z
    .array(
      z.object({
        host: z.number(),
        container: z.number(),
        protocol: z.enum(['HTTP', 'HTTPS', 'TCP']).optional(),
      })
    )
    .optional(),
  volumes: z
    .array(
      z.object({
        source: z.string(),
        target: z.string(),
        mode: z.enum(['rw', 'ro']).optional(),
      })
    )
    .optional(),
  cpuLimit: z.string().optional(),
  memoryLimit: z.string().optional(),
  healthCheckUrl: z.string().url().optional(),
  healthCheckTimeout: z.number().min(5).max(300).optional().default(30),
  switchoverDelay: z.number().min(0).max(300).optional().default(10),
  keepOldContainer: z.boolean().optional().default(true),
})

/**
 * POST /api/builds/blue-green
 * Execute blue-green deployment
 */
export const blueGreenDeployHandler = [
  zValidator('json', blueGreenDeploySchema),
  async (c: Context) => {
    try {
      const options = (c.req as { valid: (type: string) => unknown }).valid('json') as z.infer<typeof blueGreenDeploySchema>
      const user = c.get('user') as { userId?: string } | undefined

      if (!user?.userId) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      logInfo('Blue-green deployment requested', {
        projectId: options.projectId,
        newImage: `${options.newImage}:${options.newTag}`,
        userId: user.userId,
      })

      const result = await DeploymentStrategyService.blueGreenDeployment(options)

      if (!result.success) {
        return c.json(
          {
            error: 'Blue-green deployment failed',
            details: result.error,
          },
          500
        )
      }

      // Log audit
      await logAudit(c, {
        action: AuditActions.DEPLOYMENT_CREATE,
        resourceType: 'deployment',
        resourceId: result.newContainerId || '',
        metadata: {
          strategy: 'blue-green',
          projectId: options.projectId,
          newImage: `${options.newImage}:${options.newTag}`,
          oldContainerId: result.oldContainerId,
        },
      })

      return c.json(
        {
          message: 'Blue-green deployment completed successfully',
          deployment: {
            success: result.success,
            newContainerId: result.newContainerId,
            oldContainerId: result.oldContainerId,
            switchedAt: result.switchedAt,
          },
        },
        200
      )
    } catch (error: unknown) {
      logError('Blue-green deployment error', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  }
]

const rollbackSchema = z.object({
  projectId: z.string(),
  oldContainerId: z.string(),
})

/**
 * POST /api/builds/rollback
 * Rollback to previous container
 */
export const rollbackHandler = [
  zValidator('json', rollbackSchema),
  async (c: Context) => {
    try {
      const { projectId, oldContainerId } = (c.req as { valid: (type: string) => unknown }).valid('json') as z.infer<typeof rollbackSchema>
      const user = c.get('user') as { userId?: string } | undefined

      if (!user?.userId) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      logInfo('Rollback requested', {
        projectId,
        oldContainerId,
        userId: user.userId,
      })

      const result = await DeploymentStrategyService.rollbackBlueGreen(projectId, oldContainerId)

      if (!result.success) {
        return c.json(
          {
            error: 'Rollback failed',
            details: result.error,
          },
          500
        )
      }

      // Log audit
      await logAudit(c, {
        action: 'DEPLOYMENT_ROLLBACK',
        resourceType: 'deployment',
        resourceId: oldContainerId,
        metadata: {
          projectId,
          oldContainerId,
        },
      })

      return c.json(
        {
          message: 'Rollback completed successfully',
          rollback: {
            success: result.success,
            projectId,
            oldContainerId,
          },
        },
        200
      )
    } catch (error: unknown) {
      logError('Rollback error', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  }
]

