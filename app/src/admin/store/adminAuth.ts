/**
 * Admin Authentication Store
 *
 * Manages admin session state with persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser, AdminRole, Permission } from '../types/admin'
import { adminApi } from '../lib/adminApi'
import { hasPermission as checkPermission } from '../lib/permissions'

interface AdminAuthState {
  // State
  admin: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
  clearError: () => void

  // Computed helpers
  hasPermission: (permission: Permission) => boolean
  getRole: () => AdminRole | null
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      admin: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await adminApi.login({ username, password })

          // Store token in API client
          adminApi.setToken(response.token)

          set({
            admin: response.admin,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({
            admin: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: message === 'UNAUTHORIZED' ? 'Invalid credentials' : message,
          })
          return false
        }
      },

      // Logout action
      logout: async () => {
        const { token } = get()

        // Try to logout on server (don't wait for it)
        if (token) {
          adminApi.logout().catch(() => {
            // Ignore errors on logout
          })
        }

        // Clear token from API client
        adminApi.setToken(null)

        set({
          admin: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      // Validate existing session
      checkSession: async () => {
        const { token } = get()

        if (!token) {
          set({ isAuthenticated: false })
          return false
        }

        // Ensure API client has the token
        adminApi.setToken(token)

        set({ isLoading: true })

        try {
          const admin = await adminApi.validateSession()

          set({
            admin,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return true
        } catch {
          // Session invalid, clear everything
          adminApi.setToken(null)

          set({
            admin: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })

          return false
        }
      },

      // Clear error message
      clearError: () => {
        set({ error: null })
      },

      // Check if current admin has a permission
      hasPermission: (permission: Permission) => {
        const { admin } = get()
        if (!admin) return false
        return checkPermission(admin.role, permission)
      },

      // Get current role
      getRole: () => {
        const { admin } = get()
        return admin?.role ?? null
      },
    }),
    {
      name: 'doomsday-admin-auth',
      partialize: (state) => ({
        // Only persist these fields
        token: state.token,
        admin: state.admin,
      }),
    }
  )
)
