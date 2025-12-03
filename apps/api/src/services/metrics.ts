import { DockerService } from './docker'
import { prisma } from '../lib/prisma'
import { logError, logDebug } from '../lib/logger'
import * as os from 'os'

const dockerService = DockerService.getInstance()

export interface SystemMetrics {
  cpu: {
    usage: number // percentage
    cores: number
    loadAverage: number[]
  }
  memory: {
    total: number // bytes
    used: number // bytes
    free: number // bytes
    usage: number // percentage
  }
  disk: {
    total: number // bytes
    used: number // bytes
    free: number // bytes
    usage: number // percentage
  }
  network: {
    rx: number // bytes received
    tx: number // bytes transmitted
    rxRate: number // bytes/sec
    txRate: number // bytes/sec
  }
  timestamp: string
}

export interface ContainerMetrics {
  id: string
  dockerId: string
  name: string
  cpu: {
    usage: number // percentage
    cores: number
  }
  memory: {
    used: number // bytes
    limit: number // bytes
    usage: number // percentage
  }
  network: {
    rx: number // bytes received
    tx: number // bytes transmitted
    rxRate: number // bytes/sec
    txRate: number // bytes/sec
  }
  blockIO: {
    read: number // bytes
    write: number // bytes
  }
  timestamp: string
}

export class MetricsService {
  private static networkStatsCache: { rx: number; tx: number; timestamp: number } | null = null

