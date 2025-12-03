import { Hono } from 'hono'
import type { Variables } from '../types'
import { BackupService } from '../services/backup'
import { logInfo, logError } from '../lib/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logAudit, AuditActions } from '../middlewares/audit'

const backups = new Hono<{ Variables: Variables }>()

const backupService = BackupService.getInstance()

/**
 * List all backups
 * GET /backups
 */
backups.get('/', async (c) => {
  try {
    const type = c.req.query('type') as 'database' | 'container' | 'configuration' | 'full' | undefined

    const backupList = await backupService.listBackups(type)

    return c.json({
      backups: backupList.map((b) => ({
        id: b.id,
        type: b.type,
        name: b.name,
        size: b.size,
        sizeFormatted: `${(b.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: b.createdAt,
        metadata: b.metadata,
      })),
      total: backupList.length,
    })
  } catch (error: unknown) {
    logError('Failed to list backups', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get backup statistics
 * GET /backups/stats
 */
backups.get('/stats', async (c) => {
  try {
    const stats = await backupService.getBackupStats()

    return c.json({
      ...stats,
      totalSizeFormatted: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
    })
  } catch (error: unknown) {
    logError('Failed to get backup stats', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Create database backup
 * POST /backups/database
 */
const databaseBackupSchema = z.object({
  name: z.string().optional(),
})

backups.post('/database', zValidator('json', databaseBackupSchema), async (c) => {
  try {
    const { name } = c.req.valid('json')
    const user = c.get('user')

    logInfo('Creating database backup', { userId: user?.userId })

    const backup = await backupService.backupDatabase(name)

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED,
      resourceType: 'backup',
      resourceId: backup.id,
      metadata: {
        type: 'database',
        size: backup.size,
      },
    })

    return c.json({
      message: 'Database backup created successfully',
      backup: {
        id: backup.id,
        name: backup.name,
        size: `${(backup.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: backup.createdAt,
      },
    }, 201)
  } catch (error: unknown) {
    logError('Failed to create database backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Restore database backup
 * POST /backups/database/:id/restore
 */
backups.post('/database/:id/restore', async (c) => {
  try {
    const backupId = c.req.param('id')
    const user = c.get('user')

    logInfo('Restoring database backup', { backupId, userId: user?.userId })

    await backupService.restoreDatabase(backupId)

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED, // Using BACKUP_CREATED for restore
      resourceType: 'backup',
      resourceId: backupId,
      metadata: {
        type: 'database',
      },
    })

    return c.json({
      message: 'Database backup restored successfully',
      backupId,
    })
  } catch (error: unknown) {
    logError('Failed to restore database backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Create container backup
 * POST /backups/container/:containerId
 */
backups.post('/container/:containerId', async (c) => {
  try {
    const containerId = c.req.param('containerId')
    const user = c.get('user')

    logInfo('Creating container backup', { containerId, userId: user?.userId })

    const backup = await backupService.backupContainer(containerId)

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED,
      resourceType: 'backup',
      resourceId: backup.id,
      metadata: {
        type: 'container',
        containerId,
        size: backup.size,
      },
    })

    return c.json({
      message: 'Container backup created successfully',
      backup: {
        id: backup.id,
        name: backup.name,
        size: `${(backup.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: backup.createdAt,
      },
    }, 201)
  } catch (error: unknown) {
    logError('Failed to create container backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Create configuration backup
 * POST /backups/configuration
 */
backups.post('/configuration', async (c) => {
  try {
    const user = c.get('user')

    logInfo('Creating configuration backup', { userId: user?.userId })

    const backup = await backupService.backupConfiguration()

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED,
      resourceType: 'backup',
      resourceId: backup.id,
      metadata: {
        type: 'configuration',
        size: backup.size,
      },
    })

    return c.json({
      message: 'Configuration backup created successfully',
      backup: {
        id: backup.id,
        name: backup.name,
        size: `${(backup.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: backup.createdAt,
      },
    }, 201)
  } catch (error: unknown) {
    logError('Failed to create configuration backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Create full system backup
 * POST /backups/full
 */
backups.post('/full', async (c) => {
  try {
    const user = c.get('user')

    logInfo('Creating full system backup', { userId: user?.userId })

    const backup = await backupService.backupFull()

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED,
      resourceType: 'backup',
      resourceId: backup.id,
      metadata: {
        type: 'full',
        size: backup.size,
        totalBackups: backup.metadata?.totalBackups,
      },
    })

    return c.json({
      message: 'Full system backup created successfully',
      backup: {
        id: backup.id,
        name: backup.name,
        size: `${(backup.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: backup.createdAt,
        totalBackups: backup.metadata?.totalBackups,
      },
    }, 201)
  } catch (error: unknown) {
    logError('Failed to create full system backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Delete backup
 * DELETE /backups/:id
 */
backups.delete('/:id', async (c) => {
  try {
    const backupId = c.req.param('id')
    const user = c.get('user')

    logInfo('Deleting backup', { backupId, userId: user?.userId })

    await backupService.deleteBackup(backupId)

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED, // Using BACKUP_CREATED for delete
      resourceType: 'backup',
      resourceId: backupId,
    })

    return c.json({
      message: 'Backup deleted successfully',
      backupId,
    })
  } catch (error: unknown) {
    logError('Failed to delete backup', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Cleanup old backups
 * POST /backups/cleanup
 */
const cleanupSchema = z.object({
  retentionDays: z.number().min(1).max(365).default(30),
})

backups.post('/cleanup', zValidator('json', cleanupSchema), async (c) => {
  try {
    const { retentionDays } = c.req.valid('json')
    const user = c.get('user')

    logInfo('Cleaning up old backups', { retentionDays, userId: user?.userId })

    const deletedCount = await backupService.cleanupOldBackups(retentionDays)

    // Log audit
    await logAudit(c, {
      action: AuditActions.BACKUP_CREATED, // Using BACKUP_CREATED for cleanup
      resourceType: 'backup',
      metadata: {
        retentionDays,
        deletedCount,
      },
    })

    return c.json({
      message: 'Old backups cleaned up successfully',
      deletedCount,
      retentionDays,
    })
  } catch (error: unknown) {
    logError('Failed to cleanup old backups', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default backups
