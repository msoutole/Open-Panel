import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  encryptProjectEnvVars,
  decryptProjectEnvVars,
  isSensitiveField,
  sanitizeForLogging,
  encryptSSLCertificate,
  decryptSSLCertificate,
} from '../../middlewares/encryption'

// Mock crypto module
vi.mock('../../lib/crypto', () => ({
  encryptEnvVars: vi.fn((data) => `encrypted:${JSON.stringify(data)}`),
  decryptEnvVars: vi.fn((data) => {
    if (data.startsWith('encrypted:')) {
      return JSON.parse(data.replace('encrypted:', ''))
    }
    throw new Error('Invalid encrypted data')
  }),
  maskSensitive: vi.fn((value, chars) => {
    if (typeof value !== 'string') return value
    if (value.length <= chars * 2) return '***'
    return value.substring(0, chars) + '***' + value.substring(value.length - chars)
  }),
}))

import { encryptEnvVars, decryptEnvVars, maskSensitive } from '../../lib/crypto'

describe('Encryption Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('encryptProjectEnvVars', () => {
    it('should encrypt environment variables', () => {
      const envVars = {
        API_KEY: 'secret-api-key',
        DATABASE_URL: 'postgresql://user:pass@localhost/db',
        NODE_ENV: 'production',
      }

      const result = encryptProjectEnvVars(envVars)

      expect(encryptEnvVars).toHaveBeenCalledWith(envVars)
      expect(result).toContain('encrypted:')
    })

    it('should return null for empty env vars', () => {
      const result = encryptProjectEnvVars({})

      expect(result).toBeNull()
      expect(encryptEnvVars).not.toHaveBeenCalled()
    })

    it('should return null for null input', () => {
      const result = encryptProjectEnvVars(null)

      expect(result).toBeNull()
      expect(encryptEnvVars).not.toHaveBeenCalled()
    })

    it('should return null for undefined input', () => {
      const result = encryptProjectEnvVars(undefined)

      expect(result).toBeNull()
      expect(encryptEnvVars).not.toHaveBeenCalled()
    })

    it('should throw error on encryption failure', () => {
      vi.mocked(encryptEnvVars).mockImplementationOnce(() => {
        throw new Error('Encryption failed')
      })

      const envVars = { KEY: 'value' }

      expect(() => encryptProjectEnvVars(envVars)).toThrow(
        'Failed to encrypt environment variables'
      )
    })
  })

  describe('decryptProjectEnvVars', () => {
    it('should decrypt environment variables', () => {
      const encryptedData = 'encrypted:{"API_KEY":"secret","NODE_ENV":"prod"}'

      const result = decryptProjectEnvVars(encryptedData)

      expect(decryptEnvVars).toHaveBeenCalledWith(encryptedData)
      expect(result).toEqual({
        API_KEY: 'secret',
        NODE_ENV: 'prod',
      })
    })

    it('should return null for empty encrypted data', () => {
      const result = decryptProjectEnvVars('')

      expect(result).toBeNull()
      expect(decryptEnvVars).not.toHaveBeenCalled()
    })

    it('should return null for null input', () => {
      const result = decryptProjectEnvVars(null)

      expect(result).toBeNull()
      expect(decryptEnvVars).not.toHaveBeenCalled()
    })

    it('should return null for undefined input', () => {
      const result = decryptProjectEnvVars(undefined)

      expect(result).toBeNull()
      expect(decryptEnvVars).not.toHaveBeenCalled()
    })

    it('should handle legacy unencrypted data (JSON)', () => {
      const legacyData = '{"API_KEY":"secret","NODE_ENV":"prod"}'

      vi.mocked(decryptEnvVars).mockImplementationOnce(() => {
        throw new Error('Not encrypted')
      })

      const result = decryptProjectEnvVars(legacyData)

      expect(result).toEqual({
        API_KEY: 'secret',
        NODE_ENV: 'prod',
      })
    })

    it('should throw error on decryption failure with invalid data', () => {
      const invalidData = 'not-encrypted-or-json'

      vi.mocked(decryptEnvVars).mockImplementationOnce(() => {
        throw new Error('Decryption failed')
      })

      expect(() => decryptProjectEnvVars(invalidData)).toThrow(
        'Failed to decrypt environment variables'
      )
    })
  })

  describe('isSensitiveField', () => {
    it('should detect sensitive field names', () => {
      expect(isSensitiveField('password')).toBe(true)
      expect(isSensitiveField('API_KEY')).toBe(true)
      expect(isSensitiveField('secret_token')).toBe(true)
      expect(isSensitiveField('auth_header')).toBe(true)
      expect(isSensitiveField('private_key')).toBe(true)
      expect(isSensitiveField('access_token')).toBe(true)
      expect(isSensitiveField('credential')).toBe(true)
      expect(isSensitiveField('pwd')).toBe(true)
    })

    it('should not detect non-sensitive field names', () => {
      expect(isSensitiveField('username')).toBe(false)
      expect(isSensitiveField('email')).toBe(false)
      expect(isSensitiveField('name')).toBe(false)
      expect(isSensitiveField('id')).toBe(false)
      expect(isSensitiveField('createdAt')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isSensitiveField('PASSWORD')).toBe(true)
      expect(isSensitiveField('Password')).toBe(true)
      expect(isSensitiveField('PassWord')).toBe(true)
    })
  })

  describe('sanitizeForLogging', () => {
    it('should mask sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
        api_key: 'abcdef123456',
      }

      const sanitized = sanitizeForLogging(data)

      expect(sanitized.username).toBe('john')
      expect(sanitized.email).toBe('john@example.com')
      expect(sanitized.password).toBe('sec***123')
      expect(sanitized.api_key).toBe('abc***456')
    })

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret123',
            token: 'abc123xyz',
          },
        },
      }

      const sanitized = sanitizeForLogging(data)

      expect(sanitized.user.name).toBe('John')
      expect(sanitized.user.credentials.password).toBe('sec***123')
      expect(sanitized.user.credentials.token).toBe('abc***xyz')
    })

    it('should not modify non-sensitive fields', () => {
      const data = {
        id: '123',
        name: 'Test',
        email: 'test@example.com',
        createdAt: '2024-01-01',
      }

      const sanitized = sanitizeForLogging(data)

      expect(sanitized).toEqual(data)
    })

    it('should handle null and undefined values', () => {
      const data = {
        name: 'Test',
        password: null as any,
        token: undefined as any,
      }

      const sanitized = sanitizeForLogging(data)

      expect(sanitized.name).toBe('Test')
      expect(sanitized.password).toBeNull()
      expect(sanitized.token).toBeUndefined()
    })

    it('should preserve original object', () => {
      const original = {
        name: 'Test',
        password: 'secret',
      }

      const sanitized = sanitizeForLogging(original)

      // Original should not be modified
      expect(original.password).toBe('secret')
      // Sanitized should be masked
      expect(sanitized.password).not.toBe('secret')
    })
  })

  describe('encryptSSLCertificate', () => {
    it('should encrypt SSL certificate with all fields', () => {
      const cert = {
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...',
        certificate: '-----BEGIN CERTIFICATE-----\nMIID...',
        chain: '-----BEGIN CERTIFICATE-----\nMIIE...',
      }

      const encrypted = encryptSSLCertificate(cert)

      expect(encryptEnvVars).toHaveBeenCalledWith({
        privateKey: cert.privateKey,
        certificate: cert.certificate,
        chain: cert.chain,
      })
      expect(encrypted).toContain('encrypted:')
    })

    it('should encrypt SSL certificate without chain', () => {
      const cert = {
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...',
        certificate: '-----BEGIN CERTIFICATE-----\nMIID...',
      }

      const encrypted = encryptSSLCertificate(cert)

      expect(encryptEnvVars).toHaveBeenCalledWith({
        privateKey: cert.privateKey,
        certificate: cert.certificate,
        chain: '',
      })
    })
  })

  describe('decryptSSLCertificate', () => {
    it('should decrypt SSL certificate', () => {
      const encryptedData =
        'encrypted:{"privateKey":"-----BEGIN PRIVATE KEY-----","certificate":"-----BEGIN CERTIFICATE-----","chain":"-----BEGIN CERTIFICATE-----"}'

      const decrypted = decryptSSLCertificate(encryptedData)

      expect(decrypted).toEqual({
        privateKey: '-----BEGIN PRIVATE KEY-----',
        certificate: '-----BEGIN CERTIFICATE-----',
        chain: '-----BEGIN CERTIFICATE-----',
      })
    })

    it('should handle missing chain field', () => {
      const encryptedData =
        'encrypted:{"privateKey":"-----BEGIN PRIVATE KEY-----","certificate":"-----BEGIN CERTIFICATE-----","chain":""}'

      const decrypted = decryptSSLCertificate(encryptedData)

      expect(decrypted).toEqual({
        privateKey: '-----BEGIN PRIVATE KEY-----',
        certificate: '-----BEGIN CERTIFICATE-----',
        chain: undefined,
      })
    })
  })

  describe('encryption round-trip', () => {
    it('should encrypt and decrypt env vars correctly', () => {
      const original = {
        API_KEY: 'my-secret-key',
        DATABASE_URL: 'postgresql://localhost/db',
        NODE_ENV: 'production',
      }

      const encrypted = encryptProjectEnvVars(original)
      const decrypted = decryptProjectEnvVars(encrypted!)

      expect(decrypted).toEqual(original)
    })

    it('should encrypt and decrypt SSL certificate correctly', () => {
      const original = {
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...',
        certificate: '-----BEGIN CERTIFICATE-----\nMIID...',
        chain: '-----BEGIN CERTIFICATE-----\nMIIE...',
      }

      const encrypted = encryptSSLCertificate(original)
      const decrypted = decryptSSLCertificate(encrypted)

      expect(decrypted.privateKey).toBe(original.privateKey)
      expect(decrypted.certificate).toBe(original.certificate)
      expect(decrypted.chain).toBe(original.chain)
    })
  })
})