  /**
   * Get system-wide metrics (CPU, Memory, Disk, Network)
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // CPU metrics
      const cpus = os.cpus()
      const cpuUsage = await this.getCpuUsage()
      const loadAvg = os.loadavg()

      // Memory metrics
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem
      const memUsage = (usedMem / totalMem) * 100

      // Disk metrics
      const diskMetrics = await this.getDiskMetrics()

      // Network metrics
      const networkMetrics = await this.getNetworkMetrics()

      return {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
          loadAverage: loadAvg,
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usage: memUsage,
        },
        disk: diskMetrics,
        network: networkMetrics,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logError('Failed to get system metrics', error)
      throw error
    }
  }

  /**
   * Calculate CPU usage percentage
   */
  private static async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const cpus = os.cpus()
      let totalIdle = 0
      let totalTick = 0

      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times]
        }
        totalIdle += cpu.times.idle
      })

      const idle = totalIdle / cpus.length
      const total = totalTick / cpus.length
      const usage = 100 - ~~((100 * idle) / total)

      resolve(Math.max(0, Math.min(100, usage)))
    })
  }

  /**
   * Get disk metrics
   */
  private static async getDiskMetrics(): Promise<{
    total: number
    used: number
    free: number
    usage: number
  }> {
    try {
      const fs = await import('fs')
      const path = process.platform === 'win32' ? 'C:\\' : '/'

      // Try native Node.js fs.statfs (Node 18.15+)
      // @ts-ignore - statfsSync might not be in types
      if (fs.statfsSync) {
        // @ts-ignore
        const stats = fs.statfsSync(path)
        const total = Number(stats.bsize) * Number(stats.blocks)
        const free = Number(stats.bsize) * Number(stats.bfree)
        const used = total - free
        const usage = (used / total) * 100

        return {
          total,
          used,
          free,
          usage,
        }
      } else {
        // Fallback to command execution
        const { execSync } = await import('child_process')

        if (process.platform === 'win32') {
          try {
            const cmd =
              'powershell -Command "Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID=\'C:\'\\" | Select-Object FreeSpace,Size | ConvertTo-Json"'
            const output = execSync(cmd, { encoding: 'utf-8' })
            const data = JSON.parse(output)
            const free = data.FreeSpace
            const total = data.Size
            const used = total - free
            const usage = (used / total) * 100

            return { total, used, free, usage }
          } catch (e) {
            // Fallback
            return { total: 0, used: 0, free: 0, usage: 0 }
          }
        } else {
          const output = execSync("df -k / | tail -1 | awk '{print $2,$3,$4}'", {
            encoding: 'utf-8',
          })
          const [totalKb, usedKb, freeKb] = output.trim().split(/\s+/).map(Number)
          const total = totalKb * 1024
          const used = usedKb * 1024
          const free = freeKb * 1024
          const usage = (used / total) * 100

          return { total, used, free, usage }
        }
      }
    } catch (error) {
      logError('Failed to get disk metrics', error)
      return { total: 0, used: 0, free: 0, usage: 0 }
    }
  }

  /**
   * Get network metrics
   */
  private static async getNetworkMetrics(): Promise<{
    rx: number
    tx: number
    rxRate: number
    txRate: number
  }> {
    try {
      // Get network stats from Docker containers
      const containers = await prisma.container.findMany({
        where: {
          status: 'RUNNING',
        },
      })

      let totalRx = 0
      let totalTx = 0

      for (const container of containers) {
        try {
          const stats = await dockerService.getContainerStats(container.dockerId)
          totalRx += stats.networkRx || 0
          totalTx += stats.networkTx || 0
        } catch (error) {
          // Skip containers that fail
          logDebug(`Failed to get stats for container ${container.id}`, { error })
        }
      }

      // Calculate rates (simplified - would need previous measurement for accurate rate)
      const now = Date.now()
      const cache = this.networkStatsCache

      let rxRate = 0
      let txRate = 0

      if (cache) {
        const timeDelta = (now - cache.timestamp) / 1000 // seconds
        if (timeDelta > 0) {
          rxRate = (totalRx - cache.rx) / timeDelta
          txRate = (totalTx - cache.tx) / timeDelta
        }
      }

      // Update cache
      this.networkStatsCache = {
        rx: totalRx,
        tx: totalTx,
        timestamp: now,
      }

      return {
        rx: totalRx,
        tx: totalTx,
        rxRate: Math.max(0, rxRate),
        txRate: Math.max(0, txRate),
      }
    } catch (error) {
      logError('Failed to get network metrics', error)
      return { rx: 0, tx: 0, rxRate: 0, txRate: 0 }
    }
  }

  /**
   * Get metrics for a specific container
   */
  static async getContainerMetrics(containerId: string): Promise<ContainerMetrics> {
    try {
      const container = await prisma.container.findUnique({
        where: { id: containerId },
      })

      if (!container) {
        throw new Error('Container not found')
      }

      const dockerContainer = await dockerService.getContainer(container.dockerId ?? '')

      if (!dockerContainer || !dockerContainer.State?.Running) {
        return {
          id: container.id,
          dockerId: container.dockerId,
          name: container.name,
          cpu: {
            usage: 0,
            cores: 0,
          },
          memory: {
            used: 0,
            limit: 0,
            usage: 0,
          },
          network: {
            rx: 0,
            tx: 0,
            rxRate: 0,
            txRate: 0,
          },
          blockIO: {
            read: 0,
            write: 0,
          },
          timestamp: new Date().toISOString(),
        }
      }

      const stats = await dockerService.getContainerStats(container.dockerId)

      return {
        id: container.id,
        dockerId: container.dockerId,
        name: container.name,
        cpu: {
          usage: stats.cpuPercent ?? 0,
          cores: dockerContainer.HostConfig?.CpuCount ?? 0,
        },
        memory: {
          used: stats.memoryUsage ?? 0,
          limit: stats.memoryLimit ?? 0,
          usage: stats.memoryPercent ?? 0,
        },
        network: {
          rx: stats.networkRx ?? 0,
          tx: stats.networkTx ?? 0,
          rxRate: 0, // Would need previous measurement
          txRate: 0, // Would need previous measurement
        },
        blockIO: {
          read: stats.blockRead ?? 0,
          write: stats.blockWrite ?? 0,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logError('Failed to get container metrics', error)
      throw error
    }
  }

  /**
   * Get metrics for all containers
   */
  static async getAllContainersMetrics(): Promise<ContainerMetrics[]> {
    try {
      const containers = await prisma.container.findMany({
        where: {
          status: {
            in: ['RUNNING', 'CREATED', 'RESTARTING'],
          },
        },
      })

      const metrics = await Promise.all(
        containers.map((container) => this.getContainerMetrics(container.id))
      )

      return metrics
    } catch (error) {
      logError('Failed to get all containers metrics', error)
      throw error
    }
  }

  /**
   * Get historical metrics for a container
   * Note: This is a simplified version. In production, you'd want to store metrics in a time-series database
   */
  static async getContainerHistoricalMetrics(
    containerId: string,
    hours: number = 24,
    intervalSeconds: number = 300
  ): Promise<ContainerMetrics[]> {
    try {
      // In a real implementation, this would query a time-series database
      // For now, we'll return current metrics as a placeholder
      // The frontend can implement client-side aggregation

      const currentMetrics = await this.getContainerMetrics(containerId)

      // Return array with single data point (current)
      // Frontend can implement proper time-series visualization
      return [currentMetrics]
    } catch (error) {
      logError('Failed to get container historical metrics', error)
      throw error
    }
  }

  /**
   * Export metrics data
   */
  static async exportMetrics(type: string, format: string = 'json'): Promise<any> {
    try {
      let data: any

      if (type === 'containers') {
        data = await this.getAllContainersMetrics()
      } else if (type === 'system') {
        data = await this.getSystemMetrics()
      } else {
        throw new Error(`Unknown export type: ${type}`)
      }

      if (format === 'csv') {
        // Convert to CSV
        if (Array.isArray(data)) {
          if (data.length === 0) {
            return ''
          }

          // Get headers from first object
          const headers = Object.keys(data[0]).join(',')
          const rows = data.map((item) =>
            Object.values(item)
              .map((val) => {
                if (typeof val === 'object') {
                  return JSON.stringify(val)
                }
                return String(val)
              })
              .join(',')
          )

          return [headers, ...rows].join('\n')
        } else {
          // Single object
          const headers = Object.keys(data).join(',')
          const row = Object.values(data)
            .map((val) => {
              if (typeof val === 'object') {
                return JSON.stringify(val)
              }
              return String(val)
            })
            .join(',')

          return [headers, row].join('\n')
        }
      }

      return data
    } catch (error) {
      logError('Failed to export metrics', error)
      throw error
    }
  }
}

