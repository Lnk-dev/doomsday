/**
 * Events Store
 * Issues #34, #35, #36, #54: On-chain prediction market integration
 *
 * Zustand store for managing prediction events (doom countdowns).
 * Handles:
 * - Event CRUD operations
 * - Betting on events (doom vs life)
 * - Event status updates
 * - On-chain synchronization
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import type { PredictionEvent, EventCategory, ID, Bet } from '@/types'
import {
  fetchAllEvents,
  fetchEvent,
  fetchUserBet,
  buildPlaceBetTransaction,
  buildCreateEventTransaction,
  buildClaimWinningsTransaction,
  findEventPDA,
  Outcome,
  EventStatus as OnChainEventStatus,
  type PredictionEvent as OnChainEvent,
  calculateEstimatedPayout,
} from '@/lib/solana/programs/predictionMarket'

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

/** Get current timestamp */
const now = (): number => Date.now()

/** Days to milliseconds */
const daysToMs = (days: number): number => days * 24 * 60 * 60 * 1000

/** Convert on-chain event to frontend format */
function onChainEventToFrontend(event: OnChainEvent, onChainId: number): PredictionEvent {
  const statusMap: Record<OnChainEventStatus, 'active' | 'occurred' | 'expired'> = {
    [OnChainEventStatus.Active]: 'active',
    [OnChainEventStatus.Resolved]: event.outcome === Outcome.Doom ? 'occurred' : 'expired',
    [OnChainEventStatus.Cancelled]: 'expired',
  }

  return {
    id: `onchain-${onChainId}`,
    title: event.title,
    description: event.description,
    category: 'technology' as EventCategory, // Default, could be enhanced
    countdownEnd: event.deadline.toNumber() * 1000, // Convert from Unix seconds to JS milliseconds
    doomStake: event.doomPool.toNumber() / 1e9, // Convert from raw tokens to UI amount
    lifeStake: event.lifePool.toNumber() / 1e9,
    status: statusMap[event.status],
    linkedPosts: [],
    createdAt: event.createdAt.toNumber() * 1000,
    createdBy: { address: event.creator.toBase58(), username: event.creator.toBase58().slice(0, 8) },
    onChainEventId: onChainId,
    onChainPDA: findEventPDA(onChainId)[0].toBase58(),
  }
}

interface OnChainBetInfo {
  eventId: string
  eventPDA: string
  outcome: 'doom' | 'life'
  amount: number
  placedAt: number
  claimed: boolean
  refunded: boolean
  canClaim: boolean
  estimatedPayout: number
}

interface EventsState {
  /** All events indexed by ID */
  events: Record<ID, PredictionEvent>
  /** User's bets (local tracking) */
  bets: Bet[]
  /** On-chain bet info keyed by event PDA */
  onChainBets: Record<string, OnChainBetInfo>
  /** Loading state for on-chain operations */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Last sync timestamp */
  lastSyncAt: number | null

  // Local actions (mock for development)
  createEvent: (
    title: string,
    description: string,
    category: EventCategory,
    daysUntilEnd: number
  ) => PredictionEvent
  placeBet: (eventId: ID, side: 'doom' | 'life', amount: number, userId: ID) => Bet | null

  // Getters
  getEvents: () => PredictionEvent[]
  getEvent: (eventId: ID) => PredictionEvent | undefined
  getUserBets: (userId: ID) => Bet[]
  getOnChainBet: (eventPDA: string) => OnChainBetInfo | undefined

  // On-chain actions
  syncEventsFromChain: (connection: Connection) => Promise<void>
  syncEventFromChain: (connection: Connection, eventId: number) => Promise<PredictionEvent | null>
  syncUserBetsFromChain: (connection: Connection, userPubkey: PublicKey) => Promise<void>

  // Transaction builders (return transaction for wallet to sign)
  createEventOnChain: (
    connection: Connection,
    creator: PublicKey,
    eventId: number,
    title: string,
    description: string,
    deadline: number,
    resolutionDeadline: number
  ) => Promise<{ transaction: Transaction; eventPDA: string }>

  placeBetOnChain: (
    connection: Connection,
    user: PublicKey,
    eventId: number,
    outcome: 'doom' | 'life',
    amount: number
  ) => Promise<{ transaction: Transaction; estimatedPayout: number }>

  claimWinningsOnChain: (
    connection: Connection,
    user: PublicKey,
    eventId: number,
    betOutcome: 0 | 1
  ) => Promise<{ transaction: Transaction }>

  // Helpers
  setError: (error: string | null) => void
  clearOnChainData: () => void
}

