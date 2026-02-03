import type { Request, Response, NextFunction } from 'express';
import { AuditService } from '@observability/logging';
import { MetricsService } from '@observability/metrics';

/**
 * Middleware to log audit trail for sensitive operations
 */
export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Store original send to intercept response
  const originalSend = res.send;

  res.send = function (data: any) {
    const statusCode = res.statusCode;
    const isSensitiveOperation = isSensitive(req.method, req.path);
    const isError = statusCode >= 400;

    if (isSensitiveOperation) {
      const resource = extractResourceInfo(req);

      AuditService.logAction(
        req,
        req.method,
        resource.type,
        isError ? 'failure' : 'success',
        {
          resourceId: resource.id,
          details: {
            statusCode,
            responseSize: JSON.stringify(data).length,
          },
        }
      );
    }

    // Record metrics
    const duration = (Date.now() - req.startTime) / 1000;
    MetricsService.recordHttpRequest(req.method, req.path, statusCode, duration);

    return originalSend.call(this, data);
  };

  next();
}

function isSensitive(method: string, path: string): boolean {
  const sensitivePatterns = [
    /POST|PUT|DELETE|PATCH/,
    /auth|login|logout|password|permission|role/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(method + path));
}

function extractResourceInfo(req: Request): { type: string; id?: string } {
  // Extract resource type and ID from path
  // e.g., /api/v1/users/123 -> { type: 'users', id: '123' }
  const parts = req.path.split('/').filter((p) => p);

  // Remove version prefix
  const versionIndex = parts.findIndex((p) => p.startsWith('v'));
  const resourceParts = parts.slice(versionIndex + 1);

  return {
    type: resourceParts[0] || 'unknown',
    id: resourceParts[1],
  };
}
