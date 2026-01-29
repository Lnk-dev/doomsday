/**
 * Admin Settings Page
 *
 * Security settings including 2FA management
 */

import { useState } from 'react'
import { Shield, ShieldOff, Key, AlertTriangle, Loader2, Check } from 'lucide-react'
import { useAdminAuthStore } from '../store/adminAuth'
import { TwoFactorSetup } from '../components/auth'
import { adminApi } from '../lib/adminApi'

export function AdminSettingsPage() {
  const { admin, updateAdmin } = useAdminAuthStore()
  const [showSetup, setShowSetup] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const twoFactorEnabled = admin?.twoFactorEnabled ?? false

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await adminApi.disable2FA({ password })

      if (admin) {
        updateAdmin({ ...admin, twoFactorEnabled: false })
      }

      setShowDisableConfirm(false)
      setPassword('')
      setSuccess('Two-factor authentication has been disabled')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle backup code regeneration
  const handleRegenerateBackupCodes = async () => {
    if (totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await adminApi.regenerateBackupCodes({ code: totpCode })
      setNewBackupCodes(response.backupCodes)
      setShowRegenerateConfirm(false)
      setTotpCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate backup codes')
    } finally {
      setIsLoading(false)
    }
  }

  // Show 2FA setup flow
  if (showSetup) {
    return (
      <div className="p-6">
        <TwoFactorSetup
          onComplete={() => setShowSetup(false)}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-[#777] mb-8">Manage your account security settings</p>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg mb-6">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">{success}</span>
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <section className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-500/20' : 'bg-[#333]'}`}>
              {twoFactorEnabled ? (
                <Shield className="w-6 h-6 text-green-400" />
              ) : (
                <ShieldOff className="w-6 h-6 text-[#777]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-[#777]">
                {twoFactorEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              twoFactorEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-[#333] text-[#777]'
            }`}
          >
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {!twoFactorEnabled ? (
          // Enable 2FA button
          <button
            onClick={() => setShowSetup(true)}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Enable Two-Factor Authentication
          </button>
        ) : (
          // 2FA management options
          <div className="space-y-4">
            {/* Regenerate backup codes */}
            <button
              onClick={() => setShowRegenerateConfirm(true)}
              className="w-full py-3 border border-[#333] text-[#ccc] font-medium rounded-lg hover:bg-[#222] transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" />
              Regenerate Backup Codes
            </button>

            {/* Disable 2FA */}
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="w-full py-3 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldOff className="w-5 h-5" />
              Disable Two-Factor Authentication
            </button>
          </div>
        )}
      </section>

      {/* Disable 2FA Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Disable 2FA</h3>
            </div>

            <p className="text-[#999] text-sm mb-4">
              Disabling two-factor authentication will make your account less secure.
              Enter your password to confirm.
            </p>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-white mb-4 focus:outline-none focus:border-red-500"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableConfirm(false)
                  setPassword('')
                  setError(null)
                }}
                className="flex-1 py-2 border border-[#333] text-[#ccc] rounded-lg hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                disabled={isLoading || !password}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  'Disable 2FA'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Key className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Regenerate Backup Codes
              </h3>
            </div>

            <p className="text-[#999] text-sm mb-4">
              This will invalidate all your existing backup codes. Enter your
              current authenticator code to confirm.
            </p>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, ''))
                setError(null)
              }}
              placeholder="000000"
              className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-white text-center text-2xl tracking-[0.5em] font-mono mb-4 focus:outline-none focus:border-yellow-500"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegenerateConfirm(false)
                  setTotpCode('')
                  setError(null)
                }}
                className="flex-1 py-2 border border-[#333] text-[#ccc] rounded-lg hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={isLoading || totpCode.length !== 6}
                className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  'Regenerate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Backup Codes Display */}
      {newBackupCodes.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                New Backup Codes Generated
              </h3>
            </div>

            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg mb-4">
              <p className="text-sm text-yellow-400">
                Save these codes in a secure location. Your old backup codes no
                longer work.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-[#222] rounded-lg font-mono text-sm mb-4">
              {newBackupCodes.map((code, i) => (
                <div key={i} className="text-green-400">
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={() => setNewBackupCodes([])}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              I've Saved My Codes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
