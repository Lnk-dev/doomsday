/**
 * Event Resolution Admin Route
 * Issues #34, #35, #36: Oracle event resolution
 *
 * Admin endpoint for resolving prediction events on-chain.
 * Only authorized oracle can call this endpoint.
 */

import { Hono } from 'hono'
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  getConnection,
  loadOracleKeypair,
  isOracleConfigured,
  getPredictionMarketProgramId,
} from '../../lib/solana/config'

const resolution = new Hono()

// Outcome enum matching the on-chain program
enum Outcome {
  Doom = 0,
  Life = 1,
}

// PDA Seeds
const PLATFORM_CONFIG_SEED = 'platform_config'
const EVENT_SEED = 'event'

/**
 * Derive PDA addresses
 */
function findPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PLATFORM_CONFIG_SEED)],
    getPredictionMarketProgramId()
  )
}

function findEventPDA(eventId: number): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8)
  idBuffer.writeBigUInt64LE(BigInt(eventId))
  return PublicKey.findProgramAddressSync(
    [Buffer.from(EVENT_SEED), idBuffer],
    getPredictionMarketProgramId()
  )
}

/**
 * Build resolve event instruction
 */
function buildResolveEventInstruction(
  oracle: PublicKey,
  eventId: number,
  outcome: Outcome
): TransactionInstruction {
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(eventId)

  // resolve_event discriminator + outcome (1 byte)
  const discriminator = Buffer.from([137, 175, 115, 57, 84, 161, 202, 36])
  const outcomeBuffer = Buffer.from([outcome])
  const data = Buffer.concat([discriminator, outcomeBuffer])

  return new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: event, isSigner: false, isWritable: true },
      { pubkey: oracle, isSigner: true, isWritable: false },
    ],
    programId: getPredictionMarketProgramId(),
    data,
  })
}

/**
 * Check system health
 */
resolution.get('/health', async (c) => {
  const oracleConfigured = isOracleConfigured()
  let connectionOk = false

  try {
    const connection = getConnection()
    const version = await connection.getVersion()
    connectionOk = !!version
  } catch {
    connectionOk = false
  }

  return c.json({
    status: oracleConfigured && connectionOk ? 'healthy' : 'degraded',
    oracleConfigured,
    connectionOk,
  })
})

/**
 * Get pending events that can be resolved
 */
resolution.get('/pending', async (c) => {
  // This would typically query a database or the blockchain
  // For now, return a placeholder
  return c.json({
    events: [],
    message: 'Query blockchain or database for events past deadline but not yet resolved',
  })
})

/**
 * Get event resolution status
 */
resolution.get('/event/:eventId', async (c) => {
  const eventId = parseInt(c.req.param('eventId'), 10)

  if (isNaN(eventId)) {
    return c.json({ error: 'Invalid event ID' }, 400)
  }

  try {
    const connection = getConnection()
    const [eventPDA] = findEventPDA(eventId)

    const accountInfo = await connection.getAccountInfo(eventPDA)

    if (!accountInfo) {
      return c.json({ error: 'Event not found' }, 404)
    }

    // Parse basic event info (skip discriminator)
    const data = accountInfo.data.slice(8)

    // Read status byte (at offset after eventId, creator, title, desc, deadlines)
    // This is a simplified parse - full parsing would need proper offset calculation
    const statusOffset = 8 + 32 + 4 + 128 + 4 + 512 + 8 + 8 // Approximate
    const status = data[statusOffset]

    const statusNames = ['Active', 'Resolved', 'Cancelled']

    return c.json({
      eventId,
      pda: eventPDA.toBase58(),
      status: statusNames[status] || 'Unknown',
      statusCode: status,
    })
  } catch (error) {
    console.error('Failed to fetch event:', error)
    return c.json({ error: 'Failed to fetch event status' }, 500)
  }
})

/**
 * Resolve an event
 * POST /admin/resolution/resolve
 * Body: { eventId: number, outcome: 'doom' | 'life' }
 */
