/**
 * CreateEventPage
 *
 * 4-step wizard for creating enhanced prediction events.
 * Steps:
 * 1. Basic Info: Title, description, category
 * 2. Resolution Criteria: Add 1-5 conditions
 * 3. Verification: Primary source (required) + secondary
 * 4. Deadlines & Stake: Timelines + optional stake
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { useEventsStore, useUserStore } from '@/store'
import { FormField } from '@/components/ui/FormField'
import { required, minLength, maxLength, validateField } from '@/lib/validation'
import { ResolutionCriteriaBuilder } from '@/components/events/ResolutionCriteriaBuilder'
import { VerificationSourceInput } from '@/components/events/VerificationSourceInput'
import { DeadlineSelector } from '@/components/events/DeadlineSelector'
import { QualityScoreDisplay } from '@/components/events/QualityScoreDisplay'
import { CreatorStakeInput } from '@/components/events/CreatorStakeInput'
import type { EventCategory, ResolutionCriterion, VerificationSource } from '@/types'

/** Available categories with labels and colors */
const categories: { id: EventCategory; label: string; color: string }[] = [
  { id: 'technology', label: 'Technology', color: '#3b82f6' },
  { id: 'economic', label: 'Economic', color: '#f59e0b' },
  { id: 'climate', label: 'Climate', color: '#22c55e' },
  { id: 'war', label: 'War', color: '#ef4444' },
  { id: 'natural', label: 'Natural', color: '#8b5cf6' },
  { id: 'social', label: 'Social', color: '#ec4899' },
  { id: 'other', label: 'Other', color: '#6b7280' },
]

/** Validation constants */
const TITLE_MIN_LENGTH = 5
const TITLE_MAX_LENGTH = 100
const DESCRIPTION_MIN_LENGTH = 20
const DESCRIPTION_MAX_LENGTH = 500

const STORAGE_KEY = 'doomsday_create_event_draft'

/** Step configuration */
const steps = [
  { id: 1, label: 'Basic Info', short: 'Info' },
  { id: 2, label: 'Resolution', short: 'Resolution' },
  { id: 3, label: 'Verification', short: 'Sources' },
  { id: 4, label: 'Deadlines', short: 'Timeline' },
]

interface FormState {
  title: string
  description: string
  category: EventCategory
  resolutionCriteria: ResolutionCriterion[]
  verificationSources: VerificationSource[]
  bettingDeadline: string
  eventDeadline: string
  resolutionDeadline: string
  creatorStakeAmount: number
  creatorStakeOutcome: 'doom' | 'life'
}

const defaultFormState: FormState = {
  title: '',
  description: '',
  category: 'technology',
  resolutionCriteria: [{ conditionType: 'occurrence', description: '' }],
  verificationSources: [{ isPrimary: true, name: '' }],
  bettingDeadline: '',
  eventDeadline: '',
  resolutionDeadline: '',
  creatorStakeAmount: 0,
  creatorStakeOutcome: 'doom',
}

