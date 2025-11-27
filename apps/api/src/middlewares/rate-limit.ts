import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { redis } from '../lib/redis'
import { env, isDevelopment } from '../lib/env'
import { logWarn } from '../lib/logger'

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (c: Context) => string // Custom key generator
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
}

/**
 * Generate rate limit key from request
 */
function defaultKeyGenerator(c: Context): string {
  // Try to get user ID from auth context
  const user = c.get('user')
  if (user?.userId) {
    return `rate_limit:user:${user.userId}`
  }

  // Fall back to IP address
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0] ||
    c.req.header('x-real-ip') ||
    'unknown'

  return `rate_limit:ip:${ip}`
}

/**
 * Redis-based rate limiter middleware
 * Uses sliding window algorithm for accurate rate limiting
 */
export function rateLimiter(config: Partial<RateLimitConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const { windowMs, max, message, keyGenerator = defaultKeyGenerator } = fullConfig

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c)
    const now = Date.now()
    const windowStart = now - windowMs

    try {
      // Remove old entries outside the window
      await redis.zremrangebyscore(key, 0, windowStart)

      // Count requests in current window
      const requestCount = await redis.zcard(key)

      // Set remaining and reset headers
      const remaining = Math.max(0, max - requestCount)
      const resetTime = new Date(now + windowMs)

      c.header('X-RateLimit-Limit', max.toString())
      c.header('X-RateLimit-Remaining', remaining.toString())
      c.header('X-RateLimit-Reset', resetTime.toISOString())

      // Check if limit exceeded
      if (requestCount >= max) {
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES')
        const retryAfter = oldestRequest.length > 0
          ? Math.ceil((Number(oldestRequest[1]) + windowMs - now) / 1000)
          : Math.ceil(windowMs / 1000)

        c.header('Retry-After', retryAfter.toString())

        logWarn('Rate limit exceeded', {
          key,
          requestCount,
          max,
          ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
          path: c.req.path,
          method: c.req.method,
        })

        throw new HTTPException(429, { message })
      }

      // Add current request to the window
      await redis.zadd(key, now, `${now}:${Math.random()}`)

      // Set expiry on the key (cleanup)
      await redis.expire(key, Math.ceil(windowMs / 1000))

      await next()
    } catch (error) {
      // If Redis is down, allow the request through (fail open)
      if (error instanceof HTTPException) {
        throw error
      }

      logWarn('Rate limiter Redis error, allowing request through', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      })

      await next()
    }
  }
}

/**
 * Predefined rate limiters for common use cases
 */

// Strict rate limiter for auth endpoints (prevent brute force)
// In development, be much more permissive for testing
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 5, // 1000 attempts in dev, 5 in production
  message: 'Too many authentication attempts, please try again later',
})

// Standard rate limiter for API endpoints
// In development, be more permissive
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 100, // Much higher in development
})

// Relaxed rate limiter for public endpoints
export const publicRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 300, // Much higher in development
})

// Strict rate limiter for webhook endpoints
export const webhookRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Webhook rate limit exceeded',
  keyGenerator: (c) => {
    // Rate limit by webhook source (repo URL or IP)
    const signature = c.req.header('x-hub-signature-256') ||
                     c.req.header('x-gitlab-token') ||
                     c.req.header('x-forwarded-for') ||
                     'unknown'
    return `rate_limit:webhook:${signature}`
  },
})

// Very strict rate limiter for expensive operations (builds, deployments)
export const expensiveOpRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 operations per hour
  message: 'Too many deployment/build requests, please try again later',
})
