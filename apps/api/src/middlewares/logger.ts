import { Context, Next } from 'hono'
import { logger, logHttp } from '../lib/logger'
import { randomUUID } from 'crypto'

/**
 * Custom logger middleware for Hono
 * Adds request ID tracking and structured logging
 */
export const loggerMiddleware = async (c: Context, next: Next) => {
  // Generate request ID
  const requestId = randomUUID()
  c.set('requestId', requestId)

  // Log incoming request
  const start = Date.now()
  const { method, url } = c.req

  logHttp(`→ ${method} ${url}`, { requestId })

  // Process request
  await next()

  // Log response
  const duration = Date.now() - start
  const status = c.res.status

  logHttp(`← ${method} ${url} ${status} ${duration}ms`, {
    requestId,
    method,
    url,
    status,
    duration,
  })
}
