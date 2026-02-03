# Boilerplate Quick Start & Architecture Overview

## 📦 What You Have

A **production-ready, enterprise-grade Node.js/TypeScript backend** with:

- ✅ Complete REST API structure (v1, v2 ready)
- ✅ Full example User module (routes, controller, service, repository)
- ✅ Security layer (JWT, rate limiting, validation, audit)
- ✅ Observability (logging, metrics, tracing, health checks)
- ✅ Resilience (circuit breakers, retries, timeouts)
- ✅ DevOps ready (Docker, Docker Compose, Kubernetes)
- ✅ Testing structure (unit, integration, e2e)
- ✅ Comprehensive documentation

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

### 3. Start Everything
```bash
npm run docker:up
```

### 4. Test It Works
```bash
# In another terminal
curl http://localhost:3000/health/live
```

### 5. View Available Tools
- **App**: http://localhost:3000
- **Jaeger Tracing**: http://localhost:16686
- **Prometheus Metrics**: http://localhost:9090

## 📁 Project Structure

```
src/
├── main.ts                          # Entry point with graceful shutdown
├── app.ts                           # Express app setup with all middleware
├── config/                          # Configuration & environment validation
│   ├── index.ts                    # Main config loader
│   ├── env.schema.ts               # Zod schema for environment validation
│   ├── database.ts                 # Database configuration
│   ├── redis.ts                    # Redis connection management
│   ├── logger.ts                   # Pino logger setup
│   ├── security.ts                 # Security config (JWT, CORS, etc)
│   ├── rateLimiter.ts              # Rate limiting configuration
│   ├── featureFlags.ts             # Feature flag system
│   └── circuitBreaker.ts           # Circuit breaker management
├── api/                            # API routes and modules
│   ├── v1/                         # API Version 1
│   │   ├── routes.ts               # V1 route aggregator
│   │   └── modules/
│   │       └── user/               # Example complete module
│   │           ├── user.validation.ts       # Zod schemas
│   │           ├── user.model.ts            # Data model definition
│   │           ├── user.repository.ts       # Data access layer
│   │           ├── user.service.ts          # Business logic
│   │           ├── user.controller.ts       # HTTP handlers
│   │           ├── user.policy.ts           # Access control policies
│   │           └── user.routes.ts           # Route definitions
│   └── v2/                         # API Version 2 placeholder
├── middlewares/                    # Express middleware
│   ├── requestId.middleware.ts      # Correlation ID generation
│   ├── auth.middleware.ts           # JWT authentication
│   ├── permission.middleware.ts     # Authorization (RBAC/ABAC)
│   ├── validate.middleware.ts       # Input validation with Zod
│   ├── audit.middleware.ts          # Audit logging
│   ├── error.middleware.ts          # Global error handling
│   └── featureFlag.middleware.ts    # Feature flag injection
├── services/                       # Business logic services
│   ├── auth/
│   │   ├── token.service.ts         # JWT token management
│   │   └── session.service.ts       # Session management
│   ├── encryption.service.ts        # Password/data encryption
│   └── notification.service.ts      # Email, SMS, push notifications
├── observability/                  # Logging, metrics, tracing
│   ├── logging.ts                   # Audit logging
│   ├── metrics.ts                   # Prometheus metrics
│   ├── tracing.ts                   # OpenTelemetry setup
│   └── health.ts                    # Health check endpoints
├── resilience/                     # Reliability patterns
│   ├── retry.ts                     # Retry with exponential backoff
│   ├── timeout.ts                   # Timeout handling
│   └── circuitBreaker.ts            # Circuit breaker wrapper
├── utils/                          # Utility functions
│   ├── errors.ts                    # Custom error classes
│   ├── apiResponse.ts               # Response formatting
│   ├── asyncHandler.ts              # Async error wrapper
│   ├── sanitize.ts                  # Input sanitization
│   └── constants.ts                 # App constants
├── types/                          # TypeScript definitions
│   ├── express.d.ts                 # Extended Express types
│   └── common.d.ts                  # Common types
└── tests/
    ├── unit/                        # Unit tests
    ├── integration/                 # Integration tests
    └── e2e/                         # End-to-end tests
```

