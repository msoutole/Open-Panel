/**
 * @fileoverview Handler para ler container específico
 * 
 * @module routes/containers/handlers/read
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'

/**
 * Retorna detalhes completos de um container específico.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Extrai ID do container dos parâmetros
 * 3. Busca container no banco de dados
 * 4. Busca dados do Docker daemon
 * 5. Retorna container com dados combinados
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com container completo
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Container não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const readContainerHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()
    const container = await ContainerService.findById(id)

    return c.json({ container })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to get container' })
  }
}

