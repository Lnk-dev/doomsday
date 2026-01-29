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
