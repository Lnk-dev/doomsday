# Developer Setup Guide

## Quick Start

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start database
docker-compose up -d

# Push schema
npm run db:push

# Start dev servers
npm run dev:all
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend (localhost:5173) |
| `npm run dev:server` | Backend (localhost:3001) |
| `npm run dev:all` | Both servers |
| `npm run db:push` | Push schema to DB |
| `npm run db:studio` | Open Drizzle Studio |

## API Endpoints

- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/me` - Current user
- `GET /posts` - List posts
- `POST /posts` - Create post
- `POST /posts/:id/like` - Like post
- `GET /events` - List events
- `POST /events` - Create event
- `POST /events/:id/bet` - Place bet
- `GET /health` - Health check

## Environment Variables

See `server/.env.example` for all options.
