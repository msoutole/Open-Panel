/**
 * @fileoverview Handler para health check do Docker
 * 
 * @module routes/containers/handlers/health
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ContainerService } from '../../../services/container.service'

/**
 * Verifica saúde do Docker daemon.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica conexão com Docker daemon
 * 2. Retorna status de saúde
 * 
 * **Permissões**: Nenhuma (endpoint público de health check)
 * 
 * @param c - Context do Hono
 * @returns Resposta JSON com status de saúde do Docker
 * 
 * @throws {HTTPException} 500 - Erro ao verificar saúde
 */
export const checkDockerHealthHandler = async (c: Context) => {
  try {
    const healthy = await ContainerService.checkDockerHealth()

    return c.json({
      status: healthy ? 'ok' : 'error',
      docker: healthy
    })
  } catch (error) {
    throw new HTTPException(500, { message: 'Failed to check Docker health' })
  }
}

