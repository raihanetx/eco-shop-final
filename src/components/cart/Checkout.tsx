'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { ViewType, CartItem } from '@/types'
import { useCartStore, AppliedCoupon } from '@/store/useCartStore'

interface DeliverySettings {
  insideDhaka: number
  outsideDhaka: number
  freeDeliveryMin: number
  universal: boolean
  universalCharge: number
}

interface CheckoutProps {
  setView: (v: ViewType) => void
  onConfirm: (customerInfo: { name: string; phone: string; address: string; note?: string }, couponCode?: string) => void
  cartItems?: CartItem[]
  deliveryCharge?: number
  deliverySettings?: DeliverySettings
  onCheckoutSession?: (sessionId: string) => void
  onRemoveItem?: (id: number) => void
  onUpdateQuantity?: (id: number, qty: number) => void
}

interface ValidatedCoupon {
  code: string
  type: 'pct' | 'fixed'
  value: number
  scope: string
  applicableProductIds?: number[]
}

// Dhaka area keywords for auto-detection
const dhakaKeywords = ['dhaka', 'dhanmondi', 'gulshan', 'uttara', 'mirpur', 'mohammadpur', 'banani', 'badda', 'tejgaon', 'motijheel', 'ramna', 'sabujbagh', 'khilgaon', 'kadamtali', 'demra', 'hazaribagh', 'lalbagh', 'kotwali', 'sutrapur', 'wari', 'chawkbazar', 'bangsal', 'shahbagh', 'paltan', 'jatrabari', 'shyampur', 'cantonment', 'turag', 'darussalam', 'kafrul', 'adabor', 'pallabi', 'sher-e-bangla nagar']

// Persistent session storage key - ONE key for the entire customer journey
const SESSION_KEY = 'ecomart_customer_session'
const DELIVERY_LOCATION_KEY = 'ecomart_delivery_location'

