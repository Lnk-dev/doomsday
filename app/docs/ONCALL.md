# On-Call Guide

> **Issue**: #128
> **Last Updated**: 2026-01-28
> **Purpose**: Guide for on-call engineers

---

## On-Call Responsibilities

As an on-call engineer, you are responsible for:

1. **Monitoring**: Keep an eye on alerts and dashboards
2. **First Response**: Acknowledge and triage incoming incidents
3. **Communication**: Keep stakeholders informed during incidents
4. **Resolution**: Drive incidents to resolution or escalate appropriately
5. **Documentation**: Document incidents and post-mortems
6. **Handoff**: Brief the next on-call engineer during rotation

---

## On-Call Rotation

### Schedule

| Week | Primary On-Call | Secondary On-Call |
|------|-----------------|-------------------|
| Week 1 | [Engineer A] | [Engineer B] |
| Week 2 | [Engineer B] | [Engineer C] |
| Week 3 | [Engineer C] | [Engineer A] |
| ... | ... | ... |

*Update this table with actual team members*

### Rotation Rules

- Primary on-call is the first responder
- Secondary on-call is backup and assists with major incidents
- Rotation changes every Monday at 9:00 AM UTC
- Handoff meeting every Monday at 9:30 AM UTC
- Swaps require 48-hour notice and manager approval

### On-Call Compensation

*Define your organization's on-call compensation policy here*

---

## Contact Information

### Team Contacts

| Role | Name | Phone | Slack | Email |
|------|------|-------|-------|-------|
| Primary On-Call | [Current] | [Phone] | @[handle] | [email] |
| Secondary On-Call | [Current] | [Phone] | @[handle] | [email] |
| Engineering Lead | [Name] | [Phone] | @[handle] | [email] |
| CTO | [Name] | [Phone] | @[handle] | [email] |
| DevOps Lead | [Name] | [Phone] | @[handle] | [email] |

*Update with actual contact information*

### External Contacts

| Service | Support URL | Support Email | Phone |
|---------|-------------|---------------|-------|
| Vercel | vercel.com/help | support@vercel.com | N/A |
| Sentry | sentry.io/support | support@sentry.io | N/A |
| Database Provider | [URL] | [Email] | [Phone] |
| Domain/DNS | [URL] | [Email] | [Phone] |
| CDN | [URL] | [Email] | [Phone] |

*Update with actual vendor contacts*

---

## Severity Levels and SLAs

### Severity Definitions

| Level | Name | Description | Examples |
|-------|------|-------------|----------|
| **SEV1** | Critical | Complete service outage, data loss, security breach | Site down, smart contract exploit, database corruption |
| **SEV2** | High | Major feature broken, significant user impact | Authentication failing, payments not processing, data not saving |
| **SEV3** | Medium | Minor feature broken, limited user impact | Single API endpoint failing, UI bug affecting some users |
| **SEV4** | Low | Cosmetic issues, edge cases | Styling issues, non-critical errors |

### Response Time SLAs

| Severity | Acknowledgment | Update Frequency | Resolution Target |
|----------|----------------|------------------|-------------------|
| SEV1 | 5 minutes | Every 15 minutes | 1 hour |
| SEV2 | 15 minutes | Every 30 minutes | 4 hours |
| SEV3 | 2 hours | Every 2 hours | 24 hours |
| SEV4 | 24 hours | Daily | 1 week |

### Escalation Timeframes

| Severity | No Progress After | Escalate To |
|----------|-------------------|-------------|
| SEV1 | 15 minutes | Engineering Lead + CTO |
| SEV2 | 30 minutes | Engineering Lead |
| SEV3 | 2 hours | Engineering Lead |
| SEV4 | 24 hours | On-call engineer |

---

## Escalation Procedures

### When to Escalate

Escalate immediately if:

- [ ] Issue is beyond your expertise
- [ ] No progress after SLA timeframe
- [ ] Issue affects security or data integrity
- [ ] Customer/business impact is severe
- [ ] You need additional resources or approvals

### How to Escalate

1. **Document Current Status**
   ```
   Summary: [Brief description]
   Severity: SEV[X]
   Duration: [Time since detection]
   Actions Taken: [What you've tried]
   Current Status: [Where things stand]
   ```

2. **Contact Escalation Target**
   - First: Slack message with @mention
   - After 5 minutes: Phone call
   - After 10 minutes: Next escalation level

3. **Hand Off Context**
   - Share incident log link
   - Brief on current state
   - Transfer incident commander role if appropriate

### Escalation Path

```
On-Call Engineer
       |
       v
Secondary On-Call (assist with SEV1/SEV2)
       |
       v
Engineering Lead
       |
       v
CTO/Founder (SEV1 only)
       |
       v
External Support (as needed)
```

---

## On-Call Toolkit

### Access Requirements

Before going on-call, ensure you have:

