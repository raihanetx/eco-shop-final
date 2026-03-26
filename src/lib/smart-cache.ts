// Smart Cache - Intelligent caching with static vs dynamic data separation

// In-memory cache for fast access (cleared on page refresh)
const memoryCache = new Map<string, { data: any; timestamp: number }>()

// ============================================
// SMART CACHE DURATIONS - Different TTLs for different data types
// ============================================

export const CACHE_DURATIONS = {
  // STATIC DATA - These rarely change, cache aggressively
  PRODUCTS: 5 * 60 * 1000,        // 5 minutes - products, prices, descriptions
  CATEGORIES: 10 * 60 * 1000,     // 10 minutes - categories rarely change
  SETTINGS: 10 * 60 * 1000,       // 10 minutes - settings rarely change
  COUPONS: 5 * 60 * 1000,         // 5 minutes - coupons are relatively static

  // DYNAMIC DATA - These change frequently, use real-time push
  STOCK: 0,                       // NO CACHE - real-time push via SSE
  ORDERS: 0,                      // NO CACHE - real-time push via SSE
  REVIEWS: 0,                     // NO CACHE - real-time push via SSE
  ABANDONED: 0,                   // NO CACHE - real-time push via SSE
  CUSTOMERS: 30 * 1000,           // 30 seconds - semi-dynamic

  // LEGACY compatibility
  SHOP_DATA: 5 * 60 * 1000,       // 5 minutes - static shop data
  PRODUCT: 5 * 60 * 1000,         // 5 minutes - product details
  ANALYTICS: 60 * 1000,           // 1 minute - analytics dashboard
}

// ============================================
// DATA CLASSIFICATION - Which data is static vs dynamic
// ============================================

export const DATA_TYPES = {
  STATIC: ['products', 'categories', 'settings', 'coupons', 'shop-data'],
  DYNAMIC: ['stock', 'orders', 'reviews', 'abandoned', 'customers'],
} as const

// ============================================
// REAL-TIME EVENT TYPES
// ============================================

export type RealTimeEvent =
  | { type: 'STOCK_UPDATED'; productId: number; stock: number; variantId?: number }
  | { type: 'NEW_ORDER'; orderId: string | number; order: any }
  | { type: 'ORDER_STATUS_CHANGED'; orderId: string | number; status: string }
  | { type: 'NEW_REVIEW'; productId: number; review: any }
  | { type: 'ABANDONED_CHECKOUT'; checkoutId: number; checkout: any }
  | { type: 'CACHE_INVALIDATE'; keys: string[] }
  | { type: 'SETTINGS_UPDATED'; settings: Record<string, any> }

// ============================================
// SSE CONNECTION MANAGER
// ============================================

class RealTimeConnection {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false

  connect() {
    if (this.eventSource) return

    try {
      this.eventSource = new EventSource('/api/realtime')

      this.eventSource.onopen = () => {
        console.log('[RealTime] Connected to server')
        this.isConnected = true
        this.reconnectAttempts = 0
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealTimeEvent
          this.handleEvent(data)
        } catch (e) {
          // Ignore parse errors
        }
      }

      this.eventSource.onerror = () => {
        console.log('[RealTime] Connection lost, reconnecting...')
        this.isConnected = false
        this.reconnect()
      }
    } catch (error) {
      console.error('[RealTime] Connection error:', error)
      this.reconnect()
    }
  }

  private handleEvent(event: RealTimeEvent) {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(callback => callback(event))
    }
    // Also notify 'any' listeners
    const anyListeners = this.listeners.get('*')
    if (anyListeners) {
      anyListeners.forEach(callback => callback(event))
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[RealTime] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      this.disconnect()
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnected = false
  }

  subscribe(eventType: string | '*', callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // Auto-connect when first subscriber
    if (!this.eventSource) {
      this.connect()
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback)
      // Disconnect if no more listeners
      let totalListeners = 0
      this.listeners.forEach(set => totalListeners += set.size)
      if (totalListeners === 0) {
        this.disconnect()
      }
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }
}

// Singleton instance
export const realTimeConnection = new RealTimeConnection()

// ============================================
// HOOK FOR REAL-TIME SUBSCRIPTIONS
// ============================================

