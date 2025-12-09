/**
 * @fileoverview Handler para ler projeto específico
 * 
 * Este handler retorna detalhes completos de um projeto, incluindo recursos relacionados.
 * 
 * @module routes/projects/handlers/read
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { projectService } from '../../../services/project.service'

/**
 * Retorna detalhes completos de um projeto específico.
 * 
 * **Fluxo de Execução**:
 * 1. Extrai projectId dos parâmetros da URL
 * 2. Obtém usuário autenticado do contexto
 * 3. Busca projeto no banco de dados
 * 4. Verifica se usuário tem acesso ao projeto
 * 5. Retorna projeto com recursos relacionados (env vars, domains, deployments)
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Usuário deve ser owner do projeto OU membro do team que possui o projeto
 * 
 * **Recursos Incluídos**:
 * - Variáveis de ambiente (últimas 10)
 * - Domínios configurados
 * - Deployments recentes (últimos 10)
 * - Contadores de recursos relacionados
 * 
 * @param c - Context do Hono com usuário autenticado e projectId nos parâmetros
 * @returns Resposta JSON com projeto completo
 * 
 * @throws {HTTPException} 404 - Projeto não encontrado
 * @throws {HTTPException} 403 - Usuário não tem acesso ao projeto
 * @throws {HTTPException} 500 - Erro interno do servidor
 * 
 * @example
 * ```typescript
 * GET /api/projects/clx123...
 * 
 * Response:
 * {
 *   "project": {
 *     "id": "clx123...",
 *     "name": "my-app",
 *     "slug": "my-app",
 *     "type": "WEB",
 *     "envVars": [...],
 *     "domains": [...],
 *     "deployments": [...],
 *     "_count": {
 *       "envVars": 5,
 *       "domains": 2,
 *       "deployments": 10
 *     }
 *   }
 * }
 * ```
 */
export const readProjectHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  const { projectId } = c.req.param()
  const user = c.get('user')

  try {
    const project = await projectService.findById(projectId, user.userId)
    return c.json({ project })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to fetch project' })
  }
}

