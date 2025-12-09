import type { ContainerStatus } from '@prisma/client'

/**
 * Mapeia estado do Docker para enum ContainerStatus do Prisma
 */
export function mapDockerStatus(state: {
  Running?: boolean
  Paused?: boolean
  Restarting?: boolean
  Dead?: boolean
  Status?: string
}): ContainerStatus {
  if (state.Running) return 'RUNNING'
  if (state.Paused) return 'PAUSED'
  if (state.Restarting) return 'RESTARTING'
  if (state.Dead) return 'DEAD'
  if (state.Status === 'created') return 'CREATED'
  if (state.Status === 'removing') return 'REMOVING'
  return 'EXITED'
}

/**
 * Converte string de limite de memória para bytes
 */
export function parseMemoryLimit(limit?: string): number | undefined {
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
 * Converte string de limite de CPU para NanoCPUs
 */
export function parseCpuLimit(limit?: string): number | undefined {
  if (!limit) return undefined

  // Format: "1000m" = 1 CPU, "500m" = 0.5 CPU
  const match = limit.match(/^(\d+)m?$/)
  if (!match) return undefined

  const value = parseInt(match[1])
  return (value / 1000) * 1e9 // Convert to NanoCPUs
}
