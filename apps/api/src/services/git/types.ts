export interface WebhookPayload {
  repository: {
    url: string
    fullName: string
  }
  ref: string
  commits: Array<{
    id: string
    message: string
    author: {
      name: string
      email: string
    }
    timestamp: string
  }>
  pusher: {
    name: string
    email: string
  }
}

export interface WebhookParser {
  parse(payload: any): WebhookPayload | null
  verifySignature(payload: string | any, signature: string, secret: string): boolean
}
