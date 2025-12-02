import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { verifyToken } from '../lib/jwt'
import { logError, logInfo, logWarn } from '../lib/logger'
import { MetricsService } from '../services/metrics'

interface WebSocketClient extends WebSocket {
  id: string
  userId?: string
  isAlive: boolean
  authenticated: boolean
  messageCount: number
  lastMessageTime: number
  metricsInterval?: NodeJS.Timeout
}

/**
 * MetricsWebSocketGateway - Manages real-time system metrics
 */
export class MetricsWebSocketGateway {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()
  private heartbeatInterval: NodeJS.Timeout
  private defaultInterval = 2000 // 2 seconds

  constructor(server: Server) {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/ws/metrics',
    })

    logInfo('Metrics WebSocket Gateway initialized')

    // Setup connection handler
    this.wss.on('connection', this.handleConnection.bind(this))

    // Setup heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as WebSocketClient
        if (!client.isAlive) {
          logWarn('Terminating dead WebSocket client', { clientId: client.id })
          return client.terminate()
        }

        client.isAlive = false
        client.ping()
      })
    }, 30000) // Every 30 seconds
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket) {
    const client = ws as WebSocketClient
    client.id = this.generateClientId()
    client.isAlive = true
    client.authenticated = false
    client.messageCount = 0
    client.lastMessageTime = Date.now()

    this.clients.set(client.id, client)

    logInfo('New metrics WebSocket client connected', { clientId: client.id })

    // Send welcome message with authentication requirement
    this.sendToClient(client, {
      type: 'connected',
      clientId: client.id,
      timestamp: new Date().toISOString(),
      message: 'Please authenticate within 30 seconds',
    })

    // Force authentication within 30 seconds
    setTimeout(() => {
      if (!client.authenticated) {
        logWarn('Client failed to authenticate within timeout', { clientId: client.id })
        this.sendToClient(client, {
          type: 'error',
          message: 'Authentication timeout',
        })
        client.close()
      }
    }, 30000)

    // Setup event handlers
    client.on('pong', () => {
      client.isAlive = true
    })

    client.on('message', (data) => {
      this.handleMessage(client, data)
    })

    client.on('close', () => {
      this.handleDisconnect(client)
    })

    client.on('error', (error) => {
      logError('WebSocket error for client', error, { clientId: client.id })
      this.handleDisconnect(client)
    })
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(client: WebSocketClient, data: any) {
    try {
      const message = JSON.parse(data.toString())

      // Rate limiting: max 100 messages per minute
      const now = Date.now()
      if (now - client.lastMessageTime < 60000) {
        client.messageCount++
        if (client.messageCount > 100) {
          logWarn('Client exceeded rate limit', { clientId: client.id, userId: client.userId })
          this.sendToClient(client, {
            type: 'error',
            message: 'Rate limit exceeded. Please slow down.',
          })
          return
        }
      } else {
        client.messageCount = 0
        client.lastMessageTime = now
      }

      switch (message.type) {
        case 'auth':
          await this.handleAuth(client, message)
          break

        case 'subscribe':
          await this.handleSubscribe(client, message)
          break

        case 'unsubscribe':
          await this.handleUnsubscribe(client)
          break

        case 'ping':
          this.sendToClient(client, { type: 'pong', timestamp: new Date().toISOString() })
          break

        default:
          this.sendToClient(client, {
            type: 'error',
            message: `Unknown message type: ${message.type}`,
          })
      }
    } catch (error: any) {
      logError('Error handling WebSocket message', error, { clientId: client.id })
      this.sendToClient(client, {
        type: 'error',
        message: error.message,
      })
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuth(client: WebSocketClient, message: any) {
    try {
      const { token } = message

      if (!token) {
        return this.sendToClient(client, {
          type: 'error',
          message: 'Authentication token is required',
        })
      }

      // Verify JWT token
      const payload = verifyToken(token)
      client.userId = payload.userId
      client.authenticated = true

      logInfo('Client authenticated', { clientId: client.id, userId: client.userId })

      this.sendToClient(client, {
        type: 'authenticated',
        userId: client.userId,
      })
    } catch (error: any) {
      logError('Authentication failed for client', new Error(error.message), { clientId: client.id })
      client.authenticated = false
      this.sendToClient(client, {
        type: 'error',
        message: 'Authentication failed: Invalid or expired token',
      })
      setTimeout(() => client.close(), 1000)
    }
  }

  /**
   * Handle subscribe to metrics
   */
  private async handleSubscribe(client: WebSocketClient, message: any) {
    if (!client.authenticated) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Authentication required before subscribing to metrics',
      })
    }

    const { interval = this.defaultInterval } = message

    // Clear existing interval if any
    if (client.metricsInterval) {
      clearInterval(client.metricsInterval)
    }

    // Create interval to send metrics
    client.metricsInterval = setInterval(async () => {
      try {
        const metrics = await MetricsService.getSystemMetrics()

        this.sendToClient(client, {
          type: 'metrics',
          data: metrics,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        logError('Error getting system metrics', error)
        // Don't send error to avoid spam, just log it
      }
    }, interval)

    this.sendToClient(client, {
      type: 'subscribed',
      interval,
      message: 'Successfully subscribed to system metrics',
    })
  }

  /**
   * Handle unsubscribe from metrics
   */
  private async handleUnsubscribe(client: WebSocketClient) {
    if (client.metricsInterval) {
      clearInterval(client.metricsInterval)
      client.metricsInterval = undefined
    }

    this.sendToClient(client, {
      type: 'unsubscribed',
      message: 'Successfully unsubscribed from system metrics',
    })
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(client: WebSocketClient) {
    logInfo('Client disconnected', { clientId: client.id, userId: client.userId })

    // Clear metrics interval
    if (client.metricsInterval) {
      clearInterval(client.metricsInterval)
    }

    this.clients.delete(client.id)
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocketClient, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Close WebSocket server
   */
  close() {
    logInfo('Closing Metrics WebSocket Gateway')

    // Clear heartbeat
    clearInterval(this.heartbeatInterval)

    // Clear all metrics intervals
    this.clients.forEach((client) => {
      if (client.metricsInterval) {
        clearInterval(client.metricsInterval)
      }
    })

    // Close all client connections
    this.clients.forEach((client) => {
      client.close()
    })
    this.clients.clear()

    // Close WebSocket server
    this.wss.close()

    logInfo('Metrics WebSocket Gateway closed')
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter((c) => c.authenticated).length,
      activeSubscriptions: Array.from(this.clients.values()).filter((c) => c.metricsInterval).length,
    }
  }
}

