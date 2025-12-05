import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { verifyToken } from '../lib/jwt'
import { logError, logInfo, logWarn } from '../lib/logger'
import { DockerService } from '../services/docker'

const dockerService = DockerService.getInstance()

interface WebSocketClient extends WebSocket {
  id: string
  userId?: string
  isAlive: boolean
  authenticated: boolean
  messageCount: number
  lastMessageTime: number
}

interface BaseMessage {
  type: string
}

interface AuthMessage extends BaseMessage {
  type: 'auth'
  token: string
}

interface PingMessage extends BaseMessage {
  type: 'ping'
}

type WebSocketMessage = AuthMessage | PingMessage | BaseMessage

/**
 * LogsWebSocketGateway - Manages real-time Docker events and system logs
 */
export class LogsWebSocketGateway {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()
  private dockerEventsStream: NodeJS.ReadableStream | null = null
  private heartbeatInterval: NodeJS.Timeout

  constructor(server: Server) {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/ws/logs',
    })

    logInfo('Logs WebSocket Gateway initialized')

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

    // Start Docker events stream
    this.startDockerEventsStream()
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

    logInfo('New logs WebSocket client connected', { clientId: client.id })

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
  private async handleMessage(client: WebSocketClient, data: WebSocket.RawData) {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage

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
          await this.handleAuth(client, message as AuthMessage)
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logError('Error handling WebSocket message', error, { clientId: client.id })
      this.sendToClient(client, {
        type: 'error',
        message: errorMessage,
      })
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuth(client: WebSocketClient, message: AuthMessage) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      logError('Authentication failed for client', error, { clientId: client.id })
      client.authenticated = false
      this.sendToClient(client, {
        type: 'error',
        message: `Authentication failed: ${errorMessage}`,
      })
      setTimeout(() => client.close(), 1000)
    }
  }

  /**
   * Start Docker events stream
   */
  private async startDockerEventsStream() {
    try {
      const events = await dockerService.getEvents({
        filters: {
          type: ['container'],
        },
      })

      events.on('data', (chunk: Buffer) => {
        try {
          const event = JSON.parse(chunk.toString())
          this.broadcastToAuthenticated({
            type: 'docker_event',
            event: {
              action: event.Action,
              type: event.Type,
              id: event.id,
              from: event.from,
              status: event.status,
              time: event.time,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          // Ignore parse errors
        }
      })

      events.on('error', (error: Error) => {
        logError('Docker events stream error', error)
        // Try to restart stream after delay
        setTimeout(() => this.startDockerEventsStream(), 5000)
      })

      this.dockerEventsStream = events
      logInfo('Docker events stream started')
    } catch (error) {
      logError('Failed to start Docker events stream', error)
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(client: WebSocketClient) {
    logInfo('Client disconnected', { clientId: client.id, userId: client.userId })
    this.clients.delete(client.id)
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocketClient, message: unknown) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  }

  /**
   * Broadcast message to all authenticated clients
   */
  private broadcastToAuthenticated(message: unknown) {
    this.clients.forEach((client) => {
      if (client.authenticated) {
        this.sendToClient(client, message)
      }
    })
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `logs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Close WebSocket server
   */
  close() {
    logInfo('Closing Logs WebSocket Gateway')

    // Clear heartbeat
    clearInterval(this.heartbeatInterval)

    // Stop Docker events stream
    if (this.dockerEventsStream) {
      // The readable stream might not have a destroy method typed in NodeJS.ReadableStream
      // but most implementations (like fs or socket) do. Safe check:
      if ('destroy' in this.dockerEventsStream && typeof (this.dockerEventsStream as any).destroy === 'function') {
        (this.dockerEventsStream as any).destroy()
      }
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.close()
    })
    this.clients.clear()

    // Close WebSocket server
    this.wss.close()

    logInfo('Logs WebSocket Gateway closed')
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter((c) => c.authenticated).length,
    }
  }
}

