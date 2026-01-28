/**
 * AppLayout Component
 *
 * Main layout wrapper for the application. Provides:
 * - Flex container for full-height pages
 * - Bottom padding to account for fixed navigation
 * - Outlet for nested route content
 * - Fixed bottom navigation bar
 */

import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-16 overflow-y-auto">
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  )
}
