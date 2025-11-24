
export type ServiceType = 'app' | 'db' | 'redis' | 'worker' | 'sidecar';
export type ServiceStatus = 'Running' | 'Stopped' | 'Building' | 'Error' | 'Backing Up';

export interface TraefikConfig {
  domain?: string;
  https: boolean;
  middlewares: {
    basicAuth: boolean;
    rateLimit: boolean;
    ipAllowList: string[];
    compress: boolean;
  };
  cloudflareTunnelId?: string;
}

export interface EnvVar {
  id?: string;
  key: string;
  value: string;
  locked?: boolean;
  isSecret?: boolean;
}

export interface Deployment {
  id: string;
  commit: string;
  message: string;
  status: 'Success' | 'Building' | 'Failed';
  timestamp: string;
  branch?: string;
  author?: string;
}

export interface Backup {
  id: string;
  size: string;
  timestamp: string;
  status: 'Available' | 'Creating' | 'Failed';
  filename: string;
}

export interface ServiceSource {
  type: 'git' | 'docker';
  image?: string;
  repo?: string;
  branch?: string;
  autoDeploy?: boolean;
  gitCredentialId?: string;
  dockerCredentialId?: string;
}

export interface RedirectRule {
  id: string;
  from: string;
  to: string;
  type: 301 | 302;
}

export interface Domain {
  id: string;
  domain: string;
  path?: string;
  https: boolean;
  main: boolean;
  targetPort?: number;
  targetProtocol?: 'HTTP' | 'HTTPS' | 'TCP';
}

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  image: string;
  status: ServiceStatus;
  cpu: number; // percentage
  memory: string;
  port: number;
  traefik?: TraefikConfig;
  deploymentToken?: string;
  command?: string;
  exposedPort?: number;

  // Enhanced Fields
  source?: ServiceSource;
  deployments?: Deployment[];
  backups?: Backup[];
  credentials?: {
    host: string;
    user: string;
    password?: string;
    port: number;
    connectionString?: string;
    databaseName?: string;
  };
  envVars?: EnvVar[];
  domains?: Domain[];
  redirects?: RedirectRule[];
  security?: {
    ipAllowList: string[];
  };
  resources?: {
    cpuLimit: number;
    memoryLimit: number;
    cpuReservation: number;
    memoryReservation: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Archived';
  services: Service[];
  envVars: EnvVar[];
  members: string[]; // User IDs
  lastDeploy: string;
}

export interface MetricPoint {
  time: string;
  value: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  targetResource: string;
  ipAddress: string;
  timestamp: string;
  status: 'Success' | 'Failure' | 'Warning';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  twoFactorEnabled: boolean;
  lastLogin: string;
}

export interface DockerBuilder {
  id: string;
  name: string;
  memoryLimitMB: number;
  swapLimitMB: number;
  cpuLimitCores: number;
  status: 'Ready' | 'Busy';
}

export interface GitToken {
  id: string;
  name: string;
  provider: 'github' | 'gitlab';
  username: string;
  tokenMasked: string;
  createdAt: string;
  status: 'active' | 'error' | 'expired';
}

export type ViewState = 'login' | 'dashboard' | 'project_details' | 'settings' | 'users' | 'backups' | 'security' | 'monitor';

// --- AI Agent & MCP Types ---

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'ollama';
export type AgentResponseStyle = 'friendly' | 'normal' | 'technical';

export interface AgentConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  mcpEnabled: boolean;
  mcpPort: number;
  responseStyle: AgentResponseStyle;
}


export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

// --- Service Creation Types ---

export type SourceType = 'docker' | 'git';
export type DatabaseType = 'postgres' | 'mysql' | 'mongodb' | 'redis';

export interface CreateServiceData {
  name: string;
  type: ServiceType;
  source?: {
    type: SourceType;
    image?: string;
    repository?: string;
    branch?: string;
    buildCommand?: string;
    startCommand?: string;
  };
  port?: number;
  exposedPort?: number;
  env?: Record<string, string>;
  database?: {
    type: DatabaseType;
    version: string;
    username: string;
    password: string;
    database: string;
  };
  resources?: {
    cpuLimit?: number;
    memoryLimit?: number;
    cpuReservation?: number;
    memoryReservation?: number;
  };
}

