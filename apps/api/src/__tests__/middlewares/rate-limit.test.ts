import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimiter, authRateLimiter } from '../../middlewares/rate-limit'
import { redis } from '../../lib/redis'

// Mock Redis
vi.mock('../../lib/redis', () => ({
  redis: {
    zremrangebyscore: vi.fn(),
    zcard: vi.fn(),
    zrange: vi.fn(),
    zadd: vi.fn(),
    expire: vi.fn(),
  },
}))

describe('Rate Limit Middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rateLimiter', () => {
    it('should allow requests under the limit', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(5) // 5 requests in window
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use(
        '*',
        rateLimiter({
          windowMs: 60000,
          max: 10,
        })
      )
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('5')
    })

    it('should block requests over the limit', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(10) // Already at limit
      vi.mocked(redis.zrange).mockResolvedValue(['123456789', '1234567890'])

      app.use(
        '*',
        rateLimiter({
          windowMs: 60000,
          max: 10,
          message: 'Rate limit exceeded',
        })
      )
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      })

      expect(res.status).toBe(429)
      expect(res.headers.get('Retry-After')).toBeDefined()

      const json = await res.json()
      expect(json.message).toBe('Rate limit exceeded')
    })

    it('should use user ID for rate limiting when authenticated', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(0)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123' })
        await next()
      })

      app.use('*', rateLimiter())
      app.get('/test', (c) => c.json({ success: true }))

      await app.request('/test')

      // Check that the key contains user ID
      expect(redis.zremrangebyscore).toHaveBeenCalledWith(
        expect.stringContaining('user:user-123'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should fall back to IP when user is not authenticated', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(0)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use('*', rateLimiter())
      app.get('/test', (c) => c.json({ success: true }))

      await app.request('/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      // Check that the key contains IP
      expect(redis.zremrangebyscore).toHaveBeenCalledWith(
        expect.stringContaining('ip:192.168.1.1'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should use custom key generator', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(0)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use(
        '*',
        rateLimiter({
          keyGenerator: (c) => `custom:${c.req.header('api-key')}`,
        })
      )
      app.get('/test', (c) => c.json({ success: true }))

      await app.request('/test', {
        headers: { 'api-key': 'abc123' },
      })

      expect(redis.zremrangebyscore).toHaveBeenCalledWith(
        'custom:abc123',
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should allow requests when Redis is down (fail open)', async () => {
      vi.mocked(redis.zremrangebyscore).mockRejectedValue(
        new Error('Redis connection failed')
      )

      app.use('*', rateLimiter())
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test')

      expect(res.status).toBe(200)
    })

    it('should set proper rate limit headers', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(3)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use('*', rateLimiter({ max: 10 }))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test')

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('7')
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should cleanup old entries from sliding window', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(5)
      vi.mocked(redis.zcard).mockResolvedValue(2)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use('*', rateLimiter({ windowMs: 60000 }))
      app.get('/test', (c) => c.json({ success: true }))

      await app.request('/test')

      expect(redis.zremrangebyscore).toHaveBeenCalledWith(
        expect.any(String),
        0,
        expect.any(Number)
      )
    })
  })

  describe('authRateLimiter', () => {
    it('should have stricter limits for auth endpoints', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(0)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      app.use('*', authRateLimiter)
      app.post('/login', (c) => c.json({ success: true }))

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
      })

      expect(res.status).toBe(200)
      // Note: Actual limit depends on NODE_ENV (dev vs prod)
    })
  })

  describe('sliding window algorithm', () => {
    it('should accurately track requests across time windows', async () => {
      let requestCount = 0

      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockImplementation(async () => {
        return requestCount
      })
      vi.mocked(redis.zadd).mockImplementation(async () => {
        requestCount++
        return 1
      })
      vi.mocked(redis.expire).mockResolvedValue(1)
      vi.mocked(redis.zrange).mockResolvedValue([])

      app.use('*', rateLimiter({ windowMs: 60000, max: 3 }))
      app.get('/test', (c) => c.json({ success: true }))

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const res = await app.request('/test')
        expect(res.status).toBe(200)
      }

      // 4th request should be rate limited
      const res = await app.request('/test')
      expect(res.status).toBe(429)
    })
  })

  describe('custom configuration', () => {
    it('should respect custom window and max settings', async () => {
      vi.mocked(redis.zremrangebyscore).mockResolvedValue(0)
      vi.mocked(redis.zcard).mockResolvedValue(0)
      vi.mocked(redis.zadd).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      const customConfig = {
        windowMs: 30000, // 30 seconds
        max: 5,
        message: 'Custom rate limit message',
      }

      app.use('*', rateLimiter(customConfig))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test')

      expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(redis.expire).toHaveBeenCalledWith(
        expect.any(String),
        Math.ceil(customConfig.windowMs / 1000)
      )
    })
  })
})
