/**
 * @fileoverview Handler para listar deployments de um projeto
 * 
 * @module routes/builds/handlers/list
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../../../lib/prisma'
import { logError } from '../../../lib/logger'
import type { Variables } from '../../../types'

/**
 * Lista todos os deployments de um projeto.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Verifica se projeto existe e usuário tem acesso
 * 3. Busca deployments do projeto ordenados por data
 * 4. Retorna lista de deployments
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Usuário deve ser owner do projeto
 * 
 * **Query Params**:
 * - `limit`: Número máximo de resultados (padrão: 50)
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com lista de deployments
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Projeto não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const listBuildsHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { projectId } = c.req.param()
    const limit = parseInt(c.req.query('limit') || '50')

    // Verificar acesso ao projeto
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: user.userId
      }
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    const deployments = await prisma.deployment.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return c.json({
      deployments,
      total: deployments.length
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    logError('Error listing deployments', error, {
      projectId: c.req.param('projectId'),
      userId: c.get('user')?.userId
    })
    throw new HTTPException(500, { message: 'Failed to list deployments' })
  }
}

