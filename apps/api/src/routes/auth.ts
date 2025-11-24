import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../lib/hash'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt'
import { registerSchema, loginSchema } from '@openpanel/shared'
import type { Variables } from '../types'
import { authRateLimiter } from '../middlewares/rate-limit'
import { logAudit, AuditActions } from '../middlewares/audit'

const auth = new Hono<{ Variables: Variables }>()

// Register - with strict rate limiting
auth.post('/register', authRateLimiter, zValidator('json', registerSchema), async (c) => {
  try {
    const { name, email, password } = c.req.valid('json')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email })

    // Log registration (async)
    await logAudit(c, {
      userId: user.id,
      action: AuditActions.REGISTER,
      resourceType: 'user',
      resourceId: user.id,
      metadata: { email: user.email, name: user.name },
    })

    return c.json({
      user,
      accessToken,
      refreshToken,
    }, 201)
  } catch (error) {
    // Error will be handled by global error handler
    throw error
  }
})

// Login - with strict rate limiting
auth.post('/login', authRateLimiter, zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email })

    // Log login (sync for security audit)
    await logAudit(c, {
      userId: user.id,
      action: AuditActions.LOGIN,
      resourceType: 'user',
      resourceId: user.id,
      sync: true, // Critical security event
    })

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
      },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    throw error
  }
})

// Refresh token - with strict rate limiting
auth.post('/refresh', authRateLimiter, async (c) => {
  try {
    const body = await c.req.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return c.json({ error: 'Refresh token is required' }, 400)
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken)

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    })

    // Optionally rotate refresh token for better security
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
    })

    return c.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    throw error
  }
})

// Get current user
auth.get('/me', async (c) => {
  try {
    const user = c.get('user')

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ user: userData })
  } catch (error) {
    throw error
  }
})

export default auth
