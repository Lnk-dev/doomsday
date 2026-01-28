/**
 * Solana Error Classification
 * Issue #101: Transaction retry and error handling system
 *
 * Provides error types and classification for Solana transactions.
 */

export type SolanaErrorType =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'INSUFFICIENT_SOL'
  | 'INSUFFICIENT_TOKENS'
  | 'SIGNATURE_FAILED'
  | 'BLOCKHASH_EXPIRED'
  | 'RATE_LIMITED'
  | 'PROGRAM_ERROR'
  | 'SIMULATION_FAILED'
  | 'USER_REJECTED'
  | 'UNKNOWN'

export interface SolanaError {
  type: SolanaErrorType
  message: string
  recoverable: boolean
  retryable: boolean
  originalError?: Error
}

const ERROR_PATTERNS: { pattern: RegExp; type: SolanaErrorType; message: string }[] = [
  { pattern: /user rejected/i, type: 'USER_REJECTED', message: 'Transaction was rejected by user' },
  { pattern: /insufficient.*funds|insufficient.*lamports/i, type: 'INSUFFICIENT_SOL', message: 'Insufficient SOL balance' },
  { pattern: /insufficient.*balance/i, type: 'INSUFFICIENT_TOKENS', message: 'Insufficient token balance' },
  { pattern: /blockhash.*expired|blockhash.*not found/i, type: 'BLOCKHASH_EXPIRED', message: 'Transaction expired. Please try again' },
  { pattern: /signature.*verification.*failed/i, type: 'SIGNATURE_FAILED', message: 'Signature verification failed' },
  { pattern: /rate.*limit|too.*many.*requests/i, type: 'RATE_LIMITED', message: 'Rate limited. Please wait and try again' },
  { pattern: /timeout|timed.*out/i, type: 'TIMEOUT', message: 'Request timed out. Please try again' },
  { pattern: /network|connection|econnrefused|fetch.*failed/i, type: 'NETWORK', message: 'Network error. Check your connection' },
  { pattern: /simulation.*failed/i, type: 'SIMULATION_FAILED', message: 'Transaction simulation failed' },
  { pattern: /program.*error|instruction.*error/i, type: 'PROGRAM_ERROR', message: 'Program execution error' },
]

/**
 * Classify an error into a SolanaError
 */
export function classifyError(error: unknown): SolanaError {
  const errorMessage = error instanceof Error ? error.message : String(error)

  for (const { pattern, type, message } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        type,
        message,
        recoverable: isRecoverable(type),
        retryable: isRetryable(type),
        originalError: error instanceof Error ? error : undefined,
      }
    }
  }

  return {
    type: 'UNKNOWN',
    message: 'An unexpected error occurred',
    recoverable: false,
    retryable: false,
    originalError: error instanceof Error ? error : undefined,
  }
}

function isRecoverable(type: SolanaErrorType): boolean {
  return ['NETWORK', 'TIMEOUT', 'BLOCKHASH_EXPIRED', 'RATE_LIMITED'].includes(type)
}

function isRetryable(type: SolanaErrorType): boolean {
  return ['NETWORK', 'TIMEOUT', 'BLOCKHASH_EXPIRED', 'RATE_LIMITED'].includes(type)
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: SolanaError): string {
  return error.message
}

/**
 * Get recovery suggestion based on error type
 */
export function getRecoverySuggestion(error: SolanaError): string | null {
  switch (error.type) {
    case 'INSUFFICIENT_SOL':
      return 'Add more SOL to your wallet to cover transaction fees'
    case 'INSUFFICIENT_TOKENS':
      return 'You don\'t have enough tokens for this transaction'
    case 'NETWORK':
      return 'Check your internet connection and try again'
    case 'TIMEOUT':
      return 'The network is slow. Please try again'
    case 'BLOCKHASH_EXPIRED':
      return 'The transaction took too long. Please try again'
    case 'RATE_LIMITED':
      return 'Too many requests. Wait a moment and try again'
    case 'USER_REJECTED':
      return 'You can try again when ready'
    default:
      return null
  }
}
