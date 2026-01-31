/**
 * ResolutionCriteriaBuilder
 *
 * Component for building resolution criteria for prediction events.
 * Allows adding multiple conditions (1-5) with threshold, occurrence, or geographic types.
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import type { ResolutionCriterion, ConditionType, ThresholdOperator } from '@/types'

interface ResolutionCriteriaBuilderProps {
  criteria: ResolutionCriterion[]
  onChange: (criteria: ResolutionCriterion[]) => void
  maxCriteria?: number
}

const conditionTypes: { value: ConditionType; label: string; description: string }[] = [
  { value: 'threshold', label: 'Threshold', description: 'A measurable value crosses a specific threshold' },
  { value: 'occurrence', label: 'Occurrence', description: 'A specific event or action takes place' },
  { value: 'geographic', label: 'Geographic', description: 'Something happens in a specific location' },
]

const operators: { value: ThresholdOperator; label: string }[] = [
  { value: 'gte', label: '>= (greater than or equal)' },
  { value: 'lte', label: '<= (less than or equal)' },
  { value: 'eq', label: '= (equal to)' },
  { value: 'between', label: 'between' },
]

const defaultCriterion: ResolutionCriterion = {
  conditionType: 'occurrence',
  description: '',
}

export function ResolutionCriteriaBuilder({
  criteria,
  onChange,
  maxCriteria = 5,
}: ResolutionCriteriaBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const addCriterion = useCallback(() => {
    if (criteria.length >= maxCriteria) return
    const newCriteria = [...criteria, { ...defaultCriterion }]
    onChange(newCriteria)
    setExpandedIndex(newCriteria.length - 1)
  }, [criteria, maxCriteria, onChange])

  const removeCriterion = useCallback((index: number) => {
    const newCriteria = criteria.filter((_, i) => i !== index)
    onChange(newCriteria)
    if (expandedIndex === index) {
      setExpandedIndex(newCriteria.length > 0 ? 0 : null)
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1)
    }
  }, [criteria, expandedIndex, onChange])

  const updateCriterion = useCallback((index: number, updates: Partial<ResolutionCriterion>) => {
    const newCriteria = criteria.map((c, i) => (i === index ? { ...c, ...updates } : c))
    onChange(newCriteria)
  }, [criteria, onChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[13px] text-[#777]">
          Resolution Criteria ({criteria.length}/{maxCriteria})
        </label>
        {criteria.length < maxCriteria && (
          <button
            type="button"
            onClick={addCriterion}
            className="flex items-center gap-1 text-[13px] text-[#ff3040] hover:text-[#ff5060]"
          >
            <Plus size={14} />
            Add Criterion
          </button>
        )}
      </div>

      {criteria.length === 0 && (
        <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333] text-center">
          <AlertCircle size={24} className="mx-auto text-[#555] mb-2" />
          <p className="text-[14px] text-[#777]">No criteria added yet.</p>
          <p className="text-[12px] text-[#555] mt-1">Add at least one criterion to define how this event will be resolved.</p>
          <button
            type="button"
            onClick={addCriterion}
            className="mt-3 px-4 py-2 bg-[#ff3040] text-white text-[13px] rounded-lg hover:bg-[#ff4050]"
          >
            Add First Criterion
          </button>
        </div>
      )}

      <div className="space-y-3">
        {criteria.map((criterion, index) => (
          <div
            key={index}
            className={`bg-[#1a1a1a] rounded-lg border ${
              expandedIndex === index ? 'border-[#ff3040]' : 'border-[#333]'
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div>
                <span className="text-[14px] font-medium text-white">
                  Criterion {index + 1}
                </span>
                <span className="ml-2 text-[12px] text-[#777]">
                  ({conditionTypes.find((t) => t.value === criterion.conditionType)?.label})
                </span>
                {criterion.description && (
                  <p className="text-[12px] text-[#555] mt-1 line-clamp-1">
                    {criterion.description}
                  </p>
                )}
              </div>
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCriterion(index)
                  }}
                  className="p-2 text-[#777] hover:text-[#ff3040]"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </button>

            {expandedIndex === index && (
              <div className="px-4 pb-4 space-y-4 border-t border-[#333]">
                {/* Condition Type */}
                <div className="pt-4">
                  <label className="text-[12px] text-[#777] mb-2 block">Condition Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {conditionTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateCriterion(index, { conditionType: type.value })}
                        className={`p-3 rounded-lg text-left transition-all ${
                          criterion.conditionType === type.value
                            ? 'bg-[#ff3040] text-white'
                            : 'bg-[#222] text-[#999] hover:bg-[#333]'
                        }`}
                      >
                        <span className="text-[13px] font-medium block">{type.label}</span>
                        <span className="text-[10px] opacity-70">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[12px] text-[#777] mb-2 block">Description *</label>
                  <textarea
                    value={criterion.description}
                    onChange={(e) => updateCriterion(index, { description: e.target.value })}
                    placeholder="Describe the specific condition that must be met..."
                    rows={2}
                    className="w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040] resize-none"
                  />
                  <div className="text-[11px] text-[#555] mt-1 text-right">
                    {criterion.description.length}/500
                  </div>
                </div>

                {/* Threshold-specific fields */}
                {criterion.conditionType === 'threshold' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[12px] text-[#777] mb-2 block">Metric</label>
                        <input
                          type="text"
                          value={criterion.metric || ''}
                          onChange={(e) => updateCriterion(index, { metric: e.target.value })}
                          placeholder="e.g., temperature, price, deaths"
                          className="w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] text-[#777] mb-2 block">Unit</label>
                        <input
                          type="text"
                          value={criterion.unit || ''}
                          onChange={(e) => updateCriterion(index, { unit: e.target.value })}
                          placeholder="e.g., celsius, USD, people"
                          className="w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[12px] text-[#777] mb-2 block">Operator</label>
                        <select
                          value={criterion.operator || 'gte'}
                          onChange={(e) => updateCriterion(index, { operator: e.target.value as ThresholdOperator })}
                          className="w-full bg-[#222] text-[14px] text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[12px] text-[#777] mb-2 block">Threshold Value</label>
                        <input
                          type="number"
                          value={criterion.thresholdValue || ''}
                          onChange={(e) => updateCriterion(index, { thresholdValue: parseFloat(e.target.value) || undefined })}
                          placeholder="e.g., 100, 1.5"
                          className="w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Geographic-specific fields */}
                {criterion.conditionType === 'geographic' && (
                  <div>
                    <label className="text-[12px] text-[#777] mb-2 block">Geographic Scope</label>
                    <input
                      type="text"
                      value={criterion.geographicScope || ''}
                      onChange={(e) => updateCriterion(index, { geographicScope: e.target.value })}
                      placeholder="e.g., global, USA, California, Tokyo"
                      className="w-full bg-[#222] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
