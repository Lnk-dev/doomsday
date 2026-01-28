/**
 * SkipLink Component
 * Issue #49: Accessibility improvements (WCAG 2.1)
 *
 * Provides a skip-to-content link for keyboard users to bypass navigation.
 * Only visible when focused.
 */

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId?: string
  /** Link text */
  children?: React.ReactNode
}

export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-semibold focus:text-[14px] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
    >
      {children}
    </a>
  )
}
