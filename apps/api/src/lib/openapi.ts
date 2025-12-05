/**
 * OpenAPI Configuration for OpenPanel API
 * 
 * This file contains the base OpenAPI schema configuration
 * and utilities for documenting API endpoints.
 */

export const openAPISchema = {
  openapi: '3.0.0',
  info: {
    title: 'OpenPanel API',
    version: '0.3.0',
    description: 'Modern self-hosted server control panel API with Docker management, templates, and real-time monitoring.',
    contact: {
      name: 'OpenPanel Support',
      url: 'https://github.com/msoutole/openpanel',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.openpanel.local',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and authorization endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Teams', description: 'Team management endpoints' },
    { name: 'Projects', description: 'Project management endpoints' },
    { name: 'Containers', description: 'Docker container management endpoints' },
    { name: 'Builds', description: 'Build and deployment endpoints' },
    { name: 'Templates', description: 'Application template endpoints' },
    { name: 'Databases', description: 'Database management endpoints' },
    { name: 'Metrics', description: 'System metrics endpoints' },
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Settings', description: 'System settings endpoints' },
    { name: 'Webhooks', description: 'Webhook endpoints' },
    { name: 'SSL', description: 'SSL certificate management endpoints' },
    { name: 'Backups', description: 'Backup management endpoints' },
    { name: 'Audit', description: 'Audit log endpoints' },
    { name: 'Stats', description: 'Statistics endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          status: {
            type: 'number',
            description: 'HTTP status code',
          },
          message: {
            type: 'string',
            description: 'Detailed error message (development only)',
          },
        },
        required: ['error', 'status'],
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
        },
        required: ['success'],
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            description: 'User full name',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            example: 'SecurePass123',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            example: 'password123',
          },
          twoFactorCode: {
            type: 'string',
            description: '2FA TOTP code (required if 2FA is enabled)',
            example: '123456',
          },
          backupCode: {
            type: 'string',
            description: '2FA backup code (alternative to twoFactorCode)',
            example: 'backup-code-123',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          accessToken: {
            type: 'string',
            description: 'JWT access token',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          type: {
            type: 'string',
            enum: ['WEB', 'API', 'WORKER', 'CRON', 'DATABASE', 'REDIS', 'MONGODB'],
          },
          dockerImage: { type: 'string' },
          dockerTag: { type: 'string' },
          gitUrl: { type: 'string' },
          gitBranch: { type: 'string' },
          replicas: { type: 'number' },
          cpuLimit: { type: 'string' },
          memoryLimit: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Container: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: {
            type: 'string',
            enum: ['RUNNING', 'STOPPED', 'RESTARTING', 'PAUSED', 'EXITED'],
          },
          image: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'healthy', 'unhealthy'],
          },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Unauthorized',
              status: 401,
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Forbidden',
              status: 403,
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Not Found',
              status: 404,
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Internal Server Error',
              status: 500,
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic health check',
        description: 'Returns basic API health status',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthCheck',
                },
                example: {
                  status: 'ok',
                  timestamp: '2025-12-03T10:00:00Z',
                  uptime: 3600,
                },
              },
            },
          },
        },
      },
    },
    '/api/health/system': {
      get: {
        tags: ['Health'],
        summary: 'Get system health',
        description: 'Get overall system health status',
        operationId: 'getSystemHealth',
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    components: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/health/containers': {
      get: {
        tags: ['Health'],
        summary: 'Get all containers health',
        description: 'Get health status for all containers',
        operationId: 'getAllContainersHealth',
        responses: {
          '200': {
            description: 'Containers health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    containers: { type: 'array', items: { type: 'object' } },
                    total: { type: 'number' },
                    healthy: { type: 'number' },
                    unhealthy: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/health/containers/{id}': {
      get: {
        tags: ['Health'],
        summary: 'Get container health',
        description: 'Get health status for a specific container',
        operationId: 'getContainerHealth',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Container health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        description: 'Create a new user account',
        operationId: 'register',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Bad request - User already exists or validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Authenticate user and receive JWT tokens. If 2FA is enabled, include twoFactorCode or backupCode.',
        operationId: 'login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials or 2FA code required',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  error: '2FA code required',
                  requires2FA: true,
                  status: 401,
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Get a new access token using a refresh token',
        operationId: 'refreshToken',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: {
                    type: 'string',
                    description: 'JWT refresh token',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List all projects',
        description: 'Get all projects for the authenticated user',
        operationId: 'listProjects',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projects: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Project',
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create new project',
        description: 'Create a new project',
        operationId: 'createProject',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug', 'type'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
                  description: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['WEB', 'API', 'WORKER', 'CRON', 'DATABASE', 'REDIS', 'MONGODB'],
                  },
                  dockerImage: { type: 'string' },
                  dockerTag: { type: 'string', default: 'latest' },
                  gitUrl: { type: 'string', format: 'uri' },
                  gitBranch: { type: 'string', default: 'main' },
                  replicas: { type: 'number', minimum: 0, maximum: 10, default: 1 },
                  cpuLimit: { type: 'string', default: '1000m' },
                  memoryLimit: { type: 'string', default: '512Mi' },
                  teamId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        description: 'Get details of a specific project',
        operationId: 'getProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
        ],
        responses: {
          '200': {
            description: 'Project details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update project',
        description: 'Update project details',
        operationId: 'updateProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  dockerImage: { type: 'string' },
                  dockerTag: { type: 'string' },
                  replicas: { type: 'number' },
                  cpuLimit: { type: 'string' },
                  memoryLimit: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        description: 'Delete a project and all associated resources',
        operationId: 'deleteProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Project deleted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Success',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/containers': {
      get: {
        tags: ['Containers'],
        summary: 'List all containers',
        description: 'Get all Docker containers',
        operationId: 'listContainers',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of containers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    containers: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Container',
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/containers/{id}/start': {
      post: {
        tags: ['Containers'],
        summary: 'Start container',
        description: 'Start a Docker container',
        operationId: 'startContainer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Container ID',
          },
        ],
        responses: {
          '200': {
            description: 'Container started successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Success',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/containers/{id}/stop': {
      post: {
        tags: ['Containers'],
        summary: 'Stop container',
        description: 'Stop a Docker container',
        operationId: 'stopContainer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Container stopped successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Success',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List application templates',
        description: 'Get all available application templates',
        operationId: 'listTemplates',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by category',
          },
          {
            name: 'language',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by programming language',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search templates by name or description',
          },
        ],
        responses: {
          '200': {
            description: 'List of templates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    templates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          category: { type: 'string' },
                          language: { type: 'string' },
                          icon: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/templates/{id}/deploy': {
      post: {
        tags: ['Templates'],
        summary: 'Deploy template',
        description: 'Deploy an application from a template',
        operationId: 'deployTemplate',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Template ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectName', 'projectSlug'],
                properties: {
                  projectName: { type: 'string' },
                  projectSlug: { type: 'string' },
                  environmentVariables: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Template deployed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/databases/templates': {
      get: {
        tags: ['Databases'],
        summary: 'List database templates',
        description: 'Get all available database templates',
        operationId: 'listDatabaseTemplates',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of database templates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    templates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          image: { type: 'string' },
                          defaultPort: { type: 'number' },
                        },
                      },
                    },
                    total: { type: 'number' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/metrics/system': {
      get: {
        tags: ['Metrics'],
        summary: 'Get system metrics',
        description: 'Get system-wide metrics (CPU, Memory, Disk, Network)',
        operationId: 'getSystemMetrics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'System metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    metrics: {
                      type: 'object',
                      properties: {
                        cpu: { type: 'number' },
                        memory: { type: 'number' },
                        disk: { type: 'number' },
                        network: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/metrics/containers': {
      get: {
        tags: ['Metrics'],
        summary: 'Get container metrics',
        description: 'Get metrics for all containers',
        operationId: 'getContainerMetrics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Container metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    containers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          cpu: { type: 'number' },
                          memory: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/builds': {
      post: {
        tags: ['Builds'],
        summary: 'Create new build',
        description: 'Create a new build/deployment for a project',
        operationId: 'createBuild',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId'],
                properties: {
                  projectId: { type: 'string' },
                  branch: { type: 'string', default: 'main' },
                  commitHash: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Build created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    projectId: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING', 'BUILDING', 'SUCCESS', 'FAILED'] },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
      get: {
        tags: ['Builds'],
        summary: 'List builds',
        description: 'Get builds for a project',
        operationId: 'listBuilds',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
        ],
        responses: {
          '200': {
            description: 'List of builds',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    builds: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          projectId: { type: 'string' },
                          status: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        description: 'Get all users (admin only)',
        operationId: 'listUsers',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Get user details by ID',
        operationId: 'getUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/teams': {
      get: {
        tags: ['Teams'],
        summary: 'List teams',
        description: 'Get all teams for the authenticated user',
        operationId: 'listTeams',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of teams',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    teams: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          slug: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/domains': {
      get: {
        tags: ['Domains'],
        summary: 'List domains',
        description: 'Get domains for a project',
        operationId: 'listDomains',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'List of domains',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    domains: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          domain: { type: 'string' },
                          projectId: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/health/detailed': {
      get: {
        tags: ['Health'],
        summary: 'Detailed health check',
        description: 'Get detailed health status including database and Redis connectivity',
        operationId: 'getDetailedHealth',
        security: [],
        responses: {
          '200': {
            description: 'Detailed health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    api: { type: 'boolean' },
                    database: { type: 'boolean' },
                    redis: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get system settings',
        description: 'Get current system settings',
        operationId: 'getSettings',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'System settings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    geminiApiKey: { type: 'string' },
                    ollamaEnabled: { type: 'boolean' },
                    ollamaHost: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/backups': {
      get: {
        tags: ['Backups'],
        summary: 'List backups',
        description: 'Get all backups',
        operationId: 'listBackups',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of backups',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    backups: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/stats': {
      get: {
        tags: ['Stats'],
        summary: 'Get statistics',
        description: 'Get system statistics',
        operationId: 'getStats',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'System statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalProjects: { type: 'number' },
                    totalContainers: { type: 'number' },
                    totalUsers: { type: 'number' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/audit': {
      get: {
        tags: ['Audit'],
        summary: 'Get audit logs',
        description: 'Get audit logs for the authenticated user',
        operationId: 'getAuditLogs',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Audit logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          action: { type: 'string' },
                          resourceType: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
}
