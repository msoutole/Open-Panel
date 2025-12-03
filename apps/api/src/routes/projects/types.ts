/**
 * @fileoverview Tipos específicos do módulo de projetos
 * 
 * Este arquivo contém tipos TypeScript específicos para o módulo de projetos,
 * complementando os tipos do Prisma e do shared package.
 * 
 * @module routes/projects/types
 */

import type { Project } from '@prisma/client'

/**
 * Projeto com contadores de recursos relacionados
 */
export interface ProjectWithCounts extends Project {
  _count: {
    envVars: number
    domains: number
    deployments: number
  }
}

/**
 * Projeto completo com recursos relacionados
 */
export interface ProjectWithResources extends Project {
  envVars: Array<{
    id: string
    key: string
    value: string
    isSecret: boolean
    createdAt: Date
  }>
  domains: Array<{
    id: string
    name: string
    projectId: string
    createdAt: Date
    updatedAt: Date
  }>
  deployments: Array<{
    id: string
    projectId: string
    status: string
    createdAt: Date
  }>
  _count: {
    envVars: number
    domains: number
    deployments: number
  }
}

