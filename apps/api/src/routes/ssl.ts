import { Hono } from 'hono'
import type { Variables } from '../types'
import { sslService } from '../services/ssl'
import { prisma } from '../lib/prisma'
import { logInfo, logError } from '../lib/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { env } from '../lib/env'

const ssl = new Hono<{ Variables: Variables }>()

/**
 * Request SSL certificate for a domain
 * POST /ssl/request
 */
const requestSchema = z.object({
  domainId: z.string(),
  email: z.string().email().optional(),
  staging: z.boolean().optional().default(false),
})

ssl.post('/request', zValidator('json', requestSchema), async (c) => {
  try {
    const { domainId, email, staging } = c.req.valid('json')

    // Get domain
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    })

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404)
    }

    // Use provided email or fallback to env
    const sslEmail = email || env.SSL_EMAIL || 'admin@' + domain.name

    logInfo(`Requesting SSL certificate for ${domain.name}`, {
      domainId,
      email: sslEmail,
      staging,
    })

    // Request certificate
    const result = await sslService.requestCertificate(domain.name, sslEmail, staging)

    if (!result.success) {
      return c.json(
        {
          error: 'Failed to request SSL certificate',
          details: result.error,
        },
        500
      )
    }

    // Store certificate
    await sslService.storeCertificate(domainId, result)

    return c.json({
      message: 'SSL certificate requested and stored successfully',
      domain: domain.name,
      expiresAt: result.expiresAt,
    })
  } catch (error: unknown) {
    logError('SSL request error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Renew SSL certificate for a domain
 * POST /ssl/renew/:domainId
 */
ssl.post('/renew/:domainId', async (c) => {
  try {
    const domainId = c.req.param('domainId')

    // Get domain
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    })

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404)
    }

    if (!domain.sslEnabled) {
      return c.json({ error: 'SSL not enabled for this domain' }, 400)
    }

    logInfo(`Renewing SSL certificate for ${domain.name}`)

    // Renew certificate
    const result = await sslService.renewCertificate(domain.name)

    if (!result.success) {
      return c.json(
        {
          error: 'Failed to renew SSL certificate',
          details: result.error,
        },
        500
      )
    }

    // Store renewed certificate
    await sslService.storeCertificate(domainId, result)

    return c.json({
      message: 'SSL certificate renewed successfully',
      domain: domain.name,
      expiresAt: result.expiresAt,
    })
  } catch (error: unknown) {
    logError('SSL renewal error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Revoke SSL certificate for a domain
 * DELETE /ssl/revoke/:domainId
 */
ssl.delete('/revoke/:domainId', async (c) => {
  try {
    const domainId = c.req.param('domainId')

    // Get domain
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    })

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404)
    }

    if (!domain.sslEnabled) {
      return c.json({ error: 'SSL not enabled for this domain' }, 400)
    }

    logInfo(`Revoking SSL certificate for ${domain.name}`)

    // Revoke certificate
    const success = await sslService.revokeCertificate(domain.name)

    if (!success) {
      return c.json({ error: 'Failed to revoke SSL certificate' }, 500)
    }

    // Update database
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        sslEnabled: false,
        sslCertificate: null,
        sslExpiresAt: null,
        sslAutoRenew: false,
      },
    })

    return c.json({
      message: 'SSL certificate revoked successfully',
      domain: domain.name,
    })
  } catch (error: unknown) {
    logError('SSL revocation error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get SSL certificate info
 * GET /ssl/info/:domainId
 */
ssl.get('/info/:domainId', async (c) => {
  try {
    const domainId = c.req.param('domainId')

    // Get domain
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: {
        id: true,
        name: true,
        sslEnabled: true,
        sslExpiresAt: true,
        sslAutoRenew: true,
      },
    })

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404)
    }

    // Calculate days until expiry
    let daysUntilExpiry = null
    if (domain.sslExpiresAt) {
      const now = new Date()
      const expiry = new Date(domain.sslExpiresAt)
      daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return c.json({
      domain: domain.name,
      sslEnabled: domain.sslEnabled,
      expiresAt: domain.sslExpiresAt,
      daysUntilExpiry,
      autoRenew: domain.sslAutoRenew,
      needsRenewal: daysUntilExpiry !== null && daysUntilExpiry < 30,
    })
  } catch (error: unknown) {
    logError('SSL info error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * List all domains with SSL status
 * GET /ssl/list
 */
ssl.get('/list', async (c) => {
  try {
    const domains = await prisma.domain.findMany({
      select: {
        id: true,
        name: true,
        sslEnabled: true,
        sslExpiresAt: true,
        sslAutoRenew: true,
      },
      orderBy: {
        sslExpiresAt: 'asc',
      },
    })

    const domainsWithStatus = domains.map((domain) => {
      let daysUntilExpiry = null
      if (domain.sslExpiresAt) {
        const now = new Date()
        const expiry = new Date(domain.sslExpiresAt)
        daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        ...domain,
        daysUntilExpiry,
        needsRenewal: daysUntilExpiry !== null && daysUntilExpiry < 30,
        status: domain.sslEnabled
          ? daysUntilExpiry !== null && daysUntilExpiry < 0
            ? 'expired'
            : daysUntilExpiry !== null && daysUntilExpiry < 30
            ? 'expiring_soon'
            : 'active'
          : 'disabled',
      }
    })

    return c.json({
      domains: domainsWithStatus,
      total: domains.length,
      enabled: domains.filter((d) => d.sslEnabled).length,
      expiringCount: domainsWithStatus.filter((d) => d.needsRenewal).length,
    })
  } catch (error: unknown) {
    logError('SSL list error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Trigger manual renewal check for all domains
 * POST /ssl/renew-all
 */
ssl.post('/renew-all', async (c) => {
  try {
    const daysBeforeExpiry = Number(c.req.query('days') || '30')

    logInfo('Triggering manual SSL renewal check', { daysBeforeExpiry })

    const renewed = await sslService.renewExpiringCertificates(daysBeforeExpiry)

    return c.json({
      message: 'SSL renewal check complete',
      renewed,
    })
  } catch (error: unknown) {
    logError('SSL renew-all error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Check if certbot is installed
 * GET /ssl/certbot/status
 */
ssl.get('/certbot/status', async (c) => {
  try {
    const isInstalled = await sslService.isCertbotInstalled()

    return c.json({
      installed: isInstalled,
      message: isInstalled ? 'Certbot is installed' : 'Certbot is not installed',
    })
  } catch (error: unknown) {
    logError('Certbot status check error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default ssl
