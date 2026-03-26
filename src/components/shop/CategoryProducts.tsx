'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem, ViewType } from '@/types'
import { useShopStore } from '@/store/useShopStore'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { roundPrice } from '@/lib/utils'

// Placeholder image for broken/missing images
const PLACEHOLDER_IMG = '/placeholder.svg'

// Handle image load error - show placeholder
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget
  if (target.src !== PLACEHOLDER_IMG) {
    target.src = PLACEHOLDER_IMG
  }
}

interface CategoryProductsProps {
  setView: (v: ViewType) => void
  addToCart: (item: CartItem) => void
  categoryName: string
}

// Helper function to create URL-safe slug from product name
function createProductSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '') // Keep Bengali chars, alphanumeric, spaces, hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100) // Limit length
  return slug
}

export default function CategoryProducts({ setView, addToCart, categoryName }: CategoryProductsProps) {
  const router = useRouter()
  const { products, isLoading, fetchData, setSelectedProduct } = useShopStore()
  
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter products by category
  const categoryProducts = products.filter(p => 
    p.status === 'active' && p.category === categoryName && p.price > 0
  )

  // Handle product click - navigate to product details page with product name in URL
  const handleProductClick = async (productId: number, productName: string) => {
    await setSelectedProduct(productId)
    const slug = createProductSlug(productName)
    router.push(`/${slug}`)
  }

  return (
    <main className="flex-grow">
      {/* Header */}
      <section className="py-4 md:py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => setView('shop')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <i className="ri-arrow-left-line text-xl text-gray-600"></i>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-bangla">{categoryName}</h1>
              <p className="text-gray-500 text-xs md:text-sm font-bangla">এই ক্যাটাগরির সকল পণ্য</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-12">
        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <p className="text-gray-500 text-lg font-medium animate-pulse">Loading...</p>
            </div>
          ) : categoryProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 justify-items-start">
              {categoryProducts.map((item) => {
                const discountValue = item.discountValue ?? 0
                const discountType = item.discountType ?? 'pct'
                
                let originalPrice = item.oldPrice
                if (!originalPrice || originalPrice <= item.price) {
                  if (discountValue > 0) {
                    if (discountType === 'pct') {
                      originalPrice = Math.round(item.price * 100 / (100 - discountValue))
                    } else {
                      originalPrice = item.price + discountValue
                    }
                  }
                }
                
                const hasDiscount = discountValue > 0 || (originalPrice && originalPrice > item.price)
                
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleProductClick(item.id, item.name)} 
                    className="bg-white p-3 relative cursor-pointer transition-all duration-300 flex flex-col w-full min-h-[230px] md:min-h-[260px] border border-gray-200 rounded-xl hover:border-[#16a34a]"
                  >
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded z-10">
                        -{discountValue > 0 
                          ? (discountType === 'pct' ? `${discountValue}%` : `TK ${roundPrice(discountValue)}`)
                          : item.discount}
                      </span>
                    )}
                    <div className="flex-grow flex items-center justify-center py-2">
                      <div className="w-full h-[130px] md:h-[150px] flex items-center justify-center">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" loading="lazy" onError={handleImageError}/>
                      </div>
                    </div>
                    <div className="flex flex-col mt-auto">
                      <h3 className="text-sm font-medium text-gray-800 truncate font-bangla">{item.name}</h3>
                      <div className="flex items-center gap-2 mb-2 mt-1">
                        <span className="text-sm font-semibold text-[#16a34a]">TK {roundPrice(item.price)}</span>
                        {originalPrice && originalPrice > item.price && (
                          <span className="text-xs text-gray-400 line-through">TK {roundPrice(originalPrice)}</span>
                        )}
                      </div>
                      <button 
                        className="w-full text-xs font-semibold py-2 flex items-center justify-center gap-1 bg-[#16a34a] text-white rounded-lg border-none cursor-pointer transition-transform duration-200 active:scale-95 font-bangla" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          addToCart({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            oldPrice: originalPrice || item.price,
                            img: item.image,
                            weight: '1 KG',
                            category: item.category,
                            categoryId: item.categoryId || undefined,
                            offer: item.offer,
                            discountType: item.discountType as 'pct' | 'fixed' | undefined,
                            discountValue: item.discountValue || undefined,
                            quantity: 1,
                          });
                        }}
                      >
                        <i className="ri-shopping-cart-line text-sm"></i>
                        কার্টে যোগ করুন
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-folder-open-line text-4xl text-gray-300"></i>
              </div>
              <p className="text-gray-500 font-bangla text-lg">এই ক্যাটাগরিতে কোনো পণ্য নেই</p>
              <button 
                onClick={() => setView('shop')}
                className="mt-4 px-6 py-2 bg-[#16a34a] text-white rounded-lg font-medium font-bangla hover:bg-[#15803d] transition-colors"
              >
                শপে ফিরে যান
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
