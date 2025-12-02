/**
 * @fileoverview Handler para listar containers
 * 
 * @module routes/containers/handlers/list
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'

/**
 * Lista todos os containers do banco de dados.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Busca containers do banco de dados com informações do projeto
 * 3. Retorna lista de containers ordenada por data de criação
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com lista de containers e total
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 500 - Erro interno do servidor
 * 
 * @example
 * ```typescript
 * GET /api/containers
 * 
 * Response:
 * {
 *   "containers": [...],
 *   "total": 10
 * }
 * ```
 */
export const listContainersHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const containers = await ContainerService.listContainers()

    return c.json({
      containers,
      total: containers.length
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to list containers' })
  }
}

