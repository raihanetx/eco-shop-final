'use client'

import { Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import ThankYou from '@/components/shop/ThankYou'
import { useAppRouter } from '@/hooks/useAppRouter'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const { navigate } = useAppRouter()
  
  // Get order number from URL
  const orderNumber = searchParams.get('order') || ''
  
  // Handle navigation
  const handleNavigate = useCallback((view: string) => {
    switch (view) {
      case 'shop':
        navigate('shop')
        break
      case 'orders':
        navigate('history')
        break
    }
  }, [navigate])

  return (
    <ThankYou setView={handleNavigate} orderNumber={orderNumber} />
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}
