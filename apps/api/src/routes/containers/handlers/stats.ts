/**
 * @fileoverview Handler para estatísticas de containers
 * 
 * @module routes/containers/handlers/stats
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'

/**
 * Obtém estatísticas de um container.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Busca estatísticas do container no Docker
 * 3. Retorna estatísticas (CPU, memória, rede, etc.)
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com estatísticas do container
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Container não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const getContainerStatsHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const stats = await ContainerService.getContainerStats(id)

    return c.json({ stats })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to get container stats' })
  }
}

