'use client'

import { useState } from 'react'

interface LoginProps {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Invalid username or password')
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts)
        }
        setLoading(false)
      }
    } catch (err) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#16a34a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <i className="ri-admin-line text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-500 mt-1">Enter your credentials to continue</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              remainingAttempts !== null && remainingAttempts <= 2 
                ? 'bg-amber-50 border border-amber-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <i className={`text-xl ${
                remainingAttempts !== null && remainingAttempts <= 2 
                  ? 'ri-alert-line text-amber-500' 
                  : 'ri-error-warning-line text-red-500'
              }`}></i>
              <div>
                <p className={`font-medium text-sm ${
                  remainingAttempts !== null && remainingAttempts <= 2 
                    ? 'text-amber-700' 
                    : 'text-red-700'
                }`}>{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts <= 3 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field with Floating Label */}
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={loading}
                className="peer w-full px-4 py-4 pt-5 pb-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-[#16a34a] focus:ring-0 disabled:opacity-60 disabled:cursor-not-allowed placeholder-transparent"
                placeholder="Username"
              />
              <label 
                htmlFor="username"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === 'username' || username
                    ? 'top-2 text-xs text-[#16a34a] bg-white px-1 -ml-1'
                    : 'top-1/2 -translate-y-1/2 text-gray-400 text-base'
                }`}
              >
                Username
              </label>
              <i className="ri-user-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            </div>

            {/* Password Field with Floating Label */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={loading}
                className="peer w-full px-4 py-4 pt-5 pb-2.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-[#16a34a] focus:ring-0 disabled:opacity-60 disabled:cursor-not-allowed placeholder-transparent pr-12"
                placeholder="Password"
              />
              <label 
                htmlFor="password"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === 'password' || password
                    ? 'top-2 text-xs text-[#16a34a] bg-white px-1 -ml-1'
                    : 'top-1/2 -translate-y-1/2 text-gray-400 text-base'
                }`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line text-lg`}></i>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line text-xl animate-spin"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="ri-login-circle-line text-xl"></i>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Info */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <i className="ri-shield-check-line text-[#16a34a]"></i>
          <span>Secured with encrypted connection</span>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
