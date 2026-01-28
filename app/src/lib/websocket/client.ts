/**
 * WebSocket Client
 * Issue #43: Real-time updates with WebSocket
 *
 * Socket.io client for real-time updates.
 */

import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from './types'

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: TypedSocket | null = null

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

/**
 * Get or create the socket connection
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    }) as TypedSocket

    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message)
    })

    socket.on('error', (payload) => {
      console.error('[WebSocket] Server error:', payload.message)
    })
  }

  return socket
}

/**
 * Connect to the WebSocket server
 */
export function connect(): void {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
}

/**
 * Disconnect from the WebSocket server
 */
export function disconnect(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return socket?.connected ?? false
}

/**
 * Join a feed room for real-time updates
 */
export function joinFeed(feedType: 'doom' | 'life'): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('join:feed', feedType)
  }
}

/**
 * Leave a feed room
 */
export function leaveFeed(feedType: 'doom' | 'life'): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('leave:feed', feedType)
  }
}

/**
 * Join a post room for live comments
 */
export function joinPost(postId: string): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('join:post', postId)
  }
}

/**
 * Leave a post room
 */
export function leavePost(postId: string): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('leave:post', postId)
  }
}

/**
 * Join an event room for live bet updates
 */
export function joinEvent(eventId: string): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('join:event', eventId)
  }
}

/**
 * Leave an event room
 */
export function leaveEvent(eventId: string): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('leave:event', eventId)
  }
}

export default {
  getSocket,
  connect,
  disconnect,
  isConnected,
  joinFeed,
  leaveFeed,
  joinPost,
  leavePost,
  joinEvent,
  leaveEvent,
}
