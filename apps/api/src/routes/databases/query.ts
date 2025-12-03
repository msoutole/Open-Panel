import { Hono } from 'hono'
import type { Variables } from '../../types'
import { DatabaseClientService, DatabaseConnection } from '../../services/database-client'
import { DatabaseType } from '../../services/database-templates'
import { logInfo, logError } from '../../lib/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logAudit, AuditActions } from '../../middlewares/audit'

const query = new Hono<{ Variables: Variables }>()

/**
 * Execute database query
 * POST /databases/:containerId/query
 */
const executeQuerySchema = z.object({
  type: z.enum(['postgresql', 'mysql', 'mongodb', 'redis', 'mariadb']),
  query: z.string().min(1),
  connection: z
    .object({
      host: z.string(),
      port: z.number(),
      database: z.string(),
      username: z.string(),
      password: z.string(),
    })
    .optional(),
})

query.post('/:containerId/query', zValidator('json', executeQuerySchema), async (c) => {
  try {
    const containerId = c.req.param('containerId')
    const { type, query: queryString, connection } = c.req.valid('json')
    const user = c.get('user')

    if (!user?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    logInfo('Database query requested', {
      containerId,
      type,
      userId: user.userId,
    })

    // Get connection info
    let dbConnection: DatabaseConnection

    if (connection) {
      dbConnection = {
        type: type as DatabaseType,
        ...connection,
      }
    } else {
      // Get connection from container
      const containerConnection = await DatabaseClientService.getConnectionFromContainer(
        containerId,
        type as DatabaseType
      )

      if (!containerConnection) {
        return c.json({ error: 'Could not get database connection info' }, 400)
      }

      dbConnection = containerConnection
    }

    // Execute query based on type
    let result

    switch (type) {
      case 'postgresql':
        result = await DatabaseClientService.executePostgreSQLQuery(dbConnection, queryString)
        break

      case 'mysql':
      case 'mariadb':
        result = await DatabaseClientService.executeMySQLQuery(dbConnection, queryString)
        break

      case 'mongodb':
        result = await DatabaseClientService.executeMongoDBQuery(dbConnection, queryString)
        break

      case 'redis':
        result = await DatabaseClientService.executeRedisCommand(dbConnection, queryString)
        break

      default:
        return c.json({ error: `Unsupported database type: ${type}` }, 400)
    }

    // Log audit
    await logAudit(c, {
      action: AuditActions.DATABASE_QUERY,
      resourceType: 'database',
      resourceId: containerId,
      metadata: {
        type,
        queryLength: queryString.length,
        success: result.success,
      },
    })

    if (!result.success) {
      return c.json(
        {
          error: 'Query execution failed',
          details: result.error,
          executionTime: result.executionTime,
        },
        400
      )
    }

    return c.json({
      success: true,
      data: result.data,
      executionTime: result.executionTime,
      rowsAffected: result.rowsAffected,
    })
  } catch (error: unknown) {
    logError('Database query error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get database connection info
 * GET /databases/:containerId/connection
 */
query.get('/:containerId/connection', async (c) => {
  try {
    const containerId = c.req.param('containerId')
    const type = c.req.query('type') as DatabaseType

    if (!type) {
      return c.json({ error: 'Database type is required' }, 400)
    }

    const connection = await DatabaseClientService.getConnectionFromContainer(containerId, type)

    if (!connection) {
      return c.json({ error: 'Could not get database connection info' }, 404)
    }

    // Don't return password in response
    return c.json({
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      // Password is not returned for security
    })
  } catch (error: unknown) {
    logError('Failed to get database connection', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default query

