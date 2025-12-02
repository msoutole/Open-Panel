/**
 * @fileoverview Handler para deletar containers
 * 
 * @module routes/containers/handlers/delete
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'

/**
 * Remove um container do Docker e do banco de dados.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Extrai ID do container e parâmetro force
 * 3. Remove container do Docker
 * 4. Container é removido do banco automaticamente (via sync)
 * 5. Retorna mensagem de sucesso
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * **Query Params**:
 * - `force`: Se 'true', força remoção mesmo se container estiver rodando
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com mensagem de sucesso
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Container não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const deleteContainerHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const force = c.req.query('force') === 'true'

    await ContainerService.removeContainer(id, force)

    return c.json({
      message: 'Container removed successfully'
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to remove container' })
  }
}

