/**
 * @fileoverview Handler para gerenciar variáveis de ambiente de projetos
 * 
 * Este módulo contém handlers para CRUD completo de variáveis de ambiente.
 * 
 * @module routes/projects/handlers/env-vars
 */

import { Hono, Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../../../lib/prisma'
import { createEnvVarSchema } from '@openpanel/shared'
import type { Variables } from '../../../types'
import { ProjectService } from '../../../services/project.service'

const envVars = new Hono<{ Variables: Variables }>()

/**
 * Lista todas as variáveis de ambiente de um projeto.
 * 
 * **Fluxo de Execução**:
 * 1. Extrai projectId dos parâmetros da URL
 * 2. Verifica se projeto existe e se usuário tem acesso
 * 3. Busca todas as variáveis de ambiente do projeto
 * 4. Retorna lista de variáveis
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado
 * - Usuário deve ser owner do projeto
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com array de variáveis de ambiente
 * 
 * @throws {HTTPException} 403 - Usuário não tem acesso
 * @throws {HTTPException} 404 - Projeto não encontrado
 */
envVars.get('/', async (c: Context<{ Variables: Variables }>) => {
  const projectId = c.req.param('projectId') ?? ''
  const user = c.get('user')

  try {
    // Verificar acesso ao projeto
    await ProjectService.findById(projectId, user.userId)

    const envVars = await prisma.envVar.findMany({
      where: { projectId },
      select: {
        id: true,
        key: true,
        value: true,
        isSecret: true,
        createdAt: true
      }
    })

    return c.json({ envVars })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to fetch env vars' })
  }
})

/**
 * Cria uma nova variável de ambiente para um projeto.
 * 
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Verifica se projeto existe e se usuário tem acesso
 * 3. Verifica se chave já existe (chave deve ser única por projeto)
 * 4. Cria variável de ambiente no banco de dados
 * 5. Retorna variável criada com status 201
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado
 * - Usuário deve ser owner do projeto
 * 
 * **Validações**:
 * - Chave deve ser única por projeto
 * - Chave e valor são obrigatórios
 * 
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com variável criada e status 201
 * 
 * @throws {HTTPException} 400 - Chave já existe ou dados inválidos
 * @throws {HTTPException} 403 - Usuário não tem acesso
 * @throws {HTTPException} 404 - Projeto não encontrado
 */
envVars.post('/', zValidator('json', createEnvVarSchema), async (c: Context<{ Variables: Variables }>) => {
  const projectId = c.req.param('projectId') ?? ''
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    // Verificar acesso ao projeto
    await ProjectService.findById(projectId, user.userId)

    // Verificar se chave já existe
    const existing = await prisma.envVar.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: data.key
        }
      }
    })

    if (existing) {
      throw new HTTPException(400, {
        message: 'Environment variable already exists'
      })
    }

    const envVar = await prisma.envVar.create({
      data: {
        projectId,
        key: data.key,
        value: data.value,
        isSecret: data.isSecret
      },
      select: {
        id: true,
        key: true,
        isSecret: true,
        createdAt: true
      }
    })

    return c.json({ envVar }, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to create env var' })
  }
})

/**
 * Atualiza uma variável de ambiente existente.
 * 
 * **Fluxo de Execução**:
 * 1. Valida dados de entrada usando Zod schema
 * 2. Extrai projectId e envVarId dos parâmetros
 * 3. Verifica se projeto existe e se usuário tem acesso
 * 4. Atualiza variável de ambiente no banco de dados
 * 5. Retorna variável atualizada
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado
 * - Usuário deve ser owner do projeto
 * 
 * @param c - Context do Hono com usuário autenticado e dados validados
 * @returns Resposta JSON com variável atualizada
 * 
 * @throws {HTTPException} 403 - Usuário não tem acesso
 * @throws {HTTPException} 404 - Projeto ou variável não encontrada
 */
envVars.put('/:envVarId', zValidator('json', createEnvVarSchema), async (c: Context<{ Variables: Variables }>) => {
  const projectId = c.req.param('projectId') ?? ''
  const envVarId = c.req.param('envVarId') ?? ''
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    // Verificar acesso ao projeto
    await ProjectService.findById(projectId, user.userId)

    const envVar = await prisma.envVar.update({
      where: { id: envVarId },
      data: {
        key: data.key,
        value: data.value,
        isSecret: data.isSecret
      },
      select: {
        id: true,
        key: true,
        isSecret: true,
        createdAt: true
      }
    })

    return c.json({ envVar })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to update env var' })
  }
})

/**
 * Deleta uma variável de ambiente.
 * 
 * **Fluxo de Execução**:
 * 1. Extrai projectId e envVarId dos parâmetros
 * 2. Verifica se projeto existe e se usuário tem acesso
 * 3. Deleta variável de ambiente do banco de dados
 * 4. Retorna mensagem de sucesso
 * 
 * **Permissões Requeridas**:
 * - Usuário autenticado
 * - Usuário deve ser owner do projeto
 * 
 * @param c - Context do Hono com usuário autenticado
 * @returns Resposta JSON com mensagem de sucesso
 * 
 * @throws {HTTPException} 403 - Usuário não tem acesso
 * @throws {HTTPException} 404 - Projeto ou variável não encontrada
 */
envVars.delete('/:envVarId', async (c: Context<{ Variables: Variables }>) => {
  const projectId = c.req.param('projectId') ?? ''
  const envVarId = c.req.param('envVarId') ?? ''
  const user = c.get('user')

  try {
    // Verificar acesso ao projeto
    await ProjectService.findById(projectId, user.userId)

    await prisma.envVar.delete({
      where: { id: envVarId }
    })

    return c.json({ message: 'Environment variable deleted' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to delete env var' })
  }
})

export default envVars

