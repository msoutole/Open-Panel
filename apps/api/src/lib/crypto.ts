import crypto from 'crypto'
import { env } from './env'

/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

/**
 * Derive encryption key from secret
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    env.JWT_SECRET,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  )
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  // Derive key from secret + salt
  const key = deriveKey(salt)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get auth tag
  const authTag = cipher.getAuthTag()

  // Return format: salt:iv:authTag:encrypted (all hex encoded)
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted,
  ].join(':')
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted string from encrypt()
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  // Parse encrypted data
  const parts = encryptedData.split(':')

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }

  const [saltHex, ivHex, authTagHex, encrypted] = parts

  // Convert from hex
  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  // Derive key
  const key = deriveKey(salt)

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypt JSON object
 * @param obj - Object to encrypt
 * @returns Encrypted string
 */
export function encryptJSON<T>(obj: T): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt JSON object
 * @param encryptedData - Encrypted string
 * @returns Decrypted object
 */
export function decryptJSON<T>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData)
  return JSON.parse(decrypted) as T
}

/**
 * Encrypt environment variables object
 * @param envVars - Key-value pairs of environment variables
 * @returns Encrypted string
 */
export function encryptEnvVars(envVars: Record<string, string>): string {
  return encryptJSON(envVars)
}

/**
 * Decrypt environment variables object
 * @param encryptedData - Encrypted string
 * @returns Decrypted key-value pairs
 */
export function decryptEnvVars(encryptedData: string): Record<string, string> {
  return decryptJSON<Record<string, string>>(encryptedData)
}

/**
 * Hash password (one-way)
 * For backwards compatibility with existing hash.ts
 */
export function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(secret, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify hashed secret
 */
export function verifyHashedSecret(secret: string, hashed: string): boolean {
  const [salt, hash] = hashed.split(':')
  const verifyHash = crypto.pbkdf2Sync(secret, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

/**
 * Mask sensitive string (for logging)
 * @param value - Sensitive string
 * @param visibleChars - Number of visible characters at start/end
 * @returns Masked string (e.g., "sk_l...xyz")
 */
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '***'
  }

  const start = value.slice(0, visibleChars)
  const end = value.slice(-visibleChars)
  return `${start}...${end}`
}
