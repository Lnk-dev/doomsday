/**
 * Legal Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useLegalStore,
  TERMS_VERSION,
  PRIVACY_VERSION,
  type CookiePreferences,
} from './legal'

describe('legal store', () => {
  beforeEach(() => {
    // Reset store state
    useLegalStore.setState({
      tosAcceptedVersion: null,
      privacyAcceptedVersion: null,
      cookiePreferences: null,
      ageVerified: false,
      ageVerifiedAt: null,
    })
  })

  describe('initial state', () => {
    it('should have no ToS acceptance', () => {
      const state = useLegalStore.getState()
      expect(state.tosAcceptedVersion).toBeNull()
    })

    it('should have no privacy acceptance', () => {
      const state = useLegalStore.getState()
      expect(state.privacyAcceptedVersion).toBeNull()
    })

    it('should have no cookie preferences', () => {
      const state = useLegalStore.getState()
      expect(state.cookiePreferences).toBeNull()
    })

    it('should not be age verified', () => {
      const state = useLegalStore.getState()
      expect(state.ageVerified).toBe(false)
      expect(state.ageVerifiedAt).toBeNull()
    })
  })

  describe('acceptTos', () => {
    it('should accept ToS with version', () => {
      const { acceptTos } = useLegalStore.getState()

      acceptTos(TERMS_VERSION)

      expect(useLegalStore.getState().tosAcceptedVersion).toBe(TERMS_VERSION)
    })

    it('should accept custom version', () => {
      const { acceptTos } = useLegalStore.getState()

      acceptTos('2.0.0')

      expect(useLegalStore.getState().tosAcceptedVersion).toBe('2.0.0')
    })
  })

  describe('acceptPrivacy', () => {
    it('should accept privacy policy with version', () => {
      const { acceptPrivacy } = useLegalStore.getState()

      acceptPrivacy(PRIVACY_VERSION)

      expect(useLegalStore.getState().privacyAcceptedVersion).toBe(PRIVACY_VERSION)
    })
  })

  describe('setCookiePreferences', () => {
    it('should set cookie preferences', () => {
      const { setCookiePreferences } = useLegalStore.getState()

      const prefs: CookiePreferences = {
        essential: true,
        analytics: true,
        preferences: false,
      }

      setCookiePreferences(prefs)

      expect(useLegalStore.getState().cookiePreferences).toEqual(prefs)
    })

    it('should update existing preferences', () => {
      const { setCookiePreferences } = useLegalStore.getState()

      setCookiePreferences({ essential: true, analytics: false, preferences: false })
      setCookiePreferences({ essential: true, analytics: true, preferences: true })

      const prefs = useLegalStore.getState().cookiePreferences
      expect(prefs?.analytics).toBe(true)
      expect(prefs?.preferences).toBe(true)
    })
  })

  describe('verifyAge', () => {
    it('should set age verified to true', () => {
      const { verifyAge } = useLegalStore.getState()

      verifyAge()

      expect(useLegalStore.getState().ageVerified).toBe(true)
    })

    it('should set age verified timestamp', () => {
      const before = Date.now()
      const { verifyAge } = useLegalStore.getState()

      verifyAge()

      const state = useLegalStore.getState()
      expect(state.ageVerifiedAt).toBeGreaterThanOrEqual(before)
      expect(state.ageVerifiedAt).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('resetConsent', () => {
    it('should reset all consent values', () => {
      const { acceptTos, acceptPrivacy, setCookiePreferences, verifyAge, resetConsent } =
        useLegalStore.getState()

      // Set all values
      acceptTos(TERMS_VERSION)
      acceptPrivacy(PRIVACY_VERSION)
      setCookiePreferences({ essential: true, analytics: true, preferences: true })
      verifyAge()

      // Reset
      resetConsent()

      const state = useLegalStore.getState()
      expect(state.tosAcceptedVersion).toBeNull()
      expect(state.privacyAcceptedVersion).toBeNull()
      expect(state.cookiePreferences).toBeNull()
      expect(state.ageVerified).toBe(false)
      expect(state.ageVerifiedAt).toBeNull()
    })
  })

  describe('needsTosAcceptance', () => {
    it('should return true when ToS not accepted', () => {
      const { needsTosAcceptance } = useLegalStore.getState()

      expect(needsTosAcceptance()).toBe(true)
    })

    it('should return false when current version accepted', () => {
      const { acceptTos, needsTosAcceptance } = useLegalStore.getState()

      acceptTos(TERMS_VERSION)

      expect(needsTosAcceptance()).toBe(false)
    })

    it('should return true when old version accepted', () => {
      const { acceptTos, needsTosAcceptance } = useLegalStore.getState()

      acceptTos('0.9.0')

      expect(needsTosAcceptance()).toBe(true)
    })
  })

  describe('needsPrivacyAcceptance', () => {
    it('should return true when privacy not accepted', () => {
      const { needsPrivacyAcceptance } = useLegalStore.getState()

      expect(needsPrivacyAcceptance()).toBe(true)
    })

    it('should return false when current version accepted', () => {
      const { acceptPrivacy, needsPrivacyAcceptance } = useLegalStore.getState()

      acceptPrivacy(PRIVACY_VERSION)

      expect(needsPrivacyAcceptance()).toBe(false)
    })
  })

  describe('needsCookieConsent', () => {
    it('should return true when no preferences set', () => {
      const { needsCookieConsent } = useLegalStore.getState()

      expect(needsCookieConsent()).toBe(true)
    })

    it('should return false when preferences set', () => {
      const { setCookiePreferences, needsCookieConsent } = useLegalStore.getState()

      setCookiePreferences({ essential: true, analytics: false, preferences: false })

      expect(needsCookieConsent()).toBe(false)
    })
  })

  describe('needsAgeVerification', () => {
    it('should return true when not verified', () => {
      const { needsAgeVerification } = useLegalStore.getState()

      expect(needsAgeVerification()).toBe(true)
    })

    it('should return false when verified', () => {
      const { verifyAge, needsAgeVerification } = useLegalStore.getState()

      verifyAge()

      expect(needsAgeVerification()).toBe(false)
    })
  })

  describe('isFullyCompliant', () => {
    it('should return false when nothing accepted', () => {
      const { isFullyCompliant } = useLegalStore.getState()

      expect(isFullyCompliant()).toBe(false)
    })

    it('should return false when only ToS accepted', () => {
      const { acceptTos, isFullyCompliant } = useLegalStore.getState()

      acceptTos(TERMS_VERSION)

      expect(isFullyCompliant()).toBe(false)
    })

    it('should return false when only privacy accepted', () => {
      const { acceptPrivacy, isFullyCompliant } = useLegalStore.getState()

      acceptPrivacy(PRIVACY_VERSION)

      expect(isFullyCompliant()).toBe(false)
    })

    it('should return false when age not verified', () => {
      const { acceptTos, acceptPrivacy, setCookiePreferences, isFullyCompliant } =
        useLegalStore.getState()

      acceptTos(TERMS_VERSION)
      acceptPrivacy(PRIVACY_VERSION)
      setCookiePreferences({ essential: true, analytics: true, preferences: true })

      expect(isFullyCompliant()).toBe(false)
    })

    it('should return true when fully compliant', () => {
      const { acceptTos, acceptPrivacy, setCookiePreferences, verifyAge, isFullyCompliant } =
        useLegalStore.getState()

      acceptTos(TERMS_VERSION)
      acceptPrivacy(PRIVACY_VERSION)
      setCookiePreferences({ essential: true, analytics: false, preferences: false })
      verifyAge()

      expect(isFullyCompliant()).toBe(true)
    })

    it('should return false when old ToS version', () => {
      const { acceptTos, acceptPrivacy, setCookiePreferences, verifyAge, isFullyCompliant } =
        useLegalStore.getState()

      acceptTos('0.9.0')
      acceptPrivacy(PRIVACY_VERSION)
      setCookiePreferences({ essential: true, analytics: false, preferences: false })
      verifyAge()

      expect(isFullyCompliant()).toBe(false)
    })
  })
})
