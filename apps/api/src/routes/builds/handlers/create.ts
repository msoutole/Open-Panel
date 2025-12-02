/**
 * @fileoverview Handler para criar builds/deployments
 * 
 * @module routes/builds/handlers/create
 */

import { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { buildService } from '../../../services/build'
import { gitService } from '../../../services/git'
import { prisma } from '../../../lib/prisma'
import { logInfo, logError } from '../../../lib/logger'
import type { Variables } from '../../../types'
import { createBuildSchema } from '../validators'

/**
 * Cria um novo build/deployment.
 * 
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Verifica se projeto existe e usuário tem acesso
 * 3. Se Git URL fornecido, clona repositório
 * 4. Cria deployment usando BuildService
 * 5. Retorna deployment criado com status 201
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Usuário deve ser owner do projeto
 * 
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com deployment criado e status 201
 * 
 * @throws {HTTPException} 400 - Context ou Git URL obrigatório
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 404 - Projeto não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const createBuildHandler = zValidator(
  'json',
  createBuildSchema,
  async (c: Context<{ Variables: Variables }>) => {
    try {
      const user = c.get('user')
      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' })
      }

      const data = c.req.valid('json')

      // Verificar se projeto existe e usuário tem acesso
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          ownerId: user.userId
        }
      })

      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' })
      }

      // Se Git URL fornecido, clonar repositório
      let buildContext = data.context
      if (data.gitUrl && !buildContext) {
        logInfo('Cloning repository', { gitUrl: data.gitUrl, userId: user.userId })
        buildContext = await gitService.clone({
          url: data.gitUrl,
          branch: data.gitBranch || 'main',
          depth: 1
        })
      }

      if (!buildContext) {
        throw new HTTPException(400, {
          message: 'Build context or Git URL is required'
        })
      }

      // Criar deployment
      const deployment = await buildService.createDeployment({
        ...data,
        context: buildContext
      })

      return c.json(
        {
          message: 'Build started',
          deployment
        },
        201
      )
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      logError('Error creating build', error, { userId: c.get('user')?.userId })
      throw new HTTPException(500, { message: 'Failed to create build' })
    }
  }
)

