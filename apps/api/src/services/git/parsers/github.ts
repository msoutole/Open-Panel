import crypto from 'crypto'
import { WebhookParser, WebhookPayload } from '../types'
import { logError } from '../../../../lib/logger'

export class GitHubParser implements WebhookParser {
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  }

  parse(payload: any): WebhookPayload | null {
    try {
      if (!payload.ref || !payload.repository) {
        return null
      }

      return {
        repository: {
          url: payload.repository.clone_url || payload.repository.url || '',
          fullName: payload.repository.full_name || '',
        },
        ref: payload.ref,
        commits: (payload.commits || []).map((commit: any) => ({
          id: commit.id || '',
          message: commit.message || '',
          author: {
            name: commit.author?.name || '',
            email: commit.author?.email || '',
          },
          timestamp: commit.timestamp || '',
        })),
        pusher: {
          name: payload.pusher?.name || '',
          email: payload.pusher?.email || '',
        },
      }
    } catch (error) {
      logError('Failed to parse GitHub webhook', error)
      return null
    }
  }
}
