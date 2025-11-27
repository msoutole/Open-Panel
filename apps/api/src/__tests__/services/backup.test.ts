import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { BackupService } from '../../services/backup'
import fs from 'fs/promises'
import { exec } from 'child_process'

// Mock dependencies
vi.mock('child_process')
vi.mock('fs/promises')
vi.mock('../../lib/prisma', () => ({
  prisma: {
    container: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))
vi.mock('../../lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://testuser:testpass@localhost:5432/testdb',
  },
}))

describe('BackupService', () => {
  let backupService: BackupService

  beforeEach(() => {
    backupService = BackupService.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialize', () => {
    it('should create backup directories', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)

      await backupService.initialize()

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('backups'),
        { recursive: true }
      )
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('database'),
        { recursive: true }
      )
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('containers'),
        { recursive: true }
      )
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('config'),
        { recursive: true }
      )
    })

    it('should handle initialization errors', async () => {
      const error = new Error('Permission denied')
      vi.mocked(fs.mkdir).mockRejectedValue(error)

      await expect(backupService.initialize()).rejects.toThrow('Permission denied')
    })
  })

  describe('backupDatabase', () => {
    it('should create database backup successfully', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: 'Success', stderr: '' })
      })
      vi.mocked(exec).mockImplementation(mockExec as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
      } as any)

      const backup = await backupService.backupDatabase('test-backup')

      expect(backup).toMatchObject({
        type: 'database',
        name: 'test-backup',
        size: 1024000,
      })
      expect(backup.metadata?.compressed).toBe(true)
    })

    it('should handle backup failure', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(new Error('pg_dump failed'), null)
      })
      vi.mocked(exec).mockImplementation(mockExec as any)

      await expect(backupService.backupDatabase()).rejects.toThrow()
    })

    it('should use custom backup name', async () => {
      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: 'Success', stderr: '' })
      })
      vi.mocked(exec).mockImplementation(mockExec as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
      } as any)

      const backup = await backupService.backupDatabase('custom-name')

      expect(backup.name).toBe('custom-name')
    })
  })

  describe('restoreDatabase', () => {
    it('should restore database backup', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const mockExec = vi.fn((cmd, callback) => {
        callback(null, { stdout: 'Success', stderr: '' })
      })
      vi.mocked(exec).mockImplementation(mockExec as any)

      await expect(
        backupService.restoreDatabase('test-backup')
      ).resolves.not.toThrow()
    })

    it('should fail when backup does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'))

      await expect(
        backupService.restoreDatabase('non-existent')
      ).rejects.toThrow()
    })

    it('should handle restore failure', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const mockExec = vi.fn((cmd, callback) => {
        callback(new Error('psql failed'), null)
      })
      vi.mocked(exec).mockImplementation(mockExec as any)

      await expect(
        backupService.restoreDatabase('test-backup')
      ).rejects.toThrow()
    })
  })

  describe('listBackups', () => {
    it('should list all backups', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'backup1.sql.gz',
        'backup2.sql.gz',
      ] as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
        mtime: new Date('2024-01-01'),
      } as any)

      const backups = await backupService.listBackups()

      expect(backups).toHaveLength(2)
      expect(backups[0]).toMatchObject({
        type: 'database',
        size: 1024000,
      })
    })

    it('should filter backups by type', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'db-backup.sql.gz',
      ] as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
        mtime: new Date(),
      } as any)

      const backups = await backupService.listBackups('database')

      expect(backups).toHaveLength(1)
      expect(backups[0].type).toBe('database')
    })

    it('should handle empty backup directory', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'))

      const backups = await backupService.listBackups()

      expect(backups).toHaveLength(0)
    })

    it('should sort backups by creation date (newest first)', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'old-backup.sql.gz',
        'new-backup.sql.gz',
      ] as any)

      let callCount = 0
      vi.mocked(fs.stat).mockImplementation(async () => {
        callCount++
        return {
          size: 1024000,
          mtime: callCount === 1 ? new Date('2024-01-01') : new Date('2024-02-01'),
        } as any
      })

      const backups = await backupService.listBackups()

      expect(backups[0].createdAt.getTime()).toBeGreaterThan(
        backups[1].createdAt.getTime()
      )
    })
  })

  describe('deleteBackup', () => {
    it('should delete existing backup', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'test-backup.sql.gz',
      ] as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
        mtime: new Date(),
      } as any)

      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      await expect(
        backupService.deleteBackup('test-backup')
      ).resolves.not.toThrow()

      expect(fs.unlink).toHaveBeenCalled()
    })

    it('should fail when backup does not exist', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([] as any)

      await expect(
        backupService.deleteBackup('non-existent')
      ).rejects.toThrow('Backup not found')
    })
  })

  describe('cleanupOldBackups', () => {
    it('should delete backups older than retention period', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 40) // 40 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10) // 10 days old

      vi.mocked(fs.readdir).mockResolvedValue([
        'old-backup.sql.gz',
        'recent-backup.sql.gz',
      ] as any)

      let callCount = 0
      vi.mocked(fs.stat).mockImplementation(async () => {
        callCount++
        return {
          size: 1024000,
          mtime: callCount === 1 ? oldDate : recentDate,
        } as any
      })

      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      const deletedCount = await backupService.cleanupOldBackups(30)

      expect(deletedCount).toBe(1)
      expect(fs.unlink).toHaveBeenCalledTimes(1)
    })

    it('should not delete recent backups', async () => {
      const recentDate = new Date()

      vi.mocked(fs.readdir).mockResolvedValue([
        'recent-backup.sql.gz',
      ] as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
        mtime: recentDate,
      } as any)

      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      const deletedCount = await backupService.cleanupOldBackups(30)

      expect(deletedCount).toBe(0)
      expect(fs.unlink).not.toHaveBeenCalled()
    })

    it('should use custom retention period', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 50) // 50 days old

      vi.mocked(fs.readdir).mockResolvedValue([
        'old-backup.sql.gz',
      ] as any)

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024000,
        mtime: oldDate,
      } as any)

      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      const deletedCount = await backupService.cleanupOldBackups(60)

      expect(deletedCount).toBe(0) // Should not delete (60 day retention)
    })
  })

  describe('getBackupStats', () => {
    it('should return backup statistics', async () => {
      const oldDate = new Date('2024-01-01')
      const newDate = new Date('2024-02-01')

      vi.mocked(fs.readdir).mockImplementation(async (path) => {
        if ((path as string).includes('database')) {
          return ['db1.sql.gz', 'db2.sql.gz'] as any
        }
        if ((path as string).includes('containers')) {
          return ['container1.tar.gz'] as any
        }
        return [] as any
      })

      let callCount = 0
      vi.mocked(fs.stat).mockImplementation(async () => {
        callCount++
        return {
          size: 1024000,
          mtime: callCount === 1 ? oldDate : newDate,
        } as any
      })

      const stats = await backupService.getBackupStats()

      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byType.database).toBeGreaterThan(0)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.oldestBackup).toBeDefined()
      expect(stats.newestBackup).toBeDefined()
    })

    it('should handle no backups', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'))

      const stats = await backupService.getBackupStats()

      expect(stats.total).toBe(0)
      expect(stats.totalSize).toBe(0)
      expect(stats.oldestBackup).toBeUndefined()
      expect(stats.newestBackup).toBeUndefined()
    })
  })
})
