import { encryptEnvVars, decryptEnvVars, maskSensitive } from '../lib/crypto'
import { logDebug } from '../lib/logger'

/**
 * Middleware to automatically encrypt/decrypt environment variables
 *
 * Usage in routes:
 * - Before saving to DB: call encryptProjectEnvVars()
 * - After reading from DB: call decryptProjectEnvVars()
 */

/**
 * Encrypt environment variables before saving to database
 * @param envVars - Plain text env vars object
 * @returns Encrypted string (safe to store in DB)
 */
export function encryptProjectEnvVars(envVars: Record<string, string> | null | undefined): string | null {
  if (!envVars || Object.keys(envVars).length === 0) {
    return null
  }

  try {
    const encrypted = encryptEnvVars(envVars)

    logDebug('Environment variables encrypted', {
      keysCount: Object.keys(envVars).length,
      keys: Object.keys(envVars),
      sample: Object.keys(envVars).length > 0
        ? maskSensitive(Object.values(envVars)[0], 2)
        : undefined,
    })

    return encrypted
  } catch (error) {
    throw new Error('Failed to encrypt environment variables')
  }
}

/**
 * Decrypt environment variables after reading from database
 * @param encryptedData - Encrypted string from DB
 * @returns Plain text env vars object
 */
export function decryptProjectEnvVars(encryptedData: string | null | undefined): Record<string, string> | null {
  if (!encryptedData) {
    return null
  }

  try {
    const decrypted = decryptEnvVars(encryptedData)

    logDebug('Environment variables decrypted', {
      keysCount: Object.keys(decrypted).length,
      keys: Object.keys(decrypted),
    })

    return decrypted
  } catch (error) {
    // DEPRECATED: Legacy support for unencrypted data (migration compatibility)
    // This fallback allows reading old data that was stored as plain JSON
    // TODO: Remove this fallback after all data is migrated to encrypted format
    // Try to parse as JSON (legacy format)
    try {
      const parsed = JSON.parse(encryptedData)

      logDebug('Legacy unencrypted env vars detected (deprecated format)', {
        keysCount: Object.keys(parsed).length,
        warning: 'This data should be re-encrypted',
      })

      return parsed
    } catch {
      throw new Error('Failed to decrypt environment variables')
    }
  }
}

/**
 * Sensitive field names to mask in logs
 */
const SENSITIVE_PATTERNS = [
  /key/i,
  /secret/i,
  /token/i,
  /password/i,
  /pwd/i,
  /auth/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /private/i,
  /credential/i,
]

/**
 * Check if a field name is sensitive
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName))
}

/**
 * Sanitize object for logging (mask sensitive fields)
 * @param obj - Object that may contain sensitive data
 * @returns Object with sensitive fields masked
 */
export function sanitizeForLogging<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (isSensitiveField(key) && typeof sanitized[key] === 'string') {
      sanitized[key] = maskSensitive(sanitized[key], 3) as any
    }

    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Helper to encrypt domain SSL certificates
 */
export function encryptSSLCertificate(cert: { privateKey: string; certificate: string; chain?: string }): string {
  const encrypted = encryptEnvVars({
    privateKey: cert.privateKey,
    certificate: cert.certificate,
    chain: cert.chain || '',
  })

  logDebug('SSL certificate encrypted')

  return encrypted
}

/**
 * Helper to decrypt domain SSL certificates
 */
export function decryptSSLCertificate(encryptedData: string): {
  privateKey: string
  certificate: string
  chain?: string
} {
  const decrypted = decryptEnvVars(encryptedData)

  logDebug('SSL certificate decrypted')

  return {
    privateKey: decrypted.privateKey,
    certificate: decrypted.certificate,
    chain: decrypted.chain || undefined,
  }
}
