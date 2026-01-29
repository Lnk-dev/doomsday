import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  canAccessRoute,
  getNavItemsForRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  ROLE_PERMISSIONS,
  ADMIN_NAV_ITEMS,
} from './permissions'
import type { AdminRole, Permission } from '../types/admin'

describe('permissions', () => {
  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all roles', () => {
      const roles: AdminRole[] = ['super_admin', 'moderator', 'analyst', 'support']
      roles.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined()
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
      })
    })

    it('super_admin should have wildcard permission', () => {
      expect(ROLE_PERMISSIONS.super_admin).toContain('*')
    })

    it('moderator should have moderation permissions', () => {
      expect(ROLE_PERMISSIONS.moderator).toContain('moderation.view')
      expect(ROLE_PERMISSIONS.moderator).toContain('moderation.claim')
      expect(ROLE_PERMISSIONS.moderator).toContain('moderation.review')
    })

    it('analyst should only have analytics permission', () => {
      expect(ROLE_PERMISSIONS.analyst).toEqual(['analytics.view'])
    })

    it('support should have limited user permissions', () => {
      expect(ROLE_PERMISSIONS.support).toContain('users.view')
      expect(ROLE_PERMISSIONS.support).toContain('users.warn')
      expect(ROLE_PERMISSIONS.support).not.toContain('users.ban')
    })
  })

  describe('hasPermission', () => {
    describe('super_admin', () => {
      it('should have all permissions', () => {
        const permissions: Permission[] = [
          'users.view',
          'users.ban',
          'users.unban',
          'users.warn',
          'moderation.view',
          'moderation.claim',
          'moderation.review',
          'analytics.view',
          'events.view',
          'events.resolve',
          'events.void',
        ]

        permissions.forEach((permission) => {
          expect(hasPermission('super_admin', permission)).toBe(true)
        })
      })
    })

    describe('moderator', () => {
      it('should have user management permissions', () => {
        expect(hasPermission('moderator', 'users.view')).toBe(true)
        expect(hasPermission('moderator', 'users.ban')).toBe(true)
        expect(hasPermission('moderator', 'users.warn')).toBe(true)
      })

      it('should have moderation permissions', () => {
        expect(hasPermission('moderator', 'moderation.view')).toBe(true)
        expect(hasPermission('moderator', 'moderation.claim')).toBe(true)
        expect(hasPermission('moderator', 'moderation.review')).toBe(true)
      })

      it('should have event permissions', () => {
        expect(hasPermission('moderator', 'events.view')).toBe(true)
        expect(hasPermission('moderator', 'events.resolve')).toBe(true)
      })

      it('should NOT have analytics permission', () => {
        expect(hasPermission('moderator', 'analytics.view')).toBe(false)
      })

      it('should NOT have unban or void permissions', () => {
        expect(hasPermission('moderator', 'users.unban')).toBe(false)
        expect(hasPermission('moderator', 'events.void')).toBe(false)
      })
    })

    describe('analyst', () => {
      it('should have analytics permission', () => {
        expect(hasPermission('analyst', 'analytics.view')).toBe(true)
      })

      it('should NOT have user permissions', () => {
        expect(hasPermission('analyst', 'users.view')).toBe(false)
        expect(hasPermission('analyst', 'users.ban')).toBe(false)
      })

      it('should NOT have moderation permissions', () => {
        expect(hasPermission('analyst', 'moderation.view')).toBe(false)
        expect(hasPermission('analyst', 'moderation.review')).toBe(false)
      })
    })

    describe('support', () => {
      it('should have limited user permissions', () => {
        expect(hasPermission('support', 'users.view')).toBe(true)
        expect(hasPermission('support', 'users.warn')).toBe(true)
      })

      it('should NOT have ban permission', () => {
        expect(hasPermission('support', 'users.ban')).toBe(false)
      })

      it('should NOT have moderation permissions', () => {
        expect(hasPermission('support', 'moderation.view')).toBe(false)
        expect(hasPermission('support', 'moderation.review')).toBe(false)
      })
    })
  })

  describe('canAccessRoute', () => {
    describe('dashboard route', () => {
      it('should be accessible by all roles', () => {
        const roles: AdminRole[] = ['super_admin', 'moderator', 'analyst', 'support']
        roles.forEach((role) => {
          expect(canAccessRoute(role, '/admin')).toBe(true)
        })
      })
    })

    describe('users route', () => {
      it('should be accessible by super_admin, moderator, support', () => {
        expect(canAccessRoute('super_admin', '/admin/users')).toBe(true)
        expect(canAccessRoute('moderator', '/admin/users')).toBe(true)
        expect(canAccessRoute('support', '/admin/users')).toBe(true)
      })

      it('should NOT be accessible by analyst', () => {
        expect(canAccessRoute('analyst', '/admin/users')).toBe(false)
      })
    })

    describe('moderation route', () => {
      it('should be accessible by super_admin and moderator', () => {
        expect(canAccessRoute('super_admin', '/admin/moderation')).toBe(true)
        expect(canAccessRoute('moderator', '/admin/moderation')).toBe(true)
      })

      it('should NOT be accessible by analyst or support', () => {
        expect(canAccessRoute('analyst', '/admin/moderation')).toBe(false)
        expect(canAccessRoute('support', '/admin/moderation')).toBe(false)
      })
    })

    describe('analytics route', () => {
      it('should be accessible by super_admin and analyst', () => {
        expect(canAccessRoute('super_admin', '/admin/analytics')).toBe(true)
        expect(canAccessRoute('analyst', '/admin/analytics')).toBe(true)
      })

      it('should NOT be accessible by moderator or support', () => {
        expect(canAccessRoute('moderator', '/admin/analytics')).toBe(false)
        expect(canAccessRoute('support', '/admin/analytics')).toBe(false)
      })
    })

    describe('events route', () => {
      it('should be accessible by super_admin and moderator', () => {
        expect(canAccessRoute('super_admin', '/admin/events')).toBe(true)
        expect(canAccessRoute('moderator', '/admin/events')).toBe(true)
      })

      it('should NOT be accessible by analyst or support', () => {
        expect(canAccessRoute('analyst', '/admin/events')).toBe(false)
        expect(canAccessRoute('support', '/admin/events')).toBe(false)
      })
    })

    describe('unknown route', () => {
      it('should return false for unknown routes', () => {
        expect(canAccessRoute('super_admin', '/admin/unknown')).toBe(false)
        expect(canAccessRoute('super_admin', '/some/other/route')).toBe(false)
      })
    })
  })

  describe('getNavItemsForRole', () => {
    it('super_admin should see all nav items', () => {
      const items = getNavItemsForRole('super_admin')
      expect(items).toHaveLength(ADMIN_NAV_ITEMS.length)
    })

    it('moderator should see dashboard, users, moderation, events', () => {
      const items = getNavItemsForRole('moderator')
      const paths = items.map((i) => i.to)
      expect(paths).toContain('/admin')
      expect(paths).toContain('/admin/users')
      expect(paths).toContain('/admin/moderation')
      expect(paths).toContain('/admin/events')
      expect(paths).not.toContain('/admin/analytics')
    })

    it('analyst should see dashboard and analytics', () => {
      const items = getNavItemsForRole('analyst')
      const paths = items.map((i) => i.to)
      expect(paths).toContain('/admin')
      expect(paths).toContain('/admin/analytics')
      expect(paths).not.toContain('/admin/users')
      expect(paths).not.toContain('/admin/moderation')
    })

    it('support should see dashboard and users', () => {
      const items = getNavItemsForRole('support')
      const paths = items.map((i) => i.to)
      expect(paths).toContain('/admin')
      expect(paths).toContain('/admin/users')
      expect(paths).not.toContain('/admin/moderation')
      expect(paths).not.toContain('/admin/analytics')
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRoleDisplayName('super_admin')).toBe('Super Admin')
      expect(getRoleDisplayName('moderator')).toBe('Moderator')
      expect(getRoleDisplayName('analyst')).toBe('Analyst')
      expect(getRoleDisplayName('support')).toBe('Support')
    })
  })

  describe('getRoleBadgeColor', () => {
    it('should return valid hex colors', () => {
      const roles: AdminRole[] = ['super_admin', 'moderator', 'analyst', 'support']
      roles.forEach((role) => {
        const color = getRoleBadgeColor(role)
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should return distinct colors for each role', () => {
      const colors = new Set([
        getRoleBadgeColor('super_admin'),
        getRoleBadgeColor('moderator'),
        getRoleBadgeColor('analyst'),
        getRoleBadgeColor('support'),
      ])
      expect(colors.size).toBe(4)
    })
  })

  describe('ADMIN_NAV_ITEMS', () => {
    it('should have required properties for each item', () => {
      ADMIN_NAV_ITEMS.forEach((item) => {
        expect(item.to).toBeDefined()
        expect(item.label).toBeDefined()
        expect(item.icon).toBeDefined()
        expect(item.roles).toBeDefined()
        expect(Array.isArray(item.roles)).toBe(true)
        expect(item.roles.length).toBeGreaterThan(0)
      })
    })

    it('should have dashboard as first item', () => {
      expect(ADMIN_NAV_ITEMS[0].to).toBe('/admin')
      expect(ADMIN_NAV_ITEMS[0].label).toBe('Dashboard')
    })
  })
})
