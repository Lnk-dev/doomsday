/**
 * Validation utilities for form inputs
 *
 * Provides common validation functions for form fields including:
 * - Required field validation
 * - Min/max length validation
 * - Email format validation
 * - URL format validation
 * - Number range validation
 * - Security validators (XSS, SQL injection prevention)
 */

/**
 * Input length limits for various content types
 * Used for consistent validation across the application
 */
export const INPUT_LIMITS = {
  POST_CONTENT_MIN: 1,
  POST_CONTENT_MAX: 5000,
  COMMENT_MIN: 1,
  COMMENT_MAX: 2000,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  BIO_MAX: 500,
  EVENT_TITLE_MIN: 3,
  EVENT_TITLE_MAX: 200,
  EVENT_DESCRIPTION_MAX: 5000,
  BETTING_AMOUNT_MIN: 1,
  BETTING_AMOUNT_MAX: 1000000,
} as const

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface ValidationRule<T = string> {
  validate: (value: T) => ValidationResult
}

/**
 * Required field validation
 * @param message - Custom error message
 */
export function required(message = 'This field is required'): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      const trimmed = typeof value === 'string' ? value.trim() : value
      if (!trimmed || trimmed.length === 0) {
        return { isValid: false, error: message }
      }
      return { isValid: true }
    },
  }
}

/**
 * Minimum length validation
 * @param min - Minimum length
 * @param message - Custom error message
 */
export function minLength(min: number, message?: string): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      const trimmed = typeof value === 'string' ? value.trim() : ''
      if (trimmed.length < min) {
        return {
          isValid: false,
          error: message || `Must be at least ${min} characters`,
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Maximum length validation
 * @param max - Maximum length
 * @param message - Custom error message
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (value.length > max) {
        return {
          isValid: false,
          error: message || `Must be no more than ${max} characters`,
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Email format validation
 * @param message - Custom error message
 */
export function email(message = 'Please enter a valid email address'): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true } // Empty is handled by required()
      }
      // RFC 5322 compliant email regex (simplified)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        return { isValid: false, error: message }
      }
      return { isValid: true }
    },
  }
}

/**
 * URL format validation
 * @param message - Custom error message
 */
export function url(message = 'Please enter a valid URL'): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true } // Empty is handled by required()
      }
      try {
        new URL(value.trim())
        return { isValid: true }
      } catch {
        return { isValid: false, error: message }
      }
    },
  }
}

/**
 * Number range validation
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param message - Custom error message
 */
export function numberRange(
  min: number,
  max: number,
  message?: string
): ValidationRule<number | string> {
  return {
    validate: (value: number | string): ValidationResult => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num)) {
        return { isValid: false, error: 'Please enter a valid number' }
      }
      if (num < min || num > max) {
        return {
          isValid: false,
          error: message || `Must be between ${min} and ${max}`,
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Minimum number validation
 * @param min - Minimum value (inclusive)
 * @param message - Custom error message
 */
export function minValue(min: number, message?: string): ValidationRule<number | string> {
  return {
    validate: (value: number | string): ValidationResult => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num)) {
        return { isValid: false, error: 'Please enter a valid number' }
      }
      if (num < min) {
        return {
          isValid: false,
          error: message || `Must be at least ${min}`,
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Maximum number validation
 * @param max - Maximum value (inclusive)
 * @param message - Custom error message
 */
export function maxValue(max: number, message?: string): ValidationRule<number | string> {
  return {
    validate: (value: number | string): ValidationResult => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num)) {
        return { isValid: false, error: 'Please enter a valid number' }
      }
      if (num > max) {
        return {
          isValid: false,
          error: message || `Must be no more than ${max}`,
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Pattern matching validation
 * @param pattern - Regular expression to match
 * @param message - Error message when pattern doesn't match
 */
export function pattern(regex: RegExp, message: string): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true } // Empty is handled by required()
      }
      if (!regex.test(value)) {
        return { isValid: false, error: message }
      }
      return { isValid: true }
    },
  }
}

/**
 * Validate a value against multiple rules
 * @param value - Value to validate
 * @param rules - Array of validation rules
 * @returns First validation error or success
 */
export function validateField<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  for (const rule of rules) {
    const result = rule.validate(value)
    if (!result.isValid) {
      return result
    }
  }
  return { isValid: true }
}

/**
 * Validate all fields in a form
 * @param fields - Object mapping field names to { value, rules }
 * @returns Object mapping field names to validation results
 */
export function validateForm<T extends Record<string, unknown>>(fields: {
  [K in keyof T]: {
    value: T[K]
    rules: ValidationRule<T[K]>[]
  }
}): { isValid: boolean; errors: { [K in keyof T]?: string } } {
  const errors: { [K in keyof T]?: string } = {}
  let isValid = true

  for (const key in fields) {
    const field = fields[key]
    const result = validateField(field.value, field.rules)
    if (!result.isValid) {
      isValid = false
      errors[key] = result.error
    }
  }

  return { isValid, errors }
}

// ============================================================================
// Security Validators
// ============================================================================

/**
 * Validates that a URL only uses safe protocols (http/https)
 * Prevents javascript:, data:, and other dangerous URL schemes
 * @param message - Custom error message
 */
