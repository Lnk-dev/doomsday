# Error Investigation Runbook

> **Issue**: #128
> **Last Updated**: 2026-01-28
> **Severity**: Variable (depends on error type)
> **Estimated Resolution Time**: 30 minutes to several hours

---

## Problem Description

This runbook covers investigating and resolving errors reported through:

- Error tracking systems (Sentry)
- User reports
- Log aggregation systems
- Automated testing failures

Types of errors covered:
- JavaScript runtime errors
- API/server errors
- Database errors
- Third-party integration errors
- Smart contract errors

---

## Detection Methods

### Automated Detection

1. **Sentry Alerts**
   - New error types appearing
   - Error rate exceeding threshold
   - Regression on resolved issues

2. **Log Aggregation**
   - Error log patterns
   - Exception rates
   - Stack trace clustering

3. **Health Check Failures**
   - API endpoint failures
   - Database connectivity issues
   - External service timeouts

### Manual Detection

1. **User Reports**
   - Support tickets
   - Social media mentions
   - Discord/community reports

2. **QA Testing**
   - Regression testing failures
   - Exploratory testing discoveries

---

## Investigation Process

### Step 1: Gather Initial Information

When an error is reported, collect:

```markdown
## Error Report
- **Error Message**: [Exact error message]
- **When**: [Timestamp or time range]
- **Who**: [Affected users/percentage]
- **Where**: [Page, feature, or API endpoint]
- **Frequency**: [One-time, intermittent, constant]
- **Recent Changes**: [Any recent deployments?]
```

### Step 2: Access Error Tracking

**Sentry Dashboard Investigation:**

1. Navigate to Sentry project
2. Filter by:
   - Time range (last 24h, last hour, etc.)
   - Environment (production)
   - Error level (error, fatal)

3. For each error, examine:
   - Stack trace
   - Breadcrumbs (user actions before error)
   - Device/browser information
   - Release version

**Key Sentry Queries:**

```
# Find errors in production
environment:production level:error

# Find errors for specific user
user.id:user_123

# Find errors in specific file
stack.filename:*PostCard*

# Find errors with high frequency
is:unresolved times_seen:>100
```

### Step 3: Reproduce the Error

**Local Reproduction:**

```bash
# Start development server
npm run dev

# Try to reproduce based on:
# 1. Steps from user report
# 2. Breadcrumbs from Sentry
# 3. Similar user flows
```

**Staging Reproduction:**

If cannot reproduce locally:
1. Deploy to staging with debug logging
2. Use same data/state as affected users
3. Check for environment-specific issues

### Step 4: Analyze Root Cause

**Common Error Categories:**

| Category | Indicators | Investigation Focus |
|----------|------------|---------------------|
| Null/Undefined | "Cannot read property of undefined" | Data flow, API responses |
| Type Error | "X is not a function" | Type mismatches, imports |
| Network Error | "Failed to fetch", timeouts | API availability, CORS |
| State Error | Inconsistent UI, stale data | State management, race conditions |
| Permission Error | 401, 403 responses | Auth flow, token expiry |

**Root Cause Analysis Questions:**

1. What changed recently? (deployments, config changes)
2. Is this affecting all users or specific segments?
3. Is there a pattern? (time of day, specific actions)
4. Are there related errors occurring?

### Step 5: Determine Error Impact

**Impact Assessment:**

| Impact Level | Criteria | Action Priority |
|--------------|----------|-----------------|
| Critical | Core functionality broken, >10% users | Immediate fix |
| High | Important feature broken, 1-10% users | Same-day fix |
| Medium | Minor feature affected, <1% users | This sprint |
| Low | Edge case, cosmetic | Backlog |

---

## Resolution Steps

### Frontend Errors

1. **Null/Undefined Errors**
   ```typescript
   // Before: Crashes if data is undefined
   const name = user.profile.name;

   // After: Safe access with fallback
   const name = user?.profile?.name ?? 'Anonymous';
   ```

2. **Error Boundaries**
   ```typescript
   // Add error boundary around problematic component
   <ErrorBoundary fallback={<ErrorFallback />}>
     <ProblematicComponent />
   </ErrorBoundary>
   ```

3. **Type Errors**
   ```typescript
   // Add runtime type checking
   if (typeof response.data !== 'object') {
     throw new Error(`Expected object, got ${typeof response.data}`);
   }
   ```

### API Errors

