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
import { DesktopSidebar } from './DesktopSidebar'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useWallet } from '@/hooks/useWallet'

/** Syncs wallet adapter state to user store */
function WalletSync() {
  // This hook syncs connected state to user store
  useWallet()
  return null
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-black">
      {/* Sync wallet state */}
      <WalletSync />

      {/* Skip to main content link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Desktop sidebar - visible on lg+ */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main id="main-content" className="flex-1 pb-16 lg:pb-0 overflow-y-auto" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Fixed bottom navigation - mobile only */}
      <BottomNav />

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  )
}
