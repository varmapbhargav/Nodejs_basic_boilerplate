import type { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '@utils/errors';
import { logger } from '@config/logger';
import { AuditService } from '@observability/logging';

export type PermissionCheck = (_user: Express.Request['user']) => boolean;

/**
 * Middleware to check if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthorizationError('User not authenticated'));
      return;
    }

    if (!req.user.permissions?.includes(permission)) {
      AuditService.logAuthorizationFailure(req, permission);
      logger.warn(
        { userId: req.user.id, permission },
        'Permission denied'
      );
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user has one of required roles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthorizationError('User not authenticated'));
      return;
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));

    if (!hasRole) {
      AuditService.logAuthorizationFailure(req, `roles: ${roles.join(',')}`);
      logger.warn(
        { userId: req.user.id, requiredRoles: roles },
        'Insufficient role'
      );
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }

    next();
  };
}

/**
 * Middleware for custom permission check
 */
export function checkPermission(check: PermissionCheck) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthorizationError('User not authenticated'));
      return;
    }

    if (!check(req.user)) {
      AuditService.logAuthorizationFailure(req, 'custom-check');
      next(new AuthorizationError('Access denied'));
      return;
    }

    next();
  };
}
