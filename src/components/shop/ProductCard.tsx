'use client'

import { memo, useCallback } from 'react'
import { CartItem } from '@/types'
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

interface ProductCardProps {
  product: {
    id: number
    name: string
    category: string
    categoryId: string | null
    image: string
    price: number
    oldPrice: number | null
    discountValue: number
    offer: boolean
    status: string
  }
  variantPrice: number
  discountPercent: number
  maxSavings: number
  originalPrice: number | null
  isAdding: boolean
  isAdded: boolean
  onProductClick: (productId: number, productName: string) => void
  onAddToCart: (productId: number, item: CartItem) => void
  onPrefetch: (productId: number) => void
}

// Memoized Product Card - only re-renders when its specific props change
const ProductCard = memo(function ProductCard({
  product,
  variantPrice,
  discountPercent,
  maxSavings,
  originalPrice,
  isAdding,
  isAdded,
  onProductClick,
  onAddToCart,
  onPrefetch,
}: ProductCardProps) {
  const hasDiscount = discountPercent > 0 || (originalPrice && originalPrice > variantPrice)

  const handleClick = useCallback(() => {
    onProductClick(product.id, product.name)
  }, [onProductClick, product.id, product.name])

  const handleMouseEnter = useCallback(() => {
    onPrefetch(product.id)
  }, [onPrefetch, product.id])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart(product.id, {
      id: product.id,
      name: product.name,
      price: variantPrice,
      oldPrice: originalPrice || variantPrice,
      img: product.image,
      weight: '1 KG',
      category: product.category,
      categoryId: product.categoryId || undefined,
      offer: product.offer,
      discountType: 'pct',
      discountValue: discountPercent || undefined,
      quantity: 1,
    })
  }, [onAddToCart, product, variantPrice, originalPrice, discountPercent])

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="bg-white p-3 relative cursor-pointer transition-all duration-300 flex flex-col w-full min-h-[230px] md:min-h-[260px] border border-gray-200 rounded-xl hover:border-[#16a34a] group animate-fade-in-up"
    >
      {hasDiscount && (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded z-10">
          {maxSavings > 0 ? `TK ${maxSavings} ছাড়` : `-${discountPercent}%`}
        </span>
      )}
      <div className="flex-grow flex items-center justify-center py-2">
        <div className="w-full h-[130px] md:h-[150px] flex items-center justify-center">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain" 
            loading="lazy" 
            onError={handleImageError}
          />
        </div>
      </div>
      <div className="flex flex-col mt-auto">
        <h3 className="text-sm font-medium text-gray-800 truncate font-bangla">{product.name}</h3>
        <div className="flex items-center gap-2 mb-2 mt-1">
          <span className="text-sm font-semibold text-[#16a34a]">TK {roundPrice(variantPrice)}</span>
          {originalPrice && originalPrice > variantPrice && (
            <span className="text-xs text-gray-400 line-through">TK {roundPrice(originalPrice)}</span>
          )}
        </div>
        <button 
          className={`w-full text-[15px] md:text-[16px] font-semibold py-2 md:py-2.5 flex items-center justify-center gap-1.5 border-none cursor-pointer transition-all duration-300 rounded-md font-bangla ${
            isAdded 
              ? 'bg-green-500 text-white scale-[1.02] shadow-lg shadow-green-500/30' 
              : isAdding
              ? 'bg-[#15803d] text-white'
              : 'bg-[#16a34a] text-white hover:bg-[#15803d] active:scale-95'
          }`}
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
        >
          {isAdding ? (
            <>
              <i className="ri-loader-4-line text-sm md:text-base animate-spin" aria-hidden="true"></i>
              যোগ হচ্ছে...
            </>
          ) : isAdded ? (
            <>
              <i className="ri-checkbox-circle-fill text-sm md:text-base" aria-hidden="true"></i>
              যোগ হয়েছে!
            </>
          ) : (
            <>
              <i className="ri-shopping-cart-line text-sm md:text-base" aria-hidden="true"></i>
              কার্টে যোগ করুন
            </>
          )}
        </button>
      </div>
    </div>
  )
})

export { ProductCard }
