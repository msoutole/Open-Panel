import { Hono } from 'hono'
import { z } from 'zod'
import type { Variables } from '../types'
import { prisma } from '../lib/prisma'
import { HTTPException } from 'hono/http-exception'

const app = new Hono<{ Variables: Variables }>()

// Settings schema
const settingsSchema = z.object({
  // AI Providers
  geminiApiKey: z.string().optional(),
  groqApiKey: z.string().optional(),
  ollamaEnabled: z.boolean().optional(),
  ollamaHost: z.string().optional(),
  defaultProvider: z.enum(['ollama', 'gemini', 'groq']).optional(),

  // Email (SMTP)
  smtpEnabled: z.boolean().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromName: z.string().optional(),
  smtpFromEmail: z.string().email().optional(),

  // DNS Providers
  cloudflareApiToken: z.string().optional(),
  cloudflareEmail: z.string().email().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().optional(),
  doApiToken: z.string().optional(),

  // S3 Backups
  s3Enabled: z.boolean().optional(),
  s3Endpoint: z.string().optional(),
  s3Region: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
})

// Model for system settings (will be stored in a dedicated table)
// For now, we'll store in a JSON field or use environment variables
// In production, you might want a dedicated SystemSettings table

/**
 * GET /api/settings
 * Get current system settings
 */
app.get('/', async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  // For now, return environment variables
  // In production, you'd want to fetch from database
  const settings = {
    // AI Providers
    geminiApiKey: process.env.GEMINI_API_KEY ? '••••••' : '',
    groqApiKey: process.env.GROQ_API_KEY ? '••••••' : '',
    ollamaEnabled: process.env.OLLAMA_ENABLED === 'true',
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'ollama',

    // Email (SMTP)
    smtpEnabled: process.env.SMTP_ENABLED === 'true',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD ? '••••••' : '',
    smtpFromName: process.env.SMTP_FROM_NAME || 'OpenPanel',
    smtpFromEmail: process.env.SMTP_FROM_EMAIL || '',

    // DNS Providers
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN ? '••••••' : '',
    cloudflareEmail: process.env.CLOUDFLARE_EMAIL || '',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ? '••••••' : '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '••••••' : '',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    doApiToken: process.env.DO_API_TOKEN ? '••••••' : '',

    // S3 Backups
    s3Enabled: process.env.S3_ENABLED === 'true',
    s3Endpoint: process.env.S3_ENDPOINT || '',
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || '',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ? '••••••' : '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ? '••••••' : '',
  }

  return c.json(settings)
})

/**
 * PUT /api/settings
 * Update system settings
 */
app.put('/', async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  // Check if user is admin (optional - add RBAC check here)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  // Parse and validate request body
  const body = await c.req.json()
  const validated = settingsSchema.parse(body)

  // In a real implementation, you would:
  // 1. Store these in a database table
  // 2. Update .env file (requires write permissions)
  // 3. Use a configuration service like Vault

  // For this demo, we'll store in database
  // You'll need to create a SystemSettings model in Prisma schema

  // TODO: Implement actual storage
  // For now, just return success
  // In production, you'd want to:
  // - Encrypt sensitive values
  // - Store in database or secure config service
  // - Update environment variables
  // - Restart services if needed

  return c.json({
    message: 'Settings updated successfully',
    settings: validated,
  })
})

/**
 * POST /api/settings/ai-providers
 * Configure AI providers (used by onboarding)
 */
app.post('/ai-providers', async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const body = await c.req.json()

  // Validate AI provider settings
  const aiProviderSchema = z.object({
    geminiApiKey: z.string().optional(),
    groqApiKey: z.string().optional(),
    ollamaEnabled: z.boolean().optional(),
    ollamaHost: z.string().optional(),
    defaultProvider: z.enum(['ollama', 'gemini', 'groq']).optional(),
  })

  const validated = aiProviderSchema.parse(body)

  // TODO: Store in database
  // For now, just return success

  return c.json({
    message: 'AI providers configured successfully',
    config: validated,
  })
})

/**
 * GET /api/settings/onboarding-status
 * Check if onboarding is completed
 */
app.get('/onboarding-status', async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  // Check if user has completed onboarding
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  // You can add a field to the User model to track onboarding status
  // For now, we'll just check if any AI provider is configured
  const hasAIProvider = process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OLLAMA_ENABLED === 'true'

  return c.json({
    completed: !!hasAIProvider,
    userId: user.id,
  })
})

export default app
