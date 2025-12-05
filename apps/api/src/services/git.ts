import { spawn } from 'child_process'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logWarn } from '../lib/logger'
import { WebhookParser, WebhookPayload } from './git/types'
import { GitHubParser } from './git/parsers/github'
import { GitLabParser } from './git/parsers/gitlab'
import { BitbucketParser } from './git/parsers/bitbucket'

interface GitCloneOptions {
  url: string
  branch?: string
  targetDir?: string
  depth?: number
}

export class GitService {
  private static instance: GitService
  private workspacePath: string
  public parsers: {
    github: WebhookParser
    gitlab: WebhookParser
    bitbucket: WebhookParser
  }

  private constructor() {
    this.workspacePath = process.env.GIT_WORKSPACE_PATH || '/tmp/openpanel/git'
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true })
    }

    this.parsers = {
      github: new GitHubParser(),
      gitlab: new GitLabParser(),
      bitbucket: new BitbucketParser(),
    }
  }

  public static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService()
    }
    return GitService.instance
  }

  async clone(options: GitCloneOptions): Promise<string> {
    const { url, branch = 'main', targetDir, depth = 1 } = options
    const dirName = targetDir || `repo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const clonePath = path.join(this.workspacePath, dirName)

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
    } catch (error: unknown) {
      if (await this.exists(clonePath)) {
        await fsp.rm(clonePath, { recursive: true, force: true })
      }
      throw error
    }
  }

  async pull(repoPath: string, branch = 'main'): Promise<void> {
    await this.runGitCommand(['checkout', branch], repoPath)
    await this.runGitCommand(['pull', 'origin', branch], repoPath)
  }

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

  async cleanup(olderThanDays = 7): Promise<number> {
    let cleaned = 0
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000

    try {
      const entries = await fsp.readdir(this.workspacePath)

      for (const entry of entries) {
        const entryPath = path.join(this.workspacePath, entry)
        try {
          const stats = await fsp.stat(entryPath)
          if (stats.isDirectory() && stats.mtimeMs < cutoffTime) {
            await fsp.rm(entryPath, { recursive: true, force: true })
            cleaned++
          }
        } catch (error) {
          logError(`Failed to cleanup ${entryPath}`, error)
        }
      }
    } catch (error) {
      logError('Failed to read workspace directory', error)
    }

    return cleaned
  }

  async handleWebhookEvent(
    payload: WebhookPayload
  ): Promise<{
    triggered: number
    deployments?: Array<{
      id: string
      projectId: string
      version: string
      status: string
      gitCommitHash?: string | null
      gitCommitMessage?: string | null
      gitAuthor?: string | null
      createdAt: Date
    }>
  }> {
    const branch = payload.ref.replace('refs/heads/', '')

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

    for (const project of projects) {
      try {
        const latestCommit = payload.commits[payload.commits.length - 1]

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

  private async exists(path: string): Promise<boolean> {
    try {
      await fsp.access(path)
      return true
    } catch {
      return false
    }
  }
}

export const gitService = GitService.getInstance()