- [ ] Vercel dashboard access (deployment, logs)
- [ ] Sentry access (error tracking)
- [ ] Database access (read-only minimum)
- [ ] Monitoring dashboards access
- [ ] Status page admin access
- [ ] Slack/communication channels
- [ ] VPN access (if required)
- [ ] GitHub repository access
- [ ] PagerDuty/alerting access

### Key Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Vercel | vercel.com/dashboard | Deployments, logs |
| Sentry | sentry.io | Error tracking |
| Status Page | status.[domain].com | Public status |
| APM | [URL] | Performance monitoring |
| Uptime | [URL] | Uptime monitoring |

*Update with actual URLs*

### Key Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs --follow

# Rollback deployment
vercel promote <previous-deployment-url>

# Check git history
git log --oneline -20

# Run health check
curl -I https://app-psi-tawny.vercel.app/api/health
```

---

## Incident Workflow

### 1. Alert Received

```
[ ] Acknowledge alert in monitoring system
[ ] Post in #incidents: "Investigating [brief description]"
[ ] Start incident log (copy template below)
```

### 2. Triage

```
[ ] Determine severity level
[ ] Assess user impact
[ ] Check for recent deployments
[ ] Check external dependencies
```

### 3. Communicate

```
[ ] Update #incidents channel
[ ] Update status page (SEV1/SEV2)
[ ] Notify relevant stakeholders
```

### 4. Resolve

```
[ ] Follow relevant runbook
[ ] Apply fix or mitigation
[ ] Verify resolution
[ ] Monitor for recurrence
```

### 5. Close Out

```
[ ] Update status page to resolved
[ ] Post resolution in #incidents
[ ] Create post-mortem ticket
[ ] Update runbooks if needed
```

### Incident Log Template

```markdown
## Incident: [Brief Title]

**Severity**: SEV[X]
**Incident Commander**: [Your Name]
**Start Time**: [UTC Time]
**Status**: Investigating / Mitigating / Resolved

### Impact
[Who/what is affected]

### Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Incident detected |
| HH:MM | [Action taken] |

### Actions Taken
- [Action 1]
- [Action 2]

### Resolution
[How it was resolved]

### Follow-Up
- [ ] Post-mortem scheduled
- [ ] Action items created
```

---

## Runbook Quick Reference

| Issue | Runbook | Priority |
|-------|---------|----------|
| Bad deployment | [Deployment Rollback](./runbooks/DEPLOYMENT_ROLLBACK.md) | High |
| Any incident | [Incident Response](./runbooks/INCIDENT_RESPONSE.md) | All |
| Slow performance | [Performance Issues](./runbooks/PERFORMANCE_ISSUES.md) | Medium |
| Application errors | [Error Investigation](./runbooks/ERROR_INVESTIGATION.md) | Variable |
| Database problems | [Database Issues](./runbooks/DATABASE_ISSUES.md) | High |

---

## Handoff Checklist

### End of On-Call Rotation

Before handing off to the next on-call:

- [ ] Review open incidents
- [ ] Check for ongoing issues or concerns
- [ ] Document any known problems
- [ ] Brief incoming on-call on current state
- [ ] Transfer PagerDuty/alerting responsibility
- [ ] Update rotation schedule if needed

### Handoff Meeting Agenda

1. Open incidents (if any)
2. Recent incidents and resolutions
3. Known issues or concerns
4. Infrastructure changes this week
5. Upcoming deployments or maintenance
6. Questions from incoming on-call

---

## On-Call Best Practices

### Do's

- Acknowledge alerts promptly
- Communicate early and often
- Document everything in the incident log
- Escalate when needed - no heroes
- Follow runbooks
- Verify fixes work before closing
- Conduct blameless post-mortems

### Don'ts

- Don't ignore alerts
- Don't make changes without documenting
- Don't go silent during incidents
- Don't forget to update status page
- Don't skip post-mortems
- Don't forget to hand off

### Self-Care

- Take breaks during long incidents
- Hand off if you're exhausted
- Use secondary on-call for assistance
- Take compensatory time off after intense incidents
- Flag if on-call is becoming too burdensome

---

## Emergency Procedures

### Complete Outage

1. Immediately escalate to Engineering Lead
2. Post on status page: "Major Outage"
3. Begin diagnostics (check Vercel, database, DNS)
4. If deployment-related, initiate rollback
5. Update stakeholders every 15 minutes

### Security Incident

1. Immediately escalate to Engineering Lead + CTO
2. Do NOT post details publicly
3. Preserve evidence (logs, access records)
4. Contain the threat if possible
5. Engage security response team

### Data Loss/Corruption

1. Immediately escalate to Engineering Lead
2. Stop writes to affected data
3. Assess extent of damage
4. Begin recovery from backups
5. Document impact for post-mortem

---

*This document should be reviewed and updated quarterly.*

*Last reviewed: 2026-01-28*
