# Execution Plan: Production Readiness
**Date:** 2026-01-28
**Commitment:** Make Doomsday production-ready in a single autonomous session

## Success Criteria
- [ ] Zero ESLint errors
- [ ] Error boundary catches crashes
- [ ] CI/CD runs on every PR
- [ ] Basic test coverage for stores
- [ ] Input sanitization in place
- [ ] Code splitting for routes

---

## Task Breakdown

### Phase 1: Fix Lint Errors (CRITICAL)

#### Task 1.1: Fix Date.now() React purity violations
**Files:** CreateEventPage.tsx, LifeTimelinePage.tsx, PostDetailPage.tsx
**Action:** Move Date.now() calls into useMemo or useState initializers
**Verify:** `npm run lint` shows fewer errors

#### Task 1.2: Fix setState in useEffect (BottomNav.tsx)
**File:** BottomNav.tsx
**Action:** Use ref or restructure to avoid synchronous setState
**Verify:** `npm run lint` shows fewer errors

#### Task 1.3: Fix unused variable (_postId)
**File:** ThreadPost.tsx
**Action:** Remove or use the variable properly
**Verify:** `npm run lint` shows 0 errors

### Phase 2: Error Handling

#### Task 2.1: Create ErrorBoundary component
**File:** src/components/ErrorBoundary.tsx
**Action:** Create class component with error state and fallback UI

#### Task 2.2: Wrap App with ErrorBoundary
**File:** src/main.tsx
**Action:** Wrap <App /> with <ErrorBoundary>
**Verify:** Manually throw error to test

### Phase 3: CI/CD Pipeline

#### Task 3.1: Create GitHub Actions workflow
**File:** .github/workflows/ci.yml
**Action:** Lint, type-check, build on PR to main
**Verify:** Push branch, see workflow run

#### Task 3.2: Add pre-commit hook setup
**Files:** package.json (add husky, lint-staged)
**Action:** Configure pre-commit to run lint
**Verify:** Commit triggers lint

### Phase 4: Testing Setup

#### Task 4.1: Install Vitest and testing-library
**Files:** package.json, vite.config.ts
**Action:** Add vitest, @testing-library/react, jsdom

#### Task 4.2: Create test for posts store
**File:** src/store/posts.test.ts
**Action:** Test createPost, likePost, getFeed actions
**Verify:** `npm test` passes

#### Task 4.3: Create test for user store
**File:** src/store/user.test.ts
**Action:** Test followUser, unfollowUser, updateBalance
**Verify:** `npm test` passes

### Phase 5: Security

#### Task 5.1: Add DOMPurify for input sanitization
**Files:** package.json, relevant components
**Action:** Sanitize user content before rendering

#### Task 5.2: Escape user-generated content
**Files:** ThreadPost.tsx, PostDetailPage.tsx
**Action:** Ensure dangerouslySetInnerHTML not used without sanitization

### Phase 6: Performance

#### Task 6.1: Add lazy loading for routes
**File:** src/App.tsx
**Action:** Use React.lazy() and Suspense for page components
**Verify:** Network tab shows chunked loading

---

## Rollback Plan
- All changes on feature branch
- Can revert any task independently
- Tests must pass before merge

## Measurement
- Lint errors: 12 → 0
- Test coverage: 0% → >50% on stores
- Bundle: Track chunk sizes after splitting
- CI: Green checks on PRs
