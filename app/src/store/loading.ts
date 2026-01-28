/**
 * Loading Store
 *
 * Zustand store for managing loading states across the app.
 * Provides centralized loading state management for different features.
 *
 * Usage:
 *   const isLoading = useLoadingStore((state) => state.isLoading('posts'))
 *   const setLoading = useLoadingStore((state) => state.setLoading)
 *   setLoading('posts', true)
 */

import { create } from 'zustand'

type LoadingKey =
  | 'posts'
  | 'events'
  | 'profile'
  | 'leaderboard'
  | 'timeline'
  | 'postDetail'

interface LoadingState {
  /** Map of loading keys to their loading status */
  loadingStates: Record<LoadingKey, boolean>

  // Actions
  /** Check if a specific key is loading */
  isLoading: (key: LoadingKey) => boolean
  /** Set loading state for a key */
  setLoading: (key: LoadingKey, loading: boolean) => void
  /** Start loading for a key */
  startLoading: (key: LoadingKey) => void
  /** Stop loading for a key */
  stopLoading: (key: LoadingKey) => void
  /** Simulate loading with a delay (for demo purposes) */
  simulateLoading: (key: LoadingKey, durationMs?: number) => Promise<void>
}

const initialLoadingStates: Record<LoadingKey, boolean> = {
  posts: false,
  events: false,
  profile: false,
  leaderboard: false,
  timeline: false,
  postDetail: false,
}

export const useLoadingStore = create<LoadingState>()((set, get) => ({
  loadingStates: { ...initialLoadingStates },

  isLoading: (key) => {
    return get().loadingStates[key] ?? false
  },

  setLoading: (key, loading) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    }))
  },

  startLoading: (key) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: true,
      },
    }))
  },

  stopLoading: (key) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: false,
      },
    }))
  },

  simulateLoading: async (key, durationMs = 1500) => {
    get().startLoading(key)
    await new Promise((resolve) => setTimeout(resolve, durationMs))
    get().stopLoading(key)
  },
}))
