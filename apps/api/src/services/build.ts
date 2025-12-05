import Docker from 'dockerode'
import { prisma } from '../lib/prisma'
import { dockerService } from './docker'
import { logInfo, logError, logWarn } from '../lib/logger'
import { BuildOptions, BuildResult, BuildStrategy } from './build/strategies/types'
import { DockerBuildStrategy } from './build/strategies/docker'
import { NixpacksBuildStrategy } from './build/strategies/nixpacks'

export class BuildService {
  private docker: Docker
  private static instance: BuildService
  private strategies: Record<string, BuildStrategy>

  private constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
    this.strategies = {
      dockerfile: new DockerBuildStrategy(),
      nixpacks: new NixpacksBuildStrategy(),
      // Add Paketo and others when implemented
    }
  }

  public static getInstance(): BuildService {
    if (!BuildService.instance) {
      BuildService.instance = new BuildService()
    }
    return BuildService.instance
  }

  async build(options: BuildOptions): Promise<BuildResult> {
    const { source } = options
    const strategy = this.strategies[source]

    if (!strategy) {
      // Fallback or error
      if (source === 'image') {
        // Keep pullImage logic here or extract to ImageStrategy
        return this.pullImage(options)
      }
      throw new Error(`Unsupported build source: ${source}`)
    }

    return strategy.build(options)
  }

  async detectProjectType(context: string): Promise<{
    type: string
    buildpack: 'dockerfile' | 'nixpacks' | 'paketo'
  }> {
    // Try explicit strategies first
    if (await this.strategies.dockerfile.detect(context)) {
      return { type: 'docker', buildpack: 'dockerfile' }
    }

    // Fallback to Nixpacks detection (broad support)
    if (await this.strategies.nixpacks.detect(context)) {
      return { type: 'detected', buildpack: 'nixpacks' }
    }

    return { type: 'unknown', buildpack: 'nixpacks' }
  }

  // Legacy method kept for backward compatibility or refactor later to ImageStrategy
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

      await dockerService.pullImage(fullImageName, (progress: unknown) => {
        const progressData = progress as { status?: string }
        if (progressData.status) {
          logs += `${progressData.status}\n`
        }
      })

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
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logs += `\nError: ${errorMessage}`

      return {
        success: false,
        logs,
        duration,
        error: errorMessage,
      }
    }
  }

  async createDeployment(options: BuildOptions): Promise<{
    id: string
    projectId: string
    version: string
    status: string
    gitCommitHash?: string | null
    gitUrl?: string | null
    gitBranch?: string | null
    startedAt: Date | null
  }> {
    const { projectId, gitCommitHash, gitUrl, gitBranch } = options

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

    this.executeBuild(deployment.id, options).catch((error) => {
      logError(`Build failed for deployment ${deployment.id}`, error, {
        deploymentId: deployment.id,
      })
    })

    return deployment
  }

  private async executeBuild(deploymentId: string, options: BuildOptions) {
    const startTime = Date.now()

    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { project: { include: { envVars: true } } },
      })

      if (!deployment || !deployment.project) {
        throw new Error('Deployment or project not found')
      }

      const project = deployment.project

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILDING' },
      })

      const result = await this.build(options)

      if (!result.success) {
        throw new Error(result.error || 'Build failed')
      }

      const buildDuration = Date.now() - startTime
      const imageName = result.imageTag?.split(':')[0] || options.image || `${project.slug}-app`
      const imageTag = result.imageTag?.split(':')[1] || options.tag || 'latest'

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DEPLOYING',
          buildLogs: result.logs,
          buildDuration,
        },
      })

      logInfo(`Deploying container for project ${project.slug}`, {
        projectSlug: project.slug,
        projectId: project.id,
      })

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

      const containerName = `${project.slug}-${Date.now()}`
      const containerConfig = {
        name: containerName,
        image: imageName,
        tag: imageTag,
        projectId: project.id,
        env: project.envVars.reduce((acc: Record<string, string>, curr: typeof project.envVars[0]) => ({ ...acc, [curr.key]: curr.value }), {}) as Record<string, string>,
      }

      const newContainer = await dockerService.createContainer(containerConfig)
      await dockerService.startContainer(newContainer.dockerId)

      logInfo(`Container deployed successfully: ${newContainer.dockerId}`, {
        dockerId: newContainer.dockerId,
        projectId: project.id,
      })

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
        },
      })
    } catch (error: unknown) {
      logError(`Build execution error`, error, {
        deploymentId,
      })

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
}

export const buildService = BuildService.getInstance()
