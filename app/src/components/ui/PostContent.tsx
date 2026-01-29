/**
 * PostContent Component
 *
 * Renders post content with clickable hashtags and mentions highlighted.
 * Parses content and renders interactive links for both.
 */

import { useMemo } from 'react'
import { HashtagLink } from './HashtagLink'
import { Mention } from './Mention'
import { parseContentWithHashtags } from '@/lib/hashtag'
import { MENTION_REGEX } from '@/lib/mentions'
import type { PostVariant } from '@/types'

interface PostContentProps {
  content: string
  variant?: PostVariant | 'default'
  onClick?: () => void
}

type ContentSegment = {
  type: 'text' | 'hashtag' | 'mention'
  value: string
}

/**
 * Parse content for both hashtags and mentions
 */
function parseContent(content: string): ContentSegment[] {
  // First parse hashtags
  const hashtagSegments = parseContentWithHashtags(content)

  // Then parse each text segment for mentions
  const result: ContentSegment[] = []

  for (const segment of hashtagSegments) {
    if (segment.type === 'hashtag') {
      result.push(segment)
    } else {
      // Parse text for mentions
      const text = segment.value
      const parts: ContentSegment[] = []
      let lastIndex = 0

      const regex = new RegExp(MENTION_REGEX.source, 'g')
      let match

      while ((match = regex.exec(text)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
        }

        // Add mention
        parts.push({ type: 'mention', value: match[1] })

        lastIndex = match.index + match[0].length
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) })
      }

      if (parts.length === 0) {
        result.push(segment)
      } else {
        result.push(...parts)
      }
    }
  }

  return result
}

export function PostContent({ content, variant = 'default', onClick }: PostContentProps) {
  const segments = useMemo(() => parseContent(content), [content])

  const mentionVariant = variant === 'doom' ? 'doom' : variant === 'life' ? 'life' : 'default'

  return (
    <p
      onClick={onClick}
      className={`text-[15px] text-[var(--color-text-primary)] mt-0.5 whitespace-pre-wrap break-words ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {segments.map((segment, index) =>
        segment.type === 'hashtag' ? (
          <HashtagLink key={index} tag={segment.value} variant={variant} />
        ) : segment.type === 'mention' ? (
          <Mention key={index} username={segment.value} variant={mentionVariant} />
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </p>
  )
}
