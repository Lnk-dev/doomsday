/**
 * Admin API Client
 *
 * Handles all API calls to admin endpoints with authentication
 */

import type {
  LoginRequest,
  LoginResponseWith2FA,
  AdminUser,
  UserFilters,
  PaginatedUsers,
  UserDetail,
  ModerationQueue,
  ModerationStatus,
  ReviewRequest,
  OverviewMetrics,
  TimeRange,
  TimeseriesData,
  LeaderboardType,
  LeaderboardData,
  PendingEvent,
  EventResolutionDetails,
  ResolveEventRequest,
  VoidEventRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
  TwoFactorDisableRequest,
  TwoFactorRegenerateRequest,
  TwoFactorRegenerateResponse,
  Verify2FARequest,
} from '../types/admin'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class AdminApiClient {
  private token: string | null = null

  /**
   * Set the authentication token
   */
  setToken(token: string | null) {
    this.token = token
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Make an authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE}/admin${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))

      if (response.status === 401) {
        // Token expired or invalid - will be handled by store
        throw new Error('UNAUTHORIZED')
      }

      if (response.status === 403) {
        throw new Error('FORBIDDEN')
      }

      if (response.status === 409) {
        throw new Error(error.error || 'Conflict')
      }

      throw new Error(error.error || `Request failed: ${response.status}`)
    }

    // Handle empty responses
    const text = await response.text()
    if (!text) return {} as T

    return JSON.parse(text)
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async login(credentials: LoginRequest): Promise<LoginResponseWith2FA> {
    return this.request<LoginResponseWith2FA>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async verify2FA(request: Verify2FARequest, tempToken: string): Promise<LoginResponseWith2FA> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tempToken}`,
    }

    const response = await fetch(`${API_BASE}/admin/auth/verify-2fa`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Invalid 2FA code')
    }

    return response.json()
  }

  async logout(): Promise<void> {
    await this.request<void>('/auth/logout', { method: 'POST' })
  }

  async validateSession(): Promise<AdminUser> {
    return this.request<AdminUser>('/auth/me')
  }

  // ============================================================================
  // Two-Factor Authentication
  // ============================================================================

  async setup2FA(): Promise<TwoFactorSetupResponse> {
    return this.request<TwoFactorSetupResponse>('/auth/2fa/setup', {
      method: 'POST',
    })
  }

  async verifySetup2FA(request: TwoFactorVerifyRequest): Promise<TwoFactorVerifyResponse> {
    return this.request<TwoFactorVerifyResponse>('/auth/2fa/verify-setup', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async disable2FA(request: TwoFactorDisableRequest): Promise<void> {
    await this.request<void>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async regenerateBackupCodes(request: TwoFactorRegenerateRequest): Promise<TwoFactorRegenerateResponse> {
    return this.request<TwoFactorRegenerateResponse>('/auth/2fa/regenerate-backup-codes', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // ============================================================================
  // User Management
  // ============================================================================

  async getUsers(filters: UserFilters = {}, page = 1, pageSize = 20): Promise<PaginatedUsers> {
    const params = new URLSearchParams()
    if (filters.query) params.set('query', filters.query)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    return this.request<PaginatedUsers>(`/users?${params}`)
  }

  async getUserDetail(userId: string): Promise<UserDetail> {
    return this.request<UserDetail>(`/users/${userId}`)
  }

  async banUser(userId: string, reason: string, durationDays?: number): Promise<void> {
    await this.request<void>(`/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason, duration: durationDays }),
    })
  }

  async unbanUser(userId: string): Promise<void> {
    await this.request<void>(`/users/${userId}/unban`, {
      method: 'POST',
    })
  }

  async warnUser(userId: string, message: string, severity: 'low' | 'medium' | 'high' = 'low'): Promise<void> {
    await this.request<void>(`/users/${userId}/warn`, {
      method: 'POST',
      body: JSON.stringify({ message, severity }),
    })
  }

  // ============================================================================
  // Moderation
  // ============================================================================

  async getModerationQueue(status?: ModerationStatus): Promise<ModerationQueue> {
    const params = status ? `?status=${status}` : ''
    return this.request<ModerationQueue>(`/moderation/queue${params}`)
  }

  async claimModerationItem(itemId: string): Promise<void> {
    await this.request<void>(`/moderation/${itemId}/claim`, {
      method: 'POST',
    })
  }

  async unclaimModerationItem(itemId: string): Promise<void> {
    await this.request<void>(`/moderation/${itemId}/unclaim`, {
      method: 'POST',
    })
  }

  async reviewModerationItem(itemId: string, review: ReviewRequest): Promise<void> {
    await this.request<void>(`/moderation/${itemId}/review`, {
      method: 'POST',
      body: JSON.stringify(review),
    })
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getOverview(): Promise<OverviewMetrics> {
    return this.request<OverviewMetrics>('/analytics/overview')
  }

  async getTimeseries(metric: string, range: TimeRange): Promise<TimeseriesData> {
    return this.request<TimeseriesData>(`/analytics/timeseries?metric=${metric}&range=${range}`)
  }

  async getLeaderboard(type: LeaderboardType, range: TimeRange = '30d'): Promise<LeaderboardData> {
    return this.request<LeaderboardData>(`/analytics/leaderboards?type=${type}&range=${range}`)
  }

  // ============================================================================
  // Event Resolution
  // ============================================================================

  async getPendingEvents(): Promise<PendingEvent[]> {
    return this.request<PendingEvent[]>('/events/pending')
  }

  async getEventResolutionDetails(eventId: string): Promise<EventResolutionDetails> {
    return this.request<EventResolutionDetails>(`/events/${eventId}/resolution-details`)
  }

  async resolveEvent(eventId: string, resolution: ResolveEventRequest): Promise<void> {
    await this.request<void>(`/events/${eventId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution),
    })
  }

  async voidEvent(eventId: string, request: VoidEventRequest): Promise<void> {
    await this.request<void>(`/events/${eventId}/void`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient()
