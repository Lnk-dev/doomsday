import { z } from 'zod'
import {
  sanitizeUserContent,
  sanitizeUsername,
  sanitizeDisplayName,
} from './sanitize'

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform(sanitizeUsername),
  walletAddress: z.string().optional(),
})

export const walletAuthSchema = z.object({
  walletAddress: z
    .string()
    .min(32, 'Invalid wallet address')
    .max(44, 'Invalid wallet address'),
})

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform(sanitizeUsername)
    .optional(),
  displayName: z
    .string()
    .max(50)
    .transform(sanitizeDisplayName)
    .optional(),
  bio: z
    .string()
    .max(160)
    .transform((val) => sanitizeUserContent(val, 160))
    .optional(),
})

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(500)
    .transform((val) => sanitizeUserContent(val, 500)),
  variant: z.enum(['doom', 'life']),
})

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(280)
    .transform((val) => sanitizeUserContent(val, 280)),
})

export const createEventSchema = z.object({
  title: z
    .string()
    .min(5)
    .max(100)
    .transform((val) => sanitizeUserContent(val, 100)),
  description: z
    .string()
    .max(500)
    .transform((val) => sanitizeUserContent(val, 500))
    .optional(),
  endsAt: z.string().datetime(),
})

export const placeBetSchema = z.object({
  outcome: z.enum(['doom', 'life']),
  amount: z.number().int().min(1).max(10000),
})

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

// ============================================
// Enhanced Event Creation Schemas
// ============================================

/** Resolution criterion defines a single condition for event resolution */
export const resolutionCriterionSchema = z.object({
  conditionType: z.enum(['threshold', 'occurrence', 'geographic']),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .transform((val) => sanitizeUserContent(val, 500)),
  metric: z
    .string()
    .max(100)
    .transform((val) => sanitizeUserContent(val, 100))
    .optional(),
  operator: z.enum(['gte', 'lte', 'eq', 'between']).optional(),
  thresholdValue: z.number().optional(),
  unit: z
    .string()
    .max(50)
    .transform((val) => sanitizeUserContent(val, 50))
    .optional(),
  geographicScope: z
    .string()
    .max(100)
    .transform((val) => sanitizeUserContent(val, 100))
    .optional(),
})

/** Verification source for checking event resolution */
export const verificationSourceSchema = z.object({
  isPrimary: z.boolean(),
  name: z
    .string()
    .min(1, 'Source name is required')
    .max(200, 'Source name cannot exceed 200 characters')
    .transform((val) => sanitizeUserContent(val, 200)),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  sourceType: z.enum(['government', 'academic', 'news', 'api', 'official']).optional(),
})

/** Enhanced event creation with full resolution criteria and sources */
export const enhancedCreateEventSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .transform((val) => sanitizeUserContent(val, 100)),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .transform((val) => sanitizeUserContent(val, 500)),
  category: z.enum(['technology', 'economic', 'climate', 'war', 'natural', 'social', 'other']),

  // Resolution criteria (1-5 conditions)
  resolutionCriteria: z
    .array(resolutionCriterionSchema)
    .min(1, 'At least one resolution criterion is required')
    .max(5, 'Cannot have more than 5 criteria'),

  // Verification sources (at least 1 primary required)
  verificationSources: z
    .array(verificationSourceSchema)
    .min(1, 'At least one verification source is required')
    .max(5, 'Cannot have more than 5 sources')
    .refine(
      (sources) => sources.some((s) => s.isPrimary),
      'At least one primary source is required'
    ),

  // Deadlines
  bettingDeadline: z.string().datetime(),
  eventDeadline: z.string().datetime(),
  resolutionDeadline: z.string().datetime(),

  // Creator stake (optional)
  creatorStake: z
    .object({
      amount: z.number().int().min(1).max(100000),
      outcome: z.enum(['doom', 'life']),
    })
    .optional(),
})
  .refine(
    (data) => new Date(data.bettingDeadline) < new Date(data.eventDeadline),
    { message: 'Betting deadline must be before event deadline', path: ['bettingDeadline'] }
  )
  .refine(
    (data) => new Date(data.eventDeadline) < new Date(data.resolutionDeadline),
    { message: 'Event deadline must be before resolution deadline', path: ['eventDeadline'] }
  )
  .refine(
    (data) => new Date(data.bettingDeadline) > new Date(),
    { message: 'Betting deadline must be in the future', path: ['bettingDeadline'] }
  )

/** Dispute creation schema */
export const createDisputeSchema = z.object({
  reason: z
    .string()
    .min(20, 'Reason must be at least 20 characters')
    .max(1000, 'Reason cannot exceed 1000 characters')
    .transform((val) => sanitizeUserContent(val, 1000)),
  evidence: z.array(z.string().url('Invalid evidence URL')).max(5).optional(),
  stakeAmount: z.number().int().min(50, 'Minimum 50 $DOOM required to dispute'),
})

/** Add evidence to dispute schema */
export const addDisputeEvidenceSchema = z.object({
  evidenceType: z.enum(['url', 'screenshot', 'api_response']),
  content: z.string().min(1).max(5000),
})
