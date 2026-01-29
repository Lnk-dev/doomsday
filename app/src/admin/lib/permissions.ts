/**
 * Role-Based Access Control for Admin Dashboard
 */

import type { AdminRole, Permission } from '../types/admin'

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ['*'],
  moderator: [
    'users.view',
    'users.ban',
    'users.warn',
    'moderation.view',
    'moderation.claim',
    'moderation.review',
    'events.view',
    'events.resolve',
  ],
  analyst: ['analytics.view'],
  support: ['users.view', 'users.warn'],
}

// Navigation items for sidebar
export interface NavItem {
  to: string
  label: string
  icon: string // Icon name from lucide-react
  roles: AdminRole[]
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    roles: ['super_admin', 'moderator', 'analyst', 'support'],
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: 'Users',
    roles: ['super_admin', 'moderator', 'support'],
  },
  {
    to: '/admin/moderation',
    label: 'Moderation',
    icon: 'Shield',
    roles: ['super_admin', 'moderator'],
  },
  {
    to: '/admin/analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    roles: ['super_admin', 'analyst'],
  },
  {
    to: '/admin/events',
    label: 'Events',
    icon: 'Calendar',
    roles: ['super_admin', 'moderator'],
  },
]

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]

  // Super admin has all permissions
  if (permissions.includes('*')) return true

  // Check exact match
  if (permissions.includes(permission)) return true

  // Check wildcard (e.g., 'moderation.*' matches 'moderation.review')
  const [category] = permission.split('.')
  const wildcardPerm = `${category}.*` as Permission
  if (permissions.includes(wildcardPerm)) return true

  return false
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: AdminRole, route: string): boolean {
  const navItem = ADMIN_NAV_ITEMS.find((item) => item.to === route)
  if (!navItem) return false
  return navItem.roles.includes(role)
}

/**
 * Get navigation items available for a role
 */
export function getNavItemsForRole(role: AdminRole): NavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role))
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    moderator: 'Moderator',
    analyst: 'Analyst',
    support: 'Support',
  }
  return names[role]
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: AdminRole): string {
  const colors: Record<AdminRole, string> = {
    super_admin: '#ff3040',
    moderator: '#1d9bf0',
    analyst: '#00ba7c',
    support: '#f59e0b',
  }
  return colors[role]
}