export default function Checkout({ setView, onConfirm, cartItems = [], deliveryCharge = 60, deliverySettings, onCheckoutSession, onRemoveItem, onUpdateQuantity }: CheckoutProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [validatedCoupon, setValidatedCoupon] = useState<ValidatedCoupon | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{name?: string; phone?: string; address?: string}>({})
  
  // Get cart store for coupon persistence and user action tracking
  const { appliedCoupon, applyCoupon, userAddedToCart } = useCartStore()
  const hasLoadedStoredCoupon = useRef(false)
  
  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    // Check initial status
    setIsOffline(!navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: {name?: string; phone?: string; address?: string} = {}
    
    // Name validation
    if (!name.trim()) {
      errors.name = 'নাম লিখুন'
    } else if (name.trim().length < 2) {
      errors.name = 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'
    }
    
    // Phone validation (Bangladesh format: 01XXXXXXXXX, 11 digits)
    const phoneDigits = phone.replace(/\D/g, '')
    if (!phone.trim()) {
      errors.phone = 'মোবাইল নম্বর দিন'
    } else if (phoneDigits.length !== 11) {
      errors.phone = '১১ সংখ্যার মোবাইল নম্বর দিন'
    } else if (!phoneDigits.startsWith('01')) {
      errors.phone = 'সঠিক মোবাইল নম্বর দিন (০১ দিয়ে শুরু)'
    }
    
    // Address validation
    if (!address.trim()) {
      errors.address = 'ঠিকানা দিন'
    } else if (address.trim().length < 10) {
      errors.address = 'সম্পূর্ণ ঠিকানা দিন (কমপক্ষে ১০ অক্ষর)'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Validate phone on blur
  const validatePhone = () => {
    const phoneDigits = phone.replace(/\D/g, '')
    if (phone && phoneDigits.length !== 11) {
      setValidationErrors(prev => ({...prev, phone: '১১ সংখ্যার মোবাইল নম্বর দিন'}))
    } else if (phone && !phoneDigits.startsWith('01')) {
      setValidationErrors(prev => ({...prev, phone: 'সঠিক মোবাইল নম্বর দিন (০১ দিয়ে শুরু)'}))
    } else {
      setValidationErrors(prev => ({...prev, phone: undefined}))
    }
  }
  
  // Validate address on blur
  const validateAddress = () => {
    if (address && address.trim().length < 10) {
      setValidationErrors(prev => ({...prev, address: 'সম্পূর্ণ ঠিকানা দিন (কমপক্ষে ১০ অক্ষর)'}))
    } else {
      setValidationErrors(prev => ({...prev, address: undefined}))
    }
  }
  
  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({show: true, message, type})
    setTimeout(() => {
      setToast({show: false, message: '', type: 'success'})
    }, 2500)
  }
  
  // Track if we already recorded the visit
  const visitRecordedRef = useRef(false)
  const checkoutStartTimeRef = useRef<Date | null>(null)

  // Auto-load stored coupon from cart store
  useEffect(() => {
    if (hasLoadedStoredCoupon.current) return
    if (appliedCoupon && cartItems.length > 0) {
      hasLoadedStoredCoupon.current = true
      setCouponCode(appliedCoupon.code)
      setValidatedCoupon({
        code: appliedCoupon.code,
        type: appliedCoupon.type,
        value: appliedCoupon.value,
        scope: appliedCoupon.scope,
        applicableProductIds: appliedCoupon.applicableProductIds
      })
    }
  }, [appliedCoupon, cartItems.length])

  // Calculate totals from cart items
  const subtotal = Math.round(cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0))
  
  // Calculate dynamic delivery charge based on address and settings
  const calculatedDelivery = useMemo(() => {
    if (!deliverySettings) return deliveryCharge
    
    if (subtotal >= deliverySettings.freeDeliveryMin) {
      return 0
    }
    
    if (deliverySettings.universal) {
      return deliverySettings.universalCharge
    }
    
    const addressLower = address.toLowerCase()
    const isInsideDhaka = dhakaKeywords.some(keyword => addressLower.includes(keyword))
    
    return isInsideDhaka ? deliverySettings.insideDhaka : deliverySettings.outsideDhaka
  }, [address, subtotal, deliverySettings, deliveryCharge])
  
  const discount = validatedCoupon 
    ? (validatedCoupon.type === 'pct' 
        ? Math.round(subtotal * (validatedCoupon.value / 100))
        : Math.min(validatedCoupon.value, subtotal))
    : 0
  
  const total = subtotal - discount + calculatedDelivery

  // Get or create PERSISTENT session ID
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let existingSession = localStorage.getItem(SESSION_KEY)
    
    if (!existingSession) {
      existingSession = `customer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      localStorage.setItem(SESSION_KEY, existingSession)
    }
    
    setSessionId(existingSession)
    if (onCheckoutSession) {
      onCheckoutSession(existingSession)
    }
    
    visitRecordedRef.current = false
  }, [onCheckoutSession])

  // Load saved delivery location
  // Removed - don't auto-fill address

  // Track NEW checkout visit - ONLY if user explicitly added items to cart
  useEffect(() => {
    // Don't track if user hasn't explicitly added items to cart
    if (!sessionId || cartItems.length === 0 || !userAddedToCart) return
    if (visitRecordedRef.current) return

    const trackVisit = async () => {
      try {
        // Record checkout start time
        checkoutStartTimeRef.current = new Date()
        
        const items = cartItems.map(item => ({
          name: item.name,
          variants: [{
            label: item.weight,
            qty: item.quantity || 1
          }]
        }))

        await fetch('/api/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            items,
            subtotal,
            delivery: calculatedDelivery,
            total: subtotal + calculatedDelivery,
            isNewVisit: true,
            checkoutStartedAt: checkoutStartTimeRef.current.toISOString()
          })
        })
        
        visitRecordedRef.current = true
      } catch (error) {
        console.error('Error tracking visit:', error)
      }
    }

    trackVisit()
  }, [sessionId, cartItems.length, userAddedToCart])

  // Update customer info IMMEDIATELY
  useEffect(() => {
    if (!sessionId || cartItems.length === 0 || !visitRecordedRef.current) return
    if (!name && !phone && !address) return

    const updateInfo = async () => {
      try {
        const items = cartItems.map(item => ({
          name: item.name,
          variants: [{ label: item.weight, qty: item.quantity || 1 }]
        }))

        await fetch('/api/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            name,
            phone,
            address,
            items,
            subtotal,
            delivery: calculatedDelivery,
            total: subtotal + calculatedDelivery,
            isNewVisit: false
          })
        })
      } catch (error) {
        console.error('Error updating info:', error)
      }
    }

    updateInfo()
  }, [sessionId, name, phone, address, cartItems.length])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('অনুগ্রহ করে কুপন কোড লিখুন')
      return
    }
    
    setIsValidatingCoupon(true)
    setCouponError(null)
    setValidatedCoupon(null)
    
    try {
      const cartItemsForCoupon = cartItems.map(item => ({
        productId: item.id,
        id: item.id,
        category: item.category || '',
        categoryId: item.categoryId,
        name: item.name
      }))
      
      const response = await fetch(`/api/coupons?code=${encodeURIComponent(couponCode.trim().toUpperCase())}&cartItems=${encodeURIComponent(JSON.stringify(cartItemsForCoupon))}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const newCoupon: ValidatedCoupon = {
          code: result.data.code,
          type: result.data.type,
          value: result.data.value,
          scope: result.data.scope,
          applicableProductIds: result.applicableItems || cartItems.map(i => i.id),
        }
        setValidatedCoupon(newCoupon)
        
        // Save coupon to cart store for auto-apply
        const storeCoupon: AppliedCoupon = {
          code: result.data.code,
          type: result.data.type,
          value: result.data.value,
          scope: result.data.scope,
          applicableProductIds: result.applicableItems || cartItems.map(i => i.id),
        }
        applyCoupon(storeCoupon)
        
        showToast('কুপন সফলভাবে প্রয়োগ হয়েছে!', 'success')
      } else {
        showToast(result.error || 'অবৈধ কুপন কোড', 'error')
      }
    } catch (error) {
      showToast('কুপন যাচাই করতে ব্যর্থ হয়েছে', 'error')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleConfirm = async () => {
    // Check offline status first
    if (isOffline) {
      showToast('ইন্টারনেট সংযোগ নেই। অনুগ্রহ করে সংযোগ করুন।', 'error')
      return
    }
    
    // Validate form
    if (!validateForm()) {
      showToast('অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন', 'error')
      return
    }
    
    if (cartItems.length === 0) {
      showToast('আপনার কার্টে কোনো পণ্য নেই', 'error')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onConfirm({ name, phone, address, note }, validatedCoupon?.code || undefined)
      // Navigation happens in onConfirm, so we don't need to set isSubmitting to false
    } catch (error: any) {
      console.error('Checkout error:', error)
      showToast(error?.message || 'অর্ডার করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="chk-bg">
      {/* Toast Notification */}
      <div className={`chk-toast-msg ${toast.show ? 'show' : ''} ${toast.type}`}>
        <span>{toast.message}</span>
      </div>
      <div className="chk-container">
        {/* Order Summary Section - FIRST */}
        <div className="chk-section" style={{ marginBottom: '16px' }}>
          {/* Section Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="ri-shopping-bag-3-line" style={{ color: 'white', fontSize: '20px' }}></i>
              </div>
              <div>
                <h3 style={{ 
                  fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: '#111827',
                  margin: 0
                }}>অর্ডার সামারি</h3>
                <p style={{ 
                  fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  margin: 0
                }}>{cartItems.length}টি পণ্য</p>
              </div>
            </div>
          </div>
        
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => {
              const couponApplies = validatedCoupon && (
                validatedCoupon.scope === 'all' ||
                validatedCoupon.applicableProductIds?.includes(item.id)
              )
              
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px 0',
                  borderBottom: index < cartItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                  gap: '12px'
                }}>
                  {/* Product Image */}
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f9fafb',
                    border: '1px solid #f3f4f6',
                    flexShrink: 0
                  }}>
                    <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  
                  {/* Product Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1f2937',
                      margin: '0 0 4px 0',
                      lineHeight: 1.4
                    }}>
                      {item.name}
                    </h4>
                    <p style={{
                      fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                      fontSize: '12px',
                      color: '#9ca3af',
                      margin: '0 0 10px 0'
                    }}>
                      {item.weight}
                      {couponApplies && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginLeft: '8px',
                          color: '#16a34a',
                          fontWeight: 500
                        }}>
                          <i className="ri-price-tag-3-line" style={{ fontSize: '12px' }}></i>
                          কুপন প্রযোজ্য
                        </span>
                      )}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                        fontWeight: 500
                      }}>পরিমাণ:</span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '2px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        padding: '2px'
                      }}>
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#374151',
                            fontSize: '16px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                        ><i className="ri-subtract-line"></i></button>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: 600, 
                          color: '#111827', 
                          minWidth: '32px', 
                          textAlign: 'center',
                          fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                        }}>{item.quantity || 1}</span>
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#374151',
                            fontSize: '16px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                        ><i className="ri-add-line"></i></button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price & Delete */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#111827'
                    }}>TK {Math.round(item.price * (item.quantity || 1))}</span>
                    {onRemoveItem && (
                      <button 
                        onClick={() => onRemoveItem(item.id)}
                        style={{
                          background: '#fef2f2',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                          fontWeight: 500,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="ri-delete-bin-line"></i>
                        সরান
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <i className="ri-shopping-cart-line" style={{ fontSize: '28px', color: '#9ca3af' }}></i>
              </div>
              <h4 style={{ 
                color: '#64748b', 
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 4px 0'
              }}>কার্টে কোনো পণ্য নেই</h4>
              <span style={{ 
                fontSize: '13px', 
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                color: '#9ca3af'
              }}>শপ থেকে পণ্য যোগ করুন</span>
            </div>
          )}
          
          {/* Price Summary */}
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '20px', 
            borderTop: '1px solid #f3f4f6' 
          }}>
            {/* Subtotal */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" 
              }}>সাবটোটাল</span>
              <span style={{ 
                fontWeight: 600, 
                color: '#374151', 
                fontSize: '14px'
              }}>TK {Math.round(subtotal)}</span>
            </div>
            
            {/* Delivery */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" 
              }}>ডেলিভারি চার্জ</span>
              <span style={{ 
                fontWeight: 600, 
                color: calculatedDelivery === 0 ? '#16a34a' : '#374151', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {calculatedDelivery === 0 ? (
                  <>
                    <i className="ri-gift-line" style={{ fontSize: '14px' }}></i>
                    ফ্রি!
                  </>
                ) : `TK ${Math.round(calculatedDelivery)}`}
              </span>
            </div>

            {/* Discount */}
            {validatedCoupon && discount > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '12px',
                alignItems: 'center',
                background: '#fef2f2',
                padding: '10px 12px',
                borderRadius: '8px'
              }}>
                <span style={{ 
                  fontSize: '13px', 
                  color: '#dc2626', 
                  fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="ri-coupon-3-line"></i>
                  কুপন ({validatedCoupon.code})
                </span>
                <span style={{ 
                  fontWeight: 600, 
                  color: '#dc2626', 
                  fontSize: '14px'
                }}>- TK {Math.round(discount)}</span>
              </div>
            )}

            {/* Total */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingTop: '16px', 
              marginTop: '4px', 
              borderTop: '1px dashed #e5e7eb',
              background: '#f9fafb',
              margin: '0 -20px -20px -20px',
              padding: '16px 20px 20px 20px',
              borderRadius: '0 0 16px 16px'
            }}>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                color: '#111827', 
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" 
              }}>মোট টাকা</span>
              <span style={{ 
                fontSize: '22px', 
                fontWeight: 800, 
                color: '#16a34a' 
              }}>TK {Math.round(total)}</span>
            </div>
          </div>
          
          {/* Coupon Section */}
          <div style={{ 
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <i className="ri-ticket-2-line" style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '18px'
                }}></i>
                <input 
                  type="text" 
                  placeholder="কুপন কোড লিখুন"
                  className="chk-clean-input"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setValidatedCoupon(null); setCouponError(null); }}
                  onFocus={() => setFocusedField('coupon')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '14px 15px 14px 44px',
                    border: validatedCoupon ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                    background: validatedCoupon ? '#f0fdf4' : '#fafafa',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
              <button 
                onClick={handleApplyCoupon} 
                disabled={isValidatingCoupon} 
                style={{ 
                  fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                  background: validatedCoupon ? '#16a34a' : '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 20px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isValidatingCoupon ? (
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid white', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Apply
                  </>
                )}
              </button>
            </div>
            {validatedCoupon && (
              <div style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#16a34a',
                fontSize: '12px',
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
              }}>
                <i className="ri-checkbox-circle-fill"></i>
                কুপন সফলভাবে প্রয়োগ হয়েছে!
              </div>
            )}
          </div>
        </div>

        {/* Customer Information Section - AFTER Order Summary */}
        <div className="chk-section" style={{ marginBottom: '16px' }}>
          <div className="chk-section-header" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
            <i className="ri-user-line"></i> আপনার তথ্য দিন
          </div>
          <div className="chk-input-wrapper">
            <i className="ri-user-3-line chk-input-icon"></i>
            <input type="text" id="fullname" className="chk-clean-input"
              value={name}
              onChange={(e) => { setName(e.target.value); if (validationErrors.name) setValidationErrors(prev => ({...prev, name: undefined})); }}
              onFocus={() => setFocusedField('fullname')}
              onBlur={() => setFocusedField(null)} />
            <label htmlFor="fullname" className={`chk-input-label ${focusedField === 'fullname' || name ? 'active-label' : ''}`} style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>পুরো নাম</label>
          </div>
          {validationErrors.name && (
            <div className="chk-error-msg" style={{ color: '#dc2626', fontSize: '12px', marginTop: '-12px', marginBottom: '8px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              <i className="ri-error-warning-line" style={{ marginRight: '4px' }}></i>{validationErrors.name}
            </div>
          )}
          <div className="chk-input-wrapper">
            <i className="ri-smartphone-line chk-input-icon"></i>
            <input type="tel" id="phone" className="chk-clean-input"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (validationErrors.phone) setValidationErrors(prev => ({...prev, phone: undefined})); }}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => { setFocusedField(null); validatePhone(); }} />
            <label htmlFor="phone" className={`chk-input-label ${focusedField === 'phone' || phone ? 'active-label' : ''}`} style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>মোবাইল নম্বর</label>
          </div>
          {validationErrors.phone && (
            <div className="chk-error-msg" style={{ color: '#dc2626', fontSize: '12px', marginTop: '-12px', marginBottom: '8px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              <i className="ri-error-warning-line" style={{ marginRight: '4px' }}></i>{validationErrors.phone}
            </div>
          )}
          <div className="chk-input-wrapper">
            <i className="ri-map-pin-2-line chk-input-icon"></i>
            <input type="text" id="address" className="chk-clean-input"
              value={address}
              onChange={(e) => { setAddress(e.target.value); if (validationErrors.address) setValidationErrors(prev => ({...prev, address: undefined})); }}
              onFocus={() => setFocusedField('address')}
              onBlur={() => { setFocusedField(null); validateAddress(); }} />
            <label htmlFor="address" className={`chk-input-label ${focusedField === 'address' || address ? 'active-label' : ''}`} style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>সম্পূর্ণ ঠিকানা</label>
          </div>
          {validationErrors.address && (
            <div className="chk-error-msg" style={{ color: '#dc2626', fontSize: '12px', marginTop: '-12px', marginBottom: '8px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              <i className="ri-error-warning-line" style={{ marginRight: '4px' }}></i>{validationErrors.address}
            </div>
          )}
          <div className="chk-input-wrapper">
            <i className="ri-sticky-note-line chk-input-icon"></i>
            <textarea id="note" className="chk-clean-input chk-textarea-input" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => setFocusedField('note')}
              onBlur={() => setFocusedField(null)} />
            <label htmlFor="note" className={`chk-input-label ${focusedField === 'note' || note ? 'active-label' : ''}`} style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>অর্ডার নোট (Optional)</label>
          </div>
        </div>

        {/* Payment Section */}
        <div className="chk-section" style={{ marginBottom: '16px' }}>
          <div className="chk-section-header" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
            <i className="ri-secure-payment-line"></i> পেমেন্ট পদ্ধতি
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", fontWeight: 500 }}>
              এটি ক্যাশ অন ডেলিভারি অর্ডার। অনুগ্রহ করে পন্য হাতে পেয়ে রাইডারকে <b style={{ color: '#16a34a' }}>TK {Math.round(total)}</b> পরিশোধ করবেন।
            </p>
          </div>
        </div>

        {/* Order Button */}
        <button 
          className="chk-btn-main chk-btn-confirm chk-btn-full" 
          onClick={handleConfirm}
          disabled={isSubmitting}
          style={{ 
            fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", 
            background: isSubmitting ? '#9ca3af' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              অর্ডার প্রসেস হচ্ছে...
            </>
          ) : (
            <>
              <i className="ri-check-double-line" style={{ fontSize: '18px' }}></i> অর্ডার কনফার্ম করুন (TK {Math.round(total)})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
