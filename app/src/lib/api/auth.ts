/**
 * Auth API Client
 *
 * Handles wallet-based authentication with the backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface AuthUser {
  id: string
  walletAddress: string | null
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  verified: boolean
  daysLiving: number
  lifePosts: number
  createdAt: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface ProfileUpdateData {
  username?: string
  displayName?: string
  bio?: string
}

/**
 * Authenticate with wallet address
 * Creates a new user if one doesn't exist
 */
export async function authenticateWallet(walletAddress: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ walletAddress }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }))
    throw new Error(error.error || 'Authentication failed')
  }

  return response.json()
}

/**
 * Fetch current user profile using JWT token
 */
export async function fetchUserProfile(token: string): Promise<{ user: AuthUser }> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token expired or invalid')
    }
    const error = await response.json().catch(() => ({ error: 'Failed to fetch profile' }))
    throw new Error(error.error || 'Failed to fetch profile')
  }

  return response.json()
}

/**
 * Update user profile
 */
export async function updateProfile(
  token: string,
  data: ProfileUpdateData
): Promise<{ user: AuthUser }> {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token expired or invalid')
    }
    if (response.status === 400) {
      const error = await response.json().catch(() => ({ error: 'Invalid request' }))
      throw new Error(error.error || 'Invalid request')
    }
    const error = await response.json().catch(() => ({ error: 'Failed to update profile' }))
    throw new Error(error.error || 'Failed to update profile')
  }

  // Backend returns full user object, map to AuthUser format
  const result = await response.json()
  return {
    user: {
      id: result.user.id,
      walletAddress: result.user.walletAddress,
      username: result.user.username,
      displayName: result.user.displayName,
      bio: result.user.bio,
      avatarUrl: result.user.avatarUrl,
      verified: result.user.verified,
      daysLiving: result.user.daysLiving,
      lifePosts: result.user.lifePosts,
      createdAt: result.user.createdAt,
    },
  }
}
