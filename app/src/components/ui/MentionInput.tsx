/**
 * MentionInput Component
 * Issue #56: Add @mentions and user tagging
 *
 * Input component with @mention autocomplete support.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { MentionAutocomplete } from './MentionAutocomplete'
import { getPartialMentionAtCursor, replaceMentionAtPosition } from '@/lib/mentions'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  maxLength,
  className = '',
  autoFocus = false,
  onKeyDown,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [autocomplete, setAutocomplete] = useState<{
    isOpen: boolean
    query: string
    position: { top: number; left: number }
    mentionStart: number
  }>({
    isOpen: false,
    query: '',
    position: { top: 0, left: 0 },
    mentionStart: 0,
  })

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  // Detect @ trigger and open autocomplete
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value
      onChange(newValue)

      const textarea = textareaRef.current
      if (!textarea) return

      const cursorPos = textarea.selectionStart
      const partialMention = getPartialMentionAtCursor(newValue, cursorPos)

      if (partialMention) {
        // Calculate dropdown position
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
        const textBeforeCursor = newValue.slice(0, cursorPos)
        const lines = textBeforeCursor.split('\n').length

        setAutocomplete({
          isOpen: true,
          query: partialMention.query,
          position: {
            top: Math.min(lines * lineHeight + 8, 120),
            left: 0,
          },
          mentionStart: partialMention.start,
        })
      } else {
        setAutocomplete((prev) => ({ ...prev, isOpen: false }))
      }
    },
    [onChange, maxLength]
  )

  // Handle mention selection
  const handleSelectMention = useCallback(
    (username: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const cursorPos = textarea.selectionStart
      const { newContent, newCursorPosition } = replaceMentionAtPosition(
        value,
        autocomplete.mentionStart,
        cursorPos,
        username
      )

      onChange(newContent)

      // Close autocomplete
      setAutocomplete((prev) => ({ ...prev, isOpen: false }))

      // Focus textarea and set cursor position
      setTimeout(() => {
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      }, 0)
    },
    [autocomplete.mentionStart, value, onChange]
  )

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Let autocomplete handle these keys when open
      if (autocomplete.isOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
          // Don't call the parent onKeyDown for these
          return
        }
      }

      // Pass through to parent handler
      onKeyDown?.(e)
    },
    [autocomplete.isOpen, onKeyDown]
  )

  // Close autocomplete on blur (with delay for click handling)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setAutocomplete((prev) => ({ ...prev, isOpen: false }))
    }, 200)
  }, [])

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        rows={1}
      />

      <MentionAutocomplete
        query={autocomplete.query}
        position={autocomplete.position}
        onSelect={handleSelectMention}
        onClose={() => setAutocomplete((prev) => ({ ...prev, isOpen: false }))}
        isOpen={autocomplete.isOpen}
      />
    </div>
  )
}
