'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if setup is needed
        const setupRes = await fetch('/api/setup')
        const setupData = await setupRes.json()

        if (setupData.needsSetup) {
          // No admin configured, redirect to setup
          setNeedsSetup(true)
          router.push('/admin/setup')
          return
        }

        // Check if already logged in
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          console.log('[ADMIN] Session check result:', data.authenticated)
          setIsAuthenticated(data.authenticated || false)
        } else {
          console.log('[ADMIN] Session check failed:', res.status)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('[ADMIN] Session check error:', error)
        setIsAuthenticated(false)
      }
    }
    checkSession()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminDashboard setView={() => {}} />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })

      if (res.ok) {
        console.log('[ADMIN] Login successful')
        setIsAuthenticated(true)
      } else {
        const data = await res.json()

        // Check if setup is needed (error indicates no admin configured)
        if (data.error?.includes('not configured') || data.error?.includes('set up')) {
          router.push('/admin/setup')
          return
        }

        setError(data.error || 'Invalid credentials')
      }
    } catch (error) {
      console.error('[ADMIN] Login error:', error)
      setError('Error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="bg-white rounded-[5px] shadow-sm border border-gray-100 p-5">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-10 h-10 bg-[#16a34a] rounded-[5px] flex items-center justify-center mx-auto mb-2">
              <i className="ri-admin-line text-lg text-white"></i>
            </div>
            <h1 className="text-base font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500 mt-0.5">Sign in to your account</p>
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
            {/* Username with Floating Label */}
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
                className="peer w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-[5px] outline-none transition-all focus:bg-white focus:border-[#16a34a] disabled:opacity-50 placeholder-transparent text-sm"
                placeholder="Username"
              />
              <label
                htmlFor="username"
                className={`absolute left-3 transition-all pointer-events-none ${
                  focusedField === 'username' || username
                    ? 'top-0 -translate-y-1/2 text-[10px] text-[#16a34a] bg-white px-1'
                    : 'top-1/2 -translate-y-1/2 text-gray-400 text-xs'
                }`}
              >
                Username
              </label>
            </div>

            {/* Password with Floating Label */}
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
                className="peer w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-[5px] outline-none transition-all focus:bg-white focus:border-[#16a34a] disabled:opacity-50 placeholder-transparent pr-12 text-sm"
                placeholder="Password"
              />
              <label
                htmlFor="password"
                className={`absolute left-3 transition-all pointer-events-none ${
                  focusedField === 'password' || password
                    ? 'top-0 -translate-y-1/2 text-[10px] text-[#16a34a] bg-white px-1'
                    : 'top-1/2 -translate-y-1/2 text-gray-400 text-xs'
                }`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#16a34a] text-[10px] font-medium hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#16a34a] text-white text-sm font-medium rounded-[5px] hover:bg-[#15803d] transition-all disabled:opacity-50 shadow-sm hover:shadow"
            >
              {loading ? 'Loading...' : 'Enter on admin dashboard'}
            </button>
          </form>
        </div>

        <a href="/" className="block text-center text-xs text-gray-500 hover:text-[#16a34a] mt-3">
          ← Back to shop
        </a>
      </div>
    </div>
  )
}
