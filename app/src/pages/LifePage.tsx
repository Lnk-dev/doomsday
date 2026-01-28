import { PageHeader } from '@/components/layout/PageHeader'
import { Plus, Heart } from 'lucide-react'

export function LifePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Life"
        subtitle="Choose to live"
        action={
          <button className="p-2 rounded-full bg-green-600 hover:bg-green-700 transition-colors">
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Life cost indicator */}
        <div className="p-3 rounded-lg bg-green-950/50 border border-green-900 text-sm">
          <p className="text-green-400">
            <Heart size={14} className="inline mr-1" />
            Your next post costs <span className="font-bold">5 $DOOM</span>
          </p>
        </div>

        {/* Placeholder life posts */}
        {[1, 2, 3].map((i) => (
          <article
            key={i}
            className="p-4 rounded-xl bg-neutral-900 border border-green-900/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-800" />
              <div className="flex-1">
                <p className="font-medium text-neutral-200">Life Liver #{i}</p>
                <p className="text-xs text-green-500">Day 47 of living</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Life Score</p>
                <p className="font-bold text-green-400">2,847</p>
              </div>
            </div>
            <p className="text-neutral-300 mb-3">
              Today I planted a garden. Small acts of creation against the void.
              Every seed is a bet on tomorrow.
            </p>
            <div className="flex items-center gap-4 text-neutral-500 text-sm">
              <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                <span>💚</span>
                <span>128</span>
              </button>
              <button className="flex items-center gap-1 hover:text-neutral-300 transition-colors">
                <span>🎁</span>
                <span>Donate Life</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
