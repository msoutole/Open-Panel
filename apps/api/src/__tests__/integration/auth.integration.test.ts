import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Hono } from 'hono'
import authRoutes from '../../routes/auth'
import { prisma } from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import type { AuthResponse, RegisterResponse, LoginResponse, RefreshTokenResponse } from '../../types/responses'

/**
 * Integration tests for authentication flow
 * Tests the complete flow from registration to login to protected routes
 */
describe('Auth Integration Tests', () => {
  let app: Hono
  const testUser = {
    email: 'integration@test.com',
    password: 'TestPassword123!',
    name: 'Integration Test User',
  }

  beforeAll(async () => {
    // Setup test app
    app = new Hono()
    app.route('/auth', authRoutes)
  })

  beforeEach(async () => {
    // Clean up test user before each test
    try {
      await prisma.user.delete({
        where: { email: testUser.email },
      })
    } catch (error) {
      // User doesn't exist, that's fine
    }
  })

  afterAll(async () => {
    // Cleanup
    try {
      await prisma.user.delete({
        where: { email: testUser.email },
      })
    } catch (error) {
      // Ignore
    }
    await prisma.$disconnect()
  })

  describe('Complete Auth Flow', () => {
    it('should complete full registration -> login -> access flow', async () => {
      // Step 1: Register
      const registerRes = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      expect(registerRes.status).toBe(201)
      const registerJson = (await registerRes.json()) as RegisterResponse
      expect(registerJson.user.email).toBe(testUser.email)
      expect(registerJson.token).toBeDefined()

      const registrationToken = registerJson.token

      // Step 2: Login with same credentials
      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      expect(loginRes.status).toBe(200)
      const loginJson = (await loginRes.json()) as LoginResponse
      expect(loginJson.token).toBeDefined()
      expect(loginJson.user.email).toBe(testUser.email)

      // Step 3: Access protected route with token
      const protectedRes = await app.request('/auth/me', {
        headers: {
          Authorization: `Bearer ${loginJson.token}`,
        },
      })

      expect(protectedRes.status).toBe(200)
      const meJson = (await protectedRes.json()) as { user: { email: string } }
      expect(meJson.user.email).toBe(testUser.email)

      // Step 4: Logout
      const logoutRes = await app.request('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loginJson.token}`,
        },
      })

      expect(logoutRes.status).toBe(200)
    })

    it('should prevent duplicate registration', async () => {
      // First registration
      const firstRes = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      expect(firstRes.status).toBe(201)

      // Second registration with same email
      const secondRes = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      expect(secondRes.status).toBe(409)
      const json = (await secondRes.json()) as { error: string }
      expect(json.error).toContain('already exists')
    })

    it('should hash password properly', async () => {
      // Register user
      await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      })

      expect(user).toBeDefined()
      expect(user!.password).not.toBe(testUser.password)

      // Verify password is properly hashed
      const isMatch = await bcrypt.compare(testUser.password, user!.password)
      expect(isMatch).toBe(true)
    })

    it('should reject invalid credentials', async () => {
      // Register user
      await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      // Try to login with wrong password
      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword123!',
        }),
      })

      expect(loginRes.status).toBe(401)
    })

    it('should update last login timestamp on login', async () => {
      // Register
      await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      const userBefore = await prisma.user.findUnique({
        where: { email: testUser.email },
      })

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Login
      await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      const userAfter = await prisma.user.findUnique({
        where: { email: testUser.email },
      })

      expect(userAfter!.lastLoginAt).toBeDefined()
      expect(userAfter!.lastLoginAt!.getTime()).toBeGreaterThan(
        userBefore!.createdAt.getTime()
      )
    })
  })

  describe('Token Refresh Flow', () => {
    it('should refresh token successfully', async () => {
      // Register and get initial token
      const registerRes = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      const registerData = (await registerRes.json()) as RegisterResponse
      const initialToken = registerData.token
      const refreshToken = registerData.refreshToken

      expect(initialToken).toBeDefined()
      expect(refreshToken).toBeDefined()

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Refresh token
      const refreshRes = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken,
        }),
      })

      expect(refreshRes.status).toBe(200)
      const refreshData = (await refreshRes.json()) as RefreshTokenResponse
      const newToken = refreshData.token
      expect(newToken).toBeDefined()
      expect(newToken).not.toBe(initialToken)
    })
  })

  describe('Security Tests', () => {
    it('should reject weak passwords', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: '123', // weak password
          name: testUser.name,
        }),
      })

      expect(res.status).toBe(400)
    })

    it('should sanitize user input', async () => {
      const maliciousInput = {
        email: 'test@test.com<script>alert("xss")</script>',
        password: 'Password123!',
        name: '<img src=x onerror=alert(1)>',
      }

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousInput),
      })

      // Should either reject or sanitize
      if (res.status === 201) {
        const json = (await res.json()) as RegisterResponse
        expect(json.user.name).not.toContain('<script>')
        expect(json.user.name).not.toContain('<img')
      }
    })

    it('should rate limit login attempts', async () => {
      // Register user
      await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      // Make multiple failed login attempts
      const attempts = []
      for (let i = 0; i < 10; i++) {
        attempts.push(
          app.request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: testUser.email,
              password: 'WrongPassword',
            }),
          })
        )
      }

      const results = await Promise.all(attempts)

      // At least one should be rate limited
      const rateLimited = results.some((res) => res.status === 429)
      expect(rateLimited).toBe(true)
    })
  })
})
