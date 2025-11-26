import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import authRoutes from '../../routes/auth'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/hash'

describe('Auth Routes', () => {
  let app: Hono

  beforeEach(() => {
    // Criar nova instância do app para cada teste
    app = new Hono()
    app.route('/auth', authRoutes)
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      }

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      expect(res.status).toBe(201)

      const data = await res.json() as any
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(userData.email)
      expect(data.user.name).toBe(userData.name)
      expect(data.user.password).toBeUndefined() // Senha não deve ser retornada
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()
    })

    it('should fail with existing email', async () => {
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'SecurePass123!',
      }

      // Criar usuário primeiro
      await prisma.user.create({
        data: {
          ...userData,
          password: await hashPassword(userData.password),
        },
      })

      // Tentar registrar novamente
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      expect(res.status).toBe(400)
      const data = await res.json() as any
      expect(data.error).toBe('User already exists')
    })

    it('should fail with invalid email', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          password: 'SecurePass123!',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('should fail with weak password', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // Senha fraca
        }),
      })

      expect(res.status).toBe(400)
    })

    it('should fail with missing fields', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          // Faltando name e password
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      await prisma.user.create({
        data: {
          name: 'Login User',
          email: 'login@example.com',
          password: await hashPassword('CorrectPassword123!'),
          status: 'ACTIVE',
        },
      })
    })

    it('should login with correct credentials', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'CorrectPassword123!',
        }),
      })

      expect(res.status).toBe(200)

      const data = await res.json() as any
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('login@example.com')
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()
    })

    it('should fail with incorrect password', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        }),
      })

      expect(res.status).toBe(401)
      const data = await res.json() as any
      expect(data.error).toBe('Invalid credentials')
    })

    it('should fail with non-existent email', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        }),
      })

      expect(res.status).toBe(401)
      const data = await res.json() as any
      expect(data.error).toBe('Invalid credentials')
    })

    it('should update lastLoginAt on successful login', async () => {
      const beforeLogin = new Date()

      await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'CorrectPassword123!',
        }),
      })

      const user = await prisma.user.findUnique({
        where: { email: 'login@example.com' },
      })

      expect(user?.lastLoginAt).toBeDefined()
      expect(user?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime()
      )
    })
  })

  describe('GET /auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Este teste será implementado depois que tivermos o middleware de auth funcionando
      expect(true).toBe(true) // Placeholder
    })

    it('should fail without authentication', async () => {
      // Este teste será implementado depois que tivermos o middleware de auth funcionando
      expect(true).toBe(true) // Placeholder
    })
  })
})
