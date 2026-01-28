# ADR-002: Hono for API Framework

## Status
Accepted

## Context
We needed to choose a Node.js web framework for the REST API. Options considered:
- Express.js (most popular, large ecosystem)
- Fastify (high performance, schema validation)
- Hono (lightweight, edge-ready, TypeScript-first)
- NestJS (enterprise features, Angular-like)

## Decision
Use Hono as the API framework.

## Consequences

### Positive
- Extremely lightweight (~14kb) with fast startup
- First-class TypeScript support with type inference
- Works on Node.js, Deno, Bun, and edge runtimes (Cloudflare Workers)
- Built-in middleware for common tasks (CORS, JWT, validation)
- Modern API design with Web Standards (Request/Response)
- Easy migration path to edge deployment if needed

### Negative
- Smaller ecosystem compared to Express
- Fewer third-party middleware options
- Less documentation and Stack Overflow answers
- Team may need to learn new patterns

### Mitigation
- Hono's API is similar to Express, reducing learning curve
- Most Express middleware can be adapted
- Growing community and documentation
