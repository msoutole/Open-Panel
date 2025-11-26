import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logDebug } from '../lib/logger'
import { env } from '../lib/env'

const execAsync = promisify(exec)

/**
 * Backup Service
 * Handles automated backups for databases, containers, and configurations
 */

export interface BackupConfig {
  enabled: boolean
  schedule: string // cron format
  retention: {
    daily: number // days
    weekly: number // weeks
    monthly: number // months
  }
  storage: {
    path: string
    maxSize: number // MB
  }
}

export interface Backup {
  id: string
  type: 'database' | 'container' | 'configuration' | 'full'
  name: string
  path: string
  size: number // bytes
  createdAt: Date
  metadata?: Record<string, any>
}

export class BackupService {
  private backupDir: string
  private static instance: BackupService

  private constructor() {
    this.backupDir = process.env.BACKUP_PATH || '/var/lib/openpanel/backups'
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  /**
   * Initialize backup directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'database'), { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'containers'), { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'config'), { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'full'), { recursive: true })

      logInfo('Backup service initialized', { backupDir: this.backupDir })
    } catch (error) {
      logError('Failed to initialize backup service', error)
      throw error
    }
  }

  /**
   * Create database backup
   */
  async backupDatabase(name?: string): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = name || `database-${timestamp}`
    const backupPath = path.join(this.backupDir, 'database', `${backupName}.sql.gz`)

    try {
      logInfo('Creating database backup', { name: backupName })

      // Extract database connection details
      const dbUrl = env.DATABASE_URL
      const dbUrlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)

      if (!dbUrlMatch) {
        throw new Error('Invalid DATABASE_URL format')
      }

      const [, user, password, host, port, database] = dbUrlMatch

      // Use pg_dump to create backup
      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} | gzip > ${backupPath}`

      await execAsync(command)

      // Get file size
      const stats = await fs.stat(backupPath)

      const backup: Backup = {
        id: backupName,
        type: 'database',
        name: backupName,
        path: backupPath,
        size: stats.size,
        createdAt: new Date(),
        metadata: {
          database,
          compressed: true,
        },
      }

      logInfo('Database backup created', {
        name: backupName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      })

      return backup
    } catch (error) {
      logError('Failed to create database backup', error)
      throw error
    }
  }

  /**
   * Restore database backup
   */
  async restoreDatabase(backupId: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, 'database', `${backupId}.sql.gz`)

      // Check if backup exists
      await fs.access(backupPath)

      logInfo('Restoring database backup', { backupId })

      // Extract database connection details
      const dbUrl = env.DATABASE_URL
      const dbUrlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)

      if (!dbUrlMatch) {
        throw new Error('Invalid DATABASE_URL format')
      }

      const [, user, password, host, port, database] = dbUrlMatch

      // Use psql to restore backup
      const command = `gunzip -c ${backupPath} | PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database}`

      await execAsync(command)

      logInfo('Database backup restored', { backupId })
    } catch (error) {
      logError('Failed to restore database backup', error)
      throw error
    }
  }

  /**
   * Create container volume backup
   */
  async backupContainer(containerId: string): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    try {
      const container = await prisma.container.findUnique({
        where: { id: containerId },
      })

      if (!container) {
        throw new Error('Container not found')
      }

      const backupName = `${container.name}-${timestamp}`
      const backupPath = path.join(this.backupDir, 'containers', `${backupName}.tar.gz`)

      logInfo('Creating container backup', { containerId, name: container.name })

      // Docker export container
      const command = `docker export ${container.dockerId} | gzip > ${backupPath}`

      await execAsync(command)

      // Get file size
      const stats = await fs.stat(backupPath)

      const backup: Backup = {
        id: backupName,
        type: 'container',
        name: backupName,
        path: backupPath,
        size: stats.size,
        createdAt: new Date(),
        metadata: {
          containerId: container.id,
          containerName: container.name,
          dockerId: container.dockerId,
        },
      }

      logInfo('Container backup created', {
        name: backupName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      })

      return backup
    } catch (error) {
      logError('Failed to create container backup', error)
      throw error
    }
  }

  /**
   * Create configuration backup
   */
  async backupConfiguration(): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `config-${timestamp}`
    const backupPath = path.join(this.backupDir, 'config', `${backupName}.tar.gz`)

    try {
      logInfo('Creating configuration backup')

      // Backup important configuration files
      const configPaths = [
        '/etc/traefik',
        '/etc/letsencrypt',
        '/var/lib/openpanel/config',
      ]

      const existingPaths = []
      for (const configPath of configPaths) {
        try {
          await fs.access(configPath)
          existingPaths.push(configPath)
        } catch {
          // Path doesn't exist, skip
        }
      }

      if (existingPaths.length === 0) {
        throw new Error('No configuration paths found to backup')
      }

      const command = `tar -czf ${backupPath} ${existingPaths.join(' ')}`

      await execAsync(command)

      // Get file size
      const stats = await fs.stat(backupPath)

      const backup: Backup = {
        id: backupName,
        type: 'configuration',
        name: backupName,
        path: backupPath,
        size: stats.size,
        createdAt: new Date(),
        metadata: {
          paths: existingPaths,
        },
      }

      logInfo('Configuration backup created', {
        name: backupName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      })

      return backup
    } catch (error) {
      logError('Failed to create configuration backup', error)
      throw error
    }
  }

  /**
   * Create full system backup
   */
  async backupFull(): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `full-${timestamp}`

    try {
      logInfo('Creating full system backup')

      // Create all backups
      const [database, config] = await Promise.all([
        this.backupDatabase(`full-db-${timestamp}`),
        this.backupConfiguration(),
      ])

      // Backup all containers
      const containers = await prisma.container.findMany({
        where: {
          status: {
            in: ['RUNNING', 'CREATED', 'PAUSED'],
          },
        },
      })

      const containerBackups = await Promise.all(
        containers.map((container) => this.backupContainer(container.id))
      )

      const totalSize = database.size + config.size + containerBackups.reduce((sum, b) => sum + b.size, 0)

      const backup: Backup = {
        id: backupName,
        type: 'full',
        name: backupName,
        path: path.join(this.backupDir, 'full'),
        size: totalSize,
        createdAt: new Date(),
        metadata: {
          database: database.id,
          config: config.id,
          containers: containerBackups.map((b) => b.id),
          totalBackups: 2 + containerBackups.length,
        },
      }

      logInfo('Full system backup created', {
        name: backupName,
        size: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        backups: backup.metadata?.totalBackups,
      })

      return backup
    } catch (error) {
      logError('Failed to create full system backup', error)
      throw error
    }
  }

  /**
   * List all backups
   */
  async listBackups(type?: 'database' | 'container' | 'configuration' | 'full'): Promise<Backup[]> {
    try {
      const backups: Backup[] = []

      const types = type ? [type] : ['database', 'container', 'configuration', 'full']

      for (const backupType of types) {
        const typePath = path.join(this.backupDir, backupType === 'configuration' ? 'config' : backupType)

        try {
          const files = await fs.readdir(typePath)

          for (const file of files) {
            const filePath = path.join(typePath, file)
            const stats = await fs.stat(filePath)

            backups.push({
              id: file.replace(/\.(sql\.gz|tar\.gz)$/, ''),
              type: backupType as Backup['type'],
              name: file,
              path: filePath,
              size: stats.size,
              createdAt: stats.mtime,
            })
          }
        } catch {
          // Directory doesn't exist or is empty
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      return backups
    } catch (error) {
      logError('Failed to list backups', error)
      throw error
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backups = await this.listBackups()
      const backup = backups.find((b) => b.id === backupId)

      if (!backup) {
        throw new Error('Backup not found')
      }

      await fs.unlink(backup.path)

      logInfo('Backup deleted', { backupId })
    } catch (error) {
      logError('Failed to delete backup', error)
      throw error
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    try {
      logInfo('Cleaning up old backups', { retentionDays })

      const backups = await this.listBackups()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      let deletedCount = 0

      for (const backup of backups) {
        if (backup.createdAt < cutoffDate) {
          await this.deleteBackup(backup.id)
          deletedCount++
        }
      }

      logInfo('Old backups cleaned up', { deletedCount, retentionDays })

      return deletedCount
    } catch (error) {
      logError('Failed to cleanup old backups', error)
      throw error
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    total: number
    byType: Record<string, number>
    totalSize: number
    oldestBackup?: Date
    newestBackup?: Date
  }> {
    try {
      const backups = await this.listBackups()

      const stats = {
        total: backups.length,
        byType: {
          database: backups.filter((b) => b.type === 'database').length,
          container: backups.filter((b) => b.type === 'container').length,
          configuration: backups.filter((b) => b.type === 'configuration').length,
          full: backups.filter((b) => b.type === 'full').length,
        },
        totalSize: backups.reduce((sum, b) => sum + b.size, 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : undefined,
        newestBackup: backups.length > 0 ? backups[0].createdAt : undefined,
      }

      return stats
    } catch (error) {
      logError('Failed to get backup stats', error)
      throw error
    }
  }
}
