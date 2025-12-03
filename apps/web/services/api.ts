import { Project, Service, EnvVar, Domain, Deployment, CreateServiceData, User, ContainerMetrics, Backup } from '../types';
import { cache } from '../utils/cache';
import { retry } from '../utils/retry';

// Helper to get API base URL
// In development, use relative paths to leverage Vite proxy
// In production, use absolute URL if VITE_API_URL is set, otherwise use relative paths
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isDev = import.meta.env.DEV;
  
  // In development, always use relative paths to leverage Vite proxy
  if (isDev) {
    return '';
  }
  
  // In production, use absolute URL if provided, otherwise use relative paths
  return envUrl || '';
};

// Helper to map container status from backend to frontend
const mapContainerStatus = (backendStatus: string): 'Running' | 'Stopped' | 'Building' | 'Error' | 'Backing Up' => {
  const statusMap: Record<string, 'Running' | 'Stopped' | 'Building' | 'Error' | 'Backing Up'> = {
    'RUNNING': 'Running',
    'running': 'Running',
    'CREATED': 'Stopped',
    'created': 'Stopped',
    'RESTARTING': 'Building',
    'restarting': 'Building',
    'REMOVING': 'Stopped',
    'removing': 'Stopped',
    'EXITED': 'Stopped',
    'exited': 'Stopped',
    'DEAD': 'Error',
    'dead': 'Error',
    'PAUSED': 'Stopped',
    'paused': 'Stopped',
  };

  return statusMap[backendStatus] || 'Stopped';
};

// Helper to get auth headers with JWT token
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('openpanel_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Helper to refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('openpanel_refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem('openpanel_access_token', data.accessToken);
    localStorage.setItem('openpanel_refresh_token', data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

// Helper to handle responses with auth
const handleResponse = async <T>(response: Response): Promise<T> => {
  // If 401, try to refresh token
  if (response.status === 401) {
    // Clear session and redirect to login
    localStorage.removeItem('openpanel_access_token');
    localStorage.removeItem('openpanel_refresh_token');
    localStorage.removeItem('openpanel_session');
    localStorage.removeItem('openpanel_user');
    window.location.href = '/';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// --- Projects ---

export const getProjects = async (forceRefresh = false): Promise<Project[]> => {
  const cacheKey = 'projects';
  
  // Check cache first
  if (!forceRefresh) {
    const cached = cache.get<Project[]>(cacheKey);
    if (cached) return cached;
  }

  return retry(async () => {
    const response = await fetch(`${getApiBaseUrl()}/api/projects`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ projects: Project[] }>(response);
    
    // Normalizar projetos para garantir que sempre tenham services como array
    const projects = data.projects.map(project => ({
      ...project,
      services: project.services || [],
      members: project.members || [],
      envVars: project.envVars || [],
    }));
    
    // Cache for 30 seconds
    cache.set(cacheKey, projects, 30000);
    
    return projects;
  });
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ project: Project }>(response);
  // Normalizar projeto para garantir que sempre tenha services como array
  return {
    ...data.project,
    services: data.project.services || [],
    members: data.project.members || [],
    envVars: data.project.envVars || [],
  };
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ project: Project }>(response);
  // Normalizar projeto para garantir que sempre tenha services como array
  return {
    ...result.project,
    services: result.project.services || [],
    members: result.project.members || [],
    envVars: result.project.envVars || [],
  };
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ project: Project }>(response);
  // Normalizar projeto para garantir que sempre tenha services como array
  return {
    ...result.project,
    services: result.project.services || [],
    members: result.project.members || [],
    envVars: result.project.envVars || [],
  };
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Services ---

export const createService = async (projectId: string, data: CreateServiceData): Promise<Service> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/services`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ service: Service }>(response);
  return result.service;
};

export const getService = async (projectId: string, serviceId: string): Promise<Service> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/services/${serviceId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ service: Service }>(response);
  return data.service;
};

export const updateService = async (projectId: string, serviceId: string, data: Partial<Service>): Promise<Service> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/services/${serviceId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ service: Service }>(response);
  return result.service;
};

export const deleteService = async (projectId: string, serviceId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/services/${serviceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Service/Container Control ---

export const restartService = async (serviceId: string, timeout: number = 10): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/restart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout }),
  });
  await handleResponse(response);
};

export const startService = async (serviceId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const stopService = async (serviceId: string, timeout: number = 10): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout }),
  });
  await handleResponse(response);
};

export const getServiceLogs = async (serviceId: string, tail: number = 100): Promise<string> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/logs?tail=${tail}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ logs: string }>(response);
  return data.logs;
};

export const getServiceStats = async (serviceId: string): Promise<ContainerMetrics> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/stats`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ stats: ContainerMetrics }>(response);
  return data.stats;
};

