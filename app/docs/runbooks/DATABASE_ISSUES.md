# Database Issues Runbook

> **Issue**: #128
> **Last Updated**: 2026-01-28
> **Severity**: High to Critical
> **Estimated Resolution Time**: 15 minutes to several hours

---

## Problem Description

This runbook covers database-related issues including:

- Connection failures
- Query timeouts and slow queries
- Replication lag
- Storage issues
- Data corruption
- Migration failures
- High CPU/memory usage

---

## Detection Methods

### Automated Detection

1. **Connection Monitoring**
   - Database connection pool exhaustion alerts
   - Connection timeout alerts
   - Health check endpoint failures

2. **Performance Monitoring**
   - Query latency > 200ms (p95)
   - Connection pool usage > 80%
   - CPU usage > 80%
   - Memory usage > 80%
   - Disk usage > 80%

3. **Replication Monitoring**
   - Replication lag > 30 seconds
   - Replica sync failures

### Manual Detection

1. **Application Symptoms**
   - API timeouts
   - Inconsistent data
   - Failed transactions

2. **User Reports**
   - Data not saving
   - Slow page loads
   - Missing data

---

## Diagnostic Steps

### Step 1: Check Database Status

```bash
# Check if database is accessible
pg_isready -h <host> -p 5432

# Connect and check version/uptime
psql -c "SELECT version();"
psql -c "SELECT pg_postmaster_start_time();"
```

### Step 2: Check Connection Pool

```sql
-- Current connections
SELECT
  count(*) as total,
  state,
  usename
FROM pg_stat_activity
GROUP BY state, usename
ORDER BY total DESC;

-- Maximum connections
SHOW max_connections;

-- Connection age (long-running connections)
SELECT
  pid,
  usename,
  application_name,
  state,
  age(clock_timestamp(), query_start) as query_age,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

### Step 3: Check Query Performance

```sql
-- Enable query stats (if not already)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slowest queries by mean time
SELECT
  query,
  calls,
  mean_time,
  total_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Queries with most total time
SELECT
  query,
  calls,
  mean_time,
  total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Currently running queries
SELECT
  pid,
  age(clock_timestamp(), query_start) as duration,
  query,
  state
FROM pg_stat_activity
WHERE query != '<IDLE>'
  AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

### Step 4: Check Disk Usage

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- Index sizes
SELECT
  indexrelname as index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

### Step 5: Check Locks

```sql
-- Current locks
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity
  ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## Resolution Steps

### Issue: Connection Pool Exhausted

**Symptoms**: "Too many connections", connection timeouts

**Immediate Mitigation:**

```sql
-- Kill idle connections older than 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '10 minutes'
  AND usename != 'postgres';
