import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { gitService, GitService } from '../../services/git'
import { spawn } from 'child_process'
import fs from 'fs'
import crypto from 'crypto'

// Mock dependencies
vi.mock('child_process')
vi.mock('fs')
vi.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
    },
    deployment: {
      create: vi.fn(),
    },
  },
}))

describe('GitService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('clone', () => {
    it('should clone repository successfully', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback('Cloning...')
          }),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0)
        }),
      })
      vi.mocked(spawn).mockImplementation(mockSpawn as any)
      vi.mocked(fs.existsSync).mockReturnValue(true)

      const result = await gitService.clone({
        url: 'https://github.com/test/repo.git',
        branch: 'main',
      })

      expect(result).toContain('repo-')
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['clone', '--depth', '1']),
        expect.any(Object)
      )
    })

    it('should handle clone failure and cleanup', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback('fatal: repository not found')
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(128)
        }),
      })
      vi.mocked(spawn).mockImplementation(mockSpawn as any)
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.rmSync).mockImplementation(() => {})

      await expect(
        gitService.clone({
          url: 'https://github.com/invalid/repo.git',
        })
      ).rejects.toThrow()

      expect(fs.rmSync).toHaveBeenCalled()
    })

    it('should use custom branch and depth', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0)
        }),
      })
      vi.mocked(spawn).mockImplementation(mockSpawn as any)
      vi.mocked(fs.existsSync).mockReturnValue(true)

      await gitService.clone({
        url: 'https://github.com/test/repo.git',
        branch: 'develop',
        depth: 10,
      })

      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['--branch', 'develop', '--depth', '10']),
        expect.any(Object)
      )
    })
  })

  describe('pull', () => {
    it('should pull latest changes', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0)
        }),
      })
      vi.mocked(spawn).mockImplementation(mockSpawn as any)

      await gitService.pull('/tmp/test-repo', 'main')

      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        ['checkout', 'main'],
        expect.any(Object)
      )
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        ['pull', 'origin', 'main'],
        expect.any(Object)
      )
    })

    it('should handle pull errors', async () => {
      const mockSpawn = vi.fn().mockReturnValue({
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback('error: Your local changes would be overwritten')
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(1)
        }),
      })
      vi.mocked(spawn).mockImplementation(mockSpawn as any)

      await expect(gitService.pull('/tmp/test-repo')).rejects.toThrow()
    })
  })

  describe('getCommitInfo', () => {
    it('should return commit information', async () => {
      const mockOutput = 'abc123|feat: add feature|John Doe|2024-01-01 12:00:00'
      const mockSpawn = vi.fn().mockReturnValue({
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') callback(mockOutput)
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0)
        }),
      })
      vi.mocked(spawn).mockImplementation(mockSpawn as any)

      const result = await gitService.getCommitInfo('/tmp/test-repo')

      expect(result).toEqual({
        hash: 'abc123',
        message: 'feat: add feature',
        author: 'John Doe',
        date: '2024-01-01 12:00:00',
      })
    })
  })

  describe('cleanup', () => {
    it('should cleanup old repositories', async () => {
      const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days old

      vi.mocked(fs.readdirSync).mockReturnValue(['old-repo', 'new-repo'] as any)
      vi.mocked(fs.statSync).mockImplementation((path) => {
        const isOld = (path as string).includes('old-repo')
        return {
          isDirectory: () => true,
          mtimeMs: isOld ? oldTime : Date.now(),
        } as any
      })
      vi.mocked(fs.rmSync).mockImplementation(() => {})

      const cleaned = await gitService.cleanup(7)

      expect(cleaned).toBe(1)
      expect(fs.rmSync).toHaveBeenCalledTimes(1)
    })

    it('should not cleanup recent repositories', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['recent-repo'] as any)
      vi.mocked(fs.statSync).mockReturnValue({
        isDirectory: () => true,
        mtimeMs: Date.now(),
      } as any)
      vi.mocked(fs.rmSync).mockImplementation(() => {})

      const cleaned = await gitService.cleanup(7)

      expect(cleaned).toBe(0)
      expect(fs.rmSync).not.toHaveBeenCalled()
    })
  })

  describe('verifyGitHubSignature', () => {
    it('should verify valid GitHub webhook signature', () => {
      const secret = 'test-secret'
      const payload = '{"ref":"refs/heads/main"}'

      const hmac = crypto.createHmac('sha256', secret)
      const signature = 'sha256=' + hmac.update(payload).digest('hex')

      const result = gitService.verifyGitHubSignature(payload, signature, secret)

      expect(result).toBe(true)
    })

    it('should reject invalid GitHub webhook signature', () => {
      const secret = 'test-secret'
      const payload = '{"ref":"refs/heads/main"}'
      const invalidSignature = 'sha256=invalid'

      const result = gitService.verifyGitHubSignature(payload, invalidSignature, secret)

      expect(result).toBe(false)
    })
  })

  describe('verifyGitLabSignature', () => {
    it('should verify valid GitLab webhook token', () => {
      const secret = 'gitlab-token'
      const token = 'gitlab-token'

      const result = gitService.verifyGitLabSignature(token, secret)

      expect(result).toBe(true)
    })

    it('should reject invalid GitLab webhook token', () => {
      const secret = 'gitlab-token'
      const invalidToken = 'wrong-token'

      const result = gitService.verifyGitLabSignature(invalidToken, secret)

      expect(result).toBe(false)
    })
  })

  describe('parseGitHubWebhook', () => {
    it('should parse valid GitHub webhook payload', () => {
      const payload = {
        ref: 'refs/heads/main',
        repository: {
          clone_url: 'https://github.com/user/repo.git',
          full_name: 'user/repo',
        },
        commits: [
          {
            id: 'abc123',
            message: 'feat: add feature',
            author: { name: 'John', email: 'john@example.com' },
            timestamp: '2024-01-01T12:00:00Z',
          },
        ],
        pusher: { name: 'John', email: 'john@example.com' },
      }

      const result = gitService.parseGitHubWebhook(payload)

      expect(result).toEqual({
        repository: {
          url: 'https://github.com/user/repo.git',
          fullName: 'user/repo',
        },
        ref: 'refs/heads/main',
        commits: [
          {
            id: 'abc123',
            message: 'feat: add feature',
            author: { name: 'John', email: 'john@example.com' },
            timestamp: '2024-01-01T12:00:00Z',
          },
        ],
        pusher: { name: 'John', email: 'john@example.com' },
      })
    })

    it('should return null for invalid GitHub webhook', () => {
      const payload = { invalid: 'data' }

      const result = gitService.parseGitHubWebhook(payload)

      expect(result).toBeNull()
    })
  })

  describe('parseGitLabWebhook', () => {
    it('should parse valid GitLab webhook payload', () => {
      const payload = {
        ref: 'refs/heads/main',
        project: {
          git_http_url: 'https://gitlab.com/user/repo.git',
          path_with_namespace: 'user/repo',
        },
        commits: [
          {
            id: 'def456',
            message: 'fix: bug fix',
            author: { name: 'Jane', email: 'jane@example.com' },
            timestamp: '2024-01-01T13:00:00Z',
          },
        ],
        user_name: 'Jane',
        user_email: 'jane@example.com',
      }

      const result = gitService.parseGitLabWebhook(payload)

      expect(result).toEqual({
        repository: {
          url: 'https://gitlab.com/user/repo.git',
          fullName: 'user/repo',
        },
        ref: 'refs/heads/main',
        commits: [
          {
            id: 'def456',
            message: 'fix: bug fix',
            author: { name: 'Jane', email: 'jane@example.com' },
            timestamp: '2024-01-01T13:00:00Z',
          },
        ],
        pusher: { name: 'Jane', email: 'jane@example.com' },
      })
    })

    it('should return null for invalid GitLab webhook', () => {
      const payload = { invalid: 'data' }

      const result = gitService.parseGitLabWebhook(payload)

      expect(result).toBeNull()
    })
  })

  describe('parseBitbucketWebhook', () => {
    it('should parse valid Bitbucket webhook payload', () => {
      const payload = {
        push: {
          changes: [
            {
              new: { name: 'main' },
              commits: [
                {
                  hash: 'ghi789',
                  message: 'docs: update readme',
                  author: { raw: 'Bob <bob@example.com>' },
                  date: '2024-01-01T14:00:00Z',
                },
              ],
            },
          ],
        },
        repository: {
          links: { html: { href: 'https://bitbucket.org/user/repo' } },
          full_name: 'user/repo',
        },
        actor: { display_name: 'Bob' },
      }

      const result = gitService.parseBitbucketWebhook(payload)

      expect(result).toEqual({
        repository: {
          url: 'https://bitbucket.org/user/repo',
          fullName: 'user/repo',
        },
        ref: 'refs/heads/main',
        commits: [
          {
            id: 'ghi789',
            message: 'docs: update readme',
            author: { name: 'Bob', email: 'bob@example.com' },
            timestamp: '2024-01-01T14:00:00Z',
          },
        ],
        pusher: { name: 'Bob', email: '' },
      })
    })

    it('should return null for invalid Bitbucket webhook', () => {
      const payload = { invalid: 'data' }

      const result = gitService.parseBitbucketWebhook(payload)

      expect(result).toBeNull()
    })
  })
})
