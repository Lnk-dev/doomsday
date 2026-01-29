/**
 * ImageLightbox Component
 * Issue #53: Add image/media attachments to posts
 *
 * Full-screen modal for viewing images with navigation.
 */

import { useEffect, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { MediaAttachment } from '@/types'

interface ImageLightboxProps {
  /** Media attachments to display */
  media: MediaAttachment[]
  /** Initial image index */
  initialIndex?: number
  /** Whether the lightbox is open */
  isOpen: boolean
  /** Callback when the lightbox is closed */
  onClose: () => void
}

export function ImageLightbox({
  media,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset index when initialIndex changes (opening with different image)
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : media.length - 1))
  }, [media.length])

  // Navigate to next image
  const goToNext = useCallback(() => {
    setCurrentIndex((i) => (i < media.length - 1 ? i + 1 : 0))
  }, [media.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || media.length === 0) return null

  const currentMedia = media[currentIndex]
  const hasMultiple = media.length > 1

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
        aria-label="Close lightbox"
      >
        <X size={28} />
      </button>

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          {currentIndex + 1} / {media.length}
        </div>
      )}

      {/* Previous button */}
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Main image */}
      <img
        src={currentMedia.url}
        alt={currentMedia.alt || `Image ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next image"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="absolute bottom-4 flex gap-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-50 hover:opacity-75'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
