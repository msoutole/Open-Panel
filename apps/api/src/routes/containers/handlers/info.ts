/**
 * @fileoverview Handler para informações do sistema Docker
 * 
 * @module routes/containers/handlers/info
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'

/**
 * Obtém informações do sistema Docker.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Busca informações do sistema Docker
 * 3. Retorna informações detalhadas
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com informações do Docker
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const getDockerInfoHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const info = await ContainerService.getDockerInfo()

    return c.json({ info })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to get Docker info' })
  }
}

