'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { useCartStore, useShopStore } from '@/store'

export default function SearchResultsPage() {
  const params = useParams()
  const router = useRouter()
  const query = decodeURIComponent(params.q as string || '')
  
  const { products, isLoading, fetchData, setSelectedProduct } = useShopStore()
  const { addItem: addToCart } = useCartStore()
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return []
    
    const searchTerm = query.toLowerCase().trim()
    
    const scored = products
      .filter(p => p.status === 'active')
      .map(product => {
        const productName = product.name.toLowerCase()
        let score = 0
        
        // Exact match (highest score)
        if (productName === searchTerm) {
          score = 100
        }
        // Name starts with search term
        else if (productName.startsWith(searchTerm)) {
          score = 80
        }
        // Name contains search term as a word
        else if (productName.split(/\s+/).includes(searchTerm)) {
          score = 60
        }
        // Name contains search term partially
        else if (productName.includes(searchTerm)) {
          score = 40
        }
        
        return { product, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)
    
    return scored
  }, [products, query])
  
  // Handle product click
  const handleProductClick = async (productId: number, productName: string) => {
    await setSelectedProduct(productId)
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
    router.push(`/${slug}`)
  }
  
  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent, product: typeof products[0]) => {
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice || product.price,
      img: product.image,
      weight: '1 KG',
      category: product.category,
      categoryId: product.categoryId || undefined,
      offer: product.offer,
      discountType: product.discountType as 'pct' | 'fixed' | undefined,
      discountValue: product.discountValue || undefined,
      quantity: 1,
    })
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-4 md:py-6">
        <div className="container mx-auto px-4 md:px-6">
          {/* Search Header */}
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => router.push('/')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-left-line text-xl text-gray-600"></i>
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 font-bangla">সার্চ রেজাল্ট</h1>
              <p className="text-gray-500 text-xs md:text-sm font-bangla">
                "{query}" - {filteredProducts.length} টি পণ্য পাওয়া গেছে
              </p>
            </div>
          </div>
          
          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white p-3 rounded-xl animate-pulse">
                  <div className="h-[130px] bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {filteredProducts.map((product) => {
                const discountValue = product.discountValue ?? 0
                const discountType = product.discountType ?? 'pct'
                
                let originalPrice = product.oldPrice
                if (!originalPrice || originalPrice <= product.price) {
                  if (discountValue > 0) {
                    if (discountType === 'pct') {
                      originalPrice = Math.round(product.price * 100 / (100 - discountValue))
                    } else {
                      originalPrice = product.price + discountValue
                    }
                  }
                }
                
                const hasDiscount = discountValue > 0 || (originalPrice && originalPrice > product.price)
                
                return (
                  <div 
                    key={product.id} 
                    onClick={() => handleProductClick(product.id, product.name)}
                    className="bg-white p-3 relative cursor-pointer transition-all duration-300 flex flex-col w-full min-h-[230px] md:min-h-[260px] border border-gray-200 rounded-xl hover:border-[#16a34a]"
                  >
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded z-10">
                        -{discountValue > 0 
                          ? (discountType === 'pct' ? `${discountValue}%` : `TK ${discountValue}`)
                          : product.discount}
                      </span>
                    )}
                    <div className="flex-grow flex items-center justify-center py-2">
                      <div className="w-full h-[130px] md:h-[150px] flex items-center justify-center">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" loading="lazy"/>
                      </div>
                    </div>
                    <div className="flex flex-col mt-auto">
                      <h3 className="text-sm font-medium text-gray-800 truncate font-bangla">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2 mt-1">
                        <span className="text-sm font-semibold text-[#16a34a]">TK {product.price}</span>
                        {originalPrice && originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">TK {originalPrice}</span>
                        )}
                      </div>
                      <button 
                        className="w-full text-[11px] md:text-xs font-semibold py-1.5 md:py-2 flex items-center justify-center gap-1 bg-[#16a34a] text-white rounded-full border-none cursor-pointer transition-transform duration-200 active:scale-95 font-bangla"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        <i className="ri-shopping-cart-line text-sm md:text-xs"></i>
                        কার্টে যোগ করুন
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            null
          )}
        </div>
      </div>
    </MainLayout>
  )
}
