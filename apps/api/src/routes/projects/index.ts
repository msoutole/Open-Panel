/**
 * @fileoverview Rotas de projetos
 * 
 * Este módulo registra todas as rotas relacionadas a projetos.
 * Cada handler está em seu próprio arquivo para melhor organização e manutenibilidade.
 * 
 * @module routes/projects
 */

import { Hono } from 'hono'
import type { Variables } from '../../types'
import { listProjectsHandler } from './handlers/list'
import { createProjectHandler } from './handlers/create'
import { readProjectHandler } from './handlers/read'
import { updateProjectHandler } from './handlers/update'
import { deleteProjectHandler } from './handlers/delete'
import envVarsRoutes from './handlers/env-vars'

const projects = new Hono<{ Variables: Variables }>()

// GET /api/projects - Listar todos os projetos acessíveis
projects.get('/', listProjectsHandler)

// POST /api/projects - Criar novo projeto
projects.post('/', createProjectHandler)

// GET /api/projects/:projectId - Obter projeto específico
projects.get('/:projectId', readProjectHandler)

// PUT /api/projects/:projectId - Atualizar projeto
projects.put('/:projectId', updateProjectHandler)

// DELETE /api/projects/:projectId - Deletar projeto
projects.delete('/:projectId', deleteProjectHandler)

// Rotas de variáveis de ambiente
// GET /api/projects/:projectId/env-vars - Listar variáveis de ambiente
// POST /api/projects/:projectId/env-vars - Criar variável de ambiente
// PUT /api/projects/:projectId/env-vars/:envVarId - Atualizar variável de ambiente
// DELETE /api/projects/:projectId/env-vars/:envVarId - Deletar variável de ambiente
projects.route('/:projectId/env-vars', envVarsRoutes)

export default projects