```

**Permanent Fix:**

```typescript
// Increase pool size in application
const pool = new Pool({
  max: 30, // Increase from default
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Use connection pooler (PgBouncer)
// Update connection string to use PgBouncer
```

### Issue: Slow Queries

**Symptoms**: High query latency, API timeouts

**Immediate Mitigation:**

```sql
-- Kill long-running queries (use with caution)
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '5 minutes';
```

**Analysis and Fix:**

```sql
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM posts WHERE user_id = 'xxx' ORDER BY created_at DESC LIMIT 50;

-- Add missing index
CREATE INDEX CONCURRENTLY idx_posts_user_created
ON posts(user_id, created_at DESC);

-- Update table statistics
ANALYZE posts;
```

### Issue: High CPU Usage

**Symptoms**: Database CPU > 80%, slow queries

**Investigation:**

```sql
-- Find CPU-intensive queries
SELECT
  query,
  calls,
  total_time / calls as avg_time,
  rows / calls as avg_rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Fixes:**

1. Optimize expensive queries
2. Add appropriate indexes
3. Scale up database instance
4. Implement read replicas for read-heavy workloads

### Issue: High Memory Usage

**Symptoms**: Database memory > 80%, OOM errors

**Investigation:**

```sql
-- Check memory settings
SHOW shared_buffers;
SHOW work_mem;
SHOW maintenance_work_mem;
```

**Fixes:**

1. Tune memory parameters
2. Optimize queries using excessive memory
3. Scale up database instance

### Issue: Disk Space Running Low

**Symptoms**: Disk usage > 80%, write errors

**Immediate Mitigation:**

```sql
-- Find and remove bloat
VACUUM FULL ANALYZE;

-- Find large tables for cleanup
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Archive or delete old data
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days';
```

**Permanent Fix:**

1. Implement data retention policies
2. Archive old data to cold storage
3. Increase disk allocation
4. Set up monitoring alerts at 70% threshold

### Issue: Replication Lag

**Symptoms**: Read replicas behind, inconsistent reads

**Investigation:**

```sql
-- Check replication status (on primary)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) as lag_bytes
FROM pg_stat_replication;
```

**Fixes:**

1. Check replica resources (CPU, I/O)
2. Increase wal_keep_segments
3. Check network latency
4. Scale up replica instance

### Issue: Lock Contention

**Symptoms**: Queries waiting, deadlocks

**Immediate Mitigation:**

```sql
-- Kill blocking queries
SELECT pg_terminate_backend(<blocking_pid>);
```

**Permanent Fix:**

1. Review transaction isolation levels
2. Reduce transaction scope
3. Add appropriate indexes
4. Implement optimistic locking

### Issue: Migration Failure

**Symptoms**: Migration script failed, schema in inconsistent state

**Recovery Steps:**

```bash
# 1. Check migration status
diesel migration list

# 2. If partial migration, rollback
diesel migration revert

# 3. Fix migration script

# 4. Re-run migration in staging first
diesel migration run --database-url="staging_url"

# 5. Run in production during maintenance window
diesel migration run --database-url="production_url"
```

---

## Verification Steps

After resolving issue:

### Immediate Verification (0-5 minutes)

- [ ] Database is accessible
- [ ] Connections are working
- [ ] Basic queries execute successfully
- [ ] Application health checks passing

### Short-Term Verification (5-30 minutes)

- [ ] Query latency returned to normal
- [ ] Connection pool stable
- [ ] No new errors in logs
- [ ] Replication caught up (if applicable)

### Verification Queries

```sql
-- Verify health
SELECT 1;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check for long-running queries
SELECT count(*) FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '1 minute';

-- Check disk usage
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## Post-Incident Tasks

### Immediate (Within 1 hour)

- [ ] Document what happened and resolution
- [ ] Update monitoring thresholds if needed
- [ ] Notify team of resolution

### Short-Term (Within 1 week)

- [ ] Review and optimize slow queries
- [ ] Add missing indexes
- [ ] Update alerting thresholds
- [ ] Review connection pool settings

### Database Health Checklist

Run these checks weekly:

- [ ] Disk usage < 70%
- [ ] Connection pool usage < 70%
- [ ] No queries consistently > 500ms
- [ ] Table bloat < 20%
- [ ] Indexes are being used
- [ ] Backups verified

---

## Backup and Recovery

### Verify Backup Status

```bash
# Check latest backup (provider-specific)
# AWS RDS: Check automated backup status in console
# Supabase: Check dashboard for backup status
```

### Point-in-Time Recovery

**Warning**: This will cause downtime and potential data loss.

1. **Notify team and users**
2. **Pause application** (maintenance mode)
3. **Initiate recovery** (provider-specific)
4. **Verify data integrity**
5. **Resume application**
6. **Document recovery**

### Manual Backup

```bash
# Create manual backup (if direct access available)
pg_dump -h <host> -U <user> -d <database> -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restore from backup
pg_restore -h <host> -U <user> -d <database> -c backup.dump
```

---

## Escalation

Database issues often require immediate attention:

1. **Connection issues**: On-call engineer + DB admin
2. **Data corruption**: Immediately escalate to engineering lead
3. **Security breach**: Immediately escalate to security + CTO

See [ONCALL.md](../ONCALL.md) for contact information.

---

## Related Runbooks

- [Incident Response](./INCIDENT_RESPONSE.md)
- [Performance Issues](./PERFORMANCE_ISSUES.md)
- [Error Investigation](./ERROR_INVESTIGATION.md)
- [Deployment Rollback](./DEPLOYMENT_ROLLBACK.md)

---

*Last reviewed: 2026-01-28*
