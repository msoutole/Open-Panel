import { WebhookParser, WebhookPayload } from '../types'
import { logError } from '../../../lib/logger'

export class GitLabParser implements WebhookParser {
  verifySignature(token: string, _signature: string, secret: string): boolean {
    // GitLab uses a simple token match
    return token === secret
  }

  parse(payload: any): WebhookPayload | null {
    try {
      if (!payload.ref || !payload.project) {
        return null
      }

      return {
        repository: {
          url: payload.project.git_http_url || '',
          fullName: payload.project.path_with_namespace || '',
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
          name: payload.user_name || '',
          email: payload.user_email || '',
        },
      }
    } catch (error) {
      logError('Failed to parse GitLab webhook', error)
      return null
    }
  }
}
