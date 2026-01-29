/**
 * Two-Factor Authentication Verification Component
 *
 * Used during login when 2FA is required
 */

import { useState, useEffect, useRef } from 'react'
import { Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuth'

interface TwoFactorVerifyProps {
  onCancel: () => void
}

export function TwoFactorVerify({ onCancel }: TwoFactorVerifyProps) {
  const { verify2FA, isLoading, error, clearError } = useAdminAuthStore()
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [useBackupCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const codeToVerify = useBackupCode ? code.replace(/-/g, '').toUpperCase() : code

    if (!useBackupCode && codeToVerify.length !== 6) {
      return
    }

    await verify2FA(codeToVerify)
  }

  const handleCodeChange = (value: string) => {
    clearError()
    if (useBackupCode) {
      // Allow alphanumeric for backup codes
      setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9))
    } else {
      // Only digits for TOTP
      setCode(value.replace(/\D/g, '').slice(0, 6))
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-green-500/20 rounded-full mb-4">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Two-Factor Authentication
        </h1>
        <p className="text-[#777]">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the code from your authenticator app'}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            pattern={useBackupCode ? '[A-Za-z0-9-]*' : '[0-9]*'}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            className={`w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-white text-center font-mono focus:outline-none focus:border-green-500 ${
              useBackupCode ? 'text-lg tracking-wider' : 'text-2xl tracking-[0.5em]'
            }`}
            autoComplete="one-time-code"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || (!useBackupCode && code.length !== 6)}
          className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>
      </form>

      {/* Toggle backup code mode */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setUseBackupCode(!useBackupCode)
            setCode('')
            clearError()
          }}
          className="text-sm text-[#777] hover:text-white transition-colors"
        >
          {useBackupCode
            ? 'Use authenticator app instead'
            : "Can't access your authenticator? Use a backup code"}
        </button>
      </div>

      {/* Back to login */}
      <div className="mt-6 pt-4 border-t border-[#333]">
        <button
          onClick={onCancel}
          className="w-full py-2 text-[#777] hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>
    </div>
  )
}