resolution.post('/resolve', async (c) => {
  // Verify authentication (should be done via middleware in production)
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // In production, validate the token against admin session
  // For now, just check if it exists

  const body = await c.req.json<{ eventId: number; outcome: 'doom' | 'life' }>()

  const { eventId, outcome } = body

  if (typeof eventId !== 'number') {
    return c.json({ error: 'eventId must be a number' }, 400)
  }

  if (outcome !== 'doom' && outcome !== 'life') {
    return c.json({ error: 'outcome must be "doom" or "life"' }, 400)
  }

  try {
    // Load oracle keypair
    const oracle = loadOracleKeypair()
    const connection = getConnection()

    // Build transaction
    const instruction = buildResolveEventInstruction(
      oracle.publicKey,
      eventId,
      outcome === 'doom' ? Outcome.Doom : Outcome.Life
    )

    const transaction = new Transaction().add(instruction)

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [oracle],
      { commitment: 'confirmed' }
    )

    console.log(`Event ${eventId} resolved with outcome ${outcome}. Signature: ${signature}`)

    return c.json({
      success: true,
      eventId,
      outcome,
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (error) {
    console.error('Failed to resolve event:', error)
    return c.json({
      error: 'Failed to resolve event',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

/**
 * Cancel an event (admin only)
 * POST /admin/resolution/cancel
 * Body: { eventId: number }
 */
resolution.post('/cancel', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<{ eventId: number }>()
  const { eventId } = body

  if (typeof eventId !== 'number') {
    return c.json({ error: 'eventId must be a number' }, 400)
  }

  try {
    const oracle = loadOracleKeypair()
    const connection = getConnection()

    const [platformConfig] = findPlatformConfigPDA()
    const [event] = findEventPDA(eventId)

    // cancel_event discriminator
    const discriminator = Buffer.from([72, 21, 241, 65, 172, 55, 132, 3])

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: platformConfig, isSigner: false, isWritable: false },
        { pubkey: event, isSigner: false, isWritable: true },
        { pubkey: oracle.publicKey, isSigner: true, isWritable: false },
      ],
      programId: getPredictionMarketProgramId(),
      data: discriminator,
    })

    const transaction = new Transaction().add(instruction)

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [oracle],
      { commitment: 'confirmed' }
    )

    console.log(`Event ${eventId} cancelled. Signature: ${signature}`)

    return c.json({
      success: true,
      eventId,
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (error) {
    console.error('Failed to cancel event:', error)
    return c.json({
      error: 'Failed to cancel event',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

/**
 * Batch resolve multiple events
 * POST /admin/resolution/batch-resolve
 * Body: { events: Array<{ eventId: number, outcome: 'doom' | 'life' }> }
 */
resolution.post('/batch-resolve', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<{
    events: Array<{ eventId: number; outcome: 'doom' | 'life' }>
  }>()

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return c.json({ error: 'events must be a non-empty array' }, 400)
  }

  if (body.events.length > 10) {
    return c.json({ error: 'Maximum 10 events per batch' }, 400)
  }

  const results: Array<{
    eventId: number
    outcome: string
    success: boolean
    signature?: string
    error?: string
  }> = []

  try {
    const oracle = loadOracleKeypair()
    const connection = getConnection()

    for (const event of body.events) {
      try {
        const instruction = buildResolveEventInstruction(
          oracle.publicKey,
          event.eventId,
          event.outcome === 'doom' ? Outcome.Doom : Outcome.Life
        )

        const transaction = new Transaction().add(instruction)

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [oracle],
          { commitment: 'confirmed' }
        )

        results.push({
          eventId: event.eventId,
          outcome: event.outcome,
          success: true,
          signature,
        })
      } catch (error) {
        results.push({
          eventId: event.eventId,
          outcome: event.outcome,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.length - successCount

    return c.json({
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failCount,
      },
    })
  } catch (error) {
    console.error('Batch resolve failed:', error)
    return c.json({
      error: 'Batch resolve failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

export default resolution
