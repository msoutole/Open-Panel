/**
 * @fileoverview Handler para criar containers
 * 
 * @module routes/containers/handlers/create
 */

import { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ContainerService } from '../../../services/container.service'
import { createContainerSchema } from '../validators'

/**
 * Cria um novo container.
 * 
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Verifica autenticação do usuário
 * 3. Cria container usando DockerService
 * 4. Retorna container criado com status 201
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com container criado e status 201
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 400 - Dados inválidos
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const createContainerHandler = zValidator(
  'json',
  createContainerSchema,
  async (c: Context<{ Variables: Variables }>) => {
    try {
      const user = c.get('user')
      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' })
      }

      const data = c.req.valid('json')
      const container = await ContainerService.createContainer(data)

      return c.json(
        {
          message: 'Container created successfully',
          container
        },
        201
      )
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to create container' })
    }
  }
)

