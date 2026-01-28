/**
 * Form styling utilities
 *
 * Shared styling constants and functions for form inputs.
 * Keep these separate from components for Fast Refresh compatibility.
 */

/**
 * Input styling utilities for use with FormField
 */
export const inputStyles = {
  /** Base input styles */
  base: 'w-full bg-transparent text-white placeholder-[#555] outline-none transition-colors',
  /** Text input styles */
  text: 'text-[15px]',
  /** Textarea styles */
  textarea: 'text-[15px] resize-none',
  /** Large text input styles */
  large: 'text-[17px]',
  /** Error state border */
  error: 'border-[#ff3040]',
  /** Default border */
  default: 'border-[#333]',
  /** Focused state */
  focus: 'focus:border-[#555]',
}

/**
 * Get combined input classes based on state
 */
export function getInputClasses(
  hasError: boolean,
  touched: boolean,
  additionalClasses = ''
): string {
  const borderClass = hasError && touched ? inputStyles.error : inputStyles.default
  return `${inputStyles.base} ${inputStyles.text} ${borderClass} ${inputStyles.focus} ${additionalClasses}`.trim()
}
