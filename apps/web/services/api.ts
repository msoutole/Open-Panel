import { Project, Service, EnvVar, Domain, Deployment, CreateServiceData } from '../types';

// Use environment variable with fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
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

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/api/projects`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ projects: Project[] }>(response);
  return data.projects;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_URL}/api/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ project: Project }>(response);
  return data.project;
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ project: Project }>(response);
  return result.project;
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ project: Project }>(response);
  return result.project;
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Services ---

export const createService = async (projectId: string, data: CreateServiceData): Promise<Service> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/services`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ service: Service }>(response);
  return result.service;
};

export const getService = async (projectId: string, serviceId: string): Promise<Service> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/services/${serviceId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ service: Service }>(response);
  return data.service;
};

export const updateService = async (projectId: string, serviceId: string, data: Partial<Service>): Promise<Service> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/services/${serviceId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ service: Service }>(response);
  return result.service;
};

export const deleteService = async (projectId: string, serviceId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/services/${serviceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Service/Container Control ---

export const restartService = async (serviceId: string, timeout: number = 10): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/restart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout }),
  });
  await handleResponse(response);
};

export const startService = async (serviceId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const stopService = async (serviceId: string, timeout: number = 10): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout }),
  });
  await handleResponse(response);
};

export const getServiceLogs = async (serviceId: string, tail: number = 100): Promise<string> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/logs?tail=${tail}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ logs: string }>(response);
  return data.logs;
};

export const getServiceStats = async (serviceId: string): Promise<any> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/stats`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ stats: any }>(response);
  return data.stats;
};

// --- Environment Variables ---

export const getProjectEnvVars = async (projectId: string): Promise<EnvVar[]> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/env-vars`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ envVars: EnvVar[] }>(response);
  return data.envVars;
};

export const createEnvVar = async (projectId: string, data: { key: string; value: string; isSecret?: boolean }): Promise<EnvVar> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/env-vars`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ envVar: EnvVar }>(response);
  return result.envVar;
};

export const updateEnvVar = async (projectId: string, envVarId: string, data: { key?: string; value?: string; isSecret?: boolean }): Promise<EnvVar> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/env-vars/${envVarId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ envVar: EnvVar }>(response);
  return result.envVar;
};

export const deleteEnvVar = async (projectId: string, envVarId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/env-vars/${envVarId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Containers (Services) ---

export const getContainers = async (): Promise<Service[]> => {
  const response = await fetch(`${API_URL}/api/containers`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ containers: any[] }>(response);
  // Map backend container to frontend Service type if needed
  return data.containers.map(c => ({
    ...c,
    type: c.image.includes('postgres') || c.image.includes('mysql') ? 'db' :
      c.image.includes('redis') ? 'redis' : 'app', // Simple heuristic
    status: mapContainerStatus(c.status) // Properly map all status types
  }));
};

export const createContainer = async (data: any): Promise<Service> => {
  const response = await fetch(`${API_URL}/api/containers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ container: any }>(response);
  return result.container;
};

export const startContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${id}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const stopContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${id}/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout: 10 })
  });
  await handleResponse(response);
};

export const restartContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${id}/restart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ timeout: 10 })
  });
  await handleResponse(response);
};

export const deleteContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const getContainerLogs = async (id: string): Promise<string> => {
  const response = await fetch(`${API_URL}/api/containers/${id}/logs?tail=100`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ logs: string }>(response);
  return data.logs;
};

// --- Domains ---

export const getProjectDomains = async (projectId: string): Promise<Domain[]> => {
  const response = await fetch(`${API_URL}/api/domains/project/${projectId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ domains: Domain[] }>(response);
  return data.domains;
};

export const createDomain = async (data: { domain: string; projectId: string; https?: boolean; targetPort?: number; targetProtocol?: 'HTTP' | 'HTTPS' | 'TCP' }): Promise<Domain> => {
  const response = await fetch(`${API_URL}/api/domains`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ domain: Domain }>(response);
  return result.domain;
};

export const updateDomain = async (id: string, data: Partial<Domain>): Promise<Domain> => {
  const response = await fetch(`${API_URL}/api/domains/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ domain: Domain }>(response);
  return result.domain;
};

export const deleteDomain = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/domains/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

// --- Redirects ---

export const createRedirect = async (serviceId: string, data: { from: string; to: string; type: 301 | 302 }): Promise<any> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/redirects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteRedirect = async (serviceId: string, redirectId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/redirects/${redirectId}`, {
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
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/resources`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  await handleResponse(response);
};

// --- Backups (for database services) ---

export const listBackups = async (serviceId: string): Promise<any[]> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/backups`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ backups: any[] }>(response);
  return data.backups;
};

export const createBackup = async (serviceId: string, name?: string): Promise<any> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/backups`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  const result = await handleResponse<{ backup: any }>(response);
  return result.backup;
};

export const restoreBackup = async (serviceId: string, backupId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/backups/${backupId}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};

export const deleteBackup = async (serviceId: string, backupId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/containers/${serviceId}/backups/${backupId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
};
