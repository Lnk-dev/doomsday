/**
 * GDPR Routes
 *
 * Endpoints for data portability and right to erasure.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { verifyToken } from '../lib/jwt'
import {
  generateDataExport,
  generateHtmlExport,
  deleteUserData,
  canDeleteUser,
} from '../lib/gdpr'
import { addJob, QueueNames } from '../lib/jobs'
import { logger } from '../lib/logger'

const gdpr = new Hono()

// Schemas
const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
  reason: z.string().max(500).optional(),
})


/**
 * GET /gdpr/export
 * Request a data export
 */
gdpr.get('/export', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const format = c.req.query('format') || 'json'

  try {
    const exportData = await generateDataExport(payload.userId)

    if (format === 'html') {
      const html = generateHtmlExport(exportData)
      c.header('Content-Type', 'text/html')
      c.header('Content-Disposition', `attachment; filename="doomsday-export-${Date.now()}.html"`)
      return c.body(html)
    }

    c.header('Content-Type', 'application/json')
    c.header('Content-Disposition', `attachment; filename="doomsday-export-${Date.now()}.json"`)
    return c.json(exportData)
  } catch (error) {
    logger.error({ error, userId: payload.userId }, 'Failed to generate data export')
    return c.json({ error: 'Failed to generate export' }, 500)
  }
})

/**
 * POST /gdpr/export/request
 * Queue an async export request (for large datasets)
 */
gdpr.post('/export/request', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Queue export job
  await addJob(QueueNames.EMAIL, 'gdpr-export', {
    type: 'welcome', // Using existing template type for now
    to: user.email || '',
    subject: 'Your Doomsday Data Export is Ready',
    templateData: {
      username: user.username,
      exportUrl: `${process.env.APP_URL}/settings/privacy/export`,
    },
  })

  return c.json({
    success: true,
    message: 'Export requested. You will receive an email when it is ready.',
  })
})

/**
 * GET /gdpr/deletion/check
 * Check if account can be deleted
 */
gdpr.get('/deletion/check', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const result = await canDeleteUser(payload.userId)
  return c.json(result)
})

/**
 * POST /gdpr/deletion
 * Request account deletion
 */
gdpr.post('/deletion', zValidator('json', deleteAccountSchema), async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const { reason } = c.req.valid('json')

  try {
    // Check if deletion is possible
    const check = await canDeleteUser(payload.userId)
    if (!check.canDelete) {
      return c.json({ error: check.reason }, 400)
    }

    // Perform deletion
    const result = await deleteUserData(payload.userId, payload.userId, reason)

    return c.json({
      success: true,
      message: 'Your account has been deleted.',
      details: result,
    })
  } catch (error) {
    logger.error({ error, userId: payload.userId }, 'Failed to delete account')
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to delete account',
    }, 500)
  }
})

/**
 * GET /gdpr/privacy-info
 * Get information about data collection and privacy
 */
gdpr.get('/privacy-info', (c) => {
  return c.json({
    dataController: {
      name: 'Doomsday',
      contact: 'privacy@doomsday.app',
    },
    dataCollected: [
      {
        category: 'Account Information',
        items: ['Username', 'Email address', 'Wallet address'],
        purpose: 'Account creation and authentication',
        retention: 'Until account deletion',
      },
      {
        category: 'User Content',
        items: ['Posts', 'Comments', 'Profile information'],
        purpose: 'Platform functionality',
        retention: 'Until account deletion',
      },
      {
        category: 'Betting Activity',
        items: ['Bet history', 'Predictions', 'Payouts'],
        purpose: 'Platform functionality and financial records',
        retention: '7 years for financial records',
      },
      {
        category: 'Usage Data',
        items: ['Login history', 'Device information'],
        purpose: 'Security and fraud prevention',
        retention: '1 year',
      },
    ],
    rights: [
      {
        right: 'Access',
        description: 'Request a copy of your personal data',
        endpoint: 'GET /gdpr/export',
      },
      {
        right: 'Portability',
        description: 'Export your data in machine-readable format',
        endpoint: 'GET /gdpr/export?format=json',
      },
      {
        right: 'Erasure',
        description: 'Request deletion of your personal data',
        endpoint: 'POST /gdpr/deletion',
      },
      {
        right: 'Rectification',
        description: 'Update your personal information',
        endpoint: 'Settings page',
      },
    ],
  })
})

export default gdpr
