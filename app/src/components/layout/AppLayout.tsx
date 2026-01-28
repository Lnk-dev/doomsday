/**
 * AppLayout Component
 *
 * Main layout wrapper for the application. Provides:
 * - Flex container for full-height pages
 * - Bottom padding to account for fixed navigation
 * - Outlet for nested route content
 * - Fixed bottom navigation bar
 * - Global toast notifications
 */

import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '@/components/ui/ToastContainer'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Skip to main content link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Main content area with bottom padding for nav */}
      <main id="main-content" className="flex-1 pb-16 overflow-y-auto" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  )
}
