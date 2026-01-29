/**
 * Event Resolution Job Handler
 *
 * Processes prediction event resolution and payout calculations.
 */

import type { Job } from 'bullmq'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { events, bets, users } from '../../../db/schema'
import { logger } from '../../logger'
import { audit } from '../../auditLogger'
import { addBulkJobs, QueueNames } from '../queue'

export interface EventResolutionJobData {
  eventId: string
  outcome: 'doom' | 'life'
  resolvedBy: string // Admin ID
  reason?: string
}

export interface BatchPayoutJobData {
  eventId: string
  batchNumber: number
  betIds: string[]
  outcome: 'doom' | 'life'
}

/**
 * Event resolution job handler
 */
export async function eventResolutionHandler(job: Job<EventResolutionJobData>): Promise<void> {
  const { eventId, outcome, resolvedBy, reason } = job.data

  logger.info({ eventId, outcome }, 'Processing event resolution')

  // Get the event
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  })

  if (!event) {
    throw new Error(`Event ${eventId} not found`)
  }

  if (event.status !== 'active') {
    throw new Error(`Event ${eventId} is not active (status: ${event.status})`)
  }

  // Update event status
  const newStatus = outcome === 'doom' ? 'resolved_doom' : 'resolved_life'
  await db
    .update(events)
    .set({
      status: newStatus,
      resolvedAt: new Date(),
    })
    .where(eq(events.id, eventId))

  // Get all bets for this event
  const eventBets = await db
    .select()
    .from(bets)
    .where(eq(bets.eventId, eventId))

  if (eventBets.length === 0) {
    logger.info({ eventId }, 'No bets to process')
    return
  }

  // Calculate total pools
  const totalDoom = eventBets
    .filter((b) => b.outcome === 'doom')
    .reduce((sum, b) => sum + b.amount, 0)
  const totalLife = eventBets
    .filter((b) => b.outcome === 'life')
    .reduce((sum, b) => sum + b.amount, 0)
  const totalPool = totalDoom + totalLife

  // Calculate payouts for winners
  const winningBets = eventBets.filter((b) => b.outcome === outcome)
  const losingPool = outcome === 'doom' ? totalLife : totalDoom
  const winningPool = outcome === 'doom' ? totalDoom : totalLife

  // Update payouts
  for (const bet of winningBets) {
    const share = bet.amount / winningPool
    const payout = Math.floor(bet.amount + share * losingPool)

    await db
      .update(bets)
      .set({ payout })
      .where(eq(bets.id, bet.id))
  }

  // Mark losing bets
  const losingBets = eventBets.filter((b) => b.outcome !== outcome)
  for (const bet of losingBets) {
    await db
      .update(bets)
      .set({ payout: 0 })
      .where(eq(bets.id, bet.id))
  }

  // Queue batch payouts for winners (process in batches of 100)
  const batchSize = 100
  const winningBetIds = winningBets.map((b) => b.id)

  for (let i = 0; i < winningBetIds.length; i += batchSize) {
    const batch = winningBetIds.slice(i, i + batchSize)
    await addBulkJobs(QueueNames.BATCH_PAYOUTS, [
      {
        name: 'process-payouts',
        data: {
          eventId,
          batchNumber: Math.floor(i / batchSize) + 1,
          betIds: batch,
          outcome,
        } as BatchPayoutJobData,
      },
    ])
  }

  // Audit log
  await audit.event.resolved(
    resolvedBy,
    'system',
    {
      eventId,
      outcome,
      totalPayout: winningBets.reduce((sum, b) => sum + (b.payout || 0), 0),
    },
    reason
  )

  logger.info({
    eventId,
    outcome,
    totalBets: eventBets.length,
    winners: winningBets.length,
    totalPool,
  }, 'Event resolved')
}

/**
 * Batch payout job handler
 */
export async function batchPayoutHandler(job: Job<BatchPayoutJobData>): Promise<void> {
  const { eventId, batchNumber, betIds, outcome } = job.data

  logger.info({ eventId, batchNumber, count: betIds.length }, 'Processing batch payouts')

  for (const betId of betIds) {
    const bet = await db.query.bets.findFirst({
      where: eq(bets.id, betId),
    })

    if (!bet || bet.claimed || !bet.payout) {
      continue
    }

    // Credit user's balance
    if (outcome === 'doom') {
      await db
        .update(users)
        .set({ doomBalance: sql`${users.doomBalance} + ${bet.payout}` })
        .where(eq(users.id, bet.userId))
    } else {
      await db
        .update(users)
        .set({ lifeBalance: sql`${users.lifeBalance} + ${bet.payout}` })
        .where(eq(users.id, bet.userId))
    }

    // Mark bet as claimed
    await db
      .update(bets)
      .set({ claimed: true })
      .where(eq(bets.id, betId))

    // Queue notification
    await addBulkJobs(QueueNames.NOTIFICATIONS, [
      {
        name: 'bet-won',
        data: {
          type: 'both',
          userId: bet.userId,
          title: 'You won!',
          body: `Your prediction was correct! You won ${bet.payout} points.`,
          data: { eventId, betId, payout: bet.payout },
        },
      },
    ])
  }

  logger.info({ eventId, batchNumber, processed: betIds.length }, 'Batch payouts completed')
}
