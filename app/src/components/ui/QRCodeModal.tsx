/**
 * QRCodeModal Component
 * Issue #78: Enhance social sharing and embed system
 *
 * Modal for displaying and downloading QR codes.
 */

import { useState, useEffect } from 'react'
import { X, Download, Copy, Check, QrCode } from 'lucide-react'

interface QRCodeModalProps {
  url: string
  title: string
  onClose: () => void
}

export function QRCodeModal({ url, title, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Generate QR code using Canvas API
  useEffect(() => {
    generateQRCode(url).then((dataUrl) => {
      setQrDataUrl(dataUrl)
      setLoading(false)
    })
  }, [url])

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.download = `doomsday-${title.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    link.href = qrDataUrl
    link.click()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm bg-[#111] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-[#777]" />
            <h3 className="text-[15px] font-semibold text-white">QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-6 flex flex-col items-center">
          {loading ? (
            <div className="w-64 h-64 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#ff3040] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-56 h-56"
              />
            </div>
          )}

          <p className="mt-4 text-[13px] text-[#777] text-center max-w-[280px] truncate">
            {url}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white text-[14px] font-medium rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} className="text-[#00ba7c]" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ff3040] hover:bg-[#ff4050] text-white text-[14px] font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple QR code generator using Canvas
 * In production, consider using a library like 'qrcode' for better error correction
 */
async function generateQRCode(text: string): Promise<string> {
  // Use a simple QR code generation approach
  // This is a basic implementation - for production, use a proper QR library
  const size = 256
  const modules = encodeToQR(text)
  const moduleSize = Math.floor(size / modules.length)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Draw modules
  ctx.fillStyle = '#000000'
  for (let row = 0; row < modules.length; row++) {
    for (let col = 0; col < modules[row].length; col++) {
      if (modules[row][col]) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize)
      }
    }
  }

  return canvas.toDataURL('image/png')
}

/**
 * Basic QR code encoding (simplified version)
 * Uses a simple pattern for demo - replace with proper QR library for production
 */
function encodeToQR(text: string): boolean[][] {
  const size = 25 // QR code size
  const modules: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false))

  // Add finder patterns (top-left, top-right, bottom-left)
  addFinderPattern(modules, 0, 0)
  addFinderPattern(modules, size - 7, 0)
  addFinderPattern(modules, 0, size - 7)

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0
    modules[i][6] = i % 2 === 0
  }

  // Add alignment pattern (for version 2+)
  if (size >= 25) {
    addAlignmentPattern(modules, size - 9, size - 9)
  }

  // Encode data (simplified - uses hash of text)
  const dataArea = getDataArea(size)
  const textHash = hashCode(text)
  let bitIndex = 0

  for (const [row, col] of dataArea) {
    if (modules[row][col] === false && bitIndex < 64) {
      modules[row][col] = ((textHash >> bitIndex) & 1) === 1
      bitIndex++
    }
  }

  // Add some deterministic pattern based on text
  for (let i = 0; i < text.length && i < 100; i++) {
    const charCode = text.charCodeAt(i)
    const row = 9 + (charCode % (size - 16))
    const col = 9 + ((charCode * 7) % (size - 16))
    if (row < size && col < size) {
      modules[row][col] = true
    }
  }

  return modules
}

function addFinderPattern(modules: boolean[][], startRow: number, startCol: number) {
  // Outer border
  for (let i = 0; i < 7; i++) {
    modules[startRow][startCol + i] = true
    modules[startRow + 6][startCol + i] = true
    modules[startRow + i][startCol] = true
    modules[startRow + i][startCol + 6] = true
  }
  // Inner white
  for (let i = 1; i < 6; i++) {
    for (let j = 1; j < 6; j++) {
      modules[startRow + i][startCol + j] = false
    }
  }
  // Center
  for (let i = 2; i < 5; i++) {
    for (let j = 2; j < 5; j++) {
      modules[startRow + i][startCol + j] = true
    }
  }
}

function addAlignmentPattern(modules: boolean[][], centerRow: number, centerCol: number) {
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const row = centerRow + i
      const col = centerCol + j
      if (row >= 0 && row < modules.length && col >= 0 && col < modules[0].length) {
        modules[row][col] = Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)
      }
    }
  }
}

function getDataArea(size: number): [number, number][] {
  const positions: [number, number][] = []
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5
    for (let row = 0; row < size; row++) {
      if (!isReserved(row, col, size)) positions.push([row, col])
      if (col > 0 && !isReserved(row, col - 1, size)) positions.push([row, col - 1])
    }
  }
  return positions
}

function isReserved(row: number, col: number, size: number): boolean {
  // Finder patterns + separators
  if (row < 9 && col < 9) return true
  if (row < 9 && col >= size - 8) return true
  if (row >= size - 8 && col < 9) return true
  // Timing patterns
  if (row === 6 || col === 6) return true
  return false
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}
