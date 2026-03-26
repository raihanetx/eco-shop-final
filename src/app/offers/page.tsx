'use client'

import { Suspense, useCallback } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Offers from '@/components/offers/Offers'
import { useAppRouter } from '@/hooks/useAppRouter'

function OffersContent() {
  const { navigate } = useAppRouter()
  
  // Handle navigation
  const handleNavigate = useCallback(() => {
    navigate('shop')
  }, [navigate])

  return (
    <Offers setView={handleNavigate} />
  )
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <OffersContent />
      </MainLayout>
    </Suspense>
  )
}
