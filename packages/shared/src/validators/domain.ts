import { z } from 'zod'

export const createDomainSchema = z.object({
  name: z.string().min(3),
  projectId: z.string(),
  sslEnabled: z.boolean().default(true),
  sslAutoRenew: z.boolean().default(true),
  dnsProvider: z.enum(['cloudflare', 'route53', 'digitalocean']).optional(),
})

export const updateDomainSchema = z.object({
  name: z.string().min(3).optional(),
  sslEnabled: z.boolean().optional(),
  sslAutoRenew: z.boolean().optional(),
  dnsProvider: z.enum(['cloudflare', 'route53', 'digitalocean']).optional(),
})

export type CreateDomainInput = z.infer<typeof createDomainSchema>
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>
