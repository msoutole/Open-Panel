import { prisma } from '../lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { logInfo, logError, logWarn } from '../lib/logger'
import { env } from '../lib/env'
import { encryptSSLCertificate, decryptSSLCertificate } from '../middlewares/encryption'

const execAsync = promisify(exec)

/**
 * SSL/HTTPS Service using Let's Encrypt (Certbot)
 * Automatic SSL certificate provisioning and renewal
 */

export interface SSLCertificate {
  domain: string
  certificatePath: string
  privateKeyPath: string
  fullchainPath: string
  expiresAt: Date
  autoRenew: boolean
}

export interface CertbotResult {
  success: boolean
  certificatePath?: string
  privateKeyPath?: string
  fullchainPath?: string
  error?: string
  expiresAt?: Date
}

export class SSLService {
  private static instance: SSLService
  private certbotPath: string
  private sslStoragePath: string

  private constructor() {
    this.certbotPath = '/usr/bin/certbot'
    this.sslStoragePath = env.SSL_STORAGE_PATH || '/etc/letsencrypt'
  }

  public static getInstance(): SSLService {
    if (!SSLService.instance) {
      SSLService.instance = new SSLService()
    }
    return SSLService.instance
  }

  /**
   * Check if certbot is installed
   */
  async isCertbotInstalled(): Promise<boolean> {
    try {
      await execAsync('which certbot')
      return true
    } catch {
      logWarn('Certbot is not installed')
      return false
    }
  }

  /**
   * Install certbot (for development/testing)
   */
  async installCertbot(): Promise<boolean> {
    try {
      logInfo('Installing certbot...')

      // Detect OS and install accordingly
      const { stdout } = await execAsync('cat /etc/os-release')

      if (stdout.includes('Ubuntu') || stdout.includes('Debian')) {
        await execAsync('sudo apt-get update && sudo apt-get install -y certbot')
      } else if (stdout.includes('CentOS') || stdout.includes('Red Hat')) {
        await execAsync('sudo yum install -y certbot')
      } else {
        logError('Unsupported OS for automatic certbot installation')
        return false
      }

      logInfo('Certbot installed successfully')
      return true
    } catch (error) {
      logError('Failed to install certbot', error)
      return false
    }
  }

  /**
   * Request SSL certificate from Let's Encrypt
   * @param domain - Domain name
   * @param email - Email for Let's Encrypt notifications
   * @param staging - Use staging environment (for testing)
   */
  async requestCertificate(
    domain: string,
    email: string,
    staging: boolean = false
  ): Promise<CertbotResult> {
    try {
      // Check if certbot is installed
      const isInstalled = await this.isCertbotInstalled()
      if (!isInstalled) {
        logWarn('Certbot not installed, attempting to install...')
        const installed = await this.installCertbot()
        if (!installed) {
          return {
            success: false,
            error: 'Certbot is not installed and automatic installation failed',
          }
        }
      }

      logInfo(`Requesting SSL certificate for ${domain}`, {
        domain,
        email,
        staging,
      })

      // Build certbot command
      let command = `certbot certonly --standalone --non-interactive --agree-tos --email ${email} -d ${domain}`

      if (staging) {
        command += ' --staging'
      }

      // Execute certbot
      const { stdout, stderr } = await execAsync(command)

      logInfo('Certbot output', { stdout, stderr })

      // Parse certificate paths
      const liveDir = path.join(this.sslStoragePath, 'live', domain)

      const certificatePath = path.join(liveDir, 'cert.pem')
      const privateKeyPath = path.join(liveDir, 'privkey.pem')
      const fullchainPath = path.join(liveDir, 'fullchain.pem')

      // Verify files exist
      await fs.access(certificatePath)
      await fs.access(privateKeyPath)
      await fs.access(fullchainPath)

      // Parse expiration date (90 days from now for Let's Encrypt)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      logInfo(`SSL certificate issued successfully for ${domain}`, {
        domain,
        expiresAt,
      })

