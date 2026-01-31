import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, desc, and, sql, gte } from 'drizzle-orm'
import { db } from '../db'
import {
  events,
  bets,
  users,
  resolutionCriteria,
  verificationSources,
  eventDeadlines,
  creatorStakes,
} from '../db/schema'
import { requireAuth, optionalAuth } from '../middleware/auth'
import {
  createEventSchema,
  placeBetSchema,
  paginationSchema,
  enhancedCreateEventSchema,
} from '../lib/validators'
import { calculateQualityScore } from '../lib/qualityScore'
import { determineResolutionType } from '../lib/resolution/resolutionService'

const eventsRouter = new Hono()

eventsRouter.get('/', optionalAuth, zValidator('query', paginationSchema), async (c) => {
  const { limit } = c.req.valid('query')
  const status = c.req.query('status')
  const conditions = status === 'active' ? [eq(events.status, 'active'), gte(events.endsAt, new Date())] : []

  const result = await db.select({
    id: events.id, title: events.title, status: events.status,
    category: events.category,
    totalDoomStake: events.totalDoomStake, totalLifeStake: events.totalLifeStake,
    qualityScore: events.qualityScore, qualityTier: events.qualityTier,
    endsAt: events.endsAt, createdAt: events.createdAt,
    creator: { id: users.id, username: users.username },
  }).from(events).innerJoin(users, eq(events.creatorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(events.createdAt)).limit(limit)

  return c.json({ events: result })
})

eventsRouter.get('/:id', optionalAuth, async (c) => {
  const eventId = c.req.param('id')

  // Get event with creator
  const eventResult = await db.select({
    id: events.id, title: events.title, description: events.description, status: events.status,
    category: events.category,
    totalDoomStake: events.totalDoomStake, totalLifeStake: events.totalLifeStake,
    qualityScore: events.qualityScore, qualityTier: events.qualityTier,
    resolutionType: events.resolutionType,
    proposedOutcome: events.proposedOutcome, proposedAt: events.proposedAt,
    endsAt: events.endsAt, createdAt: events.createdAt,
    creator: { id: users.id, username: users.username },
  }).from(events).innerJoin(users, eq(events.creatorId, users.id))
    .where(eq(events.id, eventId)).limit(1)

  if (!eventResult[0]) return c.json({ error: 'Not found' }, 404)

  // Get resolution criteria
  const criteria = await db.select().from(resolutionCriteria)
    .where(eq(resolutionCriteria.eventId, eventId))

  // Get verification sources
  const sources = await db.select().from(verificationSources)
    .where(eq(verificationSources.eventId, eventId))

  // Get deadlines
  const deadlines = await db.select().from(eventDeadlines)
    .where(eq(eventDeadlines.eventId, eventId)).limit(1)

  // Get creator stake
  const stake = await db.select().from(creatorStakes)
    .where(eq(creatorStakes.eventId, eventId)).limit(1)

  const event = eventResult[0]
  const total = (event.totalDoomStake ?? 0) + (event.totalLifeStake ?? 0)

  return c.json({
    ...event,
    totalStake: total,
    doomOdds: total ? (event.totalLifeStake ?? 0) / total * 100 : 50,
    lifeOdds: total ? (event.totalDoomStake ?? 0) / total * 100 : 50,
    resolutionCriteria: criteria,
    verificationSources: sources,
    deadlines: deadlines[0] || null,
    creatorStake: stake[0] || null,
  })
})

// Get resolution criteria for an event
eventsRouter.get('/:id/criteria', optionalAuth, async (c) => {
  const eventId = c.req.param('id')

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) return c.json({ error: 'Event not found' }, 404)

  const criteria = await db.select().from(resolutionCriteria)
    .where(eq(resolutionCriteria.eventId, eventId))

  return c.json({ criteria })
})

// Get verification sources for an event
eventsRouter.get('/:id/sources', optionalAuth, async (c) => {
  const eventId = c.req.param('id')

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) return c.json({ error: 'Event not found' }, 404)

  const sources = await db.select().from(verificationSources)
    .where(eq(verificationSources.eventId, eventId))

  return c.json({ sources })
})

// Legacy create event endpoint (simple)
eventsRouter.post('/', requireAuth, zValidator('json', createEventSchema), async (c) => {
  const userId = c.get('userId'), { title, description, endsAt } = c.req.valid('json')
  const endDate = new Date(endsAt)
  if (endDate <= new Date()) return c.json({ error: 'End date must be future' }, 400)
  const [event] = await db.insert(events).values({ creatorId: userId, title, description, endsAt: endDate }).returning()
  return c.json({ event }, 201)
})

