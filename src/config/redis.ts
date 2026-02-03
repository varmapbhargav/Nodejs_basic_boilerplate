import { createClient } from 'redis';
import { logger } from './logger';
import type { EnvConfig } from './env.schema';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis(config: EnvConfig) {
  try {
    redisClient = createClient({
      url: config.REDIS_URL,
      password: config.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max Redis retries exceeded');
          return retries * 50;
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    logger.info('✓ Redis connection verified');

    return redisClient;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Redis');
    process.exit(1);
  }
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis first.');
  }
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}