1. **Add Better Error Handling**
   ```typescript
   try {
     const response = await fetch(url);
     if (!response.ok) {
       throw new APIError(response.status, await response.text());
     }
     return response.json();
   } catch (error) {
     // Log to error tracking
     captureException(error, { extra: { url, method } });
     throw error;
   }
   ```

2. **Add Retry Logic**
   ```typescript
   async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
     for (let i = 0; i < retries; i++) {
       try {
         const response = await fetch(url);
         if (response.ok) return response;
       } catch (error) {
         if (i === retries - 1) throw error;
         await sleep(1000 * Math.pow(2, i)); // Exponential backoff
       }
     }
   }
   ```

### Database Errors

1. **Connection Errors**
   ```typescript
   // Add connection retry logic
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 5000,
   });

   pool.on('error', (err) => {
     captureException(err);
     // Attempt to recreate pool
   });
   ```

2. **Query Errors**
   ```typescript
   // Add query timeout
   const result = await pool.query({
     text: 'SELECT * FROM users WHERE id = $1',
     values: [userId],
     timeout: 5000, // 5 second timeout
   });
   ```

### Third-Party Integration Errors

1. **Add Fallbacks**
   ```typescript
   async function getPrice() {
     try {
       return await primaryOracle.getPrice();
     } catch (error) {
       captureException(error);
       return await fallbackOracle.getPrice();
     }
   }
   ```

2. **Circuit Breaker Pattern**
   ```typescript
   const breaker = new CircuitBreaker(externalService.call, {
     timeout: 3000,
     errorThresholdPercentage: 50,
     resetTimeout: 30000,
   });
   ```

---

## Verification Steps

After deploying fix:

### Immediate Verification (0-15 minutes)

- [ ] Error no longer appears in Sentry
- [ ] Manual reproduction no longer works
- [ ] Related functionality still works
- [ ] No new errors introduced

### Monitoring Period (15-60 minutes)

- [ ] Error rate returned to baseline
- [ ] No spike in related errors
- [ ] User reports stopped

### Verification Commands

```bash
# Check if error still occurring (Sentry API)
# Monitor Sentry dashboard for the specific error

# Check application logs
vercel logs --follow

# Run related tests
npm test -- --grep "affected-feature"
```

---

## Post-Incident Tasks

### Immediate (Within 1 hour)

- [ ] Update error status in Sentry (resolved, assigned)
- [ ] Respond to user reports with resolution
- [ ] Document fix in commit message

### Short-Term (Within 1 week)

- [ ] Add test coverage for the error case
- [ ] Consider adding monitoring for similar issues
- [ ] Update documentation if needed

### Error Prevention Checklist

- [ ] Are there similar patterns elsewhere that need fixing?
- [ ] Should this be caught by linting/type checking?
- [ ] Does this need a new test case?
- [ ] Should error handling be improved in related code?

---

## Common Error Patterns

### Pattern: "Cannot read property of undefined"

**Cause**: Accessing property on null/undefined value
**Fix**: Add null checks, use optional chaining

```typescript
// Bad
user.profile.name

// Good
user?.profile?.name ?? 'Default'
```

### Pattern: "Network request failed"

**Cause**: API unreachable, CORS issues, network problems
**Fix**: Add retry logic, check CORS config, add error handling

### Pattern: "Maximum update depth exceeded"

**Cause**: Infinite loop in useEffect or setState
**Fix**: Check effect dependencies, memoize callbacks

```typescript
// Bad
useEffect(() => {
  setData(transform(data));
}, [data]); // Infinite loop!

// Good
useEffect(() => {
  setData(transform(rawData));
}, [rawData]);
```

### Pattern: "Hydration mismatch"

**Cause**: Server and client render different content
**Fix**: Ensure consistent rendering, use useEffect for client-only content

### Pattern: "401 Unauthorized"

**Cause**: Token expired, invalid auth state
**Fix**: Implement token refresh, clear stale auth state

---

## Escalation

If error cannot be resolved within expected time:

1. **30 minutes**: Engage second engineer
2. **1 hour**: Notify engineering lead
3. **2 hours**: Consider rollback if error is critical

See [ONCALL.md](../ONCALL.md) for contact information.

---

## Related Runbooks

- [Incident Response](./INCIDENT_RESPONSE.md)
- [Deployment Rollback](./DEPLOYMENT_ROLLBACK.md)
- [Performance Issues](./PERFORMANCE_ISSUES.md)
- [Database Issues](./DATABASE_ISSUES.md)

---

*Last reviewed: 2026-01-28*
