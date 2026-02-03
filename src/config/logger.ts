import pino from 'pino';
import type { EnvConfig } from './env.schema';

export let logger: pino.Logger;

export function initializeLogger(config: EnvConfig): pino.Logger {
  const isDevelopment = config.NODE_ENV === 'development';

  logger = pino({
    level: config.LOG_LEVEL,
    base: {
      env: config.NODE_ENV,
      app: config.APP_NAME,
      version: config.APP_VERSION,
    },
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  return logger;
}

export function getLogger() {
  return logger;
}