// Enhanced create event endpoint with full criteria and sources
eventsRouter.post('/enhanced', requireAuth, zValidator('json', enhancedCreateEventSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  // Calculate quality score
  const qualityResult = calculateQualityScore({
    resolutionCriteria: data.resolutionCriteria,
    verificationSources: data.verificationSources,
    creatorStake: data.creatorStake,
    description: data.description,
  })

  // Determine resolution type based on sources
  const resolutionType = determineResolutionType(
    { totalDoomStake: 0, totalLifeStake: 0 },
    data.verificationSources
  )

  // If creator stake is provided, check balance
  if (data.creatorStake) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user || (user.doomBalance ?? 0) < data.creatorStake.amount) {
      return c.json({ error: 'Insufficient balance for creator stake' }, 400)
    }
  }

  // Create event
  const [event] = await db.insert(events).values({
    creatorId: userId,
    title: data.title,
    description: data.description,
    category: data.category,
    qualityScore: qualityResult.score,
    qualityTier: qualityResult.tier,
    resolutionType,
    // Use event deadline for legacy endsAt field
    endsAt: new Date(data.eventDeadline),
  }).returning()

  // Insert resolution criteria
  if (data.resolutionCriteria.length > 0) {
    await db.insert(resolutionCriteria).values(
      data.resolutionCriteria.map((criterion) => ({
        eventId: event.id,
        conditionType: criterion.conditionType,
        description: criterion.description,
        metric: criterion.metric,
        operator: criterion.operator,
        thresholdValue: criterion.thresholdValue?.toString(),
        unit: criterion.unit,
        geographicScope: criterion.geographicScope,
      }))
    )
  }

  // Insert verification sources
  if (data.verificationSources.length > 0) {
    await db.insert(verificationSources).values(
      data.verificationSources.map((source) => ({
        eventId: event.id,
        isPrimary: source.isPrimary,
        name: source.name,
        url: source.url || null,
        sourceType: source.sourceType,
      }))
    )
  }

  // Insert event deadlines
  // Calculate dispute window (24 hours after resolution deadline)
  const resolutionDeadline = new Date(data.resolutionDeadline)
  const disputeWindowEnd = new Date(resolutionDeadline)
  disputeWindowEnd.setHours(disputeWindowEnd.getHours() + 24)

  await db.insert(eventDeadlines).values({
    eventId: event.id,
    bettingDeadline: new Date(data.bettingDeadline),
    eventDeadline: new Date(data.eventDeadline),
    resolutionDeadline,
    disputeWindowEnd,
  })

  // Insert creator stake if provided
  if (data.creatorStake) {
    await db.insert(creatorStakes).values({
      eventId: event.id,
      creatorId: userId,
      amount: data.creatorStake.amount,
      outcome: data.creatorStake.outcome,
    })

    // Deduct from user balance and add to event stake
    await db.update(users).set({
      doomBalance: sql`${users.doomBalance} - ${data.creatorStake.amount}`,
    }).where(eq(users.id, userId))

    await db.update(events).set(
      data.creatorStake.outcome === 'doom'
        ? { totalDoomStake: sql`${events.totalDoomStake} + ${data.creatorStake.amount}` }
        : { totalLifeStake: sql`${events.totalLifeStake} + ${data.creatorStake.amount}` }
    ).where(eq(events.id, event.id))
  }

  return c.json({
    event,
    qualityScore: qualityResult.score,
    qualityTier: qualityResult.tier,
  }, 201)
})

eventsRouter.post('/:id/bet', requireAuth, zValidator('json', placeBetSchema), async (c) => {
  const eventId = c.req.param('id'), userId = c.get('userId'), { outcome, amount } = c.req.valid('json')

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event || event.status !== 'active' || new Date(event.endsAt) <= new Date()) return c.json({ error: 'Event not available' }, 400)

  // Check betting deadline if exists
  const deadlines = await db.select().from(eventDeadlines)
    .where(eq(eventDeadlines.eventId, eventId)).limit(1)

  if (deadlines[0] && new Date(deadlines[0].bettingDeadline) <= new Date()) {
    return c.json({ error: 'Betting deadline has passed' }, 400)
  }

  const existing = await db.query.bets.findFirst({ where: and(eq(bets.eventId, eventId), eq(bets.userId, userId)) })
  if (existing) return c.json({ error: 'Already bet' }, 400)

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user || (user.doomBalance ?? 0) < amount) return c.json({ error: 'Insufficient balance' }, 400)

  const [bet] = await db.insert(bets).values({ eventId, userId, outcome, amount }).returning()
  await db.update(users).set({ doomBalance: sql`${users.doomBalance} - ${amount}` }).where(eq(users.id, userId))
  await db.update(events).set(outcome === 'doom' ? { totalDoomStake: sql`${events.totalDoomStake} + ${amount}` } : { totalLifeStake: sql`${events.totalLifeStake} + ${amount}` }).where(eq(events.id, eventId))

  return c.json({ bet }, 201)
})

export default eventsRouter
