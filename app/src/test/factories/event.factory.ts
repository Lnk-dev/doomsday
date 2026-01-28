/**
 * Event Factory - Generate mock prediction event data for testing
 */

import { faker } from '@faker-js/faker'
import type { PredictionEvent, EventCategory, EventStatus, Author, ID } from '../../types'
import { createMockAuthor, type CreateMockAuthorOptions } from './user.factory'

export interface CreateMockEventOptions {
  id?: ID
  title?: string
  description?: string
  category?: EventCategory
  countdownEnd?: number
  doomStake?: number
  lifeStake?: number
  status?: EventStatus
  linkedPosts?: ID[]
  createdAt?: number
  createdBy?: Author | CreateMockAuthorOptions
}

const EVENT_CATEGORIES: EventCategory[] = [
  'technology', 'economic', 'climate', 'war', 'natural', 'social', 'other',
]

const EVENT_TITLES_BY_CATEGORY: Record<EventCategory, string[]> = {
  technology: ['AGI Achieved Before 2030', 'Major Social Media Platform Shutdown', 'Quantum Computer Breaks Encryption'],
  economic: ['Stock Market Crash Over 30%', 'Major Bank Failure', 'Cryptocurrency Market Collapse'],
  climate: ['Category 6 Hurricane Hits Coast', 'Arctic Ice-Free Summer', 'Major City Water Crisis'],
  war: ['New Global Conflict Emerges', 'Cyber Attack on Infrastructure', 'Nuclear Threat Escalation'],
  natural: ['Magnitude 8+ Earthquake', 'Supervolcano Activity', 'Major Pandemic Outbreak'],
  social: ['Mass Migration Event', 'Major Government Collapse', 'Global Protest Movement'],
  other: ['Unexpected Black Swan Event', 'First Contact Scenario', 'Major Scientific Discovery'],
}

function generateEventTitle(category: EventCategory): string {
  return faker.helpers.arrayElement(EVENT_TITLES_BY_CATEGORY[category])
}

function generateEventDescription(): string {
  return `${faker.lorem.paragraph({ min: 2, max: 4 })} ${faker.helpers.arrayElement([
    'Experts warn this could happen sooner than expected.',
    'Historical patterns suggest high probability.',
    'Multiple indicators point to this outcome.',
  ])}`
}

export function createMockEvent(options: CreateMockEventOptions = {}): PredictionEvent {
  const category = options.category ?? faker.helpers.arrayElement(EVENT_CATEGORIES)
  const title = options.title ?? generateEventTitle(category)
  const status = options.status ?? faker.helpers.arrayElement<EventStatus>(['active', 'occurred', 'expired'])
  const countdownEnd = options.countdownEnd ?? (status === 'active' ? faker.date.future({ years: 1 }).getTime() : faker.date.past({ years: 1 }).getTime())
  const createdBy = options.createdBy
    ? ('username' in options.createdBy && 'address' in options.createdBy ? options.createdBy as Author : createMockAuthor(options.createdBy as CreateMockAuthorOptions))
    : createMockAuthor()

  return {
    id: options.id ?? faker.string.uuid(),
    title,
    description: options.description ?? generateEventDescription(),
    category,
    countdownEnd,
    doomStake: options.doomStake ?? faker.number.int({ min: 100, max: 100000 }),
    lifeStake: options.lifeStake ?? faker.number.int({ min: 100, max: 100000 }),
    status,
    linkedPosts: options.linkedPosts ?? Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => faker.string.uuid()),
    createdAt: options.createdAt ?? faker.date.past({ years: 1 }).getTime(),
    createdBy,
  }
}

export function createMockActiveEvent(options: Omit<CreateMockEventOptions, 'status'> = {}): PredictionEvent {
  return createMockEvent({ ...options, status: 'active', countdownEnd: options.countdownEnd ?? faker.date.future({ years: 1 }).getTime() })
}

export function createMockOccurredEvent(options: Omit<CreateMockEventOptions, 'status'> = {}): PredictionEvent {
  return createMockEvent({ ...options, status: 'occurred', countdownEnd: options.countdownEnd ?? faker.date.past({ years: 1 }).getTime() })
}

export function createMockExpiredEvent(options: Omit<CreateMockEventOptions, 'status'> = {}): PredictionEvent {
  return createMockEvent({ ...options, status: 'expired', countdownEnd: options.countdownEnd ?? faker.date.past({ years: 1 }).getTime() })
}

export function createMockEvents(count: number, options: CreateMockEventOptions = {}): PredictionEvent[] {
  return Array.from({ length: count }, () => createMockEvent(options))
}

export function createMockEventsByCategory(category: EventCategory, count: number, options: Omit<CreateMockEventOptions, 'category'> = {}): PredictionEvent[] {
  return Array.from({ length: count }, () => createMockEvent({ ...options, category }))
}
