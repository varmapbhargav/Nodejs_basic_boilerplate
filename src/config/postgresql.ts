import { Pool } from 'pg';
import { logger } from './logger';
import type { EnvConfig } from './env.schema';

let pool: Pool | null = null;

export async function initializePostgreSQL(config: EnvConfig): Promise<void> {
  try {
    if (config.DATABASE_TYPE !== 'postgres') {
      logger.info('PostgreSQL skipped - using MongoDB');
      return;
    }

    if (pool) {
      logger.info('PostgreSQL pool already initialized');
      return;
    }

    logger.info('Connecting to PostgreSQL...');

    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✓ PostgreSQL initialization completed');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize PostgreSQL');
    throw error;
  }
}

export async function closePostgreSQL(): Promise<void> {
  try {
    if (!pool) {
      return;
    }

    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  } catch (error) {
    logger.error({ error }, 'Error closing PostgreSQL pool');
    throw error;
  }
}

export function getPostgresPool(): Pool {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pool;
}

export function isPostgresConnected(): boolean {
  return pool !== null;
}
