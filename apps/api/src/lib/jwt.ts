import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from './env'

const JWT_SECRET = env.JWT_SECRET
const JWT_ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN
const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN

export interface JWTPayload {
  userId: string
  email: string
  role?: string
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  } as SignOptions)
}

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as SignOptions)
}

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}
