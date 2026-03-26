'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { realTimeConnection, RealTimeEvent } from '@/lib/smart-cache'

// ============================================
// REAL-TIME SUBSCRIPTION HOOK
// ============================================

/**
 * Hook to subscribe to real-time server events
 * 
 * Usage:
 * useRealTime('STOCK_UPDATED', (event) => {
 *   console.log('Stock updated:', event.productId, event.stock)
 * })
 */
export function useRealTime(
  eventType: string | '*',
  callback: (event: RealTimeEvent) => void
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const unsubscribe = realTimeConnection.subscribe(
      eventType,
      (event) => callbackRef.current(event)
    )

    return () => unsubscribe()
  }, [eventType])
}

// ============================================
// REAL-TIME STOCK HOOK
// ============================================

/**
 * Hook to track stock updates for specific products
 * 
 * Usage:
 * const { stock, isUpdated } = useRealTimeStock(productId, initialStock)
 */
export function useRealTimeStock(productId: number, initialStock: number) {
  const [stock, setStock] = useState(initialStock)
  const [isUpdated, setIsUpdated] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useRealTime('STOCK_UPDATED', (event) => {
    if (event.type === 'STOCK_UPDATED' && event.productId === productId) {
      setStock(event.stock)
      setIsUpdated(true)
      setLastUpdated(new Date())

      // Reset isUpdated after 2 seconds
      setTimeout(() => setIsUpdated(false), 2000)
    }
  })

  // Update when initialStock changes (from props)
  useEffect(() => {
    setStock(initialStock)
  }, [initialStock])

  return { stock, isUpdated, lastUpdated }
}

// ============================================
// REAL-TIME ORDERS HOOK
// ============================================

/**
 * Hook to track new orders in real-time
 * 
 * Usage:
 * const { newOrders, clearNewOrders } = useRealTimeOrders()
 */
export function useRealTimeOrders() {
  const [newOrders, setNewOrders] = useState<any[]>([])
  const [orderStatusChanges, setOrderStatusChanges] = useState<{ orderId: string | number; status: string }[]>([])

  useRealTime('*', (event) => {
    if (event.type === 'NEW_ORDER') {
      setNewOrders(prev => [event.order, ...prev])
    } else if (event.type === 'ORDER_STATUS_CHANGED') {
      setOrderStatusChanges(prev => [...prev, { orderId: event.orderId, status: event.status }])
    }
  })

  const clearNewOrders = useCallback(() => {
    setNewOrders([])
  }, [])

  const clearStatusChanges = useCallback(() => {
    setOrderStatusChanges([])
  }, [])

  return { newOrders, orderStatusChanges, clearNewOrders, clearStatusChanges }
}

// ============================================
// REAL-TIME REVIEWS HOOK
// ============================================

/**
 * Hook to track new reviews in real-time
 * 
 * Usage:
 * const { newReviews, clearNewReviews } = useRealTimeReviews(productId?)
 */
export function useRealTimeReviews(productId?: number) {
  const [newReviews, setNewReviews] = useState<any[]>([])

  useRealTime('NEW_REVIEW', (event) => {
    if (event.type === 'NEW_REVIEW') {
      // If productId is specified, only track reviews for that product
      if (productId === undefined || event.productId === productId) {
        setNewReviews(prev => [event.review, ...prev])
      }
    }
  })

  const clearNewReviews = useCallback(() => {
    setNewReviews([])
  }, [])

  return { newReviews, clearNewReviews }
}

// ============================================
// CACHE INVALIDATION HOOK
// ============================================

/**
 * Hook to handle cache invalidation events
 * Automatically refetches data when cache is invalidated
 * 
 * Usage:
 * useCacheInvalidation(['products'], () => refetchProducts())
 */
export function useCacheInvalidation(
  keysToListen: string[],
  onInvalidate: (keys: string[]) => void
) {
  const onInvalidateRef = useRef(onInvalidate)
  onInvalidateRef.current = onInvalidate

  useRealTime('CACHE_INVALIDATE', (event) => {
    if (event.type === 'CACHE_INVALIDATE') {
      // Check if any of the keys we're listening for are invalidated
      const shouldInvalidate = event.keys.some(key =>
        keysToListen.some(listenKey =>
          key === listenKey ||
          key.startsWith(listenKey) ||
          listenKey.startsWith(key.replace('*', ''))
        )
      )

      if (shouldInvalidate) {
        onInvalidateRef.current(event.keys)
      }
    }
  })
}

// ============================================
// CONNECTION STATUS HOOK
// ============================================

/**
 * Hook to track real-time connection status
 * 
 * Usage:
 * const { isConnected, reconnect } = useRealTimeConnection()
 */
export function useRealTimeConnection() {
  const [isConnected, setIsConnected] = useState(false)

  useRealTime('CONNECTED', () => {
    setIsConnected(true)
  })

  useEffect(() => {
    // Check initial status
    setIsConnected(realTimeConnection.getConnectionStatus())

    // Poll for status changes (SSE doesn't have a disconnect event reliably)
    const interval = setInterval(() => {
      setIsConnected(realTimeConnection.getConnectionStatus())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const reconnect = useCallback(() => {
    realTimeConnection.connect()
  }, [])

  return { isConnected, reconnect }
}

// ============================================
// SETTINGS UPDATE HOOK
// ============================================

/**
 * Hook to handle settings updates in real-time
 * 
 * Usage:
 * const { settings, updateSettings } = useRealTimeSettings(initialSettings)
 */
export function useRealTimeSettings<T extends Record<string, any>>(initialSettings: T) {
  const [settings, setSettings] = useState<T>(initialSettings)

  // Update when initial settings change
  useEffect(() => {
    setSettings(initialSettings)
  }, [initialSettings])

  useRealTime('SETTINGS_UPDATED', (event) => {
    if (event.type === 'SETTINGS_UPDATED') {
      setSettings(prev => ({ ...prev, ...event.settings }))
    }
  })

  // Also invalidate cache when settings change
  useRealTime('CACHE_INVALIDATE', (event) => {
    if (event.type === 'CACHE_INVALIDATE' && event.keys.includes('settings')) {
      // Trigger refetch of settings
      setSettings(prev => ({ ...prev })) // Force re-render
    }
  })

  const updateSettings = useCallback((updates: Partial<T>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  return { settings, updateSettings }
}
