import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to attach unique correlation ID to each request
 * Used for tracing request through entire system
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Try to get correlation ID from header, otherwise generate new one
  req.correlationId =
    (req.headers['x-correlation-id'] as string) || uuidv4();

  // Forward correlation ID in response headers
  res.setHeader('x-correlation-id', req.correlationId);

  // Record request start time for metrics
  req.startTime = Date.now();

  next();
}
