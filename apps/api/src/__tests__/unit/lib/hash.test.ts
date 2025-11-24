import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '../../../lib/hash'

describe('Hash Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'MySecurePassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'SamePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Salt deve ser diferente
    })

    it('should handle empty string', async () => {
      const hash = await hashPassword('')
      expect(hash).toBeDefined()
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'CorrectPassword123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should handle case sensitivity', async () => {
      const password = 'CaseSensitive123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword('casesensitive123!', hash)

      expect(isValid).toBe(false)
    })

    it('should return false for empty password', async () => {
      const password = 'ValidPassword123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword('', hash)

      expect(isValid).toBe(false)
    })
  })
})
