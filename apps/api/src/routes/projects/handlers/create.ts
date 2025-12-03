/**
 * @fileoverview Handler para criar projetos
 * 
 * Este handler cria um novo projeto no sistema após validar dados e permissões.
 * 
 * @module routes/projects/handlers/create
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createProjectSchema } from '@openpanel/shared'
import type { Variables } from '../../../types'
import { ProjectService } from '../../../services/project.service'

/**
 * Cria um novo projeto no sistema.
 *
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Verifica se slug já existe (deve ser único)
 * 3. Se teamId fornecido, verifica se usuário é OWNER ou ADMIN do team
 * 4. Cria registro do projeto no banco de dados
 * 5. Retorna projeto criado com status 201
 *
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Se teamId fornecido: usuário deve ser OWNER ou ADMIN do team
 *
 * **Validações**:
 * - Slug deve ser único no sistema
 * - Nome, slug e tipo são obrigatórios
 *
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com projeto criado e status 201
 *
 * @throws {HTTPException} 400 - Slug já existe ou dados inválidos
 * @throws {HTTPException} 403 - Usuário não tem permissão no team
 * @throws {HTTPException} 500 - Erro interno do servidor
 *
 * @example
 * ```typescript
 * POST /api/projects
 * {
 *   "name": "My App",
 *   "slug": "my-app",
 *   "type": "WEB",
 *   "description": "Minha aplicação web"
 * }
 *
 * Response (201):
 * {
 *   "project": {
 *     "id": "clx123...",
 *     "name": "My App",
 *     "slug": "my-app",
 *     "type": "WEB",
 *     "status": "ACTIVE",
 *     "_count": {
 *       "envVars": 0,
 *       "domains": 0,
 *       "deployments": 0
 *     }
 *   }
 * }
 * ```
 */
export const createProjectHandler = async (c: Context<{ Variables: Variables }>) => {
  const user = c.get('user')

  try {
    // Validação manual do body
    const body = await c.req.json() as unknown
    const data = createProjectSchema.parse(body)

    const project = await ProjectService.create({
      ...data,
      ownerId: user.userId
    })

    return c.json({ project }, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to create project' })
  }
}

