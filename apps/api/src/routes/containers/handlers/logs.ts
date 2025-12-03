/**
 * @fileoverview Handler para logs de containers
 * 
 * @module routes/containers/handlers/logs
 */

import { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'
import { logsQuerySchema } from '../validators'

/**
 * Obtém logs de um container.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Valida query parameters
 * 3. Busca logs do container no Docker
 * 4. Retorna logs formatados
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * **Query Params**:
 * - `stdout`: Incluir stdout (padrão: true)
 * - `stderr`: Incluir stderr (padrão: true)
 * - `tail`: Número de linhas finais
 * - `since`: Timestamp de início (Unix)
 * - `until`: Timestamp de fim (Unix)
 * - `timestamps`: Incluir timestamps (padrão: true)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com logs do container
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Container não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const getContainerLogsHandler = [
  zValidator('query', logsQuerySchema),
  async (c: Context<{ Variables: Variables }>) => {
    try {
      const user = c.get('user')
      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' })
      }

      const { id } = c.req.param()
      const options = c.req.valid('query' as never) as z.infer<typeof logsQuerySchema>

      const logs = await ContainerService.getContainerLogs(id, {
        stdout: options.stdout,
        stderr: options.stderr,
        tail: options.tail,
        since: options.since,
        until: options.until,
        timestamps: options.timestamps
      })

      return c.json({ logs })
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to get container logs' })
    }
  }
]

