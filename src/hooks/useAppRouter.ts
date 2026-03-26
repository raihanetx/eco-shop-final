'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type AppRoute = 'shop' | 'product' | 'cart' | 'checkout' | 'history' | 'category' | 'offers' | 'profile' | 'thank-you' | 'about' | 'terms' | 'refund' | 'privacy'

interface NavigateOptions {
  productId?: number
  productName?: string
  categoryName?: string
  orderNumber?: string
}

export function useAppRouter() {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = useCallback((route: AppRoute, options?: NavigateOptions) => {
    window.scrollTo(0, 0)
    
    switch (route) {
      case 'shop':
        router.push('/')
        break
        
      case 'product':
        if (options?.productId && options?.productName) {
          // Create slug from product name
          const slug = options.productName
            .toLowerCase()
            .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100)
          router.push(`/${slug}`)
        }
        break
        
      case 'cart':
        router.push('/cart')
        break
        
      case 'checkout':
        router.push('/checkout')
        break
        
      case 'history':
        router.push('/history')
        break
        
      case 'category':
        if (options?.categoryName) {
          const slug = encodeURIComponent(options.categoryName)
          router.push(`/category/${slug}`)
        }
        break
        
      case 'offers':
        router.push('/offers')
        break
        
      case 'profile':
        router.push('/profile')
        break
        
      case 'thank-you':
        if (options?.orderNumber) {
          router.push(`/thank-you?order=${options.orderNumber}`)
        }
        break
        
      case 'about':
        router.push('/?page=about')
        break
        
      case 'terms':
        router.push('/?page=terms')
        break
        
      case 'refund':
        router.push('/?page=refund')
        break
        
      case 'privacy':
        router.push('/?page=privacy')
        break
        
      default:
        router.push('/')
    }
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  return {
    navigate,
    goBack,
    pathname,
    isHome: pathname === '/',
    isCart: pathname === '/cart',
    isCheckout: pathname === '/checkout',
    isHistory: pathname === '/history',
  }
}
