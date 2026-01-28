# ADR-001: TypeScript Full-Stack

## Status
Accepted

## Context
We needed to choose a primary programming language for both frontend and backend development. Options considered:
- TypeScript (frontend + backend)
- JavaScript (frontend) + Rust (backend)
- JavaScript (frontend) + Go (backend)

## Decision
Use TypeScript for the entire stack:
- **Frontend**: React 19 with TypeScript
- **Backend**: Node.js with TypeScript (Hono framework)
- **Shared**: Common type definitions between frontend and backend

## Consequences

### Positive
- Single language across the stack reduces context switching
- Type safety catches errors at compile time
- Shared types between frontend and backend ensure API consistency
- Large ecosystem of TypeScript libraries
- Easy hiring - TypeScript developers are common

### Negative
- Runtime performance slightly lower than Rust/Go for compute-heavy tasks
- Need to maintain TypeScript configurations for multiple packages
- Node.js single-threaded nature requires careful async handling

### Mitigation
- Performance-critical blockchain operations can be offloaded to Solana programs
- Use worker threads for CPU-intensive tasks if needed
