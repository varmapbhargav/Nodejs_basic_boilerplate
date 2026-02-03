# Deployment Guide

## Prerequisites

- Docker & Docker Compose installed locally
- Node.js 18+ for development
- Git for version control
- Access to target environment (staging/production)

## Local Development

### 1. Setup

```bash
# Clone repository
git clone <repo-url>
cd Nodejs_basic_boilerplate

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your local settings
nano .env
```

### 2. Run Locally

**Option A: With Docker Compose (Recommended)**
```bash
npm run docker:up
```

Starts:
- Node app on port 3000
- PostgreSQL on port 5432
- Redis on port 6379
- Jaeger on port 16686
- Prometheus on port 9090

**Option B: Manual (requires external services)**
```bash
npm run dev
```

### 3. Test

```bash
npm test
npm run test:coverage
```

### 4. Stop Services

```bash
npm run docker:down
```

---

## Docker Build & Push

### Build Image

```bash
npm run docker:build
```

Builds image: `nodejs-enterprise-boilerplate:latest`

### Push to Registry

```bash
# Tag image
docker tag nodejs-enterprise-boilerplate:latest \
  registry.example.com/app:v1.0.0

# Push
docker push registry.example.com/app:v1.0.0
```

---

## Staging Deployment

### 1. Build & Push Image

```bash
docker build -t your-registry/app:staging .
docker push your-registry/app:staging
```

### 2. Set Environment

```bash
# Create .env.staging with staging secrets
export NODE_ENV=staging
export DATABASE_URL=<staging-db-url>
export REDIS_URL=<staging-redis-url>
export JWT_ACCESS_SECRET=<new-secret>
export JWT_REFRESH_SECRET=<new-secret>
```

### 3. Deploy with Docker Compose

```bash
# Pull latest image
docker-compose pull

# Start services
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f app
```

### 4. Verify

```bash
# Health check
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready

# Metrics
curl http://localhost:3000/metrics

# Test API
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com",...}'
```

---

## Production Deployment with Kubernetes

### 1. Build & Push Image

```bash
docker build -t your-registry/app:v1.0.0 .
docker push your-registry/app:v1.0.0
```

### 2. Create Secrets

```bash
kubectl create namespace production

kubectl create secret generic app-secrets \
  -n production \
  --from-literal=database-url='postgresql://user:pass@host:5432/db' \
  --from-literal=redis-url='redis://host:6379' \
  --from-literal=jwt-access-secret='<32+ char secret>' \
  --from-literal=jwt-refresh-secret='<32+ char secret>' \
  --from-literal=session-secret='<32+ char secret>'
```

### 3. Update Image in Manifest

Edit `k8s-deployment.yaml`:

```yaml
image: your-registry/app:v1.0.0  # Update this
```

### 4. Deploy

```bash
# Apply manifests
kubectl apply -f k8s-deployment.yaml -n production

# Check rollout status
kubectl rollout status deployment/enterprise-api -n production

# Watch logs
kubectl logs -f deployment/enterprise-api -n production

# Check health
kubectl get pods -n production
```

### 5. Verify Deployment

```bash
# Port forward to test
kubectl port-forward -n production svc/enterprise-api 3000:80

# Test endpoint
curl http://localhost:3000/health/live

# View logs
kubectl logs -f deployment/enterprise-api -n production --all-containers=true
```

---

## Rolling Update (Zero-Downtime)

### 1. Update Image Tag

```yaml
spec:
  containers:
  - image: your-registry/app:v1.1.0  # New version
```

### 2. Apply Update

```bash
kubectl set image deployment/enterprise-api \
  api=your-registry/app:v1.1.0 \
  -n production

# Or apply manifest
kubectl apply -f k8s-deployment.yaml -n production
```

### 3. Monitor Rollout

```bash
# Watch progress
kubectl rollout status deployment/enterprise-api -n production

# View events
kubectl describe deployment/enterprise-api -n production

# Rollback if needed
kubectl rollout undo deployment/enterprise-api -n production
```

---

## Environment Configuration

### Secrets Management

