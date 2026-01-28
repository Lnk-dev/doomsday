/**
 * BadgeIcon Component
 * Displays a badge with appropriate icon and rarity styling
 */

import {
  Pen, FileText, BookOpen, Heart, Sun,
  ThumbsUp, Star, Award, Flame, Zap, Crown,
  Dice1 as Dice, TrendingUp, Trophy, Gem,
  Sparkles, CheckCircle, Skull, Eye, HelpCircle
} from 'lucide-react'
import type { Badge, BadgeRarity } from '@/store/badges'
import { getRarityColor, getRarityBgColor } from '@/store/badges'

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  pen: Pen,
  'file-text': FileText,
  'book-open': BookOpen,
  heart: Heart,
  sun: Sun,
  'thumbs-up': ThumbsUp,
  star: Star,
  award: Award,
  flame: Flame,
  zap: Zap,
  crown: Crown,
  dice: Dice,
  'trending-up': TrendingUp,
  trophy: Trophy,
  gem: Gem,
  sparkles: Sparkles,
  'check-circle': CheckCircle,
  skull: Skull,
  eye: Eye,
}

interface BadgeIconProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  locked?: boolean
  showTooltip?: boolean
}

const sizes = {
  sm: { container: 'w-8 h-8', icon: 14 },
  md: { container: 'w-12 h-12', icon: 20 },
  lg: { container: 'w-16 h-16', icon: 28 },
}

export function BadgeIcon({ badge, size = 'md', locked = false, showTooltip = true }: BadgeIconProps) {
  const Icon = iconMap[badge.icon] || HelpCircle
  const sizeConfig = sizes[size]
  const color = getRarityColor(badge.rarity)
  const bgColor = getRarityBgColor(badge.rarity)

  return (
    <div className="relative group">
      <div
        className={`${sizeConfig.container} rounded-full flex items-center justify-center transition-all ${
          locked ? 'opacity-30 grayscale' : 'hover:scale-110'
        }`}
        style={{ backgroundColor: locked ? '#333' : bgColor }}
      >
        <span style={{ color: locked ? '#666' : color }}>
          <Icon size={sizeConfig.icon} />
        </span>
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          <p className="text-[13px] font-semibold text-white">{badge.name}</p>
          <p className="text-[11px] text-[#777]">{badge.description}</p>
          <p className="text-[10px] mt-1 capitalize" style={{ color }}>{badge.rarity}</p>
        </div>
      )}
    </div>
  )
}

interface RarityBadgeProps {
  rarity: BadgeRarity
}

export function RarityBadge({ rarity }: RarityBadgeProps) {
  const color = getRarityColor(rarity)
  const bgColor = getRarityBgColor(rarity)

  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ color, backgroundColor: bgColor }}
    >
      {rarity}
    </span>
  )
}
