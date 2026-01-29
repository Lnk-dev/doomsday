/**
 * HashtagLink Component
 *
 * Clickable hashtag that navigates to hashtag search/filter page.
 * Styled based on post variant (doom/life/default).
 */

import { useNavigate } from 'react-router-dom'
import type { PostVariant } from '@/types'

interface HashtagLinkProps {
  tag: string
  variant?: PostVariant | 'default'
}

export function HashtagLink({ tag, variant = 'default' }: HashtagLinkProps) {
  const navigate = useNavigate()

  const colorClass =
    variant === 'doom'
      ? 'text-[#ff3040] hover:text-[#ff5060]'
      : variant === 'life'
      ? 'text-[#00ba7c] hover:text-[#00da9c]'
      : 'text-blue-400 hover:text-blue-300'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering post click
    const normalized = tag.replace(/^#/, '').toLowerCase()
    navigate(`/hashtag/${normalized}`)
  }

  return (
    <span
      onClick={handleClick}
      className={`${colorClass} cursor-pointer font-medium transition-colors`}
    >
      {tag.startsWith('#') ? tag : `#${tag}`}
    </span>
  )
}
