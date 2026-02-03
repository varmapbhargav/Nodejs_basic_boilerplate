import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@utils/errors';
import { logger } from '@config/logger';
import { getConfig } from '@config/index';
import { AuditService } from '@observability/logging';

/**
 * Middleware to verify JWT and attach user to request
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const config = getConfig();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.security.jwtAccessSecret) as {
      userId: string;
      email: string;
      roles: string[];
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      permissions: [], // Will be populated by permission middleware
    };

    next();
  } catch (error) {
    logger.warn({ error }, 'JWT verification failed');
    AuditService.logAuthFailure(req, (error as Error).message);
    next(new AuthenticationError());
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const config = getConfig();
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.security.jwtAccessSecret) as {
        userId: string;
        email: string;
        roles: string[];
      };

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
        permissions: [],
      };
    }
  } catch (error) {
    logger.debug({ error }, 'Optional auth failed, continuing without user');
  }

  next();
}
