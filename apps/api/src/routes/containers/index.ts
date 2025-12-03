/**
 * @fileoverview Rotas de containers
 * 
 * Este módulo registra todas as rotas relacionadas a containers Docker.
 * Cada handler está em seu próprio arquivo para melhor organização e manutenibilidade.
 * 
 * @module routes/containers
 */

import { Hono } from 'hono'
import type { Variables } from '../../types'
import { listContainersHandler } from './handlers/list'
import { syncContainersHandler } from './handlers/sync'
import { readContainerHandler } from './handlers/read'
import { createContainerHandler } from './handlers/create'
import { deleteContainerHandler } from './handlers/delete'
import { getContainerLogsHandler } from './handlers/logs'
import { getContainerStatsHandler } from './handlers/stats'
import { checkDockerHealthHandler } from './handlers/health'
import { getDockerInfoHandler } from './handlers/info'
import actionsRoutes from './handlers/actions'

const containers = new Hono<{ Variables: Variables }>()

// Rotas específicas devem vir antes de rotas genéricas para garantir roteamento correto

// GET /api/containers - Listar todos os containers
containers.get('/', listContainersHandler)

// POST /api/containers - Criar novo container
// @ts-expect-error - zValidator type mismatch with Hono
containers.post('/', ...createContainerHandler)

// GET /api/containers/sync - Sincronizar containers do Docker
containers.get('/sync', syncContainersHandler)

// GET /api/containers/health/docker - Health check do Docker
containers.get('/health/docker', checkDockerHealthHandler)

// GET /api/containers/info/docker - Informações do sistema Docker
containers.get('/info/docker', getDockerInfoHandler)

// Rotas específicas aninhadas em /:id devem vir antes da rota genérica /:id
// GET /api/containers/:id/logs - Obter logs do container
// @ts-expect-error - zValidator type mismatch with Hono
containers.get('/:id/logs', ...getContainerLogsHandler)

// GET /api/containers/:id/stats - Obter estatísticas do container
containers.get('/:id/stats', getContainerStatsHandler)

// Rotas de ações em containers (/:id/start, /:id/stop, etc.)
// IMPORTANTE: Estas rotas são mais específicas que /:id, então devem vir antes
// POST /api/containers/:id/start - Iniciar container
// POST /api/containers/:id/stop - Parar container
// POST /api/containers/:id/restart - Reiniciar container
// POST /api/containers/:id/pause - Pausar container
// POST /api/containers/:id/unpause - Despausar container
containers.route('/:id', actionsRoutes)

// Rotas genéricas /:id devem vir por último
// GET /api/containers/:id - Obter container específico
containers.get('/:id', readContainerHandler)

// DELETE /api/containers/:id - Remover container
containers.delete('/:id', deleteContainerHandler)

export default containers

