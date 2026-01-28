import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './user'

describe('User Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUserStore.setState({
      userId: 'test-user-id',
      author: { address: null, username: 'testuser' },
      doomBalance: 100,
      lifeBalance: 0,
      daysLiving: 0,
      lifePosts: 0,
      isConnected: false,
      following: [],
    })
  })

  describe('setUsername', () => {
    it('should update the username', () => {
      useUserStore.getState().setUsername('newusername')

      const state = useUserStore.getState()
      expect(state.author.username).toBe('newusername')
    })

    it('should preserve other author properties', () => {
      useUserStore.setState({
        author: { address: '0x123', username: 'oldname', verified: true },
      })

      useUserStore.getState().setUsername('newname')

      const state = useUserStore.getState()
      expect(state.author.address).toBe('0x123')
      expect(state.author.verified).toBe(true)
    })
  })

  describe('addDoom', () => {
    it('should add doom tokens to balance', () => {
      useUserStore.getState().addDoom(50)

      expect(useUserStore.getState().doomBalance).toBe(150)
    })

    it('should handle adding zero', () => {
      useUserStore.getState().addDoom(0)

      expect(useUserStore.getState().doomBalance).toBe(100)
    })
  })

  describe('spendDoom', () => {
    it('should deduct doom tokens when sufficient balance', () => {
      const result = useUserStore.getState().spendDoom(30)

      expect(result).toBe(true)
      expect(useUserStore.getState().doomBalance).toBe(70)
    })

    it('should return false when insufficient balance', () => {
      const result = useUserStore.getState().spendDoom(150)

      expect(result).toBe(false)
      expect(useUserStore.getState().doomBalance).toBe(100)
    })

    it('should allow spending exact balance', () => {
      const result = useUserStore.getState().spendDoom(100)

      expect(result).toBe(true)
      expect(useUserStore.getState().doomBalance).toBe(0)
    })
  })

  describe('getLifePostCost', () => {
    it('should return base cost for new user', () => {
      useUserStore.setState({ daysLiving: 0, lifePosts: 0 })

      const cost = useUserStore.getState().getLifePostCost()
      expect(cost).toBe(1) // max(1, 0+1) + floor(0/10) = 1 + 0 = 1
    })

    it('should increase cost with days living', () => {
      useUserStore.setState({ daysLiving: 5, lifePosts: 0 })

      const cost = useUserStore.getState().getLifePostCost()
      expect(cost).toBe(6) // max(1, 5+1) + floor(0/10) = 6 + 0 = 6
    })

    it('should increase cost with life posts', () => {
      useUserStore.setState({ daysLiving: 0, lifePosts: 20 })

      const cost = useUserStore.getState().getLifePostCost()
      expect(cost).toBe(3) // max(1, 0+1) + floor(20/10) = 1 + 2 = 3
    })

    it('should combine days and posts for cost', () => {
      useUserStore.setState({ daysLiving: 10, lifePosts: 30 })

      const cost = useUserStore.getState().getLifePostCost()
      expect(cost).toBe(14) // max(1, 10+1) + floor(30/10) = 11 + 3 = 14
    })
  })

  describe('following', () => {
    describe('followUser', () => {
      it('should add user to following list', () => {
        useUserStore.getState().followUser('otheruser')

        expect(useUserStore.getState().following).toContain('otheruser')
      })

      it('should not duplicate if already following', () => {
        useUserStore.getState().followUser('otheruser')
        useUserStore.getState().followUser('otheruser')

        const following = useUserStore.getState().following
        expect(following.filter(u => u === 'otheruser')).toHaveLength(1)
      })
    })

    describe('unfollowUser', () => {
      it('should remove user from following list', () => {
        useUserStore.setState({ following: ['user1', 'user2'] })

        useUserStore.getState().unfollowUser('user1')

        const following = useUserStore.getState().following
        expect(following).not.toContain('user1')
        expect(following).toContain('user2')
      })

      it('should handle unfollowing user not in list', () => {
        useUserStore.setState({ following: ['user1'] })

        useUserStore.getState().unfollowUser('user2')

        expect(useUserStore.getState().following).toEqual(['user1'])
      })
    })

    describe('isFollowing', () => {
      it('should return true if following', () => {
        useUserStore.setState({ following: ['user1', 'user2'] })

        expect(useUserStore.getState().isFollowing('user1')).toBe(true)
      })

      it('should return false if not following', () => {
        useUserStore.setState({ following: ['user1'] })

        expect(useUserStore.getState().isFollowing('user2')).toBe(false)
      })
    })
  })

  describe('donateLife', () => {
    it('should deduct doom when donating', () => {
      const result = useUserStore.getState().donateLife(10)

      expect(result).toBe(true)
      expect(useUserStore.getState().doomBalance).toBe(90)
    })

    it('should fail if insufficient doom', () => {
      const result = useUserStore.getState().donateLife(200)

      expect(result).toBe(false)
      expect(useUserStore.getState().doomBalance).toBe(100)
    })
  })

  describe('addLife', () => {
    it('should add life tokens', () => {
      useUserStore.getState().addLife(50)

      expect(useUserStore.getState().lifeBalance).toBe(50)
    })
  })

  describe('incrementLifePosts', () => {
    it('should increment life post count', () => {
      useUserStore.getState().incrementLifePosts()
      useUserStore.getState().incrementLifePosts()

      expect(useUserStore.getState().lifePosts).toBe(2)
    })
  })

  describe('setConnected', () => {
    it('should update connected state', () => {
      useUserStore.getState().setConnected(true)

      expect(useUserStore.getState().isConnected).toBe(true)

      useUserStore.getState().setConnected(false)

      expect(useUserStore.getState().isConnected).toBe(false)
    })
  })
})
