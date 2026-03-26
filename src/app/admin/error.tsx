'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Error Message */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Dashboard Error
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            An error occurred while loading the admin dashboard. This might be a temporary issue.
          </p>

          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-red-600 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={reset}
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/admin'}
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
