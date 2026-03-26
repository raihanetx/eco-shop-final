'use client'

import { useState, useEffect } from 'react'
import { ViewType } from '@/types'

interface ContentPageProps {
  type: 'about' | 'terms' | 'refund' | 'privacy'
  setView: (v: ViewType, params?: Record<string, string>) => void
}

const pageTitles: Record<string, string> = {
  about: 'About Us',
  terms: 'Terms & Conditions',
  refund: 'Refund Policy',
  privacy: 'Privacy Policy'
}

const contentKeys: Record<string, keyof SettingsData> = {
  about: 'aboutUs',
  terms: 'termsConditions',
  refund: 'refundPolicy',
  privacy: 'privacyPolicy'
}

interface SettingsData {
  aboutUs: string
  termsConditions: string
  refundPolicy: string
  privacyPolicy: string
}

export default function ContentPage({ type, setView }: ContentPageProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.success) {
          const key = contentKeys[type]
          setContent(data.data[key] || '')
        }
      } catch (error) {
        console.error('Error fetching content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [type])

  return (
    <div className="w-full px-4 py-6 max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        {pageTitles[type]}
      </h1>

      {/* Content */}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : content ? (
        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <div className="text-gray-400">No content available.</div>
      )}
    </div>
  )
}
