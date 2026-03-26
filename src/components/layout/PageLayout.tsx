'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import HelpCenter from '@/components/layout/HelpCenter'
import { useCartStore } from '@/store'

interface PageLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export default function PageLayout({ children, showFooter = true }: PageLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { items: cartItems } = useCartStore()
  
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Determine active view from pathname
  const getActiveView = () => {
    if (pathname === '/' || pathname === '') return 'shop'
    if (pathname.startsWith('/product')) return 'product'
    if (pathname.startsWith('/category')) return 'category'
    if (pathname === '/cart') return 'cart'
    if (pathname === '/checkout') return 'checkout'
    if (pathname === '/history') return 'orders'
    if (pathname === '/profile') return 'profile'
    if (pathname === '/offers') return 'offers'
    if (pathname === '/about') return 'about'
    if (pathname === '/terms') return 'terms'
    if (pathname === '/privacy') return 'privacy'
    if (pathname === '/refund') return 'refund'
    if (pathname === '/thank-you') return 'thankyou'
    return 'shop'
  }

  const activeView = getActiveView()

  const handleNavigate = (path: string) => {
    router.push(path || '/')
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex flex-col min-h-screen relative pb-16 md:pb-0">
      {activeView !== 'thankyou' && (
        <Header cartCount={cartCount} />
      )}
      <div className="flex-grow w-full">
        {children}
      </div>
      {showFooter && activeView !== 'thankyou' && <Footer setView={handleNavigate} />}
      {showFooter && activeView !== 'thankyou' && <BottomNav view={activeView} setView={handleNavigate} />}
      {activeView !== 'thankyou' && <HelpCenter />}
    </div>
  )
}
