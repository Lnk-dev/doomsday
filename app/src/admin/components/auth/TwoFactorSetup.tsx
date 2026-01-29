/**
 * Two-Factor Authentication Setup Component
 *
 * Guides admin users through 2FA setup process with QR code and backup codes
 */

import { useState } from 'react'
import { Shield, Key, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import { useAdminAuthStore } from '../../store/adminAuth'

interface TwoFactorSetupProps {
  onComplete: () => void
  onCancel: () => void
}

type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete'

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { admin, updateAdmin } = useAdminAuthStore()
  const [step, setStep] = useState<SetupStep>('intro')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedBackup, setCopiedBackup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start 2FA setup - get secret and QR code
  const handleStartSetup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await adminApi.setup2FA()
      setSecret(response.secret)
      setQrCode(response.qrCode)
      setStep('scan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start 2FA setup')
    } finally {
      setIsLoading(false)
    }
  }

  // Verify the TOTP code
  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await adminApi.verifySetup2FA({
        code: verificationCode,
        secret,
      })

      setBackupCodes(response.backupCodes)

      // Update admin state to reflect 2FA enabled
      if (admin) {
        updateAdmin({ ...admin, twoFactorEnabled: true })
      }

      setStep('backup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy backup codes to clipboard
  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCopiedBackup(true)
      setTimeout(() => setCopiedBackup(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Shield className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-[#777]">
            Add an extra layer of security
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Step: Intro */}
      {step === 'intro' && (
        <div className="space-y-4">
          <p className="text-[#ccc] text-sm">
            Two-factor authentication adds an extra layer of security to your
            admin account. You'll need to enter a code from your authenticator
            app each time you log in.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#999]">
              <Key className="w-4 h-4" />
              <span>Works with Google Authenticator, Authy, 1Password, etc.</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-[#ccc] border border-[#333] rounded-lg hover:bg-[#222] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartSetup}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Set Up 2FA'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Scan QR Code */}
      {step === 'scan' && (
        <div className="space-y-4">
          <p className="text-[#ccc] text-sm">
            Scan this QR code with your authenticator app:
          </p>
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
          <div className="p-3 bg-[#222] rounded-lg">
            <p className="text-xs text-[#777] mb-1">
              Or enter this code manually:
            </p>
            <code className="text-sm text-green-400 font-mono break-all">
              {secret}
            </code>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setStep('intro')
                setSecret('')
                setQrCode('')
              }}
              className="flex-1 px-4 py-2 text-[#ccc] border border-[#333] rounded-lg hover:bg-[#222] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('verify')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Verify Code */}
      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-[#ccc] text-sm">
            Enter the 6-digit code from your authenticator app to verify setup:
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setVerificationCode(value)
              setError(null)
            }}
            placeholder="000000"
            className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-green-500"
            autoFocus
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setStep('scan')
                setVerificationCode('')
                setError(null)
              }}
              className="flex-1 px-4 py-2 text-[#ccc] border border-[#333] rounded-lg hover:bg-[#222] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Backup Codes */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400">
              Save these backup codes in a secure location. You can use them to
              access your account if you lose your authenticator.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 bg-[#222] rounded-lg font-mono text-sm">
            {backupCodes.map((code, i) => (
              <div key={i} className="text-green-400">
                {code}
              </div>
            ))}
          </div>
          <button
            onClick={handleCopyBackupCodes}
            className="w-full px-4 py-2 border border-[#333] rounded-lg hover:bg-[#222] transition-colors flex items-center justify-center gap-2 text-[#ccc]"
          >
            {copiedBackup ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Backup Codes
              </>
            )}
          </button>
          <button
            onClick={() => setStep('complete')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            I've Saved My Codes
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-green-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              2FA Enabled Successfully
            </h3>
            <p className="text-sm text-[#777]">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
          <button
            onClick={onComplete}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
