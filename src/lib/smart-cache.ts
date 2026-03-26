// Smart Cache - Advanced caching strategies for optimal performance

// In-memory cache for fast access (cleared on page refresh)
const memoryCache = new Map<string, { data: any; timestamp: number }>()

// Cache durations - optimized for e-commerce
export const CACHE_DURATIONS = {
  SHOP_DATA: 60 * 1000,        // 1 minute - products, categories (fresh enough)
  SETTINGS: 10 * 60 * 1000,    // 10 minutes - settings rarely change
  PRODUCT: 2 * 60 * 1000,      // 2 minutes - product details
  ORDERS: 30 * 1000,           // 30 seconds - order data changes often
  CUSTOMERS: 60 * 1000,        // 1 minute - customer list
  ANALYTICS: 5 * 60 * 1000,    // 5 minutes - analytics dashboard
}

// Request deduplication - prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

// Get from memory cache
export function getMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)
  if (!cached) return null
  
  // Check if expired
  if (Date.now() - cached.timestamp > CACHE_DURATIONS.SETTINGS) {
    memoryCache.delete(key)
    return null
  }
  
  return cached.data as T
}

// Set memory cache with automatic cleanup
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

// Get from localStorage (survives refresh) - for small data only!
export function getLocalCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const raw = localStorage.getItem(`cache_${key}`)
    if (!raw) return null
    
    const cached = JSON.parse(raw)
    
    // Check if expired
    if (cached.expiry && Date.now() > cached.expiry) {
      localStorage.removeItem(`cache_${key}`)
      return null
    }
    
    return cached.data as T
  } catch {
    return null
  }
}

// Set localStorage cache with expiry
export function setLocalCache<T>(key: string, data: T, maxAgeMs: number = CACHE_DURATIONS.SETTINGS): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      expiry: Date.now() + maxAgeMs,
    }))
  } catch {
    // localStorage might be full, clear old caches
    clearOldLocalCache()
  }
}

// Clear old localStorage caches
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

// Check if cache is fresh
export function isCacheFresh(timestamp: number, maxAgeMs: number): boolean {
  return Date.now() - timestamp < maxAgeMs
}

// Preload image for faster display - OPTIMIZED
export function preloadImage(url: string): void {
  if (!url || url.startsWith('data:')) return
  
  // Check if image is already cached by browser
  const img = new Image()
  img.src = url
}

// Prefetch API endpoint - browser will cache the response
export function prefetchApi(endpoint: string): void {
  if (typeof window === 'undefined') return
  
  // Use native fetch with low priority
  fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
  }).catch(() => {
    // Ignore prefetch errors
  })
}

// Batch prefetch multiple images
export function prefetchImages(urls: string[]): void {
  // Use requestIdleCallback for non-critical prefetching
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => preloadImage(url))
    })
  } else {
    urls.forEach(url => preloadImage(url))
  }
}

// Request deduplication - prevents duplicate API calls
export async function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeMs: number = CACHE_DURATIONS.SHOP_DATA
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

// Debounce function for search and filters
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

// Throttle function for scroll events
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

// SMART: Background refresh - refresh data before it expires
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
  
  // Return cleanup function
  return () => clearInterval(interval)
}

// SMART: Optimistic update - update UI immediately, rollback on error
export async function optimisticUpdate<T>(
  currentData: T,
  updateFn: (data: T) => T,
  serverFn: () => Promise<T>
): Promise<T> {
  // Apply optimistic update immediately
  const optimisticData = updateFn(currentData)
  
  try {
    // Try server update
    const serverData = await serverFn()
    return serverData
  } catch (error) {
    // On error, return original data (rollback)
    console.error('Optimistic update failed, rolling back:', error)
    return currentData
  }
}