## 🔐 Security Features Implemented

| Feature | Implementation |
|---------|-----------------|
| **Authentication** | JWT with access & refresh tokens |
| **Authorization** | RBAC + Policy-based (ABAC) |
| **Rate Limiting** | Per-user, per-IP, per-endpoint |
| **Input Validation** | Zod schemas on every endpoint |
| **Input Sanitization** | XSS prevention, HTML escaping |
| **Audit Logging** | All sensitive actions logged |
| **Session Management** | Redis-backed with revocation |
| **Password Security** | Bcryptjs with configurable rounds |
| **Token Revocation** | Blacklist on logout |
| **CORS** | Configurable origin validation |
| **Security Headers** | Helmet.js (CSP, X-Frame-Options, etc) |
| **Error Handling** | Doesn't leak sensitive info |

## 📊 Observability Implemented

| Feature | Tool | Location |
|---------|------|----------|
| **Structured Logs** | Pino | `src/config/logger.ts` |
| **Correlation IDs** | UUID per request | `src/middlewares/requestId.middleware.ts` |
| **Metrics** | Prometheus | `src/observability/metrics.ts` |
| **Tracing** | OpenTelemetry | `src/observability/tracing.ts` |
| **Health Checks** | Express | `src/observability/health.ts` |

## 🔄 Resilience Patterns

| Pattern | Implementation | Location |
|---------|-----------------|----------|
| **Retries** | Exponential backoff | `src/resilience/retry.ts` |
| **Timeouts** | Per-operation | `src/resilience/timeout.ts` |
| **Circuit Breakers** | Opossum library | `src/config/circuitBreaker.ts` |
| **Graceful Shutdown** | SIGTERM handling | `src/main.ts` |
| **Error Recovery** | Fallback responses | Middleware chain |

## 🧪 Testing Setup

```bash
npm test                # All tests
npm run test:unit       # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # E2E tests
npm run test:coverage   # With coverage report
```

Configuration: `jest.config.js` with:
- ✅ TypeScript support
- ✅ Path aliases (@config, @api, etc)
- ✅ Coverage thresholds (70%)

## 🐳 Docker & Kubernetes

### Local Development
```bash
npm run docker:up       # Start all services
npm run docker:down     # Stop all services
npm run docker:build    # Build image
```

