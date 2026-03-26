'use client'

import { Suspense, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import CategoryProducts from '@/components/shop/CategoryProducts'
import { useCartStore, useShopStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'

function CategoryContent() {
  const params = useParams()
  const { navigate } = useAppRouter()
  
  const { addItem: addToCart } = useCartStore()
  const { fetchData, setSelectedProduct } = useShopStore()
  
  // Get category name from URL
  const categoryName = params.name ? decodeURIComponent(params.name as string) : ''
  
  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Handle navigation
  const handleNavigate = useCallback((view: string) => {
    switch (view) {
      case 'shop':
        navigate('shop')
        break
      case 'product':
        // Product navigation is handled internally by CategoryProducts
        break
    }
  }, [navigate])

  return (
    <CategoryProducts 
      setView={handleNavigate} 
      addToCart={addToCart}
      categoryName={categoryName}
    />
  )
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <CategoryContent />
      </MainLayout>
    </Suspense>
  )
}
