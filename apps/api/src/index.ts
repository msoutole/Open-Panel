// ============================================
// LOAD ENVIRONMENT VARIABLES FROM ROOT .env
// ============================================
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync } from 'fs'

// Find root directory
// In development: apps/api/src -> go up 3 levels to root
// In production: dist/ -> go up 2 levels to apps/api, then 2 more to root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to find root by looking for package.json or .env
let rootDir = process.cwd()
const possibleRoots = [
  resolve(__dirname, '../../..'), // dev: apps/api/src -> root
  resolve(__dirname, '../../../..'), // prod: dist/ -> root
  process.cwd(), // fallback to current working directory
]

// Find root directory by checking for .env or package.json
for (const possibleRoot of possibleRoots) {
  if (existsSync(resolve(possibleRoot, '.env')) || existsSync(resolve(possibleRoot, 'package.json'))) {
    rootDir = possibleRoot
    break
  }
}

// Load .env from root directory
config({ path: resolve(rootDir, '.env') })

import './instrumentation'

// ============================================
// ENVIRONMENT VALIDATION (must be first!)
// ============================================
import { env, isProduction, isDevelopment } from './lib/env'

import { createServer } from 'http'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { HTTPException } from 'hono/http-exception'
import { swaggerUI } from '@hono/swagger-ui'
import { openAPISchema } from './lib/openapi'
import type { Variables } from './types'
import { ContainerWebSocketGateway } from './websocket/container-gateway'
import { LogsWebSocketGateway } from './websocket/logs-gateway'
import { MetricsWebSocketGateway } from './websocket/metrics-gateway'
import { TerminalWebSocketGateway } from './websocket/terminal-gateway'

// Import routes
import auth from './routes/auth'
import users from './routes/users'
import teams from './routes/teams'
import projects from './routes/projects'
import domains from './routes/domains'
import containers from './routes/containers'
import builds from './routes/builds'
import settings from './routes/settings'
import webhooks from './routes/webhooks'
import ssl from './routes/ssl'
import databases from './routes/databases'
import health from './routes/health'
import backups from './routes/backups'
import onboarding from './routes/onboarding'
import metrics from './routes/metrics'
import audit from './routes/audit'
import stats from './routes/stats'
import templates from './routes/templates'
import hostinger from './routes/hostinger'

// Import middlewares
import { authMiddleware } from './middlewares/auth'
import { errorHandler } from './middlewares/error-handler'
import { loggerMiddleware } from './middlewares/logger'
import { apiRateLimiter, publicRateLimiter } from './middlewares/rate-limit'
import { securityHeaders } from './middlewares/security'

// Import logger
import { logger, logInfo, logError } from './lib/logger'

// Import scheduler and backup service
import { initializeScheduler } from './services/scheduler'
import { BackupService } from './services/backup'

const app = new Hono<{ Variables: Variables }>()

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.onError(errorHandler)

// ============================================
// GLOBAL MIDDLEWARES
// ============================================

// Structured logger with request ID
app.use('*', loggerMiddleware)

// Security headers (early in the chain)
app.use('*', securityHeaders)

// Pretty JSON
app.use('*', prettyJSON())

// Rate limiting (before auth to prevent brute force on auth endpoints)
app.use('/api/*', apiRateLimiter)
app.use('/health', publicRateLimiter)

// CORS - Allow frontend to communicate with API
app.use(
  '*',
  cors({
    origin: (origin) => {
      // In development, be permissive with localhost origins
      if (isDevelopment) {
        // Allow requests from any localhost variant
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return origin || '*';
        }
      }

      // In production, use configured origins
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3000/',
        env.CORS_ORIGIN,
      ].filter(Boolean);

      // Check if origin is in allowed list and return it
      if (origin && allowedOrigins.includes(origin)) {
        return origin;
      }

      // In development, allow anyway; in production, deny
      if (isDevelopment) {
        return origin || '*';
      }

      // Deny unknown origins in production
      return undefined;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours
  })
)

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.3.0',
  })
})

