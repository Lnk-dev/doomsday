import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { generateToken, generateRefreshToken, verifyToken } from '../lib/jwt'
import { registerSchema } from '../lib/validators'

const auth = new Hono()

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, walletAddress } = c.req.valid('json')
  const existing = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (existing) return c.json({ error: 'Username taken' }, 400)

  const [user] = await db.insert(users).values({ username, walletAddress }).returning()
  const token = generateToken({ userId: user.id, walletAddress: user.walletAddress ?? undefined })
  return c.json({ user: { id: user.id, username: user.username, doomBalance: user.doomBalance }, token }, 201)
})

auth.post('/login', zValidator('json', registerSchema.pick({ username: true })), async (c) => {
  const { username } = c.req.valid('json')
  const user = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (!user) return c.json({ error: 'User not found' }, 404)
  const token = generateToken({ userId: user.id })
  return c.json({ user: { id: user.id, username: user.username, doomBalance: user.doomBalance }, token })
})

auth.get('/me', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  const payload = verifyToken(auth.slice(7))
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ user })
})

export default auth
