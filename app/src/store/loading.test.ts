/**
 * Loading Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useLoadingStore } from './loading'

describe('loading store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset to initial state
    useLoadingStore.setState({
      loadingStates: {
        posts: false,
        events: false,
        profile: false,
        leaderboard: false,
        timeline: false,
        postDetail: false,
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have all loading states as false', () => {
      const state = useLoadingStore.getState()

      expect(state.loadingStates.posts).toBe(false)
      expect(state.loadingStates.events).toBe(false)
      expect(state.loadingStates.profile).toBe(false)
      expect(state.loadingStates.leaderboard).toBe(false)
      expect(state.loadingStates.timeline).toBe(false)
      expect(state.loadingStates.postDetail).toBe(false)
    })
  })

  describe('isLoading', () => {
    it('should return false for non-loading state', () => {
      const { isLoading } = useLoadingStore.getState()

      expect(isLoading('posts')).toBe(false)
    })

    it('should return true for loading state', () => {
      const { setLoading, isLoading } = useLoadingStore.getState()

      setLoading('posts', true)

      expect(isLoading('posts')).toBe(true)
    })
  })

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      const { setLoading, isLoading } = useLoadingStore.getState()

      setLoading('events', true)

      expect(isLoading('events')).toBe(true)
    })

    it('should set loading state to false', () => {
      const { setLoading, isLoading } = useLoadingStore.getState()

      setLoading('events', true)
      setLoading('events', false)

      expect(isLoading('events')).toBe(false)
    })

    it('should not affect other loading states', () => {
      const { setLoading, isLoading } = useLoadingStore.getState()

      setLoading('posts', true)

      expect(isLoading('posts')).toBe(true)
      expect(isLoading('events')).toBe(false)
      expect(isLoading('profile')).toBe(false)
    })
  })

  describe('startLoading', () => {
    it('should set loading state to true', () => {
      const { startLoading, isLoading } = useLoadingStore.getState()

      startLoading('profile')

      expect(isLoading('profile')).toBe(true)
    })
  })

  describe('stopLoading', () => {
    it('should set loading state to false', () => {
      const { startLoading, stopLoading, isLoading } = useLoadingStore.getState()

      startLoading('leaderboard')
      stopLoading('leaderboard')

      expect(isLoading('leaderboard')).toBe(false)
    })
  })

  describe('simulateLoading', () => {
    it('should set loading to true immediately', async () => {
      const { simulateLoading, isLoading } = useLoadingStore.getState()

      const promise = simulateLoading('timeline')

      expect(isLoading('timeline')).toBe(true)

      // Cleanup
      vi.advanceTimersByTime(1500)
      await promise
    })

    it('should set loading to false after duration', async () => {
      const { simulateLoading, isLoading } = useLoadingStore.getState()

      const promise = simulateLoading('timeline', 1000)

      vi.advanceTimersByTime(1000)
      await promise

      expect(isLoading('timeline')).toBe(false)
    })

    it('should use default duration of 1500ms', async () => {
      const { simulateLoading, isLoading } = useLoadingStore.getState()

      const promise = simulateLoading('postDetail')

      expect(isLoading('postDetail')).toBe(true)

      vi.advanceTimersByTime(1499)
      expect(isLoading('postDetail')).toBe(true)

      vi.advanceTimersByTime(1)
      await promise

      expect(isLoading('postDetail')).toBe(false)
    })

    it('should accept custom duration', async () => {
      const { simulateLoading, isLoading } = useLoadingStore.getState()

      const promise = simulateLoading('posts', 500)

      vi.advanceTimersByTime(500)
      await promise

      expect(isLoading('posts')).toBe(false)
    })
  })

  describe('multiple loading states', () => {
    it('should handle multiple loading states independently', () => {
      const { startLoading, stopLoading, isLoading } = useLoadingStore.getState()

      startLoading('posts')
      startLoading('events')
      startLoading('profile')

      expect(isLoading('posts')).toBe(true)
      expect(isLoading('events')).toBe(true)
      expect(isLoading('profile')).toBe(true)

      stopLoading('events')

      expect(isLoading('posts')).toBe(true)
      expect(isLoading('events')).toBe(false)
      expect(isLoading('profile')).toBe(true)
    })
  })
})
