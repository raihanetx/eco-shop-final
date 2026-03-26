import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CACHE_DURATIONS } from '@/lib/smart-cache'

// Types
export interface ShopCategory {
  id: string
  name: string
  type: string
  icon: string | null
  image: string | null
  items: number
  status: string
}

export interface ShopProduct {
  id: number
  name: string
  category: string
  categoryId: string | null
  image: string
  price: number
  oldPrice: number | null
  discount: string
  discountType: string | null
  discountValue: number | null
  offer: boolean
  status: string
  shortDesc: string | null
  longDesc: string | null
  inStock: boolean
  stockCount: number
  hasVariants: boolean
}

export interface ProductVariant {
  id: number
  name: string
  stock: number
  initialStock: number
  price: number
  discount: string
  discountType: string | null
  discountValue: number | null
  productId: number
}

export interface ProductImage {
  id: number
  url: string
  sortOrder: number
  productId: number
}

export interface ProductFaq {
  id: number
  question: string
  answer: string
  sortOrder: number
  productId: number
}

export interface RelatedProduct {
  id: number
  relatedProductId: number
  sortOrder: number
  productId: number
  product: ShopProduct | null
}

export interface ProductReview {
  id: number
  initials: string
  name: string
  rating: number
  text: string
  date: string
  productId: number | null
  customerId: number | null
}

export interface ShopSettings {
  websiteName: string
  slogan: string
  logoUrl: string
  faviconUrl: string
  heroImages: string[]
  whatsappNumber: string
  phoneNumber: string
  facebookUrl: string
  messengerUsername: string
  insideDhakaDelivery: number
  outsideDhakaDelivery: number
  freeDeliveryMin: number
  universalDelivery: boolean
  universalDeliveryCharge: number
  firstSectionName: string
  firstSectionSlogan: string
  secondSectionName: string
  secondSectionSlogan: string
  thirdSectionName: string
  thirdSectionSlogan: string
  heroAnimationSpeed?: number
  heroAnimationType?: string
}

// Default settings (minimal defaults - actual data comes from database)
const defaultSettings: ShopSettings = {
  websiteName: 'EcoMart',
  slogan: 'Your trusted marketplace for fresh organic products and groceries.',
  logoUrl: '', // Empty - will be loaded from database
  faviconUrl: '',
  heroImages: [], // Empty - will be loaded from database
  whatsappNumber: '',
  phoneNumber: '',
  facebookUrl: '',
  messengerUsername: '',
  insideDhakaDelivery: 60,
  outsideDhakaDelivery: 120,
  freeDeliveryMin: 500,
  universalDelivery: false,
  universalDeliveryCharge: 60,
  firstSectionName: 'Categories',
  firstSectionSlogan: '',
  secondSectionName: 'Offers',
  secondSectionSlogan: '',
  thirdSectionName: 'Featured',
  thirdSectionSlogan: '',
}

interface ShopState {
  categories: ShopCategory[]
  products: ShopProduct[]
  settings: ShopSettings
  variantMap: Record<number, ProductVariant[]>
  selectedProductId: number | null
  selectedProductVariants: ProductVariant[]
  selectedProductImages: ProductImage[]
  selectedProductFaqs: ProductFaq[]
  selectedProductRelated: RelatedProduct[]
  selectedProductReviews: ProductReview[]
  selectedProduct: ShopProduct | null
  isLoading: boolean
  isProductLoading: boolean
  settingsLoaded: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string | null
  lastFetch: number

  // Actions
  fetchData: () => Promise<void>
  setSelectedProduct: (productId: number | null) => Promise<void>
  addReview: (productId: number, review: { name: string; rating: number; text: string }) => Promise<{ success: boolean; error?: string }>
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
}

// Cache duration - don't refetch if data is fresh
const CACHE_DURATION = CACHE_DURATIONS.SHOP_DATA

