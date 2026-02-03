import type { Request, Response, NextFunction } from 'express';
import { FeatureFlagService, type FeatureFlagContext } from '@config/featureFlags';
import { logger } from '@config/logger';

/**
 * Attach feature flag service to request for easy access
 */
export function featureFlagMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Create flag context from request
  const context: FeatureFlagContext = {
    userId: req.user?.id,
    environment: process.env.NODE_ENV,
  };

  // Attach convenient method to request
  (req as any).isFeatureEnabled = async (flagName: string) => {
    try {
      return await FeatureFlagService.isEnabled(flagName, context);
    } catch (error) {
      logger.error({ error, flagName }, 'Failed to check feature flag');
      return false;
    }
  };

  next();
}

/**
 * Create middleware that checks if feature is enabled
 * Returns next handler if enabled, otherwise returns early response
 */
export function requireFeature(flagName: string, fallbackHandler?: (_req: Request, _res: Response, _next: NextFunction) => void) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isEnabled = await FeatureFlagService.isEnabled(flagName, {
        userId: req.user?.id,
        environment: process.env.NODE_ENV,
      });

      if (!isEnabled) {
        if (fallbackHandler) {
          fallbackHandler(req, res, next);
        } else {
          res.status(404).json({
            success: false,
            error: {
              code: 'FEATURE_NOT_AVAILABLE',
              message: 'This feature is not available',
            },
          });
        }
        return;
      }

      next();
    } catch (error) {
      logger.error({ error, flagName }, 'Feature flag check failed');
      next(error);
    }
  };
}
