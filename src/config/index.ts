import { validateEnv, type EnvConfig } from './env.schema';
import { initializeLogger } from './logger';
import { createSecurityConfig } from './security';
import { createDatabaseConfig } from './database';
import { createRateLimiterConfig } from './rateLimiter';

export interface AppConfig {
  env: EnvConfig;
  security: ReturnType<typeof createSecurityConfig>;
  database: ReturnType<typeof createDatabaseConfig>;
  rateLimiter: ReturnType<typeof createRateLimiterConfig>;
}

let config: AppConfig;

export function initializeConfig(): AppConfig {
  const env = validateEnv();

  // Initialize logger first
  initializeLogger(env);

  const security = createSecurityConfig(env);
  const database = createDatabaseConfig(env);
  const rateLimiter = createRateLimiterConfig(env);

  config = {
    env,
    security,
    database,
    rateLimiter,
  };

  return config;
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error('Config not initialized. Call initializeConfig first.');
  }
  return config;
}

export { type EnvConfig } from './env.schema';
