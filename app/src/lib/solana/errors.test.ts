/**
 * Solana Error Classification Tests
 * Issue #101: Tests for error classification and recovery suggestions
 */

import { describe, it, expect } from 'vitest'
import {
  classifyError,
  getErrorMessage,
  getRecoverySuggestion,
  type SolanaError,
} from './errors'

describe('classifyError', () => {
  describe('USER_REJECTED errors', () => {
    it('should classify user rejection', () => {
      const error = new Error('User rejected the request')
      const result = classifyError(error)

      expect(result.type).toBe('USER_REJECTED')
      expect(result.recoverable).toBe(false)
      expect(result.retryable).toBe(false)
      expect(result.originalError).toBe(error)
    })

    it('should classify case-insensitive user rejection', () => {
      const result = classifyError(new Error('USER REJECTED'))
      expect(result.type).toBe('USER_REJECTED')
    })
  })

  describe('INSUFFICIENT_SOL errors', () => {
    it('should classify insufficient funds', () => {
      const result = classifyError(new Error('Insufficient funds for transaction'))
      expect(result.type).toBe('INSUFFICIENT_SOL')
      expect(result.message).toBe('Insufficient SOL balance')
    })

    it('should classify insufficient lamports', () => {
      const result = classifyError(new Error('Insufficient lamports for rent'))
      expect(result.type).toBe('INSUFFICIENT_SOL')
    })
  })

  describe('INSUFFICIENT_TOKENS errors', () => {
    it('should classify insufficient token balance', () => {
      const result = classifyError(new Error('Insufficient balance for transfer'))
      expect(result.type).toBe('INSUFFICIENT_TOKENS')
      expect(result.message).toBe('Insufficient token balance')
    })
  })

  describe('BLOCKHASH_EXPIRED errors', () => {
    it('should classify blockhash expired', () => {
      const result = classifyError(new Error('Blockhash expired'))
      expect(result.type).toBe('BLOCKHASH_EXPIRED')
      expect(result.recoverable).toBe(true)
      expect(result.retryable).toBe(true)
    })

    it('should classify blockhash not found', () => {
      const result = classifyError(new Error('Blockhash not found'))
      expect(result.type).toBe('BLOCKHASH_EXPIRED')
    })
  })

  describe('SIGNATURE_FAILED errors', () => {
    it('should classify signature verification failed', () => {
      const result = classifyError(new Error('Signature verification failed'))
      expect(result.type).toBe('SIGNATURE_FAILED')
      expect(result.recoverable).toBe(false)
    })
  })

  describe('RATE_LIMITED errors', () => {
    it('should classify rate limit errors', () => {
      const result = classifyError(new Error('Rate limit exceeded'))
      expect(result.type).toBe('RATE_LIMITED')
      expect(result.recoverable).toBe(true)
      expect(result.retryable).toBe(true)
    })

    it('should classify too many requests', () => {
      const result = classifyError(new Error('Too many requests'))
      expect(result.type).toBe('RATE_LIMITED')
    })
  })

  describe('TIMEOUT errors', () => {
    it('should classify timeout', () => {
      const result = classifyError(new Error('Request timeout'))
      expect(result.type).toBe('TIMEOUT')
      expect(result.retryable).toBe(true)
    })

    it('should classify timed out', () => {
      const result = classifyError(new Error('Connection timed out'))
      expect(result.type).toBe('TIMEOUT')
    })
  })

  describe('NETWORK errors', () => {
    it('should classify network error', () => {
      const result = classifyError(new Error('Network error'))
      expect(result.type).toBe('NETWORK')
      expect(result.recoverable).toBe(true)
    })

    it('should classify connection refused', () => {
      const result = classifyError(new Error('ECONNREFUSED'))
      expect(result.type).toBe('NETWORK')
    })

    it('should classify fetch failed', () => {
      const result = classifyError(new Error('Fetch failed'))
      expect(result.type).toBe('NETWORK')
    })
  })

  describe('SIMULATION_FAILED errors', () => {
    it('should classify simulation failed', () => {
      const result = classifyError(new Error('Simulation failed'))
      expect(result.type).toBe('SIMULATION_FAILED')
      expect(result.message).toBe('Transaction simulation failed')
    })
  })

  describe('PROGRAM_ERROR errors', () => {
    it('should classify program error', () => {
      const result = classifyError(new Error('Program error'))
      expect(result.type).toBe('PROGRAM_ERROR')
    })

    it('should classify instruction error', () => {
      const result = classifyError(new Error('Instruction error: Custom(1)'))
      expect(result.type).toBe('PROGRAM_ERROR')
    })
  })

  describe('UNKNOWN errors', () => {
    it('should classify unrecognized errors as UNKNOWN', () => {
      const result = classifyError(new Error('Something weird happened'))
      expect(result.type).toBe('UNKNOWN')
      expect(result.message).toBe('An unexpected error occurred')
      expect(result.recoverable).toBe(false)
      expect(result.retryable).toBe(false)
    })

    it('should handle non-Error objects', () => {
      const result = classifyError('string error')
      expect(result.type).toBe('UNKNOWN')
      expect(result.originalError).toBeUndefined()
    })

    it('should handle null/undefined', () => {
      const result = classifyError(null)
      expect(result.type).toBe('UNKNOWN')
    })
  })
})

