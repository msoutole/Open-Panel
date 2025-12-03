import { Pool } from 'pg'
import { createConnection } from 'mysql2/promise'
import { MongoClient } from 'mongodb'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logWarn } from '../lib/logger'
import { DatabaseTemplatesService, DatabaseType } from './database-templates'

/**
 * Database Client Service
 * Provides web-based database clients for executing queries
 * Supports PostgreSQL, MySQL, MongoDB, and Redis
 */

export interface QueryResult {
  success: boolean
  data?: any
  error?: string
  executionTime?: number
  rowsAffected?: number
}

export interface DatabaseConnection {
  type: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password: string
}

/**
 * Database Client Service
 */
export class DatabaseClientService {
  /**
   * Execute PostgreSQL query
   */
  static async executePostgreSQLQuery(
    connection: DatabaseConnection,
    query: string
  ): Promise<QueryResult> {
    const startTime = Date.now()
    let pool: Pool | null = null

    try {
      // Validate query (prevent dangerous operations)
      if (!this.isSafeQuery(query)) {
        throw new Error('Query contains potentially dangerous operations')
      }

      // Create connection pool
      pool = new Pool({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        max: 1, // Single connection for safety
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })

      // Execute query
      const result = await pool.query(query)
      const executionTime = Date.now() - startTime

      logInfo('PostgreSQL query executed', {
        type: 'postgresql',
        executionTime,
        rowCount: result.rowCount,
      })

      return {
        success: true,
        data: result.rows,
        executionTime,
        rowsAffected: result.rowCount || 0,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      logError('PostgreSQL query error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      }
    } finally {
      if (pool) {
        await pool.end()
      }
    }
  }

  /**
   * Execute MySQL query
   */
  static async executeMySQLQuery(
    connection: DatabaseConnection,
    query: string
  ): Promise<QueryResult> {
    const startTime = Date.now()
    let mysqlConnection: any = null

    try {
      // Validate query
      if (!this.isSafeQuery(query)) {
        throw new Error('Query contains potentially dangerous operations')
      }

      // Create connection
      mysqlConnection = await createConnection({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
      })

      // Execute query
      const [rows, fields] = await mysqlConnection.execute(query)
      const executionTime = Date.now() - startTime

      logInfo('MySQL query executed', {
        type: 'mysql',
        executionTime,
        rowCount: Array.isArray(rows) ? rows.length : 0,
      })

      return {
        success: true,
        data: rows,
        executionTime,
        rowsAffected: Array.isArray(rows) ? rows.length : 0,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      logError('MySQL query error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      }
    } finally {
      if (mysqlConnection) {
        await mysqlConnection.end()
      }
    }
  }

  /**
   * Execute MongoDB query
   */
  static async executeMongoDBQuery(
    connection: DatabaseConnection,
    query: string
  ): Promise<QueryResult> {
    const startTime = Date.now()
    let client: MongoClient | null = null

    try {
      // Parse MongoDB query (expects JSON)
      const queryObj = JSON.parse(query)

      // Validate query
      if (!this.isSafeMongoQuery(queryObj)) {
        throw new Error('Query contains potentially dangerous operations')
      }

      // Create connection
      const connectionString = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}?authSource=admin`
      client = new MongoClient(connectionString)

      await client.connect()
      const db = client.db(connection.database)

      // Execute query based on operation type
      let result: any
      if (queryObj.operation === 'find') {
        const collection = db.collection(queryObj.collection)
        result = await collection.find(queryObj.filter || {}).limit(queryObj.limit || 100).toArray()
      } else if (queryObj.operation === 'aggregate') {
        const collection = db.collection(queryObj.collection)
        result = await collection.aggregate(queryObj.pipeline || []).toArray()
      } else {
        throw new Error('Unsupported MongoDB operation')
      }

      const executionTime = Date.now() - startTime

      logInfo('MongoDB query executed', {
        type: 'mongodb',
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 0,
      })

      return {
        success: true,
        data: result,
        executionTime,
        rowsAffected: Array.isArray(result) ? result.length : 0,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      logError('MongoDB query error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      }
    } finally {
      if (client) {
        await client.close()
      }
    }
  }

  /**
   * Execute Redis command
   */
  static async executeRedisCommand(
    connection: DatabaseConnection,
    command: string
  ): Promise<QueryResult> {
    const startTime = Date.now()
    let redis: Redis | null = null

    try {
      // Parse command (format: "COMMAND arg1 arg2 ...")
      const parts = command.trim().split(/\s+/)
      const cmd = parts[0].toUpperCase()
      const args = parts.slice(1)

      // Validate command (allow only safe read operations)
      const safeCommands = ['GET', 'KEYS', 'HGET', 'HGETALL', 'SMEMBERS', 'LRANGE', 'ZRANGE']
      if (!safeCommands.includes(cmd)) {
        throw new Error(`Command ${cmd} is not allowed. Only read operations are permitted.`)
      }

      // Create connection
      redis = new Redis({
        host: connection.host,
        port: connection.port,
        password: connection.password,
        db: 0,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // No retry
      })

      // Execute command
      const result = await (redis as any)[cmd.toLowerCase()](...args)
      const executionTime = Date.now() - startTime

      logInfo('Redis command executed', {
        type: 'redis',
        command: cmd,
        executionTime,
      })

      return {
        success: true,
        data: result,
        executionTime,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      logError('Redis command error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      }
    } finally {
      if (redis) {
        redis.disconnect()
      }
    }
  }

  /**
   * Get database connection info from container
   */
  static async getConnectionFromContainer(
    containerId: string,
    type: DatabaseType
  ): Promise<DatabaseConnection | null> {
    try {
      const container = await prisma.container.findUnique({
        where: { dockerId: containerId },
        include: {
          project: {
            include: {
              envVars: true,
            },
          },
        },
      })

      if (!container) {
        return null
      }

      // Get connection info from environment variables
      const envVars: Record<string, string> = {}
      container.project.envVars.forEach((env) => {
        envVars[env.key] = env.value
      })

      // Extract connection info based on database type
      switch (type) {
        case 'postgresql':
          return {
            type: 'postgresql',
            host: 'localhost',
            port: 5432, // Will be mapped from container port
            database: envVars.POSTGRES_DB || 'app',
            username: envVars.POSTGRES_USER || 'admin',
            password: envVars.POSTGRES_PASSWORD || '',
          }

        case 'mysql':
        case 'mariadb':
          return {
            type,
            host: 'localhost',
            port: 3306,
            database: envVars.MYSQL_DATABASE || envVars.MARIADB_DATABASE || 'app',
            username: envVars.MYSQL_USER || envVars.MARIADB_USER || 'admin',
            password: envVars.MYSQL_PASSWORD || envVars.MARIADB_PASSWORD || '',
          }

        case 'mongodb':
          return {
            type: 'mongodb',
            host: 'localhost',
            port: 27017,
            database: envVars.MONGO_INITDB_DATABASE || 'app',
            username: envVars.MONGO_INITDB_ROOT_USERNAME || 'admin',
            password: envVars.MONGO_INITDB_ROOT_PASSWORD || '',
          }

        case 'redis':
          return {
            type: 'redis',
            host: 'localhost',
            port: 6379,
            database: '0',
            username: '',
            password: envVars.REDIS_PASSWORD || '',
          }

        default:
          return null
      }
    } catch (error) {
      logError('Failed to get database connection from container', error)
      return null
    }
  }

  /**
   * Validate SQL query safety (prevent dangerous operations)
   */
  private static isSafeQuery(query: string): boolean {
    const upperQuery = query.toUpperCase().trim()

    // Block dangerous operations
    const dangerousPatterns = [
      /DROP\s+(DATABASE|TABLE|SCHEMA)/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM/i,
      /UPDATE\s+\w+\s+SET/i,
      /ALTER\s+TABLE/i,
      /CREATE\s+(DATABASE|TABLE|USER)/i,
      /GRANT\s+/i,
      /REVOKE\s+/i,
      /EXEC\s+/i,
      /EXECUTE\s+/i,
      /CALL\s+/i,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        return false
      }
    }

    // Allow SELECT, SHOW, DESCRIBE, EXPLAIN
    const safePatterns = [/^SELECT/i, /^SHOW/i, /^DESCRIBE/i, /^DESC/i, /^EXPLAIN/i]
    return safePatterns.some((pattern) => pattern.test(upperQuery))
  }

  /**
   * Validate MongoDB query safety
   */
  private static isSafeMongoQuery(query: any): boolean {
    // Only allow find and aggregate operations (read-only)
    const allowedOperations = ['find', 'aggregate']
    return allowedOperations.includes(query.operation)
  }
}

