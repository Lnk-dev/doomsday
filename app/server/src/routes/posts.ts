import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, desc, and, sql } from 'drizzle-orm'
import { db } from '../db'
import { posts, users, likes, comments } from '../db/schema'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { createPostSchema, createCommentSchema, paginationSchema } from '../lib/validators'

const postsRouter = new Hono()

postsRouter.get('/', optionalAuth, zValidator('query', paginationSchema), async (c) => {
  const { limit } = c.req.valid('query')
  const variant = c.req.query('variant') as 'doom' | 'life' | undefined
  const conditions = variant ? [eq(posts.variant, variant)] : []

  const result = await db.select({
    id: posts.id, content: posts.content, variant: posts.variant,
    likes: posts.likes, replies: posts.replies, createdAt: posts.createdAt,
    author: { id: users.id, username: users.username, verified: users.verified },
  }).from(posts).innerJoin(users, eq(posts.authorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt)).limit(limit)

  return c.json({ posts: result })
})

postsRouter.get('/:id', optionalAuth, async (c) => {
  const postId = c.req.param('id')
  const post = await db.select({
    id: posts.id, content: posts.content, variant: posts.variant,
    likes: posts.likes, replies: posts.replies, createdAt: posts.createdAt,
    author: { id: users.id, username: users.username, verified: users.verified },
  }).from(posts).innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId)).limit(1)
  if (!post[0]) return c.json({ error: 'Not found' }, 404)
  return c.json(post[0])
})

postsRouter.post('/', requireAuth, zValidator('json', createPostSchema), async (c) => {
  const userId = c.get('userId')
  const { content, variant } = c.req.valid('json')

  if (variant === 'life') {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return c.json({ error: 'User not found' }, 404)
    const cost = Math.max(1, (user.daysLiving ?? 0) + 1) + Math.floor((user.lifePosts ?? 0) / 10)
    if ((user.doomBalance ?? 0) < cost) return c.json({ error: `Need ${cost} DOOM` }, 400)
    await db.update(users).set({ doomBalance: sql`${users.doomBalance} - ${cost}`, lifePosts: sql`${users.lifePosts} + 1` }).where(eq(users.id, userId))
  }

  const [post] = await db.insert(posts).values({ authorId: userId, content, variant }).returning()
  return c.json({ post }, 201)
})

postsRouter.post('/:id/like', requireAuth, async (c) => {
  const postId = c.req.param('id'), userId = c.get('userId')
  const existing = await db.query.likes.findFirst({ where: and(eq(likes.userId, userId), eq(likes.postId, postId)) })
  if (existing) return c.json({ error: 'Already liked' }, 400)
  await db.insert(likes).values({ userId, postId })
  await db.update(posts).set({ likes: sql`${posts.likes} + 1` }).where(eq(posts.id, postId))
  return c.json({ success: true })
})

postsRouter.delete('/:id/like', requireAuth, async (c) => {
  const postId = c.req.param('id'), userId = c.get('userId')
  const deleted = await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId))).returning()
  if (!deleted.length) return c.json({ error: 'Not liked' }, 400)
  await db.update(posts).set({ likes: sql`${posts.likes} - 1` }).where(eq(posts.id, postId))
  return c.json({ success: true })
})

postsRouter.get('/:id/comments', async (c) => {
  const postId = c.req.param('id')
  const result = await db.select({
    id: comments.id, content: comments.content, likes: comments.likes, createdAt: comments.createdAt,
    author: { id: users.id, username: users.username },
  }).from(comments).innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt))
  return c.json({ comments: result })
})

postsRouter.post('/:id/comments', requireAuth, zValidator('json', createCommentSchema), async (c) => {
  const postId = c.req.param('id'), userId = c.get('userId'), { content } = c.req.valid('json')
  const [comment] = await db.insert(comments).values({ postId, authorId: userId, content }).returning()
  await db.update(posts).set({ replies: sql`${posts.replies} + 1` }).where(eq(posts.id, postId))
  return c.json({ comment }, 201)
})

export default postsRouter
