import { PageHeader } from '@/components/layout/PageHeader'
import { Plus } from 'lucide-react'

export function DoomScrollPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Doom Scroll"
        subtitle="The end is near"
        action={
          <button className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Placeholder posts */}
        {[1, 2, 3, 4, 5].map((i) => (
          <article
            key={i}
            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-neutral-700" />
              <div>
                <p className="font-medium text-neutral-200">Anonymous Doomer</p>
                <p className="text-xs text-neutral-500">2h ago</p>
              </div>
            </div>
            <p className="text-neutral-300 mb-3">
              The signs are everywhere. Economic indicators suggest collapse within 6 months.
              Have you noticed the pattern?
            </p>
            <div className="flex items-center gap-4 text-neutral-500 text-sm">
              <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                <span>🔥</span>
                <span>243</span>
              </button>
              <button className="flex items-center gap-1 hover:text-neutral-300 transition-colors">
                <span>💬</span>
                <span>42</span>
              </button>
              <button className="flex items-center gap-1 hover:text-neutral-300 transition-colors">
                <span>🔗</span>
                <span>Share</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
