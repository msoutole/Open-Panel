import { z } from 'zod'

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Server configuration
  API_PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .describe('PostgreSQL connection string'),

  // Redis
  REDIS_URL: z
    .string()
    .optional()
    .describe('Redis connection URL (redis://[:password@]host[:port])'),

  REDIS_HOST: z
    .string()
    .default('localhost')
    .describe('Redis host (fallback if REDIS_URL not provided)'),

  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  REDIS_PASSWORD: z
    .string()
    .optional()
    .describe('Redis password (optional)'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters for security')
    .describe('Secret key for JWT signing'),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('15m')
    .describe('JWT access token expiration (e.g., 15m, 1h, 7d)'),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .describe('JWT refresh token expiration (e.g., 7d, 30d)'),

  // CORS
  CORS_ORIGIN: z
    .string()
    .url()
    .optional()
    .describe('Allowed CORS origin (e.g., https://app.example.com)'),

  // Docker
  DOCKER_HOST: z
    .string()
    .optional()
    .describe('Docker host (e.g., localhost, 192.168.1.100)'),

  DOCKER_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .optional(),

  // Git
  GIT_WORKSPACE_PATH: z
    .string()
    .optional()
    .default('/tmp/openpanel/git')
    .describe('Path for cloning git repositories'),

  // Traefik
  TRAEFIK_CONFIG_PATH: z
    .string()
    .optional()
    .default('/etc/traefik')
    .describe('Path to Traefik configuration directory'),

  TRAEFIK_API_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:8080')
    .describe('Traefik API endpoint'),

  // SSL/HTTPS
  SSL_STORAGE_PATH: z
    .string()
    .optional()
    .default('/etc/letsencrypt')
    .describe('Path to SSL certificate storage'),

  SSL_EMAIL: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Invalid email address',
    })
    .describe('Email for SSL certificate notifications'),

  // Backups
  BACKUP_PATH: z
    .string()
    .optional()
    .default('/var/lib/openpanel/backups')
    .describe('Path to backup storage directory'),

  // AI/LLM (optional, for future features)
  OLLAMA_HOST: z
    .string()
    .optional()
    .describe('Ollama API endpoint (e.g., http://localhost:11434)'),

  OPENAI_API_KEY: z
    .string()
    .optional()
    .describe('OpenAI API key for GPT models'),

  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .describe('Anthropic API key for Claude models'),

  // Email (optional, for future notifications)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional().describe('Sentry error tracking DSN'),

  // Feature flags
  ENABLE_WEBHOOKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),

  ENABLE_AUTO_DEPLOY: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),

  ENABLE_AGENTS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),

  // Hostinger API (optional, for DDNS and DNS management)
  HOSTINGER_API_TOKEN: z
    .string()
    .optional()
    .describe('Hostinger API Bearer Token for DNS management'),

  HOSTINGER_API_URL: z
    .string()
    .url()
    .optional()
    .default('https://api.hostinger.com/v1')
    .describe('Hostinger API base URL'),

  HOSTINGER_API_TIMEOUT: z
    .string()
    .optional()
    .default('10000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1000)),

  // DDNS Configuration (optional)
  DDNS_DOMAIN: z
    .string()
    .optional()
    .describe('Main domain for DDNS updates'),

  DDNS_SUBDOMAIN: z
    .string()
    .optional()
    .describe('Subdomain for DDNS updates (e.g., "home")'),

  DDNS_CHECK_INTERVAL: z
    .string()
    .optional()
    .default('300000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(60000))
    .describe('DDNS check interval in milliseconds (default: 5 min)'),
})

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars: string[] = []
      const invalidVars: string[] = []

      console.error('Validation error details:', JSON.stringify(error, null, 2));
      if (!error.issues) {
        console.error('ZodError encountered but .issues property is missing!', error);
        throw error;
      }
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (err.code === 'invalid_type' && (err as any).received === 'undefined') {
          missingVars.push(path)
        } else {
          invalidVars.push(`${path}: ${err.message}`)
        }
      })

      let errorMessage = '❌ Environment variable validation failed:\n\n'

      if (missingVars.length > 0) {
        errorMessage += 'Missing required variables:\n'
        missingVars.forEach((v) => {
          errorMessage += `  - ${v}\n`
        })
        errorMessage += '\n'
      }

      if (invalidVars.length > 0) {
        errorMessage += 'Invalid variables:\n'
        invalidVars.forEach((v) => {
          errorMessage += `  - ${v}\n`
        })
        errorMessage += '\n'
      }

      errorMessage += 'Please check your .env file and ensure all required variables are set.\n'
      errorMessage +=
        'See .env.example for reference or docs/ENVIRONMENT_VARIABLES.md for details.\n'

      console.error(errorMessage)
      throw new Error('Environment validation failed')
    }
    throw error
  }
}

/**
 * Get validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv()

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Helper to check if running in test
 */
export const isTest = env.NODE_ENV === 'test'
