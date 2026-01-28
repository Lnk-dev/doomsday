# Performance Issues Runbook

> **Issue**: #128
> **Last Updated**: 2026-01-28
> **Severity**: Medium to High
> **Estimated Resolution Time**: 30 minutes to 2 hours

---

## Problem Description

Performance degradation affecting user experience, including:

- Slow page load times (LCP > 2.5 seconds)
- Slow API response times (>500ms)
- High Time to First Byte (TTFB > 600ms)
- UI jank or unresponsiveness (FID > 100ms)
- Memory leaks causing browser slowdown
- Database query slowness

---

## Detection Methods

### Automated Detection

1. **Core Web Vitals Alerts**
   - LCP (Largest Contentful Paint) > 2.5s
   - FID (First Input Delay) > 100ms
   - CLS (Cumulative Layout Shift) > 0.1

2. **APM Alerts**
   - API p95 latency > 500ms
   - Database query time > 200ms
   - Memory usage > 80%
   - CPU usage > 80%

3. **Monitoring Dashboard Indicators**
   - Response time graphs trending upward
   - Throughput dropping
   - Error rates increasing due to timeouts

### Manual Detection

1. **Browser DevTools**
   - Network tab showing slow requests
   - Performance tab showing long tasks
   - Memory tab showing leaks

2. **User Reports**
   - "App is slow"
   - "Pages take forever to load"
   - "App freezes"

3. **Lighthouse Audits**
   ```bash
   # Run Lighthouse audit
   npx lighthouse https://app-psi-tawny.vercel.app --view
   ```

---

## Diagnostic Steps

### Step 1: Identify the Bottleneck

Determine which layer is causing the performance issue:

| Layer | Symptoms | Investigation Tool |
|-------|----------|-------------------|
| Frontend | Slow render, janky UI | Browser DevTools |
| Network | High TTFB, slow assets | Network tab, CDN dashboard |
| API | Slow API responses | APM, server logs |
| Database | Slow queries | Database monitoring |
| External Services | Timeouts to 3rd parties | Service status pages |

### Step 2: Frontend Investigation

```bash
# Check bundle size
npm run build -- --analyze

# Review build output
ls -la dist/assets/*.js | sort -k5 -n
```

**Browser DevTools Checks:**

1. **Network Tab**
   - Sort by time/size
   - Look for waterfall bottlenecks
   - Check for large assets (>200KB)

2. **Performance Tab**
   - Record page load
   - Look for long tasks (>50ms)
   - Check for layout thrashing

3. **React DevTools (Profiler)**
   - Record component renders
   - Identify expensive components
   - Look for unnecessary re-renders

### Step 3: API Investigation

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://app-psi-tawny.vercel.app/api/health

# Sample curl-format.txt:
# time_namelookup: %{time_namelookup}s
# time_connect: %{time_connect}s
# time_appconnect: %{time_appconnect}s
# time_pretransfer: %{time_pretransfer}s
# time_redirect: %{time_redirect}s
# time_starttransfer: %{time_starttransfer}s
# time_total: %{time_total}s
```

**APM Dashboard Checks:**

1. Identify slowest endpoints
2. Check database query times
3. Look for N+1 queries
4. Review connection pool usage

### Step 4: Database Investigation

```sql
-- Check slow queries (PostgreSQL)
SELECT
  query,
  calls,
  mean_time,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Check missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

### Step 5: External Service Check

Check status pages for dependencies:
- Vercel Status: https://www.vercel-status.com/
- Solana Status: https://status.solana.com/
- Database provider status page

---

## Resolution Steps

### Frontend Optimizations

1. **Bundle Size Reduction**
   ```bash
   # Analyze bundle
   npm run build -- --analyze

   # Check for large dependencies
   npx source-map-explorer dist/assets/*.js
   ```

2. **Code Splitting**
   ```typescript
   // Lazy load routes
   const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
   ```

3. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Use appropriate sizes

