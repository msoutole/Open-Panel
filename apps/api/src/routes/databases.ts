import { Hono } from 'hono'
import type { Variables } from '../types'
import { DatabaseTemplatesService, DatabaseType } from '../services/database-templates'
import { logInfo, logError } from '../lib/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logAudit, AuditActions } from '../middlewares/audit'

const databases = new Hono<{ Variables: Variables }>()

/**
 * List all database templates
 * GET /databases/templates
 */
databases.get('/templates', async (c) => {
  try {
    const templates = DatabaseTemplatesService.listTemplates()

    return c.json({
      templates: templates.map((t) => ({
        type: t.type,
        name: t.name,
        description: t.description,
        image: `${t.defaultImage}:${t.defaultTag}`,
        defaultPort: t.defaultPort,
        features: {
          healthCheck: !!t.healthCheck,
          volumes: t.volumes.length,
        },
      })),
      total: templates.length,
    })
  } catch (error: unknown) {
    logError('Failed to list database templates', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get specific database template
 * GET /databases/templates/:type
 */
databases.get('/templates/:type', async (c) => {
  try {
    const type = c.req.param('type') as DatabaseType

    const template = DatabaseTemplatesService.getTemplate(type)

    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    return c.json({ template })
  } catch (error: unknown) {
    logError('Failed to get database template', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Deploy database from template
 * POST /databases/deploy
 */
const deploySchema = z.object({
  type: z.enum(['postgresql', 'mysql', 'mongodb', 'redis', 'mariadb']),
  name: z.string().min(1).max(100),
  projectId: z.string().optional(),
  customEnv: z.record(z.string(), z.string()).optional(),
  customPort: z.number().min(1).max(65535).optional(),
  tag: z.string().optional(),
})

databases.post('/deploy', zValidator('json', deploySchema), async (c) => {
  try {
    const { type, name, projectId, customEnv, customPort, tag } = c.req.valid('json')
    const user = c.get('user')

    logInfo(`Deploying ${type} database`, { name, type, userId: user?.userId } as any)

    const result = await DatabaseTemplatesService.deployDatabase({
      type,
      name,
      projectId,
      customEnv,
      customPort,
      tag,
    })

    // Log audit
    await logAudit(c, {
      action: AuditActions.CONTAINER_CREATE,
      resourceType: 'database',
      resourceId: result.container.id,
      metadata: {
        databaseType: type,
        name,
        port: customPort,
      },
    })

    return c.json({
      message: 'Database deployed successfully',
      database: {
        id: result.container.id,
        name: result.container.name,
        type,
        dockerId: result.container.dockerId,
        status: result.container.status,
        connectionString: result.connectionString,
        credentials: result.credentials,
      },
    }, 201)
  } catch (error: unknown) {
    logError('Failed to deploy database', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get database metrics
 * GET /databases/:id/metrics
 */
databases.get('/:id/metrics', async (c) => {
  try {
    const id = c.req.param('id')
    const type = c.req.query('type') as DatabaseType

    if (!type) {
      return c.json({ error: 'Database type is required' }, 400)
    }

    const metrics = await DatabaseTemplatesService.getDatabaseMetrics(id, type)

    return c.json({ metrics })
  } catch (error: unknown) {
    logError('Failed to get database metrics', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Create database backup
 * POST /databases/:id/backup
 */
databases.post('/:id/backup', async (c) => {
  try {
    const id = c.req.param('id')
    const type = c.req.query('type') as DatabaseType

    if (!type) {
      return c.json({ error: 'Database type is required' }, 400)
    }

    logInfo(`Creating backup for database ${id}`, { id, type })

    const backupPath = await DatabaseTemplatesService.backupDatabase(id, type)

    // Log audit
    await logAudit(c, {
      action: 'DATABASE_BACKUP' as any,
      resourceType: 'database',
      resourceId: id,
      metadata: { type, backupPath },
    })

    return c.json({
      message: 'Backup created successfully',
      backupPath,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    logError('Failed to create database backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get database connection info
 * GET /databases/:id/connection
 */
databases.get('/:id/connection', async (c) => {
  try {
    const id = c.req.param('id')
    const type = c.req.query('type') as DatabaseType

    if (!type) {
      return c.json({ error: 'Database type is required' }, 400)
    }

    const template = DatabaseTemplatesService.getTemplate(type)

    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    // In a real implementation, we would fetch this from the container's env vars
    const placeholder = {
      host: 'localhost',
      port: template.defaultPort,
      ...template.envVars,
    }

    const connectionString = DatabaseTemplatesService.generateConnectionString(type, placeholder)

    return c.json({
      type,
      connectionString,
      defaultPort: template.defaultPort,
      envVars: Object.keys(template.envVars),
    })
  } catch (error: unknown) {
    logError('Failed to get connection info', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default databases
