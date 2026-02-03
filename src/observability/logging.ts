import { logger } from '@config/logger';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

export interface AuditLog {
  correlationId: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log sensitive action
   */
  static async logAction(
    req: Request,
    action: string,
    resourceType: string,
    status: 'success' | 'failure',
    options?: {
      resourceId?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const auditLog: AuditLog = {
      correlationId: req.correlationId || uuidv4(),
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      userEmail: req.user?.email,
      action,
      resourceType,
      status,
      resourceId: options?.resourceId,
      details: options?.details,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent'),
    };

    // Log at appropriate level based on status
    if (status === 'failure') {
      logger.warn(auditLog, 'Audit: Action failed');
    } else if (
      this.isSensitiveAction(action) ||
      ['DELETE', 'UPDATE', 'CREATE'].includes(action)
    ) {
      logger.info(auditLog, 'Audit: Sensitive action');
    } else {
      logger.debug(auditLog, 'Audit: Action logged');
    }

    // In production, you might want to:
    // - Send to audit service
    // - Store in dedicated audit database
    // - Stream to event bus
  }

  /**
   * Determine if action is sensitive and requires detailed logging
   */
  private static isSensitiveAction(action: string): boolean {
    const sensitiveActions = [
      'LOGIN',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'PERMISSION_CHANGE',
      'ROLE_CHANGE',
      'API_KEY_CREATED',
      'API_KEY_DELETED',
      'CONFIGURATION_CHANGED',
      'SECURITY_SETTING_CHANGED',
    ];

    return sensitiveActions.includes(action.toUpperCase());
  }

  /**
   * Log failed authentication attempt
   */
  static async logAuthFailure(
    req: Request,
    reason: string
  ): Promise<void> {
    logger.warn(
      {
        correlationId: req.correlationId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        reason,
      },
      'Authentication failed'
    );
  }

  /**
   * Log failed authorization
   */
  static async logAuthorizationFailure(
    req: Request,
    requiredPermission: string
  ): Promise<void> {
    logger.warn(
      {
        correlationId: req.correlationId,
        userId: req.user?.id,
        requiredPermission,
        ipAddress: req.ip,
      },
      'Authorization failed - insufficient permissions'
    );
  }
}
