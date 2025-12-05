/**
 * Application Templates Service
 * Pre-configured application templates that can be deployed instantly
 * Compatible with EasyPanel templates
 */

import { prisma } from '../lib/prisma'
import { ProjectService, type CreateProjectData } from './project.service'
import { HTTPException } from 'hono/http-exception'
import type { ProjectType } from '@prisma/client'

export type TemplateCategory = 'framework' | 'cms' | 'database' | 'static' | 'language'
export type BuildpackType = 'dockerfile' | 'nixpacks' | 'paketo' | 'heroku'

export interface HealthCheckConfig {
  test: string[]
  interval: number
  timeout: number
  retries: number
  startPeriod?: number
}

export interface ApplicationTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  language: string
  buildpack: BuildpackType
  dockerfile?: string
  dockerfileContent?: string
  envVars: Record<string, string>
  ports: Array<{ container: number; protocol: 'HTTP' | 'HTTPS' | 'TCP' }>
  volumes?: Array<{ source: string; target: string; mode?: 'rw' | 'ro' }>
  healthCheck?: HealthCheckConfig
  dependencies?: string[] // IDs de templates de dependências (ex: PostgreSQL)
  icon?: string // Emoji ou URL de ícone
  tags?: string[] // Tags para busca
  minCpu?: string // CPU mínimo recomendado
  minMemory?: string // Memória mínima recomendada
}

/**
 * Application templates configuration
 * Compatible with EasyPanel templates
 */
