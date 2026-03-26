'use client'

import { Suspense, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import Shop from '@/components/shop/Shop'
import ContentPage from '@/components/content/ContentPage'
import { useShopStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'
import { useVisitorTracking } from '@/hooks/useVisitorTracking'
import { ShopPageSkeleton, LoadingPage } from '@/components/ui/skeleton'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { navigate } = useAppRouter()
  
  const { fetchData, isLoading, settingsLoaded } = useShopStore()
  
  // Track visitor session for analytics
  useVisitorTracking()
  
  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Handle category click - navigate to category page
  const handleCategoryClick = useCallback((categoryName: string) => {
    navigate('category', { categoryName })
  }, [navigate])

  // Handle navigation
  const handleNavigate = useCallback(() => {
    navigate('shop')
  }, [navigate])
  
  // Show professional skeleton loading during initial load
  if (isLoading || !settingsLoaded) {
    return <ShopPageSkeleton />
  }
  
  // Handle content pages (about, terms, etc.)
  const page = searchParams.get('page')
  if (page && ['about', 'terms', 'refund', 'privacy'].includes(page)) {
    return (
      <MainLayout>
        <ContentPage type={page as 'about' | 'terms' | 'refund' | 'privacy'} setView={() => router.push('/')} />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Shop 
        setView={handleNavigate} 
        addToCart={() => {}} 
        onCategoryClick={handleCategoryClick}
      />
    </MainLayout>
  )
}

// Professional loading fallback with full animation
function LoadingFallback() {
  return <LoadingPage />
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  )
}
