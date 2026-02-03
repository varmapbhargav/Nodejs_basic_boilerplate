import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@config/redis';
import { logger } from '@config/logger';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latency: number;
    };
    redis: {
      status: 'healthy' | 'unhealthy';
      latency: number;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      heapUsed: number;
      heapTotal: number;
      percentageUsed: number;
    };
  };
  version: string;
}

export class HealthService {
  static async getLiveness(): Promise<
    Pick<HealthCheckResponse, 'status' | 'timestamp' | 'uptime' | 'version'>
  > {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
    };
  }

  static async getReadiness(): Promise<HealthCheckResponse> {
    const memoryUsage = process.memoryUsage();

    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: {
        status: this.checkMemory(memoryUsage),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        percentageUsed: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
    };

    const isHealthy =
      checks.database.status === 'healthy' &&
      checks.redis.status === 'healthy' &&
      checks.memory.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.APP_VERSION || '1.0.0',
    };
  }

  private static async checkDatabase(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
  }> {
    try {
      const start = Date.now();
      // TODO: Implement actual database health check
      // For now, we'll return a placeholder
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return { status: 'unhealthy', latency: -1 };
    }
  }

  private static async checkRedis(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
  }> {
    try {
      const redis = getRedisClient();
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error({ error }, 'Redis health check failed');
      return { status: 'unhealthy', latency: -1 };
    }
  }

  private static checkMemory(memoryUsage: NodeJS.MemoryUsage): 'healthy' | 'unhealthy' {
    const percentageUsed = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    // Alert if memory usage exceeds 90%
    return percentageUsed > 90 ? 'unhealthy' : 'healthy';
  }
}

export function livenessHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const health = HealthService.getLiveness();
  res.status(200).json(health);
}

export async function readinessHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const health = await HealthService.getReadiness();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}
