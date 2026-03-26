'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Cart from '@/components/cart/Cart'
import { useCartStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'

function CartContent() {
  const { navigate } = useAppRouter()
  const { items: cartItems, addItem: addToCart, removeItem, updateQuantity, clearCart, isHydrated } = useCartStore()
  const [freeDeliveryMin, setFreeDeliveryMin] = useState(500)
  
  // Fetch delivery settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.success) {
          setFreeDeliveryMin(data.data.free_delivery_min ?? 500)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])
  
  // Prepare cart items for display
  const cartItemsForDisplay = cartItems.map(item => ({
    ...item,
    oldPrice: item.oldPrice || item.price,
  }))
  
  // Handle navigation
  const handleNavigate = useCallback((view: string) => {
    switch (view) {
      case 'shop':
        navigate('shop')
        break
      case 'checkout':
        navigate('checkout')
        break
    }
  }, [navigate])

  // Show loading while cart is hydrating from localStorage
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    )
  }

  return (
    <Cart 
      setView={handleNavigate}
      cartItems={cartItemsForDisplay}
      setCartItems={(items) => {
        clearCart()
        items.forEach(item => addToCart(item))
      }}
      onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
      onRemoveItem={(id) => removeItem(id)}
      freeDeliveryMin={freeDeliveryMin}
    />
  )
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <CartContent />
      </MainLayout>
    </Suspense>
  )
}