Starts:
- Node app (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Jaeger UI (port 16686)
- Prometheus (port 9090)

### Production Deployment
```bash
# Build and push image
docker build -t registry/app:v1.0.0 .
docker push registry/app:v1.0.0

# Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml

# Watch rollout
kubectl rollout status deployment/enterprise-api
```

Features in manifest:
- ✅ Rolling update strategy
- ✅ Health checks (readiness/liveness)
- ✅ Resource limits
- ✅ Security context
- ✅ Pod disruption budget
- ✅ Graceful termination

## 📚 API Example: User Module

Complete REST API for users with:

```
POST   /api/v1/users/register        # Create new user
POST   /api/v1/users/login           # Authenticate
GET    /api/v1/users                 # List all (admin only)
GET    /api/v1/users/:id             # Get user
PUT    /api/v1/users/:id             # Update user
DELETE /api/v1/users/:id             # Delete user
POST   /api/v1/users/:id/change-password
```

**Flow Pattern** (apply to all modules):
1. **Validation** → Zod schema in middleware
2. **Controller** → HTTP handling only (see `user.controller.ts`)
3. **Service** → Business logic (see `user.service.ts`)
4. **Repository** → Data access (see `user.repository.ts`)
5. **Error** → Custom error classes caught by middleware
6. **Response** → Formatted by ResponseHandler

## 🎯 Key Features by Category

### API Design
- Version-aware routing (v1, v2 ready)
- Pagination support
- Standardized response format
- Correlation ID tracking
- Proper HTTP status codes

### Authentication & Authorization
- JWT with refresh token rotation
- Token revocation support
- Session tracking
- Role-based access control (RBAC)
- Policy-based access control (ABAC)

### Data Management
- Repository pattern for data abstraction
- Redis caching layer
- Database-agnostic (Mongo/Postgres)
- Query builders & pagination
- Connection pooling

### Feature Management
- Feature flags with Redis
- Global, user-based, environment-based flags
- Kill switches
- Caching for performance

### Quality & Reliability
- Circuit breakers for external calls
- Retry logic with exponential backoff
- Request timeouts
- Graceful shutdown
- Health check endpoints

### Operations
- Structured JSON logging
- Prometheus metrics
- OpenTelemetry tracing
- Jaeger visualization
- Comprehensive error handling

## 🚀 Next Steps

### 1. Setup & Test
```bash
npm install
cp .env.example .env
npm run docker:up
npm test
```

### 2. Explore Example Module
Look at `src/api/v1/modules/user/` - it's a complete, working example of:
- Input validation with Zod
- Authentication & authorization
- Error handling
- Database abstraction
- Audit logging

### 3. Add Your First Module
Copy the user module pattern:
1. Create `src/api/v1/modules/mymodule/`
2. Create validation, model, repository, service, controller, policy, routes
3. Register routes in `src/api/v1/routes.ts`

### 4. Deploy
- **Staging**: `npm run docker:up` or update env vars
- **Production**: Push Docker image, create K8s secrets, `kubectl apply`

### 5. Monitor
- Logs: `kubectl logs deployment/enterprise-api`
- Metrics: http://localhost:9090
- Traces: http://localhost:16686

## 📖 Documentation Files

- **README.md** - Features overview & quick start
- **API.md** - Complete API documentation & examples
- **DEPLOYMENT.md** - Deployment guide (local, staging, prod)
- **CONTRIBUTING.md** - Code style & contribution guidelines

## ⚙️ Configuration

All config from environment variables validated against `src/config/env.schema.ts`:

```
NODE_ENV              # development|staging|production
PORT                  # Server port
DATABASE_URL          # PostgreSQL or MongoDB connection
REDIS_URL             # Redis connection
JWT_ACCESS_SECRET     # JWT secret (min 32 chars)
JWT_REFRESH_SECRET    # JWT refresh secret (min 32 chars)
SESSION_SECRET        # Session secret (min 32 chars)
LOG_LEVEL             # debug|info|warn|error
OTEL_ENABLED          # true|false for distributed tracing
OTEL_EXPORTER_OTLP_ENDPOINT  # Jaeger OTLP endpoint
```

See `.env.example` for all options.

## 🎓 Learning Path

1. **Start here**: User module in `src/api/v1/modules/user/`
2. **Then**: Middleware stack in `src/middlewares/`
3. **Then**: Service layer patterns in `src/services/`
4. **Then**: Error handling in `src/utils/errors.ts`
5. **Then**: Add your own module following the pattern

## 💡 Pro Tips

- Use `asyncHandler()` wrapper for all async route handlers
- Use `ResponseHandler.success()` / `ResponseHandler.error()` for consistency
- Always validate inputs with Zod schemas
- Log sensitive operations via `AuditService`
- Use feature flags to test new functionality safely
- Implement policies for complex authorization
- Circuit breakers for external API calls
- Repository pattern abstracts database implementation

## 🆘 Troubleshooting

**Port already in use**: `lsof -i :3000` → `kill -9 <PID>`

**Redis connection error**: Check `REDIS_URL` in `.env`

**Database migrations**: Implement in repository initialization

**Type errors**: Run `npm run type-check`

**Lint issues**: Run `npm run lint:fix`

---

**You're all set!** 🎉 This is a fully functional, enterprise-ready backend boilerplate ready for your first feature.
