import { Hono } from 'hono'
import type { Variables } from '../types'
import { GitService } from '../services/git'
import { BuildService } from '../services/build'
import { webhookRateLimiter } from '../middlewares/rate-limit'
import { logInfo, logWarn, logError } from '../lib/logger'
import crypto from 'crypto'
import { env } from '../lib/env'

const webhooks = new Hono<{ Variables: Variables }>()
const gitService = GitService.getInstance()
const buildService = BuildService.getInstance()

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(payload: string, signature: string | undefined): boolean {
  if (!signature) return false

  const secret = env.JWT_SECRET // Reuse JWT secret for webhook signing
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Verify GitLab webhook token
 */
function verifyGitLabToken(token: string | undefined): boolean {
  if (!token) return false
  const expectedToken = env.JWT_SECRET // Reuse JWT secret
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  )
}

/**
 * GitHub webhook endpoint
 * POST /webhooks/github
 */
webhooks.post('/github', webhookRateLimiter, async (c) => {
  try {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-hub-signature-256')
    const event = c.req.header('x-github-event')

    // Verify signature in production
    if (env.NODE_ENV === 'production' && !verifyGitHubSignature(rawBody, signature)) {
      logWarn('GitHub webhook signature verification failed')
      return c.json({ error: 'Invalid signature' }, 401)
    }

    // Only handle push events
    if (event !== 'push') {
      logInfo(`Ignoring GitHub webhook event: ${event}`)
      return c.json({ message: 'Event ignored' }, 200)
    }

    const payload = JSON.parse(rawBody)

    // Parse webhook
    const webhookData = gitService.parseGitHubWebhook(payload)
    if (!webhookData) {
      logWarn('Failed to parse GitHub webhook payload')
      return c.json({ error: 'Invalid payload' }, 400)
    }

    logInfo('GitHub webhook received', {
      repository: webhookData.repository.fullName,
      branch: webhookData.ref,
      commits: webhookData.commits.length,
    })

    // Trigger deployments
    const result = await gitService.handleWebhookEvent(webhookData)

    return c.json({
      message: 'Webhook processed',
      deploymentsTriggered: result.triggered,
      deployments: result.deployments.map(d => ({
        id: d.id,
        projectId: d.projectId,
        status: d.status,
      })),
    })
  } catch (error: unknown) {
    logError('GitHub webhook error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * GitLab webhook endpoint
 * POST /webhooks/gitlab
 */
webhooks.post('/gitlab', webhookRateLimiter, async (c) => {
  try {
    const rawBody = await c.req.text()
    const token = c.req.header('x-gitlab-token')
    const event = c.req.header('x-gitlab-event')

    // Verify token in production
    if (env.NODE_ENV === 'production' && !verifyGitLabToken(token)) {
      logWarn('GitLab webhook token verification failed')
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Only handle push events
    if (event !== 'Push Hook') {
      logInfo(`Ignoring GitLab webhook event: ${event}`)
      return c.json({ message: 'Event ignored' }, 200)
    }

    const payload = JSON.parse(rawBody)

    // Parse webhook
    const webhookData = gitService.parseGitLabWebhook(payload)
    if (!webhookData) {
      logWarn('Failed to parse GitLab webhook payload')
      return c.json({ error: 'Invalid payload' }, 400)
    }

    logInfo('GitLab webhook received', {
      repository: webhookData.repository.fullName,
      branch: webhookData.ref,
      commits: webhookData.commits.length,
    })

    // Trigger deployments
    const result = await gitService.handleWebhookEvent(webhookData)

    return c.json({
      message: 'Webhook processed',
      deploymentsTriggered: result.triggered,
      deployments: result.deployments.map(d => ({
        id: d.id,
        projectId: d.projectId,
        status: d.status,
      })),
    })
  } catch (error: unknown) {
    logError('GitLab webhook error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Bitbucket webhook endpoint
 * POST /webhooks/bitbucket
 */
webhooks.post('/bitbucket', webhookRateLimiter, async (c) => {
  try {
    const rawBody = await c.req.text()
    const event = c.req.header('x-event-key')

    // Only handle push events
    if (event !== 'repo:push') {
      logInfo(`Ignoring Bitbucket webhook event: ${event}`)
      return c.json({ message: 'Event ignored' }, 200)
    }

    const payload = JSON.parse(rawBody)

    // Parse webhook
    const webhookData = gitService.parseBitbucketWebhook(payload)
    if (!webhookData) {
      logWarn('Failed to parse Bitbucket webhook payload')
      return c.json({ error: 'Invalid payload' }, 400)
    }

    logInfo('Bitbucket webhook received', {
      repository: webhookData.repository.fullName,
      branch: webhookData.ref,
      commits: webhookData.commits.length,
    })

    // Trigger deployments
    const result = await gitService.handleWebhookEvent(webhookData)

    return c.json({
      message: 'Webhook processed',
      deploymentsTriggered: result.triggered,
      deployments: result.deployments.map(d => ({
        id: d.id,
        projectId: d.projectId,
        status: d.status,
      })),
    })
  } catch (error: unknown) {
    logError('Bitbucket webhook error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Generic webhook endpoint (for testing)
 * POST /webhooks/generic
 */
webhooks.post('/generic', webhookRateLimiter, async (c) => {
  try {
    const payload = await c.req.json()

    logInfo('Generic webhook received', { payload })

    return c.json({ message: 'Webhook received', received: new Date().toISOString() })
  } catch (error: unknown) {
    logError('Generic webhook error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Webhook configuration helper
 * GET /webhooks/config/:provider
 */
webhooks.get('/config/:provider', async (c) => {
  const provider = c.req.param('provider')
  const baseUrl = env.CORS_ORIGIN || 'http://localhost:3001'

  const configs: Record<string, {
    url: string
    events: string[]
    headers?: Record<string, string>
    notes: string[]
  }> = {
    github: {
      url: `${baseUrl}/api/webhooks/github`,
      events: ['push'],
      headers: {
        'X-Hub-Signature-256': 'Required for signature verification',
      },
      notes: [
        'Configure webhook secret in GitHub repository settings',
        'Use the same secret as your JWT_SECRET environment variable',
        'Content type: application/json',
      ],
    },
    gitlab: {
      url: `${baseUrl}/api/webhooks/gitlab`,
      events: ['Push events'],
      headers: {
        'X-GitLab-Token': 'Required for authentication',
      },
      notes: [
        'Configure Secret Token in GitLab project settings',
        'Use the same token as your JWT_SECRET environment variable',
      ],
    },
    bitbucket: {
      url: `${baseUrl}/api/webhooks/bitbucket`,
      events: ['Repository push'],
      notes: [
        'Configure in Bitbucket repository webhooks',
        'No authentication required (consider adding IP whitelist)',
      ],
    },
  }

  const config = configs[provider]
  if (!config) {
    return c.json({ error: 'Unknown provider. Supported: github, gitlab, bitbucket' }, 404)
  }

  return c.json({
    provider,
    configuration: config,
  })
})

export default webhooks
