# Incident Response Runbook

> **Issue**: #128
> **Last Updated**: 2026-01-28
> **Purpose**: General incident response procedures for all severity levels

---

## Problem Description

This runbook covers the general incident response process for any production issue affecting the Doomsday platform, including:

- Service outages (full or partial)
- Security incidents
- Data breaches or integrity issues
- Performance degradation
- Third-party service failures
- Smart contract exploits

---

## Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| SEV1 | Critical | Complete service outage, security breach, data loss | 15 min | Site down, smart contract exploit, database corruption |
| SEV2 | High | Major feature broken, significant performance impact | 30 min | Authentication failing, payments not processing |
| SEV3 | Medium | Minor feature broken, degraded experience | 2 hours | Single API endpoint failing, UI bug affecting some users |
| SEV4 | Low | Cosmetic issues, minor bugs | 24 hours | Styling issues, non-critical errors |

---

## Detection Methods

### Automated Alerting

1. **Monitoring Systems**
   - Uptime monitoring (Pingdom/UptimeRobot)
   - Error tracking (Sentry)
   - Performance monitoring (DataDog/New Relic)
   - Log aggregation alerts

2. **Infrastructure Alerts**
   - Vercel deployment failures
   - Database connection alerts
   - SSL certificate expiry warnings
   - Rate limiting triggers

3. **Blockchain Monitoring**
   - Smart contract event monitoring
   - Oracle heartbeat failures
   - Unusual transaction patterns

### Manual Detection

- User reports via support channels
- Social media monitoring
- Community Discord/Telegram alerts
- Internal testing discovery

---

## Incident Response Process

### Phase 1: Detection and Triage (0-5 minutes)

1. **Acknowledge the Alert**
   ```
   Respond in #incidents Slack channel:
   "Acknowledged - [Your Name] investigating [Brief Description]"
   ```

2. **Initial Assessment**
   - What is the symptom?
   - When did it start?
   - What is the scope of impact?
   - Is this a known issue?

3. **Assign Severity Level**
   - Use severity matrix above
   - When in doubt, escalate to higher severity

4. **Start Incident Log**
   ```markdown
   ## Incident: [Brief Title]
   **Severity**: SEV[X]
   **Incident Commander**: [Name]
   **Start Time**: [UTC Time]

   ### Timeline
   - [TIME] - Incident detected via [source]
   - [TIME] - [Action taken]
   ```

### Phase 2: Communication (5-10 minutes)

1. **Internal Notification**
   ```
   @channel SEV[X] Incident in progress
   Summary: [Brief description]
   Impact: [Who/what is affected]
   IC: [Incident Commander name]
   Status: Investigating
   ```

2. **Status Page Update** (SEV1/SEV2)
   - Update status.domain.com
   - Set component status to "Degraded" or "Major Outage"
   - Post initial message: "We are investigating reports of [issue]"

3. **Customer Communication** (SEV1)
   - Draft holding statement for support team
   - Prepare social media response if needed

### Phase 3: Investigation (10-30 minutes)

1. **Gather Information**
   ```bash
   # Check recent deployments
   vercel ls

   # Review recent commits
   git log --oneline -20

   # Check error logs
   # Access Sentry dashboard

   # Check infrastructure status
   # Review Vercel/hosting dashboard
   ```

2. **Identify Scope**
   - Which users are affected?
   - Which features are broken?
   - Is it getting worse or stable?

3. **Form Hypothesis**
   - Recent deployment?
   - External dependency failure?
   - Traffic spike?
   - Attack/security issue?

### Phase 4: Mitigation (Variable)

1. **Choose Mitigation Strategy**

   | Issue Type | Mitigation |
   |------------|------------|
   | Bad deployment | [Rollback](./DEPLOYMENT_ROLLBACK.md) |
   | Performance | Scale up, enable caching |
   | External dependency | Enable fallback, disable feature |
   | Security | Block IPs, enable maintenance mode |
   | Database | Failover, connection pool adjustment |

