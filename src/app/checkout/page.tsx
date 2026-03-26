'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import Checkout from '@/components/cart/Checkout'
import { useCartStore, useOrderStore, useShopStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'

function CheckoutContent() {
  const router = useRouter()
  const { navigate } = useAppRouter()
  const { items: cartItems, removeItem, clearCart, isHydrated } = useCartStore()
  const { addOrder } = useOrderStore()
  const { fetchData } = useShopStore()
  
  const [deliverySettings, setDeliverySettings] = useState<{
    insideDhaka: number
    outsideDhaka: number
    freeDeliveryMin: number
    universal: boolean
    universalCharge: number
  }>({
    insideDhaka: 60,
    outsideDhaka: 120,
    freeDeliveryMin: 500,
    universal: false,
    universalCharge: 60
  })
  
  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Fetch delivery settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.success) {
          setDeliverySettings({
            insideDhaka: data.data.inside_dhaka_delivery ?? 60,
            outsideDhaka: data.data.outside_dhaka_delivery ?? 120,
            freeDeliveryMin: data.data.free_delivery_min ?? 500,
            universal: data.data.universal_delivery ?? false,
            universalCharge: data.data.universal_delivery_charge ?? 60
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])
  
  // Calculate delivery charge based on address
  const calculateDeliveryCharge = useCallback((address: string, subtotal: number): number => {
    if (subtotal >= deliverySettings.freeDeliveryMin) return 0
    if (deliverySettings.universal) return deliverySettings.universalCharge
    
    const addressLower = address.toLowerCase()
    const dhakaKeywords = ['dhaka', 'dhanmondi', 'gulshan', 'uttara', 'mirpur', 'mohammadpur', 'banani', 'badda', 'tejgaon', 'motijheel']
    
    const isInsideDhaka = dhakaKeywords.some(keyword => addressLower.includes(keyword))
    
    return isInsideDhaka ? deliverySettings.insideDhaka : deliverySettings.outsideDhaka
  }, [deliverySettings])

  const calculateOfferDiscount = useCallback((item: { price: number; quantity: number; discountType?: 'pct' | 'fixed'; discountValue?: number }): { offerText: string | null; offerDiscount: number } => {
    if (!item.discountValue || item.discountValue <= 0) {
      return { offerText: null, offerDiscount: 0 }
    }
    
    const totalPrice = item.price * item.quantity
    
    if (item.discountType === 'pct') {
      const discount = Math.round(totalPrice * (item.discountValue / 100))
      return { offerText: `${item.discountValue}% OFF`, offerDiscount: discount }
    } else {
      const discount = Math.round(item.discountValue * item.quantity)
      return { offerText: `TK ${item.discountValue} OFF`, offerDiscount: Math.min(discount, totalPrice) }
    }
  }, [])

  const handleConfirmOrder = useCallback(async (customerInfo: { name: string; phone: string; address: string; note?: string }, couponCode?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('handleConfirmOrder called with:', { customerInfo, couponCode, cartItemsCount: cartItems.length })
    }
    
    try {
      const itemsWithOfferDiscount = cartItems.map(item => {
        const { offerText, offerDiscount } = calculateOfferDiscount(item)
        return { ...item, offerText, offerDiscount }
      })
      
      const subtotalBeforeOffer = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
      const totalOfferDiscount = itemsWithOfferDiscount.reduce((sum, item) => sum + item.offerDiscount, 0)
      const subtotalAfterOffer = subtotalBeforeOffer - totalOfferDiscount
      
      const delivery = calculateDeliveryCharge(customerInfo.address, subtotalAfterOffer)
      
      let couponDiscount = 0
      let couponAmount = 0
      
      const total = subtotalAfterOffer - couponDiscount + delivery
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating order:', { orderNumber, subtotalBeforeOffer, totalOfferDiscount, delivery, total })
      }
      
      const orderItemsData = itemsWithOfferDiscount.map(item => ({
        name: item.name,
        variant: item.weight,
        qty: item.quantity || 1,
        basePrice: item.price,
        offerText: item.offerText,
        offerDiscount: item.offerDiscount,
        productId: item.id,
        couponCode: null,
        couponDiscount: 0
      }))
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderNumber,
          orderNumber,
          customerName: customerInfo.name,
          phone: customerInfo.phone,
          address: customerInfo.address,
          note: customerInfo.note || '',
          subtotal: subtotalBeforeOffer,
          delivery,
          discount: totalOfferDiscount,
          couponAmount,
          total,
          paymentMethod: 'Cash on Delivery',
          status: 'pending',
          couponCodes: couponCode ? [couponCode.toUpperCase()] : [],
          items: orderItemsData,
        }),
      })
      
      const result = await response.json()
      if (process.env.NODE_ENV === 'development') {
        console.log('Order API response:', result)
      }
      
      if (result.success) {
        const newOrder = {
          id: orderNumber,
          customer: customerInfo.name,
          phone: customerInfo.phone,
          address: customerInfo.address,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          paymentMethod: 'Cash on Delivery',
          status: 'pending' as const,
          courierStatus: 'Processing',
          subtotal: subtotalBeforeOffer,
          delivery,
          discount: totalOfferDiscount,
          couponCodes: couponCode ? [couponCode.toUpperCase()] : [],
          couponAmount,
          total,
          canceledBy: null,
          items: orderItemsData,
        }
        
        addOrder(newOrder)
        clearCart()
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Navigating to thank-you with orderNumber:', orderNumber)
        }
        
        // Navigate to thank you page
        navigate('thank-you', { orderNumber })
      } else {
        // Throw error so Checkout component can handle it
        throw new Error(result.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Order error:', error)
      throw error // Re-throw so Checkout component can handle it
    }
  }, [cartItems, calculateOfferDiscount, calculateDeliveryCharge, addOrder, clearCart, navigate])
  
  // Handle navigation
  const handleNavigate = useCallback((view: string) => {
    switch (view) {
      case 'shop':
        navigate('shop')
        break
      case 'terms':
        router.push('/?page=terms')
        break
    }
  }, [navigate, router])
  
  // Prepare cart items for display
  const cartItemsForDisplay = cartItems.map(item => ({
    ...item,
    oldPrice: item.oldPrice || item.price,
  }))

  // Show loading while cart is hydrating from localStorage
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    )
  }

  return (
    <Checkout 
      setView={handleNavigate}
      cartItems={cartItemsForDisplay}
      deliverySettings={deliverySettings}
      onConfirm={handleConfirmOrder}
      onRemoveItem={(id) => removeItem(id)}
    />
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <CheckoutContent />
      </MainLayout>
    </Suspense>
  )
}
