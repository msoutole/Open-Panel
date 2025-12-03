/**
 * Tipos customizados para Hono Context
 * Garante type safety em todos os handlers e middlewares
 */

import type { User as PrismaUser, UserRole } from '@prisma/client';

/**
 * User type simplificado para uso em contexto de autenticação
 * Evita expor dados sensíveis como password
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/**
 * Variables disponíveis no contexto Hono
 * Estas são injetadas por middlewares e disponíveis em handlers
 */
export interface Variables {
  user?: AuthUser;
  projectId?: string;
  teamId?: string;
  requestId?: string;
}

/**
 * JWT Payload customizado
 * Estende o JWTPayload padrão com campos específicos do OpenPanel
 */
export interface CustomJWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Resposta padrão de autenticação
 */
export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  };
  error?: string;
  message?: string;
}

/**
 * Resposta padrão de API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Tipo helper para extrair User do Prisma sem campos sensíveis
 */
export type SafeUser = Omit<PrismaUser, 'password'>;

/**
 * Type guards para validação de respostas em testes
 */

export function isErrorResponse(response: unknown): response is { error: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as { error: string }).error === 'string'
  );
}

export function isAuthResponse(response: unknown): response is AuthResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as AuthResponse).success === true &&
    'data' in response
  );
}

/**
 * Contexto tipado para handlers autenticados
 */
import type { Context } from 'hono';

export type AppContext = Context<{ Variables: Variables }>;
export type AuthenticatedHandler = (c: AppContext) => Promise<Response> | Response;