2. **Execute Mitigation**
   - Follow relevant runbook
   - Document all actions in incident log
   - Communicate progress every 15 minutes

3. **Verify Mitigation**
   - Confirm metrics improving
   - Test affected functionality
   - Monitor for 15 minutes minimum

### Phase 5: Resolution (After Mitigation)

1. **Confirm Resolution**
   - [ ] Error rates returned to normal
   - [ ] Performance metrics normalized
   - [ ] User reports stopped
   - [ ] All affected functionality verified

2. **Update Status Page**
   - Set status to "Operational"
   - Post resolution message

3. **Internal Announcement**
   ```
   @channel Incident Resolved
   Duration: [X minutes/hours]
   Root Cause: [Brief summary]
   Resolution: [What fixed it]
   Post-mortem scheduled: [Date/Time]
   ```

### Phase 6: Post-Incident (Within 48 hours)

1. **Create Incident Report**
   - Use post-mortem template below
   - Gather timeline from all participants

2. **Schedule Post-Mortem**
   - SEV1: Within 24 hours
   - SEV2: Within 48 hours
   - SEV3+: Weekly review

3. **Track Action Items**
   - Create GitHub issues for each action item
   - Assign owners and due dates
   - Add to project board

---

## Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

**Date**: [YYYY-MM-DD]
**Duration**: [Start Time] - [End Time] ([Duration])
**Severity**: SEV[X]
**Incident Commander**: [Name]

## Summary
[2-3 sentences describing what happened and the impact]

## Impact
- Users affected: [Number/Percentage]
- Features affected: [List]
- Revenue impact: [If applicable]
- Data impact: [If applicable]

## Timeline (All times UTC)
| Time | Event |
|------|-------|
| HH:MM | [Event description] |
| HH:MM | [Event description] |

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What actions were taken to resolve the incident]

## What Went Well
- [Item]
- [Item]

## What Could Be Improved
- [Item]
- [Item]

## Action Items
| Item | Owner | Due Date | Status |
|------|-------|----------|--------|
| [Action] | [Name] | [Date] | [ ] |
| [Action] | [Name] | [Date] | [ ] |

## Lessons Learned
[Key takeaways to prevent similar incidents]
```

---

## Communication Templates

### Status Page - Investigating
```
We are currently investigating reports of [brief issue description].
Our team is actively working on identifying and resolving the issue.
We will provide updates as more information becomes available.
```

### Status Page - Identified
```
We have identified the cause of [issue]. Our team is implementing
a fix. We expect services to be restored within [time estimate].
```

### Status Page - Resolved
```
The issue affecting [feature/service] has been resolved.
All services are now operating normally. We apologize for
any inconvenience and will be conducting a thorough review
to prevent future occurrences.
```

### Support Team Script
```
Thank you for reaching out. We are aware of [issue] and our team
is actively working to resolve it. You can monitor our status page
at [URL] for the latest updates. We apologize for any inconvenience
and appreciate your patience.
```

---

## Escalation Matrix

| Severity | Initial Response | 10 min No Progress | 30 min No Progress |
|----------|-----------------|-------------------|-------------------|
| SEV1 | On-call engineer | Engineering Lead + CTO | Executive team |
| SEV2 | On-call engineer | Engineering Lead | CTO if customer-facing |
| SEV3 | On-call engineer | Engineering Lead | - |
| SEV4 | Ticket queue | On-call engineer | - |

See [ONCALL.md](../ONCALL.md) for contact information.

---

## Related Runbooks

- [Deployment Rollback](./DEPLOYMENT_ROLLBACK.md)
- [Performance Issues](./PERFORMANCE_ISSUES.md)
- [Error Investigation](./ERROR_INVESTIGATION.md)
- [Database Issues](./DATABASE_ISSUES.md)

---

*Last reviewed: 2026-01-28*
