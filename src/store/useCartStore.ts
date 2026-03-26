import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem } from '@/types'

interface CartItemWithQty extends CartItem {
  quantity: number
}

// Applied coupon state
export interface AppliedCoupon {
  code: string
  type: 'pct' | 'fixed'
  value: number
  scope: 'all' | 'products' | 'categories'
  applicableProductIds?: number[]
  applicableCategoryIds?: string[]
}

interface CartState {
  items: CartItemWithQty[]
  appliedCoupon: AppliedCoupon | null
  isHydrated: boolean
  // Track if user explicitly added items (not from localStorage restore)
  userAddedToCart: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, qty: number) => void
  clearCart: () => void
  applyCoupon: (coupon: AppliedCoupon | null) => void
  // Auto-check if current cart matches the applied coupon
  checkCouponValidity: () => Promise<boolean>
  setHydrated: (state: boolean) => void
  setUserAddedToCart: (value: boolean) => void
}

// Track cart event to analytics API
const trackCartEvent = async (productId: number, action: 'add' | 'remove') => {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: `cart-${action}`, productId }),
    })
  } catch (e) {
    console.error('Failed to track cart event:', e)
  }
}

// Validate coupon against current cart
const validateCouponWithCart = async (coupon: AppliedCoupon, items: CartItemWithQty[]): Promise<{ valid: boolean, applicableProductIds: number[] }> => {
  try {
    // If scope is 'all', always valid
    if (coupon.scope === 'all') {
      return { valid: true, applicableProductIds: items.map(i => i.id) }
    }
    
    // Check if any items match
    const cartItemsForCoupon = items.map(item => ({
      productId: item.id,
      id: item.id,
      category: item.category || '',
      categoryId: item.categoryId,
      name: item.name
    }))
    
    const response = await fetch(`/api/coupons?code=${encodeURIComponent(coupon.code)}&cartItems=${encodeURIComponent(JSON.stringify(cartItemsForCoupon))}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      return { 
        valid: true, 
        applicableProductIds: result.applicableItems || items.map(i => i.id)
      }
    }
    
    return { valid: false, applicableProductIds: [] }
  } catch (e) {
    console.error('Error validating coupon:', e)
    return { valid: false, applicableProductIds: [] }
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      isHydrated: false,
      // Start as false - will be set to true when user explicitly adds items
      userAddedToCart: false,

      setHydrated: (state: boolean) => {
        set({ isHydrated: state })
      },

      setUserAddedToCart: (value: boolean) => {
        set({ userAddedToCart: value })
      },

      addItem: (item: CartItem) => {
        // Mark that user explicitly added to cart
        set({ userAddedToCart: true })
        
        set((state) => {
          const existingItemIndex = state.items.findIndex((i) => i.id === item.id)
          
          if (existingItemIndex >= 0) {
            // Product already exists - just increase quantity
            const updatedItems = [...state.items]
            const existingItem = updatedItems[existingItemIndex]
            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + 1
            }
            return { items: updatedItems }
          }
          
          // New product - add to cart
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
        
        // Track cart addition
        trackCartEvent(item.id, 'add')
        
        // Auto-validate coupon if exists
        const state = get()
        if (state.appliedCoupon) {
          // Check if new item matches coupon scope
          const coupon = state.appliedCoupon
          let shouldRevalidate = false
          
          if (coupon.scope === 'all') {
            shouldRevalidate = true
          } else if (coupon.scope === 'products' && coupon.applicableProductIds?.includes(item.id)) {
            shouldRevalidate = true
          } else if (coupon.scope === 'categories' && item.categoryId && coupon.applicableCategoryIds?.includes(item.categoryId)) {
            shouldRevalidate = true
          }
          
          if (shouldRevalidate) {
            // Trigger validation in background
            get().checkCouponValidity()
          }
        }
      },

      removeItem: (id: number) => {
        // Track cart removal before removing
        trackCartEvent(id, 'remove')
        
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id)
          
          // Check if removed item affects coupon validity
          if (state.appliedCoupon && state.appliedCoupon.scope !== 'all') {
            // If coupon was for specific products and we removed all of them, remove coupon
            if (state.appliedCoupon.scope === 'products') {
              const hasApplicableItems = newItems.some(item => 
                state.appliedCoupon?.applicableProductIds?.includes(item.id)
              )
              if (!hasApplicableItems) {
                return { items: newItems, appliedCoupon: null }
              }
            }
          }
          
          return { items: newItems }
        })
      },

      updateQuantity: (id: number, qty: number) => {
        set((state) => {
          if (qty <= 0) {
            // Track removal when quantity goes to 0
            trackCartEvent(id, 'remove')
            const newItems = state.items.filter((item) => item.id !== id)
            
            // Check coupon validity after removal
            if (state.appliedCoupon && state.appliedCoupon.scope !== 'all') {
              if (state.appliedCoupon.scope === 'products') {
                const hasApplicableItems = newItems.some(item => 
                  state.appliedCoupon?.applicableProductIds?.includes(item.id)
                )
                if (!hasApplicableItems) {
                  return { items: newItems, appliedCoupon: null }
                }
              }
            }
            
            return { items: newItems }
          }
          
          return {
            items: state.items.map((item) => {
              if (item.id === id) {
                return { ...item, quantity: qty }
              }
              return item
            })
          }
        })
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, userAddedToCart: false })
      },

      applyCoupon: (coupon: AppliedCoupon | null) => {
        set({ appliedCoupon: coupon })
      },

      checkCouponValidity: async () => {
        const state = get()
        if (!state.appliedCoupon || state.items.length === 0) {
          return false
        }
        
        const result = await validateCouponWithCart(state.appliedCoupon, state.items)
        
        if (!result.valid) {
          // Coupon no longer valid - remove it
          set({ appliedCoupon: null })
          return false
        }
        
        // Update applicable product IDs
        set({
          appliedCoupon: {
            ...state.appliedCoupon,
            applicableProductIds: result.applicableProductIds
          }
        })
        
        return true
      },
    }),
    {
      name: 'krishi-bitan-cart',
      storage: createJSONStorage(() => localStorage),
      // Don't persist userAddedToCart - it should start fresh each session
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated flag after rehydration is complete
        if (state) {
          state.setHydrated(true)
        }
      },
    }
  )
)

// Helper functions for computed values
export const getCartSubtotal = (items: CartItemWithQty[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export const getCartTax = (items: CartItemWithQty[]): number => {
  return Math.round(getCartSubtotal(items) * 0.05)
}

export const getCartTotal = (items: CartItemWithQty[]): number => {
  return getCartSubtotal(items) + getCartTax(items)
}
