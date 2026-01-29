/**
 * Hashtags Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useHashtagsStore } from './hashtags'

describe('hashtags store', () => {
  beforeEach(() => {
    // Reset store state
    useHashtagsStore.setState({
      hashtags: {},
    })
  })

  describe('initial state', () => {
    it('should have empty hashtags', () => {
      const state = useHashtagsStore.getState()
      expect(state.hashtags).toEqual({})
    })
  })

  describe('indexPost', () => {
    it('should index a post with hashtags', () => {
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test', '#doom'], 'doom')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test']).toBeDefined()
      expect(state.hashtags['doom']).toBeDefined()
    })

    it('should normalize hashtags to lowercase without #', () => {
      const { indexPost, getHashtagData } = useHashtagsStore.getState()

      indexPost('post-1', ['#TestTag'], 'doom')

      expect(getHashtagData('TestTag')?.tag).toBe('testtag')
      expect(getHashtagData('#TESTTAG')?.tag).toBe('testtag')
    })

    it('should add post ID to hashtag', () => {
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].postIds).toContain('post-1')
    })

    it('should track variant counts for doom', () => {
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].variantCounts.doom).toBe(1)
      expect(state.hashtags['test'].variantCounts.life).toBe(0)
    })

    it('should track variant counts for life', () => {
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'life')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].variantCounts.doom).toBe(0)
      expect(state.hashtags['test'].variantCounts.life).toBe(1)
    })

    it('should increment counts for existing hashtag', () => {
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')
      indexPost('post-2', ['#test'], 'life')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].postIds).toHaveLength(2)
      expect(state.hashtags['test'].variantCounts.doom).toBe(1)
      expect(state.hashtags['test'].variantCounts.life).toBe(1)
      expect(state.hashtags['test'].recentCount).toBe(2)
    })

    it('should not double-add same post', () => {
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')
      indexPost('post-1', ['#test'], 'doom')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].postIds).toHaveLength(1)
      expect(state.hashtags['test'].recentCount).toBe(1)
    })

    it('should set lastUpdated timestamp', () => {
      const before = Date.now()
      const { indexPost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].lastUpdated).toBeGreaterThanOrEqual(before)
    })
  })

  describe('removePost', () => {
    it('should remove post from hashtag', () => {
      const { indexPost, removePost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')
      indexPost('post-2', ['#test'], 'doom')

      removePost('post-1', ['#test'])

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].postIds).not.toContain('post-1')
      expect(state.hashtags['test'].postIds).toContain('post-2')
    })

    it('should delete hashtag when no posts remain', () => {
      const { indexPost, removePost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')
      removePost('post-1', ['#test'])

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test']).toBeUndefined()
    })

    it('should handle non-existent hashtag', () => {
      const { removePost } = useHashtagsStore.getState()

      // Should not throw
      removePost('post-1', ['#nonexistent'])

      expect(useHashtagsStore.getState().hashtags).toEqual({})
    })

    it('should handle removing post not in hashtag', () => {
      const { indexPost, removePost } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')
      removePost('post-2', ['#test']) // post-2 not indexed

      const state = useHashtagsStore.getState()
      expect(state.hashtags['test'].postIds).toContain('post-1')
    })
  })

  describe('getPostsByHashtag', () => {
    it('should return posts for hashtag', () => {
      const { indexPost, getPostsByHashtag } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')
      indexPost('post-2', ['#test'], 'doom')

      expect(getPostsByHashtag('#test')).toEqual(['post-1', 'post-2'])
    })

    it('should return empty array for non-existent hashtag', () => {
      const { getPostsByHashtag } = useHashtagsStore.getState()

      expect(getPostsByHashtag('#nonexistent')).toEqual([])
    })

    it('should normalize input', () => {
      const { indexPost, getPostsByHashtag } = useHashtagsStore.getState()

      indexPost('post-1', ['#Test'], 'doom')

      expect(getPostsByHashtag('TEST')).toEqual(['post-1'])
      expect(getPostsByHashtag('#test')).toEqual(['post-1'])
    })
  })

  describe('getTrending', () => {
    it('should return hashtags sorted by recent count', () => {
      const { indexPost, getTrending } = useHashtagsStore.getState()

      indexPost('post-1', ['#popular'], 'doom')
      indexPost('post-2', ['#popular'], 'doom')
      indexPost('post-3', ['#popular'], 'doom')
      indexPost('post-4', ['#lessPop'], 'doom')

      const trending = getTrending()

      expect(trending[0].tag).toBe('popular')
      expect(trending[1].tag).toBe('lesspop')
    })

    it('should respect limit', () => {
      const { indexPost, getTrending } = useHashtagsStore.getState()

      for (let i = 0; i < 15; i++) {
        indexPost(`post-${i}`, [`#tag${i}`], 'doom')
      }

      expect(getTrending(5)).toHaveLength(5)
      expect(getTrending()).toHaveLength(10) // default limit
    })

    it('should filter by variant', () => {
      const { indexPost, getTrending } = useHashtagsStore.getState()

      indexPost('post-1', ['#doomOnly'], 'doom')
      indexPost('post-2', ['#lifeOnly'], 'life')
      indexPost('post-3', ['#both'], 'doom')
      indexPost('post-4', ['#both'], 'life')

      const doomTrending = getTrending(10, 'doom')
      const lifeTrending = getTrending(10, 'life')

      expect(doomTrending.find((h) => h.tag === 'doomonly')).toBeDefined()
      expect(doomTrending.find((h) => h.tag === 'lifeonly')).toBeUndefined()
      expect(lifeTrending.find((h) => h.tag === 'lifeonly')).toBeDefined()
      expect(lifeTrending.find((h) => h.tag === 'doomonly')).toBeUndefined()
    })

    it('should return empty array when no hashtags', () => {
      const { getTrending } = useHashtagsStore.getState()

      expect(getTrending()).toEqual([])
    })
  })

  describe('searchHashtags', () => {
    it('should find hashtags by prefix', () => {
      const { indexPost, searchHashtags } = useHashtagsStore.getState()

      indexPost('post-1', ['#javascript'], 'doom')
      indexPost('post-2', ['#java'], 'doom')
      indexPost('post-3', ['#python'], 'doom')

      const results = searchHashtags('jav')

      expect(results).toHaveLength(2)
      expect(results.map((h) => h.tag)).toContain('javascript')
      expect(results.map((h) => h.tag)).toContain('java')
    })

    it('should normalize search prefix', () => {
      const { indexPost, searchHashtags } = useHashtagsStore.getState()

      indexPost('post-1', ['#javascript'], 'doom')

      expect(searchHashtags('#JAV')).toHaveLength(1)
      expect(searchHashtags('JavaScript')).toHaveLength(1)
    })

    it('should sort by post count', () => {
      const { indexPost, searchHashtags } = useHashtagsStore.getState()

      indexPost('post-1', ['#java'], 'doom')
      indexPost('post-2', ['#javascript'], 'doom')
      indexPost('post-3', ['#javascript'], 'doom')
      indexPost('post-4', ['#javascript'], 'doom')

      const results = searchHashtags('jav')

      expect(results[0].tag).toBe('javascript')
      expect(results[1].tag).toBe('java')
    })

    it('should respect limit', () => {
      const { indexPost, searchHashtags } = useHashtagsStore.getState()

      for (let i = 0; i < 20; i++) {
        indexPost(`post-${i}`, [`#test${i}`], 'doom')
      }

      expect(searchHashtags('test', 5)).toHaveLength(5)
    })

    it('should return empty array for empty prefix', () => {
      const { indexPost, searchHashtags } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')

      expect(searchHashtags('')).toEqual([])
      expect(searchHashtags('#')).toEqual([])
    })
  })

  describe('getHashtagData', () => {
    it('should return hashtag data', () => {
      const { indexPost, getHashtagData } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')

      const data = getHashtagData('test')

      expect(data?.tag).toBe('test')
      expect(data?.postIds).toContain('post-1')
    })

    it('should return undefined for non-existent hashtag', () => {
      const { getHashtagData } = useHashtagsStore.getState()

      expect(getHashtagData('nonexistent')).toBeUndefined()
    })

    it('should normalize input', () => {
      const { indexPost, getHashtagData } = useHashtagsStore.getState()

      indexPost('post-1', ['#test'], 'doom')

      expect(getHashtagData('#TEST')).toBeDefined()
      expect(getHashtagData('TEST')).toBeDefined()
    })
  })
})
