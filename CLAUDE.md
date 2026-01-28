# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Overview

Doomsday is a TypeScript and Rust project. This file will be updated as the project evolves.

## Development Workflow

### GitHub-First Approach
- **Issues**: Create GitHub issues before starting work on features or bugs
- **Branches**: Work on feature branches, never commit directly to main
- **Pull Requests**: Open PRs for all changes, include clear descriptions
- **Projects**: Track progress via GitHub Projects board

### Branch Naming
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `refactor/<name>` - Code refactoring
- `docs/<name>` - Documentation updates

### Commit Messages
Use clear, descriptive commit messages:
- `feat: <description>` - New feature
- `fix: <description>` - Bug fix
- `refactor: <description>` - Code refactoring
- `docs: <description>` - Documentation
- `test: <description>` - Tests
- `chore: <description>` - Maintenance

### Pull Request Process
1. Create an issue describing the work
2. Create a feature branch from main
3. Make changes with clear commits
4. Open PR referencing the issue
5. Ensure CI passes
6. Merge after review

## Project Structure

```
/
├── src/           # TypeScript source
├── rust/          # Rust source
├── tests/         # Test files
├── docs/          # Documentation
└── .github/       # GitHub workflows and templates
```

## Tech Stack
- **TypeScript** - Primary language
- **Rust** - Performance-critical components
- **Node.js** - Runtime environment

## Key Commands

```bash
# TypeScript
npm install        # Install dependencies
npm run build      # Build project
npm test           # Run tests

# Rust
cargo build        # Build Rust components
cargo test         # Run Rust tests
```

## Testing Requirements
- Write tests for all new functionality
- Maintain test coverage
- Run full test suite before opening PRs
