/**
 * Validation utilities for form inputs
 *
 * Provides common validation functions for form fields including:
 * - Required field validation
 * - Min/max length validation
 * - Email format validation
 * - URL format validation
 * - Number range validation
 */

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
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
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
export function validateForm<T extends Record<string, unknown>>(
  fields: {
    [K in keyof T]: {
      value: T[K]
      rules: ValidationRule<T[K]>[]
    }
  }
): { isValid: boolean; errors: { [K in keyof T]?: string } } {
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
