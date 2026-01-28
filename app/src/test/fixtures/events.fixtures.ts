/**
 * Event Fixtures - Static test data for prediction event tests
 */

import type { PredictionEvent, EventCategory, EventStatus } from '../../types'
import { TEST_AUTHORS } from './users.fixtures'

const NOW = Date.now()
const DAY = 24 * 60 * 60 * 1000
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export const ACTIVE_EVENTS = {
  aiTakeover: { id: 'event-tech-ai-001', title: 'AGI Achieved Before 2030', description: 'Will artificial general intelligence be achieved before 2030?', category: 'technology' as EventCategory, countdownEnd: NOW + 4 * YEAR, doomStake: 45000, lifeStake: 32000, status: 'active' as EventStatus, linkedPosts: ['doom-post-medium-001'], createdAt: NOW - 30 * DAY, createdBy: TEST_AUTHORS.verified } as PredictionEvent,
  marketCrash: { id: 'event-economic-crash-001', title: 'Stock Market Crash Over 30%', description: 'Will the stock market crash over 30% within 12 months?', category: 'economic' as EventCategory, countdownEnd: NOW + YEAR, doomStake: 78000, lifeStake: 65000, status: 'active' as EventStatus, linkedPosts: ['doom-post-short-001'], createdAt: NOW - 14 * DAY, createdBy: TEST_AUTHORS.doomer } as PredictionEvent,
  heatwave: { id: 'event-climate-heat-001', title: 'Unprecedented Global Heatwave', description: 'Will we see a record-breaking heatwave this summer?', category: 'climate' as EventCategory, countdownEnd: NOW + 60 * DAY, doomStake: 25000, lifeStake: 18000, status: 'active' as EventStatus, linkedPosts: ['doom-post-long-001'], createdAt: NOW - 45 * DAY, createdBy: TEST_AUTHORS.regular } as PredictionEvent,
  cyberAttack: { id: 'event-war-cyber-001', title: 'Major Cyber Attack on Infrastructure', description: 'Will a nation-state cyber attack cause widespread disruption?', category: 'war' as EventCategory, countdownEnd: NOW + 6 * MONTH, doomStake: 34000, lifeStake: 41000, status: 'active' as EventStatus, linkedPosts: [], createdAt: NOW - 7 * DAY, createdBy: TEST_AUTHORS.lifer } as PredictionEvent,
} as const

export const OCCURRED_EVENTS = {
  bankFailure: { id: 'event-economic-bank-001', title: 'Major Bank Failure', description: 'A major financial institution will fail.', category: 'economic' as EventCategory, countdownEnd: NOW - 60 * DAY, doomStake: 52000, lifeStake: 38000, status: 'occurred' as EventStatus, linkedPosts: ['doom-post-short-001'], createdAt: NOW - 180 * DAY, createdBy: TEST_AUTHORS.doomer } as PredictionEvent,
  earthquake: { id: 'event-natural-quake-001', title: 'Magnitude 8+ Earthquake', description: 'A magnitude 8+ earthquake will strike a populated area.', category: 'natural' as EventCategory, countdownEnd: NOW - 30 * DAY, doomStake: 28000, lifeStake: 22000, status: 'occurred' as EventStatus, linkedPosts: [], createdAt: NOW - 120 * DAY, createdBy: TEST_AUTHORS.regular } as PredictionEvent,
} as const

export const EXPIRED_EVENTS = {
  pandemic: { id: 'event-natural-pandemic-001', title: 'New Pandemic Outbreak', description: 'A new pandemic will emerge with global impact.', category: 'natural' as EventCategory, countdownEnd: NOW - 90 * DAY, doomStake: 15000, lifeStake: 45000, status: 'expired' as EventStatus, linkedPosts: ['life-post-medium-001'], createdAt: NOW - 200 * DAY, createdBy: TEST_AUTHORS.lifer } as PredictionEvent,
  collapse: { id: 'event-social-collapse-001', title: 'Major Government Collapse', description: 'A major world power will experience government collapse.', category: 'social' as EventCategory, countdownEnd: NOW - 45 * DAY, doomStake: 8000, lifeStake: 32000, status: 'expired' as EventStatus, linkedPosts: [], createdAt: NOW - 150 * DAY, createdBy: TEST_AUTHORS.anonymous } as PredictionEvent,
} as const

export const ALL_EVENTS: PredictionEvent[] = [...Object.values(ACTIVE_EVENTS), ...Object.values(OCCURRED_EVENTS), ...Object.values(EXPIRED_EVENTS)].sort((a, b) => b.createdAt - a.createdAt)
export const EVENTS_BY_CATEGORY: Record<EventCategory, PredictionEvent[]> = { technology: [ACTIVE_EVENTS.aiTakeover], economic: [ACTIVE_EVENTS.marketCrash, OCCURRED_EVENTS.bankFailure], climate: [ACTIVE_EVENTS.heatwave], war: [ACTIVE_EVENTS.cyberAttack], natural: [OCCURRED_EVENTS.earthquake, EXPIRED_EVENTS.pandemic], social: [EXPIRED_EVENTS.collapse], other: [] }
export const EVENT_CATEGORIES: EventCategory[] = ['technology', 'economic', 'climate', 'war', 'natural', 'social', 'other']
export const BET_AMOUNTS = { minimum: 10, small: 100, medium: 500, large: 1000, whale: 5000 } as const
