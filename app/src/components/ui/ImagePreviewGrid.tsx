/**
 * ImagePreviewGrid Component
 * Issue #53: Add image/media attachments to posts
 *
 * Displays image previews during composition with remove buttons.
 */

import { useMemo, useEffect } from 'react'
import { X } from 'lucide-react'

interface ImagePreviewGridProps {
  /** Image files to preview */
  images: File[]
  /** Callback when an image is removed */
  onRemove: (index: number) => void
}

export function ImagePreviewGrid({ images, onRemove }: ImagePreviewGridProps) {
  // Create object URLs for previews
  const previews = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file))
  }, [images])

  // Cleanup URLs on unmount or when images change
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  if (images.length === 0) return null

  // Determine grid layout based on image count
  const getGridClasses = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-2'
      case 4:
        return 'grid-cols-2'
      default:
        return 'grid-cols-2'
    }
  }

  // Get aspect ratio based on layout
  const getAspectRatio = (index: number) => {
    if (images.length === 1) return 'aspect-video'
    if (images.length === 3 && index === 0) return 'row-span-2 aspect-[9/16]'
    return 'aspect-square'
  }

  return (
    <div
      className={`grid ${getGridClasses()} gap-2 mt-3 rounded-xl overflow-hidden`}
    >
      {previews.map((url, index) => (
        <div key={index} className={`relative ${getAspectRatio(index)}`}>
          <img
            src={url}
            alt={`Attachment ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black transition-colors"
            aria-label={`Remove image ${index + 1}`}
          >
            <X size={16} className="text-white" />
          </button>
          {/* File name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-[10px] text-white/80 truncate">
              {images[index].name}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
