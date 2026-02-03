import { logger } from './logger';
import { getRedisClient } from './redis';
import { getMongoConnection, isMongoConnected } from './mongodb';
import { getPostgresPool, isPostgresConnected } from './postgresql';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    redis: ServiceHealth;
    database: ServiceHealth;
    memory: MemoryHealth;
  };
  version: string;
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

interface MemoryHealth {
  status: 'healthy' | 'unhealthy';
  heapUsed: number;
  heapTotal: number;
  percentageUsed: number;
}

export async function performHealthCheck(): Promise<HealthStatus> {
  const memoryUsage = process.memoryUsage();

  const services = {
    redis: await checkRedisHealth(),
    database: await checkDatabaseHealth(),
    memory: checkMemoryHealth(memoryUsage),
  };

  const isHealthy = Object.values(services).every(service => service.status === 'healthy');
  const isDegraded = Object.values(services).some(service => service.status === 'unhealthy');

  return {
    status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services,
    version: process.env.APP_VERSION || '1.0.0',
  };
}

async function checkRedisHealth(): Promise<ServiceHealth> {
  try {
    const redis = getRedisClient();
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return { status: 'unhealthy', error: (error as Error).message };
  }
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  try {
    const start = Date.now();
    
    if (isMongoConnected()) {
      const mongo = getMongoConnection();
      if (mongo.db) {
        await mongo.db.admin().ping();
      }
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } else if (isPostgresConnected()) {
      const pool = getPostgresPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } else {
      return { status: 'unhealthy', error: 'No database connection' };
    }
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    return { status: 'unhealthy', error: (error as Error).message };
  }
}

function checkMemoryHealth(memoryUsage: NodeJS.MemoryUsage): MemoryHealth {
  const percentageUsed = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  const isHealthy = percentageUsed < 90;

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    heapUsed: memoryUsage.heapUsed,
    heapTotal: memoryUsage.heapTotal,
    percentageUsed,
  };
}