// SMART: In-memory cache (fast, survives re-renders)
let memoryCacheData: {
  categories: ShopCategory[]
  products: ShopProduct[]
  settings: ShopSettings
  variantMap: Record<number, ProductVariant[]>
  lastFetch: number
  lastModified: number // Server timestamp - used to detect changes
} | null = null

// SMART: Check localStorage for initial data (instant after refresh!)
const LOCAL_CACHE_KEY = 'shop_data'

// Note: We don't read localStorage here to avoid hydration mismatch
// The cache will be checked in fetchData after component mounts

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      categories: [],
      products: [],
      settings: defaultSettings,
      variantMap: {},
      selectedProductId: null,
      selectedProductVariants: [],
      selectedProductImages: [],
      selectedProductFaqs: [],
      selectedProductRelated: [],
      selectedProductReviews: [],
      selectedProduct: null,
      isLoading: true, // Start with loading to avoid hydration mismatch
      isProductLoading: false,
      settingsLoaded: false,
      error: null,
      searchQuery: '',
      selectedCategory: null,
      lastFetch: 0,

      // SUPER SMART: Single conditional API call for instant updates
      // If data hasn't changed, server returns 304 (tiny response ~100 bytes)
      // If data changed, server returns full data (~50KB)
      fetchData: async () => {
        const now = Date.now()
        
        // Get cached data
        const cachedData = memoryCacheData
        
        // ============================================
        // STEP 1: Check memory cache (instant - no network!)
        // Only use if within cache duration
        // ============================================
        if (cachedData && now - cachedData.lastFetch < CACHE_DURATION) {
          // We have fresh cache - use it immediately (fastest!)
          set({
            categories: cachedData.categories,
            products: cachedData.products,
            settings: cachedData.settings,
            variantMap: cachedData.variantMap,
            isLoading: false,
            settingsLoaded: true,
          })
          return
        }
        
        // ============================================
        // STEP 2: Memory cache expired or missing
        // Make conditional request to server
        // ============================================
        
        // Try to get localStorage cache as backup
        let localCacheData: typeof memoryCacheData = null
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`cache_${LOCAL_CACHE_KEY}`)
            if (raw) {
              const cached = JSON.parse(raw)
              if (cached.data) {
                localCacheData = cached.data
              }
            }
          } catch {
            // Ignore errors
          }
        }
        
        // Use the best cache we have (memory or localStorage)
        const bestCache = cachedData || localCacheData
        const bestLastModified = bestCache?.lastModified || 0
        
        // Show cached data immediately if we have it (optimistic UI)
        if (bestCache) {
          set({
            categories: bestCache.categories,
            products: bestCache.products,
            settings: bestCache.settings,
            variantMap: bestCache.variantMap,
            isLoading: false,
            settingsLoaded: true,
          })
        } else {
          set({ isLoading: true, error: null })
        }

        try {
          // ============================================
          // SUPER SMART: Conditional request!
          // Send our cached timestamp to server
          // ============================================
          const url = bestLastModified > 0 
            ? `/api/shop-data?ifModifiedSince=${bestLastModified}`
            : '/api/shop-data'
            
          const response = await fetch(url, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          // ============================================
          // CASE 1: 304 NOT MODIFIED - Cached data is still valid!
          // ============================================
          if (response.status === 304) {
            // Server says: "Your cache is still valid!"
            // Just update our cache timestamp
            if (bestCache) {
              memoryCacheData = { ...bestCache, lastFetch: now }
            }
            return // UI already showing cached data
          }
          
          const result = await response.json()
          
          // ============================================
          // CASE 2: notModified flag - Cached data is valid
          // ============================================
          if (result.notModified) {
            if (bestCache) {
              memoryCacheData = { ...bestCache, lastFetch: now }
            }
            return
          }
          
          // ============================================
          // CASE 3: FRESH DATA - Server has newer data!
          // ============================================
          if (result.success && result.data) {
            // Use variantMap from API (includes discount info)
            const variantMap: Record<number, ProductVariant[]> = {}
            if (result.data.variantMap) {
              Object.entries(result.data.variantMap).forEach(([id, variants]: [string, any]) => {
                variantMap[parseInt(id)] = variants.map((v: any) => ({
                  id: v.id,
                  name: v.name,
                  stock: v.stock,
                  initialStock: v.stock,
                  price: v.price,
                  discount: v.discount || '0%',
                  discountType: v.discountType || 'pct',
                  discountValue: v.discountValue || 0,
                  productId: parseInt(id),
                }))
              })
            }

            const lastModified = result.lastModified || now
            
            const newData = {
              categories: result.data.categories,
              products: result.data.products,
              settings: result.data.settings,
              variantMap: variantMap,
              lastFetch: now,
              lastModified,
            }

            // SMART: Update memory cache (instant access)
            memoryCacheData = newData

            // SMART: Update localStorage cache (survives refresh!)
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`cache_${LOCAL_CACHE_KEY}`, JSON.stringify({
                  data: newData,
                  expiry: now + CACHE_DURATIONS.SETTINGS,
                }))
              } catch {
                // Data too large, that's fine - memory cache works
              }
            }

            set({
              categories: result.data.categories,
              products: result.data.products,
              settings: result.data.settings,
              variantMap: variantMap,
              settingsLoaded: true,
              isLoading: false,
              lastFetch: now,
            })
          } else {
            set({ error: result.error || 'Failed to load', isLoading: false })
          }
        } catch (error) {
          console.error('Shop data fetch error:', error)
          // If we have cached data, keep showing it even on error
          if (!bestCache) {
            set({ error: 'Failed to load data', isLoading: false })
          }
        }
      },

      // SINGLE API CALL for product details
      setSelectedProduct: async (productId: number | null) => {
        set({ selectedProductId: productId })
        
        if (!productId) {
          set({
            selectedProduct: null,
            selectedProductVariants: [],
            selectedProductImages: [],
            selectedProductFaqs: [],
            selectedProductRelated: [],
            selectedProductReviews: [],
          })
          return
        }

        // Set product from cache immediately for instant display
        const { products, variantMap } = get()
        const product = products.find(p => p.id === productId)
        if (product) {
          set({
            selectedProduct: product,
            selectedProductVariants: (variantMap[productId] || []).map(v => ({
              ...v,
              initialStock: v.stock,
              discount: '0%',
              discountType: null,
              discountValue: null,
              productId: productId
            }))
          })
        }
        
        set({ isProductLoading: true })
        
        try {
          // SINGLE API CALL for all product details
          const response = await fetch(`/api/product-details?productId=${productId}`)
          const result = await response.json()
          
          if (result.success) {
            set({
              selectedProduct: result.data.product,
              selectedProductVariants: result.data.variants,
              selectedProductImages: result.data.images,
              selectedProductFaqs: result.data.faqs,
              selectedProductRelated: result.data.relatedProducts.map((p: any) => ({
                id: p.id,
                relatedProductId: p.id,
                sortOrder: 0,
                productId: productId,
                product: p
              })),
              selectedProductReviews: result.data.reviews,
              isProductLoading: false,
            })
          } else {
            set({ isProductLoading: false })
          }
        } catch (error) {
          console.error('Product details fetch error:', error)
          set({ isProductLoading: false })
        }
      },

      addReview: async (productId: number, review: { name: string; rating: number; text: string }) => {
        try {
          const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...review, productId })
          })
          const data = await response.json()
          if (data.success) {
            set(state => ({
              selectedProductReviews: [data.data, ...state.selectedProductReviews]
            }))
            return { success: true }
          }
          return { success: false, error: data.error || 'Failed to submit review' }
        } catch (error) {
          console.error('Error adding review:', error)
          return { success: false, error: 'Network error. Please try again.' }
        }
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),
    }),
    {
      name: 'shop-storage',
      // SMART: Only persist lastFetch timestamp (tiny data, no quota issues!)
      // Products/categories/settings are cached in memory, NOT localStorage
      partialize: (state) => ({
        lastFetch: state.lastFetch,
      }),
    }
  )
)