// API Documentation - OpenAPI Schema JSON
app.get('/api/openapi.json', (c) => {
  return c.json(openAPISchema)
})

// API Documentation - Swagger UI
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

// Public routes
app.route('/api/auth', auth)
app.route('/api/webhooks', webhooks)

// Protected routes (require authentication)
app.use('/api/*', authMiddleware)

// Protected routes
app.route('/api/users', users)
app.route('/api/teams', teams)
app.route('/api/projects', projects)
app.route('/api/domains', domains)
app.route('/api/containers', containers)
app.route('/api/builds', builds)
app.route('/api/settings', settings)
app.route('/api/ssl', ssl)
app.route('/api/databases', databases)
app.route('/api/health', health)
app.route('/api/backups', backups)
app.route('/api/onboarding', onboarding)
app.route('/api/metrics', metrics)
app.route('/api/audit', audit)
app.route('/api/stats', stats)
app.route('/api/templates', templates)
app.route('/api/hostinger', hostinger)

app.get('/api/protected', (c) => {
  const user = c.get('user')
  return c.json({
    message: 'This is a protected route',
    user,
  })
})

// ============================================
// ERROR HANDLING
// ============================================

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: err.status,
      },
      err.status
    )
  }

  logError('Unhandled error', err)

  return c.json(
    {
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : undefined,
    },
    500
  )
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path,
    },
    404
  )
})

// ============================================
// SERVER
// ============================================

const port = Number(env.API_PORT)

logInfo(`OpenPanel API starting on port ${port}`, { port, environment: env.NODE_ENV })

// Create HTTP server with Hono
const server = createServer(async (req, res) => {
  try {
    // Build request URL
    const protocol = (req.socket as any).encrypted ? 'https' : 'http'
    const host = req.headers.host || `localhost:${port}`
    const url = `${protocol}://${host}${req.url}`

    // Read request body
    let body: Buffer | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      body = Buffer.concat(chunks)
    }

    // Create fetch request
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as any,
      body: body,
    })

    // Process with Hono
    const response = await app.fetch(request)

    // Send response
    res.writeHead(response.status, Object.fromEntries(response.headers))

    if (response.body) {
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }

    res.end()
  } catch (err) {
    logError('Request error', err)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

// Initialize WebSocket gateways
const containerWsGateway = new ContainerWebSocketGateway(server)
const logsWsGateway = new LogsWebSocketGateway(server)
const metricsWsGateway = new MetricsWebSocketGateway(server)
const terminalWsGateway = new TerminalWebSocketGateway(server)

// Export gateways for use in other modules
export { containerWsGateway, logsWsGateway, metricsWsGateway, terminalWsGateway }

// Start server
server.listen(port, () => {
  logInfo(`Server running at http://localhost:${port}`, { port })
  logInfo(`Container WebSocket gateway: ws://localhost:${port}/ws/containers`)
  logInfo(`Logs WebSocket gateway: ws://localhost:${port}/ws/logs`)
  logInfo(`Metrics WebSocket gateway: ws://localhost:${port}/ws/metrics`)
  logInfo(`Terminal WebSocket gateway: ws://localhost:${port}/ws/terminal`)
  logInfo(`Environment: ${env.NODE_ENV}`, { environment: env.NODE_ENV })

  // Initialize backup service
  const backupService = BackupService.getInstance()
  backupService.initialize().catch((err) => {
    logError('Failed to initialize backup service', err)
  })

  // Initialize scheduler for background tasks
  initializeScheduler()
})

// Graceful shutdown
process.on('SIGINT', () => {
  logInfo('Shutting down gracefully...')
  containerWsGateway.close()
  logsWsGateway.close()
  metricsWsGateway.close()
  terminalWsGateway.close()
  server.close(() => {
    logInfo('Server closed')
    process.exit(0)
  })
})

export default app