// --- Environment Variables ---

export const getProjectEnvVars = async (projectId: string): Promise<EnvVar[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/env-vars`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ envVars: EnvVar[] }>(response);
  return data.envVars;
};

export const createEnvVar = async (projectId: string, data: { key: string; value: string; isSecret?: boolean }): Promise<EnvVar> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/env-vars`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ envVar: EnvVar }>(response);
  return result.envVar;
};

export const updateEnvVar = async (projectId: string, envVarId: string, data: { key?: string; value?: string; isSecret?: boolean }): Promise<EnvVar> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/env-vars/${envVarId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ envVar: EnvVar }>(response);
  return result.envVar;
};

export const deleteEnvVar = async (projectId: string, envVarId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/${projectId}/env-vars/${envVarId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Containers (Services) ---

export const getContainers = async (): Promise<Service[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ containers: Service[] }>(response);
  // Map backend container to frontend Service type if needed
  return data.containers.map(c => ({
    ...c,
    type: c.image.includes('postgres') || c.image.includes('mysql') ? 'db' :
      c.image.includes('redis') ? 'redis' : 'app', // Simple heuristic
    status: mapContainerStatus(c.status) // Properly map all status types
  }));
};

export const createContainer = async (data: CreateServiceData): Promise<Service> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ container: Service }>(response);
  return result.container;
};

export const startContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${id}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const stopContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${id}/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout: 10 })
  });
  await handleResponse(response);
};

export const restartContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${id}/restart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout: 10 })
  });
  await handleResponse(response);
};

export const deleteContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const getContainerLogs = async (id: string): Promise<string> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${id}/logs?tail=100`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ logs: string }>(response);
  return data.logs;
};

// --- Domains ---

export const getProjectDomains = async (projectId: string): Promise<Domain[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/domains/project/${projectId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ domains: Domain[] }>(response);
  return data.domains;
};

export const createDomain = async (data: { domain: string; projectId: string; https?: boolean; targetPort?: number; targetProtocol?: 'HTTP' | 'HTTPS' | 'TCP' }): Promise<Domain> => {
  const response = await fetch(`${getApiBaseUrl()}/api/domains`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ domain: Domain }>(response);
  return result.domain;
};

export const updateDomain = async (id: string, data: Partial<Domain>): Promise<Domain> => {
  const response = await fetch(`${getApiBaseUrl()}/api/domains/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ domain: Domain }>(response);
  return result.domain;
};

export const deleteDomain = async (id: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/domains/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Redirects ---

export const createRedirect = async (serviceId: string, data: { from: string; to: string; type: 301 | 302 }): Promise<any> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/redirects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteRedirect = async (serviceId: string, redirectId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/redirects/${redirectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Resources ---

export const updateServiceResources = async (
  serviceId: string,
  data: { cpuLimit?: number; cpuReservation?: number; memoryLimit?: number; memoryReservation?: number }
): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/resources`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  await handleResponse(response);
};

// --- Backups (for database services) ---

export const listBackups = async (serviceId: string): Promise<Backup[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/backups`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ backups: Backup[] }>(response);
  return data.backups;
};

export const createBackup = async (serviceId: string, name?: string): Promise<Backup> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/backups`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  const result = await handleResponse<{ backup: Backup }>(response);
  return result.backup;
};

export const restoreBackup = async (serviceId: string, backupId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/backups/${backupId}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const deleteBackup = async (serviceId: string, backupId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/containers/${serviceId}/backups/${backupId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Metrics ---

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    rx: number;
    tx: number;
    rxRate: number;
    txRate: number;
  };
  timestamp: string;
}

export interface ContainerMetrics {
  id: string;
  dockerId: string;
  name: string;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    limit: number;
    usage: number;
  };
  network: {
    rx: number;
    tx: number;
    rxRate: number;
    txRate: number;
  };
  blockIO: {
    read: number;
    write: number;
  };
  timestamp: string;
}

export const getSystemMetrics = async (forceRefresh = false): Promise<SystemMetrics> => {
  const cacheKey = 'system_metrics';
  
  // Check cache first (very short TTL for metrics)
  if (!forceRefresh) {
    const cached = cache.get<SystemMetrics>(cacheKey);
    if (cached) return cached;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/metrics/system`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ metrics: SystemMetrics }>(response);
  
  // Cache for 5 seconds only (metrics change frequently)
  cache.set(cacheKey, data.metrics, 5000);
  
  return data.metrics;
};

