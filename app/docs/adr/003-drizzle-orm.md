# ADR-003: Drizzle ORM for Database

## Status
Accepted

## Context
We needed to choose an ORM/query builder for PostgreSQL. Options considered:
- Prisma (most popular, great DX)
- Drizzle (lightweight, SQL-like, type-safe)
- TypeORM (mature, decorator-based)
- Knex.js (query builder only)
- Raw SQL with pg driver

## Decision
Use Drizzle ORM with postgres.js driver.

## Consequences

### Positive
- Lightweight with no code generation step (unlike Prisma)
- SQL-like syntax - what you write is what executes
- Excellent TypeScript inference from schema
- Supports relational queries without N+1 problems
- Fast migrations with drizzle-kit
- Works well with serverless (no connection pooling issues)

### Negative
- Newer than Prisma, smaller community
- Less documentation and tutorials
- No GUI admin tool (Prisma Studio equivalent)
- Schema defined in TypeScript, not a separate DSL

### Mitigation
- drizzle-kit studio provides basic GUI
- SQL knowledge transfers directly
- Active development and growing adoption
