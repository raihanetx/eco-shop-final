'use client'

import { useState } from 'react'

interface GettingStartedProps {
  hasCategories: boolean
  hasProducts: boolean
  hasCredentials: boolean
  onClose: () => void
}

export function GettingStarted({ hasCategories, hasProducts, hasCredentials, onClose }: GettingStartedProps) {
  const [currentStep, setCurrentStep] = useState(0)
  // Use lazy initialization to check sessionStorage once on mount
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('gettingStartedDismissed') === 'true'
  })

  const handleDismiss = () => {
    sessionStorage.setItem('gettingStartedDismissed', 'true')
    setDismissed(true)
    onClose()
  }

  if (dismissed) return null

  const steps = [
    { id: 'categories', done: hasCategories, title: 'Create Categories', desc: 'Organize your products into categories like "Vegetables", "Fruits"', icon: 'ri-folder-add-line', link: '/admin?page=categories' },
    { id: 'products', done: hasProducts, title: 'Add Products', desc: 'Add your first product with images, prices, and stock', icon: 'ri-add-circle-line', link: '/admin?page=products' },
    { id: 'credentials', done: hasCredentials, title: 'Configure Uploads', desc: 'Set up Cloudinary for image uploads (free tier available)', icon: 'ri-image-add-line', link: '/admin?page=settings' },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  // Show if not all done
  if (allDone) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-lg">🚀</span>
            Getting Started
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              step.done
                ? 'bg-green-100 border border-green-200'
                : 'bg-white border border-gray-200 hover:border-green-300'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step.done ? (
                <i className="ri-check-line"></i>
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-green-700' : 'text-gray-900'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 truncate">{step.desc}</p>
            </div>

            {!step.done && (
              <a
                href={step.link}
                className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors flex-shrink-0"
              >
                Start
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default GettingStarted
