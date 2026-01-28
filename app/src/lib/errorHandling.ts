/**
 * Error Handling Utilities
 *
 * Centralized error handling utilities for classifying errors,
 * generating user-friendly messages, and reporting errors.
 */

export type ErrorType = 'network' | 'timeout' | 'auth' | 'forbidden' | 'notFound' | 'validation' | 'rateLimit' | 'serverError' | 'unknown'
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code?: string | number
  originalError?: Error
  retryable: boolean
  context?: Record<string, unknown>
}

const HTTP_STATUS_MAP: Record<number, ErrorType> = {
  400: 'validation', 401: 'auth', 403: 'forbidden', 404: 'notFound',
  408: 'timeout', 429: 'rateLimit', 500: 'serverError', 502: 'serverError', 503: 'serverError', 504: 'timeout',
}

const USER_MESSAGES: Record<ErrorType, string> = {
  network: 'Unable to connect to the server. Please check your internet connection.',
  timeout: 'The request took too long. Please try again.',
  auth: 'Please sign in to continue.',
  forbidden: 'You do not have permission to access this resource.',
  notFound: 'The requested resource could not be found.',
  validation: 'Please check your input and try again.',
  rateLimit: 'Too many requests. Please wait a moment before trying again.',
  serverError: 'Something went wrong on our end. Please try again later.',
  unknown: 'An unexpected error occurred. Please try again.',
}

export function classifyError(error: unknown): AppError {
  if (error == null) return createAppError('unknown', 'An unknown error occurred')
  if (isAppError(error)) return error

  if (error instanceof Error) {
    if (isNetworkError(error)) return createAppError('network', error.message, { originalError: error })
    if (isTimeoutError(error)) return createAppError('timeout', error.message, { originalError: error })
    if (error.name === 'AbortError') return createAppError('unknown', 'Request was cancelled', { originalError: error, retryable: false })
    return createAppError('unknown', error.message, { originalError: error })
  }

  if (typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status
    const type = HTTP_STATUS_MAP[status] || 'unknown'
    const message = (error as { message?: string }).message || `HTTP ${status} error`
    return createAppError(type, message, { code: status, retryable: isRetryableStatus(status) })
  }

  if (typeof error === 'string') return createAppError('unknown', error)
  return createAppError('unknown', 'An unexpected error occurred')
}

function isNetworkError(error: Error): boolean {
  const msgs = ['network', 'fetch', 'failed to fetch', 'networkerror', 'load failed', 'net::', 'cors', 'connection', 'offline']
  const m = error.message.toLowerCase()
  const n = error.name.toLowerCase()
  return n === 'typeerror' || n === 'networkerror' || msgs.some((x) => m.includes(x))
}

function isTimeoutError(error: Error): boolean {
  const msgs = ['timeout', 'timed out', 'time out', 'econnaborted']
  return error.name === 'TimeoutError' || msgs.some((x) => error.message.toLowerCase().includes(x))
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429
}

export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && 'type' in error && 'severity' in error && 'retryable' in error
}

function createAppError(type: ErrorType, message: string, options: Partial<Omit<AppError, 'type' | 'message'>> = {}): AppError {
  return { type, message, severity: getSeverityForType(type), retryable: options.retryable ?? isRetryableType(type), ...options }
}

function getSeverityForType(type: ErrorType): ErrorSeverity {
  switch (type) {
    case 'validation': return 'low'
    case 'auth': case 'forbidden': case 'notFound': case 'rateLimit': return 'medium'
    default: return 'high'
  }
}

function isRetryableType(type: ErrorType): boolean {
  return ['network', 'timeout', 'serverError', 'rateLimit'].includes(type)
}

export function getUserFriendlyMessage(error: AppError): string {
  if (error.message && !isInternalMessage(error.message)) return error.message
  return USER_MESSAGES[error.type] || USER_MESSAGES.unknown
}

function isInternalMessage(message: string): boolean {
  const patterns = [/^[A-Z_]+$/, /^\[object/, /^undefined/, /^null$/, /stack trace/i, /at \w+\s+\(/i, /error code:/i]
  return patterns.some((p) => p.test(message))
}

export function reportError(error: AppError | Error, context?: Record<string, unknown>): void {
  const appError = isAppError(error) ? error : classifyError(error)
  if (import.meta.env.DEV) {
    console.group('Error Report')
    console.error('Type:', appError.type)
    console.error('Severity:', appError.severity)
    console.error('Message:', appError.message)
    if (appError.code) console.error('Code:', appError.code)
    if (context) console.error('Context:', context)
    if (appError.originalError) console.error('Original:', appError.originalError)
    console.groupEnd()
  }
}

export function getErrorMessage(error: unknown): string {
  if (error == null) return 'An unknown error occurred'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (isAppError(error)) return getUserFriendlyMessage(error)
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
  return 'An unexpected error occurred'
}
