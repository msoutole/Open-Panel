/**
 * @fileoverview Rotas de builds/deployments
 * 
 * Este módulo registra todas as rotas relacionadas a builds e deployments.
 * Cada handler está em seu próprio arquivo para melhor organização e manutenibilidade.
 * 
 * @module routes/builds
 */

import { Hono } from 'hono'
import type { Variables } from '../../types'
import { createBuildHandler } from './handlers/create'
import { readBuildHandler } from './handlers/read'
import { listBuildsHandler } from './handlers/list'
import { detectProjectTypeHandler } from './handlers/detect'
import { blueGreenDeployHandler, rollbackHandler } from './handlers/blue-green'

const builds = new Hono<{ Variables: Variables }>()

// POST /api/builds - Criar novo build/deployment
// @ts-expect-error - zValidator type mismatch with Hono
builds.post('/', ...createBuildHandler)

// GET /api/builds/project/:projectId - Listar deployments de um projeto
// IMPORTANTE: Rotas mais específicas devem vir antes de rotas genéricas
builds.get('/project/:projectId', listBuildsHandler)

// GET /api/builds/:id - Obter deployment específico
builds.get('/:id', readBuildHandler)

// POST /api/builds/detect - Detectar tipo de projeto
builds.post('/detect', detectProjectTypeHandler)

// POST /api/builds/blue-green - Blue-green deployment (zero-downtime)
// @ts-expect-error - zValidator type mismatch with Hono
builds.post('/blue-green', ...blueGreenDeployHandler)

// POST /api/builds/rollback - Rollback to previous container
// @ts-expect-error - zValidator type mismatch with Hono
builds.post('/rollback', ...rollbackHandler)

// TODO: Adicionar handlers para webhooks quando necessário
// POST /api/builds/webhooks/github - Webhook do GitHub
// POST /api/builds/webhooks/gitlab - Webhook do GitLab
// POST /api/builds/webhooks/bitbucket - Webhook do Bitbucket

export default builds

