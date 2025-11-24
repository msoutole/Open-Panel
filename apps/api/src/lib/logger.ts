import winston from 'winston'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Tell winston about our colors
winston.addColors(colors)

// Determine the log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'info'
}

// Define format for development (pretty, colorized)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${
      info.requestId ? ` [requestId: ${info.requestId}]` : ''
    }${
      info.userId ? ` [userId: ${info.userId}]` : ''
    }${
      Object.keys(info).filter(key => !['timestamp', 'level', 'message', 'requestId', 'userId'].includes(key)).length > 0
        ? ` ${JSON.stringify(Object.fromEntries(Object.entries(info).filter(([key]) => !['timestamp', 'level', 'message', 'requestId', 'userId', 'splat', Symbol.for('level')].includes(key))))}`
        : ''
    }`
  )
)

// Define format for production (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Define which transports to use
const transports = [
  // Console transport
  new winston.transports.Console(),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
]

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
})

// Create a stream object for HTTP logging middleware
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

// Helper functions for common logging patterns
export const logError = (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...meta,
    })
  } else {
    logger.error(message, { error, ...meta })
  }
}

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta)
}

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta)
}

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta)
}

export const logHttp = (message: string, meta?: Record<string, any>) => {
  logger.http(message, meta)
}

// Export default
export default logger
