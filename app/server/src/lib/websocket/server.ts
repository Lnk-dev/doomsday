/**
 * WebSocket Server
 * Issue #43: Real-time updates with WebSocket
 *
 * Socket.io server for real-time updates.
 */

import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { logger } from '../logger'
import type {
  TypedServer,
  TypedSocket,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  PostCreatedPayload,
  PostLikedPayload,
  PostUnlikedPayload,
  CommentAddedPayload,
  CommentLikedPayload,
  BetPlacedPayload,
  EventResolvedPayload,
} from './types'

let io: TypedServer | null = null

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HttpServer): TypedServer {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.on('connection', (socket: TypedSocket) => {
    logger.info({ socketId: socket.id }, 'Client connected')
    socket.data.rooms = new Set()

    // Handle feed room joins
    socket.on('join:feed', (feedType) => {
      const room = `feed:${feedType}`
      socket.join(room)
      socket.data.rooms.add(room)
      logger.debug({ socketId: socket.id, room }, 'Joined feed room')
    })

    socket.on('leave:feed', (feedType) => {
      const room = `feed:${feedType}`
      socket.leave(room)
      socket.data.rooms.delete(room)
      logger.debug({ socketId: socket.id, room }, 'Left feed room')
    })

    // Handle post room joins (for live comments)
    socket.on('join:post', (postId) => {
      const room = `post:${postId}`
      socket.join(room)
      socket.data.rooms.add(room)
      logger.debug({ socketId: socket.id, room }, 'Joined post room')
    })

    socket.on('leave:post', (postId) => {
      const room = `post:${postId}`
      socket.leave(room)
      socket.data.rooms.delete(room)
      logger.debug({ socketId: socket.id, room }, 'Left post room')
    })

    // Handle event room joins (for live bet updates)
    socket.on('join:event', (eventId) => {
      const room = `event:${eventId}`
      socket.join(room)
      socket.data.rooms.add(room)
      logger.debug({ socketId: socket.id, room }, 'Joined event room')
    })

    socket.on('leave:event', (eventId) => {
      const room = `event:${eventId}`
      socket.leave(room)
      socket.data.rooms.delete(room)
      logger.debug({ socketId: socket.id, room }, 'Left event room')
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Client disconnected')
    })

    // Handle errors
    socket.on('error', (error) => {
      logger.error({ socketId: socket.id, error }, 'Socket error')
    })
  })

  logger.info('WebSocket server initialized')
  return io
}

/**
 * Get the WebSocket server instance
 */
export function getIO(): TypedServer {
  if (!io) {
    throw new Error('WebSocket server not initialized')
  }
  return io
}

/**
 * Check if WebSocket server is initialized
 */
export function isInitialized(): boolean {
  return io !== null
}

// ==========================================
// Broadcast helper functions
// ==========================================

/**
 * Broadcast new post to feed subscribers
 */
export function broadcastPostCreated(payload: PostCreatedPayload): void {
  if (!io) return
  const room = `feed:${payload.feedType}`
  io.to(room).emit('post:created', payload)
  logger.debug({ room, postId: payload.post.id }, 'Broadcast post:created')
}

/**
 * Broadcast post like to feed subscribers
 */
export function broadcastPostLiked(payload: PostLikedPayload, feedType: 'doom' | 'life'): void {
  if (!io) return
  const room = `feed:${feedType}`
  io.to(room).emit('post:liked', payload)
}

/**
 * Broadcast post unlike to feed subscribers
 */
export function broadcastPostUnliked(payload: PostUnlikedPayload, feedType: 'doom' | 'life'): void {
  if (!io) return
  const room = `feed:${feedType}`
  io.to(room).emit('post:unliked', payload)
}

/**
 * Broadcast post deletion
 */
export function broadcastPostDeleted(postId: string, feedType: 'doom' | 'life'): void {
  if (!io) return
  const room = `feed:${feedType}`
  io.to(room).emit('post:deleted', { postId })
}

/**
 * Broadcast new comment to post subscribers
 */
export function broadcastCommentAdded(payload: CommentAddedPayload): void {
  if (!io) return
  const room = `post:${payload.postId}`
  io.to(room).emit('comment:added', payload)
  logger.debug({ room, commentId: payload.comment.id }, 'Broadcast comment:added')
}

/**
 * Broadcast comment like to post subscribers
 */
export function broadcastCommentLiked(payload: CommentLikedPayload, postId: string): void {
  if (!io) return
  const room = `post:${postId}`
  io.to(room).emit('comment:liked', payload)
}

/**
 * Broadcast comment deletion
 */
export function broadcastCommentDeleted(commentId: string, postId: string): void {
  if (!io) return
  const room = `post:${postId}`
  io.to(room).emit('comment:deleted', { commentId, postId })
}

/**
 * Broadcast bet placed to event subscribers
 */
export function broadcastBetPlaced(payload: BetPlacedPayload): void {
  if (!io) return
  const room = `event:${payload.eventId}`
  io.to(room).emit('bet:placed', payload)
  logger.debug({ room, eventId: payload.eventId }, 'Broadcast bet:placed')
}

/**
 * Broadcast event resolution
 */
export function broadcastEventResolved(payload: EventResolvedPayload): void {
  if (!io) return
  const room = `event:${payload.eventId}`
  io.to(room).emit('event:resolved', payload)
  logger.info({ room, eventId: payload.eventId, outcome: payload.outcome }, 'Broadcast event:resolved')
}

/**
 * Get connection stats
 */
export async function getConnectionStats(): Promise<{
  totalConnections: number
  roomStats: Record<string, number>
}> {
  if (!io) {
    return { totalConnections: 0, roomStats: {} }
  }

  const sockets = await io.fetchSockets()
  const roomStats: Record<string, number> = {}

  for (const socket of sockets) {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        roomStats[room] = (roomStats[room] || 0) + 1
      }
    }
  }

  return {
    totalConnections: sockets.length,
    roomStats,
  }
}

export default {
  initializeWebSocket,
  getIO,
  isInitialized,
  broadcastPostCreated,
  broadcastPostLiked,
  broadcastPostUnliked,
  broadcastPostDeleted,
  broadcastCommentAdded,
  broadcastCommentLiked,
  broadcastCommentDeleted,
  broadcastBetPlaced,
  broadcastEventResolved,
  getConnectionStats,
}
