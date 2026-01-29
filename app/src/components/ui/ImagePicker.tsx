/**
 * ImagePicker Component
 * Issue #53: Add image/media attachments to posts
 *
 * Handles image selection with validation.
 */

import { useRef, useCallback } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { ACCEPTED_TYPES, MAX_IMAGES, validateFile } from '@/lib/media'
import { toast } from '@/store'

interface ImagePickerProps {
  /** Currently selected image files */
  images: File[]
  /** Callback when images change */
  onImagesChange: (images: File[]) => void
  /** Maximum number of images allowed */
  maxImages?: number
  /** Whether the picker is disabled */
  disabled?: boolean
}

export function ImagePicker({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
  disabled = false,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const validFiles: File[] = []
      const errors: string[] = []

      for (const file of files) {
        const validation = validateFile(file)
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`)
          continue
        }
        validFiles.push(file)
      }

      // Enforce max images
      const availableSlots = maxImages - images.length
      const filesToAdd = validFiles.slice(0, availableSlots)

      if (errors.length > 0) {
        toast.error(errors[0])
      }

      if (validFiles.length > availableSlots) {
        toast.warning(`Maximum ${maxImages} images allowed`)
      }

      if (filesToAdd.length > 0) {
        onImagesChange([...images, ...filesToAdd])
      }

      // Reset input to allow selecting same file again
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [images, maxImages, onImagesChange]
  )

  const canAddMore = images.length < maxImages

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || !canAddMore}
        aria-label="Select images to attach"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || !canAddMore}
        className={`text-[#777] hover:text-white transition-colors ${
          disabled || !canAddMore ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={canAddMore ? 'Add images' : `Maximum ${maxImages} images`}
        aria-label={canAddMore ? 'Add images' : `Maximum ${maxImages} images reached`}
      >
        <ImageIcon size={22} />
      </button>
    </>
  )
}
