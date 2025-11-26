import Docker from 'dockerode'
import { prisma } from '../lib/prisma'
import type { ContainerStatus } from '@prisma/client'
import { logWarn, logError } from '../lib/logger'

/**
 * DockerService - Manages Docker daemon integration
 * Provides methods for container lifecycle management, monitoring, and logging
 */
export class DockerService {
  private docker: Docker
  private static instance: DockerService

  private constructor() {
    // Initialize Docker connection
    // Try socket first (Unix/Linux), fallback to TCP (Windows/Remote)
    const isWindows = process.platform === 'win32'
    const defaultSocketPath = isWindows ? '//./pipe/docker_engine' : '/var/run/docker.sock'
    const socketPath = process.env.DOCKER_SOCKET_PATH || defaultSocketPath

    try {
      this.docker = new Docker({ socketPath })
    } catch (error) {
      logWarn('Failed to connect via socket, trying TCP...')
      this.docker = new Docker({
        host: process.env.DOCKER_HOST || 'localhost',
        port: parseInt(process.env.DOCKER_PORT || '2375'),
      })
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DockerService {
    if (!DockerService.instance) {
      DockerService.instance = new DockerService()
    }
    return DockerService.instance
  }

  /**
   * Check Docker daemon health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch (error) {
      logError('Docker health check failed', error)
      return false
    }
  }

  /**
   * Get Docker system info
   */
  async getSystemInfo() {
    return await this.docker.info()
  }

  /**
   * List all containers (running and stopped)
   */
  async listContainers(options?: { all?: boolean; filters?: Record<string, string[]> }) {
    const containers = await this.docker.listContainers({
      all: options?.all ?? true,
      filters: options?.filters,
    })

    return containers
  }

  /**
   * Get container by Docker ID
   */
  async getContainer(dockerId: string) {
    try {
      const container = this.docker.getContainer(dockerId)
      const inspect = await container.inspect()
      return inspect
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Create a new container
   */
  async createContainer(options: {
    name: string
    image: string
    tag?: string
    cmd?: string[]
    env?: Record<string, string>
    ports?: Array<{ host: number; container: number; protocol?: string }>
    volumes?: Array<{ source: string; target: string; mode?: string }>
    cpuLimit?: string
    memoryLimit?: string
    projectId?: string
  }) {
    const {
      name,
      image,
      tag = 'latest',
      cmd,
      env,
      ports,
      volumes,
      cpuLimit,
      memoryLimit,
      projectId,
    } = options

    const fullImage = `${image}:${tag}`

    // Pull image if not exists
    await this.pullImage(fullImage)

    // Prepare port bindings
    const portBindings: any = {}
    const exposedPorts: any = {}
    if (ports) {
      ports.forEach((port) => {
        const containerPort = `${port.container}/${port.protocol || 'tcp'}`
        exposedPorts[containerPort] = {}
        portBindings[containerPort] = [{ HostPort: port.host.toString() }]
      })
    }

    // Prepare volume bindings
    const binds: string[] = []
    if (volumes) {
      volumes.forEach((vol) => {
        binds.push(`${vol.source}:${vol.target}:${vol.mode || 'rw'}`)
      })
    }

    // Prepare environment variables
    const envVars: string[] = []
    if (env) {
      Object.entries(env).forEach(([key, value]) => {
        envVars.push(`${key}=${value}`)
      })
    }

    // Create container
    const container = await this.docker.createContainer({
      name,
      Image: fullImage,
      Cmd: cmd,
      Env: envVars,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
        Memory: this.parseMemoryLimit(memoryLimit),
        NanoCpus: this.parseCpuLimit(cpuLimit),
      },
    })

    const inspect = await container.inspect()

    // Save to database
    const dbContainer = await prisma.container.create({
      data: {
        dockerId: inspect.Id,
        name: inspect.Name.replace('/', ''),
        image,
        imageTag: tag,
        status: this.mapDockerStatus(inspect.State),
        command: cmd?.join(' '),
        cpuLimit,
        memoryLimit,
        ports: ports ? JSON.parse(JSON.stringify(ports)) : undefined,
        volumes: volumes ? JSON.parse(JSON.stringify(volumes)) : undefined,
        envVars: env ? JSON.parse(JSON.stringify(env)) : undefined,
        projectId,
        startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
        finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
        exitCode: inspect.State.ExitCode,
      },
    })

    return dbContainer
  }

  /**
   * Start a container
   */
  async startContainer(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    await container.start()

    // Update database
    await prisma.container.update({
      where: { dockerId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    return await container.inspect()
  }

  /**
   * Stop a container
   */
  async stopContainer(dockerId: string, timeout = 10) {
    const container = this.docker.getContainer(dockerId)
    await container.stop({ t: timeout })

    // Update database
    await prisma.container.update({
      where: { dockerId },
      data: {
        status: 'EXITED',
        finishedAt: new Date(),
      },
    })

    return await container.inspect()
  }

  /**
   * Restart a container
   */
  async restartContainer(dockerId: string, timeout = 10) {
    const container = this.docker.getContainer(dockerId)
    await container.restart({ t: timeout })

    // Update database
    await prisma.container.update({
      where: { dockerId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    return await container.inspect()
  }

  /**
   * Pause a container
   */
  async pauseContainer(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    await container.pause()

    await prisma.container.update({
      where: { dockerId },
      data: { status: 'PAUSED' },
    })

    return await container.inspect()
  }

  /**
   * Unpause a container
   */
  async unpauseContainer(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    await container.unpause()

    await prisma.container.update({
      where: { dockerId },
      data: { status: 'RUNNING' },
    })

    return await container.inspect()
  }

  /**
   * Remove a container
   */
  async removeContainer(dockerId: string, force = false) {
    const container = this.docker.getContainer(dockerId)
    await container.remove({ force })

    // Remove from database
    await prisma.container.delete({
      where: { dockerId },
    })

    return { success: true }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    dockerId: string,
    options?: {
      stdout?: boolean
      stderr?: boolean
      tail?: number
      since?: number
      until?: number
      timestamps?: boolean
    }
  ) {
    const container = this.docker.getContainer(dockerId)
    const logs = await container.logs({
      stdout: options?.stdout ?? true,
      stderr: options?.stderr ?? true,
      tail: options?.tail ?? 100,
      since: options?.since,
      until: options?.until,
      timestamps: options?.timestamps ?? true,
    })

    return logs.toString('utf-8')
  }

  /**
   * Stream container logs (for WebSocket)
   */
  async streamContainerLogs(
    dockerId: string,
    callback: (chunk: string) => void,
    options?: {
      stdout?: boolean
      stderr?: boolean
      follow?: boolean
      timestamps?: boolean
    }
  ) {
    const container = this.docker.getContainer(dockerId)
    const stream = await container.logs({
      stdout: options?.stdout ?? true,
      stderr: options?.stderr ?? true,
      follow: options?.follow ?? true,
      timestamps: options?.timestamps ?? true,
    } as any) as any

    stream.on('data', (chunk: any) => {
      callback(chunk.toString('utf-8'))
    })

    return stream
  }

  /**
   * Get container statistics (CPU, Memory, Network, etc.)
   */
  async getContainerStats(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    const stats = await container.stats({ stream: false })

    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100

    // Memory usage
    const memoryUsage = stats.memory_stats.usage || 0
    const memoryLimit = stats.memory_stats.limit || 0
    const memoryPercent = (memoryUsage / memoryLimit) * 100

    // Network I/O
    let networkRx = 0
    let networkTx = 0
    if (stats.networks) {
      Object.values(stats.networks).forEach((net: any) => {
        networkRx += net.rx_bytes || 0
        networkTx += net.tx_bytes || 0
      })
    }

    // Block I/O
    let blockRead = 0
    let blockWrite = 0
    if (stats.blkio_stats?.io_service_bytes_recursive) {
      stats.blkio_stats.io_service_bytes_recursive.forEach((item: any) => {
        if (item.op === 'read') blockRead += item.value
        if (item.op === 'write') blockWrite += item.value
      })
    }

    const result = {
      cpuPercent: parseFloat(cpuPercent.toFixed(2)),
      memoryUsage,
      memoryLimit,
      memoryPercent: parseFloat(memoryPercent.toFixed(2)),
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
    }

    // Update database with cached stats
    await prisma.container.update({
      where: { dockerId },
      data: {
        cpuUsage: result.cpuPercent,
        memoryUsage: BigInt(result.memoryUsage),
        networkRx: BigInt(result.networkRx),
        networkTx: BigInt(result.networkTx),
      },
    })

    return result
  }

  /**
   * Pull an image from registry
   */
  async pullImage(image: string, onProgress?: (progress: any) => void) {
    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err: any, stream: any) => {
        if (err) {
          reject(err)
          return
        }

        this.docker.modem.followProgress(
          stream,
          (err: any, output: any) => {
            if (err) {
              reject(err)
            } else {
              resolve(output)
            }
          },
          onProgress
        )
      })
    })
  }

  /**
   * List available images
   */
  async listImages() {
    return await this.docker.listImages()
  }

  /**
   * Remove an image
   */
  async removeImage(imageId: string, force = false) {
    const image = this.docker.getImage(imageId)
    return await image.remove({ force })
  }

  /**
   * Sync containers from Docker to database
   * Useful for initial sync or recovery
   */
  async syncContainers() {
    const dockerContainers = await this.listContainers({ all: true })
    const synced = []

    for (const container of dockerContainers) {
      const inspect = await this.getContainer(container.Id)
      if (!inspect) continue

      const existing = await prisma.container.findUnique({
        where: { dockerId: container.Id },
      })

      if (existing) {
        // Update existing
        await prisma.container.update({
          where: { dockerId: container.Id },
          data: {
            status: this.mapDockerStatus(inspect.State),
            startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
            finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
            exitCode: inspect.State.ExitCode,
          },
        })
      } else {
        // Create new
        await prisma.container.create({
          data: {
            dockerId: inspect.Id,
            name: inspect.Name.replace('/', ''),
            image: inspect.Config.Image.split(':')[0],
            imageTag: inspect.Config.Image.split(':')[1] || 'latest',
            status: this.mapDockerStatus(inspect.State),
            command: inspect.Config.Cmd?.join(' '),
            startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
            finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
            exitCode: inspect.State.ExitCode,
          },
        })
      }

      synced.push(container.Id)
    }

    return { synced: synced.length }
  }

  /**
   * Helper: Map Docker state to our ContainerStatus enum
   */
  private mapDockerStatus(state: any): ContainerStatus {
    if (state.Running) return 'RUNNING'
    if (state.Paused) return 'PAUSED'
    if (state.Restarting) return 'RESTARTING'
    if (state.Dead) return 'DEAD'
    if (state.Status === 'created') return 'CREATED'
    if (state.Status === 'removing') return 'REMOVING'
    return 'EXITED'
  }

  /**
   * Helper: Parse memory limit string to bytes
   */
  private parseMemoryLimit(limit?: string): number | undefined {
    if (!limit) return undefined

    const units: Record<string, number> = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    }

    const match = limit.toLowerCase().match(/^(\d+)([bkmg])?/)
    if (!match) return undefined

    const value = parseInt(match[1])
    const unit = match[2] || 'b'

    return value * units[unit]
  }

  /**
   * Helper: Parse CPU limit string to NanoCPUs
   */
  private parseCpuLimit(limit?: string): number | undefined {
    if (!limit) return undefined

    // Format: "1000m" = 1 CPU, "500m" = 0.5 CPU
    const match = limit.match(/^(\d+)m?$/)
    if (!match) return undefined

    const value = parseInt(match[1])
    return (value / 1000) * 1e9 // Convert to NanoCPUs
  }
}

// Export singleton instance
export const dockerService = DockerService.getInstance()
