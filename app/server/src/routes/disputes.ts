import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  events,
  disputes,
  resolutionEvidence,
  users,
  eventDeadlines,
} from '../db/schema'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { createDisputeSchema, addDisputeEvidenceSchema } from '../lib/validators'
import {
  isWithinDisputeWindow,
  getMinimumDisputeStake,
} from '../lib/resolution/resolutionService'

const disputesRouter = new Hono()

// Create a dispute for an event
disputesRouter.post('/events/:id/disputes', requireAuth, zValidator('json', createDisputeSchema), async (c) => {
  const eventId = c.req.param('id')
  const userId = c.get('userId')
  const { reason, evidence, stakeAmount } = c.req.valid('json')

  // Get event
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) {
    return c.json({ error: 'Event not found' }, 404)
  }

  // Check if resolution has been proposed
  if (!event.proposedAt) {
    return c.json({ error: 'Event has not been resolved yet' }, 400)
  }

  // Check if within dispute window
  if (!isWithinDisputeWindow(event.proposedAt)) {
    return c.json({ error: 'Dispute window has closed' }, 400)
  }

  // Check if user already has an active dispute
  const existingDispute = await db.query.disputes.findFirst({
    where: and(
      eq(disputes.eventId, eventId),
      eq(disputes.disputerId, userId),
      eq(disputes.status, 'open')
    ),
  })
  if (existingDispute) {
    return c.json({ error: 'You already have an active dispute for this event' }, 400)
  }

  // Calculate minimum stake
  const totalPool = (event.totalDoomStake ?? 0) + (event.totalLifeStake ?? 0)
  const minStake = getMinimumDisputeStake(totalPool)
  if (stakeAmount < minStake) {
    return c.json({ error: `Minimum stake is ${minStake} DOOM for this event` }, 400)
  }

  // Check user balance
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user || (user.doomBalance ?? 0) < stakeAmount) {
    return c.json({ error: 'Insufficient balance' }, 400)
  }

  // Create dispute
  const [dispute] = await db.insert(disputes).values({
    eventId,
    disputerId: userId,
    stakeAmount,
    reason,
    evidence: evidence ? JSON.stringify(evidence) : null,
    status: 'open',
  }).returning()

  // Deduct stake from user
  await db.update(users).set({
    doomBalance: sql`${users.doomBalance} - ${stakeAmount}`,
  }).where(eq(users.id, userId))

  return c.json({ dispute }, 201)
})

// List disputes for an event
disputesRouter.get('/events/:id/disputes', optionalAuth, async (c) => {
  const eventId = c.req.param('id')

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const eventDisputes = await db.select({
    id: disputes.id,
    stakeAmount: disputes.stakeAmount,
    reason: disputes.reason,
    evidence: disputes.evidence,
    status: disputes.status,
    outcome: disputes.outcome,
    createdAt: disputes.createdAt,
    resolvedAt: disputes.resolvedAt,
    disputer: {
      id: users.id,
      username: users.username,
    },
  })
    .from(disputes)
    .innerJoin(users, eq(disputes.disputerId, users.id))
    .where(eq(disputes.eventId, eventId))

  // Parse evidence JSON
  const disputesWithEvidence = eventDisputes.map((d) => ({
    ...d,
    evidence: d.evidence ? JSON.parse(d.evidence) : [],
  }))

  return c.json({ disputes: disputesWithEvidence })
})

// Get dispute details
disputesRouter.get('/disputes/:id', optionalAuth, async (c) => {
  const disputeId = c.req.param('id')

  const disputeResult = await db.select({
    id: disputes.id,
    eventId: disputes.eventId,
    stakeAmount: disputes.stakeAmount,
    reason: disputes.reason,
    evidence: disputes.evidence,
    status: disputes.status,
    outcome: disputes.outcome,
    createdAt: disputes.createdAt,
    resolvedAt: disputes.resolvedAt,
    disputer: {
      id: users.id,
      username: users.username,
    },
  })
    .from(disputes)
    .innerJoin(users, eq(disputes.disputerId, users.id))
    .where(eq(disputes.id, disputeId))
    .limit(1)

  if (!disputeResult[0]) {
    return c.json({ error: 'Dispute not found' }, 404)
  }

  const dispute = disputeResult[0]

  // Get related event
  const event = await db.query.events.findFirst({
    where: eq(events.id, dispute.eventId),
  })

  // Get resolution evidence for the dispute
  const evidenceRecords = await db.select().from(resolutionEvidence)
    .where(eq(resolutionEvidence.eventId, dispute.eventId))

  return c.json({
    ...dispute,
    evidence: dispute.evidence ? JSON.parse(dispute.evidence) : [],
    event: event ? {
      id: event.id,
      title: event.title,
      proposedOutcome: event.proposedOutcome,
    } : null,
    resolutionEvidence: evidenceRecords,
  })
})

// Add evidence to a dispute
disputesRouter.post('/disputes/:id/evidence', requireAuth, zValidator('json', addDisputeEvidenceSchema), async (c) => {
  const disputeId = c.req.param('id')
  const userId = c.get('userId')
  const { evidenceType, content } = c.req.valid('json')

  // Get dispute
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.id, disputeId),
  })
  if (!dispute) {
    return c.json({ error: 'Dispute not found' }, 404)
  }

  // Only disputer can add evidence
  if (dispute.disputerId !== userId) {
    return c.json({ error: 'Only the disputer can add evidence' }, 403)
  }

  // Can only add evidence to open disputes
  if (dispute.status !== 'open' && dispute.status !== 'under_review') {
    return c.json({ error: 'Cannot add evidence to resolved disputes' }, 400)
  }

  // Add evidence
  const [evidence] = await db.insert(resolutionEvidence).values({
    eventId: dispute.eventId,
    submittedBy: userId,
    evidenceType,
    content,
  }).returning()

  return c.json({ evidence }, 201)
})

// Get dispute window status for an event
disputesRouter.get('/events/:id/dispute-window', optionalAuth, async (c) => {
  const eventId = c.req.param('id')

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const deadlines = await db.select().from(eventDeadlines)
    .where(eq(eventDeadlines.eventId, eventId)).limit(1)

  const totalPool = (event.totalDoomStake ?? 0) + (event.totalLifeStake ?? 0)
  const minStake = getMinimumDisputeStake(totalPool)

  return c.json({
    isResolved: event.proposedAt !== null,
    proposedOutcome: event.proposedOutcome,
    proposedAt: event.proposedAt,
    disputeWindowEnd: deadlines[0]?.disputeWindowEnd || null,
    canDispute: event.proposedAt ? isWithinDisputeWindow(event.proposedAt) : false,
    minimumStake: minStake,
  })
})

export default disputesRouter
