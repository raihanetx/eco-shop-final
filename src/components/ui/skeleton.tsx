import { cn } from "@/lib/utils"

// ============================================
// PROFESSIONAL SKELETON LOADING COMPONENTS
// ============================================

// Base Skeleton with shimmer effect
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer-pro rounded-md", className)}
      {...props}
    />
  )
}

// Loading Page - Simple skeleton only, no fancy animations
function LoadingPage() {
  return (
    <div className="loading-page-container">
      {/* Simple Logo - No animation */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <i className="ri-shopping-bag-line text-white text-2xl"></i>
        </div>
        <span className="text-2xl font-bold text-gray-800">EcoMart</span>
      </div>
      
      {/* Simple loading text */}
      <p className="text-gray-500 text-sm font-medium">লোড হচ্ছে...</p>
    </div>
  )
}

// Full Page Shop Skeleton - Professional Version
function ShopPageSkeleton() {
  return (
    <main className="flex-grow bg-gray-50">
      {/* Hero Skeleton */}
      <section className="w-full pb-4 md:pb-6">
        <div className="mx-3 mt-3 md:mx-6 md:mt-6">
          <div className="hero-skeleton"></div>
        </div>
      </section>

      {/* Categories Skeleton */}
      <section className="py-2 md:py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="section-header-skeleton">
            <div className="section-header-skeleton-title"></div>
            <div className="section-header-skeleton-subtitle"></div>
          </div>
          
          <div className="flex justify-center gap-3 md:gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="category-skeleton" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="category-skeleton-icon"></div>
                <div className="skeleton-text-line w-12 h-3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer Cards Skeleton */}
      <section className="py-2 md:py-4">
        <div className="px-3 md:px-4">
          <div className="section-header-skeleton mb-3 md:mb-4">
            <div className="section-header-skeleton-title"></div>
            <div className="section-header-skeleton-subtitle"></div>
          </div>
          <div className="flex gap-3 overflow-hidden px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="offer-card-skeleton" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-1/2 h-full skeleton-image"></div>
                <div className="w-1/2 p-2 flex flex-col justify-center gap-2">
                  <div className="skeleton-text-line w-10 h-2"></div>
                  <div className="skeleton-text-line w-4/5 h-3"></div>
                  <div className="skeleton-text-line w-14 h-3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid Skeleton */}
      <section className="pb-8 pt-2 md:pt-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="section-header-skeleton mb-3 md:mb-4">
            <div className="section-header-skeleton-title"></div>
            <div className="section-header-skeleton-subtitle"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

// Product Card Skeleton - Professional Version
function ProductCardSkeleton() {
  return (
    <div className="product-card-skeleton">
      {/* Image Area */}
      <div className="flex-grow flex items-center justify-center py-2">
        <div className="skeleton-image w-full h-[130px] md:h-[150px]"></div>
      </div>
      
      {/* Content Area */}
      <div className="flex flex-col mt-auto">
        {/* Product Name */}
        <div className="skeleton-text-line w-3/4 h-3.5 mb-2"></div>
        
        {/* Price Row */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="skeleton-text-line w-16 h-3.5"></div>
        </div>
        
        {/* Button */}
        <div className="skeleton-button"></div>
      </div>
    </div>
  )
}

// Category Skeleton - Professional Version
function CategorySkeleton() {
  return (
    <div className="category-skeleton">
      <div className="category-skeleton-icon"></div>
      <div className="skeleton-text-line w-12 h-3"></div>
    </div>
  )
}

// Hero Skeleton - Professional Version
function HeroSkeleton() {
  return (
    <div className="hero-skeleton flex items-center justify-center">
      <div className="text-center px-6">
        <div className="skeleton-text-line w-32 h-5 mx-auto mb-3"></div>
        <div className="skeleton-text-line w-48 h-3 mx-auto"></div>
      </div>
    </div>
  )
}

// Offer Card Skeleton - Professional Version
function OfferCardSkeleton() {
  return (
    <div className="offer-card-skeleton">
      {/* Left Side: Image placeholder */}
      <div className="w-1/2 h-full skeleton-image"></div>
      {/* Right Side: Content */}
      <div className="w-1/2 p-2 flex flex-col justify-center gap-1.5">
        <div className="skeleton-text-line w-10 h-2"></div>
        <div className="skeleton-text-line w-4/5 h-3.5"></div>
        <div className="skeleton-text-line w-14 h-3"></div>
      </div>
    </div>
  )
}

// Product Detail Skeleton
function ProductDetailSkeleton() {
  return (
    <div className="bg-white min-h-screen p-4 md:p-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
        {/* Image Section */}
        <div className="flex flex-col">
          <div className="skeleton-image w-full h-[280px] md:h-[350px] rounded-2xl"></div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-image aspect-square rounded-lg"></div>
            ))}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex flex-col">
          {/* Title */}
          <div className="skeleton-text-line w-4/5 h-7 mb-4"></div>
          
          {/* Price Row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="skeleton-text-line w-24 h-6"></div>
            <div className="skeleton-text-line w-16 h-4"></div>
          </div>
          
          {/* Description */}
          <div className="space-y-2 mb-6">
            <div className="skeleton-text-line w-full h-3.5"></div>
            <div className="skeleton-text-line w-full h-3.5"></div>
            <div className="skeleton-text-line w-3/4 h-3.5"></div>
          </div>
          
          {/* Variants */}
          <div className="mb-4">
            <div className="skeleton-text-line w-24 h-3.5 mb-2"></div>
            <div className="flex gap-2">
              <div className="skeleton-button w-20 h-10 rounded-lg"></div>
              <div className="skeleton-button w-20 h-10 rounded-lg"></div>
              <div className="skeleton-button w-20 h-10 rounded-lg"></div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="skeleton-button mt-4"></div>
          <div className="skeleton-button h-14 mt-3"></div>
        </div>
      </div>
    </div>
  )
}

// Cart Item Skeleton
function CartItemSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      <div className="skeleton-image w-16 h-16 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="skeleton-text-line w-4/5 h-3.5"></div>
        <div className="skeleton-text-line w-1/2 h-3"></div>
      </div>
      <div className="skeleton-button w-20 h-8 rounded-lg"></div>
    </div>
  )
}

