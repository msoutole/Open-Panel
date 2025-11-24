import { Context } from 'hono'
import { queueAuditLog, createAuditLogSync } from '../queues/audit-queue'
import type { AuditAction } from '@prisma/client'

/**
 * Audit log middleware helper
 * Provides easy way to log user actions
 */

export interface AuditOptions {
  /** User ID (defaults to current authenticated user) */
  userId?: string
  /** Action type */
  action: AuditAction
  /** Resource type (e.g., 'project', 'container', 'team') */
  resourceType: string
  /** Resource ID (optional) */
  resourceId?: string
  /** Additional metadata */
  metadata?: Record<string, any>
  /** Whether to log synchronously (default: false - async) */
  sync?: boolean
}

/**
 * Log an audit event from a Hono context
 * @param c - Hono context
 * @param options - Audit options
 */
export async function logAudit(c: Context, options: AuditOptions): Promise<void> {
  const user = c.get('user')
  const userId = options.userId || user?.userId

  if (!userId) {
    // If no user, skip audit (public endpoints)
    return
  }

  const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0] || c.req.header('x-real-ip')
  const userAgent = c.req.header('user-agent')

  const auditData = {
    userId,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    metadata: options.metadata,
    ipAddress,
    userAgent,
  }

  if (options.sync) {
    // Synchronous logging for critical operations
    await createAuditLogSync(auditData)
  } else {
    // Async logging (default) - better performance
    await queueAuditLog(auditData)
  }
}

/**
 * Common audit actions as constants
 */
export const AuditActions = {
  // Authentication
  LOGIN: 'USER_LOGIN' as AuditAction,
  LOGOUT: 'USER_LOGOUT' as AuditAction,
  REGISTER: 'USER_REGISTER' as AuditAction,

  // Users
  USER_CREATE: 'USER_CREATE' as AuditAction,
  USER_UPDATE: 'USER_UPDATE' as AuditAction,
  USER_DELETE: 'USER_DELETE' as AuditAction,

  // Teams
  TEAM_CREATE: 'TEAM_CREATE' as AuditAction,
  TEAM_UPDATE: 'TEAM_UPDATE' as AuditAction,
  TEAM_DELETE: 'TEAM_DELETE' as AuditAction,
  TEAM_MEMBER_ADD: 'TEAM_MEMBER_ADD' as AuditAction,
  TEAM_MEMBER_REMOVE: 'TEAM_MEMBER_REMOVE' as AuditAction,
  TEAM_MEMBER_ROLE_UPDATE: 'TEAM_MEMBER_ROLE_UPDATE' as AuditAction,

  // Projects
  PROJECT_CREATE: 'PROJECT_CREATE' as AuditAction,
  PROJECT_UPDATE: 'PROJECT_UPDATE' as AuditAction,
  PROJECT_DELETE: 'PROJECT_DELETE' as AuditAction,

  // Containers
  CONTAINER_CREATE: 'CONTAINER_CREATE' as AuditAction,
  CONTAINER_START: 'CONTAINER_START' as AuditAction,
  CONTAINER_STOP: 'CONTAINER_STOP' as AuditAction,
  CONTAINER_RESTART: 'CONTAINER_RESTART' as AuditAction,
  CONTAINER_DELETE: 'CONTAINER_DELETE' as AuditAction,

  // Deployments
  DEPLOYMENT_CREATE: 'DEPLOYMENT_CREATE' as AuditAction,
  DEPLOYMENT_ROLLBACK: 'DEPLOYMENT_ROLLBACK' as AuditAction,

  // Domains
  DOMAIN_CREATE: 'DOMAIN_CREATE' as AuditAction,
  DOMAIN_UPDATE: 'DOMAIN_UPDATE' as AuditAction,
  DOMAIN_DELETE: 'DOMAIN_DELETE' as AuditAction,

  // Settings
  SETTINGS_UPDATE: 'SETTINGS_UPDATE' as AuditAction,
} as const

/**
 * Example usage in routes:
 *
 * ```typescript
 * import { logAudit, AuditActions } from '@/middlewares/audit'
 *
 * // In route handler
 * app.post('/projects', authMiddleware, async (c) => {
 *   const project = await prisma.project.create({ ... })
 *
 *   // Log async (recommended)
 *   await logAudit(c, {
 *     action: AuditActions.PROJECT_CREATE,
 *     resourceType: 'project',
 *     resourceId: project.id,
 *     metadata: { name: project.name, slug: project.slug }
 *   })
 *
 *   return c.json(project, 201)
 * })
 *
 * // For critical operations (login, delete), use sync
 * app.delete('/projects/:id', authMiddleware, async (c) => {
 *   const id = c.req.param('id')
 *   await prisma.project.delete({ where: { id } })
 *
 *   // Log synchronously
 *   await logAudit(c, {
 *     action: AuditActions.PROJECT_DELETE,
 *     resourceType: 'project',
 *     resourceId: id,
 *     sync: true // ← Critical operation
 *   })
 *
 *   return c.json({ success: true })
 * })
 * ```
 */
