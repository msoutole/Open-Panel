import { DockerService } from './docker'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'
import { logInfo, logError, logDebug } from '../lib/logger'

/**
 * Health Check Service
 * Monitors system health, container health, and service availability
 */

const dockerService = DockerService.getInstance()

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: HealthCheckResult
    redis: HealthCheckResult
    docker: HealthCheckResult
    disk: HealthCheckResult
  }
}

export interface ContainerHealth {
  id: string
  name: string
  status: 'healthy' | 'unhealthy' | 'starting' | 'unknown'
  uptime: number
  lastCheck: string
  checks: {
    running: boolean
    responsive: boolean
    resources: {
      cpu: number
      memory: number
      memoryLimit: number
    }
  }
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  message: string
  responseTime?: number
  details?: Record<string, any>
}

export class HealthService {
  /**
   * Get overall system health
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now()

    logDebug('Running system health checks')

    const [database, redis, docker, disk] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDocker(),
      this.checkDiskSpace(),
    ])

    const allHealthy =
      database.status === 'healthy' &&
      redis.status === 'healthy' &&
      docker.status === 'healthy' &&
      disk.status === 'healthy'

    const anyUnhealthy =
      database.status === 'unhealthy' ||
      redis.status === 'unhealthy' ||
      docker.status === 'unhealthy' ||
      disk.status === 'unhealthy'

    const overallStatus = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded'

    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
        docker,
        disk,
      },
    }

    const duration = Date.now() - startTime
    logDebug(`System health check completed in ${duration}ms`, { status: overallStatus })

    return health
  }

  /**
   * Check database connectivity
   */
  static async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Simple query to check database connection
      await prisma.$queryRaw`SELECT 1`

      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
      }
    } catch (error) {
      logError('Database health check failed', error)

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Check Redis connectivity
   */
  static async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Ping Redis
      await redis.ping()

      const responseTime = Date.now() - startTime

      // Get additional info
      const info = await redis.info('server')
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/)
      const uptime = uptimeMatch ? parseInt(uptimeMatch[1]) : undefined

      return {
        status: 'healthy',
        message: 'Redis connection successful',
        responseTime,
        details: {
          uptime: uptime ? `${Math.floor(uptime / 3600)}h` : undefined,
        },
      }
    } catch (error) {
      logError('Redis health check failed', error)

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis connection failed',
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Check Docker daemon connectivity
   */
  static async checkDocker(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Ping Docker daemon
      const isHealthy = await dockerService.healthCheck()

      if (!isHealthy) {
        return {
          status: 'unhealthy',
          message: 'Docker daemon not responding',
          responseTime: Date.now() - startTime,
        }
      }

      const responseTime = Date.now() - startTime

      // Get Docker info
      const info = await dockerService.getSystemInfo()

      return {
        status: 'healthy',
        message: 'Docker daemon is running',
        responseTime,
        details: {
          containers: info.Containers,
          containersRunning: info.ContainersRunning,
          images: info.Images,
        },
      }
    } catch (error) {
      logError('Docker health check failed', error)

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Docker daemon not accessible',
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Check disk space
   */
  static async checkDiskSpace(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const { execSync } = await import('child_process')

      // Get disk usage for root partition
      const output = execSync("df -k / | tail -1 | awk '{print $5}'", {
        encoding: 'utf-8',
      })

      const usagePercent = parseInt(output.trim().replace('%', ''))

      const responseTime = Date.now() - startTime

      // Alert if disk usage is above 80%
      const status = usagePercent > 80 ? 'unhealthy' : 'healthy'

      return {
        status,
        message: `Disk usage: ${usagePercent}%`,
        responseTime,
        details: {
          usagePercent,
          threshold: 80,
        },
      }
    } catch (error) {
      logError('Disk space check failed', error)

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Failed to check disk space',
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Get health status for a specific container
   */
  static async getContainerHealth(containerId: string): Promise<ContainerHealth> {
    try {
      const container = await prisma.container.findUnique({
        where: { id: containerId },
      })

      if (!container) {
        throw new Error('Container not found')
      }

      // Get Docker container info
      const dockerContainer = await dockerService.getContainer(container.dockerId)

      if (!dockerContainer) {
        return {
          id: container.id,
          name: container.name,
          status: 'unhealthy',
          uptime: 0,
          lastCheck: new Date().toISOString(),
          checks: {
            running: false,
            responsive: false,
            resources: {
              cpu: 0,
              memory: 0,
              memoryLimit: 0,
            },
          },
        }
      }

      // Check if running
      const isRunning = dockerContainer.State.Running

      // Get stats
      let stats: any
      let cpu = 0
      let memory = 0
      let memoryLimit = 0

      if (isRunning) {
        try {
          stats = await dockerService.getContainerStats(container.dockerId)
          cpu = parseFloat(stats.cpuUsage.replace('%', ''))
          memory = stats.memoryUsage
          memoryLimit = stats.memoryLimit
        } catch (error) {
          logError('Failed to get container stats', error)
        }
      }

      // Calculate uptime
      const startedAt = new Date(dockerContainer.State.StartedAt)
      const uptime = isRunning ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0

      // Determine health status
      let healthStatus: 'healthy' | 'unhealthy' | 'starting' | 'unknown' = 'unknown'

      if (!isRunning) {
        healthStatus = 'unhealthy'
      } else if (dockerContainer.State.Health) {
        // Use Docker health check if available
        healthStatus =
          dockerContainer.State.Health.Status === 'healthy'
            ? 'healthy'
            : dockerContainer.State.Health.Status === 'starting'
              ? 'starting'
              : 'unhealthy'
      } else {
        // If no health check, consider running = healthy
        healthStatus = 'healthy'
      }

      return {
        id: container.id,
        name: container.name,
        status: healthStatus,
        uptime,
        lastCheck: new Date().toISOString(),
        checks: {
          running: isRunning,
          responsive: isRunning && healthStatus !== 'unhealthy',
          resources: {
            cpu,
            memory,
            memoryLimit,
          },
        },
      }
    } catch (error) {
      logError('Failed to get container health', error)
      throw error
    }
  }

  /**
   * Get health status for all containers
   */
  static async getAllContainersHealth(): Promise<ContainerHealth[]> {
    try {
      const containers = await prisma.container.findMany({
        where: {
          status: {
            in: ['RUNNING', 'CREATED', 'RESTARTING'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const healthChecks = await Promise.all(
        containers.map((container) => this.getContainerHealth(container.id))
      )

      return healthChecks
    } catch (error) {
      logError('Failed to get all containers health', error)
      throw error
    }
  }

  /**
   * Get unhealthy containers
   */
  static async getUnhealthyContainers(): Promise<ContainerHealth[]> {
    const allHealth = await this.getAllContainersHealth()
    return allHealth.filter((h) => h.status === 'unhealthy')
  }

  /**
   * Periodic health check (to be run by a cron job)
   */
  static async runPeriodicHealthCheck(): Promise<void> {
    logInfo('Running periodic health check')

    try {
      // Check system health
      const systemHealth = await this.getSystemHealth()

      if (systemHealth.status === 'unhealthy') {
        logError('System is unhealthy', null, { health: systemHealth })
      }

      // Check for unhealthy containers
      const unhealthyContainers = await this.getUnhealthyContainers()

      if (unhealthyContainers.length > 0) {
        logError('Unhealthy containers detected', null, {
          count: unhealthyContainers.length,
          containers: unhealthyContainers.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
          })),
        })

        // Optionally: Attempt to restart unhealthy containers
        // for (const container of unhealthyContainers) {
        //   try {
        //     await dockerService.restartContainer(container.id)
        //     logInfo(`Restarted unhealthy container ${container.name}`)
        //   } catch (error) {
        //     logError(`Failed to restart container ${container.name}`, error)
        //   }
        // }
      }

      logInfo('Periodic health check completed', {
        systemStatus: systemHealth.status,
        unhealthyContainers: unhealthyContainers.length,
      })
    } catch (error) {
      logError('Periodic health check failed', error)
    }
  }
}
