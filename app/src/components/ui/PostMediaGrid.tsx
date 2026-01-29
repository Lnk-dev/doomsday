/**
 * PostMediaGrid Component
 * Issue #53: Add image/media attachments to posts
 *
 * Displays post media in a Twitter/Threads-style grid layout.
 */

import type { MediaAttachment } from '@/types'

interface PostMediaGridProps {
  /** Media attachments to display */
  media: MediaAttachment[]
  /** Callback when an image is clicked */
  onImageClick?: (index: number) => void
}

export function PostMediaGrid({ media, onImageClick }: PostMediaGridProps) {
  if (!media || media.length === 0) return null

  // Determine grid layout based on image count
  const getGridClasses = () => {
    switch (media.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
      case 4:
        return 'grid-cols-2 grid-rows-2'
      default:
        return 'grid-cols-2'
    }
  }

  // Get image style based on layout
  const getImageStyle = (index: number) => {
    if (media.length === 1) {
      return 'aspect-video max-h-[300px]'
    }
    if (media.length === 3 && index === 0) {
      return 'row-span-2 aspect-[9/16] max-h-[300px]'
    }
    return 'aspect-square'
  }

  return (
    <div
      className={`grid ${getGridClasses()} gap-0.5 mt-3 rounded-xl overflow-hidden border border-[#333]`}
    >
      {media.slice(0, 4).map((item, index) => (
        <button
          key={item.id}
          onClick={(e) => {
            e.stopPropagation()
            onImageClick?.(index)
          }}
          className={`relative overflow-hidden ${getImageStyle(index)} focus:outline-none focus:ring-2 focus:ring-[#1d9bf0] focus:ring-inset`}
          type="button"
          aria-label={item.alt || `View image ${index + 1}`}
        >
          <img
            src={item.url}
            alt={item.alt || `Image ${index + 1}`}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            loading="lazy"
          />
          {/* Show count badge for more than 4 images */}
          {media.length > 4 && index === 3 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                +{media.length - 4}
              </span>
            </div>
          )}
          {/* GIF badge */}
          {item.type === 'gif' && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-semibold text-white">
              GIF
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
