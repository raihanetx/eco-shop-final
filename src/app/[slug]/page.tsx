'use client'

import { Suspense, useEffect, useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import ProductDetail from '@/components/shop/ProductDetail'
import { useCartStore, useShopStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'

function ProductDetailContent() {
  const params = useParams()
  const { navigate } = useAppRouter()
  
  const { addItem: addToCart } = useCartStore()
  const { setSelectedProduct, products, fetchData, isLoading, lastFetch } = useShopStore()
  
  // Get slug from URL
  const slug = params.slug as string
  
  // Track if we've attempted to fetch data
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  
  // Extract product name from slug
  const productNameFromSlug = useMemo(() => {
    if (!slug) return ''
    // Decode the URL encoded slug and convert hyphens back to spaces
    const decoded = decodeURIComponent(slug)
    return decoded.replace(/-/g, ' ')
  }, [slug])
  
  // Find product by matching name
  const product = useMemo(() => {
    if (!productNameFromSlug || products.length === 0) return null
    
    // Try to find exact match first
    const exactMatch = products.find(p => 
      p.name.toLowerCase() === productNameFromSlug.toLowerCase()
    )
    if (exactMatch) return exactMatch
    
    // Try to find product that contains the name
    const partialMatch = products.find(p => 
      p.name.toLowerCase().includes(productNameFromSlug.toLowerCase()) ||
      productNameFromSlug.toLowerCase().includes(p.name.toLowerCase())
    )
    if (partialMatch) return partialMatch
    
    return null
  }, [productNameFromSlug, products])
  
  // Fetch initial data - always fetch on mount to ensure we have products
  useEffect(() => {
    const loadData = async () => {
      await fetchData()
      setHasAttemptedFetch(true)
    }
    loadData()
  }, [fetchData])
  
  // Set selected product when found
  useEffect(() => {
    if (product) {
      setSelectedProduct(product.id)
    }
  }, [product, setSelectedProduct])
  
  // Handle navigation
  const handleNavigate = useCallback(() => {
    navigate('shop')
  }, [navigate])

  // Show loading while fetching OR if we haven't attempted fetch yet OR if products are empty but we're still loading
  const showLoading = isLoading || !hasAttemptedFetch || (products.length === 0 && !lastFetch)
  
  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i className="ri-error-warning-line text-4xl text-gray-300"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2 font-bangla">পণ্য পাওয়া যায়নি</h2>
        <p className="text-gray-500 mb-4 font-bangla">এই পণ্যটি আর উপলব্ধ নেই</p>
        <button 
          onClick={() => navigate('shop')}
          className="px-6 py-2 bg-[#16a34a] text-white rounded-lg font-medium font-bangla hover:bg-[#15803d] transition-colors"
        >
          হোমে যান
        </button>
      </div>
    )
  }

  return (
    <ProductDetail 
      setView={handleNavigate} 
      addToCart={addToCart}
    />
  )
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <ProductDetailContent />
      </MainLayout>
    </Suspense>
  )
}
