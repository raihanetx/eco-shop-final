'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem, ViewType, Review } from '@/types'
import { useShopStore } from '@/store/useShopStore'
import { ProductDetailSkeleton, ProductCardSkeleton } from '@/components/ui/skeleton'
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

interface ProductDetailProps {
  setView: (v: ViewType) => void
  addToCart: (item: CartItem) => void
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

// Helper function to parse markdown bold syntax **text** to bold
const parseBoldText = (text: string) => {
  if (!text) return text
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-[#1F2937]">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Expandable Description Component - Inline See More
function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!text) return null
  
  // Reserve space for "... See More" (~12 chars) on the 4th line
  // Show ~4 lines, each line ~80 chars, minus space for button
  const buttonLength = 12 // "... See More" length
  const maxChars = (4 * 80) - buttonLength // ~308 chars to leave room for button on 4th line
  const shouldTruncate = text.length > maxChars
  
  if (isExpanded) {
    return (
      <>
        <span className="whitespace-pre-wrap inline">{parseBoldText(text)}</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[#16a34a] font-semibold hover:underline inline whitespace-nowrap ml-1"
        >
          See Less
        </button>
      </>
    )
  }
  
  if (shouldTruncate) {
    // Find a good break point (space or end of word)
    let cutPoint = maxChars
    const textAfterLimit = text.substring(maxChars)
    const nextSpaceIndex = textAfterLimit.indexOf(' ')
    if (nextSpaceIndex !== -1 && nextSpaceIndex < 20) {
      cutPoint = maxChars + nextSpaceIndex
    }
    
    const truncatedText = text.substring(0, cutPoint).trim()
    
    return (
      <>
        <span className="whitespace-pre-wrap inline">{parseBoldText(truncatedText)}</span>
        <span className="text-[#6B7280]">...</span>
        <button
          onClick={() => setIsExpanded(true)}
          className="text-[#16a34a] font-semibold hover:underline inline whitespace-nowrap ml-1"
        >
          See More
        </button>
      </>
    )
  }
  
  return <span className="whitespace-pre-wrap inline">{parseBoldText(text)}</span>
}

export default function ProductDetail({ setView, addToCart }: ProductDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  
  // Refs for setTimeout cleanup (prevent memory leaks)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const addAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resetAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Cart animation states
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const { showToast } = useCartToast()
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      if (addAnimationTimeoutRef.current) clearTimeout(addAnimationTimeoutRef.current)
      if (resetAnimationTimeoutRef.current) clearTimeout(resetAnimationTimeoutRef.current)
    }
  }, [])
  
  // Local toast state for review errors
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  
  // Show toast message
  const showLocalToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500)
  }
  
  const { products, selectedProductId, selectedProductVariants, selectedProductImages, selectedProductFaqs, selectedProductRelated, selectedProductReviews, selectedProduct, setSelectedProduct, addReview, isProductLoading, error, settings, settingsLoaded, fetchData } = useShopStore()
  
  // Fetch settings on mount if not loaded
  useEffect(() => {
    if (!settingsLoaded) {
      fetchData()
    }
  }, [fetchData, settingsLoaded])
  
  // Get product images - use database images or fallback to main product image
  const productImages = selectedProductImages.length > 0 
    ? selectedProductImages.map(img => img.url) 
    : (selectedProduct ? [selectedProduct.image] : [])
  
  // Use reviews from store or local state (submitted during session)
  const productReviews = selectedProductReviews.length > 0 ? selectedProductReviews : reviews
  
  // Build related products from database or fallback to offer products
  const relatedFromDb = selectedProductRelated
    .filter(r => r.product)
    .map(r => ({
      id: r.relatedProductId,
      name: r.product!.name,
      price: r.product!.price,
      oldPrice: r.product!.oldPrice || r.product!.price,
      img: r.product!.image,
      weight: '500g',
      discount: parseInt(r.product!.discount) || 0,
      rating: 4.5,
      reviews: 100
    }))
  
  // Fallback to offer products if no related products in database
  const offerProducts = products.filter(p => p.offer && p.id !== selectedProductId).slice(0, 4).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice || p.price,
    img: p.image,
    weight: '500g',
    discount: parseInt(p.discount) || 0,
    rating: 4.5,
    reviews: 100
  }))
  
  const relatedProducts = relatedFromDb.length > 0 ? relatedFromDb : offerProducts

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedProductId])
  
  // Track product view
  useEffect(() => {
    if (selectedProductId) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view', productId: selectedProductId }),
      }).catch(e => console.error('Failed to track view:', e))
    }
  }, [selectedProductId])
  
  // Show error state with retry option
  if (error) {
    return (
      <div className="bg-white w-full p-5 md:p-20 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <i className="ri-file-damage-line text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 font-bangla">পণ্য লোড করতে সমস্যা হয়েছে</h2>
          <p className="text-gray-500 mb-6 font-bangla">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#16a34a] text-white rounded-xl font-semibold hover:bg-[#15803d] transition-colors flex items-center gap-2 mx-auto font-bangla"
          >
            <i className="ri-home-4-line"></i>
            হোম পেজে যান
          </button>
        </div>
      </div>
    )
  }

  // Show skeleton loading while loading
  if (isProductLoading || !selectedProduct) {
    return <ProductDetailSkeleton />
  }
  
  // Handle clicking on a related product
  const handleRelatedProductClick = async (productId: number, productName: string) => {
    // Reset state before changing product
    setSelectedVariantIndex(0)
    setQuantity(1)
    setSelectedImageIndex(0)
    await setSelectedProduct(productId)
    const slug = createProductSlug(productName)
    router.push(`/${slug}`)
    window.scrollTo(0, 0)
  }

  // Get the current variant info for display
  const currentVariant = selectedProductVariants[selectedVariantIndex]
  const displayPrice = currentVariant?.price || selectedProduct?.price || 0
  const displayVariantName = currentVariant?.name || '1 KG'
  
  // Get discount info - use variant discount if available and > 0, otherwise use product discount
  // Note: Must check > 0 because ?? operator doesn't treat 0 as nullish
  const variantDiscountValue = currentVariant?.discountValue ?? 0
  const productDiscountValue = selectedProduct?.discountValue ?? 0

  const displayDiscountValue = variantDiscountValue > 0
    ? variantDiscountValue
    : productDiscountValue > 0
      ? productDiscountValue
      : 0

  const displayDiscountType = (displayDiscountValue > 0
    ? (variantDiscountValue > 0 ? currentVariant?.discountType : selectedProduct?.discountType)
    : 'pct') as 'pct' | 'fixed'
  const hasOffer = selectedProduct?.offer || false
  
  // Calculate total price
  const totalPrice = displayPrice * quantity
  
  // Get the original price (oldPrice or regular price)
  const originalPrice = selectedProduct?.oldPrice || selectedProduct?.price || displayPrice

  const handleSubmitReview = async () => {
    const nameInput = document.getElementById('reviewName') as HTMLInputElement
    const textInput = document.getElementById('reviewText') as HTMLTextAreaElement
    const name = nameInput?.value || ''
    const text = textInput?.value || ''

    if (name && text && userRating > 0) {
      const initials = name.match(/(\b\S)?/g)?.join("").match(/(^\S|\S$)?/g)?.join("").toUpperCase() || name.substring(0, 2).toUpperCase()
      const newReview: Review = { id: Date.now(), initials, name, rating: userRating, text, date: 'Just now' }
      
      // Save to database if we have a selected product
      if (selectedProductId) {
        const result = await addReview(selectedProductId, { name, rating: userRating, text })
        if (result.success) {
          setIsModalOpen(false)
          setUserRating(0)
          // Clear form
          if (nameInput) nameInput.value = ''
          if (textInput) textInput.value = ''
          showLocalToast('রিভিউ সফলভাবে জমা হয়েছে!', 'success')
        } else {
          showLocalToast(result.error || 'রিভিউ জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error')
        }
      } else {
        // Fallback to local state
        setReviews([newReview, ...reviews])
        setIsModalOpen(false)
        setUserRating(0)
      }
    } else {
      showLocalToast('অনুগ্রহ করে সব ফিল্ড পূরণ করুন এবং রেটিং দিন।', 'error')
    }
  }

  // Handle add to cart with variant and animation
  const handleAddToCart = () => {
    if (!selectedProduct || isAdding || isAdded) return
    
    // Step 1: Show "যোগ হচ্ছে..."
    setIsAdding(true)
    
    // Actually add to cart
    addToCart({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: displayPrice,
      oldPrice: selectedProduct.oldPrice || selectedProduct.price,
      img: selectedProduct.image,
      weight: displayVariantName,
      quantity: quantity,
      category: selectedProduct.category,
      categoryId: selectedProduct.categoryId || undefined,
      offer: hasOffer,
      discountType: displayDiscountType,
      discountValue: displayDiscountValue,
    })
    
    // Clear any existing timeouts
    if (addAnimationTimeoutRef.current) clearTimeout(addAnimationTimeoutRef.current)
    if (resetAnimationTimeoutRef.current) clearTimeout(resetAnimationTimeoutRef.current)
    
    // Step 2: After 500ms, show "যোগ হয়েছে!"
    addAnimationTimeoutRef.current = setTimeout(() => {
      setIsAdding(false)
      setIsAdded(true)
      showToast()
    }, 500)
    
    // Step 3: After another 800ms, reset to normal
    resetAnimationTimeoutRef.current = setTimeout(() => {
      setIsAdded(false)
    }, 1300)
  }

  // Handle Buy Now - adds to cart and navigates to checkout
  const handleBuyNow = () => {
    if (!selectedProduct) return
    
    // Add current product with selected variant to cart first
    addToCart({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: displayPrice,
      oldPrice: selectedProduct.oldPrice || selectedProduct.price,
      img: selectedProduct.image,
      weight: displayVariantName,
      quantity: quantity,
      category: selectedProduct.category,
      categoryId: selectedProduct.categoryId || undefined,
      offer: hasOffer,
      discountType: displayDiscountType,
      discountValue: displayDiscountValue,
    })
    
    // Then navigate to checkout
    router.push('/checkout')
  }

  // Build the product to display - use selected product or fallback
  const sampleProduct: CartItem = selectedProduct ? {
    id: selectedProduct.id,
    name: selectedProduct.name,
    price: displayPrice,
    oldPrice: selectedProduct.oldPrice || selectedProduct.price,
    img: selectedProduct.image,
    weight: displayVariantName,
    quantity: 1
  } : { id: 99, name: 'Organic Premium Carrots', price: 80, oldPrice: 95, img: 'https://i.postimg.cc/B6sD1hKt/1000020579-removebg-preview.png', weight: '1 KG', quantity: 1 }

  // Calculate discount badge text
  const hasDiscount = displayDiscountValue > 0 || (selectedProduct?.oldPrice && selectedProduct.oldPrice > displayPrice)
  const discountBadgeText = displayDiscountValue > 0
    ? (displayDiscountType === 'pct' ? `${displayDiscountValue}%` : `TK ${roundPrice(displayDiscountValue)}`)
    : selectedProduct?.discount

  return (
    <div className="bg-white w-full p-5 md:p-20 min-h-screen">
      {/* Local Toast for review feedback */}
      {toast.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 text-white px-8 py-4 rounded-xl animate-toast-in">
            <div className="flex items-center gap-3">
              <i className={`text-2xl ${toast.type === 'success' ? 'ri-checkbox-circle-fill text-green-400' : 'ri-close-circle-fill text-red-400'}`}></i>
              <span className="font-semibold text-lg font-bangla">{toast.message}</span>
            </div>
          </div>
          <style jsx>{`
            @keyframes toast-in {
              0% { opacity: 0; transform: scale(0.9) translateY(-10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-toast-in { animation: toast-in 0.25s ease-out forwards; }
          `}</style>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
        <div className="flex flex-col w-full">
          <div className="flex-grow relative w-full bg-transparent rounded-2xl overflow-hidden border border-gray-200 h-[280px] md:h-[350px]">
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md z-10 shadow-md">
                -{discountBadgeText}
              </div>
            )}
            <img src={productImages[selectedImageIndex] || sampleProduct.img} className="absolute inset-0 w-full h-full object-contain" alt={sampleProduct.name} onError={handleImageError} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 flex-shrink-0">
            {(productImages.length > 0 ? productImages : [sampleProduct.img]).slice(0, 4).map((img, i) => (
              <div 
                key={i} 
                className={`aspect-square bg-transparent rounded-lg overflow-hidden cursor-pointer transition-opacity ${i === selectedImageIndex ? 'border-2 border-[#16a34a]' : 'border border-gray-200 hover:opacity-80'}`}
                onClick={() => setSelectedImageIndex(i)}
              >
                <img src={img} className="w-full h-full object-cover" alt={`Product thumbnail ${i + 1}`} onError={handleImageError} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-3xl font-bold text-[#1F2937] leading-tight mb-3">{sampleProduct.name}</h1>
          <div className="flex items-center flex-wrap gap-2 mb-5">
            <span className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>{displayVariantName}</span>
            <span className="text-base text-[#6B7280]" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>এর দাম</span>
            <span className="text-xl font-bold text-[#16a34a]">TK {roundPrice(displayPrice)}</span>
            {originalPrice > displayPrice && (
              <span className="text-sm text-gray-400 line-through font-medium">TK {roundPrice(originalPrice)}</span>
            )}
          </div>
          <p className="text-base text-[#6B7280] leading-relaxed mb-6 line-clamp-3 whitespace-pre-wrap">{parseBoldText(selectedProduct?.shortDesc || 'Farm-fresh organic produce handpicked from local farms. Crisp, sweet, and perfect for your needs. Rich in essential vitamins and nutrients.')}</p>

          {/* Variant Selection */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Select an option</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedProductVariants.length > 0 ? (
                selectedProductVariants.map((variant, index) => (
                  <button 
                    key={variant.id}
                    onClick={() => setSelectedVariantIndex(index)}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      border: index === selectedVariantIndex ? '2px solid #16a34a' : '1px solid #e2e8f0', 
                      background: 'transparent', 
                      color: index === selectedVariantIndex ? '#16a34a' : '#64748b', 
                      fontSize: '13px', 
                      fontWeight: index === selectedVariantIndex ? 600 : 500, 
                      cursor: 'pointer' 
                    }}
                  >{variant.name}</button>
                ))
              ) : (
                <button style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid #16a34a', background: 'transparent', color: '#16a34a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>1 KG</button>
              )}
            </div>
          </div>

          {/* Line 1: Quantity + Add to Cart */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}
              ><i className="ri-subtract-line"></i></button>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', minWidth: '32px', textAlign: 'center' }}>{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}
              ><i className="ri-add-line"></i></button>
            </div>
            <button 
              onClick={handleAddToCart} 
              disabled={isAdding || isAdded}
              style={{ 
                flex: 1, 
                border: '2px solid #16a34a', 
                color: '#16a34a', 
                height: '44px', 
                borderRadius: '10px', 
                fontSize: '14px', 
                fontWeight: 700, 
                background: 'transparent',
                cursor: isAdding || isAdded ? 'default' : 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                transition: 'all 0.3s ease'
              }}
            >
              {isAdding ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i> যোগ হচ্ছে...
                </>
              ) : isAdded ? (
                <>
                  <i className="ri-checkbox-circle-fill"></i> যোগ হয়েছে!
                </>
              ) : (
                <>
                  <i className="ri-shopping-cart-line"></i> কার্টে যোগ করুন
                </>
              )}
            </button>
          </div>

          {/* Line 2: Buy Now with Bengali text */}
          <button 
            onClick={handleBuyNow} 
            style={{ 
              width: '100%', 
              background: '#16a34a', 
              color: 'white', 
              height: '52px', 
              borderRadius: '12px', 
              fontSize: '16px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              marginBottom: '12px',
              fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
            }}
          >
            <i className="ri-flashlight-fill" style={{ fontSize: '18px' }}></i> ক্যাশ অন ডেলিভারিতে অর্ডার করুন
          </button>

          {/* Line 3: Direct Order via Call/WhatsApp - Only show if phone is configured */}
          {settings.phoneNumber && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              gap: '10px', 
              padding: '14px', 
              background: '#f0fdf4', 
              borderRadius: '12px', 
              border: '1px solid #86efac' 
            }}>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600, fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
                সরাসরি কল বা হোয়াটসঅ্যাপে অর্ডার করুন
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a href={`tel:+${settings.phoneNumber.replace(/\D/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '14px' }}>
                  <i className="ri-phone-fill" style={{ fontSize: '16px' }}></i> {settings.phoneNumber}
                </a>
                <div style={{ width: '1px', height: '16px', background: '#86efac' }}></div>
                <a href={`https://wa.me/${(settings.whatsappNumber || settings.phoneNumber).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '14px' }}>
                  <i className="ri-whatsapp-fill" style={{ fontSize: '16px' }}></i> {settings.whatsappNumber || settings.phoneNumber}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        {/* Divider line above tabs */}
        <div className="border-t border-gray-200 mb-2"></div>
        <div className="flex justify-center items-center gap-3 py-1.5 mb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => setActiveTab('desc')} className={`text-sm transition-colors ${activeTab === 'desc' ? 'text-[#1F2937] font-bold' : 'text-gray-400 font-medium'}`}>Description</button>
          <div className="w-px h-3 bg-gray-300 shrink-0"></div>
          <button onClick={() => setActiveTab('rev')} className={`text-sm transition-colors ${activeTab === 'rev' ? 'text-[#1F2937] font-bold' : 'text-gray-400 font-medium'}`}>Reviews</button>
          <div className="w-px h-3 bg-gray-300 shrink-0"></div>
          <button onClick={() => setActiveTab('qa')} className={`text-sm transition-colors ${activeTab === 'qa' ? 'text-[#1F2937] font-bold' : 'text-gray-400 font-medium'}`}>FAQ</button>
        </div>
        {/* Divider line below tabs */}
        <div className="border-t border-gray-200 mb-4"></div>
        <div>
          {activeTab === 'desc' && (
            <div className="fade-in text-[0.9rem] text-[#6B7280] leading-7 text-left">
              {selectedProduct?.longDesc ? (
                <ExpandableDescription text={selectedProduct.longDesc} />
              ) : (
                <>
                  <p className="mb-4 whitespace-pre-wrap">{parseBoldText(selectedProduct?.shortDesc || 'Fresh and quality product sourced directly from trusted local farms.')}</p>
                  <ul className="text-left text-xs space-y-2 mt-4">
                    <li className="flex items-center gap-2"><i className="ri-check-line text-[#16a34a]"></i> 100% Fresh & Quality Assured</li>
                    <li className="flex items-center gap-2"><i className="ri-check-line text-[#16a34a]"></i> Sourced from Local Farms</li>
                    <li className="flex items-center gap-2"><i className="ri-check-line text-[#16a34a]"></i> Carefully Packed for Freshness</li>
                  </ul>
                </>
              )}
            </div>
          )}
          {activeTab === 'rev' && (
            <div className="fade-in">
              <div className="flex justify-center mb-6 cursor-pointer text-[#16a34a]" onClick={() => setIsModalOpen(true)}>
                <div className="flex items-center gap-2"><i className="ri-edit-circle-line text-lg"></i><span className="text-sm font-semibold underline decoration-dotted">Write a review</span></div>
              </div>
              {productReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="ri-chat-3-line text-4xl mb-2 block"></i>
                  <p className="text-sm">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 fade-in w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-[#16a34a] flex items-center justify-center text-xs font-bold">{rev.initials}</div>
                          <span className="text-sm font-bold text-[#1F2937]">{rev.name}</span>
                          <div className="flex text-yellow-400 text-[10px] ml-1">
                            {[1, 2, 3, 4, 5].map(i => <i key={i} className={`${i <= rev.rating ? 'ri-star-fill' : 'ri-star-line'}`}></i>)}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{rev.date}</span>
                      </div>
                      <div className="pl-[44px]">
                        <p className="text-xs text-[#6B7280] leading-relaxed">{rev.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'qa' && (
            <div className="fade-in">
              <div className="space-y-4">
                {selectedProductFaqs.length > 0 ? (
                  selectedProductFaqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-bold text-[#1F2937] mb-1 flex items-center gap-2"><i className="ri-question-fill text-[#16a34a]"></i> {faq.question}</h4>
                      <p className="text-xs text-[#6B7280] pl-6">{faq.answer}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-question-line text-4xl mb-2 block"></i>
                    <p className="text-sm">No FAQs available for this product.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* You May Like Section */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <div className="text-center mb-5 md:mb-6">
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>You May Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 justify-items-start">
            {relatedProducts.map((item) => {
              const hasDiscount = item.oldPrice > item.price
              
              return (
                <div 
                  key={item.id}
                  onClick={() => handleRelatedProductClick(item.id, item.name)}
                  className="bg-white p-3 relative cursor-pointer transition-all duration-300 flex flex-col w-full min-h-[230px] md:min-h-[260px] border border-gray-200 rounded-xl hover:border-[#16a34a] group"
                >
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded z-10">
                      -{item.discount}%
                    </span>
                  )}
                  <div className="flex-grow flex items-center justify-center py-2">
                    <div className="w-full h-[130px] md:h-[150px] flex items-center justify-center">
                      <img src={item.img} alt={item.name} className="w-full h-full object-contain" loading="lazy" onError={handleImageError}/>
                    </div>
                  </div>
                  <div className="flex flex-col mt-auto">
                    <h3 className="text-sm font-medium text-gray-800 truncate font-bangla">{item.name}</h3>
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <span className="text-sm font-semibold text-[#16a34a]">TK {roundPrice(item.price)}</span>
                      {item.oldPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">TK {roundPrice(item.oldPrice)}</span>
                      )}
                    </div>
                    <button 
                      className="w-full text-[15px] md:text-[16px] font-semibold py-2 md:py-2.5 flex items-center justify-center gap-1.5 bg-[#16a34a] text-white rounded-md border-none cursor-pointer transition-all duration-300 hover:bg-[#15803d] active:scale-95 font-bangla" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({ id: item.id, name: item.name, price: item.price, oldPrice: item.oldPrice, img: item.img, weight: item.weight, quantity: 1 });
                      }}
                    >
                      <i className="ri-shopping-cart-line text-sm md:text-base"></i>
                      কার্টে যোগ করুন
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-center text-lg font-bold text-[#1F2937] mb-4">Write a Review</h3>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <i key={i} className={`ri-star-${i <= userRating ? 'fill' : 'line'} text-2xl cursor-pointer transition-colors ${i <= userRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} onClick={() => setUserRating(i)}></i>
              ))}
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Your Name</label>
                <input id="reviewName" type="text" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#16a34a]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Review</label>
                <textarea id="reviewText" rows={3} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#16a34a] resize-none"></textarea>
              </div>
            </div>
            <button onClick={handleSubmitReview} className="w-full py-3 bg-[#16a34a] text-white font-bold rounded-lg shadow-lg hover:bg-[#15803d] transition-colors">Submit Review</button>
          </div>
        </div>
      )}
    </div>
  )
}
