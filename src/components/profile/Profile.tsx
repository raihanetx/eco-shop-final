'use client'

import { useState, useEffect } from 'react'
import { ViewType } from '@/types'
import { useOrderStore } from '@/store'

interface ProfileProps {
  setView: (v: ViewType, params?: Record<string, string>) => void
}

const DELIVERY_LOCATION_KEY = 'ecomart_delivery_location'

export default function Profile({ setView }: ProfileProps) {
  const { orders } = useOrderStore()
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [tempLocation, setTempLocation] = useState('')

  // Get customer info from recent orders
  const recentOrder = orders.length > 0 ? orders[0] : null
  const customerName = recentOrder?.customer || ''
  const customerPhone = recentOrder?.phone || ''

  // Calculate stats
  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  // Get initial delivery location
  const getInitialDeliveryLocation = () => {
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem(DELIVERY_LOCATION_KEY)
      if (savedLocation) return savedLocation
      if (recentOrder?.address) return recentOrder.address
    }
    return ''
  }

  // Load saved delivery location
  useEffect(() => {
    const initialLocation = getInitialDeliveryLocation()
    if (initialLocation && initialLocation !== deliveryLocation) {
      setDeliveryLocation(initialLocation)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentOrder?.address])

  // Save delivery location
  const handleSaveLocation = () => {
    if (tempLocation.trim()) {
      localStorage.setItem(DELIVERY_LOCATION_KEY, tempLocation.trim())
      setDeliveryLocation(tempLocation.trim())
      setShowLocationModal(false)
    }
  }

  // Open modal with current location
  const openLocationModal = () => {
    setTempLocation(deliveryLocation)
    setShowLocationModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 pt-12 pb-20 px-6 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="text-center relative z-10">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl font-bold text-green-500">
              {customerName ? customerName.charAt(0).toUpperCase() : 'G'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">{customerName || 'Guest User'}</h1>
          <p className="text-white/80 text-sm mt-1">{customerPhone || 'No phone yet'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Total Orders</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">TK {Math.round(totalSpent)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Spent</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6 space-y-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setView('orders')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <i className="ri-file-list-3-line text-green-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">My Orders</p>
              <p className="text-xs text-gray-500">{totalOrders} orders placed</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>

          <button 
            onClick={() => setView('cart')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="ri-shopping-bag-line text-blue-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">My Cart</p>
              <p className="text-xs text-gray-500">View items in cart</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>

          <button
            onClick={() => setView('shop')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <i className="ri-store-line text-amber-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Shop</p>
              <p className="text-xs text-gray-500">Browse products</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>
        </div>

        {/* Delivery Location */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button 
            onClick={openLocationModal}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <i className="ri-map-pin-line text-green-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>ডেলিভারি লোকেশন</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {deliveryLocation || 'সেট করুন ডেলিভারি চার্জ অটো ক্যালকুলেট করতে'}
              </p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="ri-question-line text-gray-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Help & Support</p>
              <p className="text-xs text-gray-500">Get help with your orders</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>

          <button 
            onClick={() => setView('about')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="ri-information-line text-gray-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">About Us</p>
              <p className="text-xs text-gray-500">Learn more about us</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>

          <button 
            onClick={() => setView('terms')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="ri-file-text-line text-gray-500"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Terms & Conditions</p>
              <p className="text-xs text-gray-500">Read our policies</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400">EcoMart v1.0.0</p>
        </div>
      </div>

      {/* Delivery Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLocationModal(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-center text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              ডেলিভারি লোকেশন সেট করুন
            </h3>
            <p className="text-center text-xs text-gray-500 mb-4" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              আপনার ঠিকানা দিন, ডেলিভারি চার্জ অটোমেটিক ক্যালকুলেট হবে
            </p>
            <div className="mb-4">
              <textarea 
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                rows={3}
                placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-none"
                style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={handleSaveLocation}
                className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
              >
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
