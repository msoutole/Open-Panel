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

// Helper to handle responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// --- Projects ---

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/projects`);
  const data = await handleResponse<{ projects: Project[] }>(response);
  return data.projects;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_URL}/projects/${id}`);
  const data = await handleResponse<{ project: Project }>(response);
  return data.project;
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ project: Project }>(response);
  return result.project;
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ project: Project }>(response);
  return result.project;
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};

// --- Services ---

export const createService = async (projectId: string, data: CreateServiceData): Promise<Service> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ service: Service }>(response);
  return result.service;
};

export const getService = async (projectId: string, serviceId: string): Promise<Service> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/services/${serviceId}`);
  const data = await handleResponse<{ service: Service }>(response);
  return data.service;
};

export const updateService = async (projectId: string, serviceId: string, data: Partial<Service>): Promise<Service> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/services/${serviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ service: Service }>(response);
  return result.service;
};

export const deleteService = async (projectId: string, serviceId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/services/${serviceId}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};

// --- Service/Container Control ---

export const restartService = async (serviceId: string, timeout: number = 10): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/restart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeout }),
  });
  await handleResponse(response);
};

export const startService = async (serviceId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/start`, {
    method: 'POST',
  });
  await handleResponse(response);
};

export const stopService = async (serviceId: string, timeout: number = 10): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeout }),
  });
  await handleResponse(response);
};

export const getServiceLogs = async (serviceId: string, tail: number = 100): Promise<string> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/logs?tail=${tail}`);
  const data = await handleResponse<{ logs: string }>(response);
  return data.logs;
};

export const getServiceStats = async (serviceId: string): Promise<any> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/stats`);
  const data = await handleResponse<{ stats: any }>(response);
  return data.stats;
};

// --- Environment Variables ---

export const getProjectEnvVars = async (projectId: string): Promise<EnvVar[]> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/env-vars`);
  const data = await handleResponse<{ envVars: EnvVar[] }>(response);
  return data.envVars;
};

export const createEnvVar = async (projectId: string, data: { key: string; value: string; isSecret?: boolean }): Promise<EnvVar> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/env-vars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ envVar: EnvVar }>(response);
  return result.envVar;
};

export const updateEnvVar = async (projectId: string, envVarId: string, data: { key?: string; value?: string; isSecret?: boolean }): Promise<EnvVar> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/env-vars/${envVarId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ envVar: EnvVar }>(response);
  return result.envVar;
};

export const deleteEnvVar = async (projectId: string, envVarId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/env-vars/${envVarId}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};

// --- Containers (Services) ---

export const getContainers = async (): Promise<Service[]> => {
  const response = await fetch(`${API_URL}/containers`);
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
  const response = await fetch(`${API_URL}/containers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ container: any }>(response);
  return result.container;
};

export const startContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${id}/start`, { method: 'POST' });
  await handleResponse(response);
};

export const stopContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${id}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeout: 10 })
  });
  await handleResponse(response);
};

export const restartContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${id}/restart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeout: 10 })
  });
  await handleResponse(response);
};

export const deleteContainer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${id}`, { method: 'DELETE' });
  await handleResponse(response);
};

export const getContainerLogs = async (id: string): Promise<string> => {
  const response = await fetch(`${API_URL}/containers/${id}/logs?tail=100`);
  const data = await handleResponse<{ logs: string }>(response);
  return data.logs;
};

// --- Domains ---

export const getProjectDomains = async (projectId: string): Promise<Domain[]> => {
  const response = await fetch(`${API_URL}/domains/project/${projectId}`);
  const data = await handleResponse<{ domains: Domain[] }>(response);
  return data.domains;
};

export const createDomain = async (data: { domain: string; projectId: string; https?: boolean; targetPort?: number; targetProtocol?: 'HTTP' | 'HTTPS' | 'TCP' }): Promise<Domain> => {
  const response = await fetch(`${API_URL}/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ domain: Domain }>(response);
  return result.domain;
};

export const updateDomain = async (id: string, data: Partial<Domain>): Promise<Domain> => {
  const response = await fetch(`${API_URL}/domains/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ domain: Domain }>(response);
  return result.domain;
};

export const deleteDomain = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/domains/${id}`, { method: 'DELETE' });
  await handleResponse(response);
};

// --- Redirects ---

export const createRedirect = async (serviceId: string, data: { from: string; to: string; type: 301 | 302 }): Promise<any> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/redirects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteRedirect = async (serviceId: string, redirectId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/redirects/${redirectId}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};

// --- Resources ---

export const updateServiceResources = async (
  serviceId: string,
  data: { cpuLimit?: number; cpuReservation?: number; memoryLimit?: number; memoryReservation?: number }
): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/resources`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await handleResponse(response);
};

// --- Backups (for database services) ---

export const listBackups = async (serviceId: string): Promise<any[]> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/backups`);
  const data = await handleResponse<{ backups: any[] }>(response);
  return data.backups;
};

export const createBackup = async (serviceId: string, name?: string): Promise<any> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/backups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const result = await handleResponse<{ backup: any }>(response);
  return result.backup;
};

export const restoreBackup = async (serviceId: string, backupId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/backups/${backupId}/restore`, {
    method: 'POST',
  });
  await handleResponse(response);
};

export const deleteBackup = async (serviceId: string, backupId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/containers/${serviceId}/backups/${backupId}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};
