// Common pagination types
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

// User types
export interface UserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends UserBase {
  passwordHash: string;
}

export interface UserResponse extends UserBase {
  permissions: string[];
}

// Authentication types
export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// API Response types
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

// Feature flag context
export interface FeatureFlagContext {
  userId?: string;
  environment?: string;
  customAttributes?: Record<string, any>;
}

// Query options
export interface QueryOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  select?: string[];
}
