# API Documentation

This document provides comprehensive API documentation for the Enterprise Node.js Boilerplate.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Health Endpoints](#health-endpoints)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management](#user-management)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Field Filtering](#field-filtering)
- [Sorting](#sorting)

## Overview

The Enterprise API provides RESTful endpoints for user management, authentication, and system monitoring. All endpoints follow REST conventions and return JSON responses.

### Key Features
- JWT-based authentication with refresh tokens
- Role-based access control
- Input validation with Zod schemas
- Rate limiting and security headers
- Comprehensive audit logging
- Prometheus metrics integration

## Authentication

### JWT Token Structure

Access Token (15 minutes expiry):
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1640995200,
  "exp": 1640996100
}
```

### Authorization Header

```http
Authorization: Bearer <access_token>
```

### Refresh Token Flow

1. Use access token for API calls
2. When access token expires, use refresh token to get new access token
3. Refresh tokens are valid for 7 days
4. Refresh tokens can be revoked

## Base URL

```
Development: http://localhost:3000/api/v1
Staging: https://staging-api.yourapp.com/api/v1
Production: https://api.yourapp.com/api/v1
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users",
    "correlationId": "req-123456"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users",
    "correlationId": "req-123456"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users",
    "correlationId": "req-123456"
  }
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Codes

| Code | Description | Example |
|------|-------------|---------|
| VALIDATION_ERROR | Input validation failed | Invalid email format |
| AUTHENTICATION_ERROR | Authentication failed | Invalid credentials |
| AUTHORIZATION_ERROR | Permission denied | Insufficient role |
| NOT_FOUND | Resource not found | User not found |
| CONFLICT_ERROR | Resource conflict | Email already exists |
| RATE_LIMIT_EXCEEDED | Too many requests | Rate limit exceeded |
| INTERNAL_ERROR | Server error | Database connection failed |

## Health Endpoints

### Liveness Check

Check if the application is running.

```http
GET /health/live
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Readiness Check

Check if the application is ready to serve traffic.

```http
GET /health/ready
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "redis": {
      "status": "healthy",
      "latency": 5
    },
    "database": {
      "status": "healthy",
      "latency": 12
    },
    "memory": {
      "status": "healthy",
      "heapUsed": 67108864,
      "heapTotal": 134217728,
      "percentageUsed": 50
    }
  },
  "version": "1.0.0"
}
```

### Metrics Endpoint

Prometheus metrics endpoint.

```http
GET /metrics
```

Returns Prometheus-formatted metrics for monitoring.

## Authentication Endpoints

### Login

Authenticate user and return tokens.

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["user"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Refresh Token

Get new access token using refresh token.

```http
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout

Invalidate refresh token.

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Management

### Create User

Create a new user account.

```http
POST /api/v1/users
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "securePassword123",
  "roles": ["user"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "roles": ["user"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### Get Users

List users with pagination and filtering.

```http
GET /api/v1/users?page=1&limit=20&search=john&role=user
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search in name and email
- `role` (string): Filter by role
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["user"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get User

Get user by ID.

```http
GET /api/v1/users/:id
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User

Update user information.

```http
PUT /api/v1/users/:id
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "roles": ["user", "moderator"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "roles": ["user", "moderator"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

### Delete User

Delete user account.

```http
DELETE /api/v1/users/:id
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Change Password

Change user password.

```http
POST /api/v1/users/:id/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Rate Limiting

### Rate Limit Rules

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 15 minutes |
| Registration | 3 requests | 1 hour |
| General API | 100 requests | 15 minutes |
| Password Reset | 3 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "limit": 100,
      "windowMs": 900000,
      "retryAfter": 300
    }
  }
}
```

## Pagination

### Pagination Parameters

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

### Pagination Response

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Pagination Links

```http
Link: </api/v1/users?page=2>; rel="next",
      </api/v1/users?page=8>; rel="last"
```

## Field Filtering

### Select Fields

Return only specific fields.

```http
GET /api/v1/users?fields=id,email,firstName
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "firstName": "John"
    }
  ]
}
```

### Exclude Fields

Exclude specific fields from response.

```http
GET /api/v1/users?exclude=passwordHash,createdAt
Authorization: Bearer <access_token>
```

## Sorting

### Sort Parameters

- `sortBy` (string): Field to sort by
- `sortOrder` (string): Sort direction (asc/desc)

### Example

```http
GET /api/v1/users?sortBy=firstName&sortOrder=asc
Authorization: Bearer <access_token>
```

## Validation Rules

### User Creation

```json
{
  "email": {
    "type": "string",
    "format": "email",
    "required": true
  },
  "firstName": {
    "type": "string",
    "minLength": 1,
    "maxLength": 50,
    "required": true
  },
  "lastName": {
    "type": "string",
    "minLength": 1,
    "maxLength": 50,
    "required": true
  },
  "password": {
    "type": "string",
    "minLength": 8,
    "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]",
    "required": true
  },
  "roles": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["user", "admin", "moderator"]
    },
    "default": ["user"]
  }
}
```

### Password Requirements

- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

## Security Headers

All responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## CORS Configuration

### Development

```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Production

```http
Access-Control-Allow-Origin: https://yourapp.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Audit Logging

All API actions are logged with:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "action": "user.created",
  "userId": "507f1f77bcf86cd799439011",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "req-123456",
  "details": {
    "resourceId": "507f1f77bcf86cd799439012",
    "changes": ["firstName", "lastName"]
  }
}
```

## Error Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid credentials"
  }
}
```

### Authorization Error

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions to access this resource"
  }
}
```

### Not Found Error

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// API Client Class
class EnterpriseAPI {
  private baseURL: string;
  private accessToken?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.accessToken && {
        Authorization: `Bearer ${this.accessToken}`
      }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.data.accessToken);
    return response;
  }

  async getUsers(page = 1, limit = 20) {
    return this.request<any>(`/users?page=${page}&limit=${limit}`);
  }

  async createUser(userData: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

// Usage
const api = new EnterpriseAPI('http://localhost:3000/api/v1');

// Login
const loginResponse = await api.login('user@example.com', 'password');
console.log('Logged in as:', loginResponse.data.user);

// Get users
const users = await api.getUsers();
console.log('Users:', users.data);
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# Get users with token
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <access_token>"

# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "securePassword123"
  }'
```

## Testing

### Postman Collection

Import the following collection into Postman:

```json
{
  "info": {
    "name": "Enterprise API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"securePassword123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/auth/login"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```

For more detailed information about specific endpoints, refer to the inline API documentation or contact the development team.