// Section Header Skeleton
function SectionHeaderSkeleton({ 
  titleWidth = '150px',
  subtitleWidth = '180px',
  className
}: { 
  titleWidth?: string
  subtitleWidth?: string
  className?: string
}) {
  return (
    <div className={cn("section-header-skeleton", className)}>
      <div className="section-header-skeleton-title" style={{ width: titleWidth }}></div>
      <div className="section-header-skeleton-subtitle" style={{ width: subtitleWidth }}></div>
    </div>
  )
}

// Headline Skeleton - for section titles
function HeadlineSkeleton({ 
  className, 
  width = '150px',
  height = '24px',
  centered = false
}: { 
  className?: string
  width?: string
  height?: string
  centered?: boolean
}) {
  return (
    <div 
      className={cn("skeleton-text-line", centered && "mx-auto", className)}
      style={{ width, height }}
    />
  )
}

// Subheadline Skeleton - for section subtitles
function SubheadlineSkeleton({ 
  className,
  width = '200px',
  centered = false
}: { 
  className?: string
  width?: string
  centered?: boolean
}) {
  return (
    <div 
      className={cn("skeleton-text-line mt-1", centered && "mx-auto", className)}
      style={{ width, height: '14px' }}
    />
  )
}

// Text Skeleton - for inline text
function TextSkeleton({ 
  className, 
  lines = 1,
  width 
}: { 
  className?: string
  lines?: number
  width?: string | number
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-text-line"
          style={{ 
            width: width 
              ? (typeof width === 'number' ? `${width}px` : width)
              : (i === lines - 1 ? '60%' : '100%'),
            height: '14px'
          }}
        />
      ))}
    </div>
  )
}

