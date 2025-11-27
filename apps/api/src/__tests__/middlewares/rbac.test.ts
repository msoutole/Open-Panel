import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { rbacMiddleware } from '../../middlewares/rbac'

describe('RBAC Middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()
  })

  it('should deny access when user is not authenticated', async () => {
    app.use('*', rbacMiddleware(['OWNER']))
    app.get('/admin', (c) => c.json({ success: true }))

    const res = await app.request('/admin')

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json).toEqual({ error: 'Forbidden' })
  })

  it('should allow access when user has required role', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'OWNER' })
      return next()
    })
    app.use('*', rbacMiddleware(['OWNER', 'ADMIN']))
    app.get('/admin', (c) => c.json({ success: true }))

    const res = await app.request('/admin')

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ success: true })
  })

  it('should deny access when user lacks required role', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'VIEWER' })
      return next()
    })
    app.use('*', rbacMiddleware(['OWNER', 'ADMIN']))
    app.get('/admin', (c) => c.json({ success: true }))

    const res = await app.request('/admin')

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json).toEqual({ error: 'Forbidden' })
  })

  it('should allow OWNER to access all resources', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'OWNER' })
      return next()
    })
    app.use('*', rbacMiddleware(['OWNER']))
    app.get('/admin', (c) => c.json({ success: true }))

    const res = await app.request('/admin')

    expect(res.status).toBe(200)
  })

  it('should allow ADMIN to access admin resources', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'ADMIN' })
      return next()
    })
    app.use('*', rbacMiddleware(['OWNER', 'ADMIN']))
    app.get('/admin', (c) => c.json({ success: true }))

    const res = await app.request('/admin')

    expect(res.status).toBe(200)
  })

  it('should deny MEMBER access to admin-only resources', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'MEMBER' })
      return next()
    })
    app.use('*', rbacMiddleware(['OWNER', 'ADMIN']))
    app.get('/admin', (c) => c.json({ success: true }))

    const res = await app.request('/admin')

    expect(res.status).toBe(403)
  })

  it('should allow MEMBER to access member resources', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'MEMBER' })
      return next()
    })
    app.use('*', rbacMiddleware(['OWNER', 'ADMIN', 'MEMBER']))
    app.get('/dashboard', (c) => c.json({ success: true }))

    const res = await app.request('/dashboard')

    expect(res.status).toBe(200)
  })

  it('should deny VIEWER access to member-only resources', async () => {
    app.use('*', (c, next) => {
      c.set('user', { id: 'user-1', role: 'VIEWER' })
      return next()
    })
    app.use('*', rbacMiddleware(['MEMBER', 'ADMIN', 'OWNER']))
    app.get('/edit', (c) => c.json({ success: true }))

    const res = await app.request('/edit')

    expect(res.status).toBe(403)
  })
})
