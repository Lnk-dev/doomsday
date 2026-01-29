/**
 * EmailVerificationPage
 *
 * Handles email verification when users click the link from their email.
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token'

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      setMessage('No verification token provided')
      return
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const response = await fetch(`${apiUrl}/api/email/verify?token=${encodeURIComponent(token)}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to verify email')
        }
      } catch {
        setStatus('error')
        setMessage('Network error. Please try again.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a1a1a] rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-[#ff3040] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">Verifying your email...</h1>
            <p className="text-[#777]">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">Email Verified!</h1>
            <p className="text-[#777] mb-6">{message}</p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-[#ff3040] text-white rounded-lg font-medium hover:bg-[#ff3040]/90 transition-colors"
            >
              Go to Profile
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">Verification Failed</h1>
            <p className="text-[#777] mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/settings')}
                className="w-full px-6 py-3 bg-[#ff3040] text-white rounded-lg font-medium hover:bg-[#ff3040]/90 transition-colors"
              >
                Go to Settings
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {status === 'no-token' && (
          <>
            <Mail className="w-16 h-16 text-[#777] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">No Token Provided</h1>
            <p className="text-[#777] mb-6">
              This page is used to verify your email address. Please use the link sent to your email.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  )
}
