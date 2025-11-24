import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  type: z.enum(['WEB', 'API', 'WORKER', 'CRON', 'DATABASE', 'REDIS', 'MONGODB']),
  dockerImage: z.string().optional(),
  dockerTag: z.string().default('latest'),
  gitUrl: z.string().url().optional(),
  gitBranch: z.string().default('main'),
  replicas: z.number().int().min(0).max(10).default(1),
  cpuLimit: z.string().default('1000m'),
  memoryLimit: z.string().default('512Mi'),
  teamId: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const createEnvVarSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[A-Z_][A-Z0-9_]*$/, 'Key must be uppercase with underscores only'),
  value: z.string(),
  isSecret: z.boolean().default(false),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateEnvVarInput = z.infer<typeof createEnvVarSchema>