export function useRealTimeSubscription(
  eventType: string | '*',
  callback: (data: RealTimeEvent) => void
) {
  // This should be used in a useEffect in React components
  return {
    subscribe: () => realTimeConnection.subscribe(eventType, callback),
    isConnected: () => realTimeConnection.getConnectionStatus(),
  }
}

// ============================================
// MEMORY CACHE FUNCTIONS
// ============================================

export function getMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)
  if (!cached) return null

  // Check if expired based on key type
  const duration = getCacheDurationForKey(key)
  if (duration > 0 && Date.now() - cached.timestamp > duration) {
    memoryCache.delete(key)
    return null
  }

  return cached.data as T
}

export function setMemoryCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() })

  // Cleanup old entries if cache is too large
  if (memoryCache.size > 50) {
    const oldestKey = memoryCache.keys().next().value
    if (oldestKey) {
      memoryCache.delete(oldestKey)
    }
  }
}

export function invalidateCache(keys: string[]): void {
  keys.forEach(key => {
    // Support wildcard invalidation
    if (key.endsWith('*')) {
      const prefix = key.slice(0, -1)
      memoryCache.forEach((_, k) => {
        if (k.startsWith(prefix)) {
          memoryCache.delete(k)
        }
      })
    } else {
      memoryCache.delete(key)
    }
  })
}

export function clearAllCache(): void {
  memoryCache.clear()
}

// Helper to determine cache duration based on key
function getCacheDurationForKey(key: string): number {
  if (key.includes('stock') || key.includes('orders') || key.includes('reviews')) {
    return CACHE_DURATIONS.STOCK
  }
  if (key.includes('product')) return CACHE_DURATIONS.PRODUCTS
  if (key.includes('category')) return CACHE_DURATIONS.CATEGORIES
  if (key.includes('setting')) return CACHE_DURATIONS.SETTINGS
  if (key.includes('coupon')) return CACHE_DURATIONS.COUPONS
  return CACHE_DURATIONS.SHOP_DATA
}

// ============================================
// LOCAL STORAGE CACHE (survives refresh)
// ============================================

export function getLocalCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(`cache_${key}`)
    if (!raw) return null

    const cached = JSON.parse(raw)

    // Check if expired
    const duration = getCacheDurationForKey(key)
    if (cached.expiry && Date.now() > cached.expiry) {
      localStorage.removeItem(`cache_${key}`)
      return null
    }

    return cached.data as T
  } catch {
    return null
  }
}

export function setLocalCache<T>(key: string, data: T, maxAgeMs?: number): void {
  if (typeof window === 'undefined') return

  const duration = maxAgeMs || getCacheDurationForKey(key)

  // Don't cache dynamic data to localStorage
  if (duration === 0) return

  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      expiry: Date.now() + duration,
    }))
  } catch {
    // localStorage might be full, clear old caches
    clearOldLocalCache()
  }
}

function clearOldLocalCache(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('cache_')) {
        keysToRemove.push(key)
      }
    }
    // Remove half of the cache keys
    keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch {
    // Ignore errors
  }
}

// ============================================
// REQUEST DEDUPLICATION
// ============================================

const pendingRequests = new Map<string, Promise<any>>()

export async function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeMs?: number
): Promise<T> {
  // Check memory cache first
  const cached = getMemoryCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Check if request is already pending
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  // Make new request
  const request = fetcher().then(data => {
    setMemoryCache(key, data)
    pendingRequests.delete(key)
    return data
  })

  pendingRequests.set(key, request)
  return request
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function isCacheFresh(timestamp: number, maxAgeMs: number): boolean {
  return Date.now() - timestamp < maxAgeMs
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Preload image for faster display
export function preloadImage(url: string): void {
  if (!url || url.startsWith('data:')) return
  const img = new Image()
  img.src = url
}

// Prefetch API endpoint
export function prefetchApi(endpoint: string): void {
  if (typeof window === 'undefined') return
  fetch(endpoint, { method: 'GET', credentials: 'include' }).catch(() => {})
}

// Background refresh
export function setupBackgroundRefresh(
  key: string,
  fetcher: () => Promise<void>,
  intervalMs: number
): () => void {
  const interval = setInterval(async () => {
    try {
      await fetcher()
    } catch {
      // Ignore background refresh errors
    }
  }, intervalMs)

  return () => clearInterval(interval)
}
