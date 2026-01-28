/**
 * Posts Store
 *
 * Zustand store for managing doom-scroll and life posts.
 * Handles:
 * - Post CRUD operations
 * - Like/unlike functionality
 * - Feed filtering
 * - Local storage persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Post, PostVariant, Author, ID } from '@/types'

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

/** Get current timestamp */
const now = (): number => Date.now()

interface PostsState {
  /** All posts indexed by ID */
  posts: Record<ID, Post>
  /** Ordered list of post IDs for doom feed */
  doomFeed: ID[]
  /** Ordered list of post IDs for life feed */
  lifeFeed: ID[]

  // Actions
  /** Create a new post */
  createPost: (content: string, variant: PostVariant, author: Author) => Post
  /** Like a post */
  likePost: (postId: ID, userId: ID) => void
  /** Unlike a post */
  unlikePost: (postId: ID, userId: ID) => void
  /** Get posts for a specific feed */
  getFeed: (variant: PostVariant) => Post[]
  /** Get a single post by ID */
  getPost: (postId: ID) => Post | undefined
}

/**
 * Initial mock posts for demonstration
 */
const initialPosts: Record<ID, Post> = {
  'post-1': {
    id: 'post-1',
    author: { address: null, username: 'doomprophet', verified: true },
    content: 'The signs are everywhere. Economic indicators suggest collapse within 6 months. Have you noticed the pattern?',
    variant: 'doom',
    createdAt: now() - 2 * 60 * 60 * 1000, // 2h ago
    likes: 243,
    replies: 42,
    reposts: 12,
    likedBy: [],
  },
  'post-2': {
    id: 'post-2',
    author: { address: null, username: 'cassandrav2' },
    content: 'AI development is accelerating faster than anyone predicted. The singularity timeline keeps moving closer.\n\nWe are not prepared.',
    variant: 'doom',
    createdAt: now() - 4 * 60 * 60 * 1000, // 4h ago
    likes: 892,
    replies: 156,
    reposts: 45,
    likedBy: [],
  },
  'post-3': {
    id: 'post-3',
    author: { address: null, username: 'climatewatch', verified: true },
    content: 'New data from Arctic monitoring stations is concerning. Permafrost thaw is releasing methane at unprecedented rates.',
    variant: 'doom',
    createdAt: now() - 6 * 60 * 60 * 1000, // 6h ago
    likes: 1200,
    replies: 89,
    reposts: 67,
    likedBy: [],
  },
  'post-4': {
    id: 'post-4',
    author: { address: null, username: 'anon_4821' },
    content: 'Markets are showing classic signs of systemic stress. The derivatives exposure alone should terrify anyone paying attention.',
    variant: 'doom',
    createdAt: now() - 8 * 60 * 60 * 1000, // 8h ago
    likes: 445,
    replies: 67,
    reposts: 23,
    likedBy: [],
  },
  'post-5': {
    id: 'post-5',
    author: { address: null, username: 'endtimes' },
    content: 'Every civilization thinks it will last forever. None of them did.\n\nWhy do we think we are different?',
    variant: 'doom',
    createdAt: now() - 12 * 60 * 60 * 1000, // 12h ago
    likes: 2100,
    replies: 234,
    reposts: 156,
    likedBy: [],
  },
  'life-1': {
    id: 'life-1',
    author: { address: null, username: 'lifeliver', verified: true },
    content: 'Today I planted a garden. Small acts of creation against the void.\n\nEvery seed is a bet on tomorrow.',
    variant: 'life',
    createdAt: now() - 1 * 60 * 60 * 1000, // 1h ago
    likes: 128,
    replies: 23,
    reposts: 8,
    likedBy: [],
  },
  'life-2': {
    id: 'life-2',
    author: { address: null, username: 'sunrisewatcher' },
    content: 'Watched the sunrise this morning. Still happening. Still beautiful.\n\nDay 847 of choosing to live.',
    variant: 'life',
    createdAt: now() - 3 * 60 * 60 * 1000, // 3h ago
    likes: 445,
    replies: 34,
    reposts: 12,
    likedBy: [],
  },
  'life-3': {
    id: 'life-3',
    author: { address: null, username: 'presentmoment', verified: true },
    content: 'The doomers want you to forget that every moment of joy is a rebellion.\n\nLive anyway.',
    variant: 'life',
    createdAt: now() - 5 * 60 * 60 * 1000, // 5h ago
    likes: 1892,
    replies: 156,
    reposts: 89,
    likedBy: [],
  },
  'life-4': {
    id: 'life-4',
    author: { address: null, username: 'builder_anon' },
    content: 'Started learning to play piano at 45. Why? Because there might be a tomorrow.\n\nAnd if there isn\'t, at least I tried something new today.',
    variant: 'life',
    createdAt: now() - 8 * 60 * 60 * 1000, // 8h ago
    likes: 2341,
    replies: 189,
    reposts: 134,
    likedBy: [],
  },
}

const initialDoomFeed = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5']
const initialLifeFeed = ['life-1', 'life-2', 'life-3', 'life-4']

export const usePostsStore = create<PostsState>()(
  persist(
    (set, get) => ({
      posts: initialPosts,
      doomFeed: initialDoomFeed,
      lifeFeed: initialLifeFeed,

      createPost: (content, variant, author) => {
        const post: Post = {
          id: generateId(),
          author,
          content,
          variant,
          createdAt: now(),
          likes: 0,
          replies: 0,
          reposts: 0,
          likedBy: [],
        }

        set((state) => ({
          posts: { ...state.posts, [post.id]: post },
          doomFeed: variant === 'doom' ? [post.id, ...state.doomFeed] : state.doomFeed,
          lifeFeed: variant === 'life' ? [post.id, ...state.lifeFeed] : state.lifeFeed,
        }))

        return post
      },

      likePost: (postId, userId) => {
        set((state) => {
          const post = state.posts[postId]
          if (!post || post.likedBy.includes(userId)) return state

          return {
            posts: {
              ...state.posts,
              [postId]: {
                ...post,
                likes: post.likes + 1,
                likedBy: [...post.likedBy, userId],
                isLiked: true,
              },
            },
          }
        })
      },

      unlikePost: (postId, userId) => {
        set((state) => {
          const post = state.posts[postId]
          if (!post || !post.likedBy.includes(userId)) return state

          return {
            posts: {
              ...state.posts,
              [postId]: {
                ...post,
                likes: post.likes - 1,
                likedBy: post.likedBy.filter((id) => id !== userId),
                isLiked: false,
              },
            },
          }
        })
      },

      getFeed: (variant) => {
        const state = get()
        const feedIds = variant === 'doom' ? state.doomFeed : state.lifeFeed
        return feedIds.map((id) => state.posts[id]).filter(Boolean)
      },

      getPost: (postId) => {
        return get().posts[postId]
      },
    }),
    {
      name: 'doomsday-posts',
      // Only persist posts, not the computed feeds
      partialize: (state) => ({
        posts: state.posts,
        doomFeed: state.doomFeed,
        lifeFeed: state.lifeFeed,
      }),
    }
  )
)
