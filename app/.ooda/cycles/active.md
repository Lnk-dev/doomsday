# OODA Cycle: Production Readiness
**Started:** 2026-01-28
**Objective:** Make Doomsday app production-ready

## Phase Status
- [x] OBSERVE - Signals gathered
- [x] ORIENT - Prioritization complete
- [ ] DECIDE - Plan committed
- [ ] ACT - Execution in progress
- [ ] LEARN - Retro captured

---

## ORIENT: Synthesis & Prioritization

### Situation Summary
Doomsday is a well-architected React app with good patterns but missing production essentials: error handling, tests, CI/CD, and has 12 linting errors that must be fixed.

### Opportunity Scoring (RICE)

| Opportunity | Reach | Impact | Confidence | Effort | Score |
|-------------|-------|--------|------------|--------|-------|
| Fix lint errors | 100% | High | High | Low | **95** |
| Add error boundaries | 100% | High | High | Low | **90** |
| Add CI/CD pipeline | 100% | High | High | Medium | **85** |
| Add unit tests for stores | 80% | High | Medium | Medium | **70** |
| Input sanitization | 60% | High | High | Low | **65** |
| Code splitting | 100% | Medium | High | Low | **60** |

### Recommended Focus (Priority Order)

1. **Fix ESLint errors** - Blocking issue, quick wins
2. **Add Error Boundaries** - Crash protection
3. **Add CI/CD** - Automated quality gates
4. **Add basic tests** - Confidence in changes
5. **Security hardening** - Input validation
6. **Performance** - Code splitting

### Hypotheses
- H1: Fixing Date.now() calls will resolve 6 of 12 lint errors
- H2: A single ErrorBoundary component can wrap the app
- H3: GitHub Actions can run lint + build on PRs
- H4: Vitest can be added without major config changes
