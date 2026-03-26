'use client'

import { useState, useEffect } from 'react'
import { ViewType } from '@/types'
import { useShopStore } from '@/store'

interface HelpCenterProps {
  setView?: (v: ViewType) => void
  orderNumber?: string
}

export default function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, fetchData, settingsLoaded } = useShopStore()

  // Fetch settings on mount if not loaded
  useEffect(() => {
    if (!settingsLoaded) {
      fetchData()
    }
  }, [fetchData, settingsLoaded])

  // Get phone and WhatsApp from settings
  const phoneNumber = settings.phoneNumber || ''
  const whatsappNumber = settings.whatsappNumber || phoneNumber

  const handleCall = () => {
    if (phoneNumber) {
      window.location.href = `tel:+${phoneNumber.replace(/\D/g, '')}`
      setIsOpen(false)
    }
  }

  const handleWhatsApp = () => {
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')
      setIsOpen(false)
    }
  }

  const handleMessenger = () => {
    const messengerUsername = settings.messengerUsername
    if (messengerUsername) {
      window.open(`https://m.me/${messengerUsername}`, '_blank')
    }
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-[68px] md:bottom-8 right-4 md:right-8 z-[150] flex flex-col items-center">
      {/* Contact Options - Shows when open with staggered animation */}
      {isOpen && (
        <div className="flex flex-col gap-2 mb-3 items-center">
          {/* Call - Only show if phone is configured */}
          {phoneNumber && (
            <button
              onClick={handleCall}
              className="w-12 h-12 md:w-16 md:h-16 bg-[#16a34a] text-white rounded-full shadow-lg hover:bg-[#15803d] transition-all animate-pop-in flex items-center justify-center"
              style={{ animationDelay: '0ms' }}
              title="Call Us"
            >
              <i className="ri-phone-fill text-lg md:text-2xl"></i>
            </button>
          )}
          {/* WhatsApp - Only show if phone is configured */}
          {whatsappNumber && (
            <button
              onClick={handleWhatsApp}
              className="w-12 h-12 md:w-16 md:h-16 bg-[#16a34a] text-white rounded-full shadow-lg hover:bg-[#15803d] transition-all animate-pop-in flex items-center justify-center"
              style={{ animationDelay: '80ms' }}
              title="WhatsApp"
            >
              <i className="ri-whatsapp-fill text-lg md:text-2xl"></i>
            </button>
          )}
          {/* Messenger */}
          {settings.messengerUsername && (
            <button
              onClick={handleMessenger}
              className="w-12 h-12 md:w-16 md:h-16 bg-[#16a34a] text-white rounded-full shadow-lg hover:bg-[#15803d] transition-all animate-pop-in flex items-center justify-center"
              style={{ animationDelay: '160ms' }}
              title="Messenger"
            >
              <i className="ri-messenger-fill text-lg md:text-2xl"></i>
            </button>
          )}
        </div>
      )}

      {/* Main Help Center Button - Centered with text */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 md:w-16 md:h-16 bg-[#16a34a] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#15803d] transition-all duration-300 ${isOpen ? 'rotate-45' : ''}`}
        >
          <i className={`ri-${isOpen ? 'close' : 'customer-service-2'}-fill text-lg md:text-2xl`}></i>
        </button>
        
        {/* Contact Us Text */}
        {!isOpen && (
          <span 
            className="text-[10px] md:text-sm font-semibold text-[#16a34a] mt-1 cursor-pointer hover:text-[#15803d] text-center"
            onClick={() => setIsOpen(true)}
          >
            Contact Us
          </span>
        )}
      </div>
    </div>
  )
}
