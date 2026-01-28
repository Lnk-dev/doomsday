/**
 * PageHeader Component
 *
 * Sticky header component for page titles and actions.
 * Features:
 * - Blur backdrop for visual depth
 * - Optional logo display (for home page)
 * - Left/right action slots for buttons
 * - Centered title
 *
 * @example
 * // With logo (home page)
 * <PageHeader showLogo />
 *
 * // With title and actions
 * <PageHeader
 *   title="Profile"
 *   rightAction={<SettingsButton />}
 * />
 */

interface PageHeaderProps {
  /** Page title (hidden if showLogo is true) */
  title?: string
  /** Show app logo instead of title */
  showLogo?: boolean
  /** Left action slot (e.g., back button) */
  leftAction?: React.ReactNode
  /** Right action slot (e.g., settings button) */
  rightAction?: React.ReactNode
}

export function PageHeader({ title, showLogo = false, leftAction, rightAction }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left action slot */}
        <div className="w-10">
          {leftAction}
        </div>

        {/* Center: Logo or title */}
        <div className="flex-1 flex justify-center">
          {showLogo ? (
            // Threads-style @ logo
            <svg
              viewBox="0 0 192 192"
              className="w-8 h-8 text-white"
              fill="currentColor"
              aria-label="Doomsday logo"
              role="img"
            >
              <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c23.003.173 40.48 7.54 51.936 21.896 5.498 6.893 9.628 15.373 12.34 25.316l14.964-4.003c-3.18-11.736-8.312-22.103-15.321-30.912C146.828 11.482 125.327 2.21 97.06 2h-.112c-28.222.21-49.58 9.502-63.527 27.636C21.468 45.036 15.17 66.88 14.94 96l-.002.086.002.086c.229 29.12 6.528 50.964 18.52 66.364 13.947 18.134 35.305 27.426 63.527 27.636h.112c24.596-.173 42.144-7.024 56.735-22.155 18.374-19.074 17.613-42.747 11.532-56.926-4.37-10.192-12.51-18.428-23.829-24.103zM97.467 141.5c-13.396.732-21.705-6.791-22.24-16.835-.535-10.044 7.382-18.57 23.416-19.493 1.72-.099 3.404-.14 5.054-.14 6.247 0 12.08.603 17.373 1.738-1.976 26.214-14.054 34.015-23.603 34.73z"/>
            </svg>
          ) : (
            <h1 className="text-[17px] font-semibold text-white">{title}</h1>
          )}
        </div>

        {/* Right action slot */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
