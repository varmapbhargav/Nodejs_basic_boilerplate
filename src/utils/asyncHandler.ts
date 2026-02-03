import type { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';

export type AsyncHandler = (
  _req: Request,
  _res: Response,
  _next: NextFunction
) => Promise<any>;

/**
 * Wrap async route handlers to catch errors automatically
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((error) => {
      logger.error(
        {
          error,
          path: req.path,
          method: req.method,
          correlationId: req.correlationId,
        },
        'Unhandled error in async handler'
      );
      next(error);
    });
  };
}
