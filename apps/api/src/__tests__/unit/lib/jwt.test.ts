import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  type JWTPayload,
} from '../../../lib/jwt'

describe('JWT Utilities', () => {
  const testPayload: JWTPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
  }

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT tem 3 partes
    })

    it('should include userId and email in token', () => {
      const token = generateAccessToken(testPayload)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should have expiration time', () => {
      const token = generateAccessToken(testPayload)
      const decoded = verifyToken(token)

      expect((decoded as any).exp).toBeDefined()
      expect((decoded as any).exp).toBeGreaterThan(Date.now() / 1000)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should have longer expiration than access token', () => {
      const accessToken = generateAccessToken(testPayload)
      const refreshToken = generateRefreshToken(testPayload)

      const accessDecoded = verifyToken(accessToken)
      const refreshDecoded = verifyToken(refreshToken)

      expect((refreshDecoded as any).exp).toBeGreaterThan((accessDecoded as any).exp!)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateAccessToken(testPayload)
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow()
    })

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not-a-jwt')).toThrow()
    })

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow()
    })

    it('should preserve custom claims', () => {
      const customPayload = {
        ...testPayload,
        customClaim: 'custom-value',
      }
      const token = generateAccessToken(customPayload as any)
      const decoded = verifyToken(token) as any

      expect(decoded.customClaim).toBe('custom-value')
    })
  })

  describe('Token expiration', () => {
    it('should include iat (issued at) timestamp', () => {
      const beforeTime = Math.floor(Date.now() / 1000)
      const token = generateAccessToken(testPayload)
      const afterTime = Math.floor(Date.now() / 1000)
      const decoded = verifyToken(token)

      expect((decoded as any).iat).toBeDefined()
      expect((decoded as any).iat).toBeGreaterThanOrEqual(beforeTime)
      expect((decoded as any).iat).toBeLessThanOrEqual(afterTime)
    })
  })
})
