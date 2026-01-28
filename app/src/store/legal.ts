/**
 * Legal Store - Terms and Privacy acceptance tracking
 *
 * Tracks user acceptance of Terms of Service and Privacy Policy.
 * Required for legal compliance on betting/prediction platforms.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TERMS_VERSION = '1.0.0'
export const PRIVACY_VERSION = '1.0.0'
export const COOKIE_VERSION = '1.0.0'

export interface CookiePreferences {
  essential: true // Always required
  analytics: boolean
  preferences: boolean
}

interface LegalState {
  /** Accepted Terms of Service version */
  tosAcceptedVersion: string | null
  /** Accepted Privacy Policy version */
  privacyAcceptedVersion: string | null
  /** Cookie consent preferences */
  cookiePreferences: CookiePreferences | null
  /** Age verification completed */
  ageVerified: boolean
  /** Timestamp of age verification */
  ageVerifiedAt: number | null

  // Actions
  acceptTos: (version: string) => void
  acceptPrivacy: (version: string) => void
  setCookiePreferences: (prefs: CookiePreferences) => void
  verifyAge: () => void
  resetConsent: () => void

  // Getters
  needsTosAcceptance: () => boolean
  needsPrivacyAcceptance: () => boolean
  needsCookieConsent: () => boolean
  needsAgeVerification: () => boolean
  isFullyCompliant: () => boolean
}

export const useLegalStore = create<LegalState>()(
  persist(
    (set, get) => ({
      tosAcceptedVersion: null,
      privacyAcceptedVersion: null,
      cookiePreferences: null,
      ageVerified: false,
      ageVerifiedAt: null,

      acceptTos: (version) => {
        set({ tosAcceptedVersion: version })
      },

      acceptPrivacy: (version) => {
        set({ privacyAcceptedVersion: version })
      },

      setCookiePreferences: (prefs) => {
        set({ cookiePreferences: prefs })
      },

      verifyAge: () => {
        set({
          ageVerified: true,
          ageVerifiedAt: Date.now(),
        })
      },

      resetConsent: () => {
        set({
          tosAcceptedVersion: null,
          privacyAcceptedVersion: null,
          cookiePreferences: null,
          ageVerified: false,
          ageVerifiedAt: null,
        })
      },

      needsTosAcceptance: () => {
        return get().tosAcceptedVersion !== TERMS_VERSION
      },

      needsPrivacyAcceptance: () => {
        return get().privacyAcceptedVersion !== PRIVACY_VERSION
      },

      needsCookieConsent: () => {
        return get().cookiePreferences === null
      },

      needsAgeVerification: () => {
        return !get().ageVerified
      },

      isFullyCompliant: () => {
        const state = get()
        return (
          state.tosAcceptedVersion === TERMS_VERSION &&
          state.privacyAcceptedVersion === PRIVACY_VERSION &&
          state.cookiePreferences !== null &&
          state.ageVerified
        )
      },
    }),
    { name: 'doomsday-legal' }
  )
)
