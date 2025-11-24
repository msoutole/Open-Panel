import { HealthService } from './health'
import { SSLService } from './ssl'
import { BackupService } from './backup'
import { logInfo, logError } from '../lib/logger'

/**
 * Scheduler Service
 * Manages periodic background tasks (cron-like)
 */

export class SchedulerService {
  private intervals: NodeJS.Timeout[] = []
  private static instance: SchedulerService

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService()
    }
    return SchedulerService.instance
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    logInfo('Starting scheduler service')

    // Health check every 5 minutes
    this.scheduleHealthCheck()

    // SSL renewal check daily at 2 AM
    this.scheduleSSLRenewal()

    // Automatic backups daily at 3 AM
    this.scheduleBackups()

    // Backup cleanup weekly
    this.scheduleBackupCleanup()

    logInfo('Scheduler service started', {
      tasks: [
        'Health check (every 5 minutes)',
        'SSL renewal check (daily at 2 AM)',
        'Automatic backups (daily at 3 AM)',
        'Backup cleanup (weekly on Sunday at 4 AM)',
      ],
    })
  }

  /**
   * Schedule periodic health checks
   */
  private scheduleHealthCheck(): void {
    // Run immediately on start
    this.runHealthCheck()

    // Then run every 5 minutes
    const interval = setInterval(() => {
      this.runHealthCheck()
    }, 5 * 60 * 1000) // 5 minutes

    this.intervals.push(interval)
    logInfo('Health check scheduled (every 5 minutes)')
  }

  /**
   * Run health check
   */
  private async runHealthCheck(): Promise<void> {
    try {
      await HealthService.runPeriodicHealthCheck()
    } catch (error) {
      logError('Scheduled health check failed', error)
    }
  }

  /**
   * Schedule SSL renewal checks
   */
  private scheduleSSLRenewal(): void {
    // Calculate time until next 2 AM
    const now = new Date()
    const next2AM = new Date()
    next2AM.setHours(2, 0, 0, 0)

    // If it's already past 2 AM today, schedule for tomorrow
    if (now.getHours() >= 2) {
      next2AM.setDate(next2AM.getDate() + 1)
    }

    const timeUntil2AM = next2AM.getTime() - now.getTime()

    // Schedule first run at 2 AM
    setTimeout(() => {
      this.runSSLRenewal()

      // Then run daily
      const interval = setInterval(() => {
        this.runSSLRenewal()
      }, 24 * 60 * 60 * 1000) // 24 hours

      this.intervals.push(interval)
    }, timeUntil2AM)

    logInfo('SSL renewal check scheduled (daily at 2 AM)')
  }

  /**
   * Run SSL renewal check
   */
  private async runSSLRenewal(): Promise<void> {
    try {
      const sslService = SSLService.getInstance()
      await sslService.setupAutoRenewal()
    } catch (error) {
      logError('Scheduled SSL renewal check failed', error)
    }
  }

  /**
   * Schedule automatic backups
   */
  private scheduleBackups(): void {
    // Calculate time until next 3 AM
    const now = new Date()
    const next3AM = new Date()
    next3AM.setHours(3, 0, 0, 0)

    // If it's already past 3 AM today, schedule for tomorrow
    if (now.getHours() >= 3) {
      next3AM.setDate(next3AM.getDate() + 1)
    }

    const timeUntil3AM = next3AM.getTime() - now.getTime()

    // Schedule first run at 3 AM
    setTimeout(() => {
      this.runBackup()

      // Then run daily
      const interval = setInterval(() => {
        this.runBackup()
      }, 24 * 60 * 60 * 1000) // 24 hours

      this.intervals.push(interval)
    }, timeUntil3AM)

    logInfo('Automatic backups scheduled (daily at 3 AM)')
  }

  /**
   * Run automatic backup
   */
  private async runBackup(): Promise<void> {
    try {
      const backupService = BackupService.getInstance()

      // Create full system backup
      await backupService.backupFull()

      logInfo('Automatic backup completed successfully')
    } catch (error) {
      logError('Scheduled backup failed', error)
    }
  }

  /**
   * Schedule backup cleanup (weekly on Sunday at 4 AM)
   */
  private scheduleBackupCleanup(): void {
    // Calculate time until next Sunday at 4 AM
    const now = new Date()
    const nextSunday = new Date()
    nextSunday.setHours(4, 0, 0, 0)

    // Calculate days until Sunday (0 = Sunday)
    const daysUntilSunday = (7 - now.getDay()) % 7
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday)

    // If we're already past 4 AM on Sunday, schedule for next Sunday
    if (daysUntilSunday === 0 && now.getHours() >= 4) {
      nextSunday.setDate(nextSunday.getDate() + 7)
    }

    const timeUntilNextSunday = nextSunday.getTime() - now.getTime()

    // Schedule first run
    setTimeout(() => {
      this.runBackupCleanup()

      // Then run weekly
      const interval = setInterval(() => {
        this.runBackupCleanup()
      }, 7 * 24 * 60 * 60 * 1000) // 7 days

      this.intervals.push(interval)
    }, timeUntilNextSunday)

    logInfo('Backup cleanup scheduled (weekly on Sunday at 4 AM)')
  }

  /**
   * Run backup cleanup
   */
  private async runBackupCleanup(): Promise<void> {
    try {
      const backupService = BackupService.getInstance()

      // Delete backups older than 30 days
      const deletedCount = await backupService.cleanupOldBackups(30)

      logInfo('Automatic backup cleanup completed', { deletedCount })
    } catch (error) {
      logError('Scheduled backup cleanup failed', error)
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    logInfo('Stopping scheduler service')

    this.intervals.forEach((interval) => {
      clearInterval(interval)
    })

    this.intervals = []

    logInfo('Scheduler service stopped')
  }

  /**
   * Add custom scheduled task
   */
  addTask(name: string, task: () => Promise<void>, intervalMs: number): void {
    logInfo(`Adding custom scheduled task: ${name}`, { intervalMs })

    // Run immediately
    task().catch((error) => {
      logError(`Custom task ${name} failed`, error)
    })

    // Then run periodically
    const interval = setInterval(() => {
      task().catch((error) => {
        logError(`Custom task ${name} failed`, error)
      })
    }, intervalMs)

    this.intervals.push(interval)
  }
}

/**
 * Initialize and start scheduler
 */
export function initializeScheduler(): void {
  const scheduler = SchedulerService.getInstance()
  scheduler.start()

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logInfo('Shutting down scheduler...')
    scheduler.stop()
  })

  process.on('SIGINT', () => {
    logInfo('Shutting down scheduler...')
    scheduler.stop()
  })
}
