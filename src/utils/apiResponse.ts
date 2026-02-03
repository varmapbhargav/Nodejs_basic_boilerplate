import type { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    path: string;
    correlationId?: string;
  };
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    req?: Request
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        path: req?.path || '',
        correlationId: req?.correlationId,
      },
    };

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    statusCode: number,
    message: string,
    errorCode: string = 'ERROR',
    details?: Record<string, any>,
    req?: Request
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req?.path || '',
        correlationId: req?.correlationId,
      },
    };

    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    },
    statusCode: number = 200,
    req?: Request
  ): Response {
    const response = {
      success: true,
      data,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        path: req?.path || '',
        correlationId: req?.correlationId,
      },
    };

    return res.status(statusCode).json(response);
  }
}
