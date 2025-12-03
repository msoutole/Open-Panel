import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { dockerService } from '../services/docker'
import { prisma } from '../lib/prisma'
import { verifyToken } from '../lib/jwt'
import { logger, logError, logInfo, logWarn } from '../lib/logger'

interface WebSocketClient extends WebSocket {
  id: string
  userId?: string
  containerId?: string
  isAlive: boolean
  authenticated: boolean
  messageCount: number
  lastMessageTime: number
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

    logInfo('Container WebSocket Gateway initialized')

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

    logInfo('New container WebSocket client connected', { clientId: client.id })

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

      logInfo('WebSocket message received', { clientId: client.id, messageType: message.type })

      switch (message.type) {
        case 'auth':
          await this.handleAuth(client, message)
          break

        case 'subscribe_logs':
          if (!client.authenticated) {
            return this.sendToClient(client, {
              type: 'error',
              message: 'Authentication required before subscribing to logs',
            })
          }
          await this.handleSubscribeLogs(client, message)
          break

        case 'unsubscribe_logs':
          if (!client.authenticated) {
            return this.sendToClient(client, {
              type: 'error',
              message: 'Authentication required',
            })
          }
          await this.handleUnsubscribeLogs(client, message)
          break

        case 'subscribe_stats':
          if (!client.authenticated) {
            return this.sendToClient(client, {
              type: 'error',
              message: 'Authentication required before subscribing to stats',
            })
          }
          await this.handleSubscribeStats(client, message)
          break

        case 'unsubscribe_stats':
          if (!client.authenticated) {
            return this.sendToClient(client, {
              type: 'error',
              message: 'Authentication required',
            })
          }
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
      // Close connection on authentication failure
      setTimeout(() => client.close(), 1000)
    }
  }

  /**
   * Handle subscribe to container logs
   */
  private async handleSubscribeLogs(client: WebSocketClient, message: any) {
    const { containerId } = message

    if (!containerId) {
      return this.sendToClient(client, {
        type: 'error',
        message: 'Container ID is required',
      })
    }

    // Verify user has permission to access this container
    try {
      const container = await prisma.container.findFirst({
        where: {
          dockerId: containerId,
        },
        include: {
          project: {
            include: {
              owner: true,
              team: {
                include: {
                  members: true,
                },
              },
            },
          },
        },
      })

      if (!container) {
        return this.sendToClient(client, {
          type: 'error',
          message: 'Container not found',
        })
      }

      // Check if user is owner or team member
      const isOwner = container.project.ownerId === client.userId
      const isTeamMember = container.project.team?.members.some(
        (member) => member.userId === client.userId
      ) ?? false

      if (!isOwner && !isTeamMember) {
        logWarn('Unauthorized container access attempt', {
          clientId: client.id,
          userId: client.userId,
          containerId,
        })
        return this.sendToClient(client, {
          type: 'error',
          message: 'Permission denied: You do not have access to this container',
        })
      }
    } catch (error: any) {
      logError('Error verifying container permissions', error, {
        clientId: client.id,
        userId: client.userId,
        containerId,
      })
      return this.sendToClient(client, {
        type: 'error',
        message: 'Error verifying permissions',
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

        logInfo('Started log stream for container', { containerId })
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
      logInfo('Stopped log stream for container', { containerId })
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
        const stats = await dockerService.getContainerStats(container.dockerId ?? '')

        this.sendToClient(client, {
          type: 'stats',
          containerId,
          data: stats,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        logError('Error getting stats for container', error, { containerId })
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
    logInfo('Client disconnected', { clientId: client.id, userId: client.userId })

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
    logInfo('Closing Container WebSocket Gateway')

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

    logInfo('Container WebSocket Gateway closed')
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
