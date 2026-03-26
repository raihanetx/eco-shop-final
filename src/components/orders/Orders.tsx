'use client'

import { ViewType, Order } from '@/types'
import { useShopStore } from '@/store'

interface OrdersProps {
  orders: Order[]
  setView: (v: ViewType, params?: Record<string, string>) => void
}

// Enhanced status configuration with Bengali labels
interface StatusConfig {
  bg: string
  icon: string
  textBn: string  // Bengali text for customers
  textEn: string  // English text
  description: string  // Additional description
}

// Get status config based on order status and courier status - using to-do list style icons
const getStatusConfig = (order: Order): StatusConfig => {
  // If canceled, show who canceled it
  if (order.status === 'canceled') {
    if (order.canceledBy === 'customer') {
      return {
        bg: 'bg-red-500',
        icon: 'ri-close-circle-line',
        textBn: 'আপনি বাতিল করেছেন',
        textEn: 'Canceled by You',
        description: 'এই অর্ডারটি আপনি বাতিল করেছেন'
      }
    } else if (order.canceledBy === 'admin') {
      return {
        bg: 'bg-red-600',
        icon: 'ri-close-circle-line',
        textBn: 'এডমিন বাতিল করেছে',
        textEn: 'Canceled by Admin',
        description: 'এই অর্ডারটি এডমিন বাতিল করেছে'
      }
    } else {
      return {
        bg: 'bg-red-500',
        icon: 'ri-close-circle-line',
        textBn: 'বাতিল',
        textEn: 'Canceled',
        description: 'অর্ডার বাতিল হয়েছে'
      }
    }
  }
  
  // If delivered - completed
  if (order.courierStatus === 'delivered') {
    return {
      bg: 'bg-green-600',
      icon: 'ri-checkbox-circle-line',
      textBn: 'ডেলিভারি সম্পন্ন',
      textEn: 'Delivered',
      description: 'আপনার অর্ডার সফলভাবে ডেলিভারি হয়েছে'
    }
  }
  
  // If shipping/on the way - in progress
  if (order.courierStatus === 'shipping' || order.courierStatus === 'on_the_way') {
    return {
      bg: 'bg-purple-600',
      icon: 'ri-loader-3-line',
      textBn: 'ডেলিভারি হচ্ছে',
      textEn: 'Shipping',
      description: 'আপনার পার্সেল রাস্তায় আছে'
    }
  }
  
  // If packaging/processing
  if (order.courierStatus === 'packaging' || order.courierStatus === 'processing') {
    return {
      bg: 'bg-blue-500',
      icon: 'ri-settings-3-line',
      textBn: 'প্যাকেজিং',
      textEn: 'Packaging',
      description: 'আপনার অর্ডার প্যাক করা হচ্ছে'
    }
  }
  
  // If approved by admin (waiting for courier) - list check
  if (order.status === 'approved') {
    return {
      bg: 'bg-blue-600',
      icon: 'ri-list-check-2',
      textBn: 'অনুমোদিত',
      textEn: 'Approved',
      description: 'এডমিন অনুমোদন দিয়েছে, শীঘ্রই ডেলিভারি হবে'
    }
  }
  
  // If pending review - waiting
  if (order.status === 'pending') {
    return {
      bg: 'bg-yellow-500',
      icon: 'ri-file-list-3-line',
      textBn: 'রিভিউতে আছে',
      textEn: 'In Review',
      description: 'আপনার অর্ডার এডমিন রিভিউ করছে'
    }
  }
  
  // Default fallback
  return {
    bg: 'bg-gray-500',
    icon: 'ri-question-line',
    textBn: 'অজানা',
    textEn: 'Unknown',
    description: 'স্ট্যাটাস জানা যাচ্ছে না'
  }
}