Never hardcode secrets. Use environment-specific configs:

```bash
# Development
.env.example → .env

# Staging
.env.staging (gitignored)

# Production
Kubernetes secrets or external vault

# Variables to never hardcode:
- DATABASE_URL
- REDIS_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- SESSION_SECRET
- API_KEYS
- ENCRYPTION_KEYS
```

### Configuration Best Practices

1. **Development**: `.env` with local values
2. **Staging**: Environment variables from CI/CD
3. **Production**: Kubernetes secrets + ConfigMaps
4. **Rotate secrets** regularly
5. **Audit secret access** in logs
6. **Use encryption** at rest and in transit

---

## Monitoring & Observability

### Logs

```bash
# View application logs
docker logs -f <container-id>

# Or with Kubernetes
kubectl logs -f pod/enterprise-api-xyz -n production

# Search logs
kubectl logs deployment/enterprise-api -n production | grep ERROR
```

### Metrics (Prometheus)

1. Open `http://localhost:9090`
2. Query examples:
   - `http_requests_total` - Total requests
   - `http_request_duration_seconds_bucket` - Response times
   - `circuit_breaker_state` - Circuit breaker status

### Traces (Jaeger)

1. Open `http://localhost:16686`
2. Search by:
   - Service: `enterprise-api`
   - Correlation ID (from logs)
   - Duration
   - Errors

---

## Backup & Recovery

### Database Backup

```bash
# PostgreSQL
docker exec postgres pg_dump -U user enterprise_db > backup.sql

# Restore
docker exec -i postgres psql -U user enterprise_db < backup.sql
```

### Redis Backup

```bash
# Backup
docker exec redis redis-cli BGSAVE

# Check
docker exec redis redis-cli LASTSAVE
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker logs app

# Check environment
docker exec app env | grep NODE_ENV

# Test database connection
docker exec app npm run test:integration
```

### High Memory Usage

```bash
# Check heap
docker stats

# Enable profiling
NODE_OPTIONS=--prof npm start
```

### Slow Responses

```bash
# Check Prometheus metrics
# Look for high http_request_duration_seconds

# Check database performance
# Look for slow db_query_duration_seconds queries

# Check circuit breaker status
# If OPEN, service is degraded
```

### Failed Deployments

```bash
# Check events
kubectl describe deployment/enterprise-api -n production

# View replica status
kubectl get rs -n production

# Check pod status
kubectl describe pod/enterprise-api-xyz -n production

# View recent logs
kubectl logs -p pod/enterprise-api-xyz -n production
```

---

## Performance Optimization

### Database

- Add indexes on frequently queried fields
- Use connection pooling (configured)
- Monitor slow queries
- Optimize N+1 queries

### Caching

- Cache user profiles in Redis
- Cache permission checks
- TTL: 1 hour for user data
- Invalidate on updates

### API Performance

- Compression enabled via Helmet
- Pagination on list endpoints
- Selective field loading
- Rate limiting to prevent abuse

### Monitoring

- Alert on high error rates (>1%)
- Alert on slow response times (>1s p95)
- Alert on circuit breaker OPEN
- Alert on memory/CPU usage >80%

---

## Scaling

### Horizontal Scaling

Kubernetes handles this automatically with:
- Replica count in manifest
- HPA (Horizontal Pod Autoscaler)
- Load balancer distribution

```bash
# Scale manually
kubectl scale deployment enterprise-api --replicas=5 -n production

# Or update manifest and apply
```

### Vertical Scaling

Update resource limits in manifest:

```yaml
resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

---

## Security Checklist

- [ ] Change all default secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable logging/auditing
- [ ] Set up monitoring alerts
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] Backup encryption
- [ ] Network policies configured
- [ ] Pod security policies applied
- [ ] RBAC properly configured
- [ ] Secrets encrypted in etcd
- [ ] Regular penetration testing

---

## Support & Escalation

For deployment issues:

1. Check logs first
2. Verify configuration
3. Check external dependencies
4. Review recent changes
5. Check CI/CD pipeline
6. Escalate if critical

Contact: devops@example.com
