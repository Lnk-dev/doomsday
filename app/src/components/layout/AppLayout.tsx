/**
 * AppLayout Component
 *
 * Main layout wrapper for the application. Provides:
 * - Skip-to-content link for keyboard navigation (WCAG 2.1)
 * - Flex container for full-height pages
 * - Bottom padding to account for fixed navigation
 * - Outlet for nested route content
 * - Fixed bottom navigation bar
 * - Global toast notifications
 */

import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SkipLink } from './SkipLink'
import { ToastContainer } from '@/components/ui/ToastContainer'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Skip link for keyboard users - WCAG 2.1 */}
      <SkipLink />

      {/* Global toast notifications */}
      <ToastContainer />

      {/* Main content area with bottom padding for nav */}
      <main id="main-content" className="flex-1 pb-16 overflow-y-auto" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  )
}
