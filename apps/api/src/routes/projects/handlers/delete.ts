/**
 * @fileoverview Handler para deletar projetos
 * 
 * Este handler deleta um projeto após validar permissões.
 * 
 * @module routes/projects/handlers/delete
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../../../types'
import { ProjectService } from '../../../services/project.service'

/**
 * Deleta um projeto do sistema.
 * 
 * **Fluxo de Execução**:
 * 1. Extrai projectId dos parâmetros da URL
 * 2. Verifica se projeto existe
 * 3. Verifica se usuário é owner do projeto
 * 4. Deleta projeto do banco de dados (cascade delete remove recursos relacionados)
 * 5. Retorna mensagem de sucesso
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 * - Usuário deve ser owner do projeto (apenas owner pode deletar)
 * 
 * **Efeitos Colaterais**:
 * - Deleta todas as variáveis de ambiente relacionadas
 * - Deleta todos os domínios relacionados
 * - Deleta todos os deployments relacionados
 * - Deleta todos os containers relacionados (se houver)
 * 
 * **ATENÇÃO**: Esta operação é irreversível!
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com mensagem de sucesso
 * 
 * @throws {HTTPException} 403 - Usuário não é owner do projeto
 * @throws {HTTPException} 404 - Projeto não encontrado
 * @throws {HTTPException} 500 - Erro interno do servidor
 * 
 * @example
 * ```typescript
 * DELETE /api/projects/clx123...
 * 
 * Response (200):
 * {
 *   "message": "Project deleted successfully"
 * }
 * ```
 */
export const deleteProjectHandler = async (
  c: Context<{ Variables: Variables }>
) => {
  const { projectId } = c.req.param()
  const user = c.get('user')

  try {
    await ProjectService.delete(projectId, user.userId)
    return c.json({ message: 'Project deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to delete project' })
  }
}

