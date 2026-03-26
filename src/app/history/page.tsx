'use client'

import { Suspense, useCallback } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Orders from '@/components/orders/Orders'
import { useOrderStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'

function HistoryContent() {
  const { navigate } = useAppRouter()
  const { orders } = useOrderStore()
  
  // Handle navigation
  const handleNavigate = useCallback(() => {
    navigate('shop')
  }, [navigate])

  return (
    <Orders orders={orders} setView={handleNavigate} />
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <HistoryContent />
      </MainLayout>
    </Suspense>
  )
}