export const APPLICATION_TEMPLATES: Record<string, ApplicationTemplate> = {
  // Node.js Templates
  'nodejs-express': {
    id: 'nodejs-express',
    name: 'Node.js Express',
    description: 'Express.js web application framework for Node.js',
    category: 'framework',
    language: 'nodejs',
    buildpack: 'nixpacks',
    envVars: {
      NODE_ENV: 'production',
      PORT: '3000',
    },
    ports: [{ container: 3000, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🟢',
    tags: ['nodejs', 'express', 'javascript', 'web'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
  'nodejs-nextjs': {
    id: 'nodejs-nextjs',
    name: 'Next.js',
    description: 'React framework for production with server-side rendering',
    category: 'framework',
    language: 'nodejs',
    buildpack: 'nixpacks',
    envVars: {
      NODE_ENV: 'production',
      PORT: '3000',
    },
    ports: [{ container: 3000, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '▲',
    tags: ['nodejs', 'nextjs', 'react', 'ssr'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },
  'nodejs-nestjs': {
    id: 'nodejs-nestjs',
    name: 'NestJS',
    description: 'Progressive Node.js framework for building efficient server-side applications',
    category: 'framework',
    language: 'nodejs',
    buildpack: 'nixpacks',
    envVars: {
      NODE_ENV: 'production',
      PORT: '3000',
    },
    ports: [{ container: 3000, protocol: 'HTTP' }],
    dependencies: ['postgresql'],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🪺',
    tags: ['nodejs', 'nestjs', 'typescript', 'api'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },

  // Python Templates
  'python-django': {
    id: 'python-django',
    name: 'Django',
    description: 'High-level Python web framework for rapid development',
    category: 'framework',
    language: 'python',
    buildpack: 'nixpacks',
    envVars: {
      PYTHONUNBUFFERED: '1',
      PORT: '8000',
      DJANGO_SETTINGS_MODULE: 'project.settings',
    },
    ports: [{ container: 8000, protocol: 'HTTP' }],
    dependencies: ['postgresql'],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🐍',
    tags: ['python', 'django', 'web', 'orm'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },
  'python-flask': {
    id: 'python-flask',
    name: 'Flask',
    description: 'Lightweight Python web framework',
    category: 'framework',
    language: 'python',
    buildpack: 'nixpacks',
    envVars: {
      PYTHONUNBUFFERED: '1',
      PORT: '5000',
      FLASK_APP: 'app.py',
    },
    ports: [{ container: 5000, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:5000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🌶️',
    tags: ['python', 'flask', 'web', 'microframework'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
  'python-fastapi': {
    id: 'python-fastapi',
    name: 'FastAPI',
    description: 'Modern, fast web framework for building APIs with Python',
    category: 'framework',
    language: 'python',
    buildpack: 'nixpacks',
    envVars: {
      PYTHONUNBUFFERED: '1',
      PORT: '8000',
    },
    ports: [{ container: 8000, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '⚡',
    tags: ['python', 'fastapi', 'api', 'async'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },

  // PHP Templates
  'php-laravel': {
    id: 'php-laravel',
    name: 'Laravel',
    description: 'PHP web application framework with elegant syntax',
    category: 'framework',
    language: 'php',
    buildpack: 'nixpacks',
    envVars: {
      APP_ENV: 'production',
      APP_DEBUG: 'false',
      PORT: '8000',
    },
    ports: [{ container: 8000, protocol: 'HTTP' }],
    dependencies: ['mysql'],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🔴',
    tags: ['php', 'laravel', 'web', 'mvc'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },
  'php-wordpress': {
    id: 'php-wordpress',
    name: 'WordPress',
    description: 'Popular content management system and blogging platform',
    category: 'cms',
    language: 'php',
    buildpack: 'nixpacks',
    envVars: {
      WORDPRESS_DB_HOST: 'mysql',
      WORDPRESS_DB_USER: 'wordpress',
      WORDPRESS_DB_PASSWORD: 'wordpress',
      WORDPRESS_DB_NAME: 'wordpress',
      WORDPRESS_TABLE_PREFIX: 'wp_',
    },
    ports: [{ container: 80, protocol: 'HTTP' }],
    dependencies: ['mysql'],
    volumes: [
      { source: '/var/www/html', target: '/var/www/html', mode: 'rw' },
    ],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost/wp-admin/install.php'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '📝',
    tags: ['php', 'wordpress', 'cms', 'blog'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },
  'php-drupal': {
    id: 'php-drupal',
    name: 'Drupal',
    description: 'Open-source content management framework',
    category: 'cms',
    language: 'php',
    buildpack: 'nixpacks',
    envVars: {
      DRUPAL_DB_HOST: 'mysql',
      DRUPAL_DB_USER: 'drupal',
      DRUPAL_DB_PASSWORD: 'drupal',
      DRUPAL_DB_NAME: 'drupal',
    },
    ports: [{ container: 80, protocol: 'HTTP' }],
    dependencies: ['mysql'],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost/'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '💧',
    tags: ['php', 'drupal', 'cms'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },

  // Ruby Templates
  'ruby-rails': {
    id: 'ruby-rails',
    name: 'Ruby on Rails',
    description: 'Web application framework written in Ruby',
    category: 'framework',
    language: 'ruby',
    buildpack: 'nixpacks',
    envVars: {
      RAILS_ENV: 'production',
      PORT: '3000',
      SECRET_KEY_BASE: 'change-me-in-production',
    },
    ports: [{ container: 3000, protocol: 'HTTP' }],
    dependencies: ['postgresql'],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '💎',
    tags: ['ruby', 'rails', 'web', 'mvc'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },
  'ruby-sinatra': {
    id: 'ruby-sinatra',
    name: 'Sinatra',
    description: 'Lightweight Ruby web framework',
    category: 'framework',
    language: 'ruby',
    buildpack: 'nixpacks',
    envVars: {
      RACK_ENV: 'production',
      PORT: '4567',
    },
    ports: [{ container: 4567, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:4567/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🎸',
    tags: ['ruby', 'sinatra', 'web', 'microframework'],
    minCpu: '500m',
    minMemory: '256Mi',
  },

  // Go Templates
  'go-gin': {
    id: 'go-gin',
    name: 'Gin',
    description: 'HTTP web framework written in Go',
    category: 'framework',
    language: 'go',
    buildpack: 'nixpacks',
    envVars: {
      PORT: '8080',
    },
    ports: [{ container: 8080, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🚀',
    tags: ['go', 'golang', 'gin', 'api'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
  'go-echo': {
    id: 'go-echo',
    name: 'Echo',
    description: 'High performance web framework for Go',
    category: 'framework',
    language: 'go',
    buildpack: 'nixpacks',
    envVars: {
      PORT: '1323',
    },
    ports: [{ container: 1323, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:1323/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '📡',
    tags: ['go', 'golang', 'echo', 'api'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
  'go-fiber': {
    id: 'go-fiber',
    name: 'Fiber',
    description: 'Express-inspired web framework built on Fasthttp',
    category: 'framework',
    language: 'go',
    buildpack: 'nixpacks',
    envVars: {
      PORT: '3000',
    },
    ports: [{ container: 3000, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '⚡',
    tags: ['go', 'golang', 'fiber', 'api'],
    minCpu: '500m',
    minMemory: '256Mi',
  },

  // Java Templates
  'java-springboot': {
    id: 'java-springboot',
    name: 'Spring Boot',
    description: 'Java-based framework for building microservices',
    category: 'framework',
    language: 'java',
    buildpack: 'paketo',
    envVars: {
      SERVER_PORT: '8080',
      SPRING_PROFILES_ACTIVE: 'production',
    },
    ports: [{ container: 8080, protocol: 'HTTP' }],
    dependencies: ['postgresql'],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/actuator/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '☕',
    tags: ['java', 'spring', 'springboot', 'microservices'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },
  'java-quarkus': {
    id: 'java-quarkus',
    name: 'Quarkus',
    description: 'Kubernetes-native Java framework',
    category: 'framework',
    language: 'java',
    buildpack: 'paketo',
    envVars: {
      QUARKUS_HTTP_PORT: '8080',
    },
    ports: [{ container: 8080, protocol: 'HTTP' }],
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/health'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '⚛️',
    tags: ['java', 'quarkus', 'kubernetes', 'native'],
    minCpu: '1000m',
    minMemory: '512Mi',
  },

  // Static Site Templates
  'static-react': {
    id: 'static-react',
    name: 'React (Static)',
    description: 'Static React application',
    category: 'static',
    language: 'javascript',
    buildpack: 'nixpacks',
    envVars: {},
    ports: [{ container: 80, protocol: 'HTTP' }],
    dockerfileContent: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost/'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '⚛️',
    tags: ['react', 'static', 'spa', 'javascript'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
  'static-vue': {
    id: 'static-vue',
    name: 'Vue.js (Static)',
    description: 'Static Vue.js application',
    category: 'static',
    language: 'javascript',
    buildpack: 'nixpacks',
    envVars: {},
    ports: [{ container: 80, protocol: 'HTTP' }],
    dockerfileContent: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost/'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🟢',
    tags: ['vue', 'static', 'spa', 'javascript'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
  'static-angular': {
    id: 'static-angular',
    name: 'Angular (Static)',
    description: 'Static Angular application',
    category: 'static',
    language: 'typescript',
    buildpack: 'nixpacks',
    envVars: {},
    ports: [{ container: 80, protocol: 'HTTP' }],
    dockerfileContent: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost/'],
      interval: 30000,
      timeout: 10000,
      retries: 3,
    },
    icon: '🅰️',
    tags: ['angular', 'static', 'spa', 'typescript'],
    minCpu: '500m',
    minMemory: '256Mi',
  },
}

export class ApplicationTemplatesService {
  /**
   * List all available application templates
   */
  static listTemplates(): ApplicationTemplate[] {
    return Object.values(APPLICATION_TEMPLATES)
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: TemplateCategory): ApplicationTemplate[] {
    return Object.values(APPLICATION_TEMPLATES).filter((t) => t.category === category)
  }

  /**
   * Get templates by language
   */
  static getTemplatesByLanguage(language: string): ApplicationTemplate[] {
    return Object.values(APPLICATION_TEMPLATES).filter(
      (t) => t.language.toLowerCase() === language.toLowerCase()
    )
  }

  /**
   * Search templates by query
   */
  static searchTemplates(query: string): ApplicationTemplate[] {
    const lowerQuery = query.toLowerCase()
    return Object.values(APPLICATION_TEMPLATES).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Get specific template by ID
   */
  static getTemplate(id: string): ApplicationTemplate | null {
    return APPLICATION_TEMPLATES[id] || null
  }

  /**
   * Create a project from a template
   * 
   * @param options - Options for creating project from template
   * @returns Created project with template information
   * 
   * @throws {HTTPException} 404 - Template not found
   * @throws {HTTPException} 400 - Invalid project name or slug already exists
   */
  static async createProjectFromTemplate(options: {
    templateId: string
    projectName: string
    ownerId: string
    gitUrl?: string
    gitBranch?: string
    customEnv?: Record<string, string>
    customPort?: number
    cpuLimit?: string
    memoryLimit?: string
    teamId?: string
  }): Promise<{
    project: Awaited<ReturnType<typeof ProjectService.create>>
    template: ApplicationTemplate
    port: number
  }> {
    const {
      templateId,
      projectName,
      ownerId,
      gitUrl,
      gitBranch = 'main',
      customEnv = {},
      customPort,
      cpuLimit,
      memoryLimit,
      teamId,
    } = options

    // Get template
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new HTTPException(404, { message: `Template ${templateId} not found` })
    }

    // Generate slug from project name
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Determine project type based on template category
    let projectType: ProjectType = 'WEB'
    if (template.category === 'database') {
      projectType = 'DATABASE'
    } else if (template.category === 'static') {
      projectType = 'WEB'
    } else if (template.buildpack === 'dockerfile' && template.dockerfile) {
      projectType = 'WEB'
    } else {
      projectType = 'WEB'
    }

    // Merge template env vars with custom env vars
    const mergedEnvVars = {
      ...template.envVars,
      ...customEnv,
    }

    // Determine port (use custom port if provided, otherwise use first port from template)
    const port = customPort || template.ports[0]?.container || 3000

    // Determine CPU and memory limits (use custom if provided, otherwise use template defaults)
    const finalCpuLimit = cpuLimit || template.minCpu || '1000m'
    const finalMemoryLimit = memoryLimit || template.minMemory || '512Mi'

    // Create project
    const projectData: CreateProjectData = {
      name: projectName,
      slug,
      description: `Project created from ${template.name} template`,
      type: projectType,
      gitUrl: gitUrl || null,
      gitBranch: gitBranch || 'main',
      cpuLimit: finalCpuLimit,
      memoryLimit: finalMemoryLimit,
      ownerId,
      teamId: teamId || null,
    }

    const project = await ProjectService.create(projectData)

    // Create environment variables
    if (Object.keys(mergedEnvVars).length > 0) {
      await prisma.envVar.createMany({
        data: Object.entries(mergedEnvVars).map(([key, value]) => ({
          projectId: project.id,
          key: key.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
          value: String(value),
          isSecret: false,
        })),
        skipDuplicates: true,
      })
    }

    return {
      project,
      template,
      port,
    }
  }

}

