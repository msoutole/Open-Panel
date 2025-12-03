import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { encrypt, decrypt } from '../middlewares/encryption'
import { logInfo, logError } from '../lib/logger'

/**
 * TOTP Service
 * Handles Time-based One-Time Password (TOTP) for 2FA
 * Compatible with Google Authenticator, Authy, etc.
 */

export interface TOTPSecret {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
}

export interface BackupCodes {
  codes: string[]
  hashedCodes: string[]
}

/**
 * Generate TOTP secret for a user
 */
export function generateTOTPSecret(email: string, issuer: string = 'OpenPanel'): TOTPSecret {
  try {
    // Generate secret
    const secret = authenticator.generateSecret()

    // Create OTP Auth URL for QR code
    const otpAuthUrl = authenticator.keyuri(email, issuer, secret)

    // Generate QR code data URL
    // Note: QRCode.toDataURL is async, but we'll handle it in the route handler
    const manualEntryKey = secret

    logInfo('TOTP secret generated', { email, issuer })

    return {
      secret,
      qrCodeUrl: otpAuthUrl, // Will be converted to QR code image in route
      manualEntryKey,
    }
  } catch (error) {
    logError('Failed to generate TOTP secret', error)
    throw error
  }
}

/**
 * Generate QR code image from OTP Auth URL
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    })
    return qrCodeDataUrl
  } catch (error) {
    logError('Failed to generate QR code', error)
    throw error
  }
}

/**
 * Verify TOTP token
 */
export function verifyTOTPToken(secret: string, token: string): boolean {
  try {
    // Decrypt secret if encrypted
    let decryptedSecret = secret
    try {
      decryptedSecret = decrypt(secret)
    } catch {
      // If decryption fails, assume it's already plaintext (for testing)
      decryptedSecret = secret
    }

    const isValid = authenticator.verify({
      token,
      secret: decryptedSecret,
    })

    return isValid
  } catch (error) {
    logError('Failed to verify TOTP token', error)
    return false
  }
}

/**
 * Generate backup codes for 2FA recovery
 * Returns both plain codes (to show user once) and hashed codes (to store)
 */
export function generateBackupCodes(count: number = 10): BackupCodes {
  const codes: string[] = []
  const hashedCodes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generate 8-digit code
    const code = crypto.randomBytes(4).readUInt32BE(0).toString().padStart(8, '0')
    codes.push(code)

    // Hash code for storage (SHA-256)
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    hashedCodes.push(hash)
  }

  logInfo(`Generated ${count} backup codes`)

  return {
    codes,
    hashedCodes,
  }
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const codeHash = crypto.createHash('sha256').update(code).digest('hex')
  return hashedCodes.includes(codeHash)
}

/**
 * Encrypt TOTP secret for storage
 */
export function encryptTOTPSecret(secret: string): string {
  return encrypt(secret)
}

/**
 * Decrypt TOTP secret
 */
export function decryptTOTPSecret(encryptedSecret: string): string {
  return decrypt(encryptedSecret)
}