/**
 * Initial mock events for development
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
      onChainBets: {},
      isLoading: false,
      error: null,
      lastSyncAt: null,

      // Local mock actions (for development without blockchain)
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
        return events.sort((a, b) => a.countdownEnd - b.countdownEnd)
      },

      getEvent: (eventId) => {
        return get().events[eventId]
      },

      getUserBets: (userId) => {
        return get().bets.filter((bet) => bet.userId === userId)
      },

      getOnChainBet: (eventPDA) => {
        return get().onChainBets[eventPDA]
      },

      // On-chain sync actions
      syncEventsFromChain: async (connection) => {
        set({ isLoading: true, error: null })

        try {
          const onChainEvents = await fetchAllEvents(connection)

          const eventsRecord: Record<ID, PredictionEvent> = { ...get().events }

          for (const event of onChainEvents) {
            const eventId = event.eventId.toNumber()
            const frontendEvent = onChainEventToFrontend(event, eventId)
            eventsRecord[frontendEvent.id] = frontendEvent
          }

          set({
            events: eventsRecord,
            lastSyncAt: Date.now(),
            isLoading: false,
          })
        } catch (error) {
          console.error('Failed to sync events from chain:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to sync events',
            isLoading: false,
          })
        }
      },

      syncEventFromChain: async (connection, eventId) => {
        set({ isLoading: true, error: null })

        try {
          const event = await fetchEvent(connection, eventId)
          if (!event) {
            set({ isLoading: false })
            return null
          }

          const frontendEvent = onChainEventToFrontend(event, eventId)

          set((state) => ({
            events: { ...state.events, [frontendEvent.id]: frontendEvent },
            isLoading: false,
          }))

          return frontendEvent
        } catch (error) {
          console.error('Failed to sync event from chain:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to sync event',
            isLoading: false,
          })
          return null
        }
      },

      syncUserBetsFromChain: async (connection, userPubkey) => {
        set({ isLoading: true, error: null })

        try {
          const events = Object.values(get().events).filter((e) => e.onChainEventId !== undefined)

          const onChainBets: Record<string, OnChainBetInfo> = {}

          for (const event of events) {
            if (!event.onChainPDA) continue

            try {
              const eventPDA = new PublicKey(event.onChainPDA)
              const userBet = await fetchUserBet(connection, eventPDA, userPubkey)

              if (userBet) {
                // Calculate estimated payout
                const { payout } = calculateEstimatedPayout(
                  userBet.amount.toNumber() / 1e9,
                  userBet.outcome,
                  event.doomStake,
                  event.lifeStake,
                  200 // Default 2% fee
                )

                const eventResolved = event.status !== 'active'
                const isWinner =
                  eventResolved &&
                  ((event.status === 'occurred' && userBet.outcome === Outcome.Doom) ||
                    (event.status === 'expired' && userBet.outcome === Outcome.Life))

                onChainBets[event.onChainPDA] = {
                  eventId: event.id,
                  eventPDA: event.onChainPDA,
                  outcome: userBet.outcome === Outcome.Doom ? 'doom' : 'life',
                  amount: userBet.amount.toNumber() / 1e9,
                  placedAt: userBet.placedAt.toNumber() * 1000,
                  claimed: userBet.claimed,
                  refunded: userBet.refunded,
                  canClaim: isWinner && !userBet.claimed,
                  estimatedPayout: payout,
                }
              }
            } catch {
              // No bet for this event, continue
            }
          }

          set({ onChainBets, isLoading: false })
        } catch (error) {
          console.error('Failed to sync user bets from chain:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to sync bets',
            isLoading: false,
          })
        }
      },

      // Transaction builders
      createEventOnChain: async (
        connection,
        creator,
        eventId,
        title,
        description,
        deadline,
        resolutionDeadline
      ) => {
        const transaction = await buildCreateEventTransaction(
          connection,
          creator,
          eventId,
          title,
          description,
          deadline,
          resolutionDeadline
        )

        const [eventPDA] = findEventPDA(eventId)

        return {
          transaction,
          eventPDA: eventPDA.toBase58(),
        }
      },

      placeBetOnChain: async (connection, user, eventId, outcome, amount) => {
        const bnAmount = new BN(amount * 1e9) // Convert to raw token amount

        const transaction = await buildPlaceBetTransaction(
          connection,
          user,
          eventId,
          outcome === 'doom' ? Outcome.Doom : Outcome.Life,
          bnAmount
        )

        // Get current event for payout calculation
        const event = await fetchEvent(connection, eventId)
        let estimatedPayout = amount

        if (event) {
          const { payout } = calculateEstimatedPayout(
            amount,
            outcome === 'doom' ? Outcome.Doom : Outcome.Life,
            event.doomPool.toNumber() / 1e9,
            event.lifePool.toNumber() / 1e9,
            200 // Default 2% fee
          )
          estimatedPayout = payout
        }

        return {
          transaction,
          estimatedPayout,
        }
      },

      claimWinningsOnChain: async (connection, user, eventId, betOutcome) => {
        const transaction = await buildClaimWinningsTransaction(
          connection,
          user,
          eventId,
          betOutcome
        )

        return { transaction }
      },

      setError: (error) => set({ error }),

      clearOnChainData: () =>
        set({
          onChainBets: {},
          lastSyncAt: null,
        }),
    }),
    {
      name: 'doomsday-events',
      partialize: (state) => ({
        events: state.events,
        bets: state.bets,
        // Don't persist on-chain data - it should be re-synced
      }),
    }
  )
)
