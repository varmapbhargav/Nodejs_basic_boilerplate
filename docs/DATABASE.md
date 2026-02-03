# Database Configuration

This document covers database setup and configuration for both MongoDB and PostgreSQL.

## Overview

The Enterprise Node.js Boilerplate supports dual database configurations:
- **MongoDB** (Default) - Document-oriented NoSQL database
- **PostgreSQL** - Relational SQL database

## MongoDB Setup

### Installation

#### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Ubuntu/Debian
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Docker
```bash
# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# Or with Docker Compose
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### Configuration

Update your `.env` file:

```bash
# Database Type
DATABASE_TYPE=mongodb

# MongoDB Connection String
DATABASE_URL=mongodb://localhost:27017/enterprise_app

# With Authentication
DATABASE_URL=mongodb://username:password@localhost:27017/enterprise_app?authSource=admin

# With Replica Set
DATABASE_URL=mongodb://localhost:27017,localhost:27018,localhost:27019/enterprise_app?replicaSet=rs0
```

### MongoDB Features

#### Connection Pooling
```typescript
// Automatic connection pooling with Mongoose
const mongoOptions = {
  maxPoolSize: 50,              // Maximum number of connections
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000,       // How long a send or receive on a socket can take
  bufferMaxEntries: 0,           // Disable mongoose buffering
  bufferCommands: false,         // Disable mongoose buffering
};
```

#### Schema Validation
```typescript
// Example user schema with validation
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  roles: [{
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ roles: 1 });

export const User = model('User', userSchema);
```

## PostgreSQL Setup

### Installation

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb enterprise_app
```

#### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE enterprise_app;
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE enterprise_app TO app_user;
\q
```

#### Docker
```bash
# Run PostgreSQL container
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=enterprise_app \
  -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=your_password \
  postgres:16

# Or with Docker Compose
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: postgres
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: enterprise_app
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Configuration

Update your `.env` file:

```bash
# Database Type
DATABASE_TYPE=postgres

# PostgreSQL Connection String
DATABASE_URL=postgresql://app_user:your_password@localhost:5432/enterprise_app

# With SSL
DATABASE_URL=postgresql://app_user:your_password@localhost:5432/enterprise_app?sslmode=require

# With connection pool
DATABASE_URL=postgresql://app_user:your_password@localhost:5432/enterprise_app?max=20
```

### PostgreSQL Features

#### Connection Pooling
```typescript
// Automatic connection pooling with pg
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 50,                    // Maximum number of connections
  idleTimeoutMillis: 30000,  // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});
```

#### Schema Creation
```sql
-- Example user table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_roles ON users USING GIN(roles);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Database Selection Guidelines

### Choose MongoDB when:
- **Flexible Schema**: Your data structure evolves frequently
- **Document Storage**: Storing complex nested objects
- **Horizontal Scaling**: Need to scale across multiple servers
- **Rapid Development**: Less rigid schema requirements
- **JSON Documents**: Natural fit for JSON-like data

### Choose PostgreSQL when:
- **ACID Compliance**: Strong transactional requirements
- **Complex Queries**: Advanced SQL operations needed
- **Data Integrity**: Strict schema and constraints required
- **Reporting**: Complex analytics and reporting
- **Existing Infrastructure**: Team has PostgreSQL expertise

## Database Operations

### Connection Health Check
```typescript
// MongoDB Health Check
const mongo = getMongoConnection();
await mongo.db.admin().ping();

