import Docker from 'dockerode'
import { prisma } from '../lib/prisma'
import type { PrismaClient } from '@prisma/client'
import { logWarn, logError, logInfo } from '../lib/logger'
import { 
  DockerConnectionError, 
  ContainerOperationError, 
  ContainerNotFoundError,
  ImageOperationError 
} from '../errors/docker.errors'
import { 
  mapDockerStatus, 
  parseMemoryLimit, 
  parseCpuLimit 
} from '../lib/docker-utils'



/**
 * Interface for streamContainerLogs options
 */
interface StreamContainerLogOptions {
  stdout?: boolean
  stderr?: boolean
  follow?: boolean
  timestamps?: boolean
}

/**
 * DockerService - Manages Docker daemon integration
 * Provides methods for container lifecycle management, monitoring, and logging
 */
export class DockerService {
  private docker: Docker
  private prisma: PrismaClient
  private static instance: DockerService

  /**
   * Initialize DockerService
   * @param dockerInstance Optional Dockerode instance (for testing/DI)
   * @param prismaClient Optional PrismaClient instance (for testing/DI)
   */
  public constructor(dockerInstance?: Docker, prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma

    if (dockerInstance) {
      this.docker = dockerInstance
    } else {
      // Instantiate Dockerode client. Connection will be verified by subsequent async operations (e.g., healthCheck).
      this.docker = this._createDockerodeClient();
    }
  }

  /**
   * Private synchronous method to create a Dockerode client instance.
   * Handles socket/TCP fallback during instantiation.
   * @returns A Dockerode instance.
   * @throws DockerConnectionError if both socket and TCP instantiation attempts fail.
   */
  private _createDockerodeClient(): Docker {
    const isWindows = process.platform === 'win32'
    const defaultSocketPath = isWindows ? '//./pipe/docker_engine' : '/var/run/docker.sock'
    const socketPath = process.env.DOCKER_SOCKET_PATH || defaultSocketPath

    try {
      return new Docker({ socketPath })
    } catch (socketError) {
      logWarn('Failed to connect via socket during instantiation, trying TCP...', socketError as Error) // Cast to Error
      try {
        return new Docker({
          host: process.env.DOCKER_HOST || 'localhost',
          port: parseInt(process.env.DOCKER_PORT || '2375'),
        })
      } catch (tcpError) {
        logError('Failed to instantiate Docker client via TCP.', tcpError as Error) // Cast to Error
        throw new DockerConnectionError(tcpError)
      }
    }
  }

  /**
   * Get singleton instance of DockerService
   *
   * @returns Instância singleton do DockerService
   */
  public static getInstance(): DockerService {
    if (!DockerService.instance) {
      DockerService.instance = new DockerService()
    }
    return DockerService.instance
  }
  

  /**
   * Verifica a saúde do daemon Docker
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
   * Obtém informações do sistema Docker
   */
  async getSystemInfo() {
    try {
      return await this.docker.info()
    } catch (error) {
      throw new DockerConnectionError(error)
    }
  }

  /**
   * Lista todos os containers (rodando e parados)
   */
  async listContainers(options?: { all?: boolean; filters?: Record<string, string[]> }) {
    try {
      return await this.docker.listContainers({
        all: options?.all ?? true,
        filters: options?.filters,
      })
    } catch (error) {
      logError('Failed to list containers', error)
      throw new DockerConnectionError(error)
    }
  }