// Content Wrapper with Fade-in Animation
function ContentWrapper({ 
  children, 
  isLoading,
  skeleton,
  className
}: { 
  children: React.ReactNode
  isLoading: boolean
  skeleton: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Skeleton - fades out when loading is done */}
      <div 
        className={cn(
          "transition-all duration-500 ease-out",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"
        )}
      >
        {skeleton}
      </div>
      
      {/* Content - fades in when loading is done */}
      <div 
        className={cn(
          "transition-all duration-500 ease-out content-enter",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  )
}

// Loading Spinner Component
function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  }
  
  return (
    <div 
      className={cn(
        "rounded-full border-gray-200 border-t-green-500 animate-spin",
        sizeClasses[size],
        className
      )}
      style={{ animation: 'spin 1s linear infinite' }}
    />
  )
}

// Loading Dots Component
function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("loading-dots", className)}>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  )
}

// Skeleton Grid - for displaying multiple skeletons
function SkeletonGrid({ 
  count = 8, 
  columns = 4,
  className 
}: { 
  count?: number
  columns?: number
  className?: string 
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-3 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  }
  
  return (
    <div className={cn("grid gap-3 md:gap-5", gridCols[columns as keyof typeof gridCols] || gridCols[4], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Checkout Page Skeleton - Professional loading state
function CheckoutSkeleton() {
  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 50px 16px' }}>
        {/* Order Summary Section */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
          {/* Section Header */}
          <div className="skeleton-shimmer-pro" style={{ width: '180px', height: '24px', marginBottom: '20px', borderRadius: '8px' }}></div>
          
          {/* Product Items */}
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div className="skeleton-image" style={{ width: '60px', height: '60px', borderRadius: '12px', flexShrink: 0 }}></div>
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <div className="skeleton-text-line" style={{ width: '70%', height: '14px', marginBottom: '8px' }}></div>
                <div className="skeleton-text-line" style={{ width: '40%', height: '12px' }}></div>
              </div>
              <div className="skeleton-text-line" style={{ width: '50px', height: '14px', marginLeft: '12px' }}></div>
            </div>
          ))}
          
          {/* Summary */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: '16px' }}>
            <div className="skeleton-text-line" style={{ width: '100%', height: '14px', marginBottom: '10px' }}></div>
            <div className="skeleton-text-line" style={{ width: '100%', height: '14px', marginBottom: '10px' }}></div>
            <div className="skeleton-text-line" style={{ width: '60%', height: '20px', marginTop: '14px' }}></div>
          </div>
          
          {/* Coupon */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <div className="skeleton-text-line" style={{ flex: 1, height: '48px', borderRadius: '12px' }}></div>
            <div className="skeleton-button" style={{ width: '80px' }}></div>
          </div>
        </div>
        
        {/* Customer Info Section */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
          <div className="skeleton-shimmer-pro" style={{ width: '140px', height: '24px', marginBottom: '20px', borderRadius: '8px' }}></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-text-line" style={{ width: '100%', height: '48px', borderRadius: '12px', marginBottom: '16px' }}></div>
          ))}
        </div>
        
        {/* Payment Section */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
          <div className="skeleton-shimmer-pro" style={{ width: '160px', height: '24px', marginBottom: '20px', borderRadius: '8px' }}></div>
          <div className="skeleton-text-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
          <div className="skeleton-text-line" style={{ width: '80%', height: '14px' }}></div>
        </div>
        
        {/* Button */}
        <div className="skeleton-button" style={{ height: '52px', borderRadius: '12px' }}></div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  LoadingPage,
  HeadlineSkeleton,
  SubheadlineSkeleton,
  TextSkeleton,
  ProductCardSkeleton, 
  CategorySkeleton, 
  HeroSkeleton, 
  OfferCardSkeleton,
  ProductDetailSkeleton,
  CartItemSkeleton,
  SectionHeaderSkeleton,
  ContentWrapper,
  ShopPageSkeleton,
  LoadingSpinner,
  LoadingDots,
  SkeletonGrid,
  CheckoutSkeleton
}
