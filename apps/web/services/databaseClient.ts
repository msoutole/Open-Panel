/**
 * Database Client API Service
 * Provides methods to interact with database containers
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

// Types
export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'mariadb';

export type QueryRow = Record<string, unknown>;

export interface ExecuteQueryResult {
  success: boolean;
  data: QueryRow[] | unknown; // Allow unknown for Redis/Mongo results that might not be rows
  executionTime?: number;
  rowsAffected?: number;
  error?: string;
  details?: string;
}

export interface ExecuteQueryOptions {
  containerId: string;
  type: DatabaseType;
  query: string;
  connection?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
}

export interface DatabaseConnectionInfo {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
}

/**
 * Execute a query against a database container
 */
export const executeQuery = async (options: ExecuteQueryOptions): Promise<ExecuteQueryResult> => {
  const { containerId, ...body } = options;
  const response = await fetch(`${getApiBaseUrl()}/api/databases/${containerId}/query`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  
  return handleResponse<ExecuteQueryResult>(response);
};

/**
 * Get connection details for a database container
 */
export const getConnectionInfo = async (containerId: string, type: DatabaseType): Promise<DatabaseConnectionInfo> => {
  const response = await fetch(`${getApiBaseUrl()}/api/databases/${containerId}/connection?type=${type}`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse<DatabaseConnectionInfo>(response);
};
