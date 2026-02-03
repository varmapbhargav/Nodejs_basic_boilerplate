import type { EnvConfig } from './env.schema';

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  bypassSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (_req: any) => string;
}

export function createRateLimiterConfig(env: EnvConfig): RateLimiterConfig {
  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    bypassSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip || 'unknown';
    },
  };
}

// Specialized configs for different endpoints
export const rateLimitConfigs = {
  // Strict limit for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
  // Standard limit for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },
  // Relaxed limit for public endpoints
  public: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000, // 1000 requests per hour
  },
};
