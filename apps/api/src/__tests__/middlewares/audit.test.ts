import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import type { Variables } from '../../types'
import { logAudit, AuditActions } from '../../middlewares/audit'

// Mock audit queue
vi.mock('../../queues/audit-queue', () => ({
  queueAuditLog: vi.fn(),
  createAuditLogSync: vi.fn(),
}))

import { queueAuditLog, createAuditLogSync } from '../../queues/audit-queue'

describe('Audit Middleware', () => {
  let app: Hono<{ Variables: Variables }>

  beforeEach(() => {
    app = new Hono<{ Variables: Variables }>()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logAudit', () => {
    it('should log audit event asynchronously by default', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      app.post('/test', async (c) => {
        await logAudit(c, {
          action: AuditActions.PROJECT_CREATE,
          resourceType: 'project',
          resourceId: 'project-1',
          metadata: { name: 'Test Project' },
        })
        return c.json({ success: true })
      })

      await app.request('/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Mozilla/5.0',
        },
      })

      expect(queueAuditLog).toHaveBeenCalledWith({
        userId: 'user-123',
        action: AuditActions.PROJECT_CREATE,
        resourceType: 'project',
        resourceId: 'project-1',
        metadata: { name: 'Test Project' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })
    })

    it('should log audit event synchronously when sync flag is true', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      app.delete('/test/:id', async (c) => {
        const id = c.req.param('id')
        await logAudit(c, {
          action: AuditActions.PROJECT_DELETE,
          resourceType: 'project',
          resourceId: id,
          sync: true, // Critical operation
        })
        return c.json({ success: true })
      })

      await app.request('/test/project-1', {
        method: 'DELETE',
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Mozilla/5.0',
        },
      })

      expect(createAuditLogSync).toHaveBeenCalledWith({
        userId: 'user-123',
        action: AuditActions.PROJECT_DELETE,
        resourceType: 'project',
        resourceId: 'project-1',
        metadata: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })
    })

    it('should skip audit for unauthenticated requests', async () => {
      app.post('/test', async (c) => {
        await logAudit(c, {
          action: AuditActions.PROJECT_CREATE,
          resourceType: 'project',
        })
        return c.json({ success: true })
      })

      await app.request('/test', { method: 'POST' })

      expect(queueAuditLog).not.toHaveBeenCalled()
      expect(createAuditLogSync).not.toHaveBeenCalled()
    })

    it('should use custom userId if provided', async () => {
      app.post('/test', async (c) => {
        await logAudit(c, {
          userId: 'custom-user-id',
          action: AuditActions.USER_CREATE,
          resourceType: 'user',
        })
        return c.json({ success: true })
      })

      await app.request('/test', { method: 'POST' })

      expect(queueAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'custom-user-id',
        })
      )
    })

    it('should extract IP address from headers', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      app.post('/test', async (c) => {
        await logAudit(c, {
          action: AuditActions.LOGIN,
          resourceType: 'session',
        })
        return c.json({ success: true })
      })

      // Test x-forwarded-for header
      await app.request('/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      expect(queueAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1', // Should use first IP
        })
      )
    })

    it('should extract IP address from x-real-ip header', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      app.post('/test', async (c) => {
        await logAudit(c, {
          action: AuditActions.LOGIN,
          resourceType: 'session',
        })
        return c.json({ success: true })
      })

      await app.request('/test', {
        method: 'POST',
        headers: {
          'x-real-ip': '192.168.1.100',
        },
      })

      expect(queueAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.100',
        })
      )
    })

    it('should include user agent in audit log', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      app.post('/test', async (c) => {
        await logAudit(c, {
          action: AuditActions.SETTINGS_UPDATE,
          resourceType: 'settings',
        })
        return c.json({ success: true })
      })

      await app.request('/test', {
        method: 'POST',
        headers: {
          'user-agent': 'Custom Browser/1.0',
        },
      })

      expect(queueAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: 'Custom Browser/1.0',
        })
      )
    })

    it('should include metadata in audit log', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      app.post('/test', async (c) => {
        await logAudit(c, {
          action: AuditActions.CONTAINER_CREATE,
          resourceType: 'container',
          resourceId: 'container-1',
          metadata: {
            name: 'nginx-container',
            image: 'nginx:latest',
            port: 80,
          },
        })
        return c.json({ success: true })
      })

      await app.request('/test', { method: 'POST' })

      expect(queueAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            name: 'nginx-container',
            image: 'nginx:latest',
            port: 80,
          },
        })
      )
    })
  })

  describe('AuditActions constants', () => {
    it('should have all required action types', () => {
      expect(AuditActions.LOGIN).toBe('USER_LOGIN')
      expect(AuditActions.LOGOUT).toBe('USER_LOGOUT')
      expect(AuditActions.REGISTER).toBe('USER_REGISTER')

      expect(AuditActions.PROJECT_CREATE).toBe('PROJECT_CREATED')
      expect(AuditActions.PROJECT_UPDATE).toBe('PROJECT_UPDATED')
      expect(AuditActions.PROJECT_DELETE).toBe('PROJECT_DELETED')

      expect(AuditActions.CONTAINER_CREATE).toBe('CONTAINER_CREATED')
      expect(AuditActions.CONTAINER_START).toBe('CONTAINER_STARTED')
      expect(AuditActions.CONTAINER_STOP).toBe('CONTAINER_STOPPED')

      expect(AuditActions.DEPLOYMENT_CREATE).toBe('DEPLOYMENT_CREATED')
      expect(AuditActions.DEPLOYMENT_ROLLBACK).toBe('DEPLOYMENT_ROLLBACK')

      expect(AuditActions.TEAM_CREATE).toBe('TEAM_CREATED')
      expect(AuditActions.TEAM_MEMBER_ADD).toBe('TEAM_MEMBER_ADDED')
    })
  })

  describe('audit flow in real scenarios', () => {
    it('should audit login flow', async () => {
      app.post('/auth/login', async (c) => {
        // Simulate login
        const userId = 'user-123'

        await logAudit(c, {
          userId,
          action: AuditActions.LOGIN,
          resourceType: 'session',
          metadata: { email: 'user@example.com' },
          sync: true, // Critical operation
        })

        return c.json({ success: true, userId })
      })

      await app.request('/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
      })

      expect(createAuditLogSync).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          action: 'USER_LOGIN',
          resourceType: 'session',
        })
      )
    })

    it('should audit container lifecycle', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'user-123', email: 'test@test.com' })
        await next()
      })

      // Create container
      app.post('/containers', async (c) => {
        await logAudit(c, {
          action: AuditActions.CONTAINER_CREATE,
          resourceType: 'container',
          resourceId: 'container-1',
        })
        return c.json({ id: 'container-1' })
      })

      // Start container
      app.post('/containers/:id/start', async (c) => {
        const id = c.req.param('id')
        await logAudit(c, {
          action: AuditActions.CONTAINER_START,
          resourceType: 'container',
          resourceId: id,
        })
        return c.json({ success: true })
      })

      // Stop container
      app.post('/containers/:id/stop', async (c) => {
        const id = c.req.param('id')
        await logAudit(c, {
          action: AuditActions.CONTAINER_STOP,
          resourceType: 'container',
          resourceId: id,
        })
        return c.json({ success: true })
      })

      await app.request('/containers', { method: 'POST' })
      await app.request('/containers/container-1/start', { method: 'POST' })
      await app.request('/containers/container-1/stop', { method: 'POST' })

      expect(queueAuditLog).toHaveBeenCalledTimes(3)
    })

    it('should audit team member operations', async () => {
      app.use('*', async (c, next) => {
        c.set('user', { userId: 'owner-123', email: 'owner@test.com' })
        await next()
      })

      app.post('/teams/:teamId/members', async (c) => {
        const teamId = c.req.param('teamId')
        await logAudit(c, {
          action: AuditActions.TEAM_MEMBER_ADD,
          resourceType: 'team',
          resourceId: teamId,
          metadata: { newMemberId: 'user-456' },
        })
        return c.json({ success: true })
      })

      await app.request('/teams/team-1/members', { method: 'POST' })

      expect(queueAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEAM_MEMBER_ADDED',
          resourceType: 'team',
          resourceId: 'team-1',
          metadata: { newMemberId: 'user-456' },
        })
      )
    })
  })
})
