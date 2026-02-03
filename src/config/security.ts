import type { EnvConfig } from './env.schema';

export interface SecurityConfig {
  bcryptRounds: number;
  sessionSecret: string;
  corsOrigin: string;
  trustedProxies: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
}

export function createSecurityConfig(env: EnvConfig): SecurityConfig {
  return {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
    corsOrigin: env.CORS_ORIGIN,
    trustedProxies: ['127.0.0.1', 'localhost'],
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtAccessExpiry: env.JWT_ACCESS_EXPIRY,
    jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY,
  };
}
