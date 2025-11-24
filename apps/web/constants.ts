
import { Project, MetricPoint, LogEntry, User, AuditLog } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'proj_ecommerce',
    name: 'chatwoot',
    description: 'Customer engagement suite',
    status: 'Active',
    lastDeploy: '2023-10-27 14:30',
    members: ['admin'],
    envVars: [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'DB_HOST', value: 'mysql-container', locked: true }
    ],
    services: [
      {
        id: 'svc_woo_app',
        name: 'chatwoot',
        type: 'app',
        image: 'chatwoot/chatwoot:v3.9.0',
        status: 'Running',
        cpu: 0.1,
        memory: '298.3 MB',
        port: 3000,
        deploymentToken: 'f645f1161d098617f535a43a48b74507de72f8e37ae614b9',
        command: 'bundle exec rails s -p 3000 -b 0.0.0.0',
        traefik: {
          domain: 'chatwoot.openpanel.dev',
          https: true,
          middlewares: {
            basicAuth: false,
            rateLimit: true,
            ipAllowList: [],
            compress: true
          }
        },
        source: {
            type: 'docker',
            image: 'chatwoot/chatwoot:v3.9.0',
            autoDeploy: true
        },
        envVars: [
            { key: 'SECRET_KEY_BASE', value: '89d39ef377e473e69780f7434b303792', locked: false },
            { key: 'FRONTEND_URL', value: 'https://$(PRIMARY_DOMAIN)', locked: false },
            { key: 'DEFAULT_LOCALE', value: 'en', locked: false },
            { key: 'FORCE_SSL', value: 'false', locked: false },
            { key: 'ENABLE_ACCOUNT_SIGNUP', value: 'true', locked: false },
            { key: 'REDIS_URL', value: 'redis://default@$(PROJECT_NAME)_chatwoot-redis:6379', locked: false },
            { key: 'REDIS_PASSWORD', value: 'bd95105642ea39ba7f90', locked: false },
            { key: 'REDIS_OPENSSL_VERIFY_MODE', value: 'none', locked: false },
            { key: 'POSTGRES_DATABASE', value: '$(PROJECT_NAME)', locked: false },
            { key: 'POSTGRES_HOST', value: '$(PROJECT_NAME)_chatwoot-db', locked: false },
            { key: 'POSTGRES_USERNAME', value: 'postgres', locked: false },
            { key: 'POSTGRES_PASSWORD', value: '8f9c96541b262a65f24e', locked: false },
            { key: 'RAILS_MAX_THREADS', value: '5', locked: false },
            { key: 'NODE_ENV', value: 'production', locked: false },
            { key: 'RAILS_ENV', value: 'production', locked: false },
            { key: 'INSTALLATION_ENV', value: 'docker', locked: false },
            { key: 'TRUSTED_PROXIES', value: '*', locked: false }
        ],
        domains: [
            { id: 'd1', domain: 'chatwoot-chatwoot.nvm1fj.easypanel.host', https: true, main: true, targetPort: 3000, targetProtocol: 'HTTP', path: '/' }
        ],
        deployments: [
            { id: 'dep_1', commit: 'No description', message: 'No description', status: 'Success', timestamp: '1 minuto / há 1 ano', branch: 'main', author: 'system' },
            { id: 'dep_2', commit: 'No description', message: 'No description', status: 'Building', timestamp: '16 minutos / há 1 ano', branch: 'main', author: 'system' }
        ],
        resources: {
            cpuLimit: 0,
            memoryLimit: 0,
            cpuReservation: 0,
            memoryReservation: 0
        }
      },
      {
        id: 'svc_woo_db',
        name: 'chatwoot-db',
        type: 'db',
        image: 'postgres:15',
        status: 'Running',
        cpu: 25,
        memory: '145MB',
        port: 5432,
        exposedPort: 5432,
        credentials: {
            host: 'chatwoot_chatwoot-db',
            user: 'postgres',
            password: '8f9c96541b262a65f24e',
            port: 5432,
            databaseName: 'chatwoot',
            connectionString: 'postgres://postgres:8f9c96541b262a65f24e@chatwoot_chatwoot-db:5432/chatwoot?sslmode=disable'
        },
        envVars: [
            { key: 'POSTGRES_USER', value: 'postgres', locked: false },
            { key: 'POSTGRES_PASSWORD', value: '8f9c96541b262a65f24e', locked: false },
            { key: 'POSTGRES_DB', value: 'chatwoot', locked: false }
        ],
        backups: [
            { id: 'bk_1', filename: 'backup-2023-11-01.sql.gz', size: '124 MB', status: 'Available', timestamp: '2023-11-01 00:00:00' }
        ]
      },
      {
        id: 'svc_woo_redis',
        name: 'chatwoot-redis',
        type: 'redis',
        image: 'redis:alpine',
        status: 'Running',
        cpu: 2,
        memory: '64MB',
        port: 6379,
        credentials: {
            host: 'chatwoot-redis.internal',
            user: 'default',
            password: '',
            port: 6379
        }
      },
      {
        id: 'svc_woo_worker',
        name: 'chatwoot-sidekiq',
        type: 'worker',
        image: 'chatwoot/chatwoot:v3.9.0',
        status: 'Running',
        cpu: 5,
        memory: '220MB',
        port: 0,
        command: 'bundle exec sidekiq'
      }
    ]
  },
  {
    id: 'proj_n8n',
    name: 'Automação N8N',
    description: 'Workflow automation workflows',
    status: 'Active',
    lastDeploy: '2023-10-25 11:20',
    members: ['admin'],
    envVars: [],
    services: [
      {
        id: 'svc_n8n_main',
        name: 'n8n-editor',
        type: 'app',
        image: 'n8nio/n8n:latest',
        status: 'Running',
        cpu: 45,
        memory: '1.2GB',
        port: 5678,
        deploymentToken: 'n8n_token_example_123456',
        source: {
            type: 'git',
            repo: 'https://github.com/n8n-io/n8n',
            branch: 'master',
            autoDeploy: true
        },
        deployments: [
             { id: 'dep_n1', commit: 'latest', message: 'Auto-update to 1.14.0', status: 'Success', timestamp: '2023-10-25 11:20', branch: 'master', author: 'system' }
        ],
        traefik: {
          domain: 'n8n.openpanel.dev',
          https: true,
          middlewares: {
            basicAuth: true,
            rateLimit: false,
            ipAllowList: ['192.168.1.50'],
            compress: true
          }
        },
        resources: {
            cpuLimit: 1,
            memoryLimit: 2048,
            cpuReservation: 0.5,
            memoryReservation: 1024
        }
      }
    ]
  },
  {
    id: 'proj_legacy',
    name: 'Legacy CRM',
    description: 'Old PHP system, scheduled for decommissioning',
    status: 'Active',
    lastDeploy: '2023-09-10 08:00',
    members: ['admin'],
    envVars: [],
    services: [
       {
        id: 'svc_crm_web',
        name: 'crm-web',
        type: 'app',
        image: 'php:7.4-apache',
        status: 'Stopped',
        cpu: 0,
        memory: '0MB',
        port: 80
      }
    ]
  }
];

