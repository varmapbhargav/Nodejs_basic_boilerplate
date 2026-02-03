import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

import { logger } from '@config/logger';
import { getConfig } from '@config/index';
import { setupV1Routes } from '@api/v1/routes';
import { MetricsService } from '@observability/metrics';
import { livenessHandler, readinessHandler } from '@observability/health';

// Middleware
import { requestIdMiddleware } from '@middlewares/requestId.middleware';
import { auditMiddleware } from '@middlewares/audit.middleware';
import { featureFlagMiddleware } from '@middlewares/featureFlag.middleware';
import { errorMiddleware, notFoundMiddleware } from '@middlewares/error.middleware';

export function createApp() {
  const app = express();
  const config = getConfig();

  // Trust proxy - important for correct IP in production
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.security.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    })
  );

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Structured logging
  app.use(pinoHttp({ logger }));

  // Request ID and timing
  app.use(requestIdMiddleware);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimiter.windowMs,
    max: config.rateLimiter.maxRequests,
    keyGenerator: (req) => config.rateLimiter.keyGenerator(req),
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    },
  });
  app.use(limiter);

  // Audit middleware
  app.use(auditMiddleware);

  // Feature flags
  app.use(featureFlagMiddleware);

  // Health check endpoints (no auth required)
  app.get('/health/live', livenessHandler);
  app.get('/health/ready', readinessHandler);

  // Metrics endpoint
  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(await MetricsService.getMetrics());
  });

  // API routes
  app.use('/api/v1', setupV1Routes());

  // 404 handler
  app.use(notFoundMiddleware);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
