/**
 * Events Store
 *
 * Zustand store for managing prediction events (doom countdowns).
 * Handles:
 * - Event CRUD operations
 * - Betting on events (doom vs life)
 * - Event status updates
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PredictionEvent, EventCategory, ID, Bet } from '@/types'

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

/** Get current timestamp */
const now = (): number => Date.now()

/** Days to milliseconds */
const daysToMs = (days: number): number => days * 24 * 60 * 60 * 1000

interface EventsState {
  /** All events indexed by ID */
  events: Record<ID, PredictionEvent>
  /** User's bets */
  bets: Bet[]

  // Actions
  /** Create a new prediction event */
  createEvent: (
    title: string,
    description: string,
    category: EventCategory,
    daysUntilEnd: number
  ) => PredictionEvent
  /** Place a bet on an event */
  placeBet: (eventId: ID, side: 'doom' | 'life', amount: number, userId: ID) => Bet | null
  /** Get all events sorted by countdown */
  getEvents: () => PredictionEvent[]
  /** Get event by ID */
  getEvent: (eventId: ID) => PredictionEvent | undefined
  /** Get user's bets */
  getUserBets: (userId: ID) => Bet[]
}

/**
 * Initial mock events
 */
const initialEvents: Record<ID, PredictionEvent> = {
  'event-1': {
    id: 'event-1',
    title: 'AI Singularity',
    description: 'Artificial General Intelligence surpasses human intelligence, leading to rapid recursive self-improvement.',
    category: 'technology',
    countdownEnd: now() + daysToMs(847),
    doomStake: 125000,
    lifeStake: 89000,
    status: 'active',
    linkedPosts: [],
    createdAt: now() - daysToMs(30),
    createdBy: { address: null, username: 'techprophet' },
  },
  'event-2': {
    id: 'event-2',
    title: 'Global Economic Collapse',
    description: 'Systemic failure of global financial markets leading to widespread economic depression.',
    category: 'economic',
    countdownEnd: now() + daysToMs(182),
    doomStake: 450000,
    lifeStake: 320000,
    status: 'active',
    linkedPosts: [],
    createdAt: now() - daysToMs(45),
    createdBy: { address: null, username: 'econwatcher' },
  },
  'event-3': {
    id: 'event-3',
    title: 'Climate Tipping Point',
    description: 'Irreversible climate feedback loops trigger catastrophic environmental changes.',
    category: 'climate',
    countdownEnd: now() + daysToMs(1460),
    doomStake: 89000,
    lifeStake: 156000,
    status: 'active',
    linkedPosts: [],
    createdAt: now() - daysToMs(60),
    createdBy: { address: null, username: 'climatewatch' },
  },
  'event-4': {
    id: 'event-4',
    title: 'Nuclear Incident',
    description: 'Major nuclear event - war, accident, or terrorism involving nuclear weapons or materials.',
    category: 'war',
    countdownEnd: now() + daysToMs(365),
    doomStake: 78000,
    lifeStake: 234000,
    status: 'active',
    linkedPosts: [],
    createdAt: now() - daysToMs(20),
    createdBy: { address: null, username: 'geowatcher' },
  },
  'event-5': {
    id: 'event-5',
    title: 'Pandemic X',
    description: 'Novel pathogen causes global pandemic worse than COVID-19.',
    category: 'natural',
    countdownEnd: now() + daysToMs(730),
    doomStake: 145000,
    lifeStake: 198000,
    status: 'active',
    linkedPosts: [],
    createdAt: now() - daysToMs(15),
    createdBy: { address: null, username: 'biowatcher' },
  },
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: initialEvents,
      bets: [],

      createEvent: (title, description, category, daysUntilEnd) => {
        const event: PredictionEvent = {
          id: generateId(),
          title,
          description,
          category,
          countdownEnd: now() + daysToMs(daysUntilEnd),
          doomStake: 0,
          lifeStake: 0,
          status: 'active',
          linkedPosts: [],
          createdAt: now(),
          createdBy: { address: null, username: 'anonymous' },
        }

        set((state) => ({
          events: { ...state.events, [event.id]: event },
        }))

        return event
      },

      placeBet: (eventId, side, amount, userId) => {
        const event = get().events[eventId]
        if (!event || event.status !== 'active') return null

        const bet: Bet = {
          id: generateId(),
          eventId,
          userId,
          side,
          amount,
          createdAt: now(),
        }

        set((state) => ({
          events: {
            ...state.events,
            [eventId]: {
              ...event,
              doomStake: side === 'doom' ? event.doomStake + amount : event.doomStake,
              lifeStake: side === 'life' ? event.lifeStake + amount : event.lifeStake,
            },
          },
          bets: [...state.bets, bet],
        }))

        return bet
      },

      getEvents: () => {
        const events = Object.values(get().events)
        // Sort by countdown (soonest first)
        return events.sort((a, b) => a.countdownEnd - b.countdownEnd)
      },

      getEvent: (eventId) => {
        return get().events[eventId]
      },

      getUserBets: (userId) => {
        return get().bets.filter((bet) => bet.userId === userId)
      },
    }),
    {
      name: 'doomsday-events',
    }
  )
)
