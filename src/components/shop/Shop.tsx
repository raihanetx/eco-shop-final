'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem, ViewType } from '@/types'
import { useShopStore } from '@/store/useShopStore'
import { ShopPageSkeleton } from '@/components/ui/skeleton'
import { roundPrice } from '@/lib/utils'
import { useCartToast } from '@/components/ui/CartToast'

// Placeholder image for broken/missing images
const PLACEHOLDER_IMG = '/placeholder.svg'

// Handle image load error - show placeholder
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget
  if (target.src !== PLACEHOLDER_IMG) {
    target.src = PLACEHOLDER_IMG
  }
}

interface ShopProps {
  setView: (v: ViewType) => void
  addToCart: (item: CartItem) => void
  onCategoryClick?: (categoryName: string) => void
}

// Helper function to create URL-safe slug from product name
function createProductSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
  return slug
}

// Simple search - only match by product NAME/TITLE
function searchProductsByName<T extends { id: number; name: string; status: string }>(products: T[], query: string): T[] {
  if (!query.trim()) {
    return products.filter(p => p.status === 'active')
  }
  
  const searchTerm = query.toLowerCase().trim()
  
  const scored = products
    .filter(p => p.status === 'active')
    .map(product => {
      const productName = product.name.toLowerCase()
      let score = 0
      
      if (productName === searchTerm) score = 100
      else if (productName.startsWith(searchTerm)) score = 80
      else if (productName.split(/\s+/).includes(searchTerm)) score = 60
      else if (productName.includes(searchTerm)) score = 40
      
      return { product, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product)
  
  return scored
}

export default function Shop({ setView, addToCart, onCategoryClick }: ShopProps) {
  const router = useRouter()
  const { categories, products, settings, isLoading, error, fetchData, setSelectedProduct, searchQuery, setSearchQuery, variantMap, settingsLoaded } = useShopStore()
  
  const [addedProducts, setAddedProducts] = useState<Set<number>>(new Set())
  const addToCartTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const { showToast } = useCartToast()
  
  useEffect(() => {
    return () => {
      addToCartTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      addToCartTimeoutsRef.current.clear()
    }
  }, [])
  
  const heroImages = settings.heroImages && settings.heroImages.length > 0 ? settings.heroImages : []
  const heroAnimationSpeed = settings.heroAnimationSpeed || 3000
  
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (heroImages.length <= 1) return
    
    if (heroIntervalRef.current) clearInterval(heroIntervalRef.current)
    
    heroIntervalRef.current = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, heroAnimationSpeed)
    
    return () => {
      if (heroIntervalRef.current) clearInterval(heroIntervalRef.current)
    }
  }, [heroImages.length, heroAnimationSpeed])
  
  const goToSlide = (index: number) => {
    setCurrentHeroIndex(index)
    if (heroIntervalRef.current) clearInterval(heroIntervalRef.current)
    heroIntervalRef.current = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, heroAnimationSpeed)
  }

  useEffect(() => {
    fetchData()
    setSearchQuery('')
  }, [fetchData, setSearchQuery])

  const filteredProducts = useMemo(() => {
    return searchProductsByName(products, searchQuery)
  }, [products, searchQuery])

  const handleCategoryClick = (categoryName: string) => {
    if (onCategoryClick) onCategoryClick(categoryName)
  }

  const handleProductClick = (productId: number, productName: string) => {
    const slug = createProductSlug(productName)
    router.push(`/${slug}`)
    setSelectedProduct(productId)
  }
  
  const handleAddToCart = useCallback((productId: number, item: CartItem) => {
    const existingTimeout = addToCartTimeoutsRef.current.get(productId)
    if (existingTimeout) clearTimeout(existingTimeout)
    
    addToCart(item)
    setAddedProducts(prev => new Set(prev).add(productId))
    showToast()
    
    const timeout = setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
      addToCartTimeoutsRef.current.delete(productId)
    }, 600)
    
    addToCartTimeoutsRef.current.set(productId, timeout)
  }, [addToCart, showToast])

  const offerProducts = useMemo(() => {
    const offerProds = products.filter(p => p.offer && p.status === 'active' && p.price > 0)
    
    const withSavings = offerProds.map(p => {
      const productVariants = variantMap[p.id] || []
      let discountPercent = p.discountValue ?? 0
      let currentPrice = parseFloat(String(p.price)) || 0
      
      if (productVariants.length > 0) {
        let maxSavings = 0
        for (const v of productVariants) {
          const variantPrice = Number(v.price) || 0
          const variantDiscount = Number(v.discountValue) || discountPercent
          if (variantPrice > 0 && variantDiscount > 0) {
            const savings = Math.round((variantPrice * variantDiscount) / (100 - variantDiscount))
            if (savings > maxSavings) maxSavings = savings
          }
        }
        if (maxSavings > 0) return { product: p, savings: maxSavings }
      }
      
      let savings = 0
      if (discountPercent > 0 && currentPrice > 0) {
        savings = Math.round((currentPrice * discountPercent) / (100 - discountPercent))
      }
      return { product: p, savings }
    })
    
    return withSavings.sort((a, b) => b.savings - a.savings).slice(0, 3).map(item => item.product)
  }, [products, variantMap])

  if (error) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <i className="ri-wifi-off-line text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 font-bangla">কিছু সমস্যা হয়েছে</h2>
          <p className="text-gray-500 mb-6 font-bangla">{error}</p>
          <button onClick={() => fetchData()} className="px-6 py-3 bg-[#16a34a] text-white rounded-xl font-semibold hover:bg-[#15803d] transition-colors flex items-center gap-2 mx-auto font-bangla">
            <i className="ri-refresh-line"></i> আবার চেষ্টা করুন
          </button>
        </div>
      </main>
    )
  }

  if (products.length === 0 && isLoading) {
    return <ShopPageSkeleton />
  }

  return (
    <main className="flex-grow">
      {/* Hero Banner */}
      <section className="w-full pb-4 md:pb-6">
        <div className="mx-3 mt-3 md:mx-6 md:mt-6 relative h-[180px] md:h-[300px] rounded-2xl overflow-hidden border border-gray-200">
          {heroImages.length > 0 ? (
            <>
              {heroImages.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${index === currentHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  style={{backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent z-20"></div>
              {heroImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentHeroIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">Welcome</span>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-2 md:py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-3 md:mb-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 font-bangla">{settings.firstSectionName || 'ক্যাটাগরি'}</h2>
            {settings.firstSectionSlogan && <p className="text-gray-500 mt-0.5 text-xs md:text-sm font-bangla">{settings.firstSectionSlogan}</p>}
          </div>
          
          {categories.filter(c => c.status === 'Active').length > 0 ? (
            <div className="flex justify-center">
              <div className="flex gap-3 md:gap-4 overflow-x-auto md:flex-wrap md:justify-center pb-2 md:pb-0 no-scrollbar">
                {categories.filter(c => c.status === 'Active').map((cat) => (
                  <div key={cat.id} className="flex-shrink-0 flex flex-col items-center group cursor-pointer" onClick={() => handleCategoryClick(cat.name)}>
                    <div className="w-[60px] h-[60px] md:w-[85px] md:h-[85px] rounded-lg border flex items-center justify-center text-gray-700 transition-all mb-1.5 overflow-hidden border-gray-200 bg-white group-hover:text-[#16a34a] group-hover:border-[#16a34a]">
                      {cat.type === 'icon' && cat.icon ? (
                        <i className={`${cat.icon} text-2xl md:text-3xl`}></i>
                      ) : cat.type === 'image' && cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={handleImageError} />
                      ) : (
                        <i className="ri-folder-line text-2xl md:text-3xl"></i>
                      )}
                    </div>
                    <span className="text-[11px] md:text-xs font-medium text-gray-700">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8"><p className="text-gray-400 text-sm">কোনো ক্যাটাগরি নেই</p></div>
          )}
        </div>
      </section>

      {/* Offer Cards */}
      {offerProducts.length > 0 && (
        <section id="offers" className="py-2 md:py-4">
          <div className="px-3 md:px-4">
            <div className="mb-3 md:mb-4 text-center">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 font-bangla">{settings.secondSectionName || 'অফার কার্ড'}</h2>
              {settings.secondSectionSlogan && <p className="text-gray-500 mt-0.5 text-xs md:text-sm font-bangla">{settings.secondSectionSlogan}</p>}
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-4">
              {offerProducts.map((product) => {
                const productVariants = variantMap[product.id] || []
                let bestVariantPrice = product.price
                let bestDiscountPercent = product.discountValue ?? 0
                let maxSavings = 0
                
                if (productVariants.length > 0) {
                  for (const v of productVariants) {
                    const variantPrice = Number(v.price) || 0
                    const variantDiscount = Number(v.discountValue) || 0
                    if (variantPrice > 0 && variantDiscount > 0) {
                      const savings = Math.round((variantPrice / (1 - variantDiscount / 100)) - variantPrice)
                      if (savings > maxSavings) {
                        maxSavings = savings
                        bestVariantPrice = variantPrice
                        bestDiscountPercent = variantDiscount
                      }
                    }
                  }
                }
                
                if (maxSavings === 0 && product.price > 0 && bestDiscountPercent > 0) {
                  maxSavings = Math.round((product.price / (1 - bestDiscountPercent / 100)) - product.price)
                  bestVariantPrice = product.price
                }
                
                let originalPrice = product.oldPrice
                if (!originalPrice || originalPrice <= bestVariantPrice) {
                  if (bestDiscountPercent > 0) originalPrice = Math.round(bestVariantPrice * 100 / (100 - bestDiscountPercent))
                }
                
                const hasOffer = maxSavings > 0 || bestDiscountPercent > 0
                
                return (
                  <div key={product.id} className="flex-shrink-0 w-[250px] h-[100px] bg-white rounded-lg flex relative border border-gray-200 overflow-hidden cursor-pointer hover:border-[#16a34a] transition-all" onClick={() => handleProductClick(product.id, product.name)}>
                    {hasOffer && <div className="absolute top-0 left-0 bg-[#ff4757] text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">{maxSavings > 0 ? `TK ${maxSavings} OFF` : `${bestDiscountPercent}% OFF`}</div>}
                    <div className="w-1/2 h-full bg-[#fbfbfc] flex justify-center items-center p-1 border-r border-gray-100">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain" onError={handleImageError} />
                    </div>
                    <div className="w-1/2 p-2 flex flex-col justify-center">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold mb-0.5">{product.category || 'Product'}</span>
                      <h2 className="text-sm font-bold text-slate-800 truncate mb-1">{product.name}</h2>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[13px] font-bold text-emerald-500">TK {roundPrice(bestVariantPrice)}</span>
                        {originalPrice && originalPrice > bestVariantPrice && <span className="text-[10px] line-through text-slate-400">TK {roundPrice(originalPrice)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section id="products-section" className="pb-8 pt-2 md:pt-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-3 md:mb-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 font-bangla">{settings.thirdSectionName || 'সকল পণ্য'}</h2>
            {settings.thirdSectionSlogan && <p className="text-gray-500 mt-0.5 text-xs md:text-sm font-bangla">{settings.thirdSectionSlogan}</p>}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 justify-items-start">
              {filteredProducts.map((item) => {
                const productVariants = variantMap[item.id] || []
                let bestVariantPrice = item.price
                let bestDiscountPercent = item.discountValue ?? 0
                let maxSavings = 0
                
                if (productVariants.length > 0) {
                  for (const v of productVariants) {
                    const variantPrice = Number(v.price) || 0
                    const variantDiscount = Number(v.discountValue) || 0
                    if (variantPrice > 0 && variantDiscount > 0) {
                      const savings = Math.round((variantPrice / (1 - variantDiscount / 100)) - variantPrice)
                      if (savings > maxSavings) {
                        maxSavings = savings
                        bestVariantPrice = variantPrice
                        bestDiscountPercent = variantDiscount
                      }
                    }
                  }
                }
                
                if (maxSavings === 0 && item.price > 0 && bestDiscountPercent > 0) {
                  maxSavings = Math.round((item.price / (1 - bestDiscountPercent / 100)) - item.price)
                  bestVariantPrice = item.price
                }
                
                let originalPrice = item.oldPrice
                if (!originalPrice || originalPrice <= bestVariantPrice) {
                  if (bestDiscountPercent > 0) originalPrice = Math.round(bestVariantPrice * 100 / (100 - bestDiscountPercent))
                }
                
                const hasDiscount = bestDiscountPercent > 0 || (originalPrice && originalPrice > bestVariantPrice)
                const isAdded = addedProducts.has(item.id)
                
                return (
                  <div key={item.id} onClick={() => handleProductClick(item.id, item.name)} onMouseEnter={() => setSelectedProduct(item.id)} className="bg-white p-3 relative cursor-pointer transition-all flex flex-col w-full min-h-[230px] md:min-h-[260px] border border-gray-200 rounded-xl hover:border-[#16a34a] group">
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded z-10">
                        {maxSavings > 0 ? `TK ${maxSavings} ছাড়` : `-${bestDiscountPercent}%`}
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
                        <span className="text-sm font-semibold text-[#16a34a]">TK {roundPrice(bestVariantPrice)}</span>
                        {originalPrice && originalPrice > bestVariantPrice && <span className="text-xs text-gray-400 line-through">TK {roundPrice(originalPrice)}</span>}
                      </div>
                      <button 
                        className={`w-full text-[15px] md:text-[16px] font-semibold py-2 md:py-2.5 flex items-center justify-center gap-1.5 border-none cursor-pointer transition-all rounded-md font-bangla ${isAdded ? 'bg-green-500 text-white' : 'bg-[#16a34a] text-white hover:bg-[#15803d]'}`}
                        onClick={(e) => { 
                          e.stopPropagation()
                          handleAddToCart(item.id, {
                            id: item.id, name: item.name, price: bestVariantPrice, oldPrice: originalPrice || bestVariantPrice,
                            img: item.image, weight: '1 KG', category: item.category, categoryId: item.categoryId || undefined,
                            offer: item.offer, discountType: 'pct', discountValue: bestDiscountPercent || undefined, quantity: 1,
                          })
                        }}
                      >
                        {isAdded ? (
                          <><i className="ri-checkbox-circle-fill text-sm md:text-base"></i> যোগ হয়েছে!</>
                        ) : (
                          <><i className="ri-shopping-cart-line text-sm md:text-base"></i> কার্টে যোগ করুন</>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-bangla">{searchQuery ? `"${searchQuery}" পণ্য পাওয়া যায়নি` : 'কোনো পণ্য নেই'}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
