/**
 * @fileoverview Validadores Zod para rotas de builds
 * 
 * Este arquivo contém todos os schemas de validação Zod usados nas rotas de builds.
 * 
 * @module routes/builds/validators
 */

import { z } from 'zod'

/**
 * Schema para criar um novo build/deployment
 */
export const createBuildSchema = z.object({
  /** ID do projeto */
  projectId: z.string().min(1),
  /** Fonte do build (dockerfile, nixpacks, paketo, heroku, image) */
  source: z.enum(['dockerfile', 'nixpacks', 'paketo', 'heroku', 'image']),
  /** Contexto do build (caminho do diretório) */
  context: z.string().optional(),
  /** Caminho do Dockerfile (padrão: 'Dockerfile') */
  dockerfile: z.string().optional().default('Dockerfile'),
  /** Nome da imagem Docker */
  image: z.string().optional(),
  /** Tag da imagem */
  tag: z.string().optional(),
  /** Argumentos de build */
  buildArgs: z.record(z.string(), z.string()).optional(),
  /** Variáveis de ambiente */
  envVars: z.record(z.string(), z.string()).optional(),
  /** URL do repositório Git */
  gitUrl: z.string().optional(),
  /** Branch Git */
  gitBranch: z.string().optional(),
  /** Hash do commit Git */
  gitCommitHash: z.string().optional(),
})

/**
 * Schema para detectar tipo de projeto
 */
export const detectProjectTypeSchema = z.object({
  /** Contexto do projeto (caminho do diretório) */
  context: z.string().min(1),
})

