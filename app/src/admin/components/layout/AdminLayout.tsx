/**
 * Admin Layout Component
 *
 * Main layout wrapper for admin dashboard with sidebar and auth protection
 */

import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuth'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { canAccessRoute } from '../../lib/permissions'

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)
  const isLoading = useAdminAuthStore((state) => state.isLoading)
  const admin = useAdminAuthStore((state) => state.admin)
  const checkSession = useAdminAuthStore((state) => state.checkSession)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Check session on mount
  useEffect(() => {
    const verify = async () => {
      await checkSession()
      setSessionChecked(true)
    }
    verify()
  }, [checkSession])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      navigate('/admin/login', { replace: true })
    }
  }, [sessionChecked, isAuthenticated, navigate])

  // Check route access when route changes
  useEffect(() => {
    if (admin && !canAccessRoute(admin.role, location.pathname)) {
      // Redirect to dashboard if no access
      navigate('/admin', { replace: true })
    }
  }, [admin, location.pathname, navigate])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Show loading while checking session
  if (!sessionChecked || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#ff3040] animate-spin" />
          <p className="text-[#777] text-[14px]">Verifying session...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
