# Contributing to Doomsday

## Branch Strategy

We use a three-branch strategy for version control:

```
main (production) ← test (staging) ← dev (development) ← feature/*
```

### Branch Descriptions

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production-ready code | Production (vercel.app) |
| `test` | Staging/QA environment | Preview deployments |
| `dev` | Active development | Preview deployments |
| `feature/*` | Individual features | Preview deployments |

## Workflow

### 1. Starting New Work

```bash
# Always start from dev
git checkout dev
git pull origin dev

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 2. Feature Branch Naming

Use descriptive, kebab-case names:
- `feature/add-user-auth`
- `feature/improve-feed-sorting`
- `fix/login-button-crash`
- `chore/update-dependencies`

### 3. Making Changes

```bash
# Make your changes, then commit
git add <files>
git commit -m "feat: Add new feature description"

# Push to remote
git push -u origin feature/your-feature-name
```

### 4. Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(feed): Add infinite scroll to doom feed
fix(auth): Resolve login redirect issue
docs: Update API documentation
chore: Upgrade React to v19
```

### 5. Pull Request Flow

```
feature/* → dev → test → main
```

1. **Feature → Dev**: Create PR from feature branch to `dev`
   - Requires code review
   - All tests must pass

2. **Dev → Test**: Periodic merge to `test` for QA
   - QA testing in staging environment
   - Integration testing

3. **Test → Main**: Release to production
   - Final review
   - Production deployment

### 6. Code Review Guidelines

Before approving a PR, check:
- [ ] Code follows project style
- [ ] No console.log or debug statements
- [ ] TypeScript types are correct
- [ ] No security vulnerabilities
- [ ] Feature works as expected
- [ ] No breaking changes (or documented if intentional)

### 7. Keeping Branches Updated

```bash
# Update your feature branch with latest dev
git checkout feature/your-feature
git fetch origin
git rebase origin/dev

# Or merge if you prefer
git merge origin/dev
```

### 8. Hotfix Process

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# After fix, merge to main AND dev
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

git checkout dev
git merge hotfix/critical-bug-fix
git push origin dev
```

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Deployment

- **Production**: Automatic on merge to `main`
- **Staging**: Automatic on merge to `test`
- **Preview**: Automatic for all PRs

## Questions?

Open an issue or start a discussion in the repository.
