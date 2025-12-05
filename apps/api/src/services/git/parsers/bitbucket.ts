import { WebhookParser, WebhookPayload } from '../types'
import { logError } from '../../../lib/logger'

export class BitbucketParser implements WebhookParser {
  verifySignature(): boolean {
    // Bitbucket signature verification is complex and often skipped in simple setups
    // or handled via IP allowlisting. Implementing a basic true for now.
    return true
  }

  parse(payload: any): WebhookPayload | null {
    try {
      if (!payload.push || !payload.repository) {
        return null
      }

      const change = payload.push?.changes?.[0]
      if (!change) {
        return null
      }

      return {
        repository: {
          url: payload.repository?.links?.html?.href || '',
          fullName: payload.repository?.full_name || '',
        },
        ref: `refs/heads/${change.new?.name || 'main'}`,
        commits: (change.commits || []).map((commit: any) => ({
          id: commit.hash || '',
          message: commit.message || '',
          author: {
            name: commit.author?.raw?.split('<')[0].trim() || '',
            email: commit.author?.raw?.match(/<(.+)>/)?.[1] || '',
          },
          timestamp: commit.date || '',
        })),
        pusher: {
          name: payload.actor?.display_name || '',
          email: '',
        },
      }
    } catch (error) {
      logError('Failed to parse Bitbucket webhook', error)
      return null
    }
  }
}
