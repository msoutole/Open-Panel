/**
 * @fileoverview Handler para atualizar projetos
 * 
 * Este handler atualiza um projeto existente após validar permissões e dados.
 * 
 * @module routes/projects/handlers/update
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { updateProjectSchema } from '@openpanel/shared'
import type { Variables } from '../../../types'
import { ProjectService } from '../../../services/project.service'

/**
 * Atualiza um projeto existente.
 *
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Extrai projectId dos parâmetros da URL
 * 3. Verifica se projeto existe
 * 4. Verifica se usuário é owner do projeto
 * 5. Se slug mudou, verifica se novo slug é único
 * 6. Atualiza projeto no banco de dados
 * 7. Retorna projeto atualizado
 *
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Usuário deve ser owner do projeto (apenas owner pode atualizar)
 *
 * **Validações**:
 * - Projeto deve existir
 * - Usuário deve ser owner
 * - Se slug mudou, novo slug deve ser único
 *
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com projeto atualizado
 *
 * @throws {HTTPException} 400 - Novo slug já existe ou dados inválidos
 * @throws {HTTPException} 403 - Usuário não é owner do projeto
 * @throws {HTTPException} 404 - Projeto não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 *
 * @example
 * ```typescript
 * PUT /api/projects/clx123...
 * {
 *   "name": "Updated Name",
 *   "description": "Nova descrição"
 * }
 *
 * Response:
 * {
 *   "project": {
 *     "id": "clx123...",
 *     "name": "Updated Name",
 *     "description": "Nova descrição",
 *     ...
 *   }
 * }
 * ```
 */
export const updateProjectHandler = async (c: Context<{ Variables: Variables }>) => {
  const projectId = c.req.param('projectId') ?? ''
  const user = c.get('user')

  try {
    // Validação manual do body
    const body = await c.req.json() as unknown
    const data = updateProjectSchema.parse(body)

    const project = await ProjectService.update(projectId, user.userId, data)
    return c.json({ project })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to update project' })
  }
}

