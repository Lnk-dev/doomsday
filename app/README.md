# Doomsday

A decentralized social platform and prediction market built on Solana. Users engage with doom-related content, make predictions about future events, and choose to "live" despite the doom.

**Live Demo:** https://app-psi-tawny.vercel.app

## Overview

Doomsday combines social media with prediction markets:

- **Doom Scroll**: Free-to-post pessimistic content feed
- **Life Feed**: Costs $DOOM tokens to post, rewards long-term engagement
- **Prediction Market**: Bet on doom events happening or not
- **Leaderboards**: Compete across multiple categories
- **Token Economy**: $DOOM and $LIFE tokens with real utility

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State**: Zustand with localStorage persistence
- **Routing**: React Router v6
- **Blockchain**: Solana (wallet adapters installed)
- **Deployment**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # App shell, navigation
│   └── ui/              # Reusable UI components
├── pages/               # Route pages
├── store/               # Zustand state management
├── lib/                 # Utilities
└── types/               # TypeScript definitions
```

## Features

### Core Features
- [x] Mobile-first PWA design
- [x] Doom scroll feed with sorting (Hot/New/Top)
- [x] Life feed with token costs
- [x] Prediction market with betting
- [x] User profiles with stats
- [x] Leaderboards (5 categories)
- [x] Settings page

### Social Features
- [x] Post detail with comments
- [x] Share posts (copy link, Twitter, native)
- [x] Follow users
- [x] Life timeline
- [x] Donation system

### UX Features
- [x] Notification indicators
- [x] Real-time like interactions
- [x] Persistent state (localStorage)

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and patterns
- [Features](docs/FEATURES.md) - Detailed feature documentation
- [Store API](docs/STORE-API.md) - State management reference
- [Deployment](docs/DEPLOYMENT.md) - Setup and deployment guide
- [Infrastructure](docs/INFRASTRUCTURE.md) - Architecture and service dependencies
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md) - Pre-launch requirements
- [Contributing](CONTRIBUTING.md) - Branch strategy and workflow

## Branch Strategy

```
main     → Production (protected, requires PR)
test     → Staging/QA
dev      → Active development
feature/* → Individual features
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full workflow details.

## Deployment

Production deploys automatically on merge to `main` via Vercel.

```bash
# Manual deploy
vercel --prod
```

## Token Economics (Mock)

| Token | Purpose |
|-------|---------|
| $DOOM | Earned from doom content, spent on life posts |
| $LIFE | Earned from life content, donations |

### Life Post Costs
- Base: 1 $DOOM
- +1 per day of life
- +1 per 10 life posts

## GitHub Issues as Memory

All features, bugs, and infrastructure work are tracked as GitHub Issues. This serves as:
- **Long-term memory** for the project
- **Communication channel** between collaborators
- **Audit trail** of all decisions and changes

See the [Project Board](https://github.com/orgs/Lnk-dev/projects/2) for current status.

## License

MIT

## Links

- [GitHub Project Board](https://github.com/orgs/Lnk-dev/projects/2)
- [Issues](https://github.com/Lnk-dev/doomsday/issues)
