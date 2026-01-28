# ADR-004: Zustand for State Management

## Status
Accepted

## Context
We needed to choose a state management solution for React. Options considered:
- Redux Toolkit (industry standard, powerful)
- Zustand (minimal, hooks-based)
- Jotai (atomic state)
- MobX (observable-based)
- React Context + useReducer (built-in)

## Decision
Use Zustand for client-side state management.

## Consequences

### Positive
- Minimal boilerplate - no actions, reducers, providers
- Simple API using hooks
- Built-in persistence middleware (localStorage)
- No context provider wrapping needed
- Easy to test - stores are just functions
- Small bundle size (~1kb)
- Works outside React components

### Negative
- Less structure than Redux for large teams
- No Redux DevTools (has its own devtools)
- Less opinionated - team needs to establish patterns
- Fewer tutorials compared to Redux

### Mitigation
- Establish clear patterns for store organization
- Use TypeScript for structure and safety
- Document store conventions in codebase
