import { secureHeaders } from 'hono/secure-headers'
import { isDevelopment } from '../lib/env'

/**
 * Security headers middleware
 * 
 * Configures security headers for all responses to protect against common attacks:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - Referrer information leakage
 * 
 * In development, CSP is more permissive to allow hot reload and debugging.
 */
export const securityHeaders = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI libraries
    scriptSrc: isDevelopment
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] // More permissive in dev
      : ["'self'"], // Strict in production
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'ws:', 'wss:'], // Allow WebSocket connections
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
})

