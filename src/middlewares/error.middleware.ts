import type { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';
import { ResponseHandler } from '@utils/apiResponse';
import { AppError } from '@utils/errors';

/**
 * Global error handling middleware
 * Must be registered AFTER all other middleware and routes
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId;

  // Log error
  if (error instanceof AppError) {
    logger.warn(
      {
        correlationId,
        errorType: error.errorType,
        statusCode: error.statusCode,
        message: error.message,
        details: error.details,
      },
      'Application error'
    );
  } else {
    logger.error(
      {
        correlationId,
        message: error.message,
        stack: error.stack,
      },
      'Unhandled error'
    );
  }

  // Handle known app errors
  if (error instanceof AppError) {
    ResponseHandler.error(
      res,
      error.statusCode,
      error.message,
      error.errorType,
      error.details,
      req
    );
    return;
  }

  // Handle unexpected errors
  ResponseHandler.error(
    res,
    500,
    'Internal server error',
    'INTERNAL_SERVER_ERROR',
    undefined,
    req
  );
}

/**
 * 404 Not Found middleware
 * Should be registered AFTER all routes
 */
export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.debug({ path: req.path, method: req.method }, 'Route not found');

  ResponseHandler.error(
    res,
    404,
    `Cannot ${req.method} ${req.path}`,
    'NOT_FOUND',
    undefined,
    req
  );
}
