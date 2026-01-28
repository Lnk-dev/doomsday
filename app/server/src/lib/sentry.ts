/**
 * Sentry Error Monitoring
 * Issue #44: Implement error monitoring with Sentry
 */

import * as Sentry from '@sentry/node'
import { logger } from './logger'

const SENTRY_DSN = process.env.SENTRY_DSN
const isProduction = process.env.NODE_ENV === 'production'

export function initSentry(): void {
  if (!SENTRY_DSN) {
    logger.warn('SENTRY_DSN not configured - error monitoring disabled')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    enabled: isProduction,
  })

  logger.info('Sentry error monitoring initialized')
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level)
}

export function setUser(user: { id: string; username?: string }): void {
  Sentry.setUser(user)
}

export function clearUser(): void {
  Sentry.setUser(null)
}
