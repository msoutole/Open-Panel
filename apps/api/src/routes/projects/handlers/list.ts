/**
 * @fileoverview Handler para listar projetos
 * 
 * Este handler retorna todos os projetos acessíveis pelo usuário autenticado.
 * 
 * @module routes/projects/handlers/list
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { projectService } from '../../../services/project.service'

/**
 * Lista todos os projetos acessíveis pelo usuário autenticado.
 * 
 * **Fluxo de Execução**:
 * 1. Obtém usuário autenticado do contexto
 * 2. Busca projetos onde o usuário é owner ou membro do team
 * 3. Retorna lista de projetos com contadores de recursos relacionados
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * 
 * **Projetos Retornados**:
 * - Projetos onde o usuário é owner
 * - Projetos de teams onde o usuário é membro
 * 
 * @param c - Context do Hono com usuário autenticado em `c.get('user')`
 * @returns Resposta JSON com array de projetos
 * 
 * @throws {HTTPException} 500 - Erro interno do servidor
 * 
 * @example
 * ```typescript
 * GET /api/projects
 * 
 * Response:
 * {
 *   "projects": [
 *     {
 *       "id": "clx123...",
 *       "name": "my-app",
 *       "slug": "my-app",
 *       "type": "WEB",
 *       "_count": {
 *         "envVars": 5,
 *         "domains": 2,
 *         "deployments": 10
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export const listProjectsHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  const user = c.get('user')

  try {
    const projects = await projectService.listAccessibleProjects(user.userId)
    return c.json({ projects })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to fetch projects' })
  }
}

