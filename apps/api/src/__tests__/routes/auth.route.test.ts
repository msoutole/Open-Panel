import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import authRoutes from '../../routes/auth'
import * as jwt from '../../lib/jwt'
import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock JWT
vi.mock('../../lib/jwt', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token'),
  verifyToken: vi.fn(),
}))

describe('Auth Routes', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/auth', authRoutes)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@test.com',
        name: 'New User',
        password: await bcrypt.hash('password123', 10),
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any)

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
        }),
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.user).toBeDefined()
      expect(json.token).toBe('mock-jwt-token')
    })

    it('should reject registration with existing email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
      } as any)

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@test.com',
          password: 'password123',
          name: 'Test User',
        }),
      })

      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          // missing password and name
        }),
      })

      expect(res.status).toBe(400)
    })

    it('should validate email format', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@test.com',
          password: 'password123',
        }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.token).toBe('mock-jwt-token')
      expect(json.user.email).toBe('user@test.com')
    })

    it('should reject login with invalid email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toContain('Invalid')
    })

    it('should reject login with invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        password: await bcrypt.hash('correctpassword', 10),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@test.com',
          password: 'wrongpassword',
        }),
      })

      expect(res.status).toBe(401)
    })

    it('should update last login timestamp', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        password: await bcrypt.hash('password123', 10),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any)

      await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@test.com',
          password: 'password123',
        }),
      })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
          }),
        })
      )
    })
  })

  describe('POST /auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const mockPayload = { userId: 'user-123', email: 'user@test.com' }
      vi.mocked(jwt.verifyToken).mockReturnValue(mockPayload)

      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
      }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
        }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.token).toBe('mock-jwt-token')
    })

    it('should reject invalid refresh token', async () => {
      vi.mocked(jwt.verifyToken).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'invalid-token',
        }),
      })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      // Mock authenticated user
      const mockPayload = { userId: 'user-123' }
      vi.mocked(jwt.verifyToken).mockReturnValue(mockPayload)

      const res = await app.request('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toContain('Logged out')
    })
  })
})
