/**
 * Bet Factory - Generate mock bet data for testing
 */

import { faker } from '@faker-js/faker'
import type { Bet, ID } from '../../types'

export interface CreateMockBetOptions {
  id?: ID
  eventId?: ID
  userId?: ID
  side?: 'doom' | 'life'
  amount?: number
  createdAt?: number
}

export function createMockBet(options: CreateMockBetOptions = {}): Bet {
  return {
    id: options.id ?? faker.string.uuid(),
    eventId: options.eventId ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    side: options.side ?? faker.helpers.arrayElement<'doom' | 'life'>(['doom', 'life']),
    amount: options.amount ?? faker.number.int({ min: 10, max: 5000 }),
    createdAt: options.createdAt ?? faker.date.recent({ days: 30 }).getTime(),
  }
}

export function createMockDoomBet(options: Omit<CreateMockBetOptions, 'side'> = {}): Bet {
  return createMockBet({ ...options, side: 'doom' })
}

export function createMockLifeBet(options: Omit<CreateMockBetOptions, 'side'> = {}): Bet {
  return createMockBet({ ...options, side: 'life' })
}

export function createMockBetsForEvent(eventId: ID, count: number, options: Omit<CreateMockBetOptions, 'eventId'> = {}): Bet[] {
  return Array.from({ length: count }, () => createMockBet({ ...options, eventId }))
}

export function createMockBetsForUser(userId: ID, count: number, options: Omit<CreateMockBetOptions, 'userId'> = {}): Bet[] {
  return Array.from({ length: count }, () => createMockBet({ ...options, userId }))
}

export function createMockBets(count: number, options: CreateMockBetOptions = {}): Bet[] {
  return Array.from({ length: count }, () => createMockBet(options))
}

export function createMockBalancedBets(eventId: ID, doomCount: number, lifeCount: number): { doomBets: Bet[]; lifeBets: Bet[] } {
  return {
    doomBets: createMockBetsForEvent(eventId, doomCount, { side: 'doom' }),
    lifeBets: createMockBetsForEvent(eventId, lifeCount, { side: 'life' }),
  }
}
