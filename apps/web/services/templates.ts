/**
 * Templates API Service
 * Provides methods to interact with application templates
 */

// Helper to get API base URL
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return '';
  }
  
  return envUrl || '';
};

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('openpanel_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Types
export interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'framework' | 'cms' | 'database' | 'static' | 'language';
  language: string;
  buildpack: 'dockerfile' | 'nixpacks' | 'paketo' | 'heroku';
  icon?: string;
  tags?: string[];
  minCpu?: string;
  minMemory?: string;
  ports: Array<{ container: number; protocol: 'HTTP' | 'HTTPS' | 'TCP' }>;
  dependencies?: string[];
}

export interface TemplateDeployOptions {
  projectName: string;
  gitUrl?: string;
  gitBranch?: string;
  customEnv?: Record<string, string>;
  customPort?: number;
  cpuLimit?: string;
  memoryLimit?: string;
  teamId?: string;
}

export interface TemplateDeployResult {
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
    type: string;
  };
  template: {
    id: string;
    name: string;
    buildpack: string;
  };
  port: number;
  nextSteps: {
    message: string;
    buildUrl: string;
  };
}

// Handle response
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    localStorage.removeItem('openpanel_access_token');
    localStorage.removeItem('openpanel_refresh_token');
    localStorage.removeItem('openpanel_session');
    localStorage.removeItem('openpanel_user');
    window.location.href = '/';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || error.error || `Request failed with status ${response.status}`);
  }
  return response.json();
};

/**
 * List all available templates
 */
export const listTemplates = async (options?: {
  category?: string;
  language?: string;
  search?: string;
}): Promise<{ templates: ApplicationTemplate[]; total: number }> => {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.language) params.append('language', options.language);
  if (options?.search) params.append('search', options.search);

  const url = `${getApiBaseUrl()}/api/templates${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse<{ templates: ApplicationTemplate[]; total: number }>(response);
};

/**
 * Get template by ID
 */
export const getTemplate = async (id: string): Promise<{ template: ApplicationTemplate }> => {
  const response = await fetch(`${getApiBaseUrl()}/api/templates/${id}`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse<{ template: ApplicationTemplate }>(response);
};

/**
 * Deploy a project from template
 */
export const deployTemplate = async (
  templateId: string,
  options: TemplateDeployOptions
): Promise<TemplateDeployResult> => {
  const response = await fetch(`${getApiBaseUrl()}/api/templates/${templateId}/deploy`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(options),
  });
  
  return handleResponse<TemplateDeployResult>(response);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (
  category: string
): Promise<{ templates: ApplicationTemplate[]; total: number; category: string }> => {
  const response = await fetch(`${getApiBaseUrl()}/api/templates/category/${category}`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse<{ templates: ApplicationTemplate[]; total: number; category: string }>(response);
};

/**
 * Get templates by language
 */
export const getTemplatesByLanguage = async (
  language: string
): Promise<{ templates: ApplicationTemplate[]; total: number; language: string }> => {
  const response = await fetch(`${getApiBaseUrl()}/api/templates/language/${language}`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse<{ templates: ApplicationTemplate[]; total: number; language: string }>(response);
};
