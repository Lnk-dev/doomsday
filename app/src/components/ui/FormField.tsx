/**
 * FormField Component
 *
 * A reusable form field wrapper component that provides:
 * - Label with optional required indicator
 * - Error message display with red styling
 * - Helper text for additional guidance
 * - Consistent styling across the app
 */

import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export interface FormFieldProps {
  /** Unique identifier for the field */
  id?: string
  /** Label text for the field */
  label?: string
  /** Error message to display */
  error?: string
  /** Helper text shown below the input */
  helperText?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether to show touched state styling */
  touched?: boolean
  /** Additional CSS class names */
  className?: string
  /** The form input element(s) */
  children: ReactNode
}

/**
 * FormField wraps form inputs with labels, error messages, and helper text.
 * Use this component to ensure consistent form styling throughout the app.
 */
export function FormField({
  id,
  label,
  error,
  helperText,
  required = false,
  touched = false,
  className = '',
  children,
}: FormFieldProps) {
  const showError = error && touched

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-[13px] text-[#777] flex items-center gap-1"
        >
          {label}
          {required && (
            <span className="text-[#ff3040]" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input children */}
      {children}

      {/* Error message */}
      {showError && (
        <div
          className="flex items-center gap-1.5 text-[12px] text-[#ff3040]"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={12} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text (only shown when no error) */}
      {helperText && !showError && (
        <p className="text-[12px] text-[#555]">{helperText}</p>
      )}
    </div>
  )
}