export function CreateEventPage() {
  const navigate = useNavigate()
  const createEvent = useEventsStore((state) => state.createEvent)
  const doomBalance = useUserStore((state) => state.doomBalance)

  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load draft from localStorage
  const [formState, setFormState] = useState<FormState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return { ...defaultFormState, ...JSON.parse(saved) }
      } catch {
        return defaultFormState
      }
    }
    return defaultFormState
  })

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formState))
  }, [formState])

  // Clear draft on success
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Update form field
  const updateForm = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Validation
  const titleRules = useMemo(() => [
    required('Title is required'),
    minLength(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`),
    maxLength(TITLE_MAX_LENGTH, `Title cannot exceed ${TITLE_MAX_LENGTH} characters`),
  ], [])

  const descriptionRules = useMemo(() => [
    required('Description is required'),
    minLength(DESCRIPTION_MIN_LENGTH, `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`),
    maxLength(DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters`),
  ], [])

  const titleValidation = useMemo(() => validateField(formState.title, titleRules), [formState.title, titleRules])
  const descriptionValidation = useMemo(() => validateField(formState.description, descriptionRules), [formState.description, descriptionRules])

  // Step validation
  const stepValidation = useMemo(() => {
    const step1Valid = titleValidation.isValid && descriptionValidation.isValid
    const step2Valid = formState.resolutionCriteria.length > 0 &&
      formState.resolutionCriteria.every((c) => c.description.length >= 10)
    const step3Valid = formState.verificationSources.length > 0 &&
      formState.verificationSources.some((s) => s.isPrimary && s.name.length > 0)
    const step4Valid = formState.bettingDeadline && formState.eventDeadline && formState.resolutionDeadline &&
      new Date(formState.bettingDeadline) < new Date(formState.eventDeadline) &&
      new Date(formState.eventDeadline) < new Date(formState.resolutionDeadline) &&
      new Date(formState.bettingDeadline) > new Date()

    return {
      1: step1Valid,
      2: step2Valid,
      3: step3Valid,
      4: step4Valid,
    }
  }, [formState, titleValidation, descriptionValidation])

  const isCurrentStepValid = stepValidation[currentStep as keyof typeof stepValidation]
  const isFormValid = Object.values(stepValidation).every(Boolean)

  // Navigation
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step)
    }
  }, [])

  const goNext = useCallback(() => {
    if (currentStep < 4 && isCurrentStepValid) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, isCurrentStepValid])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    } else {
      navigate(-1)
    }
  }, [currentStep, navigate])

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      // In a real implementation, this would call the API
      const event = createEvent(
        formState.title.trim(),
        formState.description.trim(),
        formState.category,
        Math.ceil((new Date(formState.eventDeadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      )

      clearDraft()
      setShowSuccess(true)

      setTimeout(() => {
        navigate(`/events/${event.id}`)
      }, 1500)
    } catch {
      setIsSubmitting(false)
    }
  }, [isFormValid, isSubmitting, formState, createEvent, clearDraft, navigate])

  const selectedCategory = categories.find((c) => c.id === formState.category)

  if (showSuccess) {
    return (
      <div className="flex flex-col min-h-full bg-black">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-[#00ba7c] flex items-center justify-center mb-4">
            <Check size={32} className="text-white" />
          </div>
          <p className="text-[17px] font-semibold text-white">Prediction Created!</p>
          <p className="text-[14px] text-[#777] mt-1">Redirecting to event page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <button onClick={goBack}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white">Create Prediction</h1>
        <div className="w-6" />
      </div>

      {/* Step indicator */}
      <div className="px-4 py-3 border-b border-[#333]">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(step.id)}
                disabled={step.id > currentStep && !stepValidation[(step.id - 1) as keyof typeof stepValidation]}
                className={`flex items-center gap-2 ${
                  step.id === currentStep ? 'text-[#ff3040]' :
                  step.id < currentStep ? 'text-[#00ba7c]' : 'text-[#555]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step.id === currentStep ? 'bg-[#ff3040] text-white' :
                  step.id < currentStep ? 'bg-[#00ba7c] text-white' : 'bg-[#333] text-[#777]'
                }`}>
                  {step.id < currentStep ? <Check size={12} /> : step.id}
                </div>
                <span className="text-[11px] font-medium hidden sm:inline">{step.short}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-2 ${
                  step.id < currentStep ? 'bg-[#00ba7c]' : 'bg-[#333]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <>
              <div>
                <FormField
                  id="event-title"
                  label="Event Title"
                  error={formState.title.length > 0 ? titleValidation.error : undefined}
                  touched={formState.title.length > 0}
                  required
                >
                  <input
                    id="event-title"
                    type="text"
                    value={formState.title}
                    onChange={(e) => updateForm('title', e.target.value.slice(0, TITLE_MAX_LENGTH))}
                    placeholder="What doom scenario are you predicting?"
                    className="w-full bg-[#1a1a1a] text-[16px] text-white placeholder-[#555] p-4 rounded-lg outline-none focus:ring-2 focus:ring-[#ff3040]"
                  />
                </FormField>
                <div className="flex justify-between mt-2">
                  <span className="text-[12px] text-[#555]">Min {TITLE_MIN_LENGTH} characters</span>
                  <span className={`text-[12px] ${formState.title.length > TITLE_MAX_LENGTH - 20 ? 'text-[#ff3040]' : 'text-[#555]'}`}>
                    {formState.title.length}/{TITLE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <div>
                <FormField
                  id="event-description"
                  label="Description"
                  error={formState.description.length > 0 ? descriptionValidation.error : undefined}
                  touched={formState.description.length > 0}
                  required
                >
                  <textarea
                    id="event-description"
                    value={formState.description}
                    onChange={(e) => updateForm('description', e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                    placeholder="Describe the scenario in detail. What conditions need to be met?"
                    rows={4}
                    className="w-full bg-[#1a1a1a] text-[15px] text-white placeholder-[#555] p-4 rounded-lg outline-none focus:ring-2 focus:ring-[#ff3040] resize-none"
                  />
                </FormField>
                <div className="flex justify-between mt-2">
                  <span className="text-[12px] text-[#555]">Min {DESCRIPTION_MIN_LENGTH} characters</span>
                  <span className={`text-[12px] ${formState.description.length > DESCRIPTION_MAX_LENGTH - 50 ? 'text-[#ff3040]' : 'text-[#555]'}`}>
                    {formState.description.length}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[13px] text-[#777] mb-3 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateForm('category', cat.id)}
                      className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                        formState.category === cat.id ? 'text-white' : 'bg-[#1a1a1a] text-[#777]'
                      }`}
                      style={formState.category === cat.id ? { backgroundColor: cat.color } : {}}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Resolution Criteria */}
          {currentStep === 2 && (
            <ResolutionCriteriaBuilder
              criteria={formState.resolutionCriteria}
              onChange={(criteria) => updateForm('resolutionCriteria', criteria)}
            />
          )}

          {/* Step 3: Verification Sources */}
          {currentStep === 3 && (
            <VerificationSourceInput
              sources={formState.verificationSources}
              onChange={(sources) => updateForm('verificationSources', sources)}
            />
          )}

          {/* Step 4: Deadlines & Stake */}
          {currentStep === 4 && (
            <>
              <DeadlineSelector
                bettingDeadline={formState.bettingDeadline}
                eventDeadline={formState.eventDeadline}
                resolutionDeadline={formState.resolutionDeadline}
                onBettingDeadlineChange={(d) => updateForm('bettingDeadline', d)}
                onEventDeadlineChange={(d) => updateForm('eventDeadline', d)}
                onResolutionDeadlineChange={(d) => updateForm('resolutionDeadline', d)}
              />

              <div className="border-t border-[#333] pt-6">
                <CreatorStakeInput
                  amount={formState.creatorStakeAmount}
                  outcome={formState.creatorStakeOutcome}
                  balance={doomBalance}
                  onAmountChange={(a) => updateForm('creatorStakeAmount', a)}
                  onOutcomeChange={(o) => updateForm('creatorStakeOutcome', o)}
                />
              </div>
            </>
          )}

          {/* Quality Score (visible on steps 2-4) */}
          {currentStep >= 2 && (
            <div className="border-t border-[#333] pt-6">
              <QualityScoreDisplay
                resolutionCriteria={formState.resolutionCriteria}
                verificationSources={formState.verificationSources}
                creatorStake={formState.creatorStakeAmount > 0 ? {
                  amount: formState.creatorStakeAmount,
                  outcome: formState.creatorStakeOutcome,
                } : null}
                description={formState.description}
              />
            </div>
          )}

          {/* Preview (step 4) */}
          {currentStep === 4 && (
            <div className="border-t border-[#333] pt-6">
              <label className="text-[13px] text-[#777] mb-3 block">Preview</label>
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${selectedCategory?.color}30`,
                      color: selectedCategory?.color,
                    }}
                  >
                    {selectedCategory?.label}
                  </span>
                  <span className="text-[12px] text-[#555]">
                    {formState.resolutionCriteria.length} criteria
                  </span>
                  <span className="text-[12px] text-[#555]">
                    {formState.verificationSources.length} sources
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-1">
                  {formState.title || 'Your prediction title'}
                </h3>
                <p className="text-[13px] text-[#999] line-clamp-2">
                  {formState.description || 'Your prediction description...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="p-4 border-t border-[#333]">
        {!isCurrentStepValid && currentStep < 4 && (
          <div className="flex items-center gap-2 mb-3 text-[#ff3040]">
            <AlertCircle size={14} />
            <span className="text-[12px]">Complete this step to continue</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={goBack}
            className="flex-1 py-3 bg-[#1a1a1a] text-white text-[15px] font-semibold rounded-lg"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={goNext}
              disabled={!isCurrentStepValid}
              className={`flex-1 py-3 text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 ${
                isCurrentStepValid
                  ? 'bg-[#ff3040] text-white'
                  : 'bg-[#333] text-[#555]'
              }`}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 py-3 text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-[#ff3040] text-white'
                  : 'bg-[#333] text-[#555]'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Prediction'}
              <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