export const USERS_MOCK: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@openpanel.dev', role: 'admin', twoFactorEnabled: true, lastLogin: 'Just now' },
  { id: 'u2', name: 'Dev Team', email: 'devs@company.com', role: 'user', twoFactorEnabled: false, lastLogin: '2 days ago' },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: 'al_1', action: 'SERVICE_STOP', userId: 'u1', userEmail: 'admin@openpanel.dev', targetResource: 'svc_crm_web', ipAddress: '192.168.1.5', timestamp: '2023-10-27 15:45:12', status: 'Success' },
  { id: 'al_2', action: 'ENV_VAR_UPDATE', userId: 'u1', userEmail: 'admin@openpanel.dev', targetResource: 'proj_ecommerce', ipAddress: '192.168.1.5', timestamp: '2023-10-27 15:30:00', status: 'Success' },
  { id: 'al_3', action: 'LOGIN_ATTEMPT', userId: 'unknown', userEmail: 'hacker@bad.com', targetResource: 'auth_system', ipAddress: '45.22.19.112', timestamp: '2023-10-27 14:12:05', status: 'Failure' },
  { id: 'al_4', action: 'DEPLOY_PROJECT', userId: 'u2', userEmail: 'devs@company.com', targetResource: 'proj_n8n', ipAddress: '10.0.0.42', timestamp: '2023-10-25 11:20:00', status: 'Success' },
  { id: 'al_5', action: 'API_KEY_REVOKE', userId: 'u1', userEmail: 'admin@openpanel.dev', targetResource: 'key_ci_cd_v1', ipAddress: '192.168.1.5', timestamp: '2023-10-24 09:15:33', status: 'Success' },
];

export const CPU_DATA: MetricPoint[] = [
  { time: '10:00', value: 20 },
  { time: '10:10', value: 35 },
  { time: '10:20', value: 25 },
  { time: '10:30', value: 45 },
  { time: '10:40', value: 30 },
  { time: '10:50', value: 55 },
  { time: '11:00', value: 32 },
];

export const NETWORK_DATA: MetricPoint[] = [
  { time: '10:00', value: 100 },
  { time: '10:10', value: 450 },
  { time: '10:20', value: 300 },
  { time: '10:30', value: 800 },
  { time: '10:40', value: 500 },
  { time: '10:50', value: 650 },
  { time: '11:00', value: 400 },
];

export const INITIAL_LOGS: LogEntry[] = [
    { id: '1', timestamp: '2025-11-12T04:14:46.587445', level: 'INFO', message: 'Parameters: {"status"=>"open", "assignee_type"=>"me", "page"=>"1", "sort_by"=>"last_activity_at_desc", "account_id"=>"128"}' },
    { id: '2', timestamp: '2025-11-12T04:14:46.627705', level: 'INFO', message: 'Processing by Api::V1::Accounts::DashboardAppsController#index as JSON' },
    { id: '3', timestamp: '2025-11-12T04:14:46.628510', level: 'INFO', message: 'Parameters: {"account_id"=>"128"}' },
    { id: '4', timestamp: '2025-11-12T04:14:46.679467', level: 'INFO', message: 'Rendered api/v1/accounts/dashboard_apps/index.json.jbuilder (Duration: 22.3ms | Allocations: 3628)' },
    { id: '5', timestamp: '2025-11-12T04:14:46.686731', level: 'INFO', message: 'Completed 200 OK in 56ms (Views: 15.7ms | ActiveRecord: 22.2ms | Allocations: 8438)' },
    { id: '6', timestamp: '2025-11-12T04:14:46.688026', level: 'INFO', message: 'source=rack-timeout id=52f9abc3-6ce7-406f-b18e-5e8c206d1c6a timeout=15000ms service=108ms state=completed' },
    { id: '7', timestamp: '2025-11-12T04:14:46.692417', level: 'INFO', message: 'Rendered api/v1/accounts/conversations/index.json.jbuilder (Duration: 1.7ms | Allocations: 485)' },
    { id: '8', timestamp: '2025-11-12T04:14:46.695439', level: 'INFO', message: 'Completed 200 OK in 107ms (Views: 10.1ms | ActiveRecord: 24.8ms | Allocations: 12242)' }
];
