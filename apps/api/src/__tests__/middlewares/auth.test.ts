import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../../middlewares/auth'
import * as jwt from '../../lib/jwt'

describe('Auth Middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()
  })

  it('should reject requests without authorization header', async () => {
    app.use('*', authMiddleware)
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test')
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json).toEqual({ error: 'Unauthorized' })
  })

  it('should reject requests with invalid token format', async () => {
    app.use('*', authMiddleware)
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test', {
      headers: { Authorization: 'InvalidToken' },
    })
    expect(res.status).toBe(401)
  })

  it('should accept requests with valid bearer token', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    vi.spyOn(jwt, 'verifyToken').mockReturnValue(mockUser)

    app.use('*', authMiddleware)
    app.get('/test', (c) => {
      const user = c.get('user')
      return c.json({ user })
    })

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer validtoken123' },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user).toEqual(mockUser)
  })

  it('should reject requests with expired token', async () => {
    vi.spyOn(jwt, 'verifyToken').mockImplementation(() => {
      throw new Error('Token expired')
    })

    app.use('*', authMiddleware)
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer expiredtoken' },
    })

    expect(res.status).toBe(401)
  })

  it('should extract user info and make it available in context', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      name: 'John Doe'
    }
    vi.spyOn(jwt, 'verifyToken').mockReturnValue(mockUser)

    app.use('*', authMiddleware)
    app.get('/profile', (c) => {
      const user = c.get('user')
      return c.json({
        message: `Hello ${user.name}`,
        userId: user.id
      })
    })

    const res = await app.request('/profile', {
      headers: { Authorization: 'Bearer validtoken' },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Hello John Doe')
    expect(json.userId).toBe('user-123')
  })
})
