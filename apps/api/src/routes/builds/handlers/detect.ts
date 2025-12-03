/**
 * @fileoverview Handler para detectar tipo de projeto
 * 
 * @module routes/builds/handlers/detect
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { buildService } from '../../../services/build'
import { logError } from '../../../lib/logger'
import type { Variables } from '../../../types'
import { detectProjectTypeSchema } from '../validators'

/**
 * Detecta automaticamente o tipo de projeto a partir do contexto.
 *
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Usa BuildService para detectar tipo de projeto
 * 3. Retorna tipo detectado e buildpack recomendado
 *
 * **Permissões Requeridas**:
 * - Usuário autenticado (garantido pelo middleware)
 *
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com tipo detectado e recomendações
 *
 * @throws {HTTPException} 401 - Não autenticado
 * @throws {HTTPException} 500 - Erro interno do servidor
 */
export const detectProjectTypeHandler = async (c: Context<{ Variables: Variables }>) => {
  try {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    // Validação manual do body
    const body = await c.req.json() as unknown
    const validated = detectProjectTypeSchema.parse(body)
    const { context } = validated

    const detection = await buildService.detectProjectType(context)

    return c.json({
      type: detection.type,
      buildpack: detection.buildpack,
      recommendations: {
        dockerfile: detection.buildpack === 'dockerfile',
        nixpacks: detection.buildpack === 'nixpacks',
        paketo: detection.buildpack === 'paketo'
      }
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    logError('Error detecting project type', error, {
      userId: c.get('user')?.userId
    })
    throw new HTTPException(500, { message: 'Failed to detect project type' })
  }
}

