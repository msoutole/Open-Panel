import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logWarn } from '../lib/logger'

interface GitCloneOptions {
  url: string
  branch?: string
  targetDir?: string
  depth?: number // Shallow clone depth
}

interface WebhookPayload {
  repository: {
    url: string
    fullName: string
  }
  ref: string // refs/heads/main
  commits: Array<{
    id: string
    message: string
    author: {
      name: string
      email: string
    }
    timestamp: string
  }>
  pusher: {
    name: string
    email: string
  }
}

/**
 * GitService - Manages Git operations and webhooks
 */
export class GitService {
  private static instance: GitService
  private workspacePath: string

  private constructor() {
    // Create workspace directory for cloning repos
    this.workspacePath = process.env.GIT_WORKSPACE_PATH || '/tmp/openpanel/git'
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true })
    }
  }

  public static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService()
    }
    return GitService.instance
  }

  /**
   * Clone a Git repository
   */
  async clone(options: GitCloneOptions): Promise<string> {
    const { url, branch = 'main', targetDir, depth = 1 } = options

    // Generate unique directory name if not provided
    const dirName = targetDir || `repo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const clonePath = path.join(this.workspacePath, dirName)

    // Prepare git clone command
    const args = [
      'clone',
      '--depth',
      depth.toString(),
      '--branch',
      branch,
      '--single-branch',
      url,
      clonePath,
    ]

    try {
      await this.runGitCommand(args)
      return clonePath
    } catch (error: any) {
      // Clean up failed clone
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true })
      }
      throw error
    }
  }

  /**
   * Pull latest changes from a repository
   */
  async pull(repoPath: string, branch = 'main'): Promise<void> {
    // Checkout branch
    await this.runGitCommand(['checkout', branch], repoPath)
    // Pull changes
    await this.runGitCommand(['pull', 'origin', branch], repoPath)
  }

  /**
   * Get commit information
   */
  async getCommitInfo(repoPath: string): Promise<{
    hash: string
    message: string
    author: string
    date: string
  }> {
    const output = await this.runGitCommand(
      ['log', '-1', '--pretty=format:%H|%s|%an|%ai'],
      repoPath
    )

    const [hash, message, author, date] = output.trim().split('|')

    return { hash, message, author, date }
  }

  /**
   * Cleanup old repositories
   */
  async cleanup(olderThanDays = 7): Promise<number> {
    let cleaned = 0
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000

    const entries = fs.readdirSync(this.workspacePath)

    for (const entry of entries) {
      const entryPath = path.join(this.workspacePath, entry)
      const stats = fs.statSync(entryPath)

      if (stats.isDirectory() && stats.mtimeMs < cutoffTime) {
        try {
          fs.rmSync(entryPath, { recursive: true, force: true })
          cleaned++
        } catch (error) {
          logError(`Failed to cleanup ${entryPath}`, error)
        }
      }
    }

    return cleaned
  }

  /**
   * Verify webhook signature (GitHub)
   */
  verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  }

  /**
   * Verify webhook signature (GitLab)
   */
  verifyGitLabSignature(token: string, secret: string): boolean {
    return token === secret
  }

  /**
   * Parse GitHub webhook payload
   */
  parseGitHubWebhook(payload: any): WebhookPayload | null {
    try {
      // GitHub push event
      if (!payload.ref || !payload.repository) {
        return null
      }

      return {
        repository: {
          url: payload.repository.clone_url || payload.repository.url,
          fullName: payload.repository.full_name,
        },
        ref: payload.ref,
        commits: (payload.commits || []).map((commit: any) => ({
          id: commit.id,
          message: commit.message,
          author: {
            name: commit.author.name,
            email: commit.author.email,
          },
          timestamp: commit.timestamp,
        })),
        pusher: {
          name: payload.pusher.name,
          email: payload.pusher.email,
        },
      }
    } catch (error) {
      logError('Failed to parse GitHub webhook', error)
      return null
    }
  }

  /**
   * Parse GitLab webhook payload
   */
  parseGitLabWebhook(payload: any): WebhookPayload | null {
    try {
      // GitLab push event
      if (!payload.ref || !payload.project) {
        return null
      }

      return {
        repository: {
          url: payload.project.git_http_url,
          fullName: payload.project.path_with_namespace,
        },
        ref: payload.ref,
        commits: (payload.commits || []).map((commit: any) => ({
          id: commit.id,
          message: commit.message,
          author: {
            name: commit.author.name,
            email: commit.author.email,
          },
          timestamp: commit.timestamp,
        })),
        pusher: {
          name: payload.user_name,
          email: payload.user_email,
        },
      }
    } catch (error) {
      logError('Failed to parse GitLab webhook', error)
      return null
    }
  }

  /**
   * Parse Bitbucket webhook payload
   */
  parseBitbucketWebhook(payload: any): WebhookPayload | null {
    try {
      // Bitbucket push event
      if (!payload.push || !payload.repository) {
        return null
      }

      const change = payload.push.changes[0]
      if (!change) {
        return null
      }

      return {
        repository: {
          url: payload.repository.links.html.href,
          fullName: payload.repository.full_name,
        },
        ref: `refs/heads/${change.new.name}`,
        commits: (change.commits || []).map((commit: any) => ({
          id: commit.hash,
          message: commit.message,
          author: {
            name: commit.author.raw.split('<')[0].trim(),
            email: commit.author.raw.match(/<(.+)>/)?.[1] || '',
          },
          timestamp: commit.date,
        })),
        pusher: {
          name: payload.actor.display_name,
          email: '',
        },
      }
    } catch (error) {
      logError('Failed to parse Bitbucket webhook', error)
      return null
    }
  }

  /**
   * Handle webhook event and trigger deployment
   */
  async handleWebhookEvent(
    payload: WebhookPayload
  ): Promise<any> {
    // Extract branch from ref
    const branch = payload.ref.replace('refs/heads/', '')

    // Find projects with matching Git URL and auto-deploy enabled
    const projects = await prisma.project.findMany({
      where: {
        gitUrl: payload.repository.url,
        gitBranch: branch,
        gitAutoDeployEnabled: true,
      },
    })

    if (projects.length === 0) {
      logInfo(`No projects found for ${payload.repository.url} (${branch})`)
      return { triggered: 0 }
    }

    const deployments = []

    // Trigger deployment for each matching project
    for (const project of projects) {
      try {
        const latestCommit = payload.commits[payload.commits.length - 1]

        // Create deployment record
        const deployment = await prisma.deployment.create({
          data: {
            projectId: project.id,
            version: `v${Date.now()}`,
            status: 'PENDING',
            gitCommitHash: latestCommit?.id,
            gitCommitMessage: latestCommit?.message,
            gitAuthor: latestCommit?.author.name,
            createdAt: new Date(),
          },
        })

        deployments.push(deployment)

        logInfo(`Triggered deployment ${deployment.id} for project ${project.id}`, {
          deploymentId: deployment.id,
          projectId: project.id,
        })
      } catch (error) {
        logError(`Failed to trigger deployment for project ${project.id}`, error, {
          projectId: project.id,
        })
      }
    }

    return {
      triggered: deployments.length,
      deployments,
    }
  }

  /**
   * Helper: Run git command
   */
  private async runGitCommand(args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = ''
      let errorOutput = ''

      const proc = spawn('git', args, {
        cwd: cwd || this.workspacePath,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      proc.stdout.on('data', (data) => {
        output += data.toString()
      })

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Git command failed: ${errorOutput || output}`))
        }
      })

      proc.on('error', (error) => {
        reject(error)
      })
    })
  }
}

// Export singleton instance
export const gitService = GitService.getInstance()