4. **Caching Strategy**
   ```typescript
   // Add cache headers in Vercel config
   // vercel.json
   {
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
         ]
       }
     ]
   }
   ```

### API Optimizations

1. **Add Caching**
   ```typescript
   // Redis caching example
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const data = await fetchFromDatabase();
   await redis.setex(cacheKey, 300, JSON.stringify(data));
   return data;
   ```

2. **Database Query Optimization**
   ```sql
   -- Add missing index
   CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at);

   -- Use EXPLAIN ANALYZE
   EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 'xxx';
   ```

3. **Connection Pool Tuning**
   ```typescript
   // Increase pool size if needed
   const pool = new Pool({
     max: 20, // Increase from default 10
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Infrastructure Scaling

1. **Vercel Edge Functions**
   - Move compute-heavy operations to edge
   - Use edge caching for static data

2. **Database Scaling**
   - Enable read replicas
   - Increase instance size
   - Add connection pooling (PgBouncer)

3. **CDN Optimization**
   - Ensure CDN is configured
   - Check cache hit rates
   - Purge stale cache if needed

### Emergency Mitigations

If immediate relief is needed:

1. **Enable Maintenance Mode**
   - Reduce load by showing static page
   - Allow time for investigation

2. **Disable Non-Critical Features**
   ```typescript
   // Feature flag to disable heavy features
   if (process.env.DEGRADED_MODE === 'true') {
     return { features: { analytics: false, realtime: false } };
   }
   ```

3. **Increase Rate Limits**
   - Temporarily reduce allowed requests
   - Protect backend from overload

---

## Verification Steps

After implementing fixes:

### Immediate Verification (0-5 minutes)

- [ ] Page load time improved (check DevTools)
- [ ] API response times normalized (check APM)
- [ ] No new errors introduced

### Short-Term Verification (5-30 minutes)

- [ ] Core Web Vitals within acceptable range
- [ ] Error rates stable or decreasing
- [ ] User reports stopped

### Monitoring Checklist

```bash
# Run Lighthouse audit
npx lighthouse https://app-psi-tawny.vercel.app --output=json --output-path=./lighthouse-report.json

# Check Web Vitals
# Review Real User Monitoring (RUM) data in analytics
```

---

## Post-Incident Tasks

### Immediate (Within 1 hour)

- [ ] Document changes made
- [ ] Update monitoring thresholds if needed
- [ ] Notify team of resolution

### Short-Term (Within 1 week)

- [ ] Schedule performance review
- [ ] Implement permanent fixes (if emergency mitigations used)
- [ ] Add performance regression tests
- [ ] Update capacity planning

### Performance Budget

Establish and enforce performance budgets:

| Metric | Budget | Current |
|--------|--------|---------|
| LCP | < 2.5s | [Measure] |
| FID | < 100ms | [Measure] |
| CLS | < 0.1 | [Measure] |
| Bundle Size (gzipped) | < 200KB | [Measure] |
| API p95 | < 200ms | [Measure] |

---

## Common Performance Issues

### Issue: Slow Initial Load

**Symptoms**: High TTFB, large bundle size
**Solution**:
- Enable code splitting
- Optimize bundle size
- Use preload for critical assets

### Issue: Slow API Responses

**Symptoms**: API latency > 500ms
**Solution**:
- Add database indexes
- Implement caching
- Optimize queries

### Issue: Memory Leaks

**Symptoms**: Performance degrades over time
**Solution**:
- Check for uncleared intervals/timeouts
- Verify event listener cleanup
- Review state management

### Issue: Third-Party Script Blocking

**Symptoms**: Delayed interactivity
**Solution**:
- Load third-party scripts async
- Use facade patterns
- Defer non-critical scripts

---

## Related Runbooks

- [Incident Response](./INCIDENT_RESPONSE.md)
- [Database Issues](./DATABASE_ISSUES.md)
- [Error Investigation](./ERROR_INVESTIGATION.md)

---

*Last reviewed: 2026-01-28*
