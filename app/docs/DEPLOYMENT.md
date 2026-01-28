# Deployment Guide

> Complete guide for deploying and running the Doomsday application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Vercel Deployment](#vercel-deployment)
- [Build and Deploy Commands](#build-and-deploy-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 22.x (LTS) | Runtime environment |
| npm | 10.x+ | Package management |
| Git | 2.x+ | Version control |
| Docker | 24.x+ | Local database/services (optional) |

### Verify Installation

```bash
# Check Node.js version
node --version  # Should output v22.x.x

# Check npm version
npm --version   # Should output 10.x.x

# Check Git version
git --version   # Should output 2.x.x
```

### Recommended Tools

- **VS Code** - Recommended IDE with TypeScript support
- **Docker Desktop** - For running local PostgreSQL and Redis
- **Vercel CLI** - For manual deployments (`npm i -g vercel`)

---

## Environment Variables

### Frontend Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SOLANA_NETWORK` | Yes | `devnet` | Solana network (`mainnet-beta`, `devnet`, `testnet`, `localnet`) |
| `VITE_SOLANA_RPC_URL` | No | Public endpoint | Custom Solana RPC endpoint |
| `VITE_SOLANA_WS_URL` | No | Public endpoint | Custom Solana WebSocket endpoint |
| `VITE_DOOM_TOKEN_MINT` | Mainnet only | - | $DOOM token mint address |
| `VITE_LIFE_TOKEN_MINT` | Mainnet only | - | $LIFE token mint address |
| `VITE_PREDICTION_MARKET_PROGRAM` | Mainnet only | - | Prediction market program ID |
| `VITE_TOKEN_VAULT_PROGRAM` | Mainnet only | - | Token vault program ID |
| `VITE_API_URL` | Yes | `http://localhost:3001` | Backend API URL |

### Development Configuration

```bash
# .env (development)
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_WS_URL=wss://api.devnet.solana.com
VITE_API_URL=http://localhost:3001
```

### Production Configuration

```bash
# .env.production
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://your-rpc-provider.com
VITE_SOLANA_WS_URL=wss://your-rpc-provider.com
VITE_DOOM_TOKEN_MINT=<mainnet_doom_mint_address>
VITE_LIFE_TOKEN_MINT=<mainnet_life_mint_address>
VITE_PREDICTION_MARKET_PROGRAM=<program_id>
VITE_TOKEN_VAULT_PROGRAM=<program_id>
VITE_API_URL=https://api.yourdomain.com
```

### Backend Environment Variables

The backend server (when deployed) requires additional environment variables. These should be configured in your hosting provider's environment settings.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection string (for caching) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | Yes | Environment (`development`, `production`) |

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/Lnk-dev/doomsday.git
cd doomsday

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings (optional for development)
# Default devnet settings work out of the box
```

### 3. Start Development Services (Optional)

If you need the full backend stack:

```bash
# Start PostgreSQL and Redis via Docker
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Start Development Server

```bash
# Frontend only (with mock data)
npm run dev

# Frontend + Backend (full stack)
npm run dev:all
```

The application will be available at `http://localhost:5173`.

### Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Vite dev server |
| Backend API | http://localhost:3001 | Express API server |
| PostgreSQL | localhost:5432 | Database (via Docker) |
| Redis | localhost:6379 | Cache (via Docker) |

---

## Vercel Deployment

### Automatic Deployments

The project is configured for automatic deployments via Vercel:

- **Production**: Merges to `main` branch automatically deploy to production
- **Preview**: Pull requests generate preview deployments

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration

The project includes a `vercel.json` configuration file:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This configuration enables client-side routing for the SPA.

### Vercel Environment Variables

Configure these in your Vercel project settings (Settings > Environment Variables):

1. **Production Environment**
   - `VITE_SOLANA_NETWORK`: `mainnet-beta`
   - `VITE_SOLANA_RPC_URL`: Your RPC provider URL
   - `VITE_API_URL`: Your production API URL
   - Token mint addresses and program IDs

2. **Preview Environment**
   - `VITE_SOLANA_NETWORK`: `devnet`
   - `VITE_API_URL`: Staging API URL

### Vercel Project Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node.js Version | 22.x |

---

## Build and Deploy Commands

### Development Commands

```bash
# Start frontend dev server
npm run dev

# Start backend dev server
npm run dev:server

# Start both frontend and backend
npm run dev:all
```

### Build Commands

```bash
# Build frontend for production
npm run build

# Build backend for production
npm run build:server

# Type check without building
npx tsc --noEmit
```

### Test Commands

```bash
# Run unit tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Quality Commands

```bash
# Run ESLint
npm run lint

# Preview production build locally
npm run preview
```

### Database Commands

```bash
# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## Troubleshooting

### Common Issues

#### 1. Node.js Version Mismatch

**Problem**: Build fails with compatibility errors.

**Solution**:
```bash
# Check current Node version
node --version

# Use nvm to switch to correct version
nvm install 22
nvm use 22
```

#### 2. Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**:
```bash
# Find and kill the process using the port
lsof -i :5173
kill -9 <PID>

# Or use a different port
npm run dev -- --port 3000
```

#### 3. Environment Variables Not Loading

**Problem**: `VITE_*` variables are undefined.

**Solution**:
- Ensure variables are prefixed with `VITE_` for frontend access
- Restart the development server after changing `.env`
- Check file is named `.env` (not `.env.local` for Vite defaults)

#### 4. Docker Services Not Starting

**Problem**: `docker-compose up` fails.

**Solution**:
```bash
# Ensure Docker Desktop is running
docker info

# Remove old containers and volumes
docker-compose down -v
docker-compose up -d
```

#### 5. Vercel Deployment Fails

**Problem**: Build succeeds locally but fails on Vercel.

**Solutions**:
- Check Node.js version matches (22.x)
- Verify all environment variables are set in Vercel dashboard
- Review Vercel build logs for specific errors
- Ensure `package-lock.json` is committed

#### 6. SPA Routing 404 Errors

**Problem**: Direct URLs return 404 in production.

**Solution**:
- Verify `vercel.json` has the rewrite rule:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

#### 7. Wallet Connection Issues

**Problem**: Solana wallet won't connect.

**Solutions**:
- Verify `VITE_SOLANA_NETWORK` matches your wallet's network
- Check RPC endpoint is accessible
- Try switching to a different wallet
- Clear browser cache and reconnect

### Getting Help

If you encounter issues not covered here:

1. Check existing [GitHub Issues](https://github.com/Lnk-dev/doomsday/issues)
2. Review the [Architecture documentation](./ARCHITECTURE.md)
3. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Relevant error logs

---

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System design and patterns
- [Infrastructure](./INFRASTRUCTURE.md) - Architecture and service dependencies
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-launch requirements
- [Contributing](../CONTRIBUTING.md) - Development workflow
