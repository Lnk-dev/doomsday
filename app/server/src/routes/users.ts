import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, sql, desc } from 'drizzle-orm'
import { db } from '../db'
import { users, follows, posts } from '../db/schema'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { updateProfileSchema } from '../lib/validators'

const usersRouter = new Hono()

usersRouter.get('/:username', optionalAuth, async (c) => {
  const username = c.req.param('username'), currentUserId = c.get('userId')
  const user = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (!user) return c.json({ error: 'Not found' }, 404)

  const [followers] = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, user.id))
  const [following] = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, user.id))

  let isFollowing = false
  if (currentUserId && currentUserId !== user.id) {
    const f = await db.query.follows.findFirst({ where: and(eq(follows.followerId, currentUserId), eq(follows.followingId, user.id)) })
    isFollowing = !!f
  }

  return c.json({ user, followers: Number(followers.count), following: Number(following.count), isFollowing })
})

usersRouter.get('/:username/posts', async (c) => {
  const username = c.req.param('username')
  const user = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (!user) return c.json({ error: 'Not found' }, 404)

  const userPosts = await db.select().from(posts).where(eq(posts.authorId, user.id)).orderBy(desc(posts.createdAt)).limit(50)
  return c.json({ posts: userPosts })
})

usersRouter.patch('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId'), updates = c.req.valid('json')
  if (updates.username) {
    const existing = await db.query.users.findFirst({ where: and(eq(users.username, updates.username), sql`${users.id} != ${userId}`) })
    if (existing) return c.json({ error: 'Username taken' }, 400)
  }
  const [user] = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, userId)).returning()
  return c.json({ user })
})

usersRouter.post('/:username/follow', requireAuth, async (c) => {
  const username = c.req.param('username'), currentUserId = c.get('userId')
  const target = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (!target || target.id === currentUserId) return c.json({ error: 'Invalid' }, 400)
  const existing = await db.query.follows.findFirst({ where: and(eq(follows.followerId, currentUserId), eq(follows.followingId, target.id)) })
  if (existing) return c.json({ error: 'Already following' }, 400)
  await db.insert(follows).values({ followerId: currentUserId, followingId: target.id })
  return c.json({ success: true })
})

usersRouter.delete('/:username/follow', requireAuth, async (c) => {
  const username = c.req.param('username'), currentUserId = c.get('userId')
  const target = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (!target) return c.json({ error: 'Not found' }, 404)
  await db.delete(follows).where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, target.id)))
  return c.json({ success: true })
})

export default usersRouter
