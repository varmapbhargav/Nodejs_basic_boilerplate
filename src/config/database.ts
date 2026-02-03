import type { EnvConfig } from './env.schema';

export interface DatabaseConfig {
  type: 'postgres' | 'mongodb';
  url: string;
  logging: boolean;
  synchronize: boolean;
  maxConnections: number;
  connectionTimeout: number;
  acquireTimeout: number;
  idleTimeout: number;
}

export function createDatabaseConfig(env: EnvConfig): DatabaseConfig {
  const isDevelopment = env.NODE_ENV === 'development';

  return {
    type: env.DATABASE_TYPE,
    url: env.DATABASE_URL,
    logging: isDevelopment,
    synchronize: isDevelopment,
    maxConnections: env.NODE_ENV === 'production' ? 50 : 10,
    connectionTimeout: 10000,
    acquireTimeout: 5000,
    idleTimeout: 30000,
  };
}
