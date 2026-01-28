/**
 * Events Store + User Store Integration Tests
 *
 * Tests interactions between prediction events/betting and user balances.
 * Covers:
 * - Placing bets affects user $DOOM balance
 * - Betting limits enforced based on balance
 * - Multiple bets on same event
 * - Bet tracking by user
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './user'
import { useEventsStore } from './events'

describe('Events Store + User Store Integration', () => {
  beforeEach(() => {
    useUserStore.setState({
      userId: 'test-user-id',
      author: { address: null, username: 'testuser' },
      displayName: '',
      bio: '',
      doomBalance: 100,
      lifeBalance: 0,
      daysLiving: 0,
      lifePosts: 0,
      isConnected: false,
      following: [],
      blocked: [],
      muted: [],
    })

    useEventsStore.setState({
      events: {
        'event-1': {
          id: 'event-1',
          title: 'Test Event',
          description: 'Test description',
          category: 'technology',
          countdownEnd: Date.now() + 7 * 24 * 60 * 60 * 1000,
          doomStake: 1000,
          lifeStake: 800,
          status: 'active',
          linkedPosts: [],
          createdAt: Date.now(),
          createdBy: { address: null, username: 'creator' },
        },
      },
      bets: [],
    })
  })

  describe('Betting Flow with Balance', () => {
    it('should deduct $DOOM when placing a bet', () => {
      const userStore = useUserStore.getState()
      const eventsStore = useEventsStore.getState()
      const userId = userStore.userId
      const initialBalance = userStore.doomBalance
      const betAmount = 25

      const canAfford = userStore.spendDoom(betAmount)
      expect(canAfford).toBe(true)

      if (canAfford) {
        const bet = eventsStore.placeBet('event-1', 'doom', betAmount, userId)
        expect(bet).not.toBeNull()
      }

      expect(useUserStore.getState().doomBalance).toBe(initialBalance - betAmount)

      const event = useEventsStore.getState().events['event-1']
      expect(event.doomStake).toBe(1025)
    })

    it('should prevent betting when insufficient balance', () => {
      const userStore = useUserStore.getState()
      const eventsStore = useEventsStore.getState()
      const userId = userStore.userId
      const betAmount = 200

      const canAfford = userStore.spendDoom(betAmount)
      expect(canAfford).toBe(false)

      expect(useUserStore.getState().doomBalance).toBe(100)

      const bets = eventsStore.getUserBets(userId)
      expect(bets).toHaveLength(0)
    })

    it('should allow placing bets on life side', () => {
      const userStore = useUserStore.getState()
      const eventsStore = useEventsStore.getState()
      const userId = userStore.userId
      const betAmount = 30

      if (userStore.spendDoom(betAmount)) {
        eventsStore.placeBet('event-1', 'life', betAmount, userId)
      }

      const event = useEventsStore.getState().events['event-1']
      expect(event.lifeStake).toBe(830)
      expect(event.doomStake).toBe(1000)
    })

    it('should track multiple bets by the same user', () => {
      const userId = useUserStore.getState().userId

      const betsToPlace = [
        { side: 'doom' as const, amount: 10 },
        { side: 'life' as const, amount: 15 },
        { side: 'doom' as const, amount: 20 },
      ]

      betsToPlace.forEach(({ side, amount }) => {
        if (useUserStore.getState().spendDoom(amount)) {
          useEventsStore.getState().placeBet('event-1', side, amount, userId)
        }
      })

      const userBets = useEventsStore.getState().getUserBets(userId)
      expect(userBets).toHaveLength(3)
      expect(useUserStore.getState().doomBalance).toBe(100 - 10 - 15 - 20)
    })

    it('should handle betting until balance exhausted', () => {
      const userId = useUserStore.getState().userId
      let successfulBets = 0

      while (useUserStore.getState().doomBalance >= 10) {
        if (useUserStore.getState().spendDoom(10)) {
          useEventsStore.getState().placeBet('event-1', 'doom', 10, userId)
          successfulBets++
        }
      }

      expect(successfulBets).toBe(10)
      expect(useUserStore.getState().doomBalance).toBe(0)
      expect(useEventsStore.getState().getUserBets(userId)).toHaveLength(10)
    })
  })

  describe('Event Creation and Betting', () => {
    it('should allow betting on newly created events', () => {
      const eventsStore = useEventsStore.getState()
      const userId = useUserStore.getState().userId

      const newEvent = eventsStore.createEvent('New Prediction', 'Will this happen?', 'economic', 30)

      expect(newEvent.doomStake).toBe(0)
      expect(newEvent.lifeStake).toBe(0)

      if (useUserStore.getState().spendDoom(50)) {
        const bet = useEventsStore.getState().placeBet(newEvent.id, 'doom', 50, userId)
        expect(bet).not.toBeNull()
      }

      const updatedEvent = useEventsStore.getState().events[newEvent.id]
      expect(updatedEvent.doomStake).toBe(50)
    })

    it('should not allow betting on non-active events', () => {
      useEventsStore.setState((state) => ({
        events: {
          ...state.events,
          'event-1': {
            ...state.events['event-1'],
            status: 'expired',
          },
        },
      }))

      const userId = useUserStore.getState().userId
      const bet = useEventsStore.getState().placeBet('event-1', 'doom', 25, userId)
      expect(bet).toBeNull()
    })
  })

  describe('Multi-Event Betting', () => {
    it('should handle betting across multiple events', () => {
      const eventsStore = useEventsStore.getState()
      const userId = useUserStore.getState().userId

      const event2 = eventsStore.createEvent('Event 2', 'Description 2', 'climate', 60)
      const event3 = eventsStore.createEvent('Event 3', 'Description 3', 'war', 90)

      const betAmounts = [
        { eventId: 'event-1', amount: 20, side: 'doom' as const },
        { eventId: event2.id, amount: 30, side: 'life' as const },
        { eventId: event3.id, amount: 25, side: 'doom' as const },
      ]

      betAmounts.forEach(({ eventId, amount, side }) => {
        if (useUserStore.getState().spendDoom(amount)) {
          useEventsStore.getState().placeBet(eventId, side, amount, userId)
        }
      })

      const userBets = useEventsStore.getState().getUserBets(userId)
      expect(userBets).toHaveLength(3)
      expect(useUserStore.getState().doomBalance).toBe(100 - 20 - 30 - 25)

      const finalState = useEventsStore.getState()
      expect(finalState.events['event-1'].doomStake).toBe(1020)
      expect(finalState.events[event2.id].lifeStake).toBe(30)
      expect(finalState.events[event3.id].doomStake).toBe(25)
    })

    it('should get sorted events by countdown', () => {
      const eventsStore = useEventsStore.getState()

      eventsStore.createEvent('Distant Event', 'Far away', 'natural', 365)
      eventsStore.createEvent('Soon Event', 'Coming soon', 'economic', 7)
      eventsStore.createEvent('Very Soon', 'Imminent', 'technology', 1)

      const events = useEventsStore.getState().getEvents()

      for (let i = 0; i < events.length - 1; i++) {
        expect(events[i].countdownEnd).toBeLessThanOrEqual(events[i + 1].countdownEnd)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero-amount bets gracefully', () => {
      const userId = useUserStore.getState().userId
      const initialBalance = useUserStore.getState().doomBalance
      const bet = useEventsStore.getState().placeBet('event-1', 'doom', 0, userId)

      if (bet) {
        expect(bet.amount).toBe(0)
      }

      expect(useUserStore.getState().doomBalance).toBe(initialBalance)
    })

    it('should handle betting on non-existent event', () => {
      const userId = useUserStore.getState().userId
      const bet = useEventsStore.getState().placeBet('non-existent', 'doom', 10, userId)
      expect(bet).toBeNull()
    })

    it('should maintain bet history correctly', () => {
      const userId = useUserStore.getState().userId

      for (let i = 0; i < 5; i++) {
        if (useUserStore.getState().spendDoom(10)) {
          useEventsStore.getState().placeBet('event-1', i % 2 === 0 ? 'doom' : 'life', 10, userId)
        }
      }

      const bets = useEventsStore.getState().getUserBets(userId)

      const betIds = bets.map((b) => b.id)
      const uniqueIds = new Set(betIds)
      expect(uniqueIds.size).toBe(5)

      expect(bets.every((b) => b.userId === userId)).toBe(true)
      expect(bets.every((b) => b.eventId === 'event-1')).toBe(true)
    })
  })
})
