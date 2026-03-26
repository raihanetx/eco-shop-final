'use client'

import { Suspense, useCallback } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Profile from '@/components/profile/Profile'
import { useAppRouter } from '@/hooks/useAppRouter'

function ProfileContent() {
  const { navigate } = useAppRouter()
  
  // Handle navigation
  const handleNavigate = useCallback(() => {
    navigate('shop')
  }, [navigate])

  return (
    <Profile setView={handleNavigate} />
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <ProfileContent />
      </MainLayout>
    </Suspense>
  )
}
