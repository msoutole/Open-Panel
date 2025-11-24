import Redis from 'ioredis';
import { logInfo, logError } from './logger';
import { env, isProduction } from './env';

// Redis configuration with authentication support
const getRedisConfig = () => {
  // If REDIS_URL is provided, parse it into config object
  // We can't pass URL string directly because BullMQ requires maxRetriesPerRequest: null
  if (env.REDIS_URL) {
    // Parse redis://[:password@]host[:port] format
    const url = new URL(env.REDIS_URL);

    // In development, if hostname is 'redis' (Docker container name),
    // replace with 'localhost' since we're running outside Docker
    let host = url.hostname;
    if (host === 'redis' && !isProduction) {
      host = 'localhost';
    }

    return {
      host,
      port: parseInt(url.port || '6379'),
      password: url.password || undefined,
      maxRetriesPerRequest: null, // Required for BullMQ
    };
  }

  // Otherwise, use individual env vars as config object
  return {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
  };
};

// Create Redis connection for BullMQ
export const redis = new Redis(getRedisConfig());

// Create a separate connection for pub/sub (recommended by BullMQ)
export const subscriber = new Redis(getRedisConfig());

redis.on('connect', () => {
  logInfo('Redis connected');
});

redis.on('error', (error) => {
  logError('Redis connection error', error);
});
