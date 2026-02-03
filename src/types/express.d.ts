declare global {
  namespace Express {
    interface Request {
      /**
       * Unique correlation ID for tracing request through system
       */
      correlationId: string;

      /**
       * Authenticated user information
       */
      user?: {
        id: string;
        email: string;
        roles: string[];
        permissions: string[];
      };

      /**
       * Request start time for metrics
       */
      startTime: number;

      /**
       * Tenant ID for multi-tenant applications
       */
      tenantId?: string;
    }
  }
}

export {};
