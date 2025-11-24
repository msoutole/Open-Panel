import { Queue, Worker } from 'bullmq'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logDebug } from '../lib/logger'
import type { AuditAction } from '@prisma/client'

/**
 * Audit log queue for async processing
 * Prevents blocking requests with database writes
 */

// Job data interface
export interface AuditLogJob {
  userId: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

// Create audit log queue
export const auditQueue = new Queue<AuditLogJob>('audit-logs', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      count: 5000,
    },
  },
})

// Process audit log jobs
const auditWorker = new Worker<AuditLogJob>(
  'audit-logs',
  async (job) => {
    const { userId, action, resourceType, resourceId, metadata, ipAddress, userAgent, timestamp } = job.data

    logDebug('Processing audit log', {
      jobId: job.id,
      userId,
      action,
      resourceType,
    })

    try {
      // Create audit log in database
      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId: resourceId || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          createdAt: new Date(timestamp),
        },
      })

      logDebug('Audit log created', {
        auditLogId: auditLog.id,
        userId,
        action,
      })

      return { success: true, auditLogId: auditLog.id }
    } catch (error) {
      logError('Failed to create audit log', error, {
        jobId: job.id,
        userId,
        action,
      })

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 10, // Process up to 10 audit logs concurrently
  }
)

// Event listeners
auditWorker.on('completed', (job) => {
  logDebug(`Audit log job ${job.id} completed`)
})

auditWorker.on('failed', (job, err) => {
  logError(`Audit log job ${job?.id} failed`, err)
})

auditWorker.on('error', (err) => {
  logError('Audit worker error', err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logInfo('Shutting down audit worker...')
  await auditWorker.close()
})

/**
 * Helper function to queue an audit log
 * @param data - Audit log data
 * @returns Job ID
 */
export async function queueAuditLog(data: Omit<AuditLogJob, 'timestamp'>): Promise<string> {
  const job = await auditQueue.add('audit-log', {
    ...data,
    timestamp: new Date().toISOString(),
  })

  logDebug('Audit log queued', {
    jobId: job.id,
    action: data.action,
    userId: data.userId,
  })

  return job.id as string
}

/**
 * Helper function to create audit log synchronously (for critical operations)
 * @param data - Audit log data
 */
export async function createAuditLogSync(data: Omit<AuditLogJob, 'timestamp'>): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    })

    logDebug('Audit log created synchronously', {
      action: data.action,
      userId: data.userId,
    })
  } catch (error) {
    logError('Failed to create synchronous audit log', error)
    // Don't throw - audit logs should never break the main flow
  }
}

/**
 * Get audit queue statistics
 */
export async function getAuditQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    auditQueue.getWaitingCount(),
    auditQueue.getActiveCount(),
    auditQueue.getCompletedCount(),
    auditQueue.getFailedCount(),
    auditQueue.getDelayedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  }
}

logInfo('Audit log queue initialized')

export default auditQueue
