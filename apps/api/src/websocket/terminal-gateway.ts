import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { dockerService } from '../services/docker'
import { prisma } from '../lib/prisma'
import { verifyToken } from '../lib/jwt'
import { logError, logInfo, logWarn } from '../lib/logger'

interface TerminalWebSocketClient extends WebSocket {
  id: string
  userId?: string
  containerId?: string
  isAlive: boolean
  authenticated: boolean
  messageCount: number
  lastMessageTime: number
  execStream?: any
}

interface TerminalSession {
  containerId: string
  client: TerminalWebSocketClient
  execStream?: any
}

/**
 * TerminalWebSocketGateway - Manages real-time terminal sessions via Docker exec
 * Provides interactive shell access to containers
 */
export class TerminalWebSocketGateway {
  private wss: WebSocketServer
  private clients: Map<string, TerminalWebSocketClient> = new Map()
  private terminalSessions: Map<string, TerminalSession> = new Map()
  private heartbeatInterval: NodeJS.Timeout

  constructor(server: Server) {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/ws/terminal',
    })

    logInfo('Terminal WebSocket Gateway initialized')

    // Setup connection handler
    this.wss.on('connection', this.handleConnection.bind(this))

    // Setup heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as TerminalWebSocketClient
        if (!client.isAlive) {
          logWarn('Terminating dead terminal WebSocket client', { clientId: client.id })
          this.cleanupSession(client.id)
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
    const client = ws as TerminalWebSocketClient
    client.id = this.generateClientId()
    client.isAlive = true
    client.authenticated = false
    client.messageCount = 0
    client.lastMessageTime = Date.now()

    this.clients.set(client.id, client)

    logInfo('New terminal WebSocket client connected', { clientId: client.id })

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
        logWarn('Terminal client failed to authenticate within timeout', {
          clientId: client.id,
        })
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

    client.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        // Rate limiting
        const now = Date.now()
        if (now - client.lastMessageTime < 100) {
          // Max 10 messages per second
          logWarn('Terminal client rate limit exceeded', { clientId: client.id })
          return
        }

        client.messageCount++
        client.lastMessageTime = now

        // Handle message
        await this.handleMessage(client, message)
      } catch (error) {
        logError('Terminal WebSocket message error', error)
        this.sendToClient(client, {
          type: 'error',
          message: 'Invalid message format',
        })
      }
    })

    client.on('close', () => {
      logInfo('Terminal WebSocket client disconnected', { clientId: client.id })
      this.cleanupSession(client.id)
      this.clients.delete(client.id)
    })

    client.on('error', (error) => {
      logError('Terminal WebSocket client error', error)
      this.cleanupSession(client.id)
    })
  }

  /**
   * Handle WebSocket messages
   */
  private async handleMessage(client: TerminalWebSocketClient, message: any) {
    const { type } = message

    switch (type) {
      case 'auth':
        await this.handleAuth(client, message)
        break

      case 'open_terminal':
        await this.handleOpenTerminal(client, message)
        break

      case 'input':
        await this.handleInput(client, message)
        break

      case 'resize':
        await this.handleResize(client, message)
        break

      case 'close_terminal':
        await this.handleCloseTerminal(client, message)
        break

      default:
        logWarn('Unknown terminal message type', { type, clientId: client.id })
        this.sendToClient(client, {
          type: 'error',
          message: `Unknown message type: ${type}`,
        })
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuth(client: TerminalWebSocketClient, message: any) {
    try {
      const { token } = message

      if (!token) {
        this.sendToClient(client, {
          type: 'auth_error',
          message: 'Token is required',
        })
        return
      }

      // Verify JWT token
      const payload = verifyToken(token)

      client.authenticated = true
      client.userId = payload.userId

      logInfo('Terminal client authenticated', {
        clientId: client.id,
        userId: payload.userId,
      })

      this.sendToClient(client, {
        type: 'auth_success',
        message: 'Authentication successful',
      })
    } catch (error) {
      logWarn('Terminal authentication failed', { clientId: client.id, error })
      this.sendToClient(client, {
        type: 'auth_error',
        message: 'Invalid token',
      })
      client.close()
    }
  }

  /**
   * Handle open terminal session
   */
  private async handleOpenTerminal(client: TerminalWebSocketClient, message: any) {
    if (!client.authenticated) {
      this.sendToClient(client, {
        type: 'error',
        message: 'Not authenticated',
      })
      return
    }

    try {
      const { containerId, shell = '/bin/sh' } = message

      if (!containerId) {
        this.sendToClient(client, {
          type: 'error',
          message: 'Container ID is required',
        })
        return
      }

      // Verify user has access to container
      const container = await prisma.container.findUnique({
        where: { dockerId: containerId },
        include: {
          project: {
            include: {
              owner: true,
              team: {
                include: {
                  members: {
                    where: { userId: client.userId },
                  },
                },
              },
            },
          },
        },
      })

      if (!container) {
        this.sendToClient(client, {
          type: 'error',
          message: 'Container not found',
        })
        return
      }

      // Check permissions
      const hasAccess =
        container.project.ownerId === client.userId ||
        container.project.team?.members.some((m) => m.userId === client.userId)

      if (!hasAccess) {
        logWarn('Terminal access denied', {
          clientId: client.id,
          userId: client.userId,
          containerId,
        })
        this.sendToClient(client, {
          type: 'error',
          message: 'Access denied',
        })
        return
      }

      // Create exec session
      const execResult = await dockerService.execContainer(containerId, [shell], {
        tty: true,
        stdin: true,
      })

      client.containerId = containerId
      client.execStream = execResult.stream

      // Store session
      const session: TerminalSession = {
        containerId,
        client,
        execStream: execResult.stream,
      }
      this.terminalSessions.set(client.id, session)

      // Forward stdout/stderr to client
      execResult.stream.on('data', (chunk: Buffer) => {
        this.sendToClient(client, {
          type: 'output',
          data: chunk.toString('utf8'),
        })
      })

      execResult.stream.on('end', () => {
        this.sendToClient(client, {
          type: 'terminal_closed',
          message: 'Terminal session ended',
        })
        this.cleanupSession(client.id)
      })

      execResult.stream.on('error', (error: Error) => {
        logError('Terminal stream error', error)
        this.sendToClient(client, {
          type: 'error',
          message: 'Terminal stream error',
        })
        this.cleanupSession(client.id)
      })

      logInfo('Terminal session opened', {
        clientId: client.id,
        containerId,
        shell,
      })

      this.sendToClient(client, {
        type: 'terminal_opened',
        message: 'Terminal session opened',
        shell,
      })
    } catch (error) {
      logError('Failed to open terminal', error)
      this.sendToClient(client, {
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to open terminal',
      })
    }
  }

  /**
   * Handle terminal input
   */
  private async handleInput(client: TerminalWebSocketClient, message: any) {
    if (!client.authenticated || !client.execStream) {
      return
    }

    try {
      const { data } = message

      if (data) {
        // Send input to container
        client.execStream.write(data)
      }
    } catch (error) {
      logError('Terminal input error', error)
    }
  }

  /**
   * Handle terminal resize
   */
  private async handleResize(client: TerminalWebSocketClient, message: any) {
    if (!client.authenticated || !client.execStream) {
      return
    }

    try {
      const { cols, rows } = message

      if (cols && rows) {
        // Resize terminal (requires exec instance)
        const session = this.terminalSessions.get(client.id)
        if (session?.execStream) {
          // Docker exec resize
          // Note: This requires the exec instance, which we need to store
          // For now, we'll log it
          logInfo('Terminal resize requested', {
            clientId: client.id,
            cols,
            rows,
          })
        }
      }
    } catch (error) {
      logError('Terminal resize error', error)
    }
  }

  /**
   * Handle close terminal session
   */
  private async handleCloseTerminal(client: TerminalWebSocketClient, message: any) {
    this.cleanupSession(client.id)

    this.sendToClient(client, {
      type: 'terminal_closed',
      message: 'Terminal session closed',
    })
  }

  /**
   * Cleanup terminal session
   */
  private cleanupSession(clientId: string) {
    const client = this.clients.get(clientId)
    if (client) {
      if (client.execStream) {
        try {
          client.execStream.end()
        } catch (error) {
          // Ignore errors when closing stream
        }
        client.execStream = undefined
      }
      client.containerId = undefined
    }

    this.terminalSessions.delete(clientId)
  }

  /**
   * Send message to client
   */
  private sendToClient(client: TerminalWebSocketClient, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Close gateway and cleanup
   */
  close() {
    logInfo('Closing Terminal WebSocket Gateway')

    // Close all sessions
    this.clients.forEach((client) => {
      this.cleanupSession(client.id)
      client.close()
    })

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    // Close WebSocket server
    this.wss.close()
  }
}

