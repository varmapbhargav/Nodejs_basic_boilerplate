import { z } from 'zod';

// Validation schema for environment variables
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Server
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_TYPE: z.enum(['postgres', 'mongodb']).default('postgres'),

  // Redis
  REDIS_URL: z.string(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // OpenTelemetry
  OTEL_ENABLED: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),

  // Feature Flags
  FEATURE_FLAGS_ENABLED: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  SESSION_SECRET: z.string().min(32),

  // Application
  APP_NAME: z.string().default('Enterprise API'),
  APP_VERSION: z.string().default('1.0.0'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const env = process.env;

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}
