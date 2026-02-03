import { createApp } from './app';
import { logger } from '@config/logger';
import { initializeConfig } from '@config/index';
import { initializeRedis, closeRedis } from '@config/redis';
import { initializeMongoDB, closeMongoDB } from '@config/mongodb';
import { initializePostgreSQL, closePostgreSQL } from '@config/postgresql';
import { performHealthCheck } from '@config/healthCheck';
import { initializeTracing, shutdownTracing } from '@observability/tracing';
import { MetricsService } from '@observability/metrics';

interface ServerInfo {
  port: number;
  host: string;
  env: string;
  version: string;
  startTime: Date;
}

let server: any;
let serverInfo: ServerInfo;

// Enhanced graceful shutdown with comprehensive cleanup
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);
  
  // Record shutdown metrics
  MetricsService.incrementCounter('shutdown_initiated', { signal });

  if (server) {
    // Stop accepting new requests
    server.close(async () => {
      logger.info('📡 HTTP server closed');

      try {
        // Close connections in dependency order
        const shutdownPromises = [
          closeRedis(),
          closeMongoDB(),
          closePostgreSQL(),
          shutdownTracing(),
        ];

        await Promise.allSettled(shutdownPromises);
        
        logger.info('✅ All services shut down gracefully');
        MetricsService.incrementCounter('shutdown_completed');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, '❌ Error during graceful shutdown');
        MetricsService.incrementCounter('shutdown_failed');
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('⏰ Forced shutdown after timeout');
      MetricsService.incrementCounter('shutdown_timeout');
      process.exit(1);
    }, 30000);
  }
};

// Enhanced error handling with metrics
const setupErrorHandlers = (): void => {
  // Handle signals for graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, '💥 Uncaught exception - application will terminate');
    MetricsService.incrementCounter('uncaught_exception');
    process.exit(1);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, '💥 Unhandled promise rejection');
    MetricsService.incrementCounter('unhandled_rejection');
    process.exit(1);
  });

  // Handle process warnings
  process.on('warning', (warning) => {
    logger.warn({ warning }, '⚠️ Process warning');
  });
};

// Health check endpoint for load balancers
const setupHealthChecks = (): void => {
  setInterval(async () => {
    try {
      const health = await performHealthCheck();
      
      if (health.status === 'unhealthy') {
        logger.warn({ health }, '🏥 Application health check failed');
        MetricsService.incrementCounter('health_check_failed');
      } else {
        MetricsService.setGauge('health_status', health.status === 'healthy' ? 1 : 0);
      }
    } catch (error) {
      logger.error({ error }, 'Health check error');
      MetricsService.incrementCounter('health_check_error');
    }
  }, 30000); // Check every 30 seconds
};

// Performance monitoring
const setupPerformanceMonitoring = (): void => {
  // Memory usage monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    MetricsService.setGauge('memory_heap_used', memUsage.heapUsed);
    MetricsService.setGauge('memory_heap_total', memUsage.heapTotal);
    MetricsService.setGauge('memory_external', memUsage.external);
    MetricsService.setGauge('memory_rss', memUsage.rss);
  }, 60000); // Every minute

  // Event loop lag monitoring
  setInterval(() => {
    const start = Date.now();
    setImmediate(() => {
      const lag = Date.now() - start;
      MetricsService.setHistogram('event_loop_lag', lag);
    });
  }, 5000); // Every 5 seconds
};

// Application startup with comprehensive initialization
async function start(): Promise<void> {
  const startupStartTime = Date.now();
  
  try {
    logger.info('🚀 Starting Enterprise Node.js Application...');
    
    // 1. Initialize configuration
    logger.info('⚙️ Initializing configuration...');
    const config = initializeConfig();
    logger.info({ config: config.env }, 'Configuration loaded successfully');

    // 2. Setup error handlers early
    setupErrorHandlers();
    logger.info('🛡️ Error handlers configured');

    // 3. Initialize OpenTelemetry tracing
    logger.info('📊 Initializing OpenTelemetry...');
    initializeTracing(config.env);

    // 4. Initialize database connections
    if (config.env.DATABASE_TYPE === 'mongodb') {
      logger.info('🍃 Connecting to MongoDB...');
      await initializeMongoDB(config.env);
    } else if (config.env.DATABASE_TYPE === 'postgres') {
      logger.info('🐘 Connecting to PostgreSQL...');
      await initializePostgreSQL(config.env);
    }

    // 5. Initialize Redis
    logger.info('🔴 Connecting to Redis...');
    await initializeRedis(config.env);

    // 6. Create Express application
    logger.info('🌐 Creating Express application...');
    const app = createApp();

    // 7. Setup monitoring
    setupHealthChecks();
    setupPerformanceMonitoring();
    logger.info('📈 Monitoring systems initialized');

    // 8. Start HTTP server
    const port = config.env.PORT;
    const host = config.env.HOST;

    serverInfo = {
      port,
      host,
      env: config.env.NODE_ENV,
      version: config.env.APP_VERSION,
      startTime: new Date(),
    };

    server = app.listen(port, host, () => {
      const startupTime = Date.now() - startupStartTime;
      
      logger.info(
        {
          ...serverInfo,
          startupTime: `${startupTime}ms`,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        `🎉 Server started successfully on ${host}:${port}`
      );

      // Record startup metrics
      MetricsService.incrementCounter('server_started');
      MetricsService.setHistogram('startup_time', startupTime);
      MetricsService.setGauge('server_uptime', 0);

      // Update uptime gauge periodically
      setInterval(() => {
        const uptime = process.uptime();
        MetricsService.setGauge('server_uptime', uptime);
      }, 10000);

      logger.info('✅ Application is ready to accept requests');
      
      // Perform initial health check
      performHealthCheck()
        .then(health => {
          if (health.status === 'healthy') {
            logger.info('🏥 Initial health check passed');
          } else {
            logger.warn({ health }, '🏥 Initial health check shows issues');
          }
        })
        .catch(error => {
          logger.error({ error }, '🏥 Initial health check failed');
        });
    });

    // Handle server-specific errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({ port }, `❌ Port ${port} is already in use`);
      } else if (error.code === 'EACCES') {
        logger.error({ port }, `❌ Permission denied for port ${port}`);
      } else {
        logger.error({ error }, '❌ Server error');
      }
      MetricsService.incrementCounter('server_error', { code: error.code });
      process.exit(1);
    });

    // Handle server listening events
    server.on('listening', () => {
      const addr = server.address();
      const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
      logger.info(`📡 Server listening on ${bind}`);
    });

  } catch (error) {
    const startupTime = Date.now() - startupStartTime;
    logger.fatal({ 
      error, 
      startupTime: `${startupTime}ms` 
    }, '💥 Failed to start server');
    
    MetricsService.incrementCounter('startup_failed');
    process.exit(1);
  }
}

// Handle process termination signals
process.on('exit', (code) => {
  logger.info(`Process exiting with code: ${code}`);
});

// Start the application
start().catch((error) => {
  logger.fatal({ error }, '💥 Fatal error during application startup');
  process.exit(1);
});