  /**
   * Obtém informações detalhadas de um container pelo Docker ID
   */
  async getContainer(dockerId: string) {
    try {
      const container = this.docker.getContainer(dockerId)
      const inspect = await container.inspect()
      return inspect
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        throw new ContainerNotFoundError(dockerId)
      }
      throw new ContainerOperationError('get', dockerId, error)
    }
  }

  /**
   * Cria um novo container Docker
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

    try {
      // Pull image if not exists
      await this.pullImage(fullImage)

      // Prepare port bindings
      const portBindings: Record<string, Array<{ HostPort: string }>> = {}
      const exposedPorts: Record<string, Record<string, never>> = {}
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
          Memory: parseMemoryLimit(memoryLimit),
          NanoCpus: parseCpuLimit(cpuLimit),
        },
      })

      const inspect = await container.inspect()

      // Save to database
      const dbContainer = await this.prisma.container.create({
        data: {
          dockerId: inspect.Id,
          name: inspect.Name.replace('/', ''),
          image,
          imageTag: tag,
          status: mapDockerStatus(inspect.State),
          command: cmd?.join(' '),
          cpuLimit,
          memoryLimit,
          ports: ports ? JSON.parse(JSON.stringify(ports)) : undefined,
          volumes: volumes ? JSON.parse(JSON.stringify(volumes)) : undefined,
          envVars: env ? JSON.parse(JSON.stringify(env)) : undefined,
          projectId,
          startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
          finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
          exitCode: inspect.State.ExitCode ?? null,
        },
      })

      return dbContainer
    } catch (error) {
      logError(`Failed to create container ${name}`, error)
      throw new ContainerOperationError('create', name, error)
    }
  }

  /**
   * Inicia um container Docker parado
   */
  async startContainer(dockerId: string) {
    try {
      const container = this.docker.getContainer(dockerId)
      await container.start()

      // Update database
      await this.prisma.container.update({
        where: { dockerId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      return await container.inspect()
    } catch (error) {
      logError(`Failed to start container ${dockerId}`, error)
      throw new ContainerOperationError('start', dockerId, error)
    }
  }

  /**
   * Para um container Docker em execução
   */
  async stopContainer(dockerId: string, timeout = 10) {
    try {
      const container = this.docker.getContainer(dockerId)
      await container.stop({ t: timeout })

      // Update database
      await this.prisma.container.update({
        where: { dockerId },
        data: {
          status: 'EXITED',
          finishedAt: new Date(),
        },
      })

      return await container.inspect()
    } catch (error) {
      logError(`Failed to stop container ${dockerId}`, error)
      throw new ContainerOperationError('stop', dockerId, error)
    }
  }

  /**
   * Reinicia um container Docker
   */
  async restartContainer(dockerId: string, timeout = 10) {
    try {
      const container = this.docker.getContainer(dockerId)
      await container.restart({ t: timeout })

      // Update database
      await this.prisma.container.update({
        where: { dockerId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      return await container.inspect()
    } catch (error) {
      logError(`Failed to restart container ${dockerId}`, error)
      throw new ContainerOperationError('restart', dockerId, error)
    }
  }

  /**
   * Pausa um container Docker em execução
   */
  async pauseContainer(dockerId: string) {
    try {
      const container = this.docker.getContainer(dockerId)
      await container.pause()

      await this.prisma.container.update({
        where: { dockerId },
        data: { status: 'PAUSED' },
      })

      return await container.inspect()
    } catch (error) {
      logError(`Failed to pause container ${dockerId}`, error)
      throw new ContainerOperationError('pause', dockerId, error)
    }
  }

  /**
   * Retoma um container Docker pausado
   */
  async unpauseContainer(dockerId: string) {
    try {
      const container = this.docker.getContainer(dockerId)
      await container.unpause()

      await this.prisma.container.update({
        where: { dockerId },
        data: { status: 'RUNNING' },
      })

      return await container.inspect()
    } catch (error) {
      logError(`Failed to unpause container ${dockerId}`, error)
      throw new ContainerOperationError('unpause', dockerId, error)
    }
  }

  /**
   * Remove um container Docker
   */
  async removeContainer(dockerId: string, force = false) {
    try {
      const container = this.docker.getContainer(dockerId)
      await container.remove({ force })

      // Remove from database
      await this.prisma.container.delete({
        where: { dockerId },
      })

      return { success: true }
    } catch (error) {
      logError(`Failed to remove container ${dockerId}`, error)
      throw new ContainerOperationError('remove', dockerId, error)
    }
  }

  /**
   * Obtém logs de um container Docker
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
    try {
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
    } catch (error) {
      logError(`Failed to get logs for container ${dockerId}`, error)
      throw new ContainerOperationError('get logs', dockerId, error)
    }
  }

  /**
   * Transmite logs de um container em tempo real (para WebSocket)
   */
  async streamContainerLogs(
    dockerId: string,
    callback: (chunk: string) => void,
    options?: StreamContainerLogOptions
  ) {
    try {
      const container = this.docker.getContainer(dockerId)
      const stream = await container.logs({
        stdout: options?.stdout ?? true,
        stderr: options?.stderr ?? true,
        follow: options?.follow ?? true,
        timestamps: options?.timestamps ?? true,
      }) as NodeJS.ReadableStream

      stream.on('data', (chunk: Buffer) => {
        callback(chunk.toString('utf-8'))
      })

      return stream
    } catch (error) {
      logError(`Failed to stream logs for container ${dockerId}`, error)
      throw new ContainerOperationError('stream logs', dockerId, error)
    }
  }

  /**
   * Obtém estatísticas de uso de recursos de um container
   */
  async getContainerStats(dockerId: string) {
    try {
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
        Object.values(stats.networks).forEach((net: { rx_bytes?: number; tx_bytes?: number }) => {
          networkRx += net.rx_bytes || 0
          networkTx += net.tx_bytes || 0
        })
      }

      // Block I/O
      let blockRead = 0
      let blockWrite = 0
      if (stats.blkio_stats?.io_service_bytes_recursive) {
        stats.blkio_stats.io_service_bytes_recursive.forEach((item: { op: string; value: number }) => {
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
      await this.prisma.container.update({
        where: { dockerId },
        data: {
          cpuUsage: result.cpuPercent,
          memoryUsage: BigInt(result.memoryUsage),
          networkRx: BigInt(result.networkRx),
          networkTx: BigInt(result.networkTx),
        },
      })

      return result
    } catch (error) {
      logError(`Failed to get stats for container ${dockerId}`, error)
      throw new ContainerOperationError('get stats', dockerId, error)
    }
  }

  async getEvents(options?: { filters?: Record<string, string[]> }) {
    try {
      return await this.docker.getEvents(options)
    } catch (error) {
      throw new DockerConnectionError(error)
    }
  }

  /**
   * Faz pull de uma imagem Docker do registry
   */
  async pullImage(image: string, onProgress?: (progress: unknown) => void) {
    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err: unknown, stream: NodeJS.ReadableStream) => {
        if (err) {
          reject(new ImageOperationError('pull', image, err))
          return
        }

        this.docker.modem.followProgress(
          stream,
          (progressErr: unknown, output: unknown) => {
            if (progressErr) {
              reject(new ImageOperationError('pull', image, progressErr))
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
   * Lista todas as imagens Docker disponíveis localmente
   */
  async listImages() {
    try {
      return await this.docker.listImages()
    } catch (error) {
      throw new DockerConnectionError(error)
    }
  }

  /**
   * Remove uma imagem Docker local
   */
  async removeImage(imageId: string, force = false) {
    try {
      const image = this.docker.getImage(imageId)
      return await image.remove({ force })
    } catch (error) {
      logError(`Failed to remove image ${imageId}`, error)
      throw new ImageOperationError('remove', imageId, error)
    }
  }

  /**
   * Sincroniza containers do Docker para o banco de dados
   */
  async syncContainers() {
    try {
      const dockerContainers = await this.listContainers({ all: true })
      const synced = []

      for (const container of dockerContainers) {
        let inspect;
        try {
          inspect = await this.getContainer(container.Id)
        } catch (error) {
          if (error instanceof ContainerNotFoundError) {
            logWarn(`Container ${container.Id} not found during sync, skipping.`)
            continue
          }
          throw error // Re-throw other errors
        }

        const existing = await this.prisma.container.findUnique({
          where: { dockerId: container.Id },
        })

        if (existing) {
          // Update existing
          await this.prisma.container.update({
            where: { dockerId: container.Id },
            data: {
              status: mapDockerStatus(inspect.State),
              startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
              finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
              exitCode: inspect.State.ExitCode ?? null,
            },
          })
        } else {
          // Create new
          await this.prisma.container.create({
            data: {
              dockerId: inspect.Id,
              name: inspect.Name.replace('/', ''),
              image: inspect.Config.Image.split(':')[0],
              imageTag: inspect.Config.Image.split(':')[1] || 'latest',
              status: mapDockerStatus(inspect.State),
              command: inspect.Config.Cmd?.join(' '),
              startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
              finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
              exitCode: inspect.State.ExitCode ?? null,
            },
          })
        }

        synced.push(container.Id)
      }

      return { synced: synced.length }
    } catch (error) {
      logError('Failed to sync containers', error)
      throw new DockerConnectionError(error)
    }
  }

  /**
   * Executa comando em um container Docker
   */
  async execContainer(
    dockerId: string,
    command: string[],
    options: {
      tty?: boolean
      stdin?: boolean
      detach?: boolean
      user?: string
      env?: string[]
    } = {}
  ) {
    try {
      const container = this.docker.getContainer(dockerId)

      // Verify container exists
      await container.inspect()

      const execOptions = {
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: options.stdin !== false,
        Tty: options.tty !== false,
        Detach: options.detach || false,
        User: options.user,
        Env: options.env,
      }

      // Create exec instance
      const exec = await container.exec(execOptions)

      // Start exec and get stream
      const stream = await exec.start({
        hijack: true,
        stdin: options.stdin !== false,
      })

      logInfo('Container exec started', {
        dockerId,
        command: command.join(' '),
      })

      return {
        exec,
        stream,
      }
    } catch (error) {
      logError(`Failed to exec in container ${dockerId}`, error)
      throw new ContainerOperationError('exec', dockerId, error)
    }
  }
}

// Export singleton instance
export const dockerService = DockerService.getInstance()
