import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verifyToken, type JwtPayload } from '../lib/jwt'

declare module 'hono' {
  interface ContextVariableMap { user: JwtPayload; userId: string }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) throw new HTTPException(401, { message: 'Unauthorized' })
  const payload = verifyToken(auth.slice(7))
  if (!payload) throw new HTTPException(401, { message: 'Invalid token' })
  c.set('user', payload)
  c.set('userId', payload.userId)
  await next()
})

export const optionalAuth = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7))
    if (payload) { c.set('user', payload); c.set('userId', payload.userId) }
  }
  await next()
})
