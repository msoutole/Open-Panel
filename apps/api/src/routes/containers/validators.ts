/**
 * @fileoverview Validadores Zod para rotas de containers
 * 
 * Este arquivo contém todos os schemas de validação Zod usados nas rotas de containers.
 * 
 * @module routes/containers/validators
 */

import { z } from 'zod'

/**
 * Schema para criar um novo container
 */
export const createContainerSchema = z.object({
  /** Nome do container (1-255 caracteres) */
  name: z.string().min(1).max(255),
  /** Imagem Docker a usar */
  image: z.string().min(1),
  /** Tag da imagem (padrão: 'latest') */
  tag: z.string().optional().default('latest'),
  /** Comando a executar no container */
  cmd: z.array(z.string()).optional(),
  /** Variáveis de ambiente */
  env: z.record(z.string(), z.string()).optional(),
  /** Mapeamento de portas */
  ports: z
    .array(
      z.object({
        /** Porta no host */
        host: z.number().int().min(1).max(65535),
        /** Porta no container */
        container: z.number().int().min(1).max(65535),
        /** Protocolo (tcp ou udp) */
        protocol: z.enum(['tcp', 'udp']).optional().default('tcp'),
      })
    )
    .optional(),
  /** Volumes a montar */
  volumes: z
    .array(
      z.object({
        /** Caminho no host */
        source: z.string().min(1),
        /** Caminho no container */
        target: z.string().min(1),
        /** Modo de acesso (rw ou ro) */
        mode: z.enum(['rw', 'ro']).optional().default('rw'),
      })
    )
    .optional(),
  /** Limite de CPU (ex: '1.5', '2') */
  cpuLimit: z.string().optional(),
  /** Limite de memória (ex: '512m', '1g') */
  memoryLimit: z.string().optional(),
  /** ID do projeto relacionado (opcional) */
  projectId: z.string().optional(),
})

/**
 * Schema para ações em containers (start, stop, restart)
 */
export const containerActionSchema = z.object({
  /** Timeout em segundos (1-300, padrão: 10) */
  timeout: z.number().int().min(1).max(300).optional().default(10),
})

/**
 * Schema para query parameters de logs
 */
export const logsQuerySchema = z.object({
  /** Incluir stdout (padrão: true) */
  stdout: z.string().default('true').transform((v) => v === 'true'),
  /** Incluir stderr (padrão: true) */
  stderr: z.string().default('true').transform((v) => v === 'true'),
  /** Número de linhas finais a retornar */
  tail: z.string().transform((v) => parseInt(v)).optional(),
  /** Timestamp de início (Unix timestamp) */
  since: z.string().transform((v) => parseInt(v)).optional(),
  /** Timestamp de fim (Unix timestamp) */
  until: z.string().transform((v) => parseInt(v)).optional(),
  /** Incluir timestamps (padrão: true) */
  timestamps: z.string().default('true').transform((v) => v === 'true'),
})

