# Deployment Rollback Runbook

> **Issue**: #128
> **Last Updated**: 2026-01-28
> **Severity**: Critical
> **Estimated Resolution Time**: 10-30 minutes

---

## Problem Description

A deployment has introduced issues that require rolling back to a previous stable version. This may include:

- Critical bugs affecting user experience
- Performance degradation
- Security vulnerabilities
- Data integrity issues
- Smart contract issues (limited rollback capability)

---

## Detection Methods

### Automated Detection

1. **Error Rate Spike**
   - Sentry alerts showing >5% error rate
   - API error rate exceeding threshold in monitoring dashboard

2. **Performance Degradation**
   - Response time p95 > 2 seconds
   - Core Web Vitals failing (LCP > 2.5s, FID > 100ms)

3. **Health Check Failures**
   - Uptime monitoring alerts (Pingdom/UptimeRobot)
   - Kubernetes health probe failures

4. **User Reports**
   - Support ticket surge
   - Social media mentions of issues
   - Discord/community alerts

### Manual Detection

1. Check deployment logs in Vercel dashboard
2. Review recent commits in the deployed version
3. Compare error rates before/after deployment

---

## Pre-Rollback Checklist

Before initiating rollback, confirm:

- [ ] Issue is confirmed and reproducible
- [ ] Issue is related to the recent deployment (not external)
- [ ] Rollback is approved by on-call lead or engineering manager
- [ ] Team is notified in #incidents Slack channel
- [ ] Status page updated to reflect ongoing incident

---

## Step-by-Step Resolution

### Option 1: Vercel Instant Rollback (Recommended)

Vercel maintains previous deployment snapshots, making rollback instant.

```bash
# 1. List recent deployments
vercel ls

# 2. Find the last known good deployment
# Look for deployments before the problematic one

# 3. Promote the previous deployment to production
vercel promote <deployment-url> --yes

# Example:
vercel promote doomsday-abc123.vercel.app --yes
```

**Via Vercel Dashboard:**

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the Doomsday project
3. Go to "Deployments" tab
4. Find the last stable deployment
5. Click "..." menu > "Promote to Production"

### Option 2: Git Revert and Redeploy

If you need to persist the rollback in git history:

```bash
# 1. Identify the commit to revert
git log --oneline -10

# 2. Revert the problematic commit(s)
git revert <commit-hash>

# 3. Push to trigger new deployment
git push origin main
```

### Option 3: Tag-Based Rollback

For major version rollbacks:

```bash
# 1. List available tags
git tag -l

# 2. Checkout the last stable tag
git checkout tags/v1.2.3

# 3. Create a hotfix branch
git checkout -b hotfix/rollback-v1.2.3

# 4. Merge to main (will trigger deployment)
git checkout main
git merge hotfix/rollback-v1.2.3
git push origin main
```

### Database Rollback (If Needed)

**Warning**: Database rollbacks can cause data loss. Proceed with extreme caution.

```bash
# 1. Pause the application to prevent new writes
# (Update Vercel environment to maintenance mode)

# 2. Identify the backup to restore from
# Check backup service (e.g., AWS RDS snapshots)

# 3. Restore from backup
# Follow provider-specific instructions

# 4. Verify data integrity

# 5. Resume application
```

### Smart Contract Rollback (Limited)

Smart contracts are immutable. Options include:

1. **Pause mechanism**: If implemented, pause contract operations
2. **Proxy upgrade**: Deploy new implementation via proxy pattern
3. **Migration**: Deploy new contract and migrate users

---

## Verification Steps

After rollback, verify the following:

### Immediate Checks (0-5 minutes)

- [ ] Application loads successfully
- [ ] Login/authentication works
- [ ] Core user flows functional (create post, view feed)
- [ ] No new errors in Sentry
- [ ] Health check endpoints returning 200

### Short-Term Checks (5-30 minutes)

- [ ] Error rate returned to baseline
- [ ] Response times normalized
- [ ] Database connections stable
- [ ] No user complaints about new issues

### Verification Commands

```bash
# Check application health
curl -I https://app-psi-tawny.vercel.app/api/health

# Check error rate in last 10 minutes
# (Use Sentry API or dashboard)

# Verify deployment version
curl https://app-psi-tawny.vercel.app/api/version
```

---

## Post-Incident Tasks

### Immediate (Within 1 hour)

- [ ] Update status page: "Resolved"
- [ ] Notify team in #incidents channel
- [ ] Document incident timeline
- [ ] Create incident ticket for tracking

### Short-Term (Within 24 hours)

- [ ] Schedule post-mortem meeting
- [ ] Identify root cause of the issue
- [ ] Document lessons learned
- [ ] Create tickets for preventive measures

### Post-Mortem Template

```markdown
## Incident Summary
- Date/Time:
- Duration:
- Severity:
- Impact:

## Timeline
- [TIME] - Issue detected
- [TIME] - Rollback initiated
- [TIME] - Rollback completed
- [TIME] - Incident resolved

## Root Cause
[Description of what caused the issue]

## Resolution
[How the issue was resolved]

## Action Items
- [ ] Item 1 - Owner - Due Date
- [ ] Item 2 - Owner - Due Date
```

---

## Escalation

If rollback fails or issues persist:

1. **Level 1**: On-call engineer (immediate)
2. **Level 2**: Engineering lead (5 min no resolution)
3. **Level 3**: CTO/Founder (15 min no resolution, critical impact)

See [ONCALL.md](../ONCALL.md) for contact information.

---

## Related Runbooks

- [Incident Response](./INCIDENT_RESPONSE.md)
- [Performance Issues](./PERFORMANCE_ISSUES.md)
- [Error Investigation](./ERROR_INVESTIGATION.md)

---

*Last reviewed: 2026-01-28*
