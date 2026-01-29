/**
 * Admin Login Page
 *
 * Authentication page for admin dashboard access
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Shield } from 'lucide-react'
import { useAdminAuthStore } from '../store/adminAuth'

export function AdminLoginPage() {
  const navigate = useNavigate()

  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated)
  const isLoading = useAdminAuthStore((state) => state.isLoading)
  const error = useAdminAuthStore((state) => state.error)
  const login = useAdminAuthStore((state) => state.login)
  const clearError = useAdminAuthStore((state) => state.clearError)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Clear error on unmount
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password) {
      return
    }

    const success = await login(username.trim(), password)
    if (success) {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#ff3040] flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[24px] font-bold text-white">Admin Portal</h1>
          <p className="text-[14px] text-[#777] mt-1">Sign in to access the dashboard</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#ff3040]/10 border border-[#ff3040]/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-[#ff3040] flex-shrink-0" />
              <p className="text-[13px] text-[#ff3040]">{error}</p>
            </div>
          )}

          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-[13px] font-medium text-[#999] mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-[#ff3040] focus:ring-1 focus:ring-[#ff3040] transition-colors"
              placeholder="Enter your username"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-[#999] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-[#ff3040] focus:ring-1 focus:ring-[#ff3040] transition-colors"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password}
            className="w-full py-2.5 bg-[#ff3040] hover:bg-[#e02838] text-white font-medium text-[14px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#555] mt-8">
          Access restricted to authorized personnel only
        </p>
      </div>
    </div>
  )
}
