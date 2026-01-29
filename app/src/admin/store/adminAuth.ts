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
  tempToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  requires2FA: boolean
  error: string | null

  // Actions
  login: (username: string, password: string) => Promise<'success' | 'requires_2fa' | 'error'>
  verify2FA: (code: string) => Promise<boolean>
  cancel2FA: () => void
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
  clearError: () => void
  updateAdmin: (admin: AdminUser) => void

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
      tempToken: null,
      isAuthenticated: false,
      isLoading: false,
      requires2FA: false,
      error: null,

      // Login action
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await adminApi.login({ username, password })

          // Check if 2FA is required
          if (response.requires2FA && response.tempToken) {
            set({
              tempToken: response.tempToken,
              requires2FA: true,
              isLoading: false,
              error: null,
            })
            return 'requires_2fa'
          }

          // No 2FA - login complete
          adminApi.setToken(response.token)

          set({
            admin: response.admin,
            token: response.token,
            tempToken: null,
            isAuthenticated: true,
            requires2FA: false,
            isLoading: false,
            error: null,
          })

          return 'success'
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({
            admin: null,
            token: null,
            tempToken: null,
            isAuthenticated: false,
            requires2FA: false,
            isLoading: false,
            error: message === 'UNAUTHORIZED' ? 'Invalid credentials' : message,
          })
          return 'error'
        }
      },

      // Verify 2FA code
      verify2FA: async (code: string) => {
        const { tempToken } = get()

        if (!tempToken) {
          set({ error: 'No pending 2FA verification' })
          return false
        }

        set({ isLoading: true, error: null })

        try {
          const response = await adminApi.verify2FA({ code }, tempToken)

          adminApi.setToken(response.token)

          set({
            admin: response.admin,
            token: response.token,
            tempToken: null,
            isAuthenticated: true,
            requires2FA: false,
            isLoading: false,
            error: null,
          })

          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Invalid 2FA code'
          set({
            isLoading: false,
            error: message,
          })
          return false
        }
      },

      // Cancel 2FA flow
      cancel2FA: () => {
        set({
          tempToken: null,
          requires2FA: false,
          error: null,
        })
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
          tempToken: null,
          isAuthenticated: false,
          requires2FA: false,
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

      // Update admin (e.g., after 2FA setup)
      updateAdmin: (admin: AdminUser) => {
        set({ admin })
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
