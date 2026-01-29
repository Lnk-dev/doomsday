/**
 * Media Helper Functions
 * Issue #53: Add image/media attachments to posts
 *
 * Utilities for handling image files and conversions.
 */

import type { MediaAttachment, ID } from '@/types'

/** Accepted image MIME types */
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

/** Maximum file size in bytes (5MB) */
export const MAX_SIZE_BYTES = 5 * 1024 * 1024

/** Maximum number of images per post */
export const MAX_IMAGES = 4

/** Minimum image dimensions */
export const MIN_DIMENSIONS = 100

/** Maximum image dimensions */
export const MAX_DIMENSIONS = 4096

/**
 * Generate a unique ID
 */
export function generateMediaId(): ID {
  return `media-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Validate a file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Accepted: JPEG, PNG, GIF, WebP`,
    }
  }

  // Check size
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_SIZE_BYTES / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Convert a File to base64 data URI
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions from a File
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Determine media type from MIME type
 */
export function getMediaType(mimeType: string): MediaAttachment['type'] {
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType.startsWith('video/')) return 'video'
  return 'image'
}

/**
 * Convert a File to a MediaAttachment
 */
export async function fileToMediaAttachment(
  file: File
): Promise<MediaAttachment> {
  const [base64, dimensions] = await Promise.all([
    fileToBase64(file),
    getImageDimensions(file),
  ])

  return {
    id: generateMediaId(),
    type: getMediaType(file.type),
    url: base64,
    filename: file.name,
    size: file.size,
    width: dimensions.width,
    height: dimensions.height,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
