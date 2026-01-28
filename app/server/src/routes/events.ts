import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, desc, and, sql, gte } from 'drizzle-orm'
import { db } from '../db'
import { events, bets, users } from '../db/schema'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { createEventSchema, placeBetSchema, paginationSchema } from '../lib/validators'

const eventsRouter = new Hono()

eventsRouter.get('/', optionalAuth, zValidator('query', paginationSchema), async (c) => {
  const { limit } = c.req.valid('query')
  const status = c.req.query('status')
  const conditions = status === 'active' ? [eq(events.status, 'active'), gte(events.endsAt, new Date())] : []

  const result = await db.select({
    id: events.id, title: events.title, status: events.status,
    totalDoomStake: events.totalDoomStake, totalLifeStake: events.totalLifeStake,
    endsAt: events.endsAt, createdAt: events.createdAt,
    creator: { id: users.id, username: users.username },
  }).from(events).innerJoin(users, eq(events.creatorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(events.createdAt)).limit(limit)

  return c.json({ events: result })
})

eventsRouter.get('/:id', optionalAuth, async (c) => {
  const eventId = c.req.param('id')
  const event = await db.select({
    id: events.id, title: events.title, description: events.description, status: events.status,
    totalDoomStake: events.totalDoomStake, totalLifeStake: events.totalLifeStake,
    endsAt: events.endsAt, createdAt: events.createdAt,
    creator: { id: users.id, username: users.username },
  }).from(events).innerJoin(users, eq(events.creatorId, users.id))
    .where(eq(events.id, eventId)).limit(1)
  if (!event[0]) return c.json({ error: 'Not found' }, 404)

  const total = (event[0].totalDoomStake ?? 0) + (event[0].totalLifeStake ?? 0)
  return c.json({ ...event[0], totalStake: total, doomOdds: total ? (event[0].totalLifeStake ?? 0) / total * 100 : 50, lifeOdds: total ? (event[0].totalDoomStake ?? 0) / total * 100 : 50 })
})

eventsRouter.post('/', requireAuth, zValidator('json', createEventSchema), async (c) => {
  const userId = c.get('userId'), { title, description, endsAt } = c.req.valid('json')
  const endDate = new Date(endsAt)
  if (endDate <= new Date()) return c.json({ error: 'End date must be future' }, 400)
  const [event] = await db.insert(events).values({ creatorId: userId, title, description, endsAt: endDate }).returning()
  return c.json({ event }, 201)
})

eventsRouter.post('/:id/bet', requireAuth, zValidator('json', placeBetSchema), async (c) => {
  const eventId = c.req.param('id'), userId = c.get('userId'), { outcome, amount } = c.req.valid('json')

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event || event.status !== 'active' || new Date(event.endsAt) <= new Date()) return c.json({ error: 'Event not available' }, 400)

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
