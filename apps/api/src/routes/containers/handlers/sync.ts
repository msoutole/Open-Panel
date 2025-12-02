/**
 * @fileoverview Handler para sincronizar containers
 * 
 * @module routes/containers/handlers/sync
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'

/**
 * Sincroniza containers do Docker daemon com o banco de dados.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Sincroniza containers do Docker com o banco de dados
 * 3. Retorna resultado da sincronização
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com resultado da sincronização
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const syncContainersHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const result = await ContainerService.syncContainers()

    return c.json({
      message: 'Containers synced successfully',
      synced: result.synced
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to sync containers' })
  }
}

