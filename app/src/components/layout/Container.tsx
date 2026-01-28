/**
 * Container Component
 *
 * Responsive container for consistent max-width and centering.
 * Provides:
 * - Configurable max-width options
 * - Responsive horizontal padding
 * - Centered content
 */

import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  /** Max width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Apply horizontal padding */
  padded?: boolean
}

const maxWidthClasses: Record<NonNullable<ContainerProps['maxWidth']>, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
}

export function Container({
  children,
  className = '',
  maxWidth = 'xl',
  padded = true,
}: ContainerProps) {
  return (
    <div
      className={`w-full mx-auto ${maxWidthClasses[maxWidth]} ${padded ? 'px-4 md:px-6 lg:px-8' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
