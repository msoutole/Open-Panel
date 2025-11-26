import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logWarn } from '../lib/logger'

interface TraefikConfig {
  http: {
    routers: Record<string, TraefikRouter>
    services: Record<string, TraefikServiceConfig>
    middlewares?: Record<string, any>
  }
  tcp?: {
    routers: Record<string, any>
    services: Record<string, any>
  }
  tls?: {
    certificates?: Array<{
      certFile: string
      keyFile: string
    }>
    options?: Record<string, any>
  }
}

interface TraefikRouter {
  rule: string
  service: string
  entryPoints?: string[]
  middlewares?: string[]
  tls?: {
    certResolver?: string
    domains?: Array<{
      main: string
      sans?: string[]
    }>
  }
}

interface TraefikServiceConfig {
  loadBalancer: {
    servers: Array<{
      url: string
    }>
    passHostHeader?: boolean
  }
}

/**
 * TraefikService - Manages Traefik reverse proxy configuration
 */
export class TraefikService {
  private static instance: TraefikService
  private configPath: string
  private dynamicConfigPath: string

  private constructor() {
    // Traefik configuration paths
    // In development, use local config directory instead of /etc/traefik
    const defaultConfigPath = process.env.NODE_ENV === 'production'
      ? '/etc/traefik/traefik.yml'
      : path.join(process.cwd(), '../../config/traefik/traefik.yml')

    const defaultDynamicPath = process.env.NODE_ENV === 'production'
      ? '/etc/traefik/dynamic/openpanel.yml'
      : path.join(process.cwd(), '../../config/traefik/dynamic/openpanel.yml')

    this.configPath = process.env.TRAEFIK_CONFIG_PATH || defaultConfigPath
    this.dynamicConfigPath = process.env.TRAEFIK_DYNAMIC_CONFIG_PATH || defaultDynamicPath

    // Ensure dynamic config directory exists
    const dynamicDir = path.dirname(this.dynamicConfigPath)
    if (!fs.existsSync(dynamicDir)) {
      try {
        fs.mkdirSync(dynamicDir, { recursive: true })
      } catch (error) {
        logWarn(`Could not create Traefik config directory: ${dynamicDir}`)
        logWarn(`This is normal if Traefik is managed externally (e.g., via Docker)`)
        // Don't throw - let Traefik manage its own config if it's running in Docker
      }
    }
  }

  public static getInstance(): TraefikService {
    if (!TraefikService.instance) {
      TraefikService.instance = new TraefikService()
    }
    return TraefikService.instance
  }

  /**
   * Initialize Traefik static configuration
   */
  async initializeStaticConfig(): Promise<void> {
    const staticConfig = {
      global: {
        checkNewVersion: true,
        sendAnonymousUsage: false,
      },
      api: {
        dashboard: true,
        insecure: false,
      },
      entryPoints: {
        web: {
          address: ':80',
          http: {
            redirections: {
              entryPoint: {
                to: 'websecure',
                scheme: 'https',
                permanent: true,
              },
            },
          },
        },
        websecure: {
          address: ':443',
          http: {
            tls: {
              certResolver: 'letsencrypt',
            },
          },
        },
      },
      certificatesResolvers: {
        letsencrypt: {
          acme: {
            email: process.env.ACME_EMAIL || 'admin@openpanel.dev',
            storage: '/etc/traefik/acme.json',
            httpChallenge: {
              entryPoint: 'web',
            },
          },
        },
      },
      providers: {
        file: {
          directory: path.dirname(this.dynamicConfigPath),
          watch: true,
        },
        docker: {
          exposedByDefault: false,
          network: 'openpanel',
        },
      },
      log: {
        level: process.env.LOG_LEVEL || 'INFO',
      },
      accessLog: {
        filePath: '/var/log/traefik/access.log',
        bufferingSize: 100,
      },
    }

    const yamlContent = yaml.dump(staticConfig)
    fs.writeFileSync(this.configPath, yamlContent, 'utf8')

    logInfo('Traefik static configuration initialized')
  }

  /**
   * Add route for a container/project
   */
  async addRoute(options: {
    projectId: string
    domain: string
    containerName: string
    containerPort: number
    enableSSL?: boolean
  }): Promise<void> {
    const { projectId, domain, containerName, containerPort, enableSSL = true } = options

    const config = await this.loadDynamicConfig()

    // Create router name
    const routerName = `${projectId}-${domain.replace(/\./g, '-')}`
    const serviceName = `${projectId}-service`

    // Add HTTP router
    config.http.routers[routerName] = {
      rule: `Host(\`${domain}\`)`,
      service: serviceName,
      entryPoints: enableSSL ? ['websecure'] : ['web'],
    }

    // Add TLS if SSL is enabled
    if (enableSSL) {
      config.http.routers[routerName].tls = {
        certResolver: 'letsencrypt',
        domains: [
          {
            main: domain,
          },
        ],
      }
    }

    // Add service
    config.http.services[serviceName] = {
      loadBalancer: {
        servers: [
          {
            url: `http://${containerName}:${containerPort}`,
          },
        ],
        passHostHeader: true,
      },
    }

    await this.saveDynamicConfig(config)

    logInfo(`Route added for ${domain} → ${containerName}:${containerPort}`, {
      domain,
      containerName,
      containerPort,
    })
  }

