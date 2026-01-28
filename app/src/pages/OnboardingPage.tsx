/**
 * OnboardingPage
 *
 * Multi-step user onboarding flow.
 * Features:
 * - Welcome screens introducing doom/life concept
 * - Username selection with validation
 * - Interest category selection
 * - Suggested users to follow
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  Skull,
  Heart,
  Sparkles,
  User,
  Check,
  AlertCircle,
  Users,
} from 'lucide-react'
import {
  useOnboardingStore,
  INTEREST_CATEGORIES,
  SUGGESTED_USERS,
} from '@/store/onboarding'
import { useUserStore } from '@/store'

type WelcomeSlide = 'welcome' | 'doom' | 'life' | 'journey'

export function OnboardingPage() {
  const navigate = useNavigate()
  const {
    currentStep,
    selectedInterests,
    followedUsers,
    completeStep,
    skipStep,
    setSelectedInterests,
    setFollowedUsers,
    finishOnboarding,
  } = useOnboardingStore()

  const setUsername = useUserStore((state) => state.setUsername)
  const author = useUserStore((state) => state.author)

  // Welcome slide state
  const [welcomeSlide, setWelcomeSlide] = useState<WelcomeSlide>('welcome')

  // Username state
  const [usernameInput, setUsernameInput] = useState(author?.username || '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameValid, setUsernameValid] = useState(false)

  // Validate username
  useEffect(() => {
    if (!usernameInput) {
      setUsernameError(null)
      setUsernameValid(false)
      return
    }

    // Check length
    if (usernameInput.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      setUsernameValid(false)
      return
    }
    if (usernameInput.length > 20) {
      setUsernameError('Username must be 20 characters or less')
      setUsernameValid(false)
      return
    }

    // Check format
    if (!/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
      setUsernameError('Only letters, numbers, and underscores allowed')
      setUsernameValid(false)
      return
    }

    // Check consecutive underscores
    if (/__/.test(usernameInput)) {
      setUsernameError('No consecutive underscores allowed')
      setUsernameValid(false)
      return
    }

    setUsernameError(null)
    setUsernameValid(true)
  }, [usernameInput])

  // Toggle interest selection
  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id))
    } else {
      setSelectedInterests([...selectedInterests, id])
    }
  }

  // Toggle user follow
  const toggleFollow = (id: string) => {
    if (followedUsers.includes(id)) {
      setFollowedUsers(followedUsers.filter((u) => u !== id))
    } else {
      setFollowedUsers([...followedUsers, id])
    }
  }

  // Handle welcome step completion
  const handleWelcomeNext = () => {
    const slides: WelcomeSlide[] = ['welcome', 'doom', 'life', 'journey']
    const currentIndex = slides.indexOf(welcomeSlide)
    if (currentIndex < slides.length - 1) {
      setWelcomeSlide(slides[currentIndex + 1])
    } else {
      completeStep('welcome')
    }
  }

  // Handle username step
  const handleUsernameSubmit = () => {
    if (usernameValid) {
      setUsername(usernameInput)
      completeStep('username')
    }
  }

  // Handle interests step
  const handleInterestsSubmit = () => {
    if (selectedInterests.length >= 3) {
      completeStep('interests')
    }
  }

  // Handle follow step and finish
  const handleFinish = () => {
    completeStep('follow-users')
    finishOnboarding()
    navigate('/')
  }

  // Render welcome slides
  const renderWelcomeSlide = () => {
    switch (welcomeSlide) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff3040] to-[#ff6b40] flex items-center justify-center mb-6">
              <Skull className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              Welcome to Doomsday
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg mb-2">
              Where doom meets hope
            </p>
            <p className="text-[var(--color-text-muted)] max-w-sm">
              Join a community that faces the future head-on, whether
              it's preparing for the worst or building something better.
            </p>
          </div>
        )

      case 'doom':
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#ff3040]/20 flex items-center justify-center mb-6">
              <Skull className="w-12 h-12 text-[#ff3040]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              The Doom Side
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-sm mb-4">
              Track apocalyptic scenarios, from climate disasters to AI risks.
              Stay informed about existential threats.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {['Climate', 'AI', 'Pandemic', 'Economic', 'Cosmic'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#ff3040]/10 text-[#ff3040] text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )

      case 'life':
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#00ba7c]/20 flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-[#00ba7c]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              The Life Side
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-sm mb-4">
              Discover hope, solutions, and resilience. Connect with
              those building a better tomorrow.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {['Solutions', 'Community', 'Renewable', 'Health', 'Growth'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#00ba7c]/10 text-[#00ba7c] text-sm rounded-full"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        )

      case 'journey':
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff3040] to-[#00ba7c] flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Your Journey Starts
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-sm mb-4">
              Customize your experience, follow interesting voices,
              and join the conversation.
            </p>
            <p className="text-[var(--color-text-muted)] text-sm">
              Ready to set up your profile?
            </p>
          </div>
        )
    }
  }

  // Render progress dots for welcome slides
  const renderWelcomeDots = () => {
    const slides: WelcomeSlide[] = ['welcome', 'doom', 'life', 'journey']
    return (
      <div className="flex gap-2 justify-center">
        {slides.map((slide) => (
          <button
            key={slide}
            onClick={() => setWelcomeSlide(slide)}
            className={`w-2 h-2 rounded-full transition-colors ${
              welcomeSlide === slide
                ? 'bg-[var(--color-doom)]'
                : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>
    )
  }

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="flex flex-col min-h-full">
            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
              {renderWelcomeSlide()}
            </div>

            {/* Navigation */}
            <div className="px-6 pb-8">
              {renderWelcomeDots()}
              <button
                onClick={handleWelcomeNext}
                className="w-full mt-6 py-4 bg-[var(--color-doom)] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                {welcomeSlide === 'journey' ? 'Get Started' : 'Continue'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )

      case 'username':
        return (
          <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => useOnboardingStore.setState({ currentStep: 'welcome' })}
                  className="p-2 -ml-2 text-[var(--color-text-secondary)]"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="text-sm text-[var(--color-text-muted)]">
                  Step 1 of 3
                </span>
                <button
                  onClick={() => skipStep('username')}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6">
              <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6">
                <User size={28} className="text-[var(--color-text-secondary)]" />
              </div>

              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                Choose your username
              </h2>
              <p className="text-[var(--color-text-muted)] mb-8">
                This is how others will find and mention you.
              </p>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                  placeholder="username"
                  className={`w-full pl-9 pr-12 py-4 bg-[var(--color-bg-secondary)] border rounded-xl text-[var(--color-text-primary)] text-lg outline-none transition-colors ${
                    usernameError
                      ? 'border-[var(--color-doom)]'
                      : usernameValid
                      ? 'border-[#00ba7c]'
                      : 'border-[var(--color-border)]'
                  }`}
                />
                {usernameValid && (
                  <Check
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ba7c]"
                  />
                )}
                {usernameError && (
                  <AlertCircle
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-doom)]"
                  />
                )}
              </div>

              {usernameError && (
                <p className="mt-2 text-sm text-[var(--color-doom)]">
                  {usernameError}
                </p>
              )}

              <div className="mt-4 text-sm text-[var(--color-text-muted)]">
                <p>Requirements:</p>
                <ul className="mt-1 space-y-1">
                  <li className={usernameInput.length >= 3 ? 'text-[#00ba7c]' : ''}>
                    - 3-20 characters
                  </li>
                  <li
                    className={
                      /^[a-zA-Z0-9_]*$/.test(usernameInput) && usernameInput
                        ? 'text-[#00ba7c]'
                        : ''
                    }
                  >
                    - Letters, numbers, underscores only
                  </li>
                </ul>
              </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-8">
              <button
                onClick={handleUsernameSubmit}
                disabled={!usernameValid}
                className={`w-full py-4 font-semibold rounded-xl transition-colors ${
                  usernameValid
                    ? 'bg-[var(--color-doom)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 'interests':
        return (
          <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    useOnboardingStore.setState({ currentStep: 'username' })
                  }
                  className="p-2 -ml-2 text-[var(--color-text-secondary)]"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="text-sm text-[var(--color-text-muted)]">
                  Step 2 of 3
                </span>
                <button
                  onClick={() => skipStep('interests')}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                What interests you?
              </h2>
              <p className="text-[var(--color-text-muted)] mb-6">
                Select at least 3 topics to personalize your feed.
              </p>

              {/* Doom Categories */}
              <h3 className="text-sm font-semibold text-[#ff3040] mb-3 flex items-center gap-2">
                <Skull size={16} />
                DOOM TOPICS
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {INTEREST_CATEGORIES.filter((c) => c.type === 'doom').map(
                  (category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleInterest(category.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedInterests.includes(category.id)
                          ? 'bg-[#ff3040]/10 border-[#ff3040] text-[var(--color-text-primary)]'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{category.icon}</span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  )
                )}
              </div>

              {/* Life Categories */}
              <h3 className="text-sm font-semibold text-[#00ba7c] mb-3 flex items-center gap-2">
                <Heart size={16} />
                LIFE TOPICS
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {INTEREST_CATEGORIES.filter((c) => c.type === 'life').map(
                  (category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleInterest(category.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedInterests.includes(category.id)
                          ? 'bg-[#00ba7c]/10 border-[#00ba7c] text-[var(--color-text-primary)]'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{category.icon}</span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-8 pt-4 border-t border-[var(--color-border)]">
              <p className="text-center text-sm text-[var(--color-text-muted)] mb-4">
                {selectedInterests.length} of 3 minimum selected
              </p>
              <button
                onClick={handleInterestsSubmit}
                disabled={selectedInterests.length < 3}
                className={`w-full py-4 font-semibold rounded-xl transition-colors ${
                  selectedInterests.length >= 3
                    ? 'bg-[var(--color-doom)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 'follow-users':
        return (
          <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    useOnboardingStore.setState({ currentStep: 'interests' })
                  }
                  className="p-2 -ml-2 text-[var(--color-text-secondary)]"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="text-sm text-[var(--color-text-muted)]">
                  Step 3 of 3
                </span>
                <button
                  onClick={handleFinish}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                  <Users size={24} className="text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Suggested for you
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Follow accounts to fill your feed
                  </p>
                </div>
              </div>

              {/* User Cards */}
              <div className="space-y-3">
                {SUGGESTED_USERS.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff3040] to-[#00ba7c] flex items-center justify-center text-white font-bold text-lg">
                        {user.displayName.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[var(--color-text-primary)] truncate">
                              {user.displayName}
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                              @{user.username}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleFollow(user.id)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                              followedUsers.includes(user.id)
                                ? 'bg-[var(--color-doom)] text-white'
                                : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                            }`}
                          >
                            {followedUsers.includes(user.id)
                              ? 'Following'
                              : 'Follow'}
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                          {user.bio}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {user.followers.toLocaleString()} followers
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Follow All */}
              {followedUsers.length < SUGGESTED_USERS.length && (
                <button
                  onClick={() =>
                    setFollowedUsers(SUGGESTED_USERS.map((u) => u.id))
                  }
                  className="w-full mt-4 py-3 border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] text-sm font-medium"
                >
                  Follow All ({SUGGESTED_USERS.length})
                </button>
              )}
            </div>

            {/* Action */}
            <div className="px-6 pb-8 pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={handleFinish}
                className="w-full py-4 bg-[var(--color-doom)] text-white font-semibold rounded-xl"
              >
                Finish Setup
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {renderStep()}
    </div>
  )
}
