import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logError, logWarn } from '../lib/logger'

/**
 * Tipos de erros customizados
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, c: Context) => {
  const requestId = c.get('requestId')

  // Log error with context
  logError('Error handler caught exception', err, {
    requestId,
    errorName: err.name,
    path: c.req.path,
    method: c.req.method,
  })

  // Hono HTTP Exception
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        code: 'HTTP_EXCEPTION',
      },
      err.status
    )
  }

  // Custom App Errors
  if (err instanceof AppError) {
    const response: any = {
      error: err.message,
      code: err.code,
    }

    if (err instanceof ValidationError) {
      response.details = err.details
    }

    return c.json(response, err.statusCode as any)
  }

  // Zod Validation Errors
  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (err as any).errors.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      } as any,
      400
    )
  }

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field'
      return c.json(
        {
          error: `${field} already exists`,
          code: 'DUPLICATE_ENTRY',
        },
        409
      )
    }

    // Record not found
    if (err.code === 'P2025') {
      return c.json(
        {
          error: 'Record not found',
          code: 'NOT_FOUND',
        },
        404
      )
    }

    // Foreign key constraint
    if (err.code === 'P2003') {
      return c.json(
        {
          error: 'Related record not found',
          code: 'FOREIGN_KEY_CONSTRAINT',
        },
        400
      )
    }

    // Generic Prisma error
    return c.json(
      {
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: err.message }),
      },
      500
    )
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return c.json(
      {
        error: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
      },
      400
    )
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return c.json(
      {
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
      401
    )
  }

  if (err.name === 'TokenExpiredError') {
    return c.json(
      {
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
      401
    )
  }

  // Default 500 error
  return c.json(
    {
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    500
  )
}