// PostgreSQL Health Check
const pool = getPostgresPool();
const client = await pool.connect();
await client.query('SELECT 1');
client.release();
```

### Transaction Support

#### MongoDB Transactions
```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  await User.create([{ name: 'John' }], { session });
  await Post.create([{ title: 'Hello' }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

#### PostgreSQL Transactions
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  await client.query('INSERT INTO users (email) VALUES ($1)', ['john@example.com']);
  await client.query('INSERT INTO posts (title) VALUES ($1)', ['Hello World']);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Migration Strategy

### MongoDB to PostgreSQL
1. **Export Data**: Use `mongoexport` or custom scripts
2. **Transform Schema**: Convert document structure to relational
3. **Import Data**: Use `COPY` command or ETL tools
4. **Update Application**: Switch database configuration
5. **Test Thoroughly**: Validate data integrity

### PostgreSQL to MongoDB
1. **Export Data**: Use `COPY` or pg_dump
2. **Transform Schema**: Convert relational to document structure
3. **Import Data**: Use `mongoimport` or custom scripts
4. **Update Application**: Switch database configuration
5. **Test Thoroughly**: Validate functionality

## Performance Optimization

### MongoDB Optimization
```typescript
// Use indexes effectively
userSchema.index({ email: 1 });           // Single field
userSchema.index({ createdAt: -1 });      // Descending
userSchema.index({ roles: 1, status: 1 });  // Compound

// Use lean() for read-only operations
const users = await User.find({}).lean();

// Use projections to limit fields
const users = await User.find({}, { email: 1, name: 1 });

// Use aggregation pipelines for complex queries
const stats = await User.aggregate([
  { $match: { status: 'active' } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);
```

### PostgreSQL Optimization
```typescript
// Use prepared statements
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);

// Use connection pooling effectively
const client = await pool.connect();
try {
  // Multiple operations in single connection
  await client.query('SELECT * FROM users');
  await client.query('SELECT * FROM posts');
} finally {
  client.release();
}

// Use EXPLAIN ANALYZE for query optimization
const explainQuery = 'EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1';
const explanation = await pool.query(explainQuery, [email]);
```

## Backup and Recovery

### MongoDB Backup
```bash
# Create backup
mongodump --db enterprise_app --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db enterprise_app /backup/20240101/enterprise_app

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/mongodb/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --db enterprise_app --out $BACKUP_DIR
find /backup/mongodb -type d -mtime +7 -exec rm -rf {} +
```

### PostgreSQL Backup
```bash
# Create backup
pg_dump -h localhost -U app_user enterprise_app > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U app_user enterprise_app < backup_20240101.sql

# Automated backup script
#!/bin/bash
BACKUP_FILE="/backup/postgres/backup_$(date +%Y%m%d).sql"
mkdir -p /backup/postgres
pg_dump -h localhost -U app_user enterprise_app > $BACKUP_FILE
find /backup/postgres -name "*.sql" -mtime +7 -delete
```

## Monitoring

### Database Metrics
The application automatically tracks:
- Connection pool status
- Query performance
- Error rates
- Database size and growth

### Health Endpoints
- `/health/live` - Basic liveness check
- `/health/ready` - Database connectivity check
- `/metrics` - Prometheus metrics

## Troubleshooting

### Common Issues

#### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --eval "db.adminCommand('ismaster')"
```

#### PostgreSQL Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Test connection
psql -h localhost -U app_user -d enterprise_app -c "SELECT 1;"
```

### Performance Issues
1. **Check Indexes**: Ensure proper indexing
2. **Monitor Connections**: Check connection pool usage
3. **Analyze Queries**: Use EXPLAIN ANALYZE for slow queries
4. **Resource Usage**: Monitor CPU, memory, and disk I/O

## Security Considerations

### MongoDB Security
```typescript
// Enable authentication in MongoDB configuration
const mongoOptions = {
  authSource: 'admin',        // Authentication database
  ssl: true,                  // Enable SSL
  sslValidate: true,          // Validate SSL certificates
};
```

### PostgreSQL Security
```typescript
// Use SSL connections
const connectionString = 'postgresql://user:pass@host:5432/db?sslmode=require';

// Use connection limits
const pool = new Pool({
  max: 20,                    // Limit connections
  idleTimeoutMillis: 30000,  // Close idle connections
});
```

## Environment-Specific Configurations

### Development
```bash
# Use local databases
DATABASE_URL=mongodb://localhost:27017/enterprise_app_dev
REDIS_URL=redis://localhost:6379
```

### Staging
```bash
# Use staging databases
DATABASE_URL=mongodb://staging-db:27017/enterprise_app_staging
REDIS_URL=redis://staging-redis:6379
```

### Production
```bash
# Use production databases with authentication
DATABASE_URL=mongodb://prod-user:secure-pass@prod-db:27017/enterprise_app_prod?authSource=admin
REDIS_URL=redis://prod-redis:6379?password=secure-pass
```

For more information, refer to the official documentation:
- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
