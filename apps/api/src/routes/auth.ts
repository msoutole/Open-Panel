import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../lib/hash'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt'
import { registerSchema, loginSchema } from '@openpanel/shared'
import type { Variables } from '../types'
import { authRateLimiter } from '../middlewares/rate-limit'
import { logAudit, AuditActions } from '../middlewares/audit'
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  verifyBackupCode,
  encryptTOTPSecret,
  decryptTOTPSecret,
} from '../services/totp'
import { logInfo, logError } from '../lib/logger'
import crypto from 'crypto'

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
const loginWith2FASchema = loginSchema.extend({
  twoFactorCode: z.string().optional(),
  backupCode: z.string().optional(),
})

auth.post('/login', authRateLimiter, zValidator('json', loginWith2FASchema), async (c) => {
  try {
    const { email, password, twoFactorCode, backupCode } = c.req.valid('json')

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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Require 2FA code or backup code
      if (!twoFactorCode && !backupCode) {
        return c.json(
          {
            error: '2FA code required',
            requires2FA: true,
          },
          401
        )
      }

      // Verify 2FA code or backup code
      let isValid2FA = false

      if (twoFactorCode && user.twoFactorSecret) {
        // Verify TOTP code
        isValid2FA = verifyTOTPToken(user.twoFactorSecret, twoFactorCode)
      } else if (backupCode && user.twoFactorBackupCodes) {
        // Verify backup code
        const backupCodes = user.twoFactorBackupCodes as string[]
        isValid2FA = verifyBackupCode(backupCode, backupCodes)

        // Remove used backup code
        if (isValid2FA) {
          const updatedCodes = backupCodes.filter(
            (code) => code !== crypto.createHash('sha256').update(backupCode).digest('hex')
          )
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: updatedCodes },
          })
        }
      }

      if (!isValid2FA) {
        return c.json({ error: 'Invalid 2FA code' }, 401)
      }
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
        twoFactorEnabled: user.twoFactorEnabled,
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
        twoFactorEnabled: true,
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

// 2FA Routes

/**
 * POST /api/auth/2fa/setup
 * Generate TOTP secret and QR code for 2FA setup
 */
auth.post('/2fa/setup', async (c) => {
  try {
    const user = c.get('user')

    if (!user?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (userData.twoFactorEnabled) {
      return c.json({ error: '2FA is already enabled' }, 400)
    }

    // Generate TOTP secret
    const totpSecret = generateTOTPSecret(userData.email, 'OpenPanel')

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(totpSecret.qrCodeUrl)

    // Store temporary secret (encrypted) - user needs to verify before enabling
    const encryptedSecret = encryptTOTPSecret(totpSecret.secret)

    logInfo('2FA setup initiated', { userId: user.userId })

    return c.json({
      secret: totpSecret.secret, // Return plain secret for manual entry
      qrCode: qrCodeDataUrl,
      manualEntryKey: totpSecret.manualEntryKey,
      // Store encrypted secret temporarily (in real implementation, use session/redis)
      tempSecret: encryptedSecret,
    })
  } catch (error) {
    logError('2FA setup error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * POST /api/auth/2fa/enable
 * Enable 2FA after verifying TOTP code
 */
const enable2FASchema = z.object({
  code: z.string().length(6),
  secret: z.string(), // Temporary secret from setup
})

auth.post('/2fa/enable', zValidator('json', enable2FASchema), async (c) => {
  try {
    const { code, secret } = c.req.valid('json')
    const user = c.get('user')

    if (!user?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Verify TOTP code
    const isValid = verifyTOTPToken(secret, code)

    if (!isValid) {
      return c.json({ error: 'Invalid verification code' }, 400)
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)

    // Encrypt secret for storage
    const encryptedSecret = encryptTOTPSecret(secret)

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: backupCodes.hashedCodes,
      },
    })

    // Log audit
    await logAudit(c, {
      action: AuditActions.USER_UPDATE,
      resourceType: 'user',
      resourceId: user.userId,
      metadata: { action: '2FA enabled' },
    })

    logInfo('2FA enabled', { userId: user.userId })

    return c.json({
      message: '2FA enabled successfully',
      backupCodes: backupCodes.codes, // Show only once
    })
  } catch (error) {
    logError('2FA enable error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA (requires password verification)
 */
const disable2FASchema = z.object({
  password: z.string(),
})

auth.post('/2fa/disable', zValidator('json', disable2FASchema), async (c) => {
  try {
    const { password } = c.req.valid('json')
    const user = c.get('user')

    if (!user?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, userData.password)

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: undefined,
      },
    })

    // Log audit
    await logAudit(c, {
      action: AuditActions.USER_UPDATE,
      resourceType: 'user',
      resourceId: user.userId,
      metadata: { action: '2FA disabled' },
    })

    logInfo('2FA disabled', { userId: user.userId })

    return c.json({
      message: '2FA disabled successfully',
    })
  } catch (error) {
    logError('2FA disable error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * POST /api/auth/2fa/backup-codes
 * Generate new backup codes
 */
auth.post('/2fa/backup-codes', async (c) => {
  try {
    const user = c.get('user')

    if (!user?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!userData || !userData.twoFactorEnabled) {
      return c.json({ error: '2FA is not enabled' }, 400)
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10)

    // Update backup codes
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        twoFactorBackupCodes: backupCodes.hashedCodes,
      },
    })

    // Log audit
    await logAudit(c, {
      action: AuditActions.USER_UPDATE,
      resourceType: 'user',
      resourceId: user.userId,
      metadata: { action: '2FA backup codes regenerated' },
    })

    logInfo('2FA backup codes regenerated', { userId: user.userId })

    return c.json({
      message: 'Backup codes generated successfully',
      backupCodes: backupCodes.codes, // Show only once
    })
  } catch (error) {
    logError('2FA backup codes error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default auth
