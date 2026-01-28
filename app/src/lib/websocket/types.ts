/**
 * WebSocket Client Types
 * Issue #43: Real-time updates with WebSocket
 *
 * Type definitions matching the server events.
 */

// Post-related event payloads
export interface PostCreatedPayload {
  post: {
    id: string
    authorUsername: string
    content: string
    variant: 'doom' | 'life'
    createdAt: number
    likes: number
    replies: number
    reposts: number
  }
  feedType: 'doom' | 'life'
}

export interface PostLikedPayload {
  postId: string
  likes: number
  userId: string
}

export interface PostUnlikedPayload {
  postId: string
  likes: number
  userId: string
}

// Comment-related event payloads
export interface CommentAddedPayload {
  postId: string
  comment: {
    id: string
    authorUsername: string
    content: string
    createdAt: number
    likes: number
  }
}

export interface CommentLikedPayload {
  commentId: string
  likes: number
  userId: string
}

// Event/bet-related payloads
export interface BetPlacedPayload {
  eventId: string
  side: 'doom' | 'life'
  doomStake: number
  lifeStake: number
  totalBettors: number
}

export interface EventResolvedPayload {
  eventId: string
  outcome: 'doom' | 'life'
  winningPool: number
}

// User presence payloads
export interface UserJoinedPayload {
  userId: string
  username: string
  room: string
}

export interface UserLeftPayload {
  userId: string
  username: string
  room: string
}

// Server to Client events
export interface ServerToClientEvents {
  'post:created': (payload: PostCreatedPayload) => void
  'post:liked': (payload: PostLikedPayload) => void
  'post:unliked': (payload: PostUnlikedPayload) => void
  'post:deleted': (payload: { postId: string }) => void
  'comment:added': (payload: CommentAddedPayload) => void
  'comment:liked': (payload: CommentLikedPayload) => void
  'comment:deleted': (payload: { commentId: string; postId: string }) => void
  'bet:placed': (payload: BetPlacedPayload) => void
  'event:resolved': (payload: EventResolvedPayload) => void
  'user:joined': (payload: UserJoinedPayload) => void
  'user:left': (payload: UserLeftPayload) => void
  'error': (payload: { message: string; code?: string }) => void
}

// Client to Server events
export interface ClientToServerEvents {
  'join:feed': (feedType: 'doom' | 'life') => void
  'leave:feed': (feedType: 'doom' | 'life') => void
  'join:post': (postId: string) => void
  'leave:post': (postId: string) => void
  'join:event': (eventId: string) => void
  'leave:event': (eventId: string) => void
  'typing:start': (postId: string) => void
  'typing:stop': (postId: string) => void
}
