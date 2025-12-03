/**
 * Two-Factor Authentication API Service
 * Provides methods to manage 2FA settings
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
export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  tempSecret: string;
}

export interface TwoFactorEnableResponse {
  message: string;
  backupCodes: string[];
}

export interface TwoFactorDisableResponse {
  message: string;
}

export interface BackupCodesResponse {
  message: string;
  backupCodes: string[];
}

/**
 * Initialize 2FA setup - generates secret and QR code
 */
export const setup2FA = async (): Promise<TwoFactorSetupResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/setup`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  return handleResponse<TwoFactorSetupResponse>(response);
};

/**
 * Enable 2FA after verifying TOTP code
 */
export const enable2FA = async (code: string, secret: string): Promise<TwoFactorEnableResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/enable`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, secret }),
  });
  
  return handleResponse<TwoFactorEnableResponse>(response);
};

/**
 * Disable 2FA (requires password verification)
 */
export const disable2FA = async (password: string): Promise<TwoFactorDisableResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/disable`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  });
  
  return handleResponse<TwoFactorDisableResponse>(response);
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (): Promise<BackupCodesResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/2fa/backup-codes`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  return handleResponse<BackupCodesResponse>(response);
};
