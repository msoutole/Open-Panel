import Docker from 'dockerode'
import { prisma } from '../lib/prisma'
import { dockerService } from './docker'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import * as tar from 'tar-fs'
import { logInfo, logError, logWarn } from '../lib/logger'

interface BuildOptions {
  projectId: string
  source: 'dockerfile' | 'nixpacks' | 'paketo' | 'heroku' | 'image'
  context?: string // Path to build context
  dockerfile?: string // Path to Dockerfile (relative to context)
  image?: string // For source='image', pull from registry
  tag?: string
  buildArgs?: Record<string, string>
  envVars?: Record<string, string>
  gitUrl?: string
  gitBranch?: string
  gitCommitHash?: string
}

interface BuildResult {
  success: boolean
  imageId?: string
  imageTag?: string
  logs: string
  duration: number
  error?: string
}

/**
 * BuildService - Manages application builds using various buildpacks
 */
export class BuildService {
  private docker: Docker
  private static instance: BuildService

  private constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
  }

  public static getInstance(): BuildService {
    if (!BuildService.instance) {
      BuildService.instance = new BuildService()
    }
    return BuildService.instance
  }

  /**
   * Build from Dockerfile
   */
  async buildFromDockerfile(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { projectId, context, dockerfile = 'Dockerfile', tag, buildArgs } = options

      if (!context) {
        throw new Error('Build context is required for Dockerfile builds')
      }

      // Verify context exists
      if (!fs.existsSync(context)) {
        throw new Error(`Build context not found: ${context}`)
      }

      // Verify Dockerfile exists
      const dockerfilePath = path.join(context, dockerfile)
      if (!fs.existsSync(dockerfilePath)) {
        throw new Error(`Dockerfile not found: ${dockerfilePath}`)
      }

      // Create tar stream from context
      const tarStream = tar.pack(context, {
        ignore: (name: string) => {
          // Ignore common unnecessary files
          const ignored = ['.git', 'node_modules', '.env', '.DS_Store', 'dist', 'build']
          return ignored.some((pattern) => name.includes(pattern))
        },
      })

      // Prepare build options
      const imageName = `openpanel/${projectId}`
      const imageTag = tag || `build-${Date.now()}`
      const fullImageName = `${imageName}:${imageTag}`

      // Build image
      const stream = await this.docker.buildImage(tarStream, {
        t: fullImageName,
        dockerfile: dockerfile,
        buildargs: buildArgs,
        nocache: false,
      })

      // Collect logs
      logs = await this.collectBuildLogs(stream)

      // Get image info
      const image = this.docker.getImage(fullImageName)
      const imageInfo = await image.inspect()

      const duration = Date.now() - startTime

      return {
        success: true,
        imageId: imageInfo.Id,
        imageTag: fullImageName,
        logs,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      logs += `\nError: ${error.message}`

      return {
        success: false,
        logs,
        duration,
        error: error.message,
      }
    }
  }

  /**
   * Build using Nixpacks
   * Supports 14+ languages: Node.js, Python, Go, Rust, PHP, Ruby, etc.
   */
  async buildWithNixpacks(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { projectId, context, tag, envVars } = options

      if (!context) {
        throw new Error('Build context is required for Nixpacks builds')
      }

      // Check if nixpacks is installed
      const nixpacksInstalled = await this.checkNixpacksInstalled()
      if (!nixpacksInstalled) {
        throw new Error(
          'Nixpacks is not installed. Install with: curl -sSL https://nixpacks.com/install.sh | bash'
        )
      }

      const imageName = `openpanel/${projectId}`
      const imageTag = tag || `nixpacks-${Date.now()}`
      const fullImageName = `${imageName}:${imageTag}`

      // Prepare environment variables
      const envArgs: string[] = []
      if (envVars) {
        Object.entries(envVars).forEach(([key, value]) => {
          envArgs.push('--env', `${key}=${value}`)
        })
      }

      // Build with Nixpacks
      const nixpacksArgs = [
        'build',
        context,
        '--name',
        fullImageName,
        ...envArgs,
      ]

      logs = await this.runCommand('nixpacks', nixpacksArgs)

      // Verify image was created
      const image = this.docker.getImage(fullImageName)
      const imageInfo = await image.inspect()

      const duration = Date.now() - startTime

      return {
        success: true,
        imageId: imageInfo.Id,
        imageTag: fullImageName,
        logs,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      logs += `\nError: ${error.message}`

      return {
        success: false,
        logs,
        duration,
        error: error.message,
      }
    }
  }

  /**
   * Build using Paketo Buildpacks
   * Enterprise-grade buildpacks for Java, .NET, Node.js, etc.
   */
  async buildWithPaketo(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { projectId, context, tag, envVars } = options

      if (!context) {
        throw new Error('Build context is required for Paketo builds')
      }

      // Check if pack CLI is installed
      const packInstalled = await this.checkPackInstalled()
      if (!packInstalled) {
        throw new Error(
          'Pack CLI is not installed. Install from: https://buildpacks.io/docs/tools/pack/'
        )
      }

      const imageName = `openpanel/${projectId}`
      const imageTag = tag || `paketo-${Date.now()}`
      const fullImageName = `${imageName}:${imageTag}`

      // Prepare environment variables
      const envArgs: string[] = []
      if (envVars) {
        Object.entries(envVars).forEach(([key, value]) => {
          envArgs.push('--env', `${key}=${value}`)
        })
      }

      // Build with Pack using Paketo buildpacks
      const packArgs = [
        'build',
        fullImageName,
        '--path',
        context,
        '--builder',
        'paketobuildpacks/builder:base',
        ...envArgs,
      ]

      logs = await this.runCommand('pack', packArgs)

      // Verify image was created
      const image = this.docker.getImage(fullImageName)
      const imageInfo = await image.inspect()

      const duration = Date.now() - startTime

      return {
        success: true,
        imageId: imageInfo.Id,
        imageTag: fullImageName,
        logs,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      logs += `\nError: ${error.message}`

      return {
        success: false,
        logs,
        duration,
        error: error.message,
      }
    }
  }

  /**
   * Pull image from registry
   */
  async pullImage(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { image, tag = 'latest' } = options

      if (!image) {
        throw new Error('Image name is required')
      }

      const fullImageName = `${image}:${tag}`

      logs = `Pulling image ${fullImageName}...\n`

      await dockerService.pullImage(fullImageName, (progress) => {
        if (progress.status) {
          logs += `${progress.status}\n`
        }
      })

      // Get image info
      const dockerImage = this.docker.getImage(fullImageName)
      const imageInfo = await dockerImage.inspect()

      const duration = Date.now() - startTime

      return {
        success: true,
        imageId: imageInfo.Id,
        imageTag: fullImageName,
        logs,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      logs += `\nError: ${error.message}`

      return {
        success: false,
        logs,
        duration,
        error: error.message,
      }
    }
  }

  /**
   * Auto-detect project type and choose appropriate buildpack
   */
  async detectProjectType(context: string): Promise<{
    type: string
    buildpack: 'dockerfile' | 'nixpacks' | 'paketo'
  }> {
    // Check for Dockerfile
    if (fs.existsSync(path.join(context, 'Dockerfile'))) {
      return { type: 'docker', buildpack: 'dockerfile' }
    }

    // Check for package.json (Node.js)
    if (fs.existsSync(path.join(context, 'package.json'))) {
      return { type: 'nodejs', buildpack: 'nixpacks' }
    }

    // Check for requirements.txt (Python)
    if (fs.existsSync(path.join(context, 'requirements.txt'))) {
      return { type: 'python', buildpack: 'nixpacks' }
    }

    // Check for go.mod (Go)
    if (fs.existsSync(path.join(context, 'go.mod'))) {
      return { type: 'go', buildpack: 'nixpacks' }
    }

    // Check for Cargo.toml (Rust)
    if (fs.existsSync(path.join(context, 'Cargo.toml'))) {
      return { type: 'rust', buildpack: 'nixpacks' }
    }

    // Check for composer.json (PHP)
    if (fs.existsSync(path.join(context, 'composer.json'))) {
      return { type: 'php', buildpack: 'nixpacks' }
    }

    // Check for pom.xml or build.gradle (Java)
    if (
      fs.existsSync(path.join(context, 'pom.xml')) ||
      fs.existsSync(path.join(context, 'build.gradle'))
    ) {
      return { type: 'java', buildpack: 'paketo' }
    }

    // Check for .csproj (C#/.NET)
    const files = fs.readdirSync(context)
    if (files.some((file) => file.endsWith('.csproj'))) {
      return { type: 'dotnet', buildpack: 'paketo' }
    }

    // Default to Nixpacks
    return { type: 'unknown', buildpack: 'nixpacks' }
  }

  /**
   * Main build method - automatically chooses buildpack
   */
  async build(options: BuildOptions): Promise<BuildResult> {
    const { source } = options

    switch (source) {
      case 'dockerfile':
        return this.buildFromDockerfile(options)
      case 'nixpacks':
        return this.buildWithNixpacks(options)
      case 'paketo':
        return this.buildWithPaketo(options)
      case 'image':
        return this.pullImage(options)
      default:
        throw new Error(`Unsupported build source: ${source}`)
    }
  }

  /**
   * Create deployment record and start build
   */
  async createDeployment(options: BuildOptions): Promise<any> {
    const { projectId, gitCommitHash, gitUrl, gitBranch } = options

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        version: `v${Date.now()}`,
        status: 'BUILDING',
        gitCommitHash,
        gitUrl,
        gitBranch,
        startedAt: new Date(),
      },
    })

    // Start build (async)
    this.executeBuild(deployment.id, options).catch((error) => {
      logError(`Build failed for deployment ${deployment.id}`, error, {
        deploymentId: deployment.id,
      })
    })

    return deployment
  }

  /**
   * Execute build and update deployment record
   */
  private async executeBuild(deploymentId: string, options: BuildOptions) {
    const startTime = Date.now()

    try {
      // Get deployment and project info
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { project: { include: { envVars: true } } },
      })

      if (!deployment || !deployment.project) {
        throw new Error('Deployment or project not found')
      }

      const project = deployment.project

      // Update status to BUILDING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILDING' },
      })

      // Build image
      const result = await this.build(options)

      if (!result.success) {
        throw new Error(result.error || 'Build failed')
      }

      const buildDuration = Date.now() - startTime

      // Extract image info from result
      const imageName = result.imageId || options.image || `${project.slug}-app`
      const imageTag = result.imageTag || options.tag || 'latest'

      // Update deployment with build results
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DEPLOYING',
          buildLogs: result.logs,
          buildDuration,
        },
      })

      // Deploy container
      logInfo(`Deploying container for project ${project.slug}`, {
        projectSlug: project.slug,
        projectId: project.id,
      })

      // Stop existing container if any
      const existingContainers = await prisma.container.findMany({
        where: { projectId: project.id },
      })

      for (const existingContainer of existingContainers) {
        try {
          logInfo(`Stopping existing container: ${existingContainer.dockerId}`, {
            dockerId: existingContainer.dockerId,
          })
          await dockerService.stopContainer(existingContainer.dockerId, 30)
          await dockerService.removeContainer(existingContainer.dockerId, true)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logWarn(`Failed to remove existing container: ${errorMessage}`, {
            dockerId: existingContainer.dockerId,
            error: errorMessage,
          })
        }
      }

      // Create and start new container
      const containerName = `${project.slug}-${Date.now()}`
      const containerConfig = {
        name: containerName,
        image: imageName,
        tag: imageTag,
        projectId: project.id,
        env: project.envVars.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}) as Record<string, string>,
      }

      const newContainer = await dockerService.createContainer(containerConfig)
      await dockerService.startContainer(newContainer.dockerId)

      logInfo(`Container deployed successfully: ${newContainer.dockerId}`, {
        dockerId: newContainer.dockerId,
        projectId: project.id,
      })

      // Mark as SUCCESS
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
        },
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logError(`Build execution error`, error, {
        deploymentId,
      })

      // Mark as FAILED
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'FAILED',
          buildLogs: (error as Error).message,
          completedAt: new Date(),
        },
      })
    }
  }

  /**
   * Helper: Collect logs from Docker build stream
   */
  private async collectBuildLogs(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      let logs = ''

      stream.on('data', (chunk) => {
        const data = chunk.toString()
        try {
          const json = JSON.parse(data)
          if (json.stream) {
            logs += json.stream
          } else if (json.error) {
            logs += `ERROR: ${json.error}\n`
          }
        } catch {
          logs += data
        }
      })

      stream.on('end', () => {
        resolve(logs)
      })

      stream.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Helper: Run command and collect output
   */
  private async runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = ''
      let errorOutput = ''

      const proc = spawn(command, args, {
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
          resolve(output + errorOutput)
        } else {
          reject(new Error(`Command failed with code ${code}\n${errorOutput}`))
        }
      })

      proc.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Helper: Check if Nixpacks is installed
   */
  private async checkNixpacksInstalled(): Promise<boolean> {
    try {
      await this.runCommand('nixpacks', ['--version'])
      return true
    } catch {
      return false
    }
  }

  /**
   * Helper: Check if Pack CLI is installed
   */
  private async checkPackInstalled(): Promise<boolean> {
    try {
      await this.runCommand('pack', ['version'])
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const buildService = BuildService.getInstance()
