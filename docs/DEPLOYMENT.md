# Deployment Guide

This guide covers various deployment strategies for the Enterprise Node.js Boilerplate.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [PM2 Deployment](#pm2-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Security](#security)

## Prerequisites

### System Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB or PostgreSQL
- Redis
- SSL certificate (production)

### Build Requirements
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run tests
npm test

# Type checking
npm run type-check
```

## Environment Setup

### Development Environment
```bash
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=debug
DATABASE_URL=mongodb://localhost:27017/enterprise_app_dev
REDIS_URL=redis://localhost:6379
```

### Staging Environment
```bash
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
DATABASE_URL=mongodb://staging-db:27017/enterprise_app_staging
REDIS_URL=redis://staging-redis:6379
CORS_ORIGIN=https://staging.yourapp.com
```

### Production Environment
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=warn
DATABASE_URL=mongodb://prod-user:secure-pass@prod-db:27017/enterprise_app_prod?authSource=admin
REDIS_URL=redis://prod-redis:6379?password=secure-pass
CORS_ORIGIN=https://yourapp.com
```

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js

CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongodb:27017/enterprise_app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=enterprise_app
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### Build and Run

```bash
# Build Docker image
docker build -t enterprise-nodejs-api .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

## Kubernetes Deployment

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: enterprise-api
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: enterprise-api
data:
  NODE_ENV: "production"
  PORT: "3000"
  HOST: "0.0.0.0"
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://yourapp.com"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: enterprise-api
type: Opaque
data:
  DATABASE_URL: <base64-encoded-url>
  REDIS_URL: <base64-encoded-url>
  JWT_ACCESS_SECRET: <base64-encoded-secret>
  JWT_REFRESH_SECRET: <base64-encoded-secret>
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enterprise-api
  namespace: enterprise-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: enterprise-api
  template:
    metadata:
      labels:
        app: enterprise-api
    spec:
      containers:
      - name: enterprise-api
        image: enterprise-nodejs-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: enterprise-api-service
  namespace: enterprise-api
spec:
  selector:
    app: enterprise-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: enterprise-api-ingress
  namespace: enterprise-api
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.yourapp.com
    secretName: api-tls
  rules:
  - host: api.yourapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: enterprise-api-service
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: enterprise-api-hpa
  namespace: enterprise-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: enterprise-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## PM2 Deployment

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'enterprise-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'mongodb://prod-user:pass@prod-db:27017/enterprise_app',
      REDIS_URL: 'redis://prod-redis:6379'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### Deployment Commands

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor application
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart enterprise-api

# Reload application (zero downtime)
pm2 reload enterprise-api

# Stop application
pm2 stop enterprise-api

# Delete application
pm2 delete enterprise-api
```

## Cloud Platform Deployment

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init enterprise-api --platform "Node.js 18 running on 64bit Amazon Linux 2"

# Create environment
eb create production

# Deploy application
eb deploy

# Set environment variables
eb setenv NODE_ENV=production
eb setenv DATABASE_URL=mongodb://your-db:27017/enterprise_app
```

### AWS ECS

```json
{
  "family": "enterprise-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "enterprise-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/enterprise-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/enterprise-api",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/enterprise-api

# Deploy to Cloud Run
gcloud run deploy enterprise-api \
  --image gcr.io/PROJECT_ID/enterprise-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest
```

### Vercel

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "dist/main.js": {
      "maxDuration": 10
    }
  }
}
```

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_TYPE=mongodb
DATABASE_URL=mongodb://user:pass@host:27017/db

# Authentication
JWT_ACCESS_SECRET=your_very_long_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_very_long_secret_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SESSION_SECRET=your_very_long_session_secret_min_32_chars

# Redis
REDIS_URL=redis://host:6379

# Security
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://yourapp.com

# Logging
LOG_LEVEL=info
```

### Optional Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenTelemetry
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Feature Flags
FEATURE_FLAGS_ENABLED=true

# Application Metadata
APP_NAME=Enterprise API
APP_VERSION=1.0.0
```

## Health Checks

### Liveness Probe

```javascript
// healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health/live',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### Health Check Endpoints

```typescript
// Liveness check - Is the application running?
GET /health/live
Response: { status: "ok" }

// Readiness check - Is the application ready to serve traffic?
GET /health/ready
Response: {
  status: "healthy" | "unhealthy" | "degraded",
  services: {
    database: { status: "healthy", latency: 12 },
    redis: { status: "healthy", latency: 5 },
    memory: { status: "healthy", percentageUsed: 45 }
  }
}

// Metrics endpoint
GET /metrics
Response: Prometheus metrics format
```

## Monitoring

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'enterprise-api'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Enterprise API Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m])",
            "legendFormat": "{{error_type}}"
          }
        ]
      }
    ]
  }
}
```

### Alerting Rules

```yaml
# alerts.yml
groups:
  - name: enterprise-api
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: DatabaseConnectionDown
        expr: up{job="enterprise-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
          description: "Enterprise API is not responding"
```

## Security

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.yourapp.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Security Headers

```typescript
// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting

```typescript
// Advanced rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  }
});
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run type-check
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        run: |
          # Your deployment script here
          echo "Deploying to production..."
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker logs enterprise-api
kubectl logs -f deployment/enterprise-api
pm2 logs enterprise-api

# Check environment variables
printenv | grep NODE_ENV
```

#### Database Connection Issues
```bash
# Test database connection
mongosh mongodb://user:pass@host:27017/db
psql postgresql://user:pass@host:5432/db

# Check network connectivity
telnet mongodb-host 27017
telnet postgres-host 5432
```

#### High Memory Usage
```bash
# Monitor memory usage
docker stats
kubectl top pods
pm2 monit

# Check for memory leaks
node --inspect dist/main.js
```

### Performance Optimization

#### Node.js Optimization
```bash
# Increase memory limit
node --max-old-space-size=2048 dist/main.js

# Enable cluster mode
pm2 start ecosystem.config.js --env production
```

#### Database Optimization
```bash
# Check slow queries
db.setProfilingLevel(2)
db.system.profile.find().sort({ts: -1}).limit(5)

# Optimize indexes
db.users.getIndexes()
db.users.createIndex({ email: 1 })
```

For more deployment options and configurations, refer to the official documentation of your chosen platform.
