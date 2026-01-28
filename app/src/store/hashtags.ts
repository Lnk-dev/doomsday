/**
 * Hashtags Store
 *
 * Manages hashtag indexing, trending calculation, and search.
 * Tracks which posts contain which hashtags and calculates trending scores.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID, PostVariant } from '@/types'

export interface HashtagData {
  /** Hashtag without # prefix, lowercase */
  tag: string
  /** Post IDs containing this hashtag */
  postIds: ID[]
  /** Usage count in last 24h (for trending) */
  recentCount: number
  /** Last update timestamp */
  lastUpdated: number
  /** Breakdown by variant */
  variantCounts: {
    doom: number
    life: number
  }
}

interface HashtagsState {
  /** Hashtag data indexed by normalized tag */
  hashtags: Record<string, HashtagData>

  /** Add hashtags from a new post */
  indexPost: (postId: ID, hashtags: string[], variant: PostVariant) => void

  /** Remove post from hashtag index (for deleted posts) */
  removePost: (postId: ID, hashtags: string[]) => void

  /** Get posts by hashtag */
  getPostsByHashtag: (tag: string) => ID[]

  /** Get trending hashtags */
  getTrending: (limit?: number, variant?: PostVariant) => HashtagData[]

  /** Search hashtags by prefix */
  searchHashtags: (prefix: string, limit?: number) => HashtagData[]

  /** Get hashtag data */
  getHashtagData: (tag: string) => HashtagData | undefined
}

export const useHashtagsStore = create<HashtagsState>()(
  persist(
    (set, get) => ({
      hashtags: {},

      indexPost: (postId, hashtags, variant) => {
        const now = Date.now()

        set((state) => {
          const updated = { ...state.hashtags }

          for (const tag of hashtags) {
            const normalized = tag.replace(/^#/, '').toLowerCase()
            const existing = updated[normalized]

            if (existing) {
              // Don't double-add
              if (!existing.postIds.includes(postId)) {
                updated[normalized] = {
                  ...existing,
                  postIds: [...existing.postIds, postId],
                  recentCount: existing.recentCount + 1,
                  lastUpdated: now,
                  variantCounts: {
                    doom: existing.variantCounts.doom + (variant === 'doom' ? 1 : 0),
                    life: existing.variantCounts.life + (variant === 'life' ? 1 : 0),
                  },
                }
              }
            } else {
              updated[normalized] = {
                tag: normalized,
                postIds: [postId],
                recentCount: 1,
                lastUpdated: now,
                variantCounts: {
                  doom: variant === 'doom' ? 1 : 0,
                  life: variant === 'life' ? 1 : 0,
                },
              }
            }
          }

          return { hashtags: updated }
        })
      },

      removePost: (postId, hashtags) => {
        set((state) => {
          const updated = { ...state.hashtags }

          for (const tag of hashtags) {
            const normalized = tag.replace(/^#/, '').toLowerCase()
            const existing = updated[normalized]

            if (existing) {
              const newPostIds = existing.postIds.filter((id) => id !== postId)
              if (newPostIds.length === 0) {
                delete updated[normalized]
              } else {
                updated[normalized] = {
                  ...existing,
                  postIds: newPostIds,
                }
              }
            }
          }

          return { hashtags: updated }
        })
      },

      getPostsByHashtag: (tag) => {
        const normalized = tag.replace(/^#/, '').toLowerCase()
        return get().hashtags[normalized]?.postIds ?? []
      },

      getTrending: (limit = 10, variant) => {
        const all = Object.values(get().hashtags)

        let filtered = all
        if (variant) {
          filtered = all.filter((h) => h.variantCounts[variant] > 0)
        }

        // Sort by recent count (trending score)
        return filtered.sort((a, b) => b.recentCount - a.recentCount).slice(0, limit)
      },

      searchHashtags: (prefix, limit = 10) => {
        const normalized = prefix.replace(/^#/, '').toLowerCase()
        if (!normalized) return []

        const all = Object.values(get().hashtags)

        return all
          .filter((h) => h.tag.startsWith(normalized))
          .sort((a, b) => b.postIds.length - a.postIds.length)
          .slice(0, limit)
      },

      getHashtagData: (tag) => {
        const normalized = tag.replace(/^#/, '').toLowerCase()
        return get().hashtags[normalized]
      },
    }),
    {
      name: 'doomsday-hashtags',
    }
  )
)
