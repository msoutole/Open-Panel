/**
 * @fileoverview Handler para ler deployment específico
 * 
 * @module routes/builds/handlers/read
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../../../lib/prisma'
import { logError } from '../../../lib/logger'
import type { Variables } from '../../../types'

/**
 * Retorna detalhes de um deployment específico.
 * 
 * **Fluxo de Execução**:
 * 1. Verifica autenticação do usuário
 * 2. Busca deployment no banco de dados
 * 3. Verifica se usuário tem acesso ao projeto
 * 4. Retorna deployment com informações do projeto
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Usuário deve ser owner do projeto
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com deployment
 * 
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Deployment não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const readBuildHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const { id } = c.req.param()

    const deployment = await prisma.deployment.findFirst({
      where: {
        id,
        project: {
          ownerId: user.userId
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!deployment) {
      throw new HTTPException(404, { message: 'Deployment not found' })
    }

    return c.json({ deployment })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    logError('Error getting deployment', error, {
      deploymentId: c.req.param('id'),
      userId: c.get('user')?.userId
    })
    throw new HTTPException(500, { message: 'Failed to get deployment' })
  }
}

