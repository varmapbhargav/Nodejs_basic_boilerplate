# 🚀 Enterprise Node.js Boilerplate

A production-ready, enterprise-grade Node.js boilerplate with TypeScript, Express, MongoDB/PostgreSQL, Redis, and comprehensive monitoring.

## ✨ Features

### 🏗️ Core Architecture
- **TypeScript** - Full type safety with strict mode
- **Express.js** - RESTful API framework
- **Dual Database Support** - MongoDB (Mongoose) & PostgreSQL
- **Redis** - Caching and session management
- **JWT Authentication** - Secure token-based auth with refresh tokens

### 🔒 Security & Reliability
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Zod schema validation
- **Password Hashing** - bcryptjs encryption
- **Audit Logging** - Comprehensive audit trails

### 📊 Monitoring & Observability
- **Prometheus Metrics** - Custom application metrics
- **Health Checks** - Liveness and readiness probes
- **Structured Logging** - Pino logger with pretty output
- **OpenTelemetry** - Distributed tracing (configurable)
- **Performance Monitoring** - Memory, CPU, event loop tracking
- **Circuit Breaker** - Fault tolerance with opossum

### 🛠️ Developer Experience
- **Hot Reload** - Nodemon for development
- **Linting** - ESLint with TypeScript rules
- **Formatting** - Prettier code formatter
- **Testing** - Jest with TypeScript support
- **Type Checking** - Strict TypeScript compilation
- **Environment Management** - Comprehensive .env configuration

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB or PostgreSQL (optional for development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Nodejs_basic_boilerplate

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see Configuration section)
```

### Database Setup

#### Option 1: MongoDB (Default)
```bash
# Install and start MongoDB
# Update .env with:
DATABASE_TYPE=mongodb
DATABASE_URL=mongodb://localhost:27017/enterprise_app
```

#### Option 2: PostgreSQL
```bash
# Install and start PostgreSQL
# Create database:
createdb enterprise_app

# Update .env with:
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://username:password@localhost:5432/enterprise_app
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file from `.env.example` and configure:

```bash
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
APP_NAME=Enterprise API
APP_VERSION=1.0.0

# Database
DATABASE_TYPE=mongodb                    # or postgres
DATABASE_URL=mongodb://localhost:27017/enterprise_app

# Authentication
JWT_ACCESS_SECRET=your_very_long_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_very_long_secret_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SESSION_SECRET=your_very_long_session_secret_min_32_chars

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# OpenTelemetry (Optional)
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Feature Flags
FEATURE_FLAGS_ENABLED=true
```

## 📁 Project Structure

```
src/
├── api/v1/                    # API routes v1
│   └── modules/
│       └── user/              # User module (CRUD, auth)
├── config/                    # Configuration files
│   ├── database.ts           # Database configuration
│   ├── mongodb.ts            # MongoDB setup
│   ├── postgresql.ts         # PostgreSQL setup
│   ├── redis.ts              # Redis configuration
│   ├── healthCheck.ts        # Health monitoring
│   ├── circuitBreaker.ts     # Circuit breaker
│   └── ...                   # Other config files
├── middlewares/               # Express middleware
│   ├── auth.middleware.ts    # JWT authentication
│   ├── audit.middleware.ts    # Audit logging
│   ├── error.middleware.ts    # Error handling
│   └── ...                   # Other middleware
├── observability/             # Monitoring & tracing
│   ├── metrics.ts            # Prometheus metrics
│   ├── tracing.ts            # OpenTelemetry tracing
│   ├── health.ts             # Health endpoints
│   └── logging.ts            # Audit logging
├── services/                  # Business logic
│   ├── auth/                  # Authentication services
│   ├── encryption.service.ts  # Password encryption
│   └── notification.service.ts # Notifications
├── utils/                     # Utility functions
│   ├── apiResponse.ts         # Standardized API responses
│   ├── asyncHandler.ts        # Async error handling
│   ├── errors.ts              # Custom error classes
│   └── sanitize.ts            # Input sanitization
├── types/                     # TypeScript type definitions
│   ├── common.d.ts            # Shared types
│   └── express.d.ts           # Express extensions
├── main.ts                    # Application entry point
└── app.ts                     # Express app setup
```

## 🔌 API Endpoints

### Health Checks
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users` - List users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 📊 Monitoring

### Health Checks
The application provides comprehensive health checks:

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

### Prometheus Metrics
Key metrics available at `/metrics`:
- `http_request_duration_seconds` - HTTP request latency
- `http_requests_total` - Total HTTP requests
- `http_errors_total` - HTTP error count
- `db_query_duration_seconds` - Database query latency
- `cache_hits_total` - Cache hit count
- `active_connections` - Active database connections
- `memory_usage_bytes` - Memory usage by type
- `event_loop_lag_milliseconds` - Event loop performance

## 🛡️ Security Features

### Authentication & Authorization
- JWT access tokens (15min expiry)
- JWT refresh tokens (7 days expiry)
- Password hashing with bcrypt
- Role-based access control
- Permission-based middleware

### Input Validation
- Zod schema validation for all inputs
- XSS protection with DOMPurify
- SQL injection prevention
- Request body sanitization

### Rate Limiting
- Configurable rate limits per endpoint
- Redis-based distributed rate limiting
- Automatic IP-based throttling

## 🔄 Graceful Shutdown

The application supports graceful shutdown with proper cleanup:
1. Stops accepting new requests
2. Closes database connections (MongoDB/PostgreSQL)
3. Closes Redis connections
4. Flushes logs and metrics
5. Exits with appropriate status code

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t enterprise-nodejs-api .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.service.test.ts
```

## 📈 Performance

### Built-in Optimizations
- Connection pooling for databases
- Redis caching layer
- Compression middleware
- Static asset serving
- Event loop monitoring

### Benchmarks
- Startup time: < 2 seconds
- Memory usage: ~50MB (idle)
- Request handling: 1000+ req/sec
- Database queries: < 10ms average

## 🔧 Development

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Code formatting
npm run format

# Check for unused dependencies
npm run depcheck
```

### Environment Management
- Development: Hot reload with nodemon
- Staging: Production build with test data
- Production: Optimized build with monitoring

## 📝 Logging

Structured logging with Pino:
```json
{
  "level": "info",
  "time": "2024-01-01T00:00:00.000Z",
  "pid": 12345,
  "hostname": "server-01",
  "reqId": "req-123",
  "msg": "User login successful",
  "userId": "user-456",
  "ip": "192.168.1.1"
}
```

## 🚀 Deployment

### Environment Setup
1. **Development**: Local development with hot reload
2. **Staging**: Production-like environment for testing
3. **Production**: Optimized for performance and security

### Deployment Options
- **Docker**: Containerized deployment
- **Kubernetes**: Orchestration with health checks
- **PM2**: Process manager for Node.js
- **Serverless**: AWS Lambda, Vercel, Netlify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [documentation](docs/)
- Review the [examples](examples/)

---

**Built with ❤️ for enterprise Node.js development**