/**
 * Events Store Tests
 * Issues #34, #35, #36: Tests for prediction event management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEventsStore } from './events'

describe('events store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useEventsStore.setState({
      events: {},
      bets: [],
      onChainBets: {},
      isLoading: false,
      error: null,
      lastSyncAt: null,
    })
  })

  describe('initial state', () => {
    it('should have empty events when reset', () => {
      const state = useEventsStore.getState()
      expect(Object.keys(state.events)).toHaveLength(0)
    })

    it('should have empty bets array', () => {
      const state = useEventsStore.getState()
      expect(state.bets).toEqual([])
    })

    it('should not be loading', () => {
      const state = useEventsStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should have no error', () => {
      const state = useEventsStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('createEvent', () => {
    it('should create an event with all fields', () => {
      const { createEvent } = useEventsStore.getState()

      const event = createEvent(
        'Test Event',
        'Test description',
        'technology',
        30
      )

      expect(event.title).toBe('Test Event')
      expect(event.description).toBe('Test description')
      expect(event.category).toBe('technology')
      expect(event.status).toBe('active')
      expect(event.doomStake).toBe(0)
      expect(event.lifeStake).toBe(0)
    })

    it('should generate unique IDs', () => {
      const { createEvent } = useEventsStore.getState()

      const event1 = createEvent('Event 1', 'Desc 1', 'technology', 30)
      const event2 = createEvent('Event 2', 'Desc 2', 'economic', 60)

      expect(event1.id).not.toBe(event2.id)
    })

    it('should add event to store', () => {
      const { createEvent, getEvent } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'climate', 30)
      const stored = getEvent(event.id)

      expect(stored).toBeDefined()
      expect(stored?.title).toBe('Test')
    })

    it('should set countdown end based on days', () => {
      const { createEvent } = useEventsStore.getState()
      const now = Date.now()
      vi.setSystemTime(now)

      const event = createEvent('Test', 'Desc', 'technology', 7)

      // 7 days in milliseconds
      const expectedEnd = now + 7 * 24 * 60 * 60 * 1000
      expect(event.countdownEnd).toBeCloseTo(expectedEnd, -3) // Within ~1 second
    })
  })

  describe('placeBet', () => {
    it('should place a doom bet on an event', () => {
      const { createEvent, placeBet, getEvent } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'technology', 30)
      const bet = placeBet(event.id, 'doom', 100, 'user-1')

      expect(bet).not.toBeNull()
      expect(bet?.side).toBe('doom')
      expect(bet?.amount).toBe(100)

      const updatedEvent = getEvent(event.id)
      expect(updatedEvent?.doomStake).toBe(100)
      expect(updatedEvent?.lifeStake).toBe(0)
    })

    it('should place a life bet on an event', () => {
      const { createEvent, placeBet, getEvent } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'technology', 30)
      const bet = placeBet(event.id, 'life', 50, 'user-1')

      expect(bet?.side).toBe('life')
      expect(bet?.amount).toBe(50)

      const updatedEvent = getEvent(event.id)
      expect(updatedEvent?.doomStake).toBe(0)
      expect(updatedEvent?.lifeStake).toBe(50)
    })

    it('should accumulate stakes from multiple bets', () => {
      const { createEvent, placeBet, getEvent } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'technology', 30)
      placeBet(event.id, 'doom', 100, 'user-1')
      placeBet(event.id, 'doom', 50, 'user-2')
      placeBet(event.id, 'life', 75, 'user-3')

      const updatedEvent = getEvent(event.id)
      expect(updatedEvent?.doomStake).toBe(150)
      expect(updatedEvent?.lifeStake).toBe(75)
    })

    it('should return null for non-existent event', () => {
      const { placeBet } = useEventsStore.getState()

      const bet = placeBet('non-existent', 'doom', 100, 'user-1')

      expect(bet).toBeNull()
    })

    it('should add bet to bets array', () => {
      const { createEvent, placeBet, getUserBets } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'technology', 30)
      placeBet(event.id, 'doom', 100, 'user-1')

      const userBets = getUserBets('user-1')
      expect(userBets).toHaveLength(1)
      expect(userBets[0].amount).toBe(100)
    })
  })

  describe('getEvents', () => {
    it('should return empty array when no events', () => {
      const { getEvents } = useEventsStore.getState()

      const events = getEvents()

      expect(events).toEqual([])
    })

    it('should return all events', () => {
      const { createEvent, getEvents } = useEventsStore.getState()

      createEvent('Event 1', 'Desc 1', 'technology', 30)
      createEvent('Event 2', 'Desc 2', 'economic', 60)

      const events = getEvents()

      expect(events).toHaveLength(2)
    })

    it('should sort events by countdown end (soonest first)', () => {
      const { createEvent, getEvents } = useEventsStore.getState()

      createEvent('Later Event', 'Desc', 'technology', 60)
      createEvent('Sooner Event', 'Desc', 'technology', 7)
      createEvent('Middle Event', 'Desc', 'technology', 30)

      const events = getEvents()

      expect(events[0].title).toBe('Sooner Event')
      expect(events[1].title).toBe('Middle Event')
      expect(events[2].title).toBe('Later Event')
    })
  })

  describe('getEvent', () => {
    it('should return event by ID', () => {
      const { createEvent, getEvent } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'technology', 30)
      const retrieved = getEvent(event.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(event.id)
    })

    it('should return undefined for non-existent event', () => {
      const { getEvent } = useEventsStore.getState()

      const event = getEvent('non-existent-id')

      expect(event).toBeUndefined()
    })
  })

  describe('getUserBets', () => {
    it('should return empty array for user with no bets', () => {
      const { getUserBets } = useEventsStore.getState()

      const bets = getUserBets('user-1')

      expect(bets).toEqual([])
    })

    it('should return only bets for specified user', () => {
      const { createEvent, placeBet, getUserBets } = useEventsStore.getState()

      const event = createEvent('Test', 'Desc', 'technology', 30)
      placeBet(event.id, 'doom', 100, 'user-1')
      placeBet(event.id, 'life', 50, 'user-2')
      placeBet(event.id, 'doom', 75, 'user-1')

      const user1Bets = getUserBets('user-1')
      const user2Bets = getUserBets('user-2')

      expect(user1Bets).toHaveLength(2)
      expect(user2Bets).toHaveLength(1)
    })
  })

  describe('getOnChainBet', () => {
    it('should return undefined for non-existent PDA', () => {
      const { getOnChainBet } = useEventsStore.getState()

      const bet = getOnChainBet('non-existent-pda')

      expect(bet).toBeUndefined()
    })

    it('should return bet for existing PDA', () => {
      useEventsStore.setState((state) => ({
        ...state,
        onChainBets: {
          'test-pda': {
            eventId: 'event-1',
            eventPDA: 'test-pda',
            outcome: 'doom',
            amount: 100,
            placedAt: Date.now(),
            claimed: false,
            refunded: false,
            canClaim: false,
            estimatedPayout: 150,
          },
        },
      }))

      const { getOnChainBet } = useEventsStore.getState()
      const bet = getOnChainBet('test-pda')

      expect(bet).toBeDefined()
      expect(bet?.amount).toBe(100)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useEventsStore.getState()

      setError('Test error')

      const state = useEventsStore.getState()
      expect(state.error).toBe('Test error')
    })

    it('should clear error with null', () => {
      useEventsStore.setState({ error: 'Previous error' })
      const { setError } = useEventsStore.getState()

      setError(null)

      const state = useEventsStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('clearOnChainData', () => {
    it('should clear onChainBets and lastSyncAt', () => {
      useEventsStore.setState({
        onChainBets: {
          'test-pda': {
            eventId: 'event-1',
            eventPDA: 'test-pda',
            outcome: 'doom',
            amount: 100,
            placedAt: Date.now(),
            claimed: false,
            refunded: false,
            canClaim: false,
            estimatedPayout: 150,
          },
        },
        lastSyncAt: Date.now(),
      })

      const { clearOnChainData } = useEventsStore.getState()
      clearOnChainData()

      const state = useEventsStore.getState()
      expect(state.onChainBets).toEqual({})
      expect(state.lastSyncAt).toBeNull()
    })
  })
})
