# Infrastructure Guide

> Architecture overview, service dependencies, and operational configuration for the Doomsday platform.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Service Dependencies](#service-dependencies)
- [Network Configuration](#network-configuration)
- [Security Considerations](#security-considerations)
- [CI/CD Pipeline](#cicd-pipeline)
- [Secrets Management](#secrets-management)
- [Rollback Procedures](#rollback-procedures)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                      │
│    Browser (PWA)  │  Mobile Browser  │  Desktop Browser                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           EDGE / CDN                                      │
│                         Vercel Edge Network                               │
│              (Static Assets, Caching, SSL Termination)                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
          ┌──────────────────────┴──────────────────────┐
          │                                              │
          ▼                                              ▼
┌──────────────────────┐                    ┌──────────────────────┐
│    FRONTEND (SPA)    │                    │    BACKEND (API)     │
│                      │                    │                      │
│  React 19 + Vite     │◄───── REST ───────►│  Express + Node.js   │
│  Zustand State       │◄──── WebSocket ───►│  Socket.io           │
│  React Router v7     │                    │  Drizzle ORM         │
│  Tailwind CSS        │                    │                      │
│                      │                    │                      │
│  Hosted: Vercel      │                    │  Hosted: TBD         │
└──────────────────────┘                    └──────────┬───────────┘
                                                       │
                                 ┌─────────────────────┼─────────────────────┐
                                 │                     │                     │
                                 ▼                     ▼                     ▼
                    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
                    │    PostgreSQL    │  │      Redis       │  │  Solana Network  │
                    │                  │  │                  │  │                  │
                    │  User data       │  │  Session cache   │  │  $DOOM Token     │
                    │  Posts/Comments  │  │  Real-time pub/  │  │  $LIFE Token     │
                    │  Predictions     │  │  sub             │  │  Programs        │
                    │                  │  │  Rate limiting   │  │                  │
                    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **Frontend (Vercel)** | Static hosting, CDN, SPA serving |
| **Backend (TBD)** | API endpoints, business logic, WebSocket |
| **PostgreSQL** | Persistent data storage |
| **Redis** | Caching, session storage, real-time events |
| **Solana** | Token transactions, on-chain data |

---

## Service Dependencies

### Frontend Dependencies

| Service | Provider | Purpose | Criticality |
|---------|----------|---------|-------------|
| Vercel | Vercel | Static hosting, CDN | Critical |
| Solana RPC | Helius/QuickNode | Blockchain queries | Critical |
| Backend API | Self-hosted | Data persistence | Critical |

### Backend Dependencies

| Service | Provider | Purpose | Criticality |
|---------|----------|---------|-------------|
| PostgreSQL | Self-managed | Primary database | Critical |
| Redis | Self-managed | Caching, pub/sub | High |
| Sentry | Sentry.io | Error monitoring | Medium |
| Solana RPC | Helius/QuickNode | Blockchain transactions | Critical |

### External Services

| Service | Purpose | Fallback Strategy |
|---------|---------|-------------------|
| **Solana RPC** | Blockchain operations | Multiple providers configured |
| **Error Tracking** | Sentry for monitoring | Graceful degradation |
| **Analytics** | User behavior tracking | Optional, can be disabled |

### Docker Services (Development)

The `docker-compose.yml` provides local development services:

```yaml
services:
  db:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: doomsday
      POSTGRES_PASSWORD: doomsday_dev
      POSTGRES_DB: doomsday

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

---

## Network Configuration

### Port Allocation

| Service | Development Port | Production Port | Protocol |
|---------|------------------|-----------------|----------|
| Frontend | 5173 | 443 (CDN) | HTTPS |
| Backend API | 3001 | 443 | HTTPS |
| WebSocket | 3001 | 443 | WSS |
| PostgreSQL | 5432 | 5432 | TCP |
| Redis | 6379 | 6379 | TCP |

### DNS Configuration

| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| `@` | A | Vercel IP | Root domain |
| `www` | CNAME | `cname.vercel-dns.com` | www subdomain |
| `api` | A/CNAME | Backend server | API subdomain |

### CORS Configuration

The backend should be configured to allow requests from:

```javascript
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Preview deployments (Vercel pattern)
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### WebSocket Configuration

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000
});
```

---

## Security Considerations

### Authentication & Authorization

| Layer | Method | Implementation |
|-------|--------|----------------|
| API Authentication | JWT | Bearer tokens in Authorization header |
| Wallet Authentication | Solana | Signature verification |
| Session Management | JWT + Redis | Short-lived tokens with refresh |

### Data Protection

1. **Encryption in Transit**
   - All traffic over HTTPS/TLS 1.3
   - WebSocket connections over WSS

2. **Encryption at Rest**
   - Database encryption enabled
   - Sensitive fields encrypted at application level

3. **Input Validation**
   - Server-side validation with Zod schemas
   - Client-side sanitization with DOMPurify
   - SQL injection prevention via parameterized queries (Drizzle ORM)

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 10 attempts | 1 minute |
| Wallet Operations | 20 requests | 1 minute |
| WebSocket Events | 30 events | 1 minute |

### Security Headers

The following headers should be configured:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

### Dependency Security

- Dependabot enabled for automated security updates
- Weekly dependency audits via `npm audit`
- No known critical vulnerabilities in production

---

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Push/PR    │───►│   Lint &     │───►│    Tests     │───►│    Build     │
│              │    │  TypeCheck   │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
                    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                    │  Production  │◄───│   Preview    │◄───│   Vercel     │
                    │   Deploy     │    │   Deploy     │    │  Integration │
                    └──────────────┘    └──────────────┘    └──────────────┘
```

### Pipeline Stages

| Stage | Trigger | Actions |
|-------|---------|---------|
| **Lint & Build** | Push to any branch | ESLint, TypeScript check, Vite build |
| **Test** | After lint passes | Vitest unit tests |
| **Preview** | Pull request | Vercel preview deployment |
| **Production** | Merge to main | Vercel production deployment |

### Branch Protection Rules

| Branch | Required Checks | Restrictions |
|--------|----------------|--------------|
| `main` | CI pass, tests pass | PR required, no direct push |
| `dev` | CI pass | PR recommended |
| `test` | CI pass | QA staging |

---

## Secrets Management

### Local Development

```bash
# .env file (gitignored)
VITE_SOLANA_NETWORK=devnet
VITE_API_URL=http://localhost:3001
```

### Vercel Secrets

Configure via Vercel Dashboard (Settings > Environment Variables):

| Secret | Environment | Description |
|--------|-------------|-------------|
| `VITE_SOLANA_RPC_URL` | Production | RPC provider endpoint |
| `VITE_DOOM_TOKEN_MINT` | Production | Token mint address |
| `VITE_LIFE_TOKEN_MINT` | Production | Token mint address |
| `DATABASE_URL` | Production | Database connection string |
| `JWT_SECRET` | Production | JWT signing secret |

### Rotation Policy

| Secret Type | Rotation Frequency | Method |
|-------------|-------------------|--------|
| JWT Secret | 90 days | Manual rotation |
| API Keys | 90 days | Provider dashboard |
| Database Password | 180 days | Managed service |
| RPC Keys | On compromise | Provider dashboard |

---

## Rollback Procedures

### Frontend Rollback (Vercel)

1. **Via Dashboard**
   - Go to Vercel project > Deployments
   - Find last stable deployment
   - Click "..." > "Promote to Production"

2. **Via CLI**
   ```bash
   # List recent deployments
   vercel ls

   # Rollback to specific deployment
   vercel rollback <deployment-url>
   ```

### Database Rollback

1. **Point-in-Time Recovery**
   - Available if using managed PostgreSQL
   - Restore to timestamp before incident

2. **Migration Rollback**
   ```bash
   # Revert last migration
   npm run db:rollback

   # Or restore from backup
   pg_restore -d doomsday backup.dump
   ```

### Emergency Procedures

| Severity | Action | Response Time |
|----------|--------|---------------|
| Critical (site down) | Rollback to last stable | < 15 minutes |
| High (major feature broken) | Hotfix or rollback | < 1 hour |
| Medium (minor bug) | Fix in next release | < 24 hours |
| Low (cosmetic issue) | Fix when convenient | < 1 week |

### Rollback Decision Tree

```
Is the issue affecting users?
├── Yes
│   ├── Is there a quick fix available?
│   │   ├── Yes → Deploy hotfix
│   │   └── No → Rollback to previous version
│   └── After rollback, create issue for proper fix
└── No → Fix in next scheduled release
```

---

## Monitoring & Observability

### Health Checks

| Endpoint | Expected Response | Check Interval |
|----------|-------------------|----------------|
| `/` | 200 OK | 30 seconds |
| `/api/health` | 200 OK + status JSON | 30 seconds |
| `/api/health/db` | 200 OK if DB connected | 60 seconds |

### Key Metrics

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Response Time (p95) | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 70% | > 90% |
| Database Connections | > 80% pool | > 95% pool |

### Alerting

Configure alerts for:

- Deployment failures
- Error rate spikes
- Performance degradation
- Security events
- SSL certificate expiry

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Setup and deployment instructions
- [Architecture](./ARCHITECTURE.md) - Application architecture details
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-launch requirements
- [Contributing](../CONTRIBUTING.md) - Development workflow
