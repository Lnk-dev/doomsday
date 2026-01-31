/**
 * VerificationSourceInput
 *
 * Component for managing verification sources for prediction events.
 * Allows adding primary and secondary sources with URLs and types.
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, AlertCircle, Star, Link, ExternalLink } from 'lucide-react'
import type { VerificationSource, VerificationSourceType } from '@/types'

interface VerificationSourceInputProps {
  sources: VerificationSource[]
  onChange: (sources: VerificationSource[]) => void
  maxSources?: number
}

const sourceTypes: { value: VerificationSourceType; label: string }[] = [
  { value: 'government', label: 'Government' },
  { value: 'academic', label: 'Academic' },
  { value: 'news', label: 'News Media' },
  { value: 'api', label: 'API/Data Feed' },
  { value: 'official', label: 'Official Source' },
]

const defaultSource: VerificationSource = {
  isPrimary: false,
  name: '',
  url: '',
  sourceType: undefined,
}

export function VerificationSourceInput({
  sources,
  onChange,
  maxSources = 5,
}: VerificationSourceInputProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(sources.length > 0 ? 0 : null)

  const hasPrimarySource = sources.some((s) => s.isPrimary)

  const addSource = useCallback(() => {
    if (sources.length >= maxSources) return
    const newSources = [...sources, { ...defaultSource, isPrimary: !hasPrimarySource }]
    onChange(newSources)
    setEditingIndex(newSources.length - 1)
  }, [sources, maxSources, hasPrimarySource, onChange])

  const removeSource = useCallback((index: number) => {
    const newSources = sources.filter((_, i) => i !== index)
    onChange(newSources)
    if (editingIndex === index) {
      setEditingIndex(newSources.length > 0 ? 0 : null)
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
  }, [sources, editingIndex, onChange])

  const updateSource = useCallback((index: number, updates: Partial<VerificationSource>) => {
    const newSources = sources.map((s, i) => {
      if (i === index) {
        return { ...s, ...updates }
      }
      // If setting this source as primary, unset others
      if (updates.isPrimary && s.isPrimary) {
        return { ...s, isPrimary: false }
      }
      return s
    })
    onChange(newSources)
  }, [sources, onChange])

  const validateUrl = (url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[13px] text-[#777]">
          Verification Sources ({sources.length}/{maxSources})
        </label>
        {sources.length < maxSources && (
          <button
            type="button"
            onClick={addSource}
            className="flex items-center gap-1 text-[13px] text-[#ff3040] hover:text-[#ff5060]"
          >
            <Plus size={14} />
            Add Source
          </button>
        )}
      </div>

      {!hasPrimarySource && sources.length > 0 && (
        <div className="p-3 bg-[#1f0a0a] rounded-lg border border-[#ff3040]/30 flex items-start gap-2">
          <AlertCircle size={16} className="text-[#ff3040] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#ff3040]">
            At least one primary source is required. Mark one source as primary.
          </p>
        </div>
      )}

      {sources.length === 0 && (
        <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333] text-center">
          <Link size={24} className="mx-auto text-[#555] mb-2" />
          <p className="text-[14px] text-[#777]">No sources added yet.</p>
          <p className="text-[12px] text-[#555] mt-1">Add at least one primary verification source.</p>
          <button
            type="button"
            onClick={addSource}
            className="mt-3 px-4 py-2 bg-[#ff3040] text-white text-[13px] rounded-lg hover:bg-[#ff4050]"
          >
            Add Primary Source
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sources.map((source, index) => (
          <div
            key={index}
            className={`bg-[#1a1a1a] rounded-lg border ${
              source.isPrimary ? 'border-[#f59e0b]' : 'border-[#333]'
            }`}
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
            >
              <div className="flex items-center gap-2">
                {source.isPrimary && (
                  <Star size={14} className="text-[#f59e0b] fill-[#f59e0b]" />
                )}
                <span className="text-[14px] font-medium text-white">
                  {source.name || `Source ${index + 1}`}
                </span>
                {source.sourceType && (
                  <span className="text-[11px] px-2 py-0.5 bg-[#333] text-[#999] rounded-full">
                    {sourceTypes.find((t) => t.value === source.sourceType)?.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-[#777] hover:text-[#00ba7c]"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSource(index)
                  }}
                  className="p-2 text-[#777] hover:text-[#ff3040]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {editingIndex === index && (
              <div className="px-4 pb-4 space-y-4 border-t border-[#333]">
                {/* Primary toggle */}
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[13px] text-white">Primary Source</span>
                    <p className="text-[11px] text-[#555]">The main source for verification</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSource(index, { isPrimary: !source.isPrimary })}
                    className={`w-12 h-6 rounded-full transition-all ${
                      source.isPrimary ? 'bg-[#f59e0b]' : 'bg-[#333]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-all ${
                        source.isPrimary ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Source name */}
                <div>
                  <label className="text-[12px] text-[#777] mb-2 block">Source Name *</label>
                  <input
                    type="text"
                    value={source.name}
                    onChange={(e) => updateSource(index, { name: e.target.value })}
                    placeholder="e.g., NOAA, Reuters, World Bank API"
                    className="w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                  />
                </div>

                {/* Source URL */}
                <div>
                  <label className="text-[12px] text-[#777] mb-2 block">URL</label>
                  <input
                    type="url"
                    value={source.url || ''}
                    onChange={(e) => updateSource(index, { url: e.target.value })}
                    placeholder="https://..."
                    className={`w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 ${
                      source.url && !validateUrl(source.url)
                        ? 'ring-1 ring-[#ff3040]'
                        : 'focus:ring-[#ff3040]'
                    }`}
                  />
                  {source.url && !validateUrl(source.url) && (
                    <p className="text-[11px] text-[#ff3040] mt-1">Please enter a valid URL</p>
                  )}
                </div>

                {/* Source type */}
                <div>
                  <label className="text-[12px] text-[#777] mb-2 block">Source Type</label>
                  <div className="flex flex-wrap gap-2">
                    {sourceTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateSource(index, { sourceType: type.value })}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                          source.sourceType === type.value
                            ? 'bg-[#ff3040] text-white'
                            : 'bg-[#222] text-[#999] hover:bg-[#333]'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