describe('getErrorMessage', () => {
  it('should return the error message', () => {
    const error: SolanaError = {
      type: 'INSUFFICIENT_SOL',
      message: 'Insufficient SOL balance',
      recoverable: false,
      retryable: false,
    }

    expect(getErrorMessage(error)).toBe('Insufficient SOL balance')
  })
})

describe('getRecoverySuggestion', () => {
  it('should return suggestion for INSUFFICIENT_SOL', () => {
    const error: SolanaError = {
      type: 'INSUFFICIENT_SOL',
      message: 'Insufficient SOL balance',
      recoverable: false,
      retryable: false,
    }

    expect(getRecoverySuggestion(error)).toBe('Add more SOL to your wallet to cover transaction fees')
  })

  it('should return suggestion for INSUFFICIENT_TOKENS', () => {
    const error: SolanaError = {
      type: 'INSUFFICIENT_TOKENS',
      message: 'Insufficient token balance',
      recoverable: false,
      retryable: false,
    }

    expect(getRecoverySuggestion(error)).toContain("don't have enough tokens")
  })

  it('should return suggestion for NETWORK', () => {
    const error: SolanaError = {
      type: 'NETWORK',
      message: 'Network error',
      recoverable: true,
      retryable: true,
    }

    expect(getRecoverySuggestion(error)).toContain('internet connection')
  })

  it('should return suggestion for TIMEOUT', () => {
    const error: SolanaError = {
      type: 'TIMEOUT',
      message: 'Request timed out',
      recoverable: true,
      retryable: true,
    }

    expect(getRecoverySuggestion(error)).toContain('slow')
  })

  it('should return suggestion for BLOCKHASH_EXPIRED', () => {
    const error: SolanaError = {
      type: 'BLOCKHASH_EXPIRED',
      message: 'Blockhash expired',
      recoverable: true,
      retryable: true,
    }

    expect(getRecoverySuggestion(error)).toContain('try again')
  })

  it('should return suggestion for RATE_LIMITED', () => {
    const error: SolanaError = {
      type: 'RATE_LIMITED',
      message: 'Rate limited',
      recoverable: true,
      retryable: true,
    }

    expect(getRecoverySuggestion(error)).toContain('Wait')
  })

  it('should return suggestion for USER_REJECTED', () => {
    const error: SolanaError = {
      type: 'USER_REJECTED',
      message: 'User rejected',
      recoverable: false,
      retryable: false,
    }

    expect(getRecoverySuggestion(error)).toContain('try again when ready')
  })

  it('should return null for UNKNOWN errors', () => {
    const error: SolanaError = {
      type: 'UNKNOWN',
      message: 'Unknown error',
      recoverable: false,
      retryable: false,
    }

    expect(getRecoverySuggestion(error)).toBeNull()
  })

  it('should return null for SIGNATURE_FAILED', () => {
    const error: SolanaError = {
      type: 'SIGNATURE_FAILED',
      message: 'Signature failed',
      recoverable: false,
      retryable: false,
    }

    expect(getRecoverySuggestion(error)).toBeNull()
  })
})

describe('Error properties', () => {
  it('recoverable errors should be retryable', () => {
    const recoverableTypes = ['NETWORK', 'TIMEOUT', 'BLOCKHASH_EXPIRED', 'RATE_LIMITED']

    for (const errorMessage of ['Network error', 'timeout', 'blockhash expired', 'rate limit']) {
      const result = classifyError(new Error(errorMessage))
      if (recoverableTypes.includes(result.type)) {
        expect(result.recoverable).toBe(true)
        expect(result.retryable).toBe(true)
      }
    }
  })

  it('non-recoverable errors should not be retryable', () => {
    const nonRecoverable = ['User rejected', 'Insufficient funds', 'Signature verification failed']

    for (const errorMessage of nonRecoverable) {
      const result = classifyError(new Error(errorMessage))
      expect(result.retryable).toBe(false)
    }
  })
})
