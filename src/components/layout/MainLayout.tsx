'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import HelpCenter from '@/components/layout/HelpCenter'
import { useCartStore } from '@/store'
import { usePathname } from 'next/navigation'
import { useEffect, useCallback } from 'react'

interface MainLayoutProps {
  children: React.ReactNode
  hideLayout?: boolean
}

export default function MainLayout({ children, hideLayout = false }: MainLayoutProps) {
  const { items: cartItems } = useCartStore()
  const pathname = usePathname()
  
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  
  // Don't show layout on thank-you page
  const showLayout = !hideLayout && pathname !== '/thank-you'
  const showHeader = showLayout
  const showFooter = showLayout
  const showBottomNav = showLayout
  const showHelpCenter = showLayout

  // ============================================
  // SESSION TRACKING
  // ============================================
  const getOrCreateSessionId = useCallback(() => {
    if (typeof window === 'undefined') return ''
    
    let sid = sessionStorage.getItem('analytics_session_id')
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sid)
    }
    return sid
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (typeof window === 'undefined' || !showLayout) return

    const sid = getOrCreateSessionId()
    if (!sid) return

    // Determine page type from pathname
    let page = 'home'
    if (pathname.includes('/product') || pathname.includes('productId')) {
      page = 'product'
    } else if (pathname === '/cart') {
      page = 'cart'
    } else if (pathname === '/checkout') {
      page = 'checkout'
    } else if (pathname.includes('/category')) {
      page = 'category'
    } else if (pathname.includes('/offers')) {
      page = 'offers'
    }

    // Track page view
    fetch('/api/tracking/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pageview',
        sessionId: sid,
        page,
        referrer: document.referrer,
      }),
    }).catch(err => console.error('Failed to track page view:', err))
  }, [pathname, showLayout, getOrCreateSessionId])

  // Session heartbeat (every 30 seconds)
  useEffect(() => {
    if (typeof window === 'undefined' || !showLayout) return

    const sid = getOrCreateSessionId()
    if (!sid) return

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          sessionId: sid,
        }),
      }).catch(err => console.error('Failed to send heartbeat:', err))
    }, 30000)

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const data = JSON.stringify({
        action: 'end',
        sessionId: sid,
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/tracking/session', data)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(heartbeatInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [showLayout, getOrCreateSessionId])

  return (
    <div className="flex flex-col min-h-screen relative pb-16 md:pb-0">
      {showHeader && <Header cartCount={cartCount} />}
      <div className="flex-grow w-full">
        {children}
      </div>
      {showFooter && <Footer setView={() => {}} />}
      {showBottomNav && <BottomNav view="shop" setView={() => {}} />}
      {showHelpCenter && <HelpCenter />}
    </div>
  )
}
