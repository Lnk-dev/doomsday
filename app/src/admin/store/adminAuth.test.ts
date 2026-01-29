import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAdminAuthStore } from './adminAuth'
import { adminApi } from '../lib/adminApi'
import type { AdminUser } from '../types/admin'

// Mock the adminApi
vi.mock('../lib/adminApi', () => ({
  adminApi: {
    login: vi.fn(),
    logout: vi.fn(),
    validateSession: vi.fn(),
    setToken: vi.fn(),
  },
}))

const mockAdmin: AdminUser = {
  id: 'admin-1',
  username: 'testadmin',
  email: 'admin@test.com',
  role: 'moderator',
  createdAt: Date.now(),
  lastLoginAt: Date.now(),
}

describe('adminAuth store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAdminAuthStore.setState({
      admin: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAdminAuthStore.getState()
      expect(state.admin).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('login', () => {
    it('should set loading state during login', async () => {
      vi.mocked(adminApi.login).mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          token: 'test-token',
          admin: mockAdmin,
          expiresAt: Date.now() + 3600000,
        }), 10))
      )

      const loginPromise = useAdminAuthStore.getState().login('testadmin', 'password')

      // Check loading state immediately
      expect(useAdminAuthStore.getState().isLoading).toBe(true)

      await loginPromise
    })

    it('should update state on successful login', async () => {
      vi.mocked(adminApi.login).mockResolvedValue({
        token: 'test-token',
        admin: mockAdmin,
        expiresAt: Date.now() + 3600000,
      })

      const result = await useAdminAuthStore.getState().login('testadmin', 'password')

      expect(result).toBe('success')

      const state = useAdminAuthStore.getState()
      expect(state.admin).toEqual(mockAdmin)
      expect(state.token).toBe('test-token')
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should call adminApi.setToken on successful login', async () => {
      vi.mocked(adminApi.login).mockResolvedValue({
        token: 'test-token',
        admin: mockAdmin,
        expiresAt: Date.now() + 3600000,
      })

      await useAdminAuthStore.getState().login('testadmin', 'password')

      expect(adminApi.setToken).toHaveBeenCalledWith('test-token')
    })

    it('should handle login failure', async () => {
      vi.mocked(adminApi.login).mockRejectedValue(new Error('Invalid credentials'))

      const result = await useAdminAuthStore.getState().login('testadmin', 'wrongpassword')

      expect(result).toBe('error')

      const state = useAdminAuthStore.getState()
      expect(state.admin).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe('Invalid credentials')
    })

    it('should convert UNAUTHORIZED error to friendly message', async () => {
      vi.mocked(adminApi.login).mockRejectedValue(new Error('UNAUTHORIZED'))

      await useAdminAuthStore.getState().login('testadmin', 'wrongpassword')

      expect(useAdminAuthStore.getState().error).toBe('Invalid credentials')
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      useAdminAuthStore.setState({
        admin: mockAdmin,
        token: 'test-token',
        isAuthenticated: true,
      })
    })

    it('should clear auth state on logout', async () => {
      vi.mocked(adminApi.logout).mockResolvedValue(undefined)

      await useAdminAuthStore.getState().logout()

      const state = useAdminAuthStore.getState()
      expect(state.admin).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should call adminApi.setToken(null) on logout', async () => {
      vi.mocked(adminApi.logout).mockResolvedValue(undefined)

      await useAdminAuthStore.getState().logout()

      expect(adminApi.setToken).toHaveBeenCalledWith(null)
    })

    it('should clear state even if API logout fails', async () => {
      vi.mocked(adminApi.logout).mockRejectedValue(new Error('Network error'))

      await useAdminAuthStore.getState().logout()

      const state = useAdminAuthStore.getState()
      expect(state.admin).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('checkSession', () => {
    it('should return false if no token', async () => {
      useAdminAuthStore.setState({ token: null })

      const result = await useAdminAuthStore.getState().checkSession()

      expect(result).toBe(false)
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should validate token and update state on success', async () => {
      useAdminAuthStore.setState({ token: 'existing-token' })
      vi.mocked(adminApi.validateSession).mockResolvedValue(mockAdmin)

      const result = await useAdminAuthStore.getState().checkSession()

      expect(result).toBe(true)
      expect(adminApi.setToken).toHaveBeenCalledWith('existing-token')

      const state = useAdminAuthStore.getState()
      expect(state.admin).toEqual(mockAdmin)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should clear state if session is invalid', async () => {
      useAdminAuthStore.setState({
        token: 'expired-token',
        admin: mockAdmin,
        isAuthenticated: true,
      })
      vi.mocked(adminApi.validateSession).mockRejectedValue(new Error('Session expired'))

      const result = await useAdminAuthStore.getState().checkSession()

      expect(result).toBe(false)
      expect(adminApi.setToken).toHaveBeenCalledWith(null)

      const state = useAdminAuthStore.getState()
      expect(state.admin).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useAdminAuthStore.setState({ error: 'Some error' })

      useAdminAuthStore.getState().clearError()

      expect(useAdminAuthStore.getState().error).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('should return false if no admin', () => {
      useAdminAuthStore.setState({ admin: null })

      expect(useAdminAuthStore.getState().hasPermission('users.view')).toBe(false)
    })

    it('should check permission based on role', () => {
      useAdminAuthStore.setState({ admin: mockAdmin }) // moderator role

      expect(useAdminAuthStore.getState().hasPermission('users.view')).toBe(true)
      expect(useAdminAuthStore.getState().hasPermission('users.ban')).toBe(true)
      expect(useAdminAuthStore.getState().hasPermission('analytics.view')).toBe(false)
    })

    it('should return true for all permissions with super_admin', () => {
      useAdminAuthStore.setState({
        admin: { ...mockAdmin, role: 'super_admin' },
      })

      expect(useAdminAuthStore.getState().hasPermission('users.view')).toBe(true)
      expect(useAdminAuthStore.getState().hasPermission('analytics.view')).toBe(true)
      expect(useAdminAuthStore.getState().hasPermission('events.void')).toBe(true)
    })
  })

  describe('getRole', () => {
    it('should return null if no admin', () => {
      useAdminAuthStore.setState({ admin: null })

      expect(useAdminAuthStore.getState().getRole()).toBeNull()
    })

    it('should return admin role', () => {
      useAdminAuthStore.setState({ admin: mockAdmin })

      expect(useAdminAuthStore.getState().getRole()).toBe('moderator')
    })
  })
})
