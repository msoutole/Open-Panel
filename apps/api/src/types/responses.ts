/**
 * Shared response types for API endpoints
 * These types ensure type safety across the application
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Authentication response types
 */
export interface AuthResponse {
  success: boolean
  token: string
  refreshToken?: string
  user: {
    id: string
    email: string
    name: string
    role?: string
  }
  error?: string
}

export interface RegisterResponse extends AuthResponse {
  success: true
}

export interface LoginResponse extends AuthResponse {
  success: true
}

export interface RefreshTokenResponse {
  success: boolean
  token: string
  error?: string
}

/**
 * User response types
 */
export interface UserResponse {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

/**
 * Project response types
 */
export interface ProjectResponse {
  id: string
  name: string
  slug: string
  type: string
  status: string
  ownerId: string
  teamId?: string
  gitUrl?: string
  gitBranch?: string
  createdAt: string
  updatedAt: string
}

/**
 * Deployment response types
 */
export interface DeploymentResponse {
  id: string
  projectId: string
  version: string
  status: string
  imageTag?: string
  dockerImage?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Container response types
 */
export interface ContainerResponse {
  id: string
  name: string
  image: string
  status: string
  projectId: string
  dockerId?: string
  ports?: Array<{ host: number; container: number; protocol: string }>
  createdAt: string
  updatedAt: string
}

/**
 * Error response type
 */
export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
}

