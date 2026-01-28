/**
 * Onboarding Store
 *
 * Manages user onboarding flow state with persistence.
 * Tracks progress through welcome screens, username setup,
 * interest selection, and follow suggestions.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OnboardingStep =
  | 'welcome'
  | 'username'
  | 'interests'
  | 'follow-users'
  | 'completed'

export interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  skippedSteps: OnboardingStep[]
  selectedInterests: string[]
  followedUsers: string[]
  isOnboardingComplete: boolean
  hasSeenTutorial: boolean

  // Actions
  setStep: (step: OnboardingStep) => void
  completeStep: (step: OnboardingStep) => void
  skipStep: (step: OnboardingStep) => void
  setSelectedInterests: (interests: string[]) => void
  setFollowedUsers: (users: string[]) => void
  markTutorialSeen: () => void
  finishOnboarding: () => void
  resetOnboarding: () => void
  needsOnboarding: () => boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'username',
  'interests',
  'follow-users',
  'completed',
]

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 'welcome',
      completedSteps: [],
      skippedSteps: [],
      selectedInterests: [],
      followedUsers: [],
      isOnboardingComplete: false,
      hasSeenTutorial: false,

      setStep: (step) => set({ currentStep: step }),

      completeStep: (step) => {
        const { completedSteps } = get()
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] })
        }
        // Move to next step
        const currentIndex = ONBOARDING_STEPS.indexOf(step)
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
          set({ currentStep: ONBOARDING_STEPS[currentIndex + 1] })
        }
      },

      skipStep: (step) => {
        const { skippedSteps } = get()
        if (!skippedSteps.includes(step)) {
          set({ skippedSteps: [...skippedSteps, step] })
        }
        // Move to next step
        const currentIndex = ONBOARDING_STEPS.indexOf(step)
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
          set({ currentStep: ONBOARDING_STEPS[currentIndex + 1] })
        }
      },

      setSelectedInterests: (interests) => set({ selectedInterests: interests }),

      setFollowedUsers: (users) => set({ followedUsers: users }),

      markTutorialSeen: () => set({ hasSeenTutorial: true }),

      finishOnboarding: () =>
        set({
          currentStep: 'completed',
          isOnboardingComplete: true,
        }),

      resetOnboarding: () =>
        set({
          currentStep: 'welcome',
          completedSteps: [],
          skippedSteps: [],
          selectedInterests: [],
          followedUsers: [],
          isOnboardingComplete: false,
          hasSeenTutorial: false,
        }),

      needsOnboarding: () => {
        const { isOnboardingComplete } = get()
        return !isOnboardingComplete
      },
    }),
    {
      name: 'doomsday-onboarding',
    }
  )
)

// Interest categories for selection
export const INTEREST_CATEGORIES = [
  { id: 'climate', label: 'Climate Doom', icon: '🌍', type: 'doom' },
  { id: 'ai-tech', label: 'AI & Tech Doom', icon: '🤖', type: 'doom' },
  { id: 'economic', label: 'Economic Collapse', icon: '📉', type: 'doom' },
  { id: 'cosmic', label: 'Cosmic Events', icon: '☄️', type: 'doom' },
  { id: 'pandemic', label: 'Pandemic/Health', icon: '🦠', type: 'doom' },
  { id: 'political', label: 'Political Instability', icon: '🏛️', type: 'doom' },
  { id: 'environmental', label: 'Environmental Hope', icon: '🌱', type: 'life' },
  { id: 'tech-solutions', label: 'Tech Solutions', icon: '💡', type: 'life' },
  { id: 'community', label: 'Community Resilience', icon: '🤝', type: 'life' },
  { id: 'preparedness', label: 'Personal Preparedness', icon: '🎒', type: 'life' },
  { id: 'renewables', label: 'Renewable Energy', icon: '⚡', type: 'life' },
  { id: 'mental-health', label: 'Mental Wellness', icon: '🧘', type: 'life' },
] as const

// Suggested users for follow step
export const SUGGESTED_USERS = [
  {
    id: 'doom_prophet',
    username: 'doom_prophet',
    displayName: 'The Doom Prophet',
    avatar: null,
    bio: 'Tracking every sign of the end times. Climate researcher by day.',
    followers: 15420,
    interests: ['climate', 'cosmic'],
  },
  {
    id: 'tech_optimist',
    username: 'tech_optimist',
    displayName: 'Tech Optimist',
    avatar: null,
    bio: 'Building solutions while others predict problems. AI safety researcher.',
    followers: 8932,
    interests: ['ai-tech', 'tech-solutions'],
  },
  {
    id: 'prepper_pro',
    username: 'prepper_pro',
    displayName: 'Prepper Pro',
    avatar: null,
    bio: 'Hope for the best, prepare for the worst. Survival expert.',
    followers: 24150,
    interests: ['preparedness', 'community'],
  },
  {
    id: 'climate_watcher',
    username: 'climate_watcher',
    displayName: 'Climate Watcher',
    avatar: null,
    bio: 'Environmental scientist tracking climate data. Both doom and hope.',
    followers: 31200,
    interests: ['climate', 'environmental'],
  },
  {
    id: 'future_builder',
    username: 'future_builder',
    displayName: 'Future Builder',
    avatar: null,
    bio: 'Investing in tomorrow. Renewable energy and sustainable tech.',
    followers: 12890,
    interests: ['renewables', 'tech-solutions'],
  },
] as const
