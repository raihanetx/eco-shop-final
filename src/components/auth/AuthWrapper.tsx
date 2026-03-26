'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLogin from './AdminLogin'

interface AuthWrapperProps {
  children: React.ReactNode
  onBack: () => void
}

export default function AuthWrapper({ children, onBack }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setIsAuthenticated(!!data.user)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Handle login success
  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="ri-loader-4-line" style={{
            fontSize: '48px',
            color: '#16a34a',
            animation: 'spin 1s linear infinite'
          }}></i>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Checking authentication...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#64748b',
            zIndex: 10
          }}
        >
          <i className="ri-arrow-left-line"></i>
          Back to Shop
        </button>
        <AdminLogin onSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // Show children if authenticated
  return <>{children}</>
}
