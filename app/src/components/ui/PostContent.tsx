/**
 * PostContent Component
 *
 * Renders post content with clickable hashtags highlighted.
 * Parses content and renders hashtags as interactive links.
 */

import { useMemo } from 'react'
import { HashtagLink } from './HashtagLink'
import { parseContentWithHashtags } from '@/lib/hashtag'
import type { PostVariant } from '@/types'

interface PostContentProps {
  content: string
  variant?: PostVariant | 'default'
  onClick?: () => void
}

export function PostContent({ content, variant = 'default', onClick }: PostContentProps) {
  const segments = useMemo(() => parseContentWithHashtags(content), [content])

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
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </p>
  )
}
