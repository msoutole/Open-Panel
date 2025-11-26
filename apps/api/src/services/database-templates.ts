import { DockerService } from './docker'
import { prisma } from '../lib/prisma'
import { logInfo, logError } from '../lib/logger'
import crypto from 'crypto'

/**
 * Database Templates Service
 * Pre-configured database containers that can be deployed instantly
 */

const dockerService = DockerService.getInstance()

export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'mariadb'

export interface DatabaseTemplate {
  type: DatabaseType
  name: string
  description: string
  defaultImage: string
  defaultTag: string
  defaultPort: number
  envVars: Record<string, string>
  volumes: Array<{ source: string; target: string }>
  healthCheck?: {
    test: string[]
    interval: number
    timeout: number
    retries: number
  }
}

/**
 * Generate random secure password
 */
function generatePassword(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length)
}

/**
 * Database templates configuration
 */
export const DATABASE_TEMPLATES: Record<DatabaseType, DatabaseTemplate> = {
  postgresql: {
    type: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL relational database',
    defaultImage: 'postgres',
    defaultTag: '16-alpine',
    defaultPort: 5432,
    envVars: {
      POSTGRES_DB: 'app',
      POSTGRES_USER: 'admin',
      POSTGRES_PASSWORD: generatePassword(),
    },
    volumes: [
      { source: '/var/lib/openpanel/data/postgres', target: '/var/lib/postgresql/data' },
    ],
    healthCheck: {
      test: ['CMD-SHELL', 'pg_isready -U admin'],
      interval: 10000,
      timeout: 5000,
      retries: 5,
    },
  },

  mysql: {
    type: 'mysql',
    name: 'MySQL',
    description: 'MySQL relational database',
    defaultImage: 'mysql',
    defaultTag: '8.0',
    defaultPort: 3306,
    envVars: {
      MYSQL_DATABASE: 'app',
      MYSQL_USER: 'admin',
      MYSQL_PASSWORD: generatePassword(),
      MYSQL_ROOT_PASSWORD: generatePassword(),
    },
    volumes: [
      { source: '/var/lib/openpanel/data/mysql', target: '/var/lib/mysql' },
    ],
    healthCheck: {
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
      interval: 10000,
      timeout: 5000,
      retries: 5,
    },
  },

  mariadb: {
    type: 'mariadb',
    name: 'MariaDB',
    description: 'MariaDB relational database (MySQL fork)',
    defaultImage: 'mariadb',
    defaultTag: '11',
    defaultPort: 3306,
    envVars: {
      MARIADB_DATABASE: 'app',
      MARIADB_USER: 'admin',
      MARIADB_PASSWORD: generatePassword(),
      MARIADB_ROOT_PASSWORD: generatePassword(),
    },
    volumes: [
      { source: '/var/lib/openpanel/data/mariadb', target: '/var/lib/mysql' },
    ],
    healthCheck: {
      test: ['CMD', 'healthcheck.sh', '--connect', '--innodb_initialized'],
      interval: 10000,
      timeout: 5000,
      retries: 5,
    },
  },

  mongodb: {
    type: 'mongodb',
    name: 'MongoDB',
    description: 'MongoDB NoSQL document database',
    defaultImage: 'mongo',
    defaultTag: '7',
    defaultPort: 27017,
    envVars: {
      MONGO_INITDB_ROOT_USERNAME: 'admin',
      MONGO_INITDB_ROOT_PASSWORD: generatePassword(),
      MONGO_INITDB_DATABASE: 'app',
    },
    volumes: [
      { source: '/var/lib/openpanel/data/mongodb', target: '/data/db' },
    ],
    healthCheck: {
      test: ['CMD', 'mongosh', '--eval', 'db.adminCommand("ping")'],
      interval: 10000,
      timeout: 5000,
      retries: 5,
    },
  },

  redis: {
    type: 'redis',
    name: 'Redis',
    description: 'Redis in-memory data store',
    defaultImage: 'redis',
    defaultTag: '7-alpine',
    defaultPort: 6379,
    envVars: {
      REDIS_PASSWORD: generatePassword(),
    },
    volumes: [
      { source: '/var/lib/openpanel/data/redis', target: '/data' },
    ],
    healthCheck: {
      test: ['CMD', 'redis-cli', 'ping'],
      interval: 10000,
      timeout: 5000,
      retries: 3,
    },
  },
}

export class DatabaseTemplatesService {
  /**
   * List all available database templates
   */
  static listTemplates(): DatabaseTemplate[] {
    return Object.values(DATABASE_TEMPLATES)
  }

  /**
   * Get specific template by type
   */
  static getTemplate(type: DatabaseType): DatabaseTemplate | null {
    return DATABASE_TEMPLATES[type] || null
  }

