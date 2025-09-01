# CRM Data Visualization & Reporting System - Deployment Guide

## 🚀 Production Deployment Guide

This guide covers the complete deployment process for the CRM Data Visualization & Reporting System with all 5 phases implemented.

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Redis**: v6.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB free space
- **SSL Certificate**: Required for HTTPS in production

### Required Services
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session management and caching
- **Email**: SMTP server for report delivery
- **File Storage**: Local or cloud storage for exports
- **Monitoring**: Application monitoring service (optional)

## 🔧 Backend Deployment (Render Platform)

### Step 1: Environment Configuration

Create a `.env.production` file in `CRM-BACKEND/`:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=crm_production
DB_USER=crm_user
DB_PASSWORD=your-secure-password
DB_SSL=true

# Redis Configuration
REDIS_URL=redis://username:password@host:port
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-mobile-app.com

# Email Configuration (for reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
UPLOAD_DEST=./uploads

# Export Configuration
EXPORT_MAX_RECORDS=1000000
EXPORT_TIMEOUT=300000
EXPORT_CLEANUP_INTERVAL=3600000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Step 2: Render Deployment Configuration

Create `render.yaml` in the project root:

```yaml
services:
  - type: web
    name: crm-backend
    env: node
    plan: starter
    buildCommand: cd CRM-BACKEND && npm ci && npm run build
    startCommand: cd CRM-BACKEND && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: crm-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: crm-redis
          property: connectionString
    healthCheckPath: /api/health
    
databases:
  - name: crm-postgres
    plan: starter
    
services:
  - type: redis
    name: crm-redis
    plan: starter
```

### Step 3: Database Migration

Run database migrations on Render:

```bash
# In Render shell or during build
cd CRM-BACKEND
npm run migrate:prod
npm run seed:prod
```

### Step 4: Health Check Endpoint

Ensure the health check endpoint is working:

```typescript
// Already implemented in CRM-BACKEND/src/routes/health.ts
GET /api/health
```

## 🌐 Frontend Deployment

### Step 1: Environment Configuration

Create `.env.production` in `CRM-FRONTEND/`:

```env
# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.onrender.com
VITE_API_TIMEOUT=30000

# Authentication
VITE_JWT_STORAGE_KEY=crm_auth_token
VITE_REFRESH_TOKEN_KEY=crm_refresh_token

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPORTS=true
VITE_ENABLE_MOBILE=true
VITE_ENABLE_OFFLINE=true

# PWA Configuration
VITE_PWA_NAME=CRM Mobile
VITE_PWA_SHORT_NAME=CRM
VITE_PWA_DESCRIPTION=CRM Data Visualization & Reporting System

# Monitoring
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_DSN=your-sentry-dsn
```

### Step 2: Build Configuration

Update `vite.config.ts` for production:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-backend-domain\.onrender\.com\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    }
  }
})
```

### Step 3: Static Site Deployment

Deploy to Netlify, Vercel, or similar:

```bash
# Build for production
cd CRM-FRONTEND
npm ci
npm run build

# Deploy dist/ folder to your hosting service
```

## 🔒 Security Configuration

### SSL/TLS Setup
```nginx
# Nginx configuration for HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Security Headers
```typescript
// Already implemented in CRM-BACKEND/src/middleware/security.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## 📊 Monitoring & Logging

### Application Monitoring
```typescript
// Health check with detailed metrics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected',
    redis: 'connected'
  });
});
```

### Log Configuration
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy CRM System

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
      
      - name: Install Backend Dependencies
        run: cd CRM-BACKEND && npm ci
      
      - name: Run Backend Tests
        run: cd CRM-BACKEND && npm test
      
      - name: Install Frontend Dependencies
        run: cd CRM-FRONTEND && npm ci
      
      - name: Run Frontend Tests
        run: cd CRM-FRONTEND && npm test
      
      - name: Build Frontend
        run: cd CRM-FRONTEND && npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: render-deploy-action@v1
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Netlify
        uses: netlify/actions/build@master
        with:
          publish-dir: CRM-FRONTEND/dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🧪 Production Testing

### Smoke Tests
```bash
# Backend health check
curl https://your-backend-domain.onrender.com/api/health

# Frontend accessibility
curl https://your-frontend-domain.com

# API authentication
curl -X POST https://your-backend-domain.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_form_submissions_agent_id ON form_submissions(agent_id);
CREATE INDEX CONCURRENTLY idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX CONCURRENTLY idx_form_submissions_status ON form_submissions(status);
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
const cacheKey = `analytics:${userId}:${dateRange}`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

const freshData = await fetchAnalyticsData(userId, dateRange);
await redis.setex(cacheKey, 3600, JSON.stringify(freshData)); // 1 hour cache
```

## 🔧 Maintenance

### Regular Tasks
- **Database backups**: Daily automated backups
- **Log rotation**: Weekly log cleanup
- **Cache cleanup**: Daily Redis cache cleanup
- **Export cleanup**: Daily cleanup of old export files
- **Security updates**: Monthly dependency updates

### Monitoring Alerts
- **High CPU usage**: > 80% for 5 minutes
- **High memory usage**: > 90% for 5 minutes
- **Database connection errors**: > 5 errors in 1 minute
- **API response time**: > 2 seconds average
- **Failed login attempts**: > 10 attempts in 1 minute

## 📞 Support & Troubleshooting

### Common Issues
1. **Database connection timeout**: Check connection pool settings
2. **Redis connection failed**: Verify Redis server status
3. **Export generation timeout**: Increase timeout limits
4. **Mobile app not loading**: Check service worker registration
5. **Charts not rendering**: Verify Recharts dependencies

### Emergency Contacts
- **DevOps Team**: devops@yourcompany.com
- **Database Admin**: dba@yourcompany.com
- **Security Team**: security@yourcompany.com

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Monitoring setup completed
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Go-live communication sent

**The CRM Data Visualization & Reporting System is now ready for production deployment!** 🚀
