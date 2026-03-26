'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dbStatus, setDbStatus] = useState<'checking' | 'initializing' | 'ready'>('checking')

  // Form fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Password strength indicators
  const [hasLength, setHasLength] = useState(false)
  const [hasUpper, setHasUpper] = useState(false)
  const [hasLower, setHasLower] = useState(false)
  const [hasNumber, setHasNumber] = useState(false)
  const [hasSpecial, setHasSpecial] = useState(false)

  // Initialize database and check setup status
  useEffect(() => {
    const initAndCheck = async () => {
      try {
        // First, initialize database tables
        setDbStatus('initializing')
        const initRes = await fetch('/api/init-db', { method: 'POST' })
        const initData = await initRes.json()

        if (!initRes.ok && !initData.error?.includes('already exists')) {
          console.log('[SETUP] DB init result:', initData)
        }

        setDbStatus('ready')

        // Check if setup is needed
        const res = await fetch('/api/setup')
        const data = await res.json()

        if (!data.needsSetup) {
          // Already configured, redirect to login
          router.push('/admin')
          return
        }

        setChecking(false)
      } catch (error) {
        console.error('Setup check error:', error)
        setError('Failed to connect to database. Check your DATABASE_URL.')
        setChecking(false)
      }
    }

    initAndCheck()
  }, [router])

  // Password strength check - SIMPLIFIED for non-technical users
  useEffect(() => {
    setHasLength(password.length >= 6) // Reduced from 8
    setHasUpper(/[A-Z]/.test(password))
    setHasLower(/[a-z]/.test(password))
    setHasNumber(/[0-9]/.test(password))
    setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password))
  }, [password])

  const getPasswordStrength = () => {
    let score = 0
    if (hasLength) score++
    if (hasUpper) score++
    if (hasLower) score++
    if (hasNumber) score++
    if (hasSpecial) score++
    return score
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate - SIMPLIFIED
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // At least 2 requirements met
    if (getPasswordStrength() < 2) {
      setError('Please make your password stronger (add numbers or mixed case letters)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, confirmPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        // Auto-login after setup
        setTimeout(async () => {
          try {
            // Attempt auto-login
            const loginRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
            })
            
            if (loginRes.ok) {
              // Go directly to admin dashboard
              router.push('/admin?page=overview')
            } else {
              // Fallback to login page
              router.push('/admin')
            }
          } catch {
            router.push('/admin')
          }
        }, 1500)
      } else {
        setError(data.error || 'Setup failed')
      }
    } catch (error) {
      console.error('Setup error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">
            {dbStatus === 'checking' && 'Checking database...'}
            {dbStatus === 'initializing' && 'Setting up your shop...'}
            {dbStatus === 'ready' && 'Almost ready...'}
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[5px] shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-line text-3xl text-[#16a34a]"></i>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">🎉 Setup Complete!</h2>
          <p className="text-sm text-gray-500 mb-2">Your admin account is ready.</p>
          <p className="text-xs text-gray-400">Taking you to your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  const strength = getPasswordStrength()
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent']

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-[5px] shadow-sm border border-gray-100 p-5">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-[10px] flex items-center justify-center mx-auto mb-3 shadow-lg">
              <i className="ri-store-2-line text-2xl text-white"></i>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Welcome to Your Shop!</h1>
            <p className="text-xs text-gray-500 mt-1">Create your admin account to get started</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-4 p-3 bg-blue-50 rounded-[5px]">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <i className="ri-checkbox-circle-fill text-green-500"></i>
              <span>Database connected ✓</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-700 mt-1">
              <i className="ri-checkbox-circle-fill text-green-500"></i>
              <span>Tables created ✓</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
              <i className="ri-loader-4-line animate-spin"></i>
              <span>Create admin account...</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-xs rounded-[5px] flex items-center gap-1">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-[5px] outline-none transition-all focus:bg-white focus:border-[#16a34a] disabled:opacity-50 text-sm"
                placeholder="e.g., myshop"
              />
              <p className="text-[10px] text-gray-400 mt-1">You'll use this to login</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-[5px] outline-none transition-all focus:bg-white focus:border-[#16a34a] disabled:opacity-50 pr-12 text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#16a34a] text-[10px] font-medium hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= strength ? strengthColors[strength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Password strength: <span className="font-medium">{strengthLabels[strength - 1] || 'Too weak'}</span>
                  </p>
                </div>
              )}

              {/* Simplified tips */}
              {password && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-[10px] text-gray-500">
                  <p className="font-medium mb-1">Tips for a strong password:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={hasLength ? 'text-green-600' : ''}>
                      {hasLength ? '✓' : '○'} 6+ characters
                    </span>
                    <span className={hasUpper || hasLower ? 'text-green-600' : ''}>
                      {hasUpper || hasLower ? '✓' : '○'} Letters
                    </span>
                    <span className={hasNumber ? 'text-green-600' : ''}>
                      {hasNumber ? '✓' : '○'} Numbers
                    </span>
                    <span className={hasSpecial ? 'text-green-600' : ''}>
                      {hasSpecial ? '✓' : '○'} Symbol (!@#)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-3 py-2.5 text-gray-900 bg-gray-50 border rounded-[5px] outline-none transition-all focus:bg-white disabled:opacity-50 text-sm ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#16a34a]'
                }`}
                placeholder="Type password again"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-red-500 mt-1">⚠ Passwords don't match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-[10px] text-green-600 mt-1">✓ Passwords match!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#16a34a] text-white text-sm font-medium rounded-[5px] hover:bg-[#15803d] transition-all disabled:opacity-50 shadow-sm hover:shadow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  Create Account & Continue
                </>
              )}
            </button>
          </form>
        </div>

        <a href="/" className="block text-center text-xs text-gray-500 hover:text-[#16a34a] mt-3">
          ← Back to shop
        </a>
      </motion.div>
    </div>
  )
}