  /**
   * Deploy database from template
   */
  static async deployDatabase(options: {
    type: DatabaseType
    name: string
    projectId?: string
    teamId?: string
    customEnv?: Record<string, string>
    customPort?: number
    tag?: string
  }) {
    const { type, name, projectId, teamId, customEnv, customPort, tag } = options

    try {
      const template = DATABASE_TEMPLATES[type]
      if (!template) {
        throw new Error(`Unknown database type: ${type}`)
      }

      logInfo(`Deploying ${template.name} database`, { name, type })

      // Merge custom env with template env
      const env = {
        ...template.envVars,
        ...customEnv,
      }

      // Determine port
      const hostPort = customPort || template.defaultPort

      // Create container name
      const containerName = `${name}-${type}-${Date.now()}`

      // Deploy container
      const container = await dockerService.createContainer({
        name: containerName,
        image: template.defaultImage,
        tag: tag || template.defaultTag,
        env,
        ports: [
          {
            host: hostPort,
            container: template.defaultPort,
          },
        ],
        volumes: template.volumes.map((v) => ({
          source: v.source.replace('/var/lib/openpanel/data', `/var/lib/openpanel/data/${containerName}`),
          target: v.target,
          mode: 'rw',
        })),
        projectId,
        cpuLimit: '0.5',
        memoryLimit: '512m',
      })

      // Start container
      await dockerService.startContainer(container.dockerId)

      logInfo(`Database deployed successfully`, {
        name,
        type,
        dockerId: container.dockerId,
        port: hostPort,
      })

      // Generate connection string
      const connectionString = this.generateConnectionString(type, {
        host: 'localhost',
        port: hostPort,
        ...env,
      })

      return {
        container,
        connectionString,
        credentials: env,
      }
    } catch (error) {
      logError(`Failed to deploy ${type} database`, error)
      throw error
    }
  }

  /**
   * Generate connection string for database
   */
  static generateConnectionString(
    type: DatabaseType,
    config: Record<string, any>
  ): string {
    const { host, port } = config

    switch (type) {
      case 'postgresql':
        return `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${host}:${port}/${config.POSTGRES_DB}`

      case 'mysql':
      case 'mariadb':
        const dbName = config.MYSQL_DATABASE || config.MARIADB_DATABASE
        const user = config.MYSQL_USER || config.MARIADB_USER
        const password = config.MYSQL_PASSWORD || config.MARIADB_PASSWORD
        return `mysql://${user}:${password}@${host}:${port}/${dbName}`

      case 'mongodb':
        return `mongodb://${config.MONGO_INITDB_ROOT_USERNAME}:${config.MONGO_INITDB_ROOT_PASSWORD}@${host}:${port}/${config.MONGO_INITDB_DATABASE}?authSource=admin`

      case 'redis':
        return config.REDIS_PASSWORD
          ? `redis://:${config.REDIS_PASSWORD}@${host}:${port}`
          : `redis://${host}:${port}`

      default:
        return ''
    }
  }

  /**
   * Create backup of database
   */
  static async backupDatabase(containerId: string, type: DatabaseType): Promise<string> {
    try {
      logInfo(`Creating backup for ${type} database`, { containerId })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = `/var/lib/openpanel/backups/${type}-${timestamp}`

      // Get container info
      const container = await dockerService.getContainer(containerId)
      if (!container) {
        throw new Error('Container not found')
      }

      let backupCommand: string

      switch (type) {
        case 'postgresql':
          backupCommand = `pg_dump -U admin app > ${backupPath}.sql`
          break

        case 'mysql':
        case 'mariadb':
          backupCommand = `mysqldump -u admin -p app > ${backupPath}.sql`
          break

        case 'mongodb':
          backupCommand = `mongodump --out ${backupPath}`
          break

        case 'redis':
          backupCommand = `redis-cli BGSAVE`
          break

        default:
          throw new Error(`Backup not supported for ${type}`)
      }

      // Execute backup command in container
      // Note: This is a simplified version, actual implementation would need proper exec
      logInfo(`Backup command: ${backupCommand}`)

      return backupPath
    } catch (error) {
      logError(`Failed to backup ${type} database`, error)
      throw error
    }
  }

  /**
   * Get database metrics
   */
  static async getDatabaseMetrics(containerId: string, type: DatabaseType) {
    try {
      const stats = await dockerService.getContainerStats(containerId)

      // Type-specific metrics
      const typeMetrics: Record<string, any> = {}

      switch (type) {
        case 'postgresql':
          typeMetrics.connections = 'N/A' // Would need to query PostgreSQL
          typeMetrics.databases = 'N/A'
          break

        case 'mongodb':
          typeMetrics.collections = 'N/A' // Would need to query MongoDB
          typeMetrics.documents = 'N/A'
          break

        case 'redis':
          typeMetrics.keys = 'N/A' // Would need to query Redis
          typeMetrics.memoryUsage = 'N/A'
          break
      }

      return {
        ...stats,
        type,
        typeSpecific: typeMetrics,
      }
    } catch (error) {
      logError(`Failed to get metrics for ${type} database`, error)
      throw error
    }
  }
}
