import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { dockerService } from '../services/docker'
import { prisma } from '../lib/prisma'
import { verifyToken } from '../lib/jwt'

interface WebSocketClient extends WebSocket {
  id: string
  userId?: string
  containerId?: string
  isAlive: boolean
}

interface StreamSession {
  containerId: string
  clients: Set<WebSocketClient>
  stream?: any
}

/**
 * ContainerWebSocketGateway - Manages real-time container logs and metrics
 */
export class ContainerWebSocketGateway {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()
  private logStreams: Map<string, StreamSession> = new Map()
  private statsIntervals: Map<string, NodeJS.Timeout> = new Map()
  private heartbeatInterval: NodeJS.Timeout

  constructor(server: Server) {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/ws/containers',
    })

    console.log('🔌 Container WebSocket Gateway initialized')

    // Setup connection handler
    this.wss.on('connection', this.handleConnection.bind(this))

    // Setup heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as WebSocketClient
        if (!client.isAlive) {
          console.log(`🔌 Terminating dead client: ${client.id}`)
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

    this.clients.set(client.id, client)

    console.log(`🔌 New container WebSocket client connected: ${client.id}`)

    // Send welcome message
    this.sendToClient(client, {
      type: 'connected',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    })

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
      console.error(`🔌 WebSocket error for client ${client.id}:`, error)
      this.handleDisconnect(client)
    })
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(client: WebSocketClient, data: any) {
    try {
      const message = JSON.parse(data.toString())

      console.log(`🔌 Message from ${client.id}:`, message.type)

      switch (message.type) {
        case 'auth':
          await this.handleAuth(client, message)
          break

        case 'subscribe_logs':
          await this.handleSubscribeLogs(client, message)
          break

        case 'unsubscribe_logs':
          await this.handleUnsubscribeLogs(client, message)
          break

        case 'subscribe_stats':
          await this.handleSubscribeStats(client, message)
          break

        case 'unsubscribe_stats':
          await this.handleUnsubscribeStats(client, message)
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
      console.error(`🔌 Error handling message from ${client.id}:`, error)
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

      console.log(`🔌 Client ${client.id} authenticated as user ${client.userId}`)

      this.sendToClient(client, {
        type: 'authenticated',
        userId: client.userId,
      })
    } catch (error: any) {
      console.error(`🔌 Authentication failed for client ${client.id}:`, error.message)
      this.sendToClient(client, {
        type: 'error',
        message: 'Authentication failed: Invalid or expired token',
      })
      // Close connection on authentication failure
      client.close()
    }
  }

  /**
   * Handle subscribe to container logs
   */
  private async handleSubscribeLogs(client: WebSocketClient, message: any) {
    // Check if client is authenticated
    if (!client.userId) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Authentication required',
      })
    }

    const { containerId } = message

    if (!containerId) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Container ID is required',
      })
    }

    // Get container from database
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    })

    if (!container) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Container not found',
      })
    }

    client.containerId = containerId

    // Check if stream already exists
    let session = this.logStreams.get(containerId)

    if (!session) {
      // Create new stream session
      session = {
        containerId,
        clients: new Set(),
      }

      try {
        // Start streaming logs
        const stream = await dockerService.streamContainerLogs(
          container.dockerId,
          (chunk: string) => {
            // Broadcast to all subscribed clients
            session?.clients.forEach((c) => {
              this.sendToClient(c, {
                type: 'log',
                containerId,
                data: chunk,
                timestamp: new Date().toISOString(),
              })
            })
          },
          {
            stdout: true,
            stderr: true,
            follow: true,
            timestamps: true,
          }
        )

        session.stream = stream
        this.logStreams.set(containerId, session)

        console.log(`🔌 Started log stream for container: ${containerId}`)
      } catch (error: any) {
        return this.sendToClient(client, {
          type: 'error',
          message: `Failed to start log stream: ${error.message}`,
        })
      }
    }

    // Add client to session
    session.clients.add(client)

    this.sendToClient(client, {
      type: 'subscribed_logs',
      containerId,
      message: 'Successfully subscribed to container logs',
    })
  }

  /**
   * Handle unsubscribe from container logs
   */
  private async handleUnsubscribeLogs(client: WebSocketClient, message: any) {
    const { containerId } = message

    const session = this.logStreams.get(containerId)
    if (!session) {
      return
    }

    // Remove client from session
    session.clients.delete(client)

    // If no more clients, stop stream
    if (session.clients.size === 0) {
      if (session.stream) {
        session.stream.destroy()
      }
      this.logStreams.delete(containerId)
      console.log(`🔌 Stopped log stream for container: ${containerId}`)
    }

    this.sendToClient(client, {
      type: 'unsubscribed_logs',
      containerId,
    })
  }

  /**
   * Handle subscribe to container stats
   */
  private async handleSubscribeStats(client: WebSocketClient, message: any) {
    // Check if client is authenticated
    if (!client.userId) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Authentication required',
      })
    }

    const { containerId, interval = 2000 } = message

    if (!containerId) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Container ID is required',
      })
    }

    // Get container from database
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    })

    if (!container) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Container not found',
      })
    }

    client.containerId = containerId

    // Check if interval already exists
    const existingInterval = this.statsIntervals.get(`${client.id}:${containerId}`)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Create interval to send stats
    const statsInterval = setInterval(async () => {
      try {
        const stats = await dockerService.getContainerStats(container.dockerId)

        this.sendToClient(client, {
          type: 'stats',
          containerId,
          data: stats,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        console.error(`Error getting stats for ${containerId}:`, error)
        // Don't send error to avoid spam, just log it
      }
    }, interval)

    this.statsIntervals.set(`${client.id}:${containerId}`, statsInterval)

    this.sendToClient(client, {
      type: 'subscribed_stats',
      containerId,
      interval,
      message: 'Successfully subscribed to container stats',
    })
  }

  /**
   * Handle unsubscribe from container stats
   */
  private async handleUnsubscribeStats(client: WebSocketClient, message: any) {
    const { containerId } = message

    const key = `${client.id}:${containerId}`
    const interval = this.statsIntervals.get(key)

    if (interval) {
      clearInterval(interval)
      this.statsIntervals.delete(key)
    }

    this.sendToClient(client, {
      type: 'unsubscribed_stats',
      containerId,
    })
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(client: WebSocketClient) {
    console.log(`🔌 Client disconnected: ${client.id}`)

    // Remove from clients map
    this.clients.delete(client.id)

    // Clean up log streams
    if (client.containerId) {
      const session = this.logStreams.get(client.containerId)
      if (session) {
        session.clients.delete(client)

        // If no more clients, stop stream
        if (session.clients.size === 0) {
          if (session.stream) {
            session.stream.destroy()
          }
          this.logStreams.delete(client.containerId)
          console.log(`🔌 Stopped log stream for container: ${client.containerId}`)
        }
      }
    }

    // Clean up stats intervals
    this.statsIntervals.forEach((interval, key) => {
      if (key.startsWith(`${client.id}:`)) {
        clearInterval(interval)
        this.statsIntervals.delete(key)
      }
    })
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
   * Broadcast message to all clients
   */
  private broadcast(message: any) {
    this.clients.forEach((client) => {
      this.sendToClient(client, message)
    })
  }

  /**
   * Broadcast to specific container subscribers
   */
  private broadcastToContainer(containerId: string, message: any) {
    const session = this.logStreams.get(containerId)
    if (session) {
      session.clients.forEach((client) => {
        this.sendToClient(client, message)
      })
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Close WebSocket server
   */
  close() {
    console.log('🔌 Closing Container WebSocket Gateway...')

    // Clear heartbeat
    clearInterval(this.heartbeatInterval)

    // Clear all stats intervals
    this.statsIntervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.statsIntervals.clear()

    // Close all log streams
    this.logStreams.forEach((session) => {
      if (session.stream) {
        session.stream.destroy()
      }
    })
    this.logStreams.clear()

    // Close all client connections
    this.clients.forEach((client) => {
      client.close()
    })
    this.clients.clear()

    // Close WebSocket server
    this.wss.close()

    console.log('✅ Container WebSocket Gateway closed')
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeLogStreams: this.logStreams.size,
      activeStatsSubscriptions: this.statsIntervals.size,
    }
  }
}
