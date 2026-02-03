import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@utils/errors';
import { logger } from '@config/logger';

export type ValidateSource = 'body' | 'query' | 'params';

export interface ValidationOptions {
  source?: ValidateSource;
  abortEarly?: boolean;
}

/**
 * Middleware factory for validating request data with Zod schemas
 */
export function validate(
  schema: z.ZodSchema,
  options: ValidationOptions = {}
) {
  const { source = 'body' } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = getDataBySource(req, source);

      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        logger.debug({ errors, source }, 'Validation failed');
        throw new ValidationError('Validation failed', errors);
      }

      // Replace data with validated data
      setDataBySource(req, source, result.data);

      next();
    } catch (error) {
      next(error);
    }
  };
}

function getDataBySource(req: Request, source: ValidateSource): any {
  switch (source) {
    case 'body':
      return req.body;
    case 'query':
      return req.query;
    case 'params':
      return req.params;
    default:
      return req.body;
  }
}

function setDataBySource(
  req: Request,
  source: ValidateSource,
  data: any
): void {
  switch (source) {
    case 'body':
      req.body = data;
      break;
    case 'query':
      req.query = data;
      break;
    case 'params':
      req.params = data;
      break;
  }
}

function formatZodErrors(error: z.ZodError): Record<string, any> {
  const formatted: Record<string, any> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}
