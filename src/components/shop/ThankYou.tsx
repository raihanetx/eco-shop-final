'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useShopStore } from '@/store'
import { ViewType } from '@/types'

interface ThankYouProps {
  setView?: (v: ViewType, params?: Record<string, string>) => void
  orderNumber?: string
}

export default function ThankYou({ setView, orderNumber }: ThankYouProps) {
  const router = useRouter()
  const { settings, fetchData, settingsLoaded } = useShopStore()
  
  // Fetch settings on mount if not loaded
  useEffect(() => {
    if (!settingsLoaded) {
      fetchData()
    }
    window.scrollTo(0, 0)
  }, [fetchData, settingsLoaded])

  // Get phone and WhatsApp from settings
  const phoneNumber = settings.phoneNumber || ''
  const whatsappNumber = settings.whatsappNumber || phoneNumber
  
  // Format phone number for display (Bengali format)
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return ''
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')
    // Format: +৮৮০১২৩৪৫৬৭ (first 10 digits)
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    const lastDigits = digits.slice(-10)
    return lastDigits.split('').map(d => bengaliDigits[parseInt(d)] || d).join('')
  }

  const handleContinueShopping = () => {
    router.push('/')
  }

  const handleViewOrders = () => {
    router.push('/history')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <style jsx>{`
        .order-card {
          font-family: 'Hind Siliguri', sans-serif;
          background: #ffffff;
          width: 100%;
          max-width: 360px;
          border-radius: 18px;
          padding: 22px 18px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .top-icon {
          font-size: 50px;
          color: #16a34a;
          line-height: 1;
          margin-bottom: 6px;
        }

        .order-card h1 {
          font-size: 20px;
          color: #1e293b;
          margin-bottom: 2px;
          font-weight: 700;
        }

        .order-placed-text {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .order-id-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 14px;
        }

        .order-id-label {
          font-size: 13px;
          color: #166534;
          font-weight: 500;
        }

        .order-id-value {
          font-size: 15px;
          color: #15803d;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }

        .delivery-estimate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
          border-radius: 20px;
          padding: 5px 12px;
          width: fit-content;
          margin: 0 auto 18px;
          border: 1px solid #e2e8f0;
        }

        .delivery-estimate i {
          color: #16a34a;
          font-size: 16px;
        }

        .call-alert {
          background-color: #f0fdf4;
          border: 1px solid #dcfce7;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          gap: 10px;
          text-align: left;
          margin-bottom: 18px;
        }

        .call-alert i {
          color: #16a34a;
          font-size: 18px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .call-alert p {
          font-size: 13px;
          color: #166534;
          line-height: 1.5;
        }

        .contact-area {
          border-top: 1px solid #f1f5f9;
          padding-top: 15px;
          margin-bottom: 20px;
        }

        .contact-label {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 10px;
          display: block;
        }

        .contact-row {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .contact-link {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          color: #1e293b;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 5px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          transition: 0.2s;
        }

        .contact-link:hover {
          background: #f8fafc;
        }

        .contact-link i { 
          font-size: 18px; 
        }
        
        .ri-phone-fill { 
          color: #16a34a; 
        }
        
        .ri-whatsapp-fill { 
          color: #25d366; 
        }

        .action-btns {
          display: flex;
          gap: 10px;
        }

        .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 5px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.2s;
          cursor: pointer;
          border: none;
        }

        .btn-home {
          background-color: #f1f5f9;
          color: #1e293b;
        }

        .btn-home:hover {
          background-color: #e2e8f0;
        }

        .btn-history {
          background-color: #16a34a;
          color: #ffffff;
        }

        .btn-history:hover {
          background-color: #15803d;
        }

        .btn:active { 
          transform: scale(0.97); 
        }
      `}</style>

      <div className="order-card">
        {/* Success Icon */}
        <div className="top-icon">
          <i className="ri-checkbox-circle-fill"></i>
        </div>

        <h1>অর্ডারটি সফল হয়েছে!</h1>
        <p className="order-placed-text">অর্ডার করার জন্য আপনাকে ধন্যবাদ।</p>
        
        {/* Order ID Display */}
        {orderNumber && (
          <div className="order-id-display">
            <span className="order-id-label">অর্ডার নম্বর:</span>
            <span className="order-id-value">{orderNumber}</span>
          </div>
        )}

        {/* Delivery Time */}
        <div className="delivery-estimate">
          <i className="ri-truck-line"></i>
          সম্ভাব্য ডেলিভারি সময়: ৩ থেকে ৭ দিন
        </div>

        {/* Call Verification Text */}
        <div className="call-alert">
          <i className="ri-customer-service-2-line"></i>
          <p>
            অর্ডারটি যাচাই করার জন্য আমাদের প্রতিনিধি আপনাকে কল করতে পারেন, তাই অনুগ্রহ করে ফোন নম্বরটি সচল রাখুন এবং কলটি রিসিভ করুন।
          </p>
        </div>

        {/* Contact Section */}
        <div className="contact-area">
          <span className="contact-label">যেকোনো প্রয়োজনে আমাদের যোগাযোগ করুন</span>
          <div className="contact-row">
            {phoneNumber && (
              <a href={`tel:+${phoneNumber.replace(/\D/g, '')}`} className="contact-link">
                <i className="ri-phone-fill"></i> {formatPhoneDisplay(phoneNumber)}
              </a>
            )}
            {whatsappNumber && (
              <a 
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="contact-link"
              >
                <i className="ri-whatsapp-fill"></i> হোয়াটসঅ্যাপ
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-btns">
          <button onClick={handleContinueShopping} className="btn btn-home">
            <i className="ri-home-4-line"></i> হোম পেজে
          </button>
          <button onClick={handleViewOrders} className="btn btn-history">
            <i className="ri-history-line"></i> অর্ডার হিস্ট্রি
          </button>
        </div>
      </div>
    </div>
  )
}
