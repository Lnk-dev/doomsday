/**
 * Admin Routes
 *
 * Routing configuration for admin dashboard
 * Loaded lazily from App.tsx to keep bundle separate
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './components/layout'
import {
  AdminLoginPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminModerationPage,
  AdminAnalyticsPage,
  AdminEventsPage,
} from './pages'

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Login page (outside protected layout) */}
      <Route path="login" element={<AdminLoginPage />} />

      {/* Protected routes (inside AdminLayout with auth check) */}
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="events" element={<AdminEventsPage />} />
      </Route>

      {/* Catch all - redirect to admin dashboard */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
