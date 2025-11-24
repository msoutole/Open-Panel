import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verifyToken, JWTPayload } from '../lib/jwt'

export interface AuthContext {
  user: JWTPayload
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    throw new HTTPException(401, { message: 'Authorization header is required' })
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    throw new HTTPException(401, { message: 'Invalid authorization format' })
  }

  try {
    const payload = verifyToken(token)
    c.set('user', payload)
    await next()
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
}