      return {
        success: true,
        certificatePath,
        privateKeyPath,
        fullchainPath,
        expiresAt,
      }
    } catch (error) {
      logError(`Failed to request SSL certificate for ${domain}`, error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: message,
      }
    }
  }

  /**
   * Renew SSL certificate
   */
  async renewCertificate(domain: string): Promise<CertbotResult> {
    try {
      logInfo(`Renewing SSL certificate for ${domain}`)

      const { stdout, stderr } = await execAsync(`certbot renew --cert-name ${domain} --force-renewal`)

      logInfo('Certificate renewed', { stdout, stderr })

      // Get new paths
      const liveDir = path.join(this.sslStoragePath, 'live', domain)
      const certificatePath = path.join(liveDir, 'cert.pem')
      const privateKeyPath = path.join(liveDir, 'privkey.pem')
      const fullchainPath = path.join(liveDir, 'fullchain.pem')

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      return {
        success: true,
        certificatePath,
        privateKeyPath,
        fullchainPath,
        expiresAt,
      }
    } catch (error) {
      logError(`Failed to renew certificate for ${domain}`, error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: message,
      }
    }
  }

  /**
   * Revoke SSL certificate
   */
  async revokeCertificate(domain: string): Promise<boolean> {
    try {
      logInfo(`Revoking SSL certificate for ${domain}`)

      await execAsync(`certbot revoke --cert-name ${domain} --delete-after-revoke`)

      logInfo(`Certificate revoked for ${domain}`)
      return true
    } catch (error) {
      logError(`Failed to revoke certificate for ${domain}`, error)
      return false
    }
  }

  /**
   * Store SSL certificate in database (encrypted)
   */
  async storeCertificate(domainId: string, certResult: CertbotResult): Promise<void> {
    if (!certResult.success || !certResult.certificatePath) {
      throw new Error('Invalid certificate result')
    }

    try {
      // Read certificate files
      const [certificate, privateKey, fullchain] = await Promise.all([
        fs.readFile(certResult.certificatePath, 'utf-8'),
        fs.readFile(certResult.privateKeyPath!, 'utf-8'),
        fs.readFile(certResult.fullchainPath!, 'utf-8'),
      ])

      // Encrypt certificate data
      const encryptedData = encryptSSLCertificate({
        certificate,
        privateKey,
        chain: fullchain,
      })

      // Store in database
      await prisma.domain.update({
        where: { id: domainId },
        data: {
          sslEnabled: true,
          sslCertificate: encryptedData,
          sslExpiresAt: certResult.expiresAt,
          sslAutoRenew: true,
        },
      })

      logInfo('SSL certificate stored in database', { domainId })
    } catch (error) {
      logError('Failed to store SSL certificate', error)
      throw error
    }
  }

  /**
   * Get SSL certificate from database
   */
  async getCertificate(domainId: string): Promise<{
    certificate: string
    privateKey: string
    chain?: string
  } | null> {
    try {
      const domain = await prisma.domain.findUnique({
        where: { id: domainId },
        select: { sslCertificate: true },
      })

      if (!domain?.sslCertificate) {
        return null
      }

      // Decrypt certificate
      const decrypted = decryptSSLCertificate(domain.sslCertificate)

      return decrypted
    } catch (error) {
      logError('Failed to get SSL certificate', error)
      return null
    }
  }

  /**
   * Check certificates expiring soon and renew them
   */
  async renewExpiringCertificates(daysBeforeExpiry: number = 30): Promise<number> {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

      // Find domains with expiring certificates
      const domains = await prisma.domain.findMany({
        where: {
          sslEnabled: true,
          sslAutoRenew: true,
          sslExpiresAt: {
            lte: expiryDate,
          },
        },
      })

      logInfo(`Found ${domains.length} certificates expiring within ${daysBeforeExpiry} days`)

      let renewed = 0

      for (const domain of domains) {
        try {
          const result = await this.renewCertificate(domain.name)

          if (result.success) {
            await this.storeCertificate(domain.id, result)
            renewed++
            logInfo(`Renewed certificate for ${domain.name}`)
          }
        } catch (error) {
          logError(`Failed to renew certificate for ${domain.name}`, error)
        }
      }

      return renewed
    } catch (error) {
      logError('Failed to renew expiring certificates', error)
      return 0
    }
  }

  /**
   * Setup auto-renewal cron job
   * Should be called at server startup
   */
  async setupAutoRenewal(): Promise<void> {
    // Run renewal check every day at 2 AM
    const cronExpression = '0 2 * * *'

    logInfo('SSL auto-renewal setup complete', { cronExpression })

    // In production, use a proper cron library or system cron
    // For now, we'll use a simple interval
    setInterval(
      async () => {
        logInfo('Running SSL certificate renewal check...')
        const renewed = await this.renewExpiringCertificates(30)
        logInfo(`SSL renewal check complete, renewed ${renewed} certificates`)
      },
      24 * 60 * 60 * 1000 // Once per day
    )
  }
}

export const sslService = SSLService.getInstance()

// Setup auto-renewal on module load
if (env.NODE_ENV === 'production') {
  sslService.setupAutoRenewal()
}