  /**
   * Remove route for a domain
   */
  async removeRoute(projectId: string, domain: string): Promise<void> {
    const config = await this.loadDynamicConfig()

    const routerName = `${projectId}-${domain.replace(/\./g, '-')}`
    const serviceName = `${projectId}-service`

    // Remove router
    if (config.http.routers[routerName]) {
      delete config.http.routers[routerName]
    }

    // Check if service is used by other routers
    const serviceInUse = Object.values(config.http.routers).some(
      (router) => router.service === serviceName
    )

    // Remove service if not in use
    if (!serviceInUse && config.http.services[serviceName]) {
      delete config.http.services[serviceName]
    }

    await this.saveDynamicConfig(config)

    logInfo(`Route removed for ${domain}`, { domain })
  }

  /**
   * Update domain configuration
   */
  async updateDomain(domainId: string): Promise<void> {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: {
          include: {
            containers: {
              where: {
                status: 'RUNNING',
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    if (!domain.project) {
      throw new Error('Project not found for domain')
    }

    const container = domain.project.containers[0]
    if (!container) {
      throw new Error('No running container found for project')
    }

    // Parse ports from container
    const ports = (container.ports as any) || []
    const mainPort = ports[0]?.container || 80

    await this.addRoute({
      projectId: domain.projectId,
      domain: domain.name,
      containerName: container.name,
      containerPort: mainPort,
      enableSSL: domain.sslEnabled,
    })

    // Update domain status
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    })
  }

  /**
   * Sync all domains with Traefik
   */
  async syncAllDomains(): Promise<number> {
    const domains = await prisma.domain.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'VERIFYING'],
        },
      },
      include: {
        project: {
          include: {
            containers: {
              where: {
                status: 'RUNNING',
              },
              take: 1,
            },
          },
        },
      },
    })

    let synced = 0

    for (const domain of domains) {
      try {
        await this.updateDomain(domain.id)
        synced++
      } catch (error) {
        logError(`Failed to sync domain ${domain.name}`, error, {
          domainName: domain.name,
        })
      }
    }

    return synced
  }

  /**
   * Add middleware (CORS, rate limiting, etc.)
   */
  async addMiddleware(name: string, config: any): Promise<void> {
    const fullConfig = await this.loadDynamicConfig()

    if (!fullConfig.http.middlewares) {
      fullConfig.http.middlewares = {}
    }

    fullConfig.http.middlewares[name] = config

    await this.saveDynamicConfig(fullConfig)

    logInfo(`Middleware added: ${name}`, { middlewareName: name })
  }

  /**
   * Load dynamic configuration
   */
  private async loadDynamicConfig(): Promise<TraefikConfig> {
    try {
      if (fs.existsSync(this.dynamicConfigPath)) {
        const content = fs.readFileSync(this.dynamicConfigPath, 'utf8')
        return yaml.load(content) as TraefikConfig
      }
    } catch (error) {
      logWarn('Failed to load dynamic config, creating new one')
    }

    // Return default config
    return {
      http: {
        routers: {},
        services: {},
        middlewares: {},
      },
    }
  }

  /**
   * Save dynamic configuration
   */
  private async saveDynamicConfig(config: TraefikConfig): Promise<void> {
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
    })

    fs.writeFileSync(this.dynamicConfigPath, yamlContent, 'utf8')
  }

  /**
   * Get Traefik API endpoint
   */
  getApiEndpoint(): string {
    return process.env.TRAEFIK_API_URL || 'http://traefik:8080/api'
  }

  /**
   * Check if Traefik is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiEndpoint()}/ping`, {
        method: 'HEAD',
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get all routers from Traefik API
   */
  async getRouters(): Promise<any> {
    try {
      const response = await fetch(`${this.getApiEndpoint()}/http/routers`)
      if (!response.ok) {
        throw new Error('Failed to fetch routers')
      }
      return await response.json()
    } catch (error) {
      logError('Error fetching routers', error)
      return []
    }
  }

  /**
   * Get all services from Traefik API
   */
  async getServices(): Promise<any> {
    try {
      const response = await fetch(`${this.getApiEndpoint()}/http/services`)
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }
      return await response.json()
    } catch (error) {
      logError('Error fetching services', error)
      return []
    }
  }
}

// Export singleton instance
export const traefikService = TraefikService.getInstance()
