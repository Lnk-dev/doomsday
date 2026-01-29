/**
 * Onboarding Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from './onboarding'

describe('onboarding store', () => {
  beforeEach(() => {
    // Reset store state
    useOnboardingStore.setState({
      currentStep: 'welcome',
      completedSteps: [],
      skippedSteps: [],
      selectedInterests: [],
      followedUsers: [],
      isOnboardingComplete: false,
      hasSeenTutorial: false,
    })
  })

  describe('initial state', () => {
    it('should start at welcome step', () => {
      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe('welcome')
    })

    it('should have no completed steps', () => {
      const state = useOnboardingStore.getState()
      expect(state.completedSteps).toEqual([])
    })

    it('should have no skipped steps', () => {
      const state = useOnboardingStore.getState()
      expect(state.skippedSteps).toEqual([])
    })

    it('should not be complete', () => {
      const state = useOnboardingStore.getState()
      expect(state.isOnboardingComplete).toBe(false)
    })

    it('should not have seen tutorial', () => {
      const state = useOnboardingStore.getState()
      expect(state.hasSeenTutorial).toBe(false)
    })
  })

  describe('setStep', () => {
    it('should set current step', () => {
      const { setStep } = useOnboardingStore.getState()

      setStep('username')

      expect(useOnboardingStore.getState().currentStep).toBe('username')
    })

    it('should allow setting any step', () => {
      const { setStep } = useOnboardingStore.getState()

      setStep('follow-users')

      expect(useOnboardingStore.getState().currentStep).toBe('follow-users')
    })
  })

  describe('completeStep', () => {
    it('should add step to completedSteps', () => {
      const { completeStep } = useOnboardingStore.getState()

      completeStep('welcome')

      expect(useOnboardingStore.getState().completedSteps).toContain('welcome')
    })

    it('should move to next step', () => {
      const { completeStep } = useOnboardingStore.getState()

      completeStep('welcome')

      expect(useOnboardingStore.getState().currentStep).toBe('username')
    })

    it('should not add duplicate completed steps', () => {
      const { completeStep } = useOnboardingStore.getState()

      completeStep('welcome')
      completeStep('welcome')

      expect(
        useOnboardingStore.getState().completedSteps.filter((s) => s === 'welcome')
      ).toHaveLength(1)
    })

    it('should progress through all steps', () => {
      const { completeStep } = useOnboardingStore.getState()

      completeStep('welcome')
      expect(useOnboardingStore.getState().currentStep).toBe('username')

      completeStep('username')
      expect(useOnboardingStore.getState().currentStep).toBe('interests')

      completeStep('interests')
      expect(useOnboardingStore.getState().currentStep).toBe('follow-users')

      completeStep('follow-users')
      expect(useOnboardingStore.getState().currentStep).toBe('completed')
    })
  })

  describe('skipStep', () => {
    it('should add step to skippedSteps', () => {
      const { skipStep } = useOnboardingStore.getState()

      skipStep('interests')

      expect(useOnboardingStore.getState().skippedSteps).toContain('interests')
    })

    it('should move to next step', () => {
      const { setStep, skipStep } = useOnboardingStore.getState()

      setStep('interests')
      skipStep('interests')

      expect(useOnboardingStore.getState().currentStep).toBe('follow-users')
    })

    it('should not add duplicate skipped steps', () => {
      const { skipStep } = useOnboardingStore.getState()

      skipStep('interests')
      skipStep('interests')

      expect(
        useOnboardingStore.getState().skippedSteps.filter((s) => s === 'interests')
      ).toHaveLength(1)
    })
  })

  describe('setSelectedInterests', () => {
    it('should set selected interests', () => {
      const { setSelectedInterests } = useOnboardingStore.getState()

      setSelectedInterests(['climate', 'ai-tech'])

      expect(useOnboardingStore.getState().selectedInterests).toEqual(['climate', 'ai-tech'])
    })

    it('should replace existing interests', () => {
      const { setSelectedInterests } = useOnboardingStore.getState()

      setSelectedInterests(['climate'])
      setSelectedInterests(['ai-tech', 'economic'])

      expect(useOnboardingStore.getState().selectedInterests).toEqual(['ai-tech', 'economic'])
    })
  })

  describe('setFollowedUsers', () => {
    it('should set followed users', () => {
      const { setFollowedUsers } = useOnboardingStore.getState()

      setFollowedUsers(['doom_prophet', 'tech_optimist'])

      expect(useOnboardingStore.getState().followedUsers).toEqual([
        'doom_prophet',
        'tech_optimist',
      ])
    })
  })

  describe('markTutorialSeen', () => {
    it('should mark tutorial as seen', () => {
      const { markTutorialSeen } = useOnboardingStore.getState()

      markTutorialSeen()

      expect(useOnboardingStore.getState().hasSeenTutorial).toBe(true)
    })
  })

  describe('finishOnboarding', () => {
    it('should set current step to completed', () => {
      const { finishOnboarding } = useOnboardingStore.getState()

      finishOnboarding()

      expect(useOnboardingStore.getState().currentStep).toBe('completed')
    })

    it('should set isOnboardingComplete to true', () => {
      const { finishOnboarding } = useOnboardingStore.getState()

      finishOnboarding()

      expect(useOnboardingStore.getState().isOnboardingComplete).toBe(true)
    })
  })

  describe('resetOnboarding', () => {
    it('should reset all state to initial values', () => {
      const {
        completeStep,
        setSelectedInterests,
        setFollowedUsers,
        markTutorialSeen,
        finishOnboarding,
        resetOnboarding,
      } = useOnboardingStore.getState()

      // Set up state
      completeStep('welcome')
      completeStep('username')
      setSelectedInterests(['climate'])
      setFollowedUsers(['doom_prophet'])
      markTutorialSeen()
      finishOnboarding()

      // Reset
      resetOnboarding()

      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe('welcome')
      expect(state.completedSteps).toEqual([])
      expect(state.skippedSteps).toEqual([])
      expect(state.selectedInterests).toEqual([])
      expect(state.followedUsers).toEqual([])
      expect(state.isOnboardingComplete).toBe(false)
      expect(state.hasSeenTutorial).toBe(false)
    })
  })

  describe('needsOnboarding', () => {
    it('should return true when not complete', () => {
      const { needsOnboarding } = useOnboardingStore.getState()

      expect(needsOnboarding()).toBe(true)
    })

    it('should return false when complete', () => {
      const { finishOnboarding, needsOnboarding } = useOnboardingStore.getState()

      finishOnboarding()

      expect(needsOnboarding()).toBe(false)
    })
  })
})