export function safeUrl(message = 'URL must use http or https protocol'): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true } // Empty is handled by required()
      }
      try {
        const url = new URL(value.trim())
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return { isValid: false, error: message }
        }
        return { isValid: true }
      } catch {
        return { isValid: false, error: 'Please enter a valid URL' }
      }
    },
  }
}

/**
 * Validates username format - alphanumeric and underscores only
 * @param minLen - Minimum length (default: INPUT_LIMITS.USERNAME_MIN)
 * @param maxLen - Maximum length (default: INPUT_LIMITS.USERNAME_MAX)
 * @param message - Custom error message
 */
export function username(
  minLen = INPUT_LIMITS.USERNAME_MIN,
  maxLen = INPUT_LIMITS.USERNAME_MAX,
  message?: string
): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true } // Empty is handled by required()
      }
      const trimmed = value.trim()
      if (trimmed.length < minLen) {
        return {
          isValid: false,
          error: message || `Username must be at least ${minLen} characters`,
        }
      }
      if (trimmed.length > maxLen) {
        return {
          isValid: false,
          error: message || `Username must be no more than ${maxLen} characters`,
        }
      }
      const usernameRegex = /^[a-zA-Z0-9_]+$/
      if (!usernameRegex.test(trimmed)) {
        return {
          isValid: false,
          error: message || 'Username can only contain letters, numbers, and underscores',
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Validates betting amounts within allowed limits
 * @param minAmount - Minimum amount (default: INPUT_LIMITS.BETTING_AMOUNT_MIN)
 * @param maxAmount - Maximum amount (default: INPUT_LIMITS.BETTING_AMOUNT_MAX)
 * @param message - Custom error message
 */
export function bettingAmount(
  minAmount = INPUT_LIMITS.BETTING_AMOUNT_MIN,
  maxAmount = INPUT_LIMITS.BETTING_AMOUNT_MAX,
  message?: string
): ValidationRule<number | string> {
  return {
    validate: (value: number | string): ValidationResult => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num)) {
        return { isValid: false, error: 'Please enter a valid amount' }
      }
      if (num < minAmount) {
        return {
          isValid: false,
          error: message || `Minimum bet amount is ${minAmount}`,
        }
      }
      if (num > maxAmount) {
        return {
          isValid: false,
          error: message || `Maximum bet amount is ${maxAmount}`,
        }
      }
      // Check for reasonable decimal places (max 2)
      if (num !== Math.round(num * 100) / 100) {
        return {
          isValid: false,
          error: 'Amount can have at most 2 decimal places',
        }
      }
      return { isValid: true }
    },
  }
}

/**
 * Validates that input contains no HTML tags
 * Prevents XSS via HTML injection
 * @param message - Custom error message
 */
export function noHtmlTags(message = 'HTML tags are not allowed'): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value) {
        return { isValid: true }
      }
      // Match any HTML-like tags
      const htmlTagRegex = /<[^>]*>/
      if (htmlTagRegex.test(value)) {
        return { isValid: false, error: message }
      }
      return { isValid: true }
    },
  }
}

/**
 * Detects potential script injection attempts
 * Checks for javascript:, event handlers (onclick, onerror, etc.), and script tags
 * @param message - Custom error message
 */
export function noScriptInjection(
  message = 'Content contains potentially dangerous scripts'
): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value) {
        return { isValid: true }
      }
      const lowerValue = value.toLowerCase()

      // Check for javascript: protocol
      if (/javascript\s*:/i.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      // Check for vbscript: protocol
      if (/vbscript\s*:/i.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      // Check for data: URLs with scripts
      if (/data\s*:[^,]*;base64/i.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      // Check for event handlers (onclick, onerror, onload, etc.)
      const eventHandlerRegex = /\bon\w+\s*=/i
      if (eventHandlerRegex.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      // Check for script tags
      if (/<\s*script/i.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      // Check for iframe tags
      if (/<\s*iframe/i.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      // Check for object/embed tags
      if (/<\s*(object|embed)/i.test(lowerValue)) {
        return { isValid: false, error: message }
      }

      return { isValid: true }
    },
  }
}

/**
 * Defense-in-depth validation against SQL injection patterns
 * Note: This is a secondary defense - always use parameterized queries
 * @param message - Custom error message
 */
export function noSqlInjection(
  message = 'Content contains potentially dangerous characters'
): ValidationRule {
  return {
    validate: (value: string): ValidationResult => {
      if (!value) {
        return { isValid: true }
      }

      // Common SQL injection patterns
      const sqlPatterns = [
        /'\s*or\s+'?1'?\s*=\s*'?1/i, // ' OR '1'='1
        /'\s*or\s+''='/i, // ' OR ''='
        /;\s*drop\s+table/i, // ; DROP TABLE
        /;\s*delete\s+from/i, // ; DELETE FROM
        /;\s*insert\s+into/i, // ; INSERT INTO
        /;\s*update\s+\w+\s+set/i, // ; UPDATE x SET
        /union\s+select/i, // UNION SELECT
        /union\s+all\s+select/i, // UNION ALL SELECT
        /'\s*;\s*--/i, // '; --
        /--\s*$/m, // SQL comment at end of line
        /\/\*[\s\S]*?\*\//i, // Block comments
        /xp_cmdshell/i, // SQL Server command execution
        /exec\s*\(/i, // EXEC function
        /execute\s*\(/i, // EXECUTE function
      ]

      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return { isValid: false, error: message }
        }
      }

      return { isValid: true }
    },
  }
}
