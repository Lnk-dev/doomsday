/**
 * WebSocket Hooks
 * Issue #43: Real-time updates with WebSocket
 *
 * React hooks for WebSocket functionality.
 */

import { useEffect, useCallback, useState } from 'react'
import {
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
} from '@/lib/websocket/client'
import type {
  PostCreatedPayload,
  PostLikedPayload,
  PostUnlikedPayload,
  CommentAddedPayload,
  BetPlacedPayload,
  EventResolvedPayload,
} from '@/lib/websocket/types'

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocketConnection() {
  const [connected, setConnected] = useState(isConnected())

  useEffect(() => {
    const socket = getSocket()

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    // Connect on mount
    connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [])

  return {
    connected,
    connect,
    disconnect,
  }
}

/**
 * Hook for subscribing to feed updates
 */
export function useFeedSubscription(
  feedType: 'doom' | 'life',
  callbacks: {
    onPostCreated?: (payload: PostCreatedPayload) => void
    onPostLiked?: (payload: PostLikedPayload) => void
    onPostUnliked?: (payload: PostUnlikedPayload) => void
    onPostDeleted?: (payload: { postId: string }) => void
  }
) {
  useEffect(() => {
    const socket = getSocket()

    // Join feed room
    if (socket.connected) {
      joinFeed(feedType)
    }

    const handleConnect = () => {
      joinFeed(feedType)
    }

    socket.on('connect', handleConnect)

    // Set up event listeners
    if (callbacks.onPostCreated) {
      socket.on('post:created', callbacks.onPostCreated)
    }
    if (callbacks.onPostLiked) {
      socket.on('post:liked', callbacks.onPostLiked)
    }
    if (callbacks.onPostUnliked) {
      socket.on('post:unliked', callbacks.onPostUnliked)
    }
    if (callbacks.onPostDeleted) {
      socket.on('post:deleted', callbacks.onPostDeleted)
    }

    return () => {
      leaveFeed(feedType)
      socket.off('connect', handleConnect)
      if (callbacks.onPostCreated) {
        socket.off('post:created', callbacks.onPostCreated)
      }
      if (callbacks.onPostLiked) {
        socket.off('post:liked', callbacks.onPostLiked)
      }
      if (callbacks.onPostUnliked) {
        socket.off('post:unliked', callbacks.onPostUnliked)
      }
      if (callbacks.onPostDeleted) {
        socket.off('post:deleted', callbacks.onPostDeleted)
      }
    }
  }, [feedType, callbacks.onPostCreated, callbacks.onPostLiked, callbacks.onPostUnliked, callbacks.onPostDeleted])
}

/**
 * Hook for subscribing to post/comment updates
 */
export function usePostSubscription(
  postId: string | undefined,
  callbacks: {
    onCommentAdded?: (payload: CommentAddedPayload) => void
    onCommentLiked?: (payload: { commentId: string; likes: number; userId: string }) => void
    onCommentDeleted?: (payload: { commentId: string; postId: string }) => void
  }
) {
  useEffect(() => {
    if (!postId) return

    const socket = getSocket()

    // Join post room
    if (socket.connected) {
      joinPost(postId)
    }

    const handleConnect = () => {
      joinPost(postId)
    }

    socket.on('connect', handleConnect)

    // Set up event listeners
    if (callbacks.onCommentAdded) {
      socket.on('comment:added', callbacks.onCommentAdded)
    }
    if (callbacks.onCommentLiked) {
      socket.on('comment:liked', callbacks.onCommentLiked)
    }
    if (callbacks.onCommentDeleted) {
      socket.on('comment:deleted', callbacks.onCommentDeleted)
    }

    return () => {
      leavePost(postId)
      socket.off('connect', handleConnect)
      if (callbacks.onCommentAdded) {
        socket.off('comment:added', callbacks.onCommentAdded)
      }
      if (callbacks.onCommentLiked) {
        socket.off('comment:liked', callbacks.onCommentLiked)
      }
      if (callbacks.onCommentDeleted) {
        socket.off('comment:deleted', callbacks.onCommentDeleted)
      }
    }
  }, [postId, callbacks.onCommentAdded, callbacks.onCommentLiked, callbacks.onCommentDeleted])
}

/**
 * Hook for subscribing to event/bet updates
 */
export function useEventSubscription(
  eventId: string | undefined,
  callbacks: {
    onBetPlaced?: (payload: BetPlacedPayload) => void
    onEventResolved?: (payload: EventResolvedPayload) => void
  }
) {
  useEffect(() => {
    if (!eventId) return

    const socket = getSocket()

    // Join event room
    if (socket.connected) {
      joinEvent(eventId)
    }

    const handleConnect = () => {
      joinEvent(eventId)
    }

    socket.on('connect', handleConnect)

    // Set up event listeners
    if (callbacks.onBetPlaced) {
      socket.on('bet:placed', callbacks.onBetPlaced)
    }
    if (callbacks.onEventResolved) {
      socket.on('event:resolved', callbacks.onEventResolved)
    }

    return () => {
      leaveEvent(eventId)
      socket.off('connect', handleConnect)
      if (callbacks.onBetPlaced) {
        socket.off('bet:placed', callbacks.onBetPlaced)
      }
      if (callbacks.onEventResolved) {
        socket.off('event:resolved', callbacks.onEventResolved)
      }
    }
  }, [eventId, callbacks.onBetPlaced, callbacks.onEventResolved])
}

/**
 * Hook for emitting typing indicators
 */
export function useTypingIndicator(postId: string | undefined) {
  const startTyping = useCallback(() => {
    if (!postId) return
    const socket = getSocket()
    if (socket.connected) {
      socket.emit('typing:start', postId)
    }
  }, [postId])

  const stopTyping = useCallback(() => {
    if (!postId) return
    const socket = getSocket()
    if (socket.connected) {
      socket.emit('typing:stop', postId)
    }
  }, [postId])

  return { startTyping, stopTyping }
}
