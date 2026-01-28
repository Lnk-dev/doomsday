/**
 * CreateEventPage
 *
 * Form for creating new prediction events.
 * Features:
 * - Event title and description input
 * - Category selection
 * - Countdown date picker
 * - Preview before submission
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, AlertTriangle, Check } from 'lucide-react'
import { useEventsStore } from '@/store'
import type { EventCategory } from '@/types'

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

/** Preset countdown options */
const countdownPresets = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
  { label: '2 years', days: 730 },
  { label: '5 years', days: 1825 },
]

export function CreateEventPage() {
  const navigate = useNavigate()
  const createEvent = useEventsStore((state) => state.createEvent)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<EventCategory>('technology')
  const [daysUntilEnd, setDaysUntilEnd] = useState(30)
  const [showSuccess, setShowSuccess] = useState(false)

  /** Validate form */
  const isValid = title.trim().length >= 5 && description.trim().length >= 20

  /** Handle form submission */
  const handleSubmit = () => {
    if (!isValid) return

    const event = createEvent(title.trim(), description.trim(), category, daysUntilEnd)
    setShowSuccess(true)

    setTimeout(() => {
      navigate(`/events/${event.id}`)
    }, 1500)
  }

  /** Format countdown end date */
  const endDate = new Date(Date.now() + daysUntilEnd * 24 * 60 * 60 * 1000)
  const formattedDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const selectedCategory = categories.find((c) => c.id === category)

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white">Create Prediction</h1>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`text-[15px] font-semibold ${
            isValid ? 'text-[#ff3040]' : 'text-[#555]'
          }`}
        >
          Create
        </button>
      </div>

      {showSuccess ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-[#00ba7c] flex items-center justify-center mb-4">
            <Check size={32} className="text-white" />
          </div>
          <p className="text-[17px] font-semibold text-white">Prediction Created!</p>
          <p className="text-[14px] text-[#777] mt-1">Redirecting to event page...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Title input */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-[13px] text-[#777] mb-2 block">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What doom scenario are you predicting?"
              maxLength={100}
              className="w-full bg-transparent text-[17px] text-white placeholder-[#555] outline-none"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[12px] text-[#555]">Min 5 characters</span>
              <span className="text-[12px] text-[#555]">{title.length}/100</span>
            </div>
          </div>

          {/* Description input */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-[13px] text-[#777] mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario in detail. What conditions need to be met for this prediction to be considered 'occurred'?"
              maxLength={500}
              rows={4}
              className="w-full bg-transparent text-[15px] text-white placeholder-[#555] outline-none resize-none"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[12px] text-[#555]">Min 20 characters</span>
              <span className="text-[12px] text-[#555]">{description.length}/500</span>
            </div>
          </div>

          {/* Category selector */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-[13px] text-[#777] mb-3 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                    category === cat.id
                      ? 'text-white'
                      : 'bg-[#1a1a1a] text-[#777]'
                  }`}
                  style={
                    category === cat.id
                      ? { backgroundColor: cat.color }
                      : {}
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Countdown selector */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-[13px] text-[#777] mb-3 block">Countdown Duration</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {countdownPresets.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => setDaysUntilEnd(preset.days)}
                  className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-all ${
                    daysUntilEnd === preset.days
                      ? 'bg-[#ff3040] text-white'
                      : 'bg-[#1a1a1a] text-[#777]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[#777]">
              <Calendar size={14} />
              <span className="text-[13px]">
                Ends: {formattedDate}
              </span>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4">
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
                <span className="text-[12px] text-[#ff3040] flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {daysUntilEnd}d
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-1">
                {title || 'Your prediction title'}
              </h3>
              <p className="text-[13px] text-[#999] line-clamp-2">
                {description || 'Your prediction description will appear here...'}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="px-4 pb-8">
            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <h4 className="text-[13px] font-semibold text-white mb-2">How predictions work</h4>
              <ul className="text-[12px] text-[#777] space-y-1">
                <li>• Once created, others can bet DOOM or LIFE on your prediction</li>
                <li>• DOOM bettors think the event will happen before the countdown</li>
                <li>• LIFE bettors think it won't happen</li>
                <li>• When the countdown ends, winners split the losers' stakes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
