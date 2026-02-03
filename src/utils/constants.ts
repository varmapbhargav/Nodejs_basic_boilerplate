// API Constants
export const API_CONSTANTS = {
  VERSION: '1.0.0',
  BASE_PATH: '/api',
  V1_PATH: '/api/v1',
  V2_PATH: '/api/v2',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// JWT
export const JWT = {
  ALGORITHM: 'HS256',
  REFRESH_TOKEN_TYPE: 'refresh_token',
  ACCESS_TOKEN_TYPE: 'access_token',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  SERVICE: 'service',
} as const;

// User permissions
export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Admin operations
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  API_KEY: (apiKey: string) => `apikey:${apiKey}`,
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
} as const;

// Time constants (in milliseconds)
export const TIME = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const;