export const getContainerMetrics = async (containerId: string): Promise<ContainerMetrics> => {
  const response = await fetch(`${getApiBaseUrl()}/api/metrics/containers/${containerId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ metrics: ContainerMetrics }>(response);
  return data.metrics;
};

export const getAllContainersMetrics = async (): Promise<ContainerMetrics[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/metrics/containers`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ metrics: ContainerMetrics[] }>(response);
  return data.metrics;
};

// --- Audit Logs ---

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  userName: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  status: 'Success' | 'Failure';
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  status?: 'SUCCESS' | 'FAILURE';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAuditLogs = async (filters?: AuditLogFilters): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.resourceType) params.append('resourceType', filters.resourceType);
  if (filters?.resourceId) params.append('resourceId', filters.resourceId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${getApiBaseUrl()}/api/audit?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return await handleResponse<AuditLogsResponse>(response);
};

export const getAuditLog = async (id: string): Promise<AuditLog> => {
  const response = await fetch(`${getApiBaseUrl()}/api/audit/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ log: AuditLog }>(response);
  return data.log;
};

export interface AuditLogStats {
  total: number;
  recent24h: number;
  failed: number;
  successful: number;
  byAction: Array<{ action: string; count: number }>;
  byResourceType: Array<{ resourceType: string; count: number }>;
}

export const getAuditLogStats = async (): Promise<AuditLogStats> => {
  const response = await fetch(`${getApiBaseUrl()}/api/audit/stats`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ stats: AuditLogStats }>(response);
  return data.stats;
};

// --- Statistics ---

export interface DashboardStats {
  system: {
    cpu: {
      usage: number;
      cores: number;
    };
    memory: {
      usage: number;
      total: number;
      used: number;
    };
    disk: {
      usage: number;
      total: number;
      used: number;
    };
    network: {
      rx: number;
      tx: number;
      rxRate: number;
      txRate: number;
    };
  };
  projects: {
    total: number;
    active: number;
    paused: number;
  };
  containers: {
    total: number;
    running: number;
    stopped: number;
  };
  users: {
    total: number;
  };
  activity: {
    deployments24h: number;
    auditLogs24h: number;
  };
  timestamp: string;
}

export const getDashboardStats = async (forceRefresh = false): Promise<DashboardStats> => {
  const cacheKey = 'dashboard_stats';
  
  // Check cache first
  if (!forceRefresh) {
    const cached = cache.get<DashboardStats>(cacheKey);
    if (cached) return cached;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/stats/dashboard`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ stats: DashboardStats }>(response);
  
  // Cache for 10 seconds
  cache.set(cacheKey, data.stats, 10000);
  
  return data.stats;
};

export interface ProjectStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
}

export const getProjectStats = async (): Promise<ProjectStats> => {
  const response = await fetch(`${getApiBaseUrl()}/api/stats/projects`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ stats: ProjectStats }>(response);
  return data.stats;
};

export interface ContainerStats {
  total: number;
  running: number;
  stopped: number;
  byStatus: Array<{ status: string; count: number }>;
  averages: {
    cpu: number;
    memory: number;
  };
}

export const getContainerStats = async (): Promise<ContainerStats> => {
  const response = await fetch(`${getApiBaseUrl()}/api/stats/containers`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ stats: ContainerStats }>(response);
  return data.stats;
};

// --- Users ---

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/users`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ users: User[] }>(response);
  return data.users;
};

export const getUser = async (userId: string): Promise<User> => {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ user: User }>(response);
  return data.user;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ user: User }>(response);
  return result.user;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};