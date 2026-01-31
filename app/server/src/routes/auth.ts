import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { generateToken, verifyToken } from '../lib/jwt'
import { registerSchema, walletAuthSchema } from '../lib/validators'

const auth = new Hono()

/**
 * Wallet Authentication
 * POST /auth/wallet
 *
 * Authenticates a user by their wallet address.
 * Creates a new user if one doesn't exist for this wallet.
 * Returns user profile and JWT token.
 */
auth.post('/wallet', zValidator('json', walletAuthSchema), async (c) => {
  const { walletAddress } = c.req.valid('json')

  // Check if user exists with this wallet address
  let user = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  })

  // If no user exists, create one with auto-generated username
  if (!user) {
    const shortAddress = walletAddress.slice(0, 6).toLowerCase()
    const baseUsername = `user_${shortAddress}`

    // Check if username is taken, append random suffix if needed
    let username = baseUsername
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (existingUsername) {
      // Add random suffix
      const suffix = Math.random().toString(36).substring(2, 6)
      username = `${baseUsername}_${suffix}`
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        walletAddress,
        username,
        displayName: username,
      })
      .returning()

    user = newUser
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    walletAddress: user.walletAddress ?? undefined,
  })

  return c.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      verified: user.verified,
      daysLiving: user.daysLiving,
      lifePosts: user.lifePosts,
      createdAt: user.createdAt,
    },
    token,
  })
})

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
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  const payload = verifyToken(authHeader.slice(7))
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      verified: user.verified,
      daysLiving: user.daysLiving,
      lifePosts: user.lifePosts,
      createdAt: user.createdAt,
    },
  })
})

export default auth