export default function Orders({ orders, setView }: OrdersProps) {
  // Get free delivery minimum from store - MUST be at top before any early returns
  const { settings } = useShopStore()
  const freeDeliveryMin = settings.freeDeliveryMin || 599

  if (orders.length === 0) {
    return (
      <div className="order-clean-wrapper">
        <div className="order-clean-container">
          <div className="order-clean-empty">
            <i className="ri-file-list-3-line" style={{ fontSize: '64px', color: '#d1d5db', display: 'block', marginBottom: '16px' }}></i>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111', marginBottom: '8px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              কোনো অর্ডার নেই
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              আপনার অর্ডার ইতিহাস এখানে দেখা যাবে
            </p>
            <button 
              onClick={() => setView('shop')}
              style={{
                padding: '12px 24px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
              }}
            >
              শপিং করুন
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate time ago
  const getTimeAgo = (dateStr: string, timeStr?: string) => {
    try {
      const orderDate = new Date(`${dateStr} ${timeStr || ''}`)
      const now = new Date()
      const diffMs = now.getTime() - orderDate.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffMins < 60) return `${diffMins} মিনিট আগে`
      if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`
      if (diffDays < 7) return `${diffDays} দিন আগে`
      return dateStr
    } catch {
      return 'এখন'
    }
  }

  return (
    <div className="order-clean-wrapper" style={{ paddingBottom: '80px' }}>
      <div className="order-clean-container">
        {/* Free Delivery Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <i className="ri-truck-line text-2xl"></i>
            </div>
            <div>
              <h3 className="font-bold text-base font-bangla">ফ্রি ডেলিভারি</h3>
              <p className="text-white/90 text-sm font-bangla">
                TK {freeDeliveryMin} বা তার বেশি অর্ডারে ডেলিভারি চার্জ ফ্রি
              </p>
            </div>
          </div>
        </div>
        
        <div className="order-clean-list">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order)
            
            // Calculate total discount (offer + coupon)
            const totalDiscount = (order.discount || 0) + (order.couponAmount || 0)
            
            // Check if order is delivered or canceled (no delivery estimate needed)
            const isCompleted = order.status === 'canceled' || 
                              order.courierStatus === 'delivered'

            return (
              <div 
                key={order.id} 
                className="w-full bg-white shadow-xl border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* 1. HEADER: DYNAMIC STATUS & META */}
                <div className={`${statusConfig.bg} text-white p-5 text-center transition-colors duration-300`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <i className={`${statusConfig.icon} text-xl`}></i>
                    <span className="text-lg font-bold font-bangla">{statusConfig.textBn}</span>
                  </div>
                  <p className="text-white/80 text-xs font-bangla">{statusConfig.description}</p>
                  {/* Order ID + Date + Time Ago */}
                  <p className="text-white/90 text-[11px] font-medium tracking-wide mt-2">
                    #{order.id} • {order.date} • {getTimeAgo(order.date, order.time)}
                  </p>
                </div>

                <div className="p-6">
                  {/* 2. CUSTOMER INFO (Name | Phone) */}
                  <div className="bg-gray-50 border border-gray-100 p-3 mb-4 rounded-md">
                    <div className="flex items-center text-sm text-gray-900 mb-1 gap-2">
                      <span className="font-bold text-base font-bangla truncate max-w-[120px]" title={order.customer}>{order.customer}</span>
                      <span className="text-gray-300">|</span>
                      <span className="font-semibold text-gray-700 whitespace-nowrap">{order.phone}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-gray-500">
                      <i className="ri-map-pin-fill text-gray-400 mt-0.5"></i>
                      <span className="font-bangla">{order.address}</span>
                    </div>
                  </div>

                  {/* 3. ESTIMATED DELIVERY TIME - Only show for active orders */}
                  {!isCompleted && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 mb-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <i className="ri-timer-line text-green-600 text-lg"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-green-800 font-bangla">আনুমানিক ডেলিভারি সময়</h3>
                          <p className="text-green-700 text-sm font-semibold font-bangla">৩ থেকে ৭ দিন</p>
                          <p className="text-green-600 text-xs font-bangla">ঢাকার ভেতরে ১-২ দিন, বাইরে ৩-৭ দিন</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. ITEMS LIST (Product • Qty: X) */}
                  <div className="mb-5">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 font-bangla">পণ্য তালিকা</h3>
                    <div className="space-y-2 text-sm">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-700">
                          <span className="font-bangla">
                            {item.name}
                            {item.variant && <span className="text-gray-400"> ({item.variant})</span>}
                            <span className="text-gray-300 mx-1">•</span> 
                            <span className="text-gray-400 font-bangla">পরিমাণ:</span>
                            <span className="text-gray-700">{item.qty}</span>
                          </span>
                          <span className="font-medium">TK {Math.round(item.basePrice * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. TOTAL BREAKDOWN */}
                  <div className="border-t border-dashed border-gray-300 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500 font-bangla">
                      <span>সাবটোটাল</span>
                      <span>TK {Math.round(order.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-500 font-bangla">
                      <span>ডেলিভারি চার্জ</span>
                      <span>{order.delivery > 0 ? `TK ${Math.round(order.delivery)}` : 'ফ্রি'}</span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-red-500 font-bangla">
                        <span>ডিসকাউন্ট + কুপন</span>
                        <span>- TK {Math.round(totalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                      <span className="text-base font-bold text-gray-900 font-bangla">মোট</span>
                      <span className="text-xl font-bold text-green-700">TK {Math.round(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
