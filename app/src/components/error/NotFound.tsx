/**
 * NotFound Component - 404 page for missing routes/resources
 */

import { Skull, SearchX, Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

type Resource = 'page' | 'post' | 'user' | 'event' | 'custom'

interface Props {
  resource?: Resource
  title?: string
  description?: string
  icon?: ReactNode
  showBack?: boolean
  showHome?: boolean
  className?: string
  fullPage?: boolean
}

const config: Record<Resource, { icon: ReactNode; title: string; description: string }> = {
  page: { icon: <Skull size={32} />, title: 'Page not found', description: "The doomsday event you're looking for doesn't exist... yet." },
  post: { icon: <SearchX size={32} />, title: 'Post not found', description: 'This post may have been deleted or never existed.' },
  user: { icon: <SearchX size={32} />, title: 'User not found', description: 'This user may have left the platform or never existed.' },
  event: { icon: <Skull size={32} />, title: 'Event not found', description: 'This doomsday event may have passed or been cancelled.' },
  custom: { icon: <SearchX size={32} />, title: 'Not found', description: 'The resource you are looking for could not be found.' },
}

export function NotFound({ resource = 'page', title, description, icon, showBack = true, showHome = true, className = '', fullPage = true }: Props) {
  const navigate = useNavigate()
  const c = config[resource]

  return (
    <div className={`flex flex-col items-center justify-center px-8 ${fullPage ? 'min-h-[60vh] py-16' : 'py-12'} ${className}`} role="alert" aria-live="polite">
      <div className="w-20 h-20 rounded-full bg-[var(--color-warning-bg,#ffad1f15)] flex items-center justify-center mb-5">
        <span className="text-[var(--color-warning,#ffad1f)]">{icon ?? c.icon}</span>
      </div>
      <div className="px-3 py-1 rounded-full bg-[var(--color-bg-tertiary,#1a1a1a)] border border-[var(--color-border,#333)] mb-4">
        <span className="text-[12px] font-mono text-[var(--color-text-muted,#555)]">404</span>
      </div>
      <h1 className="text-[24px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2 text-center">{title ?? c.title}</h1>
      <p className="text-[14px] text-[var(--color-text-secondary,#777)] text-center max-w-md mb-8">{description ?? c.description}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {showBack && <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-semibold border border-[var(--color-border,#333)] hover:bg-[var(--color-bg-secondary,#111)] flex items-center gap-2"><ArrowLeft size={16} />Go back</button>}
        {showHome && <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 flex items-center gap-2"><Home size={16} />Go home</button>}
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return <div className="flex flex-col min-h-full"><NotFound fullPage /></div>
}
