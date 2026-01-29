/**
 * Mention Component
 * Issue #56: Add @mentions and user tagging
 *
 * Clickable mention component that links to user profiles.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MENTION_REGEX } from '@/lib/mentions'

interface MentionProps {
  username: string
  variant?: 'doom' | 'life' | 'default'
}

/**
 * Clickable mention component that links to user profile
 */
export function Mention({ username, variant = 'default' }: MentionProps) {
  const navigate = useNavigate()

  const colorClass =
    variant === 'doom'
      ? 'text-[#ff6070] hover:text-[#ff3040]'
      : variant === 'life'
        ? 'text-[#4dd9a5] hover:text-[#00ba7c]'
        : 'text-[#1d9bf0] hover:text-[#1a8cd8]'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/timeline/${username}`)
  }

  return (
    <span
      onClick={handleClick}
      className={`${colorClass} cursor-pointer font-medium transition-colors`}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/timeline/${username}`)
        }
      }}
    >
      @{username}
    </span>
  )
}

interface MentionTextProps {
  content: string
  variant?: 'doom' | 'life' | 'default'
}

/**
 * Parse content and render mentions as clickable components
 */
export function MentionText({ content, variant = 'default' }: MentionTextProps) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Create a new regex instance for each call
  const regex = new RegExp(MENTION_REGEX.source, 'g')
  let match

  while ((match = regex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    // Add mention component
    parts.push(
      <Mention key={`${match[1]}-${match.index}`} username={match[1]} variant={variant} />
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <>{parts}</>
}
