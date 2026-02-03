# API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via the `/users/login` endpoint.

## Response Format

All responses follow a standard format:

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/users",
    "correlationId": "uuid"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* additional context */ }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/users",
    "correlationId": "uuid"
  }
}
```

## User Endpoints

### 1. Register User

```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"],
    "isActive": true,
    "permissions": ["user:read"],
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

**Errors:**
- 400 Bad Request - Invalid input
- 409 Conflict - Email already exists

---

### 2. Login User

```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900000
    },
    "sessionId": "uuid"
  }
}
```

**Errors:**
- 401 Unauthorized - Invalid credentials
- 400 Bad Request - Invalid input

---

### 3. Get User Profile

```http
GET /users/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* user object */ }
}
```

**Errors:**
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Cannot view other user's profile
- 404 Not Found - User not found

---

### 4. Update User

```http
PUT /users/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated user object */ }
}
```

**Errors:**
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Cannot update other users
- 404 Not Found - User not found
- 409 Conflict - Email already in use

---

### 5. Delete User

```http
DELETE /users/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "User deleted successfully" }
}
```

**Errors:**
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Cannot delete other users
- 404 Not Found - User not found

---

### 6. List All Users (Admin Only)

```http
GET /users?page=1&pageSize=20
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { /* user 1 */ },
    { /* user 2 */ }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Errors:**
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Admin only

---

### 7. Change Password

```http
POST /users/:id/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Password changed successfully" }
}
```

**Errors:**
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Cannot change other passwords
- 404 Not Found - User not found

---

## Health & Metrics Endpoints

### Liveness Check

```http
GET /health/live
```

Returns immediately if app is running.

---

### Readiness Check

```http
GET /health/ready
```

Checks dependencies (database, Redis) are available.

---

### Prometheus Metrics

```http
GET /metrics
```

Returns metrics in Prometheus text format.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| AUTHENTICATION_FAILED | 401 | Missing/invalid token |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required permissions |
| RESOURCE_NOT_FOUND | 404 | Resource doesn't exist |
| RESOURCE_CONFLICT | 409 | Resource conflict (e.g., email exists) |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## Rate Limiting

Rate limits vary by endpoint:

| Endpoint | Limit |
|----------|-------|
| `/users/register` | 5 per 15 min |
| `/users/login` | 5 per 15 min |
| Other endpoints | 100 per 15 min |

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Pagination

Use `page` and `pageSize` query parameters:

```
GET /users?page=2&pageSize=50
```

- Default page: 1
- Default pageSize: 20
- Max pageSize: 100

---

## Examples

### cURL

```bash
# Register
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# Get user (replace TOKEN with actual access token)
curl -X GET http://localhost:3000/api/v1/users/123 \
  -H "Authorization: Bearer TOKEN"
```

### JavaScript/Fetch

```javascript
// Register
const response = await fetch('http://localhost:3000/api/v1/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'SecurePass123'
  })
});

const data = await response.json();
console.log(data);
```

---

## Versioning Strategy

The API supports multiple versions:

- **v1**: Current stable version
- **v2**: Future breaking changes (when ready)

Both versions can coexist. Clients can migrate at their own pace.

URLs follow the pattern: `/api/v{version}/...`

---

## Support

For API issues or questions, please open an issue or contact the team.
