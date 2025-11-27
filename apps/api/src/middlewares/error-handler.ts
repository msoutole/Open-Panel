import type { Context } from 'hono'
import { logError, logger } from '../lib/logger'

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  code: string
  message: string
  details?: any
  timestamp: string
  requestId?: string
}

/**
 * Error codes for better error categorization
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // External Services
  DOCKER_ERROR = 'DOCKER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Generic
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: Error | AppError,
  context?: Context
): ErrorResponse {
  const isAppError = error instanceof AppError
  const statusCode = isAppError ? error.statusCode : 500
  const code = isAppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR

  // Don't expose internal errors in production
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred'
      : error.message

  return {
    error: error.name,
    code,
    message,
    details: isAppError ? error.details : undefined,
    timestamp: new Date().toISOString(),
    requestId: context?.get('requestId'),
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(error: Error, c: Context) {
  const isAppError = error instanceof AppError
  const statusCode = isAppError ? error.statusCode : 500

  // Log error with context
  if (statusCode >= 500) {
    logError('Server error occurred', error, {
      url: c.req.url,
      method: c.req.method,
      userId: c.get('user')?.id,
      requestId: c.get('requestId'),
      userAgent: c.req.header('user-agent'),
    })
  } else if (statusCode >= 400) {
    logger.warn('Client error occurred', {
      message: error.message,
      code: isAppError ? error.code : ErrorCode.BAD_REQUEST,
      url: c.req.url,
      method: c.req.method,
      userId: c.get('user')?.id,
      requestId: c.get('requestId'),
    })
  }

  // Return standardized error response
  const response = createErrorResponse(error, c)
  return c.json(response, statusCode)
}

/**
 * Not found handler
 */
export function notFoundHandler(c: Context) {
  const error = new AppError(
    \`Route \${c.req.method} \${c.req.path} not found\`,
    404,
    ErrorCode.NOT_FOUND
  )

  return c.json(createErrorResponse(error, c), 404)
}

/**
 * Helper functions to throw common errors
 */
export const throwUnauthorized = (message = 'Unauthorized access') => {
  throw new AppError(message, 401, ErrorCode.UNAUTHORIZED)
}

export const throwForbidden = (message = 'Forbidden') => {
  throw new AppError(message, 403, ErrorCode.FORBIDDEN)
}

export const throwNotFound = (resource: string) => {
  throw new AppError(\`\${resource} not found\`, 404, ErrorCode.NOT_FOUND)
}

export const throwValidationError = (message: string, details?: any) => {
  throw new AppError(message, 400, ErrorCode.VALIDATION_ERROR, details)
}

export const throwConflict = (message: string) => {
  throw new AppError(message, 409, ErrorCode.CONFLICT)
}

export const throwBadRequest = (message: string) => {
  throw new AppError(message, 400, ErrorCode.BAD_REQUEST)
}

export const throwRateLimitExceeded = (message = 'Rate limit exceeded') => {
  throw new AppError(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED)
}